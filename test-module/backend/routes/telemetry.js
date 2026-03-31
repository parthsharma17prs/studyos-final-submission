import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const router=express.Router();

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const dataDir=process.env.TELEMETRY_DIR
  ? path.resolve(process.env.TELEMETRY_DIR)
  : (process.env.VERCEL ? '/tmp/dataframes' : path.resolve(__dirname, '../dataframes'));

async function ensureDataDir()
{
  await fs.mkdir(dataDir, {recursive: true});
}

router.post('/frame', async (req, res) =>
{
  const {sessionId, quizId, candidateName, frame}=req.body||{};

  if (!sessionId||!frame)
  {
    return res.status(400).json({error: 'sessionId and frame are required'});
  }

  try
  {
    await ensureDataDir();
    const safeSessionId=String(sessionId).replace(/[^a-zA-Z0-9-_]/g, '_');
    const filePath=path.join(dataDir, `${safeSessionId}.jsonl`);

    const payload={
      sessionId,
      quizId: quizId||'unknown',
      candidateName: candidateName||'Student',
      ...frame,
      serverTimestamp: new Date().toISOString(),
    };

    await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, 'utf8');

    return res.json({success: true});
  } catch (error)
  {
    return res.status(500).json({error: 'Failed to save telemetry frame', details: error.message});
  }
});

router.get('/session/:sessionId', async (req, res) =>
{
  try
  {
    await ensureDataDir();
    const safeSessionId=String(req.params.sessionId).replace(/[^a-zA-Z0-9-_]/g, '_');
    const filePath=path.join(dataDir, `${safeSessionId}.jsonl`);
    const content=await fs.readFile(filePath, 'utf8');
    const rows=content.split('\n').filter(Boolean).map((line) => JSON.parse(line));
    return res.json({sessionId: req.params.sessionId, count: rows.length, rows});
  } catch (error)
  {
    return res.status(404).json({error: 'Session telemetry not found'});
  }
});

export default router;
