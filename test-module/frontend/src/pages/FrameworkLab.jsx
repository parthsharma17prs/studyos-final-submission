import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  createFrameworkSession,
  evaluateFrameworkSession,
  getFrameworkFeatures,
  sendFrameworkSignal,
} from '../services/api';

function FrameworkLab()
{
  const [features, setFeatures]=useState([]);
  const [session, setSession]=useState(null);
  const [evaluation, setEvaluation]=useState(null);
  const [loading, setLoading]=useState(false);
  const [candidateName, setCandidateName]=useState('Student');
  const [subject, setSubject]=useState('Computer Science Fundamentals');

  useEffect(() =>
  {
    const load=async () =>
    {
      const response=await getFrameworkFeatures();
      setFeatures(response.data||[]);
    };

    load();
  }, []);

  const startFrameworkSession=async () =>
  {
    setLoading(true);
    try
    {
      const response=await createFrameworkSession({candidateName, subject, quizId: 'framework-demo'});
      setSession(response.data);
      setEvaluation(null);
    } finally
    {
      setLoading(false);
    }
  };

  const simulateSignalsAndEvaluate=async () =>
  {
    if (!session) return;

    setLoading(true);
    try
    {
      await sendFrameworkSignal(session.sessionId, {signalType: 'copy_paste_attempt', payload: {source: 'outside_editor'}});
      await sendFrameworkSignal(session.sessionId, {signalType: 'tab_switch', payload: {count: 1}});

      const response=await evaluateFrameworkSession(session.sessionId, {
        responses: {
          q1: {answer: 'Hash Map'},
          q2: {answer: 'O(n^2)'},
          q3: {code: 'function solve(input){ return input; }'},
        },
        runStats: {passed: 3, total: 5},
      });

      setEvaluation(response.data);
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-shell">
      <section className="panel-card framework-hero">
        <div>
          <h1>Real AI Assessment Framework</h1>
          <p>Live orchestration layer for scoring, telemetry fusion, and session integrity analytics.</p>
        </div>
        <div className="framework-links">
          <Link className="action-link" to="/tests">Back To Test Hub</Link>
        </div>
      </section>

      <section className="framework-grid">
        <article className="panel-card framework-card">
          <h2>Session Orchestrator</h2>
          <p>Create a framework session and run integrated evaluation with deterministic scoring modules.</p>
          <label>Candidate Name</label>
          <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          <button className="btn-primary" onClick={startFrameworkSession} disabled={loading}>Create Framework Session</button>

          {session? (
            <div className="framework-session-box">
              <p><strong>Session ID:</strong> {session.sessionId}</p>
              <p><strong>Status:</strong> {session.status}</p>
              <button onClick={simulateSignalsAndEvaluate} disabled={loading}>Run Demo Evaluation</button>
            </div>
          ):null}

          {evaluation? (
            <div className="framework-session-box">
              <p><strong>Final Score:</strong> {evaluation.latestEvaluation.finalScore}</p>
              <p><strong>Integrity:</strong> {evaluation.latestEvaluation.integrityScore}</p>
              <p><strong>Coding:</strong> {evaluation.latestEvaluation.codingScore}</p>
              <p><strong>Consistency:</strong> {evaluation.latestEvaluation.consistencyScore}</p>
              <p><strong>Confidence:</strong> {evaluation.latestEvaluation.confidenceBand}</p>
            </div>
          ):null}
        </article>

        <article className="panel-card framework-card">
          <h2>Unique AI Features</h2>
          <p>These are platform-native capabilities that require deep runtime instrumentation.</p>
          <div className="framework-feature-list">
            {features.map((feature) => (
              <div className="framework-feature-item" key={feature.id}>
                <h3>{feature.title}</h3>
                <p>{feature.capability}</p>
                <small><strong>Why generic chat tools cannot do this alone:</strong> {feature.whyStandaloneModelsFallShort}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default FrameworkLab;
