import {useEffect, useRef, useState} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import ProctoringMonitor from '../components/ProctoringMonitor';
import LiveEditorHeader from '../components/LiveEditorHeader';
import ProblemPanel from '../components/ProblemPanel';
import RightNavPanel from '../components/RightNavPanel';
import socketService from '../services/socket';
import proctoringService from '../services/proctoring';
import {executeCode, submitCode} from '../services/api';

function InterviewRoom()
{
  const {interviewId}=useParams();
  const [searchParams]=useSearchParams();
  const role=searchParams.get('role')||'candidate';
  const userName=searchParams.get('name')||'Candidate';

  const [language, setLanguage]=useState('javascript');
  const starterCodeByLanguage={
    javascript: 'function solve(nums, target) {\n  // return indices of two numbers summing to target\n  return [];\n}',
    python: 'def solve(nums, target):\n    # return indices of two numbers summing to target\n    return []',
    java: 'class Solution {\n  public int[] solve(int[] nums, int target) {\n    return new int[]{};\n  }\n}',
    cpp: '#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int> nums, int target) {\n  return {};\n}',
    c: '#include <stdio.h>\n\nvoid solve(int* nums, int n, int target) {\n  // TODO\n}',
  };
  const [code, setCode]=useState(starterCodeByLanguage.javascript);
  const [testCases]=useState([
    {input: '[2,7,11,15], 9', output: [0, 1], hidden: false},
    {input: '[3,2,4], 6', output: [1, 2], hidden: false},
    {input: '[3,3], 6', output: [0, 1], hidden: true},
  ]);
  const [output, setOutput]=useState('');
  const [events, setEvents]=useState([]);
  const [integrityScore, setIntegrityScore]=useState(100);
  const [loading, setLoading]=useState(false);
  const [runHistory, setRunHistory]=useState([]);
  const videoRef=useRef(null);

  useEffect(() =>
  {
    document.title='CIDE Live Code Editor';
  }, []);

  useEffect(() =>
  {
    const socket=socketService.connect();
    socketService.joinInterview(interviewId, userName, role);

    socket.on('code-update', ({code: remoteCode, language: remoteLanguage}) =>
    {
      setCode(remoteCode);
      setLanguage(remoteLanguage);
    });

    socket.on('proctoring-alert', ({event}) =>
    {
      setEvents(prev => [...prev, event]);
    });

    return () =>
    {
      socketService.leaveInterview(interviewId);
      proctoringService.stopMonitoring();
    };
  }, [interviewId, role, userName]);

  useEffect(() =>
  {
    if (role==='candidate'&&videoRef.current)
    {
      proctoringService.startMonitoring(videoRef.current, interviewId, (violation, suspicion) =>
      {
        setEvents(prev => [...prev, violation]);
        setIntegrityScore(Math.max(0, 100-suspicion));
        socketService.sendProctoringEvent(interviewId, violation);
      }, socketService);
    }
  }, [role, interviewId]);

  const onCodeChange=(newCode) =>
  {
    setCode(newCode||'');
    socketService.sendCodeUpdate(interviewId, newCode||'', language);
  };

  const onLanguageChange=(nextLanguage) =>
  {
    setLanguage(nextLanguage);
    setCode(starterCodeByLanguage[nextLanguage]);
    socketService.sendCodeUpdate(interviewId, starterCodeByLanguage[nextLanguage], nextLanguage);
  };

  const runCode=async () =>
  {
    setLoading(true);
    try
    {
      const res=await executeCode({code, language, testCases});
      if (res.data.total)
      {
        const details=(res.data.details||[])
          .map((row) => `Case ${row.testCase}: ${row.passed? 'PASS':'FAIL'} | expected=${row.expected} | actual=${row.actual}`)
          .join('\n');
        const hiddenCount=testCases.filter(tc => tc.hidden).length;
        setOutput(`Run Result: ${res.data.passed}/${res.data.total} passed\nVisible cases shown below${hiddenCount>0? ` (${hiddenCount} hidden case(s) excluded)`:''}\n\n${details}`);
        setRunHistory((prev) => [...prev, {
          kind: 'Run',
          score: `${res.data.passed}/${res.data.total}`,
          time: new Date().toISOString(),
        }]);
      } else
      {
        setOutput(res.data.output||'Executed');
      }
    } catch (error)
    {
      setOutput('Error running code');
    } finally
    {
      setLoading(false);
    }
  };

  const submit=async () =>
  {
    setLoading(true);
    try
    {
      const res=await submitCode({code, language, questionId: 'demo-q1'});
      const details=(res.data.results||[])
        .map((row) => `Case ${row.testCase}: ${row.passed? 'PASS':'FAIL'}${row.expected? ` | expected=${row.expected}`:''}${row.actual? ` | actual=${row.actual}`:''}`)
        .join('\n');
      setOutput(`Submission Result: ${res.data.passed}/${res.data.total} passed\n\n${details}`);
      setRunHistory((prev) => [...prev, {
        kind: 'Submit',
        score: `${res.data.passed}/${res.data.total}`,
        time: new Date().toISOString(),
      }]);
    } catch (error)
    {
      setOutput('Error submitting code');
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <LiveEditorHeader
        interviewId={interviewId}
        role={role}
        userName={userName}
        integrityScore={integrityScore}
      />

      <div className="workspace-grid">
        <div className="left-column">
          <ProblemPanel
            testCases={testCases}
            language={language}
            onLanguageChange={onLanguageChange}
            starterCodeByLanguage={starterCodeByLanguage}
          />

          <section className="panel-card video-panel">
            <h3>Live Proctoring Feed</h3>
            <video ref={videoRef} autoPlay muted playsInline className="video" />
            <ProctoringMonitor events={events} integrityScore={integrityScore} />
          </section>
        </div>

        <main className="editor-column">
          <section className="panel-card editor-panel">
            <div className="editor-toolbar">
              <div className="pill">CIDE Editor</div>
              <div className="toolbar-actions">
                <button onClick={runCode} disabled={loading}>{loading? 'Running...':'Run Tests'}</button>
                <button onClick={submit} disabled={loading} className="btn-primary">Submit</button>
              </div>
            </div>

            <CodeEditor code={code} language={language} onChange={onCodeChange} />
            <pre className="output">{output||'Execution results and test feedback will appear here.'}</pre>
          </section>
        </main>

        <RightNavPanel
          events={events}
          integrityScore={integrityScore}
          runHistory={runHistory}
        />
      </div>
    </div>
  );
}

export default InterviewRoom;
