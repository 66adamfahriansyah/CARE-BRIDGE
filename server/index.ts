import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/database.js';
import { seedDatabaseIfEmpty } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { screeningRouter } from './routes/screening.js';
import { requestsRouter } from './routes/requests.js';
import { supervisionsRouter } from './routes/supervisions.js';
import { referralsRouter } from './routes/referrals.js';
import { educationRouter } from './routes/education.js';
import { assistantRouter } from './routes/assistant.js';
import { statsRouter } from './routes/stats.js';
import { demoRouter } from './routes/demo.js';

const __filename = fileURLToPath(import.meta.url);

export function createApp(options?: { dbPath?: string }) {
  const db = getDb(options?.dbPath);
  seedDatabaseIfEmpty(db);

  const app = express();
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api/auth', authRouter);
  app.use('/api', screeningRouter);
  app.use('/api/requests', requestsRouter);
  app.use('/api/supervisions', supervisionsRouter);
  app.use('/api/referrals', referralsRouter);
  app.use('/api', educationRouter);
  app.use('/api/assistant', assistantRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api', demoRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
  });

  // Serve built client assets when dist/ exists (production preview)
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (!process.env.VERCEL && isMainModule) {
  const port = Number(process.env.PORT || 4000);
  const app = createApp();
  app.listen(port, () => {
    console.log(`CARE BRIDGE Prototype Server listening on http://localhost:${port}`);
  });
}
