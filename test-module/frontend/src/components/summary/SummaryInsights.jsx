function SummaryInsights({insights})
{
  return (
    <section className="summary-insights-grid">
      <article className="insight-card">
        <p>Questions</p>
        <strong>{insights.totalQuestions}</strong>
        <span>Total attempted sections</span>
      </article>
      <article className="insight-card">
        <p>Correct / Accepted</p>
        <strong>{insights.correctOrAccepted}</strong>
        <span>High confidence solves</span>
      </article>
      <article className="insight-card">
        <p>Partial / Review</p>
        <strong>{insights.partialOrReview}</strong>
        <span>Needs optimization</span>
      </article>
      <article className="insight-card">
        <p>Unattempted</p>
        <strong>{insights.unattempted}</strong>
        <span>Potential score gain area</span>
      </article>
    </section>
  );
}

export default SummaryInsights;
