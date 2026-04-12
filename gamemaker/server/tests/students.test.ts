import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testPool, setupTestDB, cleanTestDB, teardownTestDB } from './setup.js';
import { createAuthRouter } from '../src/routes/auth.js';
import { createClassesRouter } from '../src/routes/classes.js';
import { createStudentsRouter } from '../src/routes/students.js';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/auth', createAuthRouter(testPool));
testApp.use('/api/classes', createClassesRouter(testPool));
testApp.use('/api/students', createStudentsRouter(testPool));

// Helper: register a teacher and return a token
async function getTeacherToken(loginId: string): Promise<string> {
  const res = await request(testApp)
    .post('/api/auth/register')
    .send({ login_id: loginId, password: 'secret123' });
  return res.body.token as string;
}

// Helper: create class + bulk students, return { classId, studentIds }
async function createClassWithStudents(
  token: string,
  className: string,
  names: string[],
): Promise<{ classId: number; students: Array<{ id: number; name: string }> }> {
  const classRes = await request(testApp)
    .post('/api/classes')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: className, school_year: '2025' });
  const classId = classRes.body.id as number;

  const bulkRes = await request(testApp)
    .post(`/api/classes/${classId}/students/bulk`)
    .set('Authorization', `Bearer ${token}`)
    .send({ names });

  return { classId, students: bulkRes.body as Array<{ id: number; name: string }> };
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

describe('GET /api/students/class/:classId', () => {
  it('lists students in a class without auth', async () => {
    const token = await getTeacherToken('teacher_stu_list');
    const { classId } = await createClassWithStudents(token, '1반', ['홍길동', '이순신']);

    const res = await request(testApp).get(`/api/students/class/${classId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    const names = res.body.map((s: { name: string }) => s.name);
    expect(names).toContain('홍길동');
    expect(names).toContain('이순신');
  });

  it('returns empty array for class with no students', async () => {
    const token = await getTeacherToken('teacher_stu_empty');
    const classRes = await request(testApp)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '빈 반', school_year: '2025' });
    const classId = classRes.body.id as number;

    const res = await request(testApp).get(`/api/students/class/${classId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/students/:id', () => {
  it('returns student details without auth', async () => {
    const token = await getTeacherToken('teacher_stu_get');
    const { students } = await createClassWithStudents(token, '2반', ['강감찬']);
    const studentId = students[0]!.id;

    const res = await request(testApp).get(`/api/students/${studentId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: studentId, name: '강감찬' });
    expect(res.body).toHaveProperty('avatar_config');
    expect(res.body).toHaveProperty('coins');
    expect(res.body).toHaveProperty('class_id');
  });

  it('returns 404 for non-existent student', async () => {
    const res = await request(testApp).get('/api/students/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/students/:id/avatar', () => {
  it('updates avatar_config and returns the updated student', async () => {
    const token = await getTeacherToken('teacher_stu_avatar');
    const { students } = await createClassWithStudents(token, '3반', ['세종대왕']);
    const studentId = students[0]!.id;

    const avatarConfig = { hair: 'long', color: 'brown', outfit: 'scholar' };
    const res = await request(testApp)
      .patch(`/api/students/${studentId}/avatar`)
      .send({ avatar_config: avatarConfig });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: studentId, name: '세종대왕' });
    expect(res.body.avatar_config).toMatchObject(avatarConfig);
  });

  it('returns 404 for non-existent student', async () => {
    const res = await request(testApp)
      .patch('/api/students/999999/avatar')
      .send({ avatar_config: { hair: 'short' } });

    expect(res.status).toBe(404);
  });

  it('returns 400 when avatar_config is missing', async () => {
    const token = await getTeacherToken('teacher_stu_avatar2');
    const { students } = await createClassWithStudents(token, '4반', ['유관순']);
    const studentId = students[0]!.id;

    const res = await request(testApp)
      .patch(`/api/students/${studentId}/avatar`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
