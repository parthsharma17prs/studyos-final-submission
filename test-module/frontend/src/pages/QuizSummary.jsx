import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {getQuizAttemptById} from '../services/api';
import SummaryHero from '../components/summary/SummaryHero';
import SummaryInsights from '../components/summary/SummaryInsights';
import SummaryBreakdownTable from '../components/summary/SummaryBreakdownTable';

function QuizSummary()
{
  const {attemptId, quizId}=useParams();
  const [result, setResult]=useState(null);
  const [loading, setLoading]=useState(true);

  useEffect(() =>
  {
    const loadResult=async () =>
    {
      setLoading(true);
      try
      {
        const response=await getQuizAttemptById(attemptId);
        setResult(response.data);
      } finally
      {
        setLoading(false);
      }
    };

    loadResult();
  }, [attemptId]);

  if (loading) return <div className="quiz-shell"><p>Loading summary...</p></div>;
  if (!result) return <div className="quiz-shell"><p>Result not found.</p></div>;

  const statusLabel=result.percentage>=80? 'Excellent':result.percentage>=60? 'Good':'Needs Improvement';
  const insights={
    totalQuestions: result.breakdown.length,
    correctOrAccepted: result.breakdown.filter((item) => item.status==='correct'||item.status==='accepted').length,
    partialOrReview: result.breakdown.filter((item) => item.status==='partially_correct'||item.status==='manual_review_needed').length,
    unattempted: result.breakdown.filter((item) => item.status==='not_attempted').length,
  };

  return (
    <div className="quiz-shell">
      <section className="quiz-result panel-card summary-card">
        <SummaryHero result={result} statusLabel={statusLabel} />
        <SummaryInsights insights={insights} />
        <SummaryBreakdownTable breakdown={result.breakdown} />

        <div className="summary-actions">
          <Link className="action-link action-primary" to={`/quiz/${quizId}/attempt?name=${encodeURIComponent(result.candidateName||'Student')}`}>Retake Test</Link>
          <Link className="action-link" to="/tests">Take Another Subject Test</Link>
          <Link className="action-link" to="/interview/demo-room?mode=recruiter&name=Candidate&role=candidate">Open Live Code Editor</Link>
        </div>
      </section>
    </div>
  );
}

export default QuizSummary;
