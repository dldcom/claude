import { Router } from 'express';
import { Pool } from 'pg';

export function createStudentsRouter(pool: Pool): Router {
  const router = Router();

  // GET /class/:classId — list students in class (no auth, for student login)
  router.get('/class/:classId', async (req, res) => {
    const classId = parseInt(req.params['classId'] ?? '', 10);
    if (isNaN(classId)) {
      res.status(400).json({ error: 'Invalid class id' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        class_id: number;
        name: string;
        avatar_config: object;
        coins: number;
        created_at: Date;
      }>(
        'SELECT id, class_id, name, avatar_config, coins, created_at FROM students WHERE class_id = $1 ORDER BY name',
        [classId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error('List students error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id — get student details (no auth)
  router.get('/:id', async (req, res) => {
    const studentId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(studentId)) {
      res.status(400).json({ error: 'Invalid student id' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        class_id: number;
        name: string;
        avatar_config: object;
        coins: number;
        created_at: Date;
      }>(
        'SELECT id, class_id, name, avatar_config, coins, created_at FROM students WHERE id = $1',
        [studentId],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Get student error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /:id/avatar — update avatar_config (no auth)
  router.patch('/:id/avatar', async (req, res) => {
    const studentId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(studentId)) {
      res.status(400).json({ error: 'Invalid student id' });
      return;
    }

    const { avatar_config } = req.body as { avatar_config?: object };
    if (!avatar_config || typeof avatar_config !== 'object') {
      res.status(400).json({ error: 'avatar_config object is required' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        class_id: number;
        name: string;
        avatar_config: object;
        coins: number;
        created_at: Date;
      }>(
        'UPDATE students SET avatar_config = $1 WHERE id = $2 RETURNING id, class_id, name, avatar_config, coins, created_at',
        [JSON.stringify(avatar_config), studentId],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Update avatar error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
