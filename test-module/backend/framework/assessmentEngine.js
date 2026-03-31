import {uniqueAIFeatureCatalog} from './featureCatalog.js';

const frameworkSessions=new Map();

function scoreIntegrity(signals)
{
  const weights={
    tab_switch: 25,
    fullscreen_exit: 30,
    copy_paste_attempt: 12,
    suspicious_typing: 15,
    face_missing: 20,
  };

  const penalty=signals.reduce((sum, signal) => sum+(weights[signal.signalType]||0), 0);
  return Math.max(0, 100-penalty);
}

function scoreCoding(runStats)
{
  const passed=runStats?.passed||0;
  const total=Math.max(runStats?.total||0, 1);
  return Math.round((passed/total)*100);
}

function scoreConsistency(responses)
{
  const answeredCount=Object.values(responses||{}).filter((entry) =>
  {
    if (!entry) return false;
    if (typeof entry.answer==='string'&&entry.answer.trim().length>0) return true;
    if (typeof entry.code==='string'&&entry.code.trim().length>20) return true;
    return false;
  }).length;

  return Math.min(100, answeredCount*12);
}

export function createFrameworkSession({candidateName='Student', subject='General', quizId='unknown'}={})
{
  const sessionId=`FW-${Date.now()}`;

  const session={
    sessionId,
    candidateName,
    subject,
    quizId,
    createdAt: new Date().toISOString(),
    signals: [],
    evaluations: [],
    status: 'active',
  };

  frameworkSessions.set(sessionId, session);
  return session;
}

export function getFrameworkSession(sessionId)
{
  return frameworkSessions.get(sessionId)||null;
}

export function recordFrameworkSignal(sessionId, signalType, payload={})
{
  const session=frameworkSessions.get(sessionId);
  if (!session) return null;

  session.signals.push({
    signalType,
    payload,
    timestamp: new Date().toISOString(),
  });

  frameworkSessions.set(sessionId, session);
  return session;
}

export function evaluateFrameworkSession(sessionId, {responses={}, runStats={}}={})
{
  const session=frameworkSessions.get(sessionId);
  if (!session) return null;

  const integrityScore=scoreIntegrity(session.signals);
  const codingScore=scoreCoding(runStats);
  const consistencyScore=scoreConsistency(responses);

  const finalScore=Math.round((integrityScore*0.4)+(codingScore*0.4)+(consistencyScore*0.2));

  const report={
    evaluationId: `EVAL-${Date.now()}`,
    integrityScore,
    codingScore,
    consistencyScore,
    finalScore,
    confidenceBand: finalScore>=80? 'high':finalScore>=60? 'medium':'low',
    evaluatedAt: new Date().toISOString(),
  };

  session.evaluations.push(report);
  session.status='evaluated';
  frameworkSessions.set(sessionId, session);

  return {
    sessionId,
    candidateName: session.candidateName,
    subject: session.subject,
    quizId: session.quizId,
    signalCount: session.signals.length,
    latestEvaluation: report,
  };
}

export function getUniqueAIFeatures()
{
  return uniqueAIFeatureCatalog;
}
