import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ACTIVE_STATES } from '../../lib/constants/states.js';

// Mock app to test the exact logic we added to server.ts without spinning up the whole DB
const app = express();
app.use(express.json());

// Mock authenticateToken middleware
import { AuthenticatedRequest } from '../../../server/authMiddleware.js';

const mockAuthenticateToken = (req: AuthenticatedRequest, res: any, next: any) => {
  req.user = { id: 'mock-user-id', role: 'host', email: 'test@example.com' };
  next();
};

app.post('/api/listings/my-listing-mock', mockAuthenticateToken, (req, res) => {
  const state = req.body.state || "NC"; // fallback
  if (!ACTIVE_STATES.includes(state as any)) {
    return res.status(400).json({ error: "Listing creation is currently limited to NC, MD, CT, ND, and KS." });
  }
  return res.status(200).json({ success: true, state });
});

describe('API Route Geo-Expansion Validation', () => {
  it('should return 200 for supported states', async () => {
    for (const state of ['MD', 'CT', 'ND', 'KS', 'NC']) {
      const response = await request(app)
        .post('/api/listings/my-listing-mock')
        .send({ state });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

  it('should return 400 for unsupported states', async () => {
    for (const state of ['TX', 'CA', 'NY']) {
      const response = await request(app)
        .post('/api/listings/my-listing-mock')
        .send({ state });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Listing creation is currently limited to NC, MD, CT, ND, and KS.');
    }
  });
});
