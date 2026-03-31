import express from 'express';
import {
  createFrameworkSession,
  evaluateFrameworkSession,
  getFrameworkSession,
  getUniqueAIFeatures,
  recordFrameworkSignal,
} from '../framework/assessmentEngine.js';

const router=express.Router();

router.get('/ai-features', (req, res) =>
{
  res.json(getUniqueAIFeatures());
});

router.post('/session', (req, res) =>
{
  const session=createFrameworkSession(req.body||{});
  res.json(session);
});

router.get('/session/:sessionId', (req, res) =>
{
  const session=getFrameworkSession(req.params.sessionId);
  if (!session) return res.status(404).json({error: 'Session not found'});
  res.json(session);
});

router.post('/session/:sessionId/signal', (req, res) =>
{
  const {signalType, payload={}}=req.body||{};
  if (!signalType) return res.status(400).json({error: 'signalType is required'});

  const session=recordFrameworkSignal(req.params.sessionId, signalType, payload);
  if (!session) return res.status(404).json({error: 'Session not found'});

  res.json({
    sessionId: session.sessionId,
    signalCount: session.signals.length,
    lastSignal: session.signals.at(-1),
  });
});

router.post('/session/:sessionId/evaluate', (req, res) =>
{
  const report=evaluateFrameworkSession(req.params.sessionId, req.body||{});
  if (!report) return res.status(404).json({error: 'Session not found'});

  res.json(report);
});

export default router;
