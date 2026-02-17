import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'test+' } } });
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'test+' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test+register@example.com',
          password: 'Password123',
          name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test+register@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
          name: 'Test User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test+duplicate@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      await request(app).post('/api/v1/auth/register').send(userData);
      const res = await request(app).post('/api/v1/auth/register').send(userData);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'test+login@example.com',
        password: 'Password123',
        name: 'Test User',
      });
    });

    it('should login successfully', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test+login@example.com',
        password: 'Password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test+login@example.com',
        password: 'WrongPassword',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user data with valid token', async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send({
        email: 'test+me@example.com',
        password: 'Password123',
        name: 'Me User',
      });

      const { accessToken } = registerRes.body.data;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('test+me@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
