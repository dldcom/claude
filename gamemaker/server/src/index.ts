import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import pool from './db/pool.js';
import { createAuthRouter } from './routes/auth.js';
import { createClassesRouter } from './routes/classes.js';
import { createStudentsRouter } from './routes/students.js';
import { createRegionsRouter } from './routes/regions.js';
import { createProgressRouter } from './routes/progress.js';
import { createQuizRouter } from './routes/quiz.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', createAuthRouter(pool));
app.use('/api/classes', createClassesRouter(pool));
app.use('/api/students', createStudentsRouter(pool));
app.use('/api/regions', createRegionsRouter(pool));
app.use('/api/progress', createProgressRouter(pool));
app.use('/api/quiz', createQuizRouter(pool));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { app, server };
