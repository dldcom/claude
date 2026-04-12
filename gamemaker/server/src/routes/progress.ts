import { Router } from 'express';
import { Pool } from 'pg';

export function createProgressRouter(pool: Pool): Router {
  const router = Router();

  // GET /student/:studentId — student's full progress
  router.get('/student/:studentId', async (req, res) => {
    const studentId = parseInt(req.params['studentId'] ?? '', 10);
    if (isNaN(studentId)) {
      res.status(400).json({ error: 'Invalid student id' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        student_id: number;
        npc_id: number;
        is_cleared: boolean;
        cleared_at: Date | null;
        region_id: number;
      }>(
        `SELECT sp.id, sp.student_id, sp.npc_id, sp.is_cleared, sp.cleared_at, n.region_id
         FROM student_progress sp
         JOIN npcs n ON n.id = sp.npc_id
         WHERE sp.student_id = $1`,
        [studentId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Get student progress error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /student/:studentId/region/:regionId — region completion check
  router.get('/student/:studentId/region/:regionId', async (req, res) => {
    const studentId = parseInt(req.params['studentId'] ?? '', 10);
    const regionId = parseInt(req.params['regionId'] ?? '', 10);
    if (isNaN(studentId) || isNaN(regionId)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }

    try {
      const result = await pool.query<{
        total_npcs: string;
        cleared_npcs: string;
      }>(
        `SELECT
           COUNT(n.id) AS total_npcs,
           COUNT(sp.id) FILTER (WHERE sp.is_cleared = TRUE) AS cleared_npcs
         FROM npcs n
         LEFT JOIN student_progress sp
           ON sp.npc_id = n.id AND sp.student_id = $1
         WHERE n.region_id = $2`,
        [studentId, regionId],
      );

      const row = result.rows[0]!;
      const totalNpcs = parseInt(row.total_npcs, 10);
      const clearedNpcs = parseInt(row.cleared_npcs, 10);
      const isComplete = totalNpcs > 0 && clearedNpcs === totalNpcs;

      res.json({ total_npcs: totalNpcs, cleared_npcs: clearedNpcs, is_complete: isComplete });
    } catch (err) {
      console.error('Get region completion error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /class/:classId — class-wide progress grid
  router.get('/class/:classId', async (req, res) => {
    const classId = parseInt(req.params['classId'] ?? '', 10);
    if (isNaN(classId)) {
      res.status(400).json({ error: 'Invalid class id' });
      return;
    }

    try {
      const result = await pool.query<{
        student_id: number;
        student_name: string;
        region_id: number;
        region_name: string;
        total_npcs: string;
        cleared_npcs: string;
      }>(
        `SELECT
           s.id AS student_id,
           s.name AS student_name,
           r.id AS region_id,
           r.name AS region_name,
           COUNT(n.id) AS total_npcs,
           COUNT(sp.id) FILTER (WHERE sp.is_cleared = TRUE) AS cleared_npcs
         FROM students s
         CROSS JOIN regions r
         LEFT JOIN npcs n ON n.region_id = r.id
         LEFT JOIN student_progress sp
           ON sp.npc_id = n.id AND sp.student_id = s.id
         WHERE s.class_id = $1
         GROUP BY s.id, s.name, r.id, r.name
         ORDER BY s.name, r.sort_order`,
        [classId],
      );

      const rows = result.rows.map((row) => ({
        student_id: row.student_id,
        student_name: row.student_name,
        region_id: row.region_id,
        region_name: row.region_name,
        total_npcs: parseInt(row.total_npcs, 10),
        cleared_npcs: parseInt(row.cleared_npcs, 10),
        is_complete:
          parseInt(row.total_npcs, 10) > 0 &&
          parseInt(row.cleared_npcs, 10) === parseInt(row.total_npcs, 10),
      }));

      res.json(rows);
    } catch (err) {
      console.error('Get class progress error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
