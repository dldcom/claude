import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { testPool, setupTestDB, cleanTestDB, teardownTestDB } from './setup.js';
import { createAuthRouter } from '../src/routes/auth.js';
import { createClassesRouter } from '../src/routes/classes.js';
import { createStudentsRouter } from '../src/routes/students.js';
import { createShopRouter } from '../src/routes/shop.js';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/auth', createAuthRouter(testPool));
testApp.use('/api/classes', createClassesRouter(testPool));
testApp.use('/api/students', createStudentsRouter(testPool));
testApp.use('/api/shop', createShopRouter(testPool));

interface SetupResult {
  studentId: number;
  cheapItemId: number;
  expensiveItemId: number;
}

async function setupShopData(): Promise<SetupResult> {
  // Register teacher
  const teacherRes = await request(testApp)
    .post('/api/auth/register')
    .send({ login_id: `teacher_shop_${Date.now()}`, password: 'secret123' });
  const token = teacherRes.body.token as string;

  // Create class
  const classRes = await request(testApp)
    .post('/api/classes')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: '상점반', school_year: '2025' });
  const classId = classRes.body.id as number;

  // Create student
  const bulkRes = await request(testApp)
    .post(`/api/classes/${classId}/students/bulk`)
    .set('Authorization', `Bearer ${token}`)
    .send({ names: ['상점학생'] });
  const studentId = (bulkRes.body as Array<{ id: number }>)[0]!.id;

  // Set student coins to 50
  await testPool.query('UPDATE students SET coins = 50 WHERE id = $1', [studentId]);

  // Insert 2 items (30 coins and 80 coins)
  const cheapItemResult = await testPool.query<{ id: number }>(
    `INSERT INTO items (name, category, lpc_sprite_path, price)
     VALUES ('모자', 'hat', 'sprites/hat_01.png', 30) RETURNING id`,
  );
  const cheapItemId = cheapItemResult.rows[0]!.id;

  const expensiveItemResult = await testPool.query<{ id: number }>(
    `INSERT INTO items (name, category, lpc_sprite_path, price)
     VALUES ('갑옷', 'armor', 'sprites/armor_01.png', 80) RETURNING id`,
  );
  const expensiveItemId = expensiveItemResult.rows[0]!.id;

  return { studentId, cheapItemId, expensiveItemId };
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

describe('GET /api/shop/items', () => {
  it('returns all items ordered by category, price', async () => {
    await setupShopData();

    const res = await request(testApp).get('/api/shop/items');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    // Check required fields are present
    const item = res.body[0] as { id: number; name: string; category: string; lpc_sprite_path: string; price: number };
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('category');
    expect(item).toHaveProperty('lpc_sprite_path');
    expect(item).toHaveProperty('price');
  });
});

describe('POST /api/shop/buy', () => {
  it('succeeds with enough coins and returns remaining_coins', async () => {
    const { studentId, cheapItemId } = await setupShopData();

    const res = await request(testApp)
      .post('/api/shop/buy')
      .send({ student_id: studentId, item_id: cheapItemId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('remaining_coins');
    expect(res.body.remaining_coins).toBe(20); // 50 - 30 = 20

    // Verify coins updated in DB
    const studentRes = await request(testApp).get(`/api/students/${studentId}`);
    expect(studentRes.body.coins).toBe(20);
  });

  it('fails with 400 when student has not enough coins', async () => {
    const { studentId, expensiveItemId } = await setupShopData();

    const res = await request(testApp)
      .post('/api/shop/buy')
      .send({ student_id: studentId, item_id: expensiveItemId });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Not enough coins');

    // Verify coins unchanged
    const studentRes = await request(testApp).get(`/api/students/${studentId}`);
    expect(studentRes.body.coins).toBe(50);
  });

  it('fails with 400 when item is already owned', async () => {
    const { studentId, cheapItemId } = await setupShopData();

    // Buy once successfully
    const firstRes = await request(testApp)
      .post('/api/shop/buy')
      .send({ student_id: studentId, item_id: cheapItemId });
    expect(firstRes.status).toBe(200);

    // Try to buy again
    const secondRes = await request(testApp)
      .post('/api/shop/buy')
      .send({ student_id: studentId, item_id: cheapItemId });
    expect(secondRes.status).toBe(400);
    expect(secondRes.body.error).toBe('Already owned');
  });
});

describe('PATCH /api/shop/equip', () => {
  it('toggles equipped status and returns updated row', async () => {
    const { studentId, cheapItemId } = await setupShopData();

    // Buy the item first
    await request(testApp)
      .post('/api/shop/buy')
      .send({ student_id: studentId, item_id: cheapItemId });

    // Equip it
    const equipRes = await request(testApp)
      .patch('/api/shop/equip')
      .send({ student_id: studentId, item_id: cheapItemId, is_equipped: true });

    expect(equipRes.status).toBe(200);
    expect(equipRes.body).toHaveProperty('is_equipped', true);
    expect(equipRes.body).toHaveProperty('student_id', studentId);
    expect(equipRes.body).toHaveProperty('item_id', cheapItemId);

    // Unequip it
    const unequipRes = await request(testApp)
      .patch('/api/shop/equip')
      .send({ student_id: studentId, item_id: cheapItemId, is_equipped: false });

    expect(unequipRes.status).toBe(200);
    expect(unequipRes.body).toHaveProperty('is_equipped', false);
  });
});

describe('GET /api/shop/inventory/:studentId', () => {
  it('returns owned items with item details and is_equipped', async () => {
    const { studentId, cheapItemId } = await setupShopData();

    // Buy the cheap item
    await request(testApp)
      .post('/api/shop/buy')
      .send({ student_id: studentId, item_id: cheapItemId });

    const res = await request(testApp).get(`/api/shop/inventory/${studentId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);

    const ownedItem = res.body[0] as {
      student_id: number;
      item_id: number;
      is_equipped: boolean;
      name: string;
      category: string;
      lpc_sprite_path: string;
      price: number;
    };
    expect(ownedItem.student_id).toBe(studentId);
    expect(ownedItem.item_id).toBe(cheapItemId);
    expect(ownedItem).toHaveProperty('is_equipped');
    expect(ownedItem).toHaveProperty('name');
    expect(ownedItem).toHaveProperty('category');
    expect(ownedItem).toHaveProperty('lpc_sprite_path');
    expect(ownedItem).toHaveProperty('price');
  });

  it('returns empty array when student has no items', async () => {
    const { studentId } = await setupShopData();

    const res = await request(testApp).get(`/api/shop/inventory/${studentId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
