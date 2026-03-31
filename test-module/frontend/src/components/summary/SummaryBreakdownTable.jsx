function SummaryBreakdownTable({breakdown})
{
  return (
    <section className="summary-breakdown-v2">
      <div className="breakdown-head">
        <h2>Section-wise Breakdown</h2>
        <p>Detailed marks distribution across MCQ and coding questions.</p>
      </div>

      <div className="breakdown-table">
        <div className="breakdown-row breakdown-row-head">
          <span>Question</span>
          <span>Type</span>
          <span>Status</span>
          <span>Score</span>
        </div>

        {breakdown.map((item) => (
          <div className="breakdown-row" key={item.questionId}>
            <span>{item.questionId}</span>
            <span className="type-pill">{item.type}</span>
            <span className={`status-pill status-${item.status}`}>{item.status.replaceAll('_', ' ')}</span>
            <span>{item.score}/{item.maxScore}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SummaryBreakdownTable;
