import CodeEditor from '../components/CodeEditor';
import {runQuizCompiler} from './compilerService';

function CodingEnvironment({question, answerState, setCodingState, isLocked, compilerOutput, setCompilerOutput})
{
  const runCompiler=async () =>
  {
    const result=await runQuizCompiler({
      code: answerState.code,
      language: answerState.language,
      testCases: question.testCases||[],
    });

    const details=(result.details||[])
      .map((item) => `Case ${item.testCase}: ${item.passed? 'PASS':'FAIL'} | expected=${item.expected} | actual=${item.actual}`)
      .join('\n');

    setCompilerOutput(`Run Result: ${result.passed}/${result.total} passed\n${details||result.output||''}`);

    setCodingState(question.id, {
      runResult: {
        passed: result.passed||0,
        total: result.total||0,
      },
    });
  };

  return (
    <div className="coding-question">
      <div className="coding-controls">
        <select
          value={answerState.language||'javascript'}
          onChange={(e) => setCodingState(question.id, {language: e.target.value, code: question.starterCode?.[e.target.value]||'', runResult: null})}
          disabled={isLocked}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>
        <button onClick={runCompiler} disabled={isLocked}>Run Compiler</button>
      </div>

      <CodeEditor
        code={answerState.code||''}
        language={answerState.language||'javascript'}
        onChange={(value) => setCodingState(question.id, {code: value||''})}
      />

      <pre className="output">{compilerOutput}</pre>
    </div>
  );
}

export default CodingEnvironment;
