import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createPhoneAuthMiddleware } from '../phoneAuthMiddleware.ts';
import { phoneAuthStore } from '../../services/phoneAuthApi.ts';

// Create an express app with the middleware
const app = express();
app.use(createPhoneAuthMiddleware());

describe('phoneAuthMiddleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Non-target endpoints', () => {
    it('should ignore non /api/auth/phone endpoints', async () => {
      const res = await request(app).post('/api/other');
      expect(res.status).toBe(404); // Default express 404
    });

    it('should handle OPTIONS request', async () => {
      const res = await request(app).options('/api/auth/phone/send-otp');
      expect(res.status).toBe(204);
      expect(res.header['access-control-allow-origin']).toBe('*');
    });

    it('should reject non-POST requests', async () => {
      const res = await request(app).get('/api/auth/phone/send-otp');
      expect(res.status).toBe(405);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('METHOD_NOT_ALLOWED');
    });

    it('should return 404 for unknown endpoints', async () => {
      const res = await request(app).post('/api/auth/phone/unknown');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('Malformed request handling', () => {
    it('should return 400 for malformed JSON', async () => {
      const res = await request(app)
        .post('/api/auth/phone/send-otp')
        .set('Content-Type', 'application/json')
        .send('{"invalid_json":'); // Malformed JSON

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_JSON');
    });
  });

  describe('Exception handling', () => {
    it('should return 500 for unexpected errors', async () => {
      // Intentionally cause an error in JSON.parse by mocking req chunks behavior
      vi.spyOn(Buffer, 'concat').mockImplementationOnce(() => {
        throw new Error('Test Error');
      });

      const res = await request(app)
        .post('/api/auth/phone/send-otp')
        .send({ phoneNumber: '+1234567890' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('SERVER_ERROR');
    });
  });

  describe('/api/auth/phone/send-otp', () => {
    it('should validate phone number presence', async () => {
      const res = await request(app).post('/api/auth/phone/send-otp').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PHONE');
    });

    it('should validate phone number length', async () => {
      const res = await request(app)
        .post('/api/auth/phone/send-otp')
        .send({ phoneNumber: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PHONE');
    });

    it('should validate phone number type', async () => {
      const res = await request(app)
        .post('/api/auth/phone/send-otp')
        .send({ phoneNumber: 1234567890 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PHONE');
    });

    it('should successfully create a session', async () => {
      const phoneNumber = '+1234567890';
      const res = await request(app)
        .post('/api/auth/phone/send-otp')
        .send({ phoneNumber });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.sid).toBeDefined();
      expect(res.body.codeSent).toBeDefined();
    });
  });

  describe('/api/auth/phone/verify-otp', () => {
    it('should successfully verify OTP by orchestrating send-otp and verify-otp', async () => {
      const phoneNumber = '+1234567890';

      // 1. Send OTP to create a session
      const sendRes = await request(app)
        .post('/api/auth/phone/send-otp')
        .send({ phoneNumber });

      expect(sendRes.status).toBe(200);
      const code = sendRes.body.codeSent;

      // 2. Verify the OTP
      const verifyRes = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber, code });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.status).toBe('approved');
    });

    it('should fallback to 200 statusCode if verifyOtp returns success true without statusCode', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';

      vi.spyOn(phoneAuthStore, 'verifyOtp').mockReturnValue({
        success: true,
        status: 'approved',
        message: 'Verified',
      } as any);

      const verifyRes = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber, code });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.status).toBe('approved');
    });

    it('should fallback to 400 statusCode if verifyOtp returns success false without statusCode', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';

      vi.spyOn(phoneAuthStore, 'verifyOtp').mockReturnValue({
        success: false,
        status: 'failed',
        error: 'INVALID_CODE',
        message: 'Failed',
      } as any);

      const verifyRes = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber, code });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.success).toBe(false);
      expect(verifyRes.body.status).toBe('failed');
      expect(verifyRes.body.error).toBe('INVALID_CODE');
    });

    it('should handle simulated errors based on body.simulateError', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';

      const verifyRes = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber, code, simulateError: 'network' });

      expect(verifyRes.status).toBe(503);
      expect(verifyRes.body.error).toBe('NETWORK_FAILURE');
    });

    it('should handle simulated errors based on x-simulate-error header', async () => {
      const phoneNumber = '+1234567890';
      const code = '123456';

      const verifyRes = await request(app)
        .post('/api/auth/phone/verify-otp')
        .set('x-simulate-error', 'network')
        .send({ phoneNumber, code });

      expect(verifyRes.status).toBe(503);
      expect(verifyRes.body.error).toBe('NETWORK_FAILURE');
    });

    it('should handle network error with 999999 code', async () => {
      const res = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+1234567890', code: '999999' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('NETWORK_FAILURE');
    });

    it('should validate phone number presence and length', async () => {
      const res = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PHONE');
    });

    it('should validate phone number type', async () => {
      const res = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: 1234567890, code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PHONE');
    });

    it('should validate code presence and length', async () => {
      const res = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+1234567890', code: '12' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_CODE');
    });

    it('should handle expired error with 000000 code', async () => {
      const res = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+1234567890', code: '000000' });

      expect(res.status).toBe(410);
      expect(res.body.error).toBe('TOKEN_EXPIRED');
    });

    it('should handle rate_limit error with 888888 code', async () => {
      const res = await request(app)
        .post('/api/auth/phone/verify-otp')
        .send({ phoneNumber: '+1234567890', code: '888888' });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('RATE_LIMITED');
    });
  });
});
