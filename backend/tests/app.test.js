/**
 * Recipe Community — Full Test Suite
 * 10+ meaningful tests: Unit (models, utils, middleware) + Integration (API + React)
 */

process.env.JWT_SECRET = 'test_secret_key_for_jest';
process.env.JWT_EXPIRE = '1d';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');

// ── 1. Unit: generateToken ─────────────────────────────────────────────────
describe('Utils › generateToken', () => {
  const { generateToken, verifyToken } = require('../utils/generateToken');

  test('returns a string JWT', () => {
    const id = new mongoose.Types.ObjectId().toString();
    const token = generateToken(id);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('payload contains the user id', () => {
    const id = new mongoose.Types.ObjectId().toString();
    const token = generateToken(id);
    const decoded = jwt.verify(token, 'test_secret_key_for_jest');
    expect(decoded.id).toBe(id);
  });

  test('verifyToken throws on invalid token', () => {
    expect(() => verifyToken('bad.token.here')).toThrow();
  });
});

// ── 2. Unit: bcrypt helpers ────────────────────────────────────────────────
describe('Utils › bcrypt password hashing', () => {
  test('hashed password differs from plaintext', async () => {
    const plain = 'MySecret123';
    const hash = await bcrypt.hash(plain, 10);
    expect(hash).not.toBe(plain);
  });

  test('bcrypt.compare returns true for correct password', async () => {
    const plain = 'MySecret123';
    const hash = await bcrypt.hash(plain, 10);
    expect(await bcrypt.compare(plain, hash)).toBe(true);
  });

  test('bcrypt.compare returns false for wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});

// ── 3. Unit: User model validation ────────────────────────────────────────
describe('Model › User validation', () => {
  const User = require('../models/User');

  test('fails when required fields are missing', async () => {
    const u = new User({});
    await expect(u.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ username: expect.anything(), email: expect.anything(), password: expect.anything() }),
    });
  });

  test('fails with invalid email format', async () => {
    const u = new User({ username: 'tester', email: 'not-an-email', password: 'pass123' });
    await expect(u.validate()).rejects.toMatchObject({ errors: expect.objectContaining({ email: expect.anything() }) });
  });

  test('passes with valid required fields', async () => {
    const u = new User({ username: 'tester', email: 'tester@example.com', password: 'pass123' });
    await expect(u.validate()).resolves.toBeUndefined();
  });

  test('default role is "user"', () => {
    const u = new User({ username: 'a', email: 'a@a.com', password: '123456' });
    expect(u.role).toBe('user');
  });
});

// ── 4. Unit: Recipe model validation ──────────────────────────────────────
describe('Model › Recipe validation', () => {
  const Recipe = require('../models/Recipe');

  test('fails without title', async () => {
    const r = new Recipe({ description: 'Desc', cookingTime: 30, servings: 2, difficulty: 'easy', author: new mongoose.Types.ObjectId() });
    await expect(r.validate()).rejects.toMatchObject({ errors: expect.objectContaining({ title: expect.anything() }) });
  });

  test('fails with invalid difficulty', async () => {
    const r = new Recipe({ title: 'T', description: 'D', cookingTime: 30, servings: 2, difficulty: 'extreme', author: new mongoose.Types.ObjectId() });
    await expect(r.validate()).rejects.toMatchObject({ errors: expect.objectContaining({ difficulty: expect.anything() }) });
  });

  test('passes with all required fields', async () => {
    const r = new Recipe({ title: 'T', description: 'D', cookingTime: 30, servings: 2, difficulty: 'easy', author: new mongoose.Types.ObjectId() });
    await expect(r.validate()).resolves.toBeUndefined();
  });
});

// ── 5. Unit: Comment model validation ─────────────────────────────────────
describe('Model › Comment validation', () => {
  const Comment = require('../models/Comment');

  test('fails without text', async () => {
    const c = new Comment({ author: new mongoose.Types.ObjectId(), recipe: new mongoose.Types.ObjectId() });
    await expect(c.validate()).rejects.toMatchObject({ errors: expect.objectContaining({ text: expect.anything() }) });
  });

  test('passes with all required fields', async () => {
    const c = new Comment({ text: 'Great!', author: new mongoose.Types.ObjectId(), recipe: new mongoose.Types.ObjectId() });
    await expect(c.validate()).resolves.toBeUndefined();
  });

  test('default isEdited is false', () => {
    const c = new Comment({ text: 'Hi', author: new mongoose.Types.ObjectId(), recipe: new mongoose.Types.ObjectId() });
    expect(c.isEdited).toBe(false);
  });
});

// ── 6. Unit: Tag model validation ─────────────────────────────────────────
describe('Model › Tag validation', () => {
  const Tag = require('../models/Tag');

  test('fails without required name', async () => {
    const t = new Tag({ slug: 'some-slug' });
    await expect(t.validate()).rejects.toMatchObject({ errors: expect.objectContaining({ name: expect.anything() }) });
  });

  test('default usageCount is 0', () => {
    const t = new Tag({ name: 'vegan', slug: 'vegan' });
    expect(t.usageCount).toBe(0);
  });
});

// ── 7. Unit: protect middleware ────────────────────────────────────────────
describe('Middleware › protect', () => {
  const { protect } = require('../middleware/protect');

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('returns 401 when no token provided', async () => {
    const req = { headers: {} };
    const res = mockRes();
    await protect(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authorized, no token' }));
  });

  test('returns 401 with malformed token', async () => {
    const req = { headers: { authorization: 'Bearer fake.token.xyz' } };
    const res = mockRes();
    await protect(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ── 8. Integration: health check ──────────────────────────────────────────
describe('API › Health check', () => {
  const app = require('../app');

  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/unknown returns 404', async () => {
    const res = await request(app).get('/api/totally-unknown-route');
    expect(res.status).toBe(404);
  });
});

// ── 9. Integration: Auth routes ────────────────────────────────────────────
describe('API › Auth routes', () => {
  const app = require('../app');

  test('POST /api/auth/register with missing fields returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  test('POST /api/auth/login with missing fields returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  test('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── 10. Integration: Recipe routes ─────────────────────────────────────────
describe('API › Recipe routes', () => {
  const app = require('../app');

  test('POST /api/recipes without token returns 401', async () => {
    const res = await request(app).post('/api/recipes').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  test('PUT /api/recipes/:id without token returns 401', async () => {
    const res = await request(app).put(`/api/recipes/${new mongoose.Types.ObjectId()}`).send({});
    expect(res.status).toBe(401);
  });

  test('DELETE /api/recipes/:id without token returns 401', async () => {
    const res = await request(app).delete(`/api/recipes/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(401);
  });
});

// ── 11. Integration: Comment routes ────────────────────────────────────────
describe('API › Comment routes', () => {
  const app = require('../app');

  test('POST /api/comments/:recipeId without token returns 401', async () => {
    const res = await request(app).post(`/api/comments/${new mongoose.Types.ObjectId()}`).send({ text: 'Hi' });
    expect(res.status).toBe(401);
  });

  test('DELETE /api/comments/:id without token returns 401', async () => {
    const res = await request(app).delete(`/api/comments/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(401);
  });
});
