function LiveEditorHeader({interviewId, role, userName, integrityScore})
{
  const safetyLabel=integrityScore>=80? 'Stable':integrityScore>=60? 'Watch':'Risk';

  return (
    <header className="live-header">
      <div className="brand">
        <div className="brand-mark">CIDE</div>
        <div>
          <h1>Live Code Editor</h1>
          <p>Real-time coding, proctoring, and AI-ready interview workspace</p>
        </div>
      </div>

      <div className="header-meta">
        <div className="meta-chip">
          <span className="meta-label">Room</span>
          <strong>{interviewId}</strong>
        </div>
        <div className="meta-chip">
          <span className="meta-label">Role</span>
          <strong>{role}</strong>
        </div>
        <div className="meta-chip">
          <span className="meta-label">User</span>
          <strong>{userName}</strong>
        </div>
        <div className={`meta-chip integrity ${integrityScore<60? 'danger':integrityScore<80? 'warn':'ok'}`}>
          <span className="meta-label">Integrity</span>
          <strong>{integrityScore}/100 · {safetyLabel}</strong>
        </div>
      </div>
    </header>
  );
}

export default LiveEditorHeader;
