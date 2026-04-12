import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { generateToken } from '../middleware/auth.js';

export function createAuthRouter(pool: Pool): Router {
  const router = Router();

  // POST /register
  router.post('/register', async (req, res) => {
    const { login_id, password } = req.body as {
      login_id?: string;
      password?: string;
    };

    if (!login_id || !password) {
      res.status(400).json({ error: 'login_id and password are required' });
      return;
    }

    try {
      const password_hash = await bcrypt.hash(password, 10);
      const result = await pool.query<{
        id: number;
        login_id: string;
        created_at: Date;
      }>(
        'INSERT INTO teachers (login_id, password_hash) VALUES ($1, $2) RETURNING id, login_id, created_at',
        [login_id, password_hash],
      );

      const teacher = result.rows[0];
      const token = generateToken(teacher.id);
      res.status(201).json({ token, teacher });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23505'
      ) {
        res.status(409).json({ error: 'login_id already exists' });
        return;
      }
      console.error('Register error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /login
  router.post('/login', async (req, res) => {
    const { login_id, password } = req.body as {
      login_id?: string;
      password?: string;
    };

    if (!login_id || !password) {
      res.status(400).json({ error: 'login_id and password are required' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        login_id: string;
        password_hash: string;
        created_at: Date;
      }>(
        'SELECT id, login_id, password_hash, created_at FROM teachers WHERE login_id = $1',
        [login_id],
      );

      const teacher = result.rows[0];
      if (!teacher) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const match = await bcrypt.compare(password, teacher.password_hash);
      if (!match) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = generateToken(teacher.id);
      const { password_hash: _omit, ...teacherData } = teacher;
      res.json({ token, teacher: teacherData });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
