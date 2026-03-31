function StartTestModal({quiz, startError, onCancel, onStart})
{
  if (!quiz) return null;

  return (
    <div className="take-test-modal-backdrop">
      <div className="take-test-modal panel-card testhub-modal">
        <h2>Test Disclaimer & Permissions</h2>
        <p><strong>{quiz.title}</strong></p>
        <ul>
          <li>Fullscreen mode is mandatory during the test.</li>
          <li>Camera permission is mandatory for proctoring.</li>
          <li>Tab switch, blur, or fullscreen exit will auto-submit the test.</li>
        </ul>
        {startError? <p className="danger-text">{startError}</p>:null}
        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onStart}>Allow & Start Test</button>
        </div>
      </div>
    </div>
  );
}

export default StartTestModal;
