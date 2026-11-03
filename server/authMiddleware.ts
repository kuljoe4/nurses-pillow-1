import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { db } from './db.js';

export interface UserJwtPayload extends JwtPayload {
  id: string;
  role: string;
  email: string;
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set in ' + process.env.NODE_ENV + '.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 'fallback_secret_for_development_only' : (() => { throw new Error('JWT_SECRET is not set in production'); })());

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Use http-only cookie for secure token storage
  const token = req.cookies?.auth_token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & TokenPayload;

    // Check if user still exists and is not suspended
    const result = await db.query('SELECT id, role, email, is_suspended FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    const user = result.rows[0];

    if (user.is_suspended) {
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });
      res.status(403).json({ error: 'Account is suspended' });
      return;
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};
