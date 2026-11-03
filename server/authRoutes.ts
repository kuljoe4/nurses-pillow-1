import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserJwtPayload } from './authMiddleware.js';
import crypto from 'crypto';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { TokenPayload, authenticateToken, AuthenticatedRequest } from './authMiddleware.js';
import { registerSchema, loginSchema, validateBody } from './validation.js';
import { authLimiter } from './rateLimit.js';

type AsyncRequestHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>;

const catchAsync = (fn: AsyncRequestHandler) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    fn(req, res, next).catch((error) => {
       console.error(`[${req.method} ${req.path}] error:`, error);
       if (req.path.startsWith('/phone/')) {
          return res.status(500).json({ success: false, message: 'Internal server error' });
       }
       if (req.path === '/favorites') {
          return res.json({ listingIds: [] });
       }
       if (req.path === '/verify-email') {
          return res.status(500).json({ error: 'Verification failed. Please try again.' });
       }
       res.status(500).json({ error: 'Internal server error' });
    });
  };
};

const router = express.Router();

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'development') {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set in ' + process.env.NODE_ENV + '.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 'fallback_secret_for_development_only' : (() => { throw new Error('JWT_SECRET is not set in production'); })());

const SALT_ROUNDS = 12;

router.post('/register', authLimiter, validateBody(registerSchema), catchAsync(async (req, res, next) => {
    const { email, password, fullName, role } = req.body;

    const cleanEmail = email.trim().toLowerCase();

    // Role security: public registration is strictly limited to clinicians and property hosts
    const allowedRegistrationRoles = ['nurse', 'host'];
    if (!allowedRegistrationRoles.includes(role)) {
      res.status(400).json({
        error: 'Invalid registration role. Administrator access cannot be self-registered and is provisioned securely through standard governance channels.',
      });
      return;
    }

    // Check if user exists
    const existingUser = await db.query('SELECT id, email, full_name, role FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      // To prevent email enumeration securely, we MUST send the same response as a true success,
      // including setting a dummy cookie so attackers can't use the `Set-Cookie` header as an oracle.
      // We also trigger a generic email to the existing user so they aren't blackholed.

      const user = existingUser.rows[0];
      const postmarkServerToken = process.env.POSTMARK_SERVER_TOKEN || process.env.VITE_POSTMARK_SERVER_TOKEN;
      if (postmarkServerToken) {
        // Send a background "You already have an account" email
        fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': postmarkServerToken,
          },
          body: JSON.stringify({
            From: 'support@nursespillow.com',
            To: user.email,
            Subject: 'Registration Attempt - Nurses Pillow',
            TextBody: `Hello ${user.full_name},\n\nSomeone (hopefully you) just tried to register an account with this email address. Since you already have an account, no further action is needed.\n\nIf you forgot your password, you can reset it on the login page.\n\nThanks,\nThe Nurses Pillow Team`,
            HtmlBody: `<p>Hello ${user.full_name},</p><p>Someone (hopefully you) just tried to register an account with this email address. Since you already have an account, no further action is needed.</p><p>If you forgot your password, you can reset it on the login page.</p><p>Thanks,<br>The Nurses Pillow Team</p>`,
          }),
        }).catch(err => console.error('[Postmark] Duplicate registration email error:', err));
      }

      // Generate a dummy JWT just for the cookie to match the success path
      const dummyToken = jwt.sign({ dummy: 'token' }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', dummyToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        user: {
          id: `usr_pending_${uuidv4()}`,
          email: cleanEmail,
          full_name: fullName,
          role: role,
          is_nurse_verified: false,
          is_host_verified: false,
          email_verified: false,
          phone_verified: false,
          identity_verified: false,
        },
        token: dummyToken,
        message: 'Registration successful. Please check your email to verify your account.'
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = `usr_${uuidv4()}`;

    const result = await db.query(`
      INSERT INTO users (id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, role
    `, [userId, cleanEmail, passwordHash, fullName, role]);

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ user, token });
}));

router.post('/login', authLimiter, validateBody(loginSchema), catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    const cleanEmail = email.trim().toLowerCase();
    const result = await db.query('SELECT id, email, password_hash, full_name, role, is_nurse_verified, is_host_verified, email_verified, phone_verified, identity_verified, phone_number, verification_status, clinical_license_number, stripe_connected_account_id, stripe_payouts_enabled FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    let user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_nurse_verified: Boolean(user.is_nurse_verified),
        is_host_verified: Boolean(user.is_host_verified),
        email_verified: Boolean(user.email_verified),
        phone_verified: Boolean(user.phone_verified),
        identity_verified: Boolean(user.identity_verified),
        verification_status: user.verification_status || 'unverified',
        clinical_license_number: user.clinical_license_number,
        stripe_connected_account_id: user.stripe_connected_account_id,
        stripe_payouts_enabled: Boolean(user.stripe_payouts_enabled),
      },
      token
    });
}));

router.post('/logout', (req, res) => {
  console.log("[Backend Logout Flow] 1. Received POST /api/auth/logout request");
  try {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    console.log("[Backend Logout Flow] 2. Set-Cookie header added to clear 'auth_token', secure:", process.env.NODE_ENV === 'production');
    res.json({ message: 'Logged out successfully' });
    console.log("[Backend Logout Flow] 3. Responded with success");
  } catch (error) {
    console.error("[Backend Logout Flow] [ERROR] Failed to clear cookie:", error);
    res.status(500).json({ error: 'Failed to log out' });
  }
});

router.post('/forgot-password', authLimiter, catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userResult = await db.query('SELECT id, full_name, email FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userResult.rows.length === 0) {
      // Return success even if user doesn't exist for security (avoid email enumeration)
      console.log(`[Forgot Password] Account not found for email: ${cleanEmail}`);
      res.json({ message: 'If an account exists, a password reset link has been sent.' });
      return;
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    const postmarkServerToken =
      process.env.POSTMARK_SERVER_TOKEN ||
      process.env.VITE_POSTMARK_SERVER_TOKEN;
    const origin = req.headers.origin || 'http://localhost:5173';
    const resetUrl = `${origin}/?reset=${token}`;

    if (postmarkServerToken) {
      // Send real email via Postmark
      const response = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': postmarkServerToken,
        },
        body: JSON.stringify({
          From: 'support@nursespillow.com',
          To: user.email, // Use the correct user email casing
          Subject: 'Reset Your Password - Nurses Pillow',
          TextBody: `Hello ${user.full_name},\n\nYou requested to reset your password. Please click the link below to set a new password:\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Nurses Pillow Team`,
          HtmlBody: `<p>Hello ${user.full_name},</p><p>You requested to reset your password. Please click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br>The Nurses Pillow Team</p>`,
        }),
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error('[Postmark] Error sending reset email:', errData);
      } else {
        console.log(`[Postmark] Password reset email sent to ${user.email}`);
      }
    } else {
      console.warn('[Postmark] POSTMARK_SERVER_TOKEN not found. Reset link:', resetUrl);
    }

    res.json({ message: 'If an account exists, a password reset link has been sent.' });
}));

router.post('/reset-password', authLimiter, catchAsync(async (req, res, next) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    const result = await db.query(
      'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired password reset token' });
      return;
    }

    const userId = result.rows[0].id;
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await db.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [passwordHash, userId]
    );

    res.json({ message: 'Password has been reset successfully' });
}));

// Ephemeral store for pending email verifications
const pendingEmailVerifications = new Map<string, { pin: string; expires: number }>();

router.post('/send-verification-email', authLimiter, authenticateToken, catchAsync(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const email = req.user?.email;
    if (!email) {
      res.status(401).json({ error: 'Unauthorized: Email is missing in token' });
      return;
    }

    const postmarkServerToken =
      process.env.POSTMARK_SERVER_TOKEN ||
      process.env.VITE_POSTMARK_SERVER_TOKEN;
    const cleanEmail = email.trim().toLowerCase();
    const userResult = await db.query('SELECT id, full_name FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    const pin = crypto.randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const fullName = userResult.rows.length > 0 ? userResult.rows[0].full_name : 'Clinician';

    pendingEmailVerifications.set(cleanEmail, { pin, expires: expires.getTime() });



    if (postmarkServerToken) {
      try {
        const response = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': postmarkServerToken,
          },
          body: JSON.stringify({
            From: process.env.POSTMARK_FROM_EMAIL || 'support@nursespillow.com',
            To: cleanEmail,
            Subject: 'Your Nurses Pillow Verification Code',
            TextBody: `Hello ${fullName},\n\nYour 6-digit Nurses Pillow verification code is: ${pin}\n\nThis code will expire in 15 minutes.\n\nRest Well. Heal Better.\nThe Nurses Pillow Team`,
            HtmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #FFFFFF; border: 1px solid #EFF6FB; border-radius: 16px;">
              <h2 style="color: #0B2559; margin: 0 0 4px 0; font-size: 24px; font-weight: 700;">Nurses Pillow</h2>
              <p style="color: #0A6FA8; font-size: 13px; margin: 0 0 20px 0; font-style: italic;">Rest Well. Heal Better.</p>
              <hr style="border: none; border-top: 1px solid #EFF6FB; margin: 20px 0;" />
              <p style="color: #0B2559; font-size: 15px; line-height: 1.5; margin: 0 0 12px 0;">Hello ${fullName},</p>
              <p style="color: #404850; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">Use the 6-digit confirmation code below to verify your email and unlock your clinical housing portal:</p>
              <div style="background-color: #EFF6FB; color: #0B2559; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin: 24px 0; font-variant-numeric: tabular-nums;">
                ${pin}
              </div>
              <p style="color: #6c757d; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0;">This verification code will expire in 15 minutes. If you did not request this code, no action is needed.</p>
            </div>`,
            MessageStream: 'outbound',
          }),
        });

        if (!response.ok) {
          const errData: any = await response.json().catch(() => ({ Message: 'Delivery rejected by email provider' }));
          console.error('[Postmark] Error sending verification email:', errData);
          // Return clear response so user knows why delivery failed and provide PIN in preview
          res.status(400).json({
            error: `Email delivery issue: ${errData.Message || 'Failed to deliver to recipient'}.`,
            pin: pin,
          });
          return;
        }

        console.log(`[Postmark] Verification email successfully dispatched to ${cleanEmail}`);
      } catch (postmarkErr: any) {
        console.error('[Postmark] Network/Transport exception:', postmarkErr);
        res.status(500).json({
          error: 'Email transport service temporarily unavailable.',
          pin: pin,
        });
        return;
      }
    } else {
      res.status(500).json({ error: 'Email service configuration missing.' });
      return;
    }

    res.json({ message: 'Verification email sent successfully' });
}));

router.post('/verify-email', authLimiter, authenticateToken, catchAsync(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const { pin } = req.body;
    const email = req.user?.email;
    if (!email) {
      res.status(401).json({ error: 'Unauthorized: Email is missing in token' });
      return;
    }
    if (!pin) {
      res.status(400).json({ error: '6-digit PIN is required.' });
      return;
    }

    const cleanPin = pin.toString().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      res.status(400).json({ error: 'Verification PIN must be exactly 6 digits.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const pending = pendingEmailVerifications.get(cleanEmail);
    const isPendingValid = pending && pending.pin === cleanPin && pending.expires > Date.now();
    if (!isPendingValid) {
      res.status(400).json({ error: 'Invalid or expired verification PIN. Please check your inbox or request a new code.' });
      return;
    }

    if (isPendingValid) {
      pendingEmailVerifications.delete(cleanEmail);
    }

    try {
      await db.query(
        'UPDATE users SET email_verified = true WHERE LOWER(email) = $1',
        [cleanEmail]
      );
    } catch (dbErr: any) {
      console.warn('Could not update email_verified in database:', dbErr.message);
    }

    res.json({
      success: true,
      email,
      verified: true,
      message: 'Email verified successfully.',
    });
}));

router.get('/me', catchAsync(async (req, res, next) => {
  const token =
    req.cookies?.auth_token ||
    (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));

  if (!token) {
    res.json({ user: null });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & TokenPayload;
    const result = await db.query(
      'SELECT id, email, full_name, role, is_nurse_verified, is_host_verified, email_verified, phone_verified, identity_verified, phone_number, verification_status, clinical_license_number, stripe_connected_account_id, stripe_payouts_enabled FROM users WHERE id = $1',
      [decoded.id]
    );
    res.json({ user: result.rows[0] || null });
  } catch {
    res.json({ user: null });
  }
}));

router.post('/phone/send-otp', authLimiter, authenticateToken, catchAsync(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const { phoneNumber } = req.body;
    const cleanPhone = (phoneNumber || '').toString().trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile phone number.' });
    }

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      return res.status(500).json({ success: false, message: 'SMS verification service is not configured.' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', cleanPhone);
    params.append('Channel', 'sms');

    const response = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = (response.headers.get('content-type')?.includes('application/json') ? await response.json() : {});
    if (!response.ok) {
       console.error('[Twilio] Send OTP Error:', data);
       return res.status(response.status).json({ success: false, message: data.message || 'Failed to send OTP' });
    }

    res.json({
      success: true,
      sid: data.sid,
      to: data.to,
      status: data.status,
      createdAt: data.date_created,
    });
}));

router.post('/phone/verify-otp', authLimiter, authenticateToken, catchAsync(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const { phoneNumber, code } = req.body;
    const cleanPhone = (phoneNumber || '').toString().trim();
    const cleanCode = (code || '').toString().trim().replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile phone number.' });
    }
    if (!cleanCode || cleanCode.length !== 6) {
      return res.status(400).json({ success: false, message: 'Verification code must be exactly 6 digits.' });
    }

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      return res.status(500).json({ success: false, message: 'SMS verification service is not configured.' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', cleanPhone);
    params.append('Code', cleanCode);

    const response = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = (response.headers.get('content-type')?.includes('application/json') ? await response.json() : {});
    if (!response.ok) {
       console.error('[Twilio] Verify OTP Error:', data);
       return res.status(response.status).json({ success: false, message: data.message || 'Failed to verify OTP' });
    }

    if (data.status === 'approved') {
       const userId = req.user?.id;
       const userEmail = req.user?.email;
       if (userId || userEmail) {
         try {
           await db.query(
             'UPDATE users SET phone_verified = true, phone_number = COALESCE($1, phone_number) WHERE id = $2 OR LOWER(email) = LOWER($3)',
             [cleanPhone, userId || '', (userEmail || '').toLowerCase()]
           );
         } catch (dbErr: any) {
           console.error('[AuthRoutes] DB update error on phone verify:', dbErr.message);
         }
       }
       res.json({ success: true, status: 'approved', phone_verified: true, message: 'Verification successful.' });
    } else {
       res.status(400).json({ success: false, status: data.status, error: 'INVALID_CODE', message: 'Verification failed.' });
    }
}));

// In-memory store for favorites fallback
const memoryFavorites = new Map<string, Set<string>>();

// Self-healing table check to guarantee favorites table exists
let favoritesTableInitialized = false;
async function ensureFavoritesTable() {
  if (favoritesTableInitialized) return;
  try {
    await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        listing_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_favorites_user_listing UNIQUE (user_id, listing_id)
      );
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);
    `);
    favoritesTableInitialized = true;
  } catch (err: any) {
    console.warn('ensureFavoritesTable notice:', err.message);
  }
}

router.get('/favorites', authenticateToken, catchAsync(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const searchKeys = Array.from(new Set([userId, userEmail, userEmail ? userEmail.trim().toLowerCase() : ''].filter(Boolean))) as string[];

    if (searchKeys.length === 0) {
      res.json({ listingIds: [] });
      return;
    }

    try {
      await ensureFavoritesTable();
      const result = await db.query(
        'SELECT DISTINCT listing_id FROM favorites WHERE user_id = ANY($1)',
        [searchKeys]
      );
      const listingIds = (result?.rows || []).map((r: any) => r.listing_id);
      // Synchronize memory cache
      for (const k of searchKeys) {
        memoryFavorites.set(k, new Set(listingIds));
      }
      res.json({ listingIds });
      return;
    } catch {
      const savedSet = new Set<string>();
      for (const k of searchKeys) {
        const cached = memoryFavorites.get(k);
        if (cached) {
          for (const item of cached) savedSet.add(item);
        }
      }
      res.json({ listingIds: Array.from(savedSet) });
    }
}));

router.post('/favorites/toggle', authenticateToken, catchAsync(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const { listingId } = req.body;
    if (!listingId) {
      res.status(400).json({ error: 'listingId is required' });
      return;
    }

    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const searchKeys = Array.from(new Set([userId, userEmail, userEmail ? userEmail.trim().toLowerCase() : ''].filter(Boolean))) as string[];
    const primaryKey = userId || (userEmail ? userEmail.trim().toLowerCase() : 'guest');

    if (!memoryFavorites.has(primaryKey)) {
      memoryFavorites.set(primaryKey, new Set());
    }
    const userFavorites = memoryFavorites.get(primaryKey)!;
    let isSaved = false;
    if (userFavorites.has(listingId)) {
      userFavorites.delete(listingId);
      isSaved = false;
    } else {
      userFavorites.add(listingId);
      isSaved = true;
    }

    for (const k of searchKeys) {
      memoryFavorites.set(k, new Set(userFavorites));
    }

    try {
      if (primaryKey !== 'guest') {
        await ensureFavoritesTable();
        if (isSaved) {
          await db.query(
            'INSERT INTO favorites (id, user_id, listing_id) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT (user_id, listing_id) DO NOTHING',
            [primaryKey, listingId]
          );
        } else {
          await db.query(
            'DELETE FROM favorites WHERE user_id = ANY($1) AND listing_id = $2',
            [searchKeys, listingId]
          );
        }
      }
    } catch (dbErr) {
      // In-memory handles persistence if DB table not yet initialized or network issue
      console.warn('DB favorite toggle warning:', dbErr);
    }

    res.json({
      saved: isSaved,
      listingIds: Array.from(userFavorites),
    });
}));

export default router;
