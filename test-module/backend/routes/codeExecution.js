import express from 'express';

const router=express.Router();

router.post('/execute', async (req, res) =>
{
  const {testCases=[]}=req.body;
  if (testCases.length===0)
  {
    return res.json({
      success: true,
      output: 'Code executed successfully!\nHello, World!\n',
      executionTime: '0.12s',
      memory: '15.2 MB',
      status: 'Accepted',
    });
  }

  const details=testCases.map((tc, i) =>
  {
    const passed=Math.random()>0.3;
    return {
      testCase: i+1,
      passed,
      expected: JSON.stringify(tc.output),
      actual: passed? JSON.stringify(tc.output):JSON.stringify('incorrect output'),
      runtime: `${(Math.random()*0.05).toFixed(3)}s`,
      hidden: !!tc.hidden,
    };
  });

  const passed=details.filter(d => d.passed).length;
  return res.json({
    success: true,
    passed,
    total: details.length,
    details: details.filter(d => !d.hidden),
    executionTime: `${(Math.random()*0.2).toFixed(2)}s`,
    memory: `${(15+Math.random()*10).toFixed(1)} MB`,
  });
});

router.post('/submit', async (req, res) =>
{
  return res.json({
    success: true,
    passed: 3,
    total: 5,
    results: [
      {testCase: 1, passed: true, expected: '[0,1]', actual: '[0,1]', runtime: '0.02s'},
      {testCase: 2, passed: true, expected: '[1,2]', actual: '[1,2]', runtime: '0.01s'},
      {testCase: 3, passed: true, expected: '[0,1]', actual: '[0,1]', runtime: '0.02s'},
      {testCase: 4, passed: false, expected: '[2,3]', actual: '[1,3]', runtime: '0.03s'},
      {testCase: 5, passed: false, expected: '[0,2]', actual: '[0,1]', runtime: '0.02s'}
    ],
    executionTime: '0.15s',
    memory: '16.5 MB',
  });
});

export default router;
