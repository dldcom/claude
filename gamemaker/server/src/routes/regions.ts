import { Router } from 'express';
import { Pool } from 'pg';

export function createRegionsRouter(pool: Pool): Router {
  const router = Router();

  // GET / — list all regions
  router.get('/', async (_req, res) => {
    try {
      const result = await pool.query<{
        id: number;
        name: string;
        theme: string | null;
        sort_order: number;
      }>('SELECT id, name, theme, sort_order FROM regions ORDER BY sort_order');
      res.json(result.rows);
    } catch (err) {
      console.error('List regions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id — region detail with NPCs and questions
  router.get('/:id', async (req, res) => {
    const regionId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(regionId)) {
      res.status(400).json({ error: 'Invalid region id' });
      return;
    }

    try {
      const regionResult = await pool.query<{
        id: number;
        name: string;
        theme: string | null;
        intro_dialogue: unknown;
        ending_dialogue: unknown;
        epilogue_dialogue: unknown;
        story_synopsis: string | null;
        map_data: unknown;
        sort_order: number;
      }>('SELECT * FROM regions WHERE id = $1', [regionId]);

      if (regionResult.rowCount === 0) {
        res.status(404).json({ error: 'Region not found' });
        return;
      }

      const region = regionResult.rows[0]!;

      const npcResult = await pool.query<{
        id: number;
        region_id: number;
        name: string;
        character_desc: string | null;
        story_phase: string;
        dialogue_before: unknown;
        dialogue_correct: unknown;
        dialogue_wrong: unknown;
        dialogue_after: unknown;
        next_npc_hint: string | null;
        position_x: number;
        position_y: number;
        quiz_type: string;
        quiz_difficulty: string;
        sort_order: number;
      }>('SELECT * FROM npcs WHERE region_id = $1 ORDER BY sort_order', [regionId]);

      const npcs = npcResult.rows;
      const npcIds = npcs.map((n) => n.id);

      let questions: Array<{
        id: number;
        npc_id: number;
        content: unknown;
        correct_answer: string;
        coin_reward: number | null;
      }> = [];

      if (npcIds.length > 0) {
        const questionResult = await pool.query<{
          id: number;
          npc_id: number;
          content: unknown;
          correct_answer: string;
          coin_reward: number | null;
        }>('SELECT * FROM questions WHERE npc_id = ANY($1)', [npcIds]);
        questions = questionResult.rows;
      }

      res.json({ ...region, npcs, questions });
    } catch (err) {
      console.error('Get region error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
