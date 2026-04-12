import { Router } from 'express';
import { Pool } from 'pg';
import { broadcastToClass } from '../websocket/dashboard.js';

export function createQuizRouter(pool: Pool): Router {
  const router = Router();

  // POST /submit — submit a quiz answer
  router.post('/submit', async (req, res) => {
    const { student_id, question_id, answer } = req.body as {
      student_id?: number;
      question_id?: number;
      answer?: string;
    };

    if (student_id == null || question_id == null || answer == null) {
      res.status(400).json({ error: 'student_id, question_id, and answer are required' });
      return;
    }

    try {
      // 1. Get question
      const questionResult = await pool.query<{
        correct_answer: string;
        coin_reward: number | null;
        npc_id: number;
      }>('SELECT correct_answer, coin_reward, npc_id FROM questions WHERE id = $1', [question_id]);

      if (questionResult.rowCount === 0) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      const question = questionResult.rows[0]!;
      const isCorrect = answer.trim() === question.correct_answer.trim();
      const baseReward = question.coin_reward ?? 10;

      // 2. Check previous correct attempts BEFORE inserting current attempt
      const prevCorrectResult = await pool.query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM quiz_attempts WHERE student_id = $1 AND question_id = $2 AND is_correct = TRUE',
        [student_id, question_id],
      );
      const prevCorrectCount = parseInt(prevCorrectResult.rows[0]!.count, 10);
      const alreadyCorrect = prevCorrectCount > 0;

      // 3. Count total previous attempts (for reduced coin logic)
      const prevAttemptsResult = await pool.query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM quiz_attempts WHERE student_id = $1 AND question_id = $2',
        [student_id, question_id],
      );
      const attemptCount = parseInt(prevAttemptsResult.rows[0]!.count, 10);

      // 4. INSERT quiz attempt
      await pool.query(
        'INSERT INTO quiz_attempts (student_id, question_id, answer, is_correct) VALUES ($1, $2, $3, $4)',
        [student_id, question_id, answer, isCorrect],
      );

      // 5. Calculate coins earned
      let coinsEarned = 0;

      if (isCorrect && !alreadyCorrect) {
        // First time getting this question right
        if (attemptCount === 0) {
          coinsEarned = baseReward; // full reward on first attempt
        } else if (attemptCount === 1) {
          coinsEarned = Math.floor(baseReward / 2); // half on second attempt
        } else {
          coinsEarned = Math.floor(baseReward / 5); // minimal on third+ attempt
        }

        // UPDATE student coins
        await pool.query('UPDATE students SET coins = coins + $1 WHERE id = $2', [
          coinsEarned,
          student_id,
        ]);

        // UPSERT student_progress
        await pool.query(
          `INSERT INTO student_progress (student_id, npc_id, is_cleared, cleared_at)
           VALUES ($1, $2, TRUE, NOW())
           ON CONFLICT (student_id, npc_id) DO UPDATE SET is_cleared = TRUE, cleared_at = NOW()`,
          [student_id, question.npc_id],
        );
      }

      // 6. Broadcast to teacher dashboard
      try {
        const studentResult = await pool.query<{ class_id: number; name: string }>(
          'SELECT class_id, name FROM students WHERE id = $1',
          [student_id],
        );
        if (studentResult.rowCount && studentResult.rowCount > 0) {
          const student = studentResult.rows[0]!;
          broadcastToClass(student.class_id, {
            type: isCorrect ? 'quiz_correct' : 'quiz_wrong',
            student_id,
            student_name: student.name,
            question_id,
            npc_id: question.npc_id,
            coins_earned: coinsEarned,
          });
        }
      } catch (broadcastErr) {
        console.error('Broadcast error:', broadcastErr);
      }

      res.json({ is_correct: isCorrect, coins_earned: coinsEarned });
    } catch (err) {
      console.error('Quiz submit error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
