function RightNavPanel({events, integrityScore, runHistory})
{
  const aiFeatureIdeas=[
    'AI interviewer hints with difficulty-aware nudges',
    'Bug-fix copilot that explains root cause before patching',
    'Style and complexity coach (Big-O + readability)',
    'Cheat-risk scoring with confidence and replay timeline',
    'Voice-to-code explanation grading for communication skill',
    'Adaptive next-question generation based on weak areas',
  ];

  const latestEvents=events.slice(-5).reverse();

  return (
    <aside className="right-nav">
      <section className="panel-card">
        <h3>Session Insights</h3>
        <div className="insight-item">
          <span>Integrity Score</span>
          <strong>{integrityScore}/100</strong>
        </div>
        <div className="insight-item">
          <span>Total Alerts</span>
          <strong>{events.length}</strong>
        </div>
        <div className="insight-item">
          <span>Critical Alerts</span>
          <strong>{events.filter((item) => item.severity==='critical').length}</strong>
        </div>
      </section>

      <section className="panel-card">
        <h3>Recent Monitoring Events</h3>
        {latestEvents.length===0? (
          <p className="muted">No violations detected.</p>
        ): (
          <div className="event-stack">
            {latestEvents.map((event, index) => (
              <div className={`event-row ${event.severity||'low'}`} key={`${event.timestamp}-${index}`}>
                <div className="event-title">{event.type||'event'}</div>
                <div className="event-sub">{event.description}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel-card">
        <h3>Run History</h3>
        {runHistory.length===0? (
          <p className="muted">Run code or submit to view attempts.</p>
        ): (
          <ul className="history-list">
            {runHistory.slice(-6).reverse().map((run, index) => (
              <li key={`${run.kind}-${run.time}-${index}`}>
                <span>{run.kind}</span>
                <strong>{run.score}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel-card">
        <h3>AI Features To Add Next</h3>
        <ul className="ai-list">
          {aiFeatureIdeas.map((idea) => <li key={idea}>{idea}</li>)}
        </ul>
      </section>
    </aside>
  );
}

export default RightNavPanel;
