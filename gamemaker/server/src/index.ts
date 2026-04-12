import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import pool from './db/pool.js';
import { createAuthRouter } from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', createAuthRouter(pool));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { app, server };
