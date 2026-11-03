import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import { createPhoneAuthMiddleware } from './phoneAuthMiddleware';

describe('phoneAuthMiddleware', () => {
  let server: http.Server;

  beforeAll(() => {
    const middleware = createPhoneAuthMiddleware();
    server = http.createServer(async (req, res) => {
      await middleware(req, res, () => {
        // Mock next() function to simulate passing through
        res.statusCode = 404;
        res.end('Not Found by Middleware');
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  describe('General routing & methods', () => {
    it('passes non-auth URLs to next()', async () => {
      const response = await request(server).get('/api/users');
      expect(response.status).toBe(404);
      expect(response.text).toBe('Not Found by Middleware');
    });

    it('returns 204 for OPTIONS requests', async () => {
      const response = await request(server).options('/api/auth/phone/send-otp');
      expect(response.status).toBe(204);
    });

    it('returns 405 for non-POST methods', async () => {
      const response = await request(server).get('/api/auth/phone/send-otp');
      expect(response.status).toBe(405);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 405,
        error: 'METHOD_NOT_ALLOWED',
      });
    });

    it('returns 400 for malformed JSON body', async () => {
      const response = await request(server)
        .post('/api/auth/phone/send-otp')
        .set('Content-Type', 'application/json')
        .send('{ invalid json');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        error: 'INVALID_JSON',
      });
    });

    it('returns 404 for unknown auth phone endpoints', async () => {
      const response = await request(server)
        .post('/api/auth/phone/unknown')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
      });
    });
  });

  describe('POST /api/auth/phone/send-otp', () => {
    it('returns 400 if phone number is missing or invalid', async () => {
      const response = await request(server)
        .post('/api/auth/phone/send-otp')
        .send({ phoneNumber: '123' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        error: 'INVALID_PHONE',
      });
    });

    it('returns 200 and creates a session for valid phone number', async () => {
      const response = await request(server)
        .post('/api/auth/phone/send-otp')
        .send({ phoneNumber: '+19195550198' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        statusCode: 200,
        status: 'pending',
      });
      expect(response.body).toHaveProperty('sid');
      expect(response.body).toHaveProperty('codeSent');
    });
  });

  describe('POST /api/auth/phone/verify-otp', () => {
    it('returns 503 for simulated network error', async () => {
      const response = await request(server)
        .post('/api/auth/phone/verify-otp')
        .send({ simulateError: 'network' });

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 503,
        error: 'NETWORK_FAILURE',
      });
    });

    it('returns 400 if phone number is missing or invalid', async () => {
      const response = await request(server)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '123', code: '123456' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        error: 'INVALID_PHONE',
      });
    });

    it('returns 400 if code is missing or invalid length', async () => {
      const response = await request(server)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+19195550198', code: '123' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        error: 'INVALID_CODE',
      });
    });

    it('returns 410 for expired token simulation', async () => {
      const response = await request(server)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+19195550198', code: '000000' });

      expect(response.status).toBe(410);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 410,
        error: 'TOKEN_EXPIRED',
      });
    });

    it('returns 429 for rate limit simulation', async () => {
      const response = await request(server)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+19195550198', code: '888888' });

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 429,
        error: 'RATE_LIMITED',
      });
    });

    it('returns 200 for valid universal sandbox code', async () => {
      const response = await request(server)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+19195550198', code: '123456' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        statusCode: 200,
        status: 'approved',
      });
    });
  });
});
