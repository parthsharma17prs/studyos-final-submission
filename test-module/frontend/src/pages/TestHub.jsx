import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {getQuizzes} from '../services/api';
import TestHubHeader from '../components/testhub/TestHubHeader';
import SubjectTestCard from '../components/testhub/SubjectTestCard';
import StartTestModal from '../components/testhub/StartTestModal';

function TestHub({candidateName='Student'})
{
  const navigate=useNavigate();
  const [searchParams]=useSearchParams();
  const [quizzes, setQuizzes]=useState([]);
  const [loading, setLoading]=useState(true);
  const [startError, setStartError]=useState('');
  const [selectedQuiz, setSelectedQuiz]=useState(null);

  useEffect(() =>
  {
    const loadQuizzes=async () =>
    {
      setLoading(true);
      try
      {
        const response=await getQuizzes();
        setQuizzes(response.data||[]);
        setStartError('');
      } catch (error)
      {
        setStartError(`Unable to load tests from server: ${error?.message||'unknown error'}`);
        setQuizzes([]);
      } finally
      {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const startSecureTest=async () =>
  {
    const quiz=selectedQuiz;
    if (!quiz) return;

    try
    {
      setStartError('');

      // Prompt for camera permission before the test begins.
      const stream=await navigator.mediaDevices.getUserMedia({video: true, audio: false});
      stream.getTracks().forEach((track) => track.stop());

      if (!document.fullscreenElement)
      {
        await document.documentElement.requestFullscreen();
      }
    } catch (error)
    {
      setStartError(`Camera/fullscreen permission required: ${error?.message||'permission denied'}`);
      return;
    }

    setSelectedQuiz(null);
    navigate(`/quiz/${quiz.id}/attempt?name=${encodeURIComponent(effectiveCandidateName)}`);
  };

  const subjectCount=useMemo(() => new Set(quizzes.map((item) => item.subject)).size, [quizzes]);
  const effectiveCandidateName=candidateName||searchParams.get('name')||'Student';

  return (
    <div className="quiz-shell">
      <TestHubHeader subjectCount={subjectCount} testCount={quizzes.length} />

      {loading? <p>Loading available tests...</p>:null}
      {startError? <p className="danger-text">{startError}</p>:null}

      <section className="subject-grid">
        {quizzes.map((quiz) => (
          <SubjectTestCard quiz={quiz} key={quiz.id} onTakeTest={setSelectedQuiz} />
        ))}
      </section>

      <StartTestModal
        quiz={selectedQuiz}
        startError={startError}
        onCancel={() => setSelectedQuiz(null)}
        onStart={startSecureTest}
      />
    </div>
  );
}

export default TestHub;
