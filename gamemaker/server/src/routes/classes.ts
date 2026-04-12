import { Router } from 'express';
import { Pool } from 'pg';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

export function createClassesRouter(pool: Pool): Router {
  const router = Router();

  // POST / — create class for current teacher
  router.post('/', requireAuth, async (req: AuthRequest, res) => {
    const { name, school_year } = req.body as {
      name?: string;
      school_year?: string;
    };

    if (!name || !school_year) {
      res.status(400).json({ error: 'name and school_year are required' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        teacher_id: number;
        name: string;
        school_year: string;
      }>(
        'INSERT INTO classes (teacher_id, name, school_year) VALUES ($1, $2, $3) RETURNING id, teacher_id, name, school_year',
        [req.teacherId, name, school_year],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Create class error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET / — list teacher's classes
  router.get('/', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await pool.query<{
        id: number;
        teacher_id: number;
        name: string;
        school_year: string;
      }>(
        'SELECT id, teacher_id, name, school_year FROM classes WHERE teacher_id = $1 ORDER BY id',
        [req.teacherId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error('List classes error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /public — list ALL classes (for student login, no auth)
  router.get('/public', async (_req, res) => {
    try {
      const result = await pool.query<{
        id: number;
        teacher_id: number;
        name: string;
        school_year: string;
      }>(
        'SELECT id, teacher_id, name, school_year FROM classes ORDER BY school_year, name',
      );
      res.json(result.rows);
    } catch (err) {
      console.error('List public classes error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /:id/students/bulk — bulk create students for a class
  router.post('/:id/students/bulk', requireAuth, async (req: AuthRequest, res) => {
    const classId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(classId)) {
      res.status(400).json({ error: 'Invalid class id' });
      return;
    }

    const { names } = req.body as { names?: string[] };
    if (!names || !Array.isArray(names) || names.length === 0) {
      res.status(400).json({ error: 'names array is required and must be non-empty' });
      return;
    }

    try {
      // Verify class belongs to this teacher
      const classCheck = await pool.query<{ id: number }>(
        'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
        [classId, req.teacherId],
      );
      if (classCheck.rowCount === 0) {
        res.status(403).json({ error: 'Class not found or not owned by teacher' });
        return;
      }

      // Build parameterized bulk INSERT
      // $1 = classId, $2 = names[0], $3 = names[1], ...
      const valuePlaceholders = names
        .map((_, i) => `($1, $${i + 2})`)
        .join(', ');
      const params: (number | string)[] = [classId, ...names];

      const result = await pool.query<{
        id: number;
        class_id: number;
        name: string;
        avatar_config: object;
        coins: number;
        created_at: Date;
      }>(
        `INSERT INTO students (class_id, name) VALUES ${valuePlaceholders} RETURNING id, class_id, name, avatar_config, coins, created_at`,
        params,
      );

      res.status(201).json(result.rows);
    } catch (err) {
      console.error('Bulk create students error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
