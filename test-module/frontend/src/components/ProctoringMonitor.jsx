function ProctoringMonitor({events, integrityScore})
{
  return (
    <div className="card">
      <h3>Proctoring Monitor</h3>
      <p>Integrity Score: <strong>{integrityScore}/100</strong></p>
      <div className="events">
        {events.length===0? <p>No violations detected</p>:events.slice(-8).reverse().map((e, i) => (
          <div key={i} className={`event ${e.severity||'low'}`}>
            <div>{e.type||'event'}</div>
            <small>{e.description}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProctoringMonitor;
