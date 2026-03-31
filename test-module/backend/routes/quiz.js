import express from 'express';

const router=express.Router();

const starterCode={
  javascript: 'function solve(input) {\n  // write your logic\n  return input;\n}',
  python: 'def solve(input):\n    # write your logic\n    return input',
  java: 'class Solution {\n  public Object solve(Object input) {\n    return input;\n  }\n}',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nauto solve(auto input) {\n  return input;\n}',
  c: '#include <stdio.h>\n\nvoid solve() {\n  // TODO\n}',
};

function makeQuiz(id, subject, title, description, durationMinutes, blocks)
{
  const questions=[];

  blocks.forEach((block, index) =>
  {
    questions.push({
      id: `${index+1}-mcq`,
      type: 'mcq',
      marks: 5,
      prompt: block.mcq.prompt,
      options: block.mcq.options,
      answer: block.mcq.answer,
    });

    questions.push({
      id: `${index+1}-code`,
      type: 'coding',
      marks: 10,
      language: 'javascript',
      prompt: block.coding.prompt,
      starterCode,
      testCases: block.coding.testCases,
    });
  });

  return {id, subject, title, description, durationMinutes, questions};
}

const quizzes=[
  makeQuiz(
    'quiz-cs',
    'Computer Science Fundamentals',
    'CS Core Aptitude Test',
    'Core CS concepts with immediate coding checks after each MCQ.',
    45,
    [
      {
        mcq: {
          prompt: 'Which data structure provides O(1) average lookup by key?',
          options: ['Array', 'Linked List', 'Hash Map', 'Stack'],
          answer: 'Hash Map',
        },
        coding: {
          prompt: 'Implement solve(input) for running sum of integer array.',
          testCases: [
            {input: '[1,2,3]', output: [1, 3, 6], hidden: false},
            {input: '[1,1,1]', output: [1, 2, 3], hidden: false},
            {input: '[3,1,2,10,1]', output: [3, 4, 6, 16, 17], hidden: true},
          ],
        },
      },
      {
        mcq: {
          prompt: 'Which sorting algorithm is stable by default?',
          options: ['Quick Sort', 'Heap Sort', 'Merge Sort', 'Selection Sort'],
          answer: 'Merge Sort',
        },
        coding: {
          prompt: 'Implement solve(input) for two-sum index pair.',
          testCases: [
            {input: '[2,7,11,15],9', output: [0, 1], hidden: false},
            {input: '[3,2,4],6', output: [1, 2], hidden: false},
            {input: '[3,3],6', output: [0, 1], hidden: true},
          ],
        },
      },
    ]
  ),
  makeQuiz(
    'quiz-dsa',
    'Data Structures And Algorithms',
    'DSA Pattern Evaluation',
    'Arrays, pointers, and algorithmic patterns with coding rounds.',
    45,
    [
      {
        mcq: {
          prompt: 'What traversal uses a queue in trees/graphs?',
          options: ['DFS', 'BFS', 'Inorder', 'Postorder'],
          answer: 'BFS',
        },
        coding: {
          prompt: 'Implement solve(input) to check palindrome string.',
          testCases: [
            {input: '"racecar"', output: true, hidden: false},
            {input: '"hello"', output: false, hidden: false},
            {input: '"A man, a plan, a canal: Panama"', output: true, hidden: true},
          ],
        },
      },
      {
        mcq: {
          prompt: 'Average complexity of binary search is?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          answer: 'O(log n)',
        },
        coding: {
          prompt: 'Implement solve(input) for maximum subarray sum.',
          testCases: [
            {input: '[-2,1,-3,4,-1,2,1,-5,4]', output: 6, hidden: false},
            {input: '[1]', output: 1, hidden: false},
            {input: '[5,4,-1,7,8]', output: 23, hidden: true},
          ],
        },
      },
    ]
  ),
  makeQuiz(
    'quiz-dbms',
    'Database Management Systems',
    'DBMS Interview Test',
    'Normalization, indexing, and query reasoning with coding checks.',
    40,
    [
      {
        mcq: {
          prompt: 'Which SQL clause filters grouped rows?',
          options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
          answer: 'HAVING',
        },
        coding: {
          prompt: 'Implement solve(input) to remove duplicate values while preserving order.',
          testCases: [
            {input: '[1,2,2,3,1]', output: [1, 2, 3], hidden: false},
            {input: '[4,4,4]', output: [4], hidden: false},
            {input: '[]', output: [], hidden: true},
          ],
        },
      },
      {
        mcq: {
          prompt: 'A primary key can contain NULL values.',
          options: ['True', 'False'],
          answer: 'False',
        },
        coding: {
          prompt: 'Implement solve(input) to return frequency map of values.',
          testCases: [
            {input: '[1,1,2,3,3,3]', output: '{"1":2,"2":1,"3":3}', hidden: false},
            {input: '[5]', output: '{"5":1}', hidden: false},
            {input: '[]', output: '{}', hidden: true},
          ],
        },
      },
    ]
  ),
  makeQuiz(
    'quiz-os',
    'Operating Systems',
    'OS Concepts Test',
    'Process, scheduling, synchronization, and coding application tasks.',
    40,
    [
      {
        mcq: {
          prompt: 'Which scheduling algorithm may cause starvation?',
          options: ['FCFS', 'Round Robin', 'Priority Scheduling', 'SJF with aging'],
          answer: 'Priority Scheduling',
        },
        coding: {
          prompt: 'Implement solve(input) to return first non-repeating character index.',
          testCases: [
            {input: '"leetcode"', output: 0, hidden: false},
            {input: '"aabb"', output: -1, hidden: false},
            {input: '"loveleetcode"', output: 2, hidden: true},
          ],
        },
      },
      {
        mcq: {
          prompt: 'Which memory is fastest?',
          options: ['RAM', 'Cache', 'SSD', 'HDD'],
          answer: 'Cache',
        },
        coding: {
          prompt: 'Implement solve(input) to validate balanced parentheses.',
          testCases: [
            {input: '"()[]{}"', output: true, hidden: false},
            {input: '"(]"', output: false, hidden: false},
            {input: '"([{}])"', output: true, hidden: true},
          ],
        },
      },
    ]
  ),
  makeQuiz(
    'quiz-cn',
    'Computer Networks',
    'Networking Fundamentals Test',
    'Network layers, protocols, and coding checkpoints.',
    40,
    [
      {
        mcq: {
          prompt: 'Which layer handles routing in OSI model?',
          options: ['Transport', 'Network', 'Session', 'Data Link'],
          answer: 'Network',
        },
        coding: {
          prompt: 'Implement solve(input) to group anagrams.',
          testCases: [
            {input: '["eat","tea","tan","ate","nat","bat"]', output: 'groups', hidden: false},
            {input: '["a"]', output: 'groups', hidden: false},
            {input: '["",""]', output: 'groups', hidden: true},
          ],
        },
      },
      {
        mcq: {
          prompt: 'TCP is connection-oriented while UDP is connectionless.',
          options: ['True', 'False'],
          answer: 'True',
        },
        coding: {
          prompt: 'Implement solve(input) to find longest common prefix.',
          testCases: [
            {input: '["flower","flow","flight"]', output: '"fl"', hidden: false},
            {input: '["dog","racecar","car"]', output: '""', hidden: false},
            {input: '["interview","internet","internal"]', output: '"inte"', hidden: true},
          ],
        },
      },
    ]
  ),
];

const attempts=new Map();

const toPublicQuiz=(quiz) => ({
  ...quiz,
  questions: quiz.questions.map((question) =>
  {
    if (question.type==='mcq')
    {
      const {answer, ...safeQuestion}=question;
      return safeQuestion;
    }

    if (question.type==='coding')
    {
      return {
        ...question,
        testCases: question.testCases.map((testCase) =>
        {
          if (testCase.hidden)
          {
            return {
              hidden: true,
              input: 'hidden',
              output: 'hidden',
            };
          }

          return testCase;
        }),
      };
    }

    return question;
  }),
});

router.get('/', (req, res) =>
{
  res.json(quizzes.map((quiz) => ({
    id: quiz.id,
    subject: quiz.subject,
    title: quiz.title,
    description: quiz.description,
    durationMinutes: quiz.durationMinutes,
    questionCount: quiz.questions.length,
  })));
});

router.get('/:quizId', (req, res) =>
{
  const quiz=quizzes.find((item) => item.id===req.params.quizId);
  if (!quiz) return res.status(404).json({error: 'Quiz not found'});

  res.json(toPublicQuiz(quiz));
});

router.post('/:quizId/attempt', (req, res) =>
{
  const quiz=quizzes.find((item) => item.id===req.params.quizId);
  if (!quiz) return res.status(404).json({error: 'Quiz not found'});

  const {candidateName='Student', responses={}, submittedBy='manual', terminationReason=''}=req.body;
  let obtained=0;
  let total=0;

  const breakdown=quiz.questions.map((question) =>
  {
    total+=question.marks;
    const response=responses[question.id];

    if (question.type==='mcq')
    {
      const isCorrect=response?.answer===question.answer;
      const score=isCorrect? question.marks:0;
      obtained+=score;

      return {
        questionId: question.id,
        type: question.type,
        score,
        maxScore: question.marks,
        status: isCorrect? 'correct':'incorrect',
      };
    }

    const runResult=response?.runResult;
    const code=response?.code||'';
    const submittedLanguage=response?.language||question.language||'javascript';
    const starterForLanguage=question.starterCode?.[submittedLanguage]||'';
    const normalizedCode=code.trim();
    const normalizedStarter=starterForLanguage.trim();
    const hasMeaningfulCodeChange=normalizedCode.length>0&&normalizedCode!==normalizedStarter;
    let score=0;
    let status='not_attempted';

    if (runResult&&typeof runResult.passed==='number'&&typeof runResult.total==='number'&&runResult.total>0)
    {
      score=Math.round((runResult.passed/runResult.total)*question.marks);
      status=runResult.passed===runResult.total? 'accepted':'partially_correct';
    } else if (hasMeaningfulCodeChange)
    {
      score=Math.floor(question.marks*0.3);
      status='manual_review_needed';
    }

    obtained+=score;
    return {
      questionId: question.id,
      type: question.type,
      score,
      maxScore: question.marks,
      status,
    };
  });

  const attemptId=`ATT-${Date.now()}`;
  const result={
    attemptId,
    quizId: quiz.id,
    candidateName,
    submittedBy,
    terminationReason,
    obtained,
    total,
    percentage: Number(((obtained/Math.max(total, 1))*100).toFixed(2)),
    submittedAt: new Date().toISOString(),
    breakdown,
  };

  attempts.set(attemptId, result);
  res.json(result);
});

router.get('/attempt/:attemptId', (req, res) =>
{
  const result=attempts.get(req.params.attemptId);
  if (!result) return res.status(404).json({error: 'Attempt not found'});
  res.json(result);
});

export default router;
