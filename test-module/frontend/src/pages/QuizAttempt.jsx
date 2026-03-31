import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import CodingEnvironment from '../quiz-engine/CodingEnvironment';
import EyeMovementTracker from '../quiz-engine/EyeMovementTracker';
import {getQuizById, sendTelemetryFrame, submitQuizAttempt} from '../services/api';

function QuizAttempt()
{
  const {quizId}=useParams();
  const [searchParams]=useSearchParams();
  const navigate=useNavigate();
  const candidateName=searchParams.get('name')||'Student';

  const [quiz, setQuiz]=useState(null);
  const [currentIndex, setCurrentIndex]=useState(0);
  const [answers, setAnswers]=useState({});
  const [loading, setLoading]=useState(true);
  const [submitting, setSubmitting]=useState(false);
  const [compilerOutput, setCompilerOutput]=useState('Run your code to see test feedback.');
  const [attemptResult, setAttemptResult]=useState(null);
  const [timeLeftSec, setTimeLeftSec]=useState(0);
  const [securityNotice, setSecurityNotice]=useState('Fullscreen is mandatory. Keep your face close to screen. Tab switch or focus loss will auto-submit your test.');
  const [questionState, setQuestionState]=useState({});
  const [cameraReady, setCameraReady]=useState(false);
  const [cameraError, setCameraError]=useState('');
  const [faceCountdown, setFaceCountdown]=useState(null);
  const [proctorFrame, setProctorFrame]=useState(null);
  const [telemetrySessionId]=useState(() => `TEL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const submittingRef=useRef(false);
  const videoRef=useRef(null);
  const frameThrottleRef=useRef(0);
  const autoCameraRequestedRef=useRef(false);
  const proximityTimerRef=useRef(null);
  const proximityActiveRef=useRef(false);

  useEffect(() =>
  {
    const loadQuiz=async () =>
    {
      setLoading(true);
      try
      {
        const response=await getQuizById(quizId);
        const payload=response.data;
        setQuiz(payload);

        const initialAnswers={};
        payload.questions.forEach((question) =>
        {
          if (question.type==='coding')
          {
            initialAnswers[question.id]={
              language: question.language||'javascript',
              code: question.starterCode?.[question.language||'javascript']||'',
              runResult: null,
            };
          } else
          {
            initialAnswers[question.id]={answer: ''};
          }
        });

        const initialQuestionState={};
        payload.questions.forEach((question) =>
        {
          initialQuestionState[question.id]={
            visited: false,
            markedForReview: false,
          };
        });

        setAnswers(initialAnswers);
        setQuestionState(initialQuestionState);
        setTimeLeftSec((payload.durationMinutes||30)*60);
      } finally
      {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  useEffect(() =>
  {
    if (!cameraReady||!timeLeftSec||attemptResult) return undefined;

    const timer=setInterval(() =>
    {
      setTimeLeftSec((prev) =>
      {
        if (prev<=1)
        {
          clearInterval(timer);
          return 0;
        }
        return prev-1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cameraReady, timeLeftSec, attemptResult]);

  const currentQuestion=quiz?.questions?.[currentIndex];

  useEffect(() =>
  {
    if (!currentQuestion) return;

    setQuestionState((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        visited: true,
      },
    }));
  }, [currentQuestion?.id]);

  const formattedTime=useMemo(() =>
  {
    const minutes=Math.floor(timeLeftSec/60).toString().padStart(2, '0');
    const seconds=(timeLeftSec%60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [timeLeftSec]);

  const interactionsLocked=!!attemptResult||(!cameraReady&&!cameraError);

  const setMcqAnswer=(questionId, answer) =>
  {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
      },
    }));
  };

  const setCodingState=(questionId, patch) =>
  {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...patch,
      },
    }));
  };

  const isAnswered=(question) =>
  {
    const response=answers[question.id];
    if (!response) return false;

    if (question.type==='mcq')
    {
      return Boolean(response.answer);
    }

    const selectedLanguage=response.language||question.language||'javascript';
    const starter=(question.starterCode?.[selectedLanguage]||'').trim();
    const code=(response.code||'').trim();
    const changedCode=code.length>0&&code!==starter;
    const hasRun=Boolean(response.runResult&&response.runResult.total>0);
    return changedCode||hasRun;
  };

  const getQuestionStatus=(question) =>
  {
    const meta=questionState[question.id]||{visited: false, markedForReview: false};
    const answered=isAnswered(question);

    if (meta.markedForReview&&answered) return 'answered-review';
    if (meta.markedForReview) return 'review';
    if (answered) return 'answered';
    if (meta.visited) return 'unanswered';
    return 'not-visited';
  };

  const quizStats=useMemo(() =>
  {
    if (!quiz) return {answered: 0, unanswered: 0, review: 0, notVisited: 0};

    const stats={answered: 0, unanswered: 0, review: 0, notVisited: 0};
    quiz.questions.forEach((question) =>
    {
      const status=getQuestionStatus(question);
      if (status==='answered'||status==='answered-review') stats.answered++;
      else if (status==='review') stats.review++;
      else if (status==='unanswered') stats.unanswered++;
      else stats.notVisited++;
    });

    return stats;
  }, [quiz, answers, questionState]);

  const toggleMarkForReview=() =>
  {
    if (!currentQuestion||attemptResult) return;

    setQuestionState((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        markedForReview: !prev[currentQuestion.id]?.markedForReview,
        visited: true,
      },
    }));
  };

  const goToNextQuestion=() =>
  {
    setCurrentIndex((prev) => Math.min(quiz.questions.length-1, prev+1));
  };

  const markForReviewAndNext=() =>
  {
    toggleMarkForReview();
    goToNextQuestion();
  };

  const submitAttemptNow=async ({submittedBy='manual', terminationReason=''}={}) =>
  {
    if (!quiz||submittingRef.current) return;

    if (proximityTimerRef.current)
    {
      clearInterval(proximityTimerRef.current);
      proximityTimerRef.current=null;
      proximityActiveRef.current=false;
      setFaceCountdown(null);
    }

    submittingRef.current=true;
    setSubmitting(true);
    try
    {
      const response=await submitQuizAttempt(quiz.id, {
        candidateName,
        responses: answers,
        submittedBy,
        terminationReason,
        telemetrySessionId,
      });
      const result=response.data;
      setAttemptResult(result);

      if (document.fullscreenElement)
      {
        document.exitFullscreen().catch(() => {});
      }

      EyeMovementTracker.stop();

      navigate(`/quiz/${quiz.id}/summary/${result.attemptId}`, {replace: true});
    } finally
    {
      setSubmitting(false);
      submittingRef.current=false;
    }
  };

  useEffect(() =>
  {
    if (timeLeftSec===0&&quiz&&!attemptResult)
    {
      submitAttemptNow({submittedBy: 'timer', terminationReason: 'Time completed'});
    }
  }, [timeLeftSec, quiz, attemptResult]);

  useEffect(() =>
  {
    if (!quiz||attemptResult) return undefined;

    const goFullscreen=async () =>
    {
      if (!document.fullscreenElement)
      {
        try
        {
          await document.documentElement.requestFullscreen();
        } catch (_error)
        {
          setSecurityNotice('Fullscreen permission blocked. Please allow fullscreen to continue.');
        }
      }
    };

    const terminateForSecurity=(reason) =>
    {
      if (attemptResult||submittingRef.current) return;
      setSecurityNotice(reason);
      submitAttemptNow({submittedBy: 'security', terminationReason: reason});
    };

    goFullscreen();

    const onVisibilityChange=() =>
    {
      if (document.hidden)
      {
        terminateForSecurity('Tab switching detected. Test auto-submitted with current score.');
      }
    };

    const onBlur=() =>
    {
      terminateForSecurity('Window focus lost. Test auto-submitted with current score.');
    };

    const onFullscreenChange=() =>
    {
      if (!document.fullscreenElement)
      {
        terminateForSecurity('Fullscreen exited. Test auto-submitted with current score.');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () =>
    {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [quiz, attemptResult]);

  useEffect(() => () => EyeMovementTracker.stop(), []);

  useEffect(() => () =>
  {
    if (proximityTimerRef.current)
    {
      clearInterval(proximityTimerRef.current);
    }
  }, []);

  const clearFaceProximityCountdown=() =>
  {
    if (proximityTimerRef.current)
    {
      clearInterval(proximityTimerRef.current);
      proximityTimerRef.current=null;
    }

    proximityActiveRef.current=false;
    setFaceCountdown(null);
  };

  const startFaceProximityCountdown=() =>
  {
    if (proximityActiveRef.current||attemptResult||submittingRef.current) return;

    proximityActiveRef.current=true;
    setFaceCountdown(4);

    proximityTimerRef.current=setInterval(() =>
    {
      setFaceCountdown((prev) =>
      {
        if (prev===null) return prev;
        if (prev<=1)
        {
          clearFaceProximityCountdown();
          submitAttemptNow({
            submittedBy: 'security',
            terminationReason: 'Face is too far from screen for more than 4 seconds. Test auto-submitted.',
          });
          return null;
        }
        return prev-1;
      });
    }, 1000);
  };

  const startCameraMonitoring=async () =>
  {
    if (!videoRef.current||!quiz||cameraReady) return;

    try
    {
      setCameraError('');
      await EyeMovementTracker.start({
        videoElement: videoRef.current,
        onViolation: ({description, type}) =>
        {
          const reason=type==='multiple_faces'
            ? 'Multiple heads detected in camera. Test auto-submitted.'
            : `${description}. Test auto-submitted with current score.`;
          submitAttemptNow({
            submittedBy: 'security',
            terminationReason: reason,
          });
        },
        onFrame: (frame) =>
        {
          setProctorFrame(frame);

          if (frame.faceCount===1&&frame.faceClose===false)
          {
            setSecurityNotice('Move your face closer to screen. If not corrected in 4 seconds, test will auto-submit.');
            startFaceProximityCountdown();
          } else
          {
            if (proximityActiveRef.current)
            {
              clearFaceProximityCountdown();
              setSecurityNotice('Camera active. Keep eyes on screen continuously. Looking away repeatedly auto-submits the test.');
            }
          }

          frameThrottleRef.current++;
          if (frameThrottleRef.current%2!==0) return;

          sendTelemetryFrame({
            sessionId: telemetrySessionId,
            quizId,
            candidateName,
            frame,
          }).catch(() => {});
        },
        intervalMs: 800,
        multiFaceFrames: 1,
        headMovementFrames: 2,
      });

      setCameraReady(true);
      setSecurityNotice('Camera active. Keep eyes on screen continuously. Looking away repeatedly auto-submits the test.');
    } catch (error)
    {
      setCameraError(`Camera permission/model access failed: ${error?.message||'unknown error'}. Please allow camera and retry.`);
      setSecurityNotice('Camera could not start. You can continue the test, but enable camera monitoring for full proctoring.');
      setCameraReady(false);
    }
  };

  useEffect(() =>
  {
    if (!quiz||attemptResult||cameraReady||autoCameraRequestedRef.current) return;
    if (!videoRef.current)
    {
      const retry=setTimeout(() =>
      {
        autoCameraRequestedRef.current=false;
      }, 400);
      return () => clearTimeout(retry);
    }

    autoCameraRequestedRef.current=true;
    startCameraMonitoring();
  }, [quiz, attemptResult, cameraReady]);

  if (loading) return <div className="quiz-shell"><p>Loading quiz...</p></div>;
  if (!quiz||!currentQuestion) return <div className="quiz-shell"><p>Quiz not found.</p></div>;

  return (
    <div className="quiz-shell">
      <header className="quiz-header">
        <div>
          <h1>{quiz.title}</h1>
          <p>{quiz.description}</p>
          <p className="security-notice">{securityNotice}</p>
          <div className="camera-guard">
            <video ref={videoRef} className="camera-preview" muted playsInline />
            <div className="camera-controls">
              <button onClick={startCameraMonitoring} disabled={cameraReady||!!attemptResult}>
                {cameraReady? 'Camera Monitoring Active':'Enable Camera Monitoring'}
              </button>
              {proctorFrame? <p className="muted">Gaze: {proctorFrame.gazeDirection} | Head: {proctorFrame.headDirection} | Faces: {proctorFrame.faceCount}</p>:null}
              {faceCountdown!==null? <p className="face-warning">Face too far. Move closer in {faceCountdown}s or test will auto-submit.</p>:null}
              {cameraError? <p className="danger-text">{cameraError}</p>:null}
            </div>
          </div>
        </div>
        <div className={`timer ${timeLeftSec<300? 'danger':''}`}>
          Time Left: {formattedTime}
        </div>
      </header>

      {attemptResult&&(
        <section className="quiz-result panel-card">
          <h2>Attempt Submitted</h2>
          <p>Candidate: {attemptResult.candidateName}</p>
          <p>Score: {attemptResult.obtained}/{attemptResult.total} ({attemptResult.percentage}%)</p>
          <div className="result-breakdown">
            {attemptResult.breakdown.map((item) => (
              <div key={item.questionId} className="result-row">
                <span>{item.questionId} · {item.type}</span>
                <strong>{item.score}/{item.maxScore} · {item.status}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="quiz-layout nta-layout">

        <main className="quiz-main panel-card">
          <div className="question-head">
            <h2>Question {currentIndex+1}</h2>
            <span className="marks">{currentQuestion.marks} marks</span>
          </div>
          <p className="question-prompt">{currentQuestion.prompt}</p>

          {currentQuestion.type==='mcq'&&(
            <div className="mcq-options">
              {currentQuestion.options.map((option, index) => (
                <label key={option} className={`mcq-option ${answers[currentQuestion.id]?.answer===option? 'selected':''}`}>
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option}
                    checked={answers[currentQuestion.id]?.answer===option}
                    onChange={(e) => setMcqAnswer(currentQuestion.id, e.target.value)}
                    disabled={interactionsLocked}
                  />
                  <span className="mcq-badge">{String.fromCharCode(65+index)}</span>
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type==='coding'&&(
            <CodingEnvironment
              question={currentQuestion}
              answerState={answers[currentQuestion.id]||{language: 'javascript', code: '', runResult: null}}
              setCodingState={setCodingState}
              isLocked={interactionsLocked}
              compilerOutput={compilerOutput}
              setCompilerOutput={setCompilerOutput}
            />
          )}

          <div className="question-footer">
            <button onClick={() => setCurrentIndex((prev) => Math.max(0, prev-1))} disabled={currentIndex===0}>Previous</button>
            <button onClick={toggleMarkForReview} disabled={interactionsLocked}>
              {questionState[currentQuestion.id]?.markedForReview? 'Unmark Review':'Mark For Review'}
            </button>
            <button onClick={markForReviewAndNext} disabled={currentIndex===quiz.questions.length-1||interactionsLocked}>Mark & Next</button>
            <button onClick={goToNextQuestion} disabled={currentIndex===quiz.questions.length-1}>Save & Next</button>
          </div>
        </main>

        <aside className="quiz-right-panel panel-card">
          <h3>Question Palette</h3>

          <div className="status-grid">
            <div className="status-card answered">
              <strong>{quizStats.answered}</strong>
              <span>Answered</span>
            </div>
            <div className="status-card unanswered">
              <strong>{quizStats.unanswered}</strong>
              <span>Unanswered</span>
            </div>
            <div className="status-card review">
              <strong>{quizStats.review}</strong>
              <span>Review</span>
            </div>
            <div className="status-card not-visited">
              <strong>{quizStats.notVisited}</strong>
              <span>Not Visited</span>
            </div>
          </div>

          <div className="palette-grid">
            {quiz.questions.map((question, index) => {
              const status=getQuestionStatus(question);
              return (
                <button
                  key={question.id}
                  className={`palette-btn ${status} ${index===currentIndex? 'active':''}`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <span>Q{index+1}</span>
                  <small>{question.marks}m</small>
                </button>
              );
            })}
          </div>

          <button className="btn-primary" disabled={submitting||interactionsLocked} onClick={() => submitAttemptNow()}>
            {submitting? 'Submitting...':'Submit Test'}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default QuizAttempt;
