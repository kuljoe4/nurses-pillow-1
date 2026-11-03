// Nurses Pillow - Twilio Verify SMS One-Time Password (OTP) Service
// Service SID: VA_test_nurses_pillow_otp_service
// Endpoint: /api/auth/phone/send-otp & /api/auth/phone/verify-otp

export type OtpErrorCode =
  | 'INVALID_CODE'
  | 'TOKEN_EXPIRED'
  | 'RATE_LIMITED'
  | 'NETWORK_FAILURE'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_PHONE'
  | 'INVALID_REQUEST';

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
  statusCode: number;
  sid: string;
  to: string;
  status: 'pending';
  codeSent: string;
  createdAt: string;
  expiresInSeconds: number;
  deliveryTimeMs: number;
  message: string;
}

export interface TwilioOtpDispatch {
  sid: string;
  to: string;
  channel: 'sms';
  status: 'pending' | 'approved' | 'canceled' | 'expired';
  valid: boolean;
  codeSent: string;
  createdAt: string;
  deliveryTimeMs: number;
}

export interface VerifyOtpResult {
  success: boolean;
  status: 'approved' | 'failed' | 'expired' | 'rate_limited' | 'error';
  message: string;
  errorCode?: OtpErrorCode;
  statusCode?: number;
  attemptsRemaining?: number;
  attemptsUsed?: number;
  retryAfterSeconds?: number;
  canResend?: boolean;
  diagnosticAdvice?: string;
  rawResponse?: any;
}

class TwilioVerifyService {
  private dispatches: TwilioOtpDispatch[] = [];
  // Send an authentic SMS OTP via Twilio Verify API
  async sendOtp(phoneNumber: string): Promise<TwilioOtpDispatch> {
    const formattedPhone = this.formatE164(phoneNumber);

    try {
      // Attempt HTTP call to backend endpoint /api/auth/phone/send-otp
      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data: SendOtpResponse = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
      const dispatch: TwilioOtpDispatch = {
        sid: data.sid,
        to: data.to || formattedPhone,
        channel: 'sms',
        status: 'pending',
        valid: false,
        codeSent: data.codeSent || '',
        createdAt: data.createdAt || new Date().toISOString(),
        deliveryTimeMs: data.deliveryTimeMs || 200,
      };

      if (res.ok) {
        this.dispatches.unshift(dispatch);
      }
      return dispatch;
    } catch (err) {
      console.error("Error sending OTP", err);
      throw err;
    }
  }

  // Verify OTP code with robust error-handling layer
  async verifyOtp(
    phoneNumber: string,
    code: string,
    options?: {
      simulateError?: 'expired' | 'network' | 'rate_limit' | 'invalid';
      timeoutMs?: number;
    }
  ): Promise<VerifyOtpResult> {
    const formattedPhone = this.formatE164(phoneNumber);

    // Check client-side online status first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        status: 'error',
        statusCode: 0,
        errorCode: 'NETWORK_FAILURE',
        message: 'No internet connection detected. Please check your Wi-Fi or cellular data.',
        diagnosticAdvice: 'The browser is offline. Please reconnect to verify your clinical phone number.',
        canResend: true,
      };
    }

    // Check for explicit simulated network error from options
    if (options?.simulateError === 'network' || code === '999999') {
      await new Promise((r) => setTimeout(r, 400));
      return {
        success: false,
        status: 'error',
        statusCode: 503,
        errorCode: 'NETWORK_FAILURE',
        message: 'Verification gateway timeout: Carrier SMS route unreachable.',
        diagnosticAdvice: 'The verification service did not respond within the allocated timeout window. Please retry.',
        canResend: true,
      };
    }

    // Abort controller for timeout enforcement (7 seconds max)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs || 7000);

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token')
      : null;
    const userEmail = typeof window !== 'undefined'
      ? localStorage.getItem('np_user_email')
      : null;

    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(options?.simulateError ? { 'x-simulate-error': options.simulateError } : {}),
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          code,
          email: userEmail,
          simulateError: options?.simulateError,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse JSON response
      const data: VerifyOtpResponse = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({ success: false, status: 'error' as const, statusCode: res.status, message: `HTTP Error ${res.status}: Unexpected response from verification service.`, error: 'INVALID_REQUEST' as const })) : { success: false, status: 'error' as const, statusCode: res.status, message: `HTTP Error ${res.status}: Unexpected response from verification service.`, error: 'INVALID_REQUEST' as const });

      // Update local dispatch status on success
      if (data.success) {
        const found = this.dispatches.find((d) => d.to === formattedPhone && d.status === 'pending');
        if (found) {
          found.status = 'approved';
          found.valid = true;
        }
      }

      return {
        success: data.success,
        status: data.status,
        statusCode: data.statusCode || res.status,
        message: data.message,
        errorCode: data.error,
        attemptsRemaining: data.attemptsRemaining,
        attemptsUsed: data.attemptsUsed,
        retryAfterSeconds: data.retryAfterSeconds,
        canResend: data.canResend,
        diagnosticAdvice: data.diagnosticAdvice,
        rawResponse: data,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Handle AbortError / Timeout
      if (err.name === 'AbortError') {
        return {
          success: false,
          status: 'error',
          statusCode: 504,
          errorCode: 'NETWORK_FAILURE',
          message: 'Verification request timed out. The SMS gateway took too long to respond.',
          diagnosticAdvice: 'Network latency exceeded 7 seconds. Please check your signal and click Verify again.',
          canResend: true,
        };
      }

      return {
        success: false,
        status: 'error',
        statusCode: 500,
        errorCode: 'NETWORK_FAILURE',
        message: 'Network error or backend unavailable.',
        canResend: true,
      };
    }
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

  getRecentDispatches(): TwilioOtpDispatch[] {
    return this.dispatches;
  }
}

export const twilioVerify = new TwilioVerifyService();
