import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testPool, setupTestDB, cleanTestDB, teardownTestDB } from './setup.js';
import { createAuthRouter } from '../src/routes/auth.js';
import { createClassesRouter } from '../src/routes/classes.js';
import { createStudentsRouter } from '../src/routes/students.js';
import { createQuizRouter } from '../src/routes/quiz.js';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/auth', createAuthRouter(testPool));
testApp.use('/api/classes', createClassesRouter(testPool));
testApp.use('/api/students', createStudentsRouter(testPool));
testApp.use('/api/quiz', createQuizRouter(testPool));

// Helper: create a teacher, class, student, region, npc, and question
// Returns { studentId, questionId }
async function setupGameData(): Promise<{ studentId: number; questionId: number }> {
  // Register teacher
  const teacherRes = await request(testApp)
    .post('/api/auth/register')
    .send({ login_id: `teacher_quiz_${Date.now()}`, password: 'secret123' });
  const token = teacherRes.body.token as string;

  // Create class
  const classRes = await request(testApp)
    .post('/api/classes')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: '퀴즈반', school_year: '2025' });
  const classId = classRes.body.id as number;

  // Create student
  const bulkRes = await request(testApp)
    .post(`/api/classes/${classId}/students/bulk`)
    .set('Authorization', `Bearer ${token}`)
    .send({ names: ['퀴즈학생'] });
  const studentId = (bulkRes.body as Array<{ id: number }>)[0]!.id;

  // Insert region, npc, question directly via pool
  const regionResult = await testPool.query<{ id: number }>(
    `INSERT INTO regions (name, theme, sort_order) VALUES ('테스트지역', 'forest', 1) RETURNING id`,
  );
  const regionId = regionResult.rows[0]!.id;

  const npcResult = await testPool.query<{ id: number }>(
    `INSERT INTO npcs (region_id, name, story_phase, position_x, position_y, quiz_type, quiz_difficulty, sort_order)
     VALUES ($1, '테스트NPC', 'intro', 100, 100, 'multiple_choice', 'normal', 1) RETURNING id`,
    [regionId],
  );
  const npcId = npcResult.rows[0]!.id;

  const questionResult = await testPool.query<{ id: number }>(
    `INSERT INTO questions (npc_id, content, correct_answer, coin_reward)
     VALUES ($1, '{"text": "테스트 문제"}', '정답', 10) RETURNING id`,
    [npcId],
  );
  const questionId = questionResult.rows[0]!.id;

  return { studentId, questionId };
}

beforeAll(async () => {
  await setupTestDB();
});

beforeEach(async () => {
  await cleanTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/quiz/submit', () => {
  it('correct answer on first attempt gives full coins (10)', async () => {
    const { studentId, questionId } = await setupGameData();

    const res = await request(testApp)
      .post('/api/quiz/submit')
      .send({ student_id: studentId, question_id: questionId, answer: '정답' });

    expect(res.status).toBe(200);
    expect(res.body.is_correct).toBe(true);
    expect(res.body.coins_earned).toBe(10);

    // Verify coins were added to student
    const studentRes = await request(testApp).get(`/api/students/${studentId}`);
    expect(studentRes.body.coins).toBe(10);
  });

  it('wrong answer gives 0 coins', async () => {
    const { studentId, questionId } = await setupGameData();

    const res = await request(testApp)
      .post('/api/quiz/submit')
      .send({ student_id: studentId, question_id: questionId, answer: '오답' });

    expect(res.status).toBe(200);
    expect(res.body.is_correct).toBe(false);
    expect(res.body.coins_earned).toBe(0);

    // Verify no coins were added
    const studentRes = await request(testApp).get(`/api/students/${studentId}`);
    expect(studentRes.body.coins).toBe(0);
  });

  it('correct answer on second attempt gives half coins (5)', async () => {
    const { studentId, questionId } = await setupGameData();

    // First attempt: wrong
    await request(testApp)
      .post('/api/quiz/submit')
      .send({ student_id: studentId, question_id: questionId, answer: '오답' });

    // Second attempt: correct
    const res = await request(testApp)
      .post('/api/quiz/submit')
      .send({ student_id: studentId, question_id: questionId, answer: '정답' });

    expect(res.status).toBe(200);
    expect(res.body.is_correct).toBe(true);
    expect(res.body.coins_earned).toBe(5);

    const studentRes = await request(testApp).get(`/api/students/${studentId}`);
    expect(studentRes.body.coins).toBe(5);
  });

  it('correct answer on third+ attempt gives minimal coins (2)', async () => {
    const { studentId, questionId } = await setupGameData();

    // Two wrong attempts first
    await request(testApp)
      .post('/api/quiz/submit')
      .send({ student_id: studentId, question_id: questionId, answer: '오답1' });
    await request(testApp)
      .post('/api/quiz/submit')
      .send({ student_id: studentId, question_id: questionId, answer: '오답2' });

    // Third attempt: correct
    const res = await request(testApp)
      .post('/api/quiz/submit')
      .send({ student_id: studentId, question_id: questionId, answer: '정답' });

    expect(res.status).toBe(200);
    expect(res.body.is_correct).toBe(true);
    expect(res.body.coins_earned).toBe(2);

    const studentRes = await request(testApp).get(`/api/students/${studentId}`);
    expect(studentRes.body.coins).toBe(2);
  });
});
