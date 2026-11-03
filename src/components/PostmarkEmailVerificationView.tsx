import React, { useState, useEffect, useRef } from 'react';

interface PostmarkEmailVerificationViewProps {
  isNightShiftMode: boolean;
  initialEmail?: string;
  onProceedToPhoneVerification: () => void;
  onProceedToLicenseVerification: () => void;
  onBackToOverview?: () => void;
  onEmailVerified?: () => void | Promise<void>;
}

export const PostmarkEmailVerificationView: React.FC<PostmarkEmailVerificationViewProps> = ({
  isNightShiftMode,
  initialEmail,
  onProceedToPhoneVerification,
  onProceedToLicenseVerification,
  onBackToOverview,
  onEmailVerified,
}) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailInput, setEditEmailInput] = useState(initialEmail || '');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendNotification, setResendNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastSentEmailRef = useRef<string | null>(null);

  // Synchronize email if prop changes after mount
  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
      setEditEmailInput(initialEmail);
    }
  }, [initialEmail]);

  // Send transactional email code on mount or email update
  useEffect(() => {
    if (!email) return;
    if (lastSentEmailRef.current === email) return;
    lastSentEmailRef.current = email;

    let isCancelled = false;
    const sendInitialEmail = async () => {
      try {
        setError(null);
        const res = await fetch('/api/auth/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
        if (!res.ok && !isCancelled) {
          setError(data.error || 'Failed to send verification email.');
          if (data.pin) {
            setResendNotification(`Preview note: Verification PIN is ${data.pin}`);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to send verification email:', err);
          setError('Unable to contact verification service.');
        }
      }
    };
    sendInitialEmail();
    return () => { isCancelled = true; };
  }, [email]);

  // Countdown timer for code resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handlePinChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newPin = [...pin];
    newPin[index] = cleanVal ? cleanVal[cleanVal.length - 1] : '';
    setPin(newPin);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      pinInputRefs.current[index+ 1]?.focus();
      pinInputRefs.current[index+ 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editEmailInput.trim() && editEmailInput.includes('@')) {
      const updated = editEmailInput.trim();
      setEmail(updated);
      setIsEditingEmail(false);
      setCountdown(45);
      setCanResend(false);
      setResendNotification(`Sending verification code to ${updated}...`);
      setError(null);
      try {
        const res = await fetch('/api/auth/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: updated }),
        });
        const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
        if (!res.ok) {
          setError(data.error || 'Failed to send verification email.');
          if (data.pin) {
            setResendNotification(`Preview note: Verification PIN is ${data.pin}`);
          }
        } else {
          setResendNotification(`Verification code sent to ${updated}`);
        }
      } catch (err) {
        console.error('Failed to send verification email:', err);
        setError('Network error contacting verification service.');
      }
      setTimeout(() => setResendNotification(null), 5000);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setError(null);
      setCountdown(45);
      setCanResend(false);
      setResendNotification(`Sending new verification code to ${email}...`);
      const res = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
      if (!res.ok) {
        setError(data.error || 'Failed to send verification email.');
        if (data.pin) {
          setResendNotification(`Preview note: Verification PIN is ${data.pin}`);
        }
      } else {
        setResendNotification(`New verification code delivered to ${email}`);
      }
      setTimeout(() => setResendNotification(null), 5000);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      setError('Network error contacting verification service.');
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    const pinCode = pin.join('');
    if (pinCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      setIsVerifying(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: pinCode }),
      });

      const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {});
      if (!res.ok) {
        throw new Error(data.error || 'Verification code did not match. Please check your inbox.');
      }

      setIsVerified(true);
      if (onEmailVerified) {
        try {
          await onEmailVerified();
        } catch (callbackErr) {
          console.error('[PostmarkEmailVerification] Error executing onEmailVerified callback:', callbackErr);
        }
      }
      setTimeout(() => {
        onProceedToPhoneVerification();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Verification could not be completed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formattedCountdown = `00:${countdown < 10 ? `0${countdown}` : countdown}`;

  return (
    <div
      className={`w-full min-h-screen transition-colors ${
        isNightShiftMode ? 'bg-[#08101C] text-[#E6ECF7]' : 'bg-[#EFF6FB] text-[#0B2559]'
      }`}
    >
      {/* Streamlined Stepper Header */}
      <section
        className={`w-full py-4 border-b transition-colors ${
          isNightShiftMode
            ? 'bg-[#0B1626] border-[#233550]'
            : 'bg-white border-[rgba(11,37,89,0.08)]'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                className="text-gray-400 hover:text-[#0B2559] focus-visible:text-[#0B2559] dark:hover:text-white focus-visible:text-white transition-colors p-1"
                aria-label="Back to overview"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            )}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
                Step 2 of 4 • Clinician Onboarding
              </span>
              <h1 className="text-sm font-bold text-[#0B2559] dark:text-white">
                Email Authentication
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#0A6FA8]" />
            <span>Encrypted PIN Delivery</span>
          </div>
        </div>
      </section>

      {/* Main Focused Verification Card */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div
          className={`rounded-3xl p-6 sm:p-10 shadow-sm border transition-colors ${
            isNightShiftMode
              ? 'bg-[#0B1626] border-[#233550]'
              : 'bg-white border-[rgba(11,37,89,0.08)]'
          }`}
        >
          {/* Brand Tagline */}
          <div className="text-center space-y-1 mb-6">
            <span
              className="text-[#B9822E] dark:text-[#F1CF78] text-2xl block"
              style={{ fontFamily:"'Kaushan Script', cursive" }}
            >
              Rest Well. Heal Better.
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B2559] dark:text-white">
              Confirm your email address
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              We sent a 6-digit confirmation code to your email so you can activate your account and securely book sanctuaries.
            </p>
          </div>

          {/* Email Recipient Badge & Inline Edit */}
          <div
            className={`p-3.5 rounded-2xl mb-6 border transition-colors ${
              isNightShiftMode ? 'bg-[#0E1A2E] border-[#233550]' : 'bg-[#EFF6FB] border-[#0A6FA8]/15'
            }`}
          >
            {isEditingEmail ? (
              <form onSubmit={handleSaveEmail} className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Update email address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={editEmailInput}
                    onChange={(e) => setEditEmailInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0A6FA8]"
                    placeholder="sarah@example.com"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#0A6FA8] text-white text-xs font-semibold hover:bg-[#0C7EBF] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0C7EBF] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditEmailInput(email);
                      setIsEditingEmail(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[#0A6FA8] text-[20px] shrink-0">
                    mail
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#0B2559] dark:text-white truncate block">
                      {email}
                    </span>
                    <span className="text-[11px] text-gray-400">Personal or agency email</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(true)}
                  className="text-xs font-semibold text-[#0A6FA8] hover:text-[#0C7EBF] focus-visible:text-[#0C7EBF] dark:text-[#3E9AD1] transition-colors cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          {error && (
          <div ref={errorRef}
              role="alert"
              className="mb-4 p-3 rounded-xl bg-[#F4E2DC] text-[#A8452E] text-xs font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {resendNotification && (
            <div
              role="status"
              className="mb-4 p-3 rounded-xl bg-[#E1EFE9] text-[#2F6E5E] text-xs font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
              <span>{resendNotification}</span>
            </div>
          )}

          {/* 6-Digit PIN Inputs */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="pin-digit-0" className="font-semibold text-gray-600 dark:text-gray-300">
                Enter 6-digit code
              </label>
              <span className="text-gray-400 tabular-nums">Expires in 15 min</span>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  id={`pin-digit-${idx}`}
                  ref={(el) => {
                    pinInputRefs.current[idx] = el;
                  }}
                  aria-label={`Digit ${idx+ 1}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl focus:outline-none transition-all duration-200 ease-in-out tabular-nums border ${
                    isNightShiftMode
                      ? 'bg-[#0E1A2E] border-[#233550] text-white focus:border-[#3E9AD1] focus:ring-2 focus:ring-[#3E9AD1]/20'
                      : 'bg-[#EFF6FB] border-[#0A6FA8]/20 text-[#0B2559] focus:bg-white focus:border-[#0A6FA8] focus:ring-2 focus:ring-[#0A6FA8]/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className={`w-full py-3.5 px-6 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ease-in-out cursor-pointer shadow-xs ${
              isVerified
                ? 'bg-[#2F6E5E] text-white'
                : 'bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] focus-visible:ring-offset-1'
            }`}
          >
            {isVerifying ? (
              <>
                <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : isVerified ? (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Verified! Proceeding to phone verification...</span>
              </>
            ) : (
              <span>Verify email</span>
            )}
          </button>

          {/* Resend & Switch to SMS Controls */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-gray-500">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-[#0A6FA8] hover:underline cursor-pointer"
                >
                  Resend code
                </button>
              ) : (
                <span>
                  Resend available in <strong className="tabular-nums text-gray-700 dark:text-gray-300">{formattedCountdown}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onProceedToPhoneVerification}
              className="text-gray-500 hover:text-[#0A6FA8] focus-visible:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:text-[#3E9AD1] transition-colors cursor-pointer"
            >
              Prefer SMS? Verify by phone
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
