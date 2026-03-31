import express from 'express';

const router=express.Router();
const proctoringEvents=new Map();
const activeSessions=new Map();

router.post('/event', (req, res) =>
{
  const {interviewId, eventType, severity, details}=req.body;
  if (!proctoringEvents.has(interviewId)) proctoringEvents.set(interviewId, []);
  const event={eventType, severity, details, timestamp: new Date().toISOString()};
  proctoringEvents.get(interviewId).push(event);

  if (activeSessions.has(interviewId))
  {
    const session=activeSessions.get(interviewId);
    session.lastActivity=new Date().toISOString();
    session.eventCount=(session.eventCount||0)+1;
    activeSessions.set(interviewId, session);
  }

  res.json({success: true, event});
});

router.post('/session', (req, res) =>
{
  const {interviewId, candidateName, candidateEmail, recruiterName, startTime}=req.body;
  activeSessions.set(interviewId, {
    interviewId,
    candidateName,
    candidateEmail,
    recruiterName,
    startTime: startTime||new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    status: 'active',
    eventCount: 0,
  });
  res.json({success: true});
});

router.delete('/session/:interviewId', (req, res) =>
{
  const {interviewId}=req.params;

  if (activeSessions.has(interviewId))
  {
    const session=activeSessions.get(interviewId);
    session.status='completed';
    session.endTime=new Date().toISOString();
    activeSessions.set(interviewId, session);
  }

  res.json({success: true});
});

router.get('/dashboard/sessions', (req, res) =>
{
  const sessions=Array.from(activeSessions.values())
    .filter(session => session.status==='active')
    .map((session) =>
    {
      const events=proctoringEvents.get(session.interviewId)||[];
      let score=100;
      events.forEach((event) =>
      {
        const map={low: 2, medium: 5, high: 10, critical: 20};
        score-=map[event.severity]||0;
      });

      const violations={
        low: events.filter(e => e.severity==='low').length,
        medium: events.filter(e => e.severity==='medium').length,
        high: events.filter(e => e.severity==='high').length,
        critical: events.filter(e => e.severity==='critical').length,
      };

      const duration=Math.floor((Date.now()-new Date(session.startTime).getTime())/1000/60);

      return {
        ...session,
        integrityScore: Math.max(0, score),
        violations,
        totalEvents: events.length,
        duration,
        recentEvents: events.slice(-5),
      };
    });

  res.json(sessions);
});

router.get('/dashboard/:interviewId', (req, res) =>
{
  const {interviewId}=req.params;
  const session=activeSessions.get(interviewId);

  if (!session) return res.status(404).json({error: 'Session not found'});

  const events=proctoringEvents.get(interviewId)||[];
  res.json({session, events, eventCount: events.length});
});

router.get('/:interviewId/score', (req, res) =>
{
  const events=proctoringEvents.get(req.params.interviewId)||[];
  let score=100;
  const breakdown={};

  events.forEach((event) =>
  {
    breakdown[event.eventType]=(breakdown[event.eventType]||0)+1;
    const map={low: 2, medium: 5, high: 10, critical: 20};
    score-=map[event.severity]||0;
  });

  res.json({score: Math.max(0, score), totalEvents: events.length, breakdown});
});

router.get('/:interviewId', (req, res) =>
{
  res.json(proctoringEvents.get(req.params.interviewId)||[]);
});

export default router;
