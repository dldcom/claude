import { Router } from 'express';
import { Pool } from 'pg';

export function createShopRouter(pool: Pool): Router {
  const router = Router();

  // GET /items — list all items ORDER BY category, price
  router.get('/items', async (_req, res) => {
    try {
      const result = await pool.query<{
        id: number;
        name: string;
        category: string;
        lpc_sprite_path: string;
        price: number;
      }>('SELECT id, name, category, lpc_sprite_path, price FROM items ORDER BY category, price');
      res.json(result.rows);
    } catch (err) {
      console.error('List items error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /buy — purchase an item
  router.post('/buy', async (req, res) => {
    const { student_id, item_id } = req.body as { student_id?: number; item_id?: number };

    if (student_id == null || item_id == null) {
      res.status(400).json({ error: 'student_id and item_id are required' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock student row and get coins
      const studentResult = await client.query<{ coins: number }>(
        'SELECT coins FROM students WHERE id = $1 FOR UPDATE',
        [student_id],
      );

      if (studentResult.rowCount === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const coins = studentResult.rows[0]!.coins;

      // 2. Get item price
      const itemResult = await client.query<{ price: number }>(
        'SELECT price FROM items WHERE id = $1',
        [item_id],
      );

      if (itemResult.rowCount === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      const price = itemResult.rows[0]!.price;

      // 3. Check sufficient coins
      if (coins < price) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Not enough coins' });
        return;
      }

      // 4. Check not already owned
      const ownedResult = await client.query<{ id: number }>(
        'SELECT id FROM student_items WHERE student_id = $1 AND item_id = $2',
        [student_id, item_id],
      );

      if ((ownedResult.rowCount ?? 0) > 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Already owned' });
        return;
      }

      // 5. Deduct coins
      await client.query('UPDATE students SET coins = coins - $1 WHERE id = $2', [price, student_id]);

      // 6. Insert student_items
      await client.query(
        'INSERT INTO student_items (student_id, item_id) VALUES ($1, $2)',
        [student_id, item_id],
      );

      await client.query('COMMIT');

      const remaining_coins = coins - price;
      res.json({ remaining_coins });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Buy item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });

  // PATCH /equip — toggle equipped status
  router.patch('/equip', async (req, res) => {
    const { student_id, item_id, is_equipped } = req.body as {
      student_id?: number;
      item_id?: number;
      is_equipped?: boolean;
    };

    if (student_id == null || item_id == null || is_equipped == null) {
      res.status(400).json({ error: 'student_id, item_id, and is_equipped are required' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        student_id: number;
        item_id: number;
        is_equipped: boolean;
        purchased_at: Date;
      }>(
        `UPDATE student_items
         SET is_equipped = $1
         WHERE student_id = $2 AND item_id = $3
         RETURNING id, student_id, item_id, is_equipped, purchased_at`,
        [is_equipped, student_id, item_id],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'Item not found in inventory' });
        return;
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Equip item error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /inventory/:studentId — list owned items with details
  router.get('/inventory/:studentId', async (req, res) => {
    const studentId = parseInt(req.params['studentId'] ?? '', 10);
    if (isNaN(studentId)) {
      res.status(400).json({ error: 'Invalid student id' });
      return;
    }

    try {
      const result = await pool.query<{
        id: number;
        student_id: number;
        item_id: number;
        is_equipped: boolean;
        purchased_at: Date;
        name: string;
        category: string;
        lpc_sprite_path: string;
        price: number;
      }>(
        `SELECT
           si.id,
           si.student_id,
           si.item_id,
           si.is_equipped,
           si.purchased_at,
           i.name,
           i.category,
           i.lpc_sprite_path,
           i.price
         FROM student_items si
         JOIN items i ON i.id = si.item_id
         WHERE si.student_id = $1
         ORDER BY i.category, i.name`,
        [studentId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Get inventory error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
