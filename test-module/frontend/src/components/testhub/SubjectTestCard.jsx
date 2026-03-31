function SubjectTestCard({quiz, onTakeTest})
{
  return (
    <article className="subject-card panel-card testhub-card" key={quiz.id}>
      <div className="subject-tag">{quiz.subject}</div>
      <h3>{quiz.title}</h3>
      <p>{quiz.description}</p>
      <div className="subject-meta">
        <span>{quiz.questionCount} questions</span>
        <span>{quiz.durationMinutes} mins</span>
      </div>
      <button className="btn-primary" onClick={() => onTakeTest(quiz)}>Take Test</button>
    </article>
  );
}

export default SubjectTestCard;
