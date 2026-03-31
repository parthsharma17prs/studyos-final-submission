function SummaryHero({result, statusLabel})
{
  return (
    <section className="summary-hero-v2">
      <div className="hero-main">
        <p className="hero-kicker">Assessment Report</p>
        <h1>Candidate Score Sheet</h1>
        <div className="hero-meta-grid">
          <div className="hero-meta-item">
            <span>Candidate</span>
            <strong>{result.candidateName}</strong>
          </div>
          <div className="hero-meta-item">
            <span>Attempt ID</span>
            <strong>{result.attemptId}</strong>
          </div>
          <div className="hero-meta-item">
            <span>Submission Type</span>
            <strong>{result.submittedBy}</strong>
          </div>
          <div className="hero-meta-item">
            <span>Status</span>
            <strong>{statusLabel}</strong>
          </div>
        </div>
        {result.terminationReason? <p className="danger-text">Security Trigger: {result.terminationReason}</p>:null}
      </div>

      <div className="score-panel">
        <div className="score-ring" style={{'--score': `${Math.max(0, Math.min(100, result.percentage))}%`}}>
          <div className="score-ring-inner">
            <strong>{result.percentage}%</strong>
            <span>Overall</span>
          </div>
        </div>
        <p>{result.obtained}/{result.total} Total Marks</p>
      </div>
    </section>
  );
}

export default SummaryHero;
