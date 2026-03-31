import {FaceLandmarker, FilesetResolver} from '@mediapipe/tasks-vision';

class EyeMovementTracker
{
  constructor()
  {
    this.videoElement=null;
    this.stream=null;
    this.intervalId=null;
    this.modelsReady=false;
    this.faceLandmarker=null;
    this.offScreenCounter=0;
    this.noFaceCounter=0;
    this.multiFaceCounter=0;
    this.headMovementCounter=0;
    this.lastFrameTime=-1;
  }

  async ensureModels()
  {
    if (this.modelsReady) return;

    const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    this.faceLandmarker=await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      },
      runningMode: 'VIDEO',
      numFaces: 2,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });

    this.modelsReady=true;
  }

  async requestCamera(videoElement)
  {
    this.videoElement=videoElement;
    this.stream=await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: {ideal: 640},
        height: {ideal: 480},
      },
      audio: false,
    });

    this.videoElement.srcObject=this.stream;
    await this.videoElement.play();
  }

  getPoint(landmarks, index)
  {
    return landmarks[index]||{x: 0, y: 0, z: 0};
  }

  getAverage(landmarks, indices)
  {
    const sum=indices.reduce((acc, idx) =>
    {
      const point=this.getPoint(landmarks, idx);
      return {x: acc.x+point.x, y: acc.y+point.y};
    }, {x: 0, y: 0});

    return {x: sum.x/indices.length, y: sum.y/indices.length};
  }

  analyzeFace(landmarks)
  {
    const leftCorner=this.getPoint(landmarks, 33);
    const rightCorner=this.getPoint(landmarks, 263);
    const noseTip=this.getPoint(landmarks, 1);
    const forehead=this.getPoint(landmarks, 10);
    const chin=this.getPoint(landmarks, 152);

    const leftIris=this.getAverage(landmarks, [468, 469, 470, 471, 472]);
    const rightIris=this.getAverage(landmarks, [473, 474, 475, 476, 477]);

    const leftLidTop=this.getPoint(landmarks, 159);
    const leftLidBottom=this.getPoint(landmarks, 145);
    const rightLidTop=this.getPoint(landmarks, 386);
    const rightLidBottom=this.getPoint(landmarks, 374);

    const eyeMidX=(leftCorner.x+rightCorner.x)/2;
    const eyeWidth=Math.max(0.0001, Math.abs(rightCorner.x-leftCorner.x));
    const faceHeight=Math.max(0.0001, Math.abs(chin.y-forehead.y));
    const faceAreaRatio=eyeWidth*faceHeight;
    const leftEyeRatio=(leftIris.x-leftCorner.x)/Math.max(0.0001, Math.abs(this.getPoint(landmarks, 133).x-leftCorner.x));
    const rightEyeRatio=(rightIris.x-this.getPoint(landmarks, 362).x)/Math.max(0.0001, Math.abs(rightCorner.x-this.getPoint(landmarks, 362).x));

    const irisY=(leftIris.y+rightIris.y)/2;
    const lidTopY=(leftLidTop.y+rightLidTop.y)/2;
    const lidBottomY=(leftLidBottom.y+rightLidBottom.y)/2;
    const lidHeight=Math.max(0.0001, lidBottomY-lidTopY);

    const headTurn=(noseTip.x-eyeMidX)/eyeWidth;
    const headPitch=((noseTip.y-forehead.y)/faceHeight)-0.45;
    const headRoll=(rightCorner.y-leftCorner.y)/Math.max(0.0001, eyeWidth);
    const irisShift=((leftEyeRatio-0.5)+(rightEyeRatio-0.5))/2;
    const verticalShift=(irisY-lidTopY)/lidHeight;

    let direction='center';
    if ((headTurn>0.13&&irisShift>0.03)||(headTurn>0.2)) direction='right';
    else if ((headTurn<-0.13&&irisShift<-0.03)||(headTurn<-0.2)) direction='left';
    else if (verticalShift<0.25) direction='up';

    const onScreen=direction==='center';
    const faceClose=faceAreaRatio>=0.085;

    let headDirection='center';
    if (headTurn>0.14) headDirection='right';
    else if (headTurn<-0.14) headDirection='left';
    else if (headPitch<-0.11) headDirection='up';
    else if (headPitch>0.16) headDirection='down';

    return {
      horizontalRatio: Number((headTurn+irisShift).toFixed(3)),
      verticalRatio: Number(verticalShift.toFixed(3)),
      headYaw: Number(headTurn.toFixed(3)),
      headPitch: Number(headPitch.toFixed(3)),
      headRoll: Number(headRoll.toFixed(3)),
      headDirection,
      faceAreaRatio: Number(faceAreaRatio.toFixed(4)),
      faceClose,
      direction,
      onScreen,
    };
  }

  async start({videoElement, onFrame, onViolation, intervalMs=800, multiFaceFrames=1, headMovementFrames=2})
  {
    await this.ensureModels();
    await this.requestCamera(videoElement);

    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId=setInterval(async () =>
    {
      if (!this.videoElement||this.videoElement.readyState<2) return;

      try
      {
        const now=performance.now();
        if (this.lastFrameTime===this.videoElement.currentTime) return;
        this.lastFrameTime=this.videoElement.currentTime;

        const detections=this.faceLandmarker.detectForVideo(this.videoElement, now);
        const faces=detections?.faceLandmarks||[];

        let frame={
          timestamp: new Date().toISOString(),
          faceCount: faces.length,
          gazeDirection: 'unknown',
          headDirection: 'unknown',
          horizontalRatio: 0,
          verticalRatio: 0,
          headYaw: 0,
          headPitch: 0,
          headRoll: 0,
          faceAreaRatio: 0,
          faceClose: false,
          onScreen: false,
          offScreenCounter: this.offScreenCounter,
          noFaceCounter: this.noFaceCounter,
          multiFaceCounter: this.multiFaceCounter,
          headMovementCounter: this.headMovementCounter,
        };

        if (faces.length===1)
        {
          this.noFaceCounter=0;
          this.multiFaceCounter=0;
          const analysis=this.analyzeFace(faces[0]);

          if (!analysis.onScreen&&(analysis.direction==='left'||analysis.direction==='right'||analysis.direction==='up'))
          {
            this.offScreenCounter++;
          } else
          {
            this.offScreenCounter=0;
          }

          frame={
            ...frame,
            gazeDirection: analysis.direction,
            headDirection: analysis.headDirection,
            horizontalRatio: analysis.horizontalRatio,
            verticalRatio: analysis.verticalRatio,
            headYaw: analysis.headYaw,
            headPitch: analysis.headPitch,
            headRoll: analysis.headRoll,
            faceAreaRatio: analysis.faceAreaRatio,
            faceClose: analysis.faceClose,
            onScreen: analysis.onScreen,
            offScreenCounter: this.offScreenCounter,
            noFaceCounter: this.noFaceCounter,
            multiFaceCounter: this.multiFaceCounter,
          };

          if (analysis.headDirection==='left'||analysis.headDirection==='right'||analysis.headDirection==='up')
          {
            this.headMovementCounter++;
          } else
          {
            this.headMovementCounter=0;
          }

          frame.headMovementCounter=this.headMovementCounter;

          if (this.offScreenCounter>=2)
          {
            onViolation?.({
              type: 'off_screen_gaze',
              severity: 'critical',
              description: `Eyes moved off-screen (${analysis.direction}) repeatedly`,
            });
            this.offScreenCounter=0;
          }

          if (this.headMovementCounter>=headMovementFrames)
          {
            onViolation?.({
              type: 'head_movement',
              severity: 'critical',
              description: `Head moved off-center (${analysis.headDirection}) repeatedly`,
            });
            this.headMovementCounter=0;
          }
        } else if (faces.length===0)
        {
          this.headMovementCounter=0;
          this.multiFaceCounter=0;
          this.noFaceCounter++;
          this.offScreenCounter++;
          frame.offScreenCounter=this.offScreenCounter;
          frame.noFaceCounter=this.noFaceCounter;

          if (this.noFaceCounter>=3)
          {
            onViolation?.({
              type: 'no_face',
              severity: 'critical',
              description: 'Face not visible for repeated frames',
            });
            this.noFaceCounter=0;
            this.offScreenCounter=0;
          }
        } else if (faces.length>1)
        {
          this.noFaceCounter=0;
          this.offScreenCounter=0;
          this.headMovementCounter=0;
          this.multiFaceCounter++;
          frame.multiFaceCounter=this.multiFaceCounter;

          if (this.multiFaceCounter>=multiFaceFrames)
          {
            onViolation?.({
              type: 'multiple_faces',
              severity: 'critical',
              description: 'Multiple faces detected in camera frame',
            });
            this.multiFaceCounter=0;
          }
        }
        onFrame?.(frame);
      } catch (_error)
      {
        // Ignore transient frame-level errors.
      }
    }, intervalMs);
  }

  stop()
  {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId=null;

    if (this.stream)
    {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    if (this.videoElement)
    {
      this.videoElement.srcObject=null;
    }

    this.videoElement=null;
    this.stream=null;
    this.offScreenCounter=0;
    this.noFaceCounter=0;
    this.multiFaceCounter=0;
    this.headMovementCounter=0;
    this.lastFrameTime=-1;
  }
}

export default new EyeMovementTracker();