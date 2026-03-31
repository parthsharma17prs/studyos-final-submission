import Editor from '@monaco-editor/react';

function CodeEditor({code, language, onChange})
{
  const languageMap={javascript: 'javascript', python: 'python', java: 'java', cpp: 'cpp', c: 'c'};

  return (
    <div style={{height: '420px'}}>
      <Editor
        height="100%"
        language={languageMap[language]||'javascript'}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: {enabled: false},
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}

export default CodeEditor;
