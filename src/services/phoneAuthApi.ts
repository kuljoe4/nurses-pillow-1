// Nurses Pillow - Twilio Verify SMS Endpoint & Error-Handling Engine
// Endpoint: /api/auth/phone/verify-otp & /api/auth/phone/send-otp

export type OtpErrorCode =
  | 'INVALID_CODE'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMITED'
  | 'NETWORK_FAILURE'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_PHONE'
  | 'INVALID_REQUEST';

export interface VerifyOtpRequestBody {
  phoneNumber: string;
  code: string;
  simulateError?: 'expired' | 'network' | 'rate_limit' | 'invalid';
}

export interface VerifyOtpResponse {
  success: boolean;
  status: 'approved' | 'failed' | 'expired' | 'rate_limited' | 'error';
  message: string;
  error?: OtpErrorCode;
  statusCode: number;
  attemptsRemaining?: number;
  attemptsUsed?: number;
  retryAfterSeconds?: number;
  expiredAt?: string;
  canResend?: boolean;
  verifiedAt?: string;
  diagnosticAdvice?: string;
}

export interface SendOtpResponse {
  success: boolean;
  sid: string;
  to: string;
  status: 'pending';
  codeSent: string;
  createdAt: string;
  expiresInSeconds: number;
  deliveryTimeMs: number;
  message: string;
}

export interface StoredOtpSession {
  sid: string;
  phoneNumber: string;
  codeSent: string;
  createdAt: number; // timestamp ms
  expiresAt: number; // timestamp ms (10 minutes)
  attempts: number;
  maxAttempts: number;
  isLocked: boolean;
  lockUntil?: number;
  status: 'pending' | 'approved' | 'expired' | 'canceled';
}

// In-memory store for OTP sessions
class PhoneAuthStore {
  private sessions: Map<string, StoredOtpSession> = new Map();

  constructor() {
    // Seed default session for demo/test phone
    const defaultPhone = '+19195550198';
    const now = Date.now();
    this.sessions.set(defaultPhone, {
      sid: 'VE_seed_duke_clinician',
      phoneNumber: defaultPhone,
      codeSent: '842199',
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
      attempts: 0,
      maxAttempts: 5,
      isLocked: false,
      status: 'pending',
    });
  }

  formatE164(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) {
      return `+${digits}`;
    }
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    return phone.startsWith('+') ? phone : `+${digits}`;
  }

  createSession(phoneNumber: string): StoredOtpSession {
    const formatted = this.formatE164(phoneNumber);
    const now = Date.now();

    // Secure random generation
    let rand = 0;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      rand = array[0] / (0xffffffff + 1);
    } else if (typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        rand = crypto.randomBytes(4).readUInt32LE(0) / (0xffffffff + 1);
      } catch (e) {
        rand = Math.random();
      }
    } else {
      rand = Math.random();
    }

    const generatedCode = Math.floor(100000 + rand * 900000).toString();

    let sidRand = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
       sidRand = window.crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
    } else if (typeof require !== 'undefined') {
       try {
         const crypto = require('crypto');
         sidRand = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
       } catch (e) {
         sidRand = Math.random().toString(36).substring(2, 10).toUpperCase();
       }
    } else {
       sidRand = Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    const session: StoredOtpSession = {
      sid: `VE_${sidRand}`,
      phoneNumber: formatted,
      codeSent: generatedCode,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      maxAttempts: 5,
      isLocked: false,
      status: 'pending',
    };

    this.sessions.set(formatted, session);
    return session;
  }

  getSession(phoneNumber: string): StoredOtpSession | undefined {
    const formatted = this.formatE164(phoneNumber);
    return this.sessions.get(formatted);
  }

  // Handle verify-otp request with thorough validation
  verifyOtp(body: VerifyOtpRequestBody, headers?: Record<string, string | string[] | undefined>): VerifyOtpResponse {
    const simulateHeader = headers?.['x-simulate-error'];
    const simulateError = body.simulateError || (typeof simulateHeader === 'string' ? simulateHeader : undefined);

    // 1. Check for simulated Network Failure (for QA testing: code '999999' or simulated error)
    if (simulateError === 'network' || body.code === '999999') {
      return {
        success: false,
        status: 'error',
        statusCode: 503,
        error: 'NETWORK_FAILURE',
        message: 'Unable to reach the verification network. Please check your connection and retry.',
        diagnosticAdvice: 'Network communication timed out. Check your cellular signal or Wi-Fi connection.',
        canResend: true,
      };
    }

    // 2. Validate input parameters
    if (!body.phoneNumber || body.phoneNumber.trim().length < 7) {
      return {
        success: false,
        status: 'error',
        statusCode: 400,
        error: 'INVALID_PHONE',
        message: 'Please provide a valid mobile number with country code.',
        diagnosticAdvice: 'Ensure phone includes country code or 10-digit number (e.g. +1 919-555-0198).',
      };
    }

    const cleanCode = (body.code || '').replace(/\D/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      return {
        success: false,
        status: 'error',
        statusCode: 400,
        error: 'INVALID_CODE',
        message: 'Verification code must be exactly 6 digits.',
        diagnosticAdvice: 'Check the SMS message sent to your phone and enter all 6 digits.',
      };
    }

    const formattedPhone = this.formatE164(body.phoneNumber);
    const session = this.sessions.get(formattedPhone);

    // 3. Check for simulated Rate Limiting (code '888888' or simulated error)
    if (simulateError === 'rate_limit' || cleanCode === '888888') {
      return {
        success: false,
        status: 'rate_limited',
        statusCode: 429,
        error: 'RATE_LIMITED',
        message: 'Too many incorrect attempts. For your account security, verification is locked for 60 seconds.',
        retryAfterSeconds: 60,
        diagnosticAdvice: 'Account lockout active after repeated attempts. Please wait 60 seconds.',
      };
    }

    // 4. Check for simulated Expired Token (code '000000' or simulated error)
    if (simulateError === 'expired' || cleanCode === '000000') {
      return {
        success: false,
        status: 'expired',
        statusCode: 410,
        error: 'TOKEN_EXPIRED',
        message: 'This verification code has expired after 10 minutes. Please request a new code.',
        expiredAt: new Date(Date.now() - 30000).toISOString(),
        canResend: true,
        diagnosticAdvice: 'Security codes expire after 10 minutes to protect your account.',
      };
    }

    // 5. Check if session exists in memory
    if (!session) {
      // Allow universal sandbox test codes '842199' / '123456' even without active session
      if (cleanCode === '842199' || cleanCode === '123456') {
        return {
          success: true,
          status: 'approved',
          statusCode: 200,
          message: 'Mobile number verified successfully.',
          verifiedAt: new Date().toISOString(),
        };
      }

      return {
        success: false,
        status: 'failed',
        statusCode: 404,
        error: 'SESSION_NOT_FOUND',
        message: 'No active verification session found for this number. Please request a new code.',
        canResend: true,
        diagnosticAdvice: 'The verification session may have expired or was dispatched to a different number.',
      };
    }

    // 6. Check if session is currently locked due to rate limiting
    const now = Date.now();
    if (session.isLocked && session.lockUntil && now < session.lockUntil) {
      const remainingSeconds = Math.ceil((session.lockUntil - now) / 1000);
      return {
        success: false,
        status: 'rate_limited',
        statusCode: 429,
        error: 'RATE_LIMITED',
        message: `Too many incorrect attempts. Please wait ${remainingSeconds} seconds before trying again.`,
        retryAfterSeconds: remainingSeconds,
        diagnosticAdvice: 'Account temporarily locked to protect your mobile identity against brute force.',
      };
    } else if (session.isLocked && session.lockUntil && now >= session.lockUntil) {
      // Unlock after cooldown
      session.isLocked = false;
      session.attempts = 0;
      session.lockUntil = undefined;
    }

    // 7. Check if actual session has expired (exceeded 10 minutes)
    if (now > session.expiresAt || session.status === 'expired') {
      session.status = 'expired';
      return {
        success: false,
        status: 'expired',
        statusCode: 410,
        error: 'TOKEN_EXPIRED',
        message: 'This verification code has expired after 10 minutes. Please request a new SMS code.',
        expiredAt: new Date(session.expiresAt).toISOString(),
        canResend: true,
        diagnosticAdvice: 'Security tokens are invalidated 10 minutes post-dispatch.',
      };
    }

    // 8. Validate the code (Active session code or Sandbox universal codes)
    const isCodeValid =
      cleanCode === session.codeSent ||
      cleanCode === '842199' ||
      cleanCode === '123456';

    if (isCodeValid) {
      session.status = 'approved';
      session.attempts = 0;
      session.isLocked = false;
      return {
        success: true,
        status: 'approved',
        statusCode: 200,
        message: 'Mobile number verified successfully.',
        verifiedAt: new Date().toISOString(),
      };
    }

    // 9. Invalid code: Increment attempts and evaluate lock out
    session.attempts += 1;
    const attemptsRemaining = Math.max(0, session.maxAttempts - session.attempts);

    if (attemptsRemaining === 0) {
      session.isLocked = true;
      session.lockUntil = now + 60 * 1000; // 60-second cooldown
      return {
        success: false,
        status: 'rate_limited',
        statusCode: 429,
        error: 'RATE_LIMITED',
        message: 'Maximum verification attempts exceeded (5/5). Account locked for 60 seconds.',
        attemptsUsed: session.attempts,
        attemptsRemaining: 0,
        retryAfterSeconds: 60,
        canResend: true,
        diagnosticAdvice: 'For safety, multiple failed verification attempts trigger a 1-minute protective cooldown.',
      };
    }

    return {
      success: false,
      status: 'failed',
      statusCode: 400,
      error: 'INVALID_CODE',
      message: `Incorrect verification code. Please check your SMS and try again (${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining).`,
      attemptsUsed: session.attempts,
      attemptsRemaining,
      diagnosticAdvice: 'Double-check the 6-digit code received via SMS. Universal sandbox test codes: 842199 or 123456.',
    };
  }

  // Get active session count / debugging info
  getAllSessions(): StoredOtpSession[] {
    return Array.from(this.sessions.values());
  }
}

export const phoneAuthStore = new PhoneAuthStore();
