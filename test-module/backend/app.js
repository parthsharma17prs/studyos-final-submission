import express from 'express';
import cors from 'cors';
import codeExecutionRoutes from './routes/codeExecution.js';
import proctoringRoutes from './routes/proctoring.js';
import quizRoutes from './routes/quiz.js';
import frameworkRoutes from './routes/framework.js';
import telemetryRoutes from './routes/telemetry.js';

const frontendOrigins=(process.env.FRONTEND_URL||'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins=new Set(frontendOrigins);

const corsOptions={
  origin: (origin, callback) =>
  {
    if (!origin)
    {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin))
    {
      callback(null, true);
      return;
    }

    if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
    {
      callback(null, true);
      return;
    }

    if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin))
    {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

export function createApp()
{
  const app=express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({status: 'ok'}));
  app.use('/api/code-execution', codeExecutionRoutes);
  app.use('/api/proctoring', proctoringRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/framework', frameworkRoutes);
  app.use('/api/telemetry', telemetryRoutes);

  return app;
}

export {frontendOrigins};
