function ProblemPanel({testCases, language, onLanguageChange, starterCodeByLanguage})
{
  const visibleCases=testCases.filter((item) => !item.hidden);

  return (
    <section className="problem-panel panel-card">
      <div className="panel-head">
        <h2>Two Sum</h2>
        <span className="difficulty easy">Easy</span>
      </div>

      <p className="problem-copy">
        Return indices of two numbers such that they add up to target. You may assume each input has exactly one solution.
      </p>

      <div className="lang-select-wrap">
        <label htmlFor="language">Language</label>
        <select id="language" value={language} onChange={(e) => onLanguageChange(e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>
      </div>

      <div className="case-list">
        <h3>Visible Test Cases</h3>
        {visibleCases.map((testCase, index) => (
          <div className="case-item" key={`${testCase.input}-${index}`}>
            <div><strong>Input:</strong> {testCase.input}</div>
            <div><strong>Output:</strong> {JSON.stringify(testCase.output)}</div>
          </div>
        ))}
        <div className="hidden-case-note">
          Hidden cases: {testCases.filter((item) => item.hidden).length}
        </div>
      </div>

      <details className="starter-preview">
        <summary>Starter Code Preview</summary>
        <pre>{starterCodeByLanguage[language]}</pre>
      </details>
    </section>
  );
}

export default ProblemPanel;
