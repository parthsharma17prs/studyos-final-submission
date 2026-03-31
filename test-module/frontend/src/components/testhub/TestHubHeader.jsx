function TestHubHeader({subjectCount, testCount})
{
  return (
    <header className="quiz-hub-header panel-card testhub-header">
      <div>
        <h1>All Subject Tests</h1>
        <p>Choose a subject and start a secure proctored assessment.</p>
        <p className="security-notice">Tab switch, blur, or fullscreen exit will auto-submit with current score.</p>
      </div>
      <div className="hub-meta-info testhub-meta">
        <div className="hub-stats">Subjects: {subjectCount}</div>
        <div className="hub-stats">Tests: {testCount}</div>
      </div>
    </header>
  );
}

export default TestHubHeader;
