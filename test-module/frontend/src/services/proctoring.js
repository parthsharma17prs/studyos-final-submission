import * as faceapi from 'face-api.js';
import {sendProctoringEvent} from './api';

class ProctoringService
{
  constructor()
  {
    this.isInitialized=false;
    this.isMonitoring=false;
    this.isTerminated=false;
    this.faceDetectionDisabled=false;

    this.videoElement=null;
    this.interviewId=null;
    this.onViolation=null;
    this.socketService=null;

    this.suspicionScore=0;
    this.violations=[];
    this.tabSwitchCount=0;
    this.copyPasteAttempts=0;
    this.fullscreenExitCount=0;
    this.noFaceDetectedCount=0;
    this.multipleFacesCount=0;
    this.lookingAwayCount=0;
    this.eyesClosedCount=0;

    this.typingPatterns=[];
    this.lastKeystroke=null;
    this.largeTextPasteCount=0;
    this.aiPatternDetections=0;

    this.cleanupFunctions=[];
  }

  async initialize()
  {
    if (this.isInitialized) return true;

    try
    {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
      ]);
    } catch (_error)
    {
      this.faceDetectionDisabled=true;
    }

    this.isInitialized=true;
    return true;
  }

  async startMonitoring(videoElement, interviewId, onViolation, socketService=null)
  {
    await this.initialize();

    this.isMonitoring=true;
    this.isTerminated=false;
    this.videoElement=videoElement;
    this.interviewId=interviewId;
    this.onViolation=onViolation;
    this.socketService=socketService;

    this.suspicionScore=0;
    this.violations=[];
    this.tabSwitchCount=0;
    this.copyPasteAttempts=0;
    this.fullscreenExitCount=0;
    this.noFaceDetectedCount=0;
    this.multipleFacesCount=0;
    this.lookingAwayCount=0;
    this.eyesClosedCount=0;
    this.typingPatterns=[];
    this.lastKeystroke=null;
    this.largeTextPasteCount=0;
    this.aiPatternDetections=0;

    this.setupTabVisibilityMonitoring();
    this.enforceFullscreen();
    this.setupCopyPasteBlocking();
    this.setupScreenMonitoring();
    this.setupAIDetection();

    if (!this.faceDetectionDisabled)
    {
      this.startFaceDetection();
    }
  }

  startFaceDetection()
  {
    if (this.faceDetectionInterval) clearInterval(this.faceDetectionInterval);

    this.faceDetectionInterval=setInterval(async () =>
    {
      if (!this.isMonitoring||!this.videoElement) return;
      if (this.videoElement.readyState<2||this.videoElement.paused) return;

      try
      {
        const detections=await faceapi
          .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions({inputSize: 224, scoreThreshold: 0.5}))
          .withFaceLandmarks();

        if (detections.length===0)
        {
          this.noFaceDetectedCount++;
          if (this.noFaceDetectedCount>3)
          {
            this.reportViolation('no_face', 'critical', 'No face detected in camera');
            this.noFaceDetectedCount=0;
          }
          return;
        }

        if (detections.length>1)
        {
          this.multipleFacesCount++;
          if (this.multipleFacesCount>1)
          {
            this.reportViolation('multiple_faces', 'critical', `${detections.length} faces detected in frame`);
            this.multipleFacesCount=0;
          }
          return;
        }

        this.noFaceDetectedCount=0;
        this.multipleFacesCount=0;

        const landmarks=detections[0].landmarks;
        const leftEye=landmarks.getLeftEye();
        const rightEye=landmarks.getRightEye();
        const nose=landmarks.getNose();
        const jawline=landmarks.getJawOutline();

        const leftEAR=this.calculateEyeAspectRatio(leftEye);
        const rightEAR=this.calculateEyeAspectRatio(rightEye);
        const avgEAR=(leftEAR+rightEAR)/2;

        if (avgEAR<0.2)
        {
          this.eyesClosedCount++;
          if (this.eyesClosedCount>2)
          {
            this.reportViolation('eyes_closed', 'medium', 'Eyes closed for extended period');
            this.eyesClosedCount=0;
          }
        } else
        {
          this.eyesClosedCount=0;
        }

        const gaze=this.analyzeGazeDirection(leftEye, rightEye, nose, jawline);
        if (gaze.isLookingAway)
        {
          this.lookingAwayCount++;
          if (this.lookingAwayCount>2)
          {
            this.reportViolation('looking_away', 'medium', `Looking ${gaze.direction} - attention diverted`);
            this.lookingAwayCount=0;
          }
        } else
        {
          this.lookingAwayCount=0;
        }
      } catch (_error) {}
    }, 2000);
  }

  calculateEyeAspectRatio(eyeLandmarks)
  {
    const vertical1=this.euclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
    const vertical2=this.euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);
    const horizontal=this.euclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);
    return (vertical1+vertical2)/(2*horizontal);
  }

  euclideanDistance(point1, point2)
  {
    return Math.sqrt(Math.pow(point2.x-point1.x, 2)+Math.pow(point2.y-point1.y, 2));
  }

  getCenter(landmarks)
  {
    let sumX=0;
    let sumY=0;

    landmarks.forEach((point) =>
    {
      sumX+=point.x;
      sumY+=point.y;
    });

    return {
      x: sumX/landmarks.length,
      y: sumY/landmarks.length,
    };
  }

  analyzeGazeDirection(leftEye, rightEye, nose, jawline)
  {
    const leftEyeCenter=this.getCenter(leftEye);
    const rightEyeCenter=this.getCenter(rightEye);
    const eyeCenter={
      x: (leftEyeCenter.x+rightEyeCenter.x)/2,
      y: (leftEyeCenter.y+rightEyeCenter.y)/2,
    };

    const noseTip=nose[3];
    const leftFace=jawline[0];
    const rightFace=jawline[16];
    const faceWidth=rightFace.x-leftFace.x;
    const eyesWidth=rightEyeCenter.x-leftEyeCenter.x;

    const noseXOffset=noseTip.x-eyeCenter.x;
    const horizontalRatio=Math.abs(noseXOffset)/eyesWidth;

    const noseYOffset=noseTip.y-eyeCenter.y;
    const verticalRatio=Math.abs(noseYOffset)/faceWidth;

    if (horizontalRatio>0.25)
    {
      return {
        isLookingAway: true,
        direction: noseXOffset>0? 'right':'left',
      };
    }

    if (verticalRatio>0.15)
    {
      return {
        isLookingAway: true,
        direction: noseYOffset<0? 'up':'down',
      };
    }

    return {
      isLookingAway: false,
      direction: 'center',
    };
  }

  setupTabVisibilityMonitoring()
  {
    const onHidden=() =>
    {
      if (document.hidden&&this.isMonitoring)
      {
        this.tabSwitchCount++;
        this.reportViolation('tab_switch', 'high', `Tab switched (${this.tabSwitchCount} times)`);
      }
    };

    const onBlur=() =>
    {
      if (this.isMonitoring)
      {
        this.reportViolation('window_blur', 'high', 'Window lost focus');
      }
    };

    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('blur', onBlur);
    this.cleanupFunctions.push(() => document.removeEventListener('visibilitychange', onHidden));
    this.cleanupFunctions.push(() => window.removeEventListener('blur', onBlur));
  }

  enforceFullscreen()
  {
    const enter=async () =>
    {
      if (!document.fullscreenElement)
      {
        try { await document.documentElement.requestFullscreen(); } catch (_) {}
      }
    };

    enter();

    const onChange=() =>
    {
      if (!document.fullscreenElement&&this.isMonitoring)
      {
        this.fullscreenExitCount++;
        this.reportViolation('fullscreen_exit', 'critical', `Fullscreen exited (${this.fullscreenExitCount} times)`);
        setTimeout(enter, 1000);
      }
    };

    document.addEventListener('fullscreenchange', onChange);
    this.cleanupFunctions.push(() => document.removeEventListener('fullscreenchange', onChange));
  }

  setupCopyPasteBlocking()
  {
    const handler=(e) =>
    {
      const target=e.target;
      if (this.isMonitoring&&!target.closest('.monaco-editor')&&!target.closest('[data-allow-copy]'))
      {
        e.preventDefault();
        this.copyPasteAttempts++;
        this.reportViolation('copy_paste_attempt', 'medium', `Copy/paste blocked (${this.copyPasteAttempts} times)`);
      }
    };

    const blockRightClick=(e) =>
    {
      const target=e.target;
      if (this.isMonitoring&&!target.closest('.monaco-editor'))
      {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handler);
    document.addEventListener('cut', handler);
    document.addEventListener('paste', handler);
    document.addEventListener('contextmenu', blockRightClick);
    this.cleanupFunctions.push(() => document.removeEventListener('copy', handler));
    this.cleanupFunctions.push(() => document.removeEventListener('cut', handler));
    this.cleanupFunctions.push(() => document.removeEventListener('paste', handler));
    this.cleanupFunctions.push(() => document.removeEventListener('contextmenu', blockRightClick));
  }

  setupScreenMonitoring()
  {
    if (!window.screen) return;

    const initialWidth=window.screen.width;
    const initialHeight=window.screen.height;

    const checkScreenChange=() =>
    {
      if (!this.isMonitoring) return;
      if (window.screen.width!==initialWidth||window.screen.height!==initialHeight)
      {
        this.reportViolation('screen_change', 'high', 'Screen configuration changed');
      }
    };

    const intervalId=setInterval(checkScreenChange, 5000);
    this.cleanupFunctions.push(() => clearInterval(intervalId));
  }

  setupAIDetection()
  {
    const monitorTyping=(e) =>
    {
      if (!this.isMonitoring) return;
      const target=e.target;
      if (!target.closest('.monaco-editor')&&!target.closest('[contenteditable]')) return;

      const now=Date.now();
      if (this.lastKeystroke)
      {
        const interval=now-this.lastKeystroke;
        this.typingPatterns.push(interval);
        if (this.typingPatterns.length>50) this.typingPatterns.shift();
      }
      this.lastKeystroke=now;
    };

    const handlePaste=(e) =>
    {
      if (!this.isMonitoring) return;

      const target=e.target;
      if (!target.closest('.monaco-editor')&&!target.closest('[contenteditable]')) return;

      const data=e.clipboardData||window.clipboardData;
      const pastedText=data?.getData('text');
      if (!pastedText||pastedText.length<=100) return;

      this.largeTextPasteCount++;
      const aiScore=this.analyzeForAIPatterns(pastedText);

      if (aiScore>0.6)
      {
        this.reportViolation('ai_generated_code', 'critical', `Suspected AI-generated code pasted (confidence: ${(aiScore*100).toFixed(0)}%)`);
      } else if (pastedText.length>200)
      {
        this.reportViolation('large_paste', 'high', `Large code block pasted (${pastedText.length} characters)`);
      }
    };

    const typingInterval=setInterval(() =>
    {
      if (!this.isMonitoring||this.typingPatterns.length<20) return;

      const avg=this.typingPatterns.reduce((a, b) => a+b, 0)/this.typingPatterns.length;
      const variance=this.calculateVariance(this.typingPatterns);
      if (variance<100&&avg<50)
      {
        this.aiPatternDetections++;
        if (this.aiPatternDetections>2)
        {
          this.reportViolation('suspicious_typing', 'medium', 'Unusual typing patterns detected');
          this.aiPatternDetections=0;
        }
      }
    }, 30000);

    document.addEventListener('keydown', monitorTyping);
    document.addEventListener('paste', handlePaste);
    this.cleanupFunctions.push(() => document.removeEventListener('keydown', monitorTyping));
    this.cleanupFunctions.push(() => document.removeEventListener('paste', handlePaste));
    this.cleanupFunctions.push(() => clearInterval(typingInterval));
  }

  analyzeForAIPatterns(text)
  {
    let aiScore=0;
    const indicators=[
      {pattern: /\/\/.*(?:here's|here is|implementation|solution)/i, weight: 0.2},
      {pattern: /\/\*\*.*@param.*@return.*\*\//s, weight: 0.15},
      {pattern: /(?:certainly|sure|here's how|let me|i'll|you can)/i, weight: 0.25},
      {pattern: /\/\/.*(?:note that|important|remember|keep in mind)/i, weight: 0.15},
      {pattern: /\/\/.*(?:step \d|first|second|third|finally)/i, weight: 0.2},
      {pattern: /function\s+(?:helper|utility|process|handle|manage|perform)[A-Z]\w+/g, weight: 0.15},
      {pattern: /```\w+\n[\s\S]*```/, weight: 0.3},
    ];

    indicators.forEach(({pattern, weight}) =>
    {
      if (pattern.test(text)) aiScore+=weight;
    });

    if (aiScore>0.4) aiScore+=0.2;
    return Math.min(aiScore, 1);
  }

  calculateVariance(arr)
  {
    const mean=arr.reduce((a, b) => a+b, 0)/arr.length;
    const squared=arr.map((v) => Math.pow(v-mean, 2));
    return squared.reduce((a, b) => a+b, 0)/arr.length;
  }

  async reportViolation(type, severity, description)
  {
    if (this.isTerminated) return;

    const violation={type, severity, description, timestamp: new Date().toISOString()};
    this.violations.push(violation);

    const scoreImpact={low: 5, medium: 10, high: 20, critical: 30};
    this.suspicionScore=Math.min(100, this.suspicionScore+(scoreImpact[severity]||5));

    if (this.onViolation) this.onViolation(violation, this.suspicionScore);

    try { await sendProctoringEvent(this.interviewId, violation); } catch (_) {}
    if (this.socketService)
    {
      try { this.socketService.sendProctoringEvent(this.interviewId, violation); } catch (_) {}
    }

    if (this.suspicionScore>=100&&type!=='auto_terminate'&&!this.isTerminated)
    {
      this.isTerminated=true;
      const terminateViolation={
        type: 'auto_terminate',
        severity: 'critical',
        description: 'Maximum violation threshold reached - Interview terminated',
        timestamp: new Date().toISOString(),
      };
      this.violations.push(terminateViolation);
      if (this.onViolation) this.onViolation(terminateViolation, this.suspicionScore);
      if (this.socketService)
      {
        try { this.socketService.sendProctoringEvent(this.interviewId, terminateViolation); } catch (_) {}
      }
      this.stopMonitoring();
      alert('Interview terminated due to repeated violations.');
    }
  }

  stopMonitoring()
  {
    this.isMonitoring=false;
    this.videoElement=null;
    if (this.faceDetectionInterval) clearInterval(this.faceDetectionInterval);
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions=[];
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
}

export default new ProctoringService();
