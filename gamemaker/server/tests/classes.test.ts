import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testPool, setupTestDB, cleanTestDB, teardownTestDB } from './setup.js';
import { createAuthRouter } from '../src/routes/auth.js';
import { createClassesRouter } from '../src/routes/classes.js';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/auth', createAuthRouter(testPool));
testApp.use('/api/classes', createClassesRouter(testPool));

// Helper: register a teacher and return a Bearer token
async function getTeacherToken(loginId: string, password = 'secret123'): Promise<string> {
  const res = await request(testApp)
    .post('/api/auth/register')
    .send({ login_id: loginId, password });
  return res.body.token as string;
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

describe('POST /api/classes', () => {
  it('creates a class and returns 201', async () => {
    const token = await getTeacherToken('teacher_cls1');

    const res = await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '3학년 1반', school_year: '2025' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: '3학년 1반', school_year: '2025' });
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('teacher_id');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(testApp)
      .post('/api/classes')
      .send({ name: '1반', school_year: '2025' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when name or school_year is missing', async () => {
    const token = await getTeacherToken('teacher_cls2');

    const res = await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '1반' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/classes', () => {
  it("lists only the authenticated teacher's classes", async () => {
    const tokenA = await getTeacherToken('teacher_list_a');
    const tokenB = await getTeacherToken('teacher_list_b');

    await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A반', school_year: '2025' });

    await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'B반', school_year: '2025' });

    const res = await request(testApp)
      .get('/api/classes')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: 'A반' });
  });

  it('returns 401 without auth token', async () => {
    const res = await request(testApp).get('/api/classes');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/classes/public', () => {
  it('lists all classes without auth', async () => {
    const tokenA = await getTeacherToken('teacher_pub_a');
    const tokenB = await getTeacherToken('teacher_pub_b');

    await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Public A', school_year: '2025' });

    await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Public B', school_year: '2025' });

    const res = await request(testApp).get('/api/classes/public');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('POST /api/classes/:id/students/bulk', () => {
  it('creates multiple students and returns 201', async () => {
    const token = await getTeacherToken('teacher_bulk1');

    const classRes = await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '빙고반', school_year: '2025' });
    const classId = classRes.body.id as number;

    const res = await request(testApp)
      .post(`/api/classes/${classId}/students/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({ names: ['김철수', '이영희', '박민준'] });

    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ class_id: classId });
    const studentNames = res.body.map((s: { name: string }) => s.name);
    expect(studentNames).toContain('김철수');
    expect(studentNames).toContain('이영희');
    expect(studentNames).toContain('박민준');
  });

  it('returns 403 if class belongs to another teacher', async () => {
    const tokenA = await getTeacherToken('teacher_bulk2a');
    const tokenB = await getTeacherToken('teacher_bulk2b');

    const classRes = await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A반', school_year: '2025' });
    const classId = classRes.body.id as number;

    const res = await request(testApp)
      .post(`/api/classes/${classId}/students/bulk`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ names: ['김철수'] });

    expect(res.status).toBe(403);
  });

  it('returns 400 when names array is empty', async () => {
    const token = await getTeacherToken('teacher_bulk3');

    const classRes = await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '테스트반', school_year: '2025' });
    const classId = classRes.body.id as number;

    const res = await request(testApp)
      .post(`/api/classes/${classId}/students/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({ names: [] });

    expect(res.status).toBe(400);
  });
});
