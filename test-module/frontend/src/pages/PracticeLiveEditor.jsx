import {useState} from 'react';
import CodeEditor from '../components/CodeEditor';
import {executeCode} from '../services/api';

function PracticeLiveEditor()
{
  const [language, setLanguage]=useState('javascript');
  const [code, setCode]=useState('// Start coding here!\nconsole.log("Hello, World!");');
  const [output, setOutput]=useState('');
  const [loading, setLoading]=useState(false);
  const [error, setError]=useState('');

  const handleExecute=async () =>
  {
    setLoading(true);
    setError('');
    setOutput('');

    try
    {
      const response=await executeCode({
        code,
        language,
        testCases: [],
      });

      if (response.data.success)
      {
        setOutput(response.data.output||'(no output)');
      } else
      {
        setError(response.data.error||'Execution failed');
      }
    } catch (err)
    {
      setError(`Error: ${err?.response?.data?.error||err?.message||'Unknown error'}`);
    } finally
    {
      setLoading(false);
    }
  };

  const languageTemplates={
    javascript: '// JavaScript\nconsole.log("Hello, World!");',
    python: '# Python\nprint("Hello, World!")',
    java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}',
    cpp: '#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}',
    c: '#include <stdio.h>\nint main() {\n  printf("Hello, World!\\n");\n  return 0;\n}',
  };

  const handleLanguageChange=(newLang) =>
  {
    setLanguage(newLang);
    setCode(languageTemplates[newLang]||'');
  };

  return (
    <div className="practice-editor-shell">
      <div className="practice-container">
        <div className="editor-section">
          <div className="editor-header">
            <h2>Live Code Editor</h2>
            <select 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-select"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>
          <CodeEditor 
            code={code}
            language={language}
            onChange={setCode}
          />
          <button 
            className="btn-execute"
            onClick={handleExecute}
            disabled={loading}
          >
            {loading?'Executing...':'Execute Code'}
          </button>
        </div>

        <div className="output-section">
          <div className="output-header">
            <h3>Output</h3>
          </div>
          <div className="output-box">
            {loading && <p className="status-running">Executing...</p>}
            {error && <p className="status-error">{error}</p>}
            {output && !loading && !error && (
              <pre className="output-text">{output}</pre>
            )}
            {!output && !loading && !error && (
              <p className="status-empty">Output will appear here after execution</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticeLiveEditor;
