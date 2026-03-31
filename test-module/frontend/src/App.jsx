import {Routes, Route, Navigate} from 'react-router-dom';
import {useMemo} from 'react';
import TopNav from './components/TopNav';
import InterviewRoom from './pages/InterviewRoom';
import QuizAttempt from './pages/QuizAttempt';
import QuizSummary from './pages/QuizSummary';
import TestHub from './pages/TestHub';
import PracticeLiveEditor from './pages/PracticeLiveEditor';

function App()
{
  const candidateName=useMemo(() => localStorage.getItem('candidateName')||'Student', []);

  return (
    <>
      <TopNav candidateName={candidateName} />
      <Routes>
        <Route path="/tests" element={<TestHub candidateName={candidateName} />} />
        <Route path="/practice" element={<PracticeLiveEditor />} />
        <Route path="/interview/:interviewId" element={<InterviewRoom />} />
        <Route path="/quiz/:quizId/attempt" element={<QuizAttempt />} />
        <Route path="/quiz/:quizId/summary/:attemptId" element={<QuizSummary />} />
        <Route path="*" element={<Navigate to="/tests" replace />} />
      </Routes>
    </>
  );
}

export default App;
