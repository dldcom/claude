import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { testPool, setupTestDB, cleanTestDB, teardownTestDB } from './setup.js';
import { createAuthRouter } from '../src/routes/auth.js';
import express from 'express';

// Create a test-specific app wired to the test pool
const testApp = express();
testApp.use(express.json());
testApp.use('/api/auth', createAuthRouter(testPool));

beforeAll(async () => {
  await setupTestDB();
});

beforeEach(async () => {
  await cleanTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe('POST /api/auth/register', () => {
  it('creates a teacher and returns a token', async () => {
    const res = await request(testApp)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.teacher).toMatchObject({ login_id: 'teacher1' });
    expect(res.body.teacher).not.toHaveProperty('password_hash');
  });

  it('rejects duplicate login_id with 409', async () => {
    await request(testApp)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'secret123' });

    const res = await request(testApp)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'other123' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/login', () => {
  it('returns token with correct password', async () => {
    await request(testApp)
      .post('/api/auth/register')
      .send({ login_id: 'teacher2', password: 'mypassword' });

    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ login_id: 'teacher2', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.teacher).toMatchObject({ login_id: 'teacher2' });
  });

  it('returns 401 with wrong password', async () => {
    await request(testApp)
      .post('/api/auth/register')
      .send({ login_id: 'teacher3', password: 'correct' });

    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ login_id: 'teacher3', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
