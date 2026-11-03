import React, { useState, useEffect, useRef } from 'react';
import { twilioVerify, VerifyOtpResult, OtpErrorCode } from '../services/twilioVerify';

interface TwilioPhoneOtpViewProps {
  isNightShiftMode: boolean;
  initialPhone?: string;
  onProceedToLicenseVerification: () => void;
  onBackToEmailVerification?: () => void;
  onBackToEmail?: () => void;
}

interface DetailedErrorState {
  code: OtpErrorCode;
  message: string;
  statusCode: number;
  diagnosticAdvice?: string;
  attemptsRemaining?: number;
  attemptsUsed?: number;
  retryAfterSeconds?: number;
  canResend?: boolean;
}

export const TwilioPhoneOtpView: React.FC<TwilioPhoneOtpViewProps> = ({
  isNightShiftMode,
  initialPhone,
  onProceedToLicenseVerification,
  onBackToEmailVerification,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '+1 (919) 555-0198');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(phoneNumber);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(42);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [detailedError, setDetailedError] = useState<DetailedErrorState | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [lockoutCooldown, setLockoutCooldown] = useState<number | null>(null);
  const [shakeInputs, setShakeInputs] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastSentPhoneRef = useRef<string | null>(null);

  // Send OTP on initial mount
  useEffect(() => {
    if (!phoneNumber) return;
    if (lastSentPhoneRef.current === phoneNumber) return;
    lastSentPhoneRef.current = phoneNumber;
    void twilioVerify.sendOtp(phoneNumber);
  }, [phoneNumber]);

  // Resend countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Rate limiting lockout countdown
  useEffect(() => {
    if (lockoutCooldown !== null && lockoutCooldown > 0) {
      const timer = setTimeout(() => {
        setLockoutCooldown((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutCooldown]);

  const handleOtpChange = (index: number, val: string) => {
    setDetailedError(null);
    const cleanVal = val.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal[cleanVal.length - 1] : '';
    setOtp(newOtp);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = (phoneDraft || '').replace(/[^\d+]/g, '');
    if (cleanPhone && cleanPhone.replace(/\D/g, '').length >= 7) {
      setPhoneNumber(cleanPhone);
      setPhoneDraft(cleanPhone);
      setIsEditingPhone(false);
      setDetailedError(null);
      void twilioVerify.sendOtp(cleanPhone);
      setResendStatus(`New code sent to ${cleanPhone}`);
      setTimeLeft(60);
      setTimeout(() => setResendStatus(null), 4000);
    }
  };

  const handleResend = async () => {
    if (lockoutCooldown && lockoutCooldown > 0) return;
    setDetailedError(null);
    const res = await twilioVerify.sendOtp(phoneNumber);
    setTimeLeft(60);
    setResendStatus(`New code sent to ${phoneNumber}`);
    setTimeout(() => setResendStatus(null), 5000);
  };

  const executeVerify = async (codeString: string) => {
    setDetailedError(null);

    if (lockoutCooldown && lockoutCooldown > 0) {
      setDetailedError({
        code: 'RATE_LIMITED',
        statusCode: 429,
        message: `Verification temporarily locked. Please wait ${lockoutCooldown} seconds.`,
        retryAfterSeconds: lockoutCooldown,
        diagnosticAdvice: 'Account security lockout engaged.',
      });
      return;
    }

    if (codeString.length < 6) {
      setDetailedError({
        code: 'INVALID_CODE',
        statusCode: 400,
        message: 'Please enter all 6 digits.',
        diagnosticAdvice: 'Enter the 6-digit code received on your phone.',
      });
      triggerShake();
      return;
    }

    setIsVerifying(true);
    const result: VerifyOtpResult = await twilioVerify.verifyOtp(phoneNumber, codeString);
    setIsVerifying(false);

    if (result.success) {
      setIsVerified(true);
      setDetailedError(null);
      setTimeout(() => {
        onProceedToLicenseVerification();
      }, 1000);
    } else {
      triggerShake();
      if (result.errorCode === 'RATE_LIMITED' && result.retryAfterSeconds) {
        setLockoutCooldown(result.retryAfterSeconds);
      }
      setDetailedError({
        code: result.errorCode || 'INVALID_CODE',
        statusCode: result.statusCode || 400,
        message: result.message,
        diagnosticAdvice: result.diagnosticAdvice,
        attemptsRemaining: result.attemptsRemaining,
        attemptsUsed: result.attemptsUsed,
        retryAfterSeconds: result.retryAfterSeconds,
        canResend: result.canResend ?? true,
      });
    }
  };

  const triggerShake = () => {
    setShakeInputs(true);
    setTimeout(() => setShakeInputs(false), 500);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    void executeVerify(otp.join(''));
  };


  const timerDashOffset = 100 - (timeLeft / 42) * 100;
  const formattedCountdown = `00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}`;

  return (
    <div
      className={`w-full min-h-screen transition-colors ${
        isNightShiftMode ? 'bg-[#08101C] text-[#E6ECF7]' : 'bg-[#faf8ff] text-[#001848]'
      }`}
    >
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Step Progress Ribbon */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#005684] text-white font-bold text-sm shadow-xs">
              2
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#404850] dark:text-[#c0c7d1]">
                Step 2 of 4
              </div>
              <div className="text-lg font-bold text-[#001848] dark:text-white">
                Mobile Verification
              </div>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-xs border ${
              isNightShiftMode ? 'bg-[#15233a] border-[#233550]' : 'bg-[#f2f3ff] border-[rgba(11,37,89,0.06)]'
            }`}
          >
            <button
              type="button"
              onClick={onBackToEmailVerification}
              aria-label="Back to account verification"
              className="flex items-center gap-1 text-[#195b4c] dark:text-[#aff0db] cursor-pointer hover:underline text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Account</span>
            </button>
            <span className="w-3 h-0.5 bg-[#195b4c] dark:bg-[#aff0db]" />
            <div className="flex items-center gap-1 text-[#005684] dark:text-[#93ccff] font-bold text-xs">
              <span className="inline-flex w-4 h-4 rounded-full bg-[#005684] text-white items-center justify-center text-[10px]">
                2
              </span>
              <span>Mobile</span>
            </div>
            <span className="w-3 h-0.5 bg-[#c0c7d1] dark:bg-[#324560]" />
            <button
              type="button"
              onClick={onProceedToLicenseVerification}
              className="flex items-center gap-1 opacity-60 hover:opacity-100 text-xs font-medium cursor-pointer"
            >
              <span className="inline-flex w-4 h-4 rounded-full bg-[#dae2ff] dark:bg-[#182840] text-[#001848] dark:text-white items-center justify-center text-[10px]">
                3
              </span>
              <span>License</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Clean Clinician Trust Context */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div
              className={`p-6 sm:p-8 rounded-3xl shadow-sm border ${
                isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.06)]'
              }`}
            >
              <div
                className="text-[#745b0d] dark:text-[#E4C36D] text-xl mb-1"
                style={{ fontFamily: "'Kaushan Script', cursive" }}
              >
                Rest Well. Heal Better.
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
                Shift-ready mobile check-in.
              </h1>
              <p className="text-xs sm:text-sm text-[#404850] dark:text-[#c0c7d1] mb-6 leading-relaxed">
                We authenticate your mobile device so smart-lock door codes and urgent contract updates arrive reliably before your hospital shift.
              </p>

              {/* 3 Concise Feature Bullets */}
              <div className="space-y-3">
                <div
                  className={`flex items-start gap-3 p-3.5 rounded-2xl ${
                    isNightShiftMode ? 'bg-[#182840]' : 'bg-[#f2f3ff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#005684] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#001848] dark:text-white">
                      Door Access PIN
                    </div>
                    <p className="text-[11px] text-[#404850] dark:text-[#c0c7d1] mt-0.5">
                      Direct suite PIN delivery 3 hours before shift check-in.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 p-3.5 rounded-2xl ${
                    isNightShiftMode ? 'bg-[#182840]' : 'bg-[#f2f3ff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#195b4c] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#001848] dark:text-white">
                      Hospital Shift Updates
                    </div>
                    <p className="text-[11px] text-[#404850] dark:text-[#c0c7d1] mt-0.5">
                      Immediate alerts if start dates change or extensions approve.
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 p-3.5 rounded-2xl ${
                    isNightShiftMode ? 'bg-[#182840]' : 'bg-[#f2f3ff]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#ffdc84] text-[#745b0d] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#001848] dark:text-white">
                      24/7 Nurse Navigator Support
                    </div>
                    <p className="text-[11px] text-[#404850] dark:text-[#c0c7d1] mt-0.5">
                      Direct text triage during day-sleep quiet hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                isNightShiftMode ? 'bg-[#15233a] border-[#233550]' : 'bg-[#e2e7ff]/30 border-[rgba(11,37,89,0.06)]'
              }`}
            >
              <img
                className="w-12 h-12 rounded-full object-cover shadow-sm"
                alt="Sarah Jenkins RN"
                src="https://images.unsplash.com/photo-1594824813582-7d2d31215b2e?auto=format&fit=crop&w=150&q=80"
              />
              <div className="text-xs">
                <p className="italic text-[#001848] dark:text-white mb-1 leading-snug">
                  "Getting my keyless door code by text before arriving at Duke took all the anxiety away."
                </p>
                <div className="font-bold text-[#005684] dark:text-[#93ccff]">Sarah J., BSN, RN</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Mobile OTP Card */}
          <div className="lg:col-span-7">
            <div
              className={`p-6 sm:p-8 rounded-3xl shadow-sm relative border ${
                isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.08)]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="inline-flex items-center gap-1.5 bg-[#cde5ff] text-[#001d32] dark:bg-[#005684]/40 dark:text-[#93ccff] px-3 py-1 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#005684]" />
                  <span>Secure SMS Delivery</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#404850] dark:text-[#c0c7d1]">
                  <span className="material-symbols-outlined text-[#195b4c] dark:text-[#aff0db] text-[16px]">
                    lock
                  </span>
                  <span>Encrypted</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#001848] dark:text-white mb-1">
                Enter 6-digit verification code
              </h2>

              {/* Phone display / Inline editor */}
              {!isEditingPhone ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#404850] dark:text-[#c0c7d1] mb-5">
                  <span>Sent to</span>
                  <span className="font-bold text-[#001848] dark:text-white px-2 py-0.5 rounded-md bg-[#f2f3ff] dark:bg-[#182840]">
                    {phoneNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneDraft(phoneNumber);
                      setIsEditingPhone(true);
                    }}
                    className="text-[#005684] dark:text-[#93ccff] hover:underline font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSavePhone} className="mb-5 p-2.5 rounded-xl bg-[#f2f3ff] dark:bg-[#182840] flex items-center gap-2">
                  <input
                    type="tel"
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                    placeholder="+1 (919) 555-0198"
                    className="flex-1 px-3 py-1 text-xs font-mono rounded-lg bg-white dark:bg-[#111e33] border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005684]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#005684] text-white text-xs font-bold rounded-lg hover:bg-[#004266] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#004266] transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 focus-visible:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Form */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#001848] dark:text-white uppercase tracking-wider">
                      Verification Code
                    </label>
                    <span className="text-[11px] text-[#404850] dark:text-[#c0c7d1] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">timer</span>
                      <span>Valid for 10 minutes</span>
                    </span>
                  </div>

                  {/* Resend Status Notification */}
                  {resendStatus && (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#143329] dark:text-[#aff0db] border border-[#2F6E5E]/20 text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span className="font-semibold">{resendStatus}</span>
                    </div>
                  )}

                  {/* Specific User Feedback for Error States */}
                  {detailedError && (
                    <div
                      role="alert"
                      className={`mb-3 p-3.5 rounded-2xl border transition-all duration-200 ease-in-out ${
                        detailedError.code === 'INVALID_CODE'
                          ? 'bg-[#F4E2DC] text-[#A8452E] dark:bg-[#381610] dark:text-[#ffb4a2] border-[#A8452E]/30'
                          : detailedError.code === 'TOKEN_EXPIRED'
                          ? 'bg-[#FBF0D6] text-[#B9822E] dark:bg-[#382b0e] dark:text-[#fed989] border-[#B9822E]/30'
                          : detailedError.code === 'RATE_LIMITED'
                          ? 'bg-[#FBF0D6] text-[#B9822E] dark:bg-[#382b0e] dark:text-[#fed989] border-[#B9822E]/30'
                          : detailedError.code === 'NETWORK_FAILURE'
                          ? 'bg-[#F4E2DC] text-[#A8452E] dark:bg-[#381610] dark:text-[#ffb4a2] border-[#A8452E]/30'
                          : 'bg-[#F4E2DC] text-[#A8452E] dark:bg-[#381610] dark:text-[#ffb4a2] border-[#A8452E]/30'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                          {detailedError.code === 'INVALID_CODE'
                            ? 'dialpad'
                            : detailedError.code === 'TOKEN_EXPIRED'
                            ? 'timer_off'
                            : detailedError.code === 'NETWORK_FAILURE'
                            ? 'wifi_off'
                            : detailedError.code === 'RATE_LIMITED'
                            ? 'lock_clock'
                            : 'error'}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs">
                              {detailedError.code === 'INVALID_CODE'
                                ? 'Code Mismatch'
                                : detailedError.code === 'TOKEN_EXPIRED'
                                ? 'Code Expired'
                                : detailedError.code === 'NETWORK_FAILURE'
                                ? 'Connection Error'
                                : detailedError.code === 'RATE_LIMITED'
                                ? 'Account Cooldown'
                                : 'Notice'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                              HTTP {detailedError.statusCode}
                            </span>
                          </div>

                          <p className="text-xs font-semibold leading-relaxed">
                            {detailedError.message}
                          </p>

                          {/* Quick Remedy Actions */}
                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            {detailedError.canResend && (
                              <button
                                type="button"
                                onClick={handleResend}
                                className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 text-[#001848] dark:text-white text-xs font-bold shadow-xs hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-700 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">send</span>
                                <span>Request new code</span>
                              </button>
                            )}
                            {detailedError.code === 'NETWORK_FAILURE' && (
                              <button
                                type="button"
                                onClick={() => void executeVerify(otp.join(''))}
                                className="px-2.5 py-1 rounded-full bg-[#005684] text-white text-xs font-bold shadow-xs hover:bg-[#004266] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#004266] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">refresh</span>
                                <span>Retry</span>
                              </button>
                            )}

                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6 Digit Input Cells */}
                  <div className={`flex items-center justify-between gap-2 transition-transform ${shakeInputs ? 'animate-shake' : ''}`}>
                    {otp.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={val}
                        disabled={lockoutCooldown !== null && lockoutCooldown > 0}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-11 sm:w-14 h-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl shadow-xs focus:outline-none transition-all duration-200 ease-in-out duration-150 ${
                          detailedError?.code === 'INVALID_CODE'
                            ? 'border border-[#A8452E] bg-rose-50/40 text-[#A8452E]'
                            : isNightShiftMode
                            ? 'bg-[#182840] text-white focus:bg-[#1f3350] focus:ring-2 focus:ring-[#3E9AD1]'
                            : 'bg-[#f2f3ff] text-[#001848] focus:bg-white focus:ring-2 focus:ring-[#005684]'
                        } ${lockoutCooldown !== null && lockoutCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer and Resend Actions */}
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isNightShiftMode ? 'bg-[#182840] border-[#233550]' : 'bg-[#f2f3ff] border-[rgba(11,37,89,0.06)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#dae2ff] dark:text-[#233550]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-[#005684] dark:text-[#3E9AD1]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray="100, 100"
                          strokeDashoffset={timerDashOffset}
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#001848] dark:text-white">
                        {lockoutCooldown ? 'Cooldown' : 'Resend in'}
                      </div>
                      <div className="text-xs font-bold text-[#005684] dark:text-[#93ccff] tabular-nums">
                        {lockoutCooldown
                          ? `00:${lockoutCooldown < 10 ? `0${lockoutCooldown}` : lockoutCooldown}`
                          : timeLeft > 0
                          ? formattedCountdown
                          : 'Ready'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={timeLeft > 0 || (lockoutCooldown !== null && lockoutCooldown > 0)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer ${
                      timeLeft === 0 && (!lockoutCooldown || lockoutCooldown === 0)
                        ? 'bg-[#005684] text-white hover:bg-[#0a6fa8] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0a6fa8]'
                        : 'bg-[#dae2ff] dark:bg-[#152438] text-[#404850] dark:text-[#c0c7d1] cursor-not-allowed opacity-60'
                    }`}
                  >
                    Resend Code
                  </button>
                </div>

                {/* Primary Submit Button */}
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isVerifying || (lockoutCooldown !== null && lockoutCooldown > 0)}
                    className={`w-full py-3.5 px-6 rounded-full text-sm font-bold shadow-md flex items-center justify-center gap-2 group transition-all duration-200 ease-in-out cursor-pointer ${
                      isVerified
                        ? 'bg-[#195b4c] text-white'
                        : lockoutCooldown && lockoutCooldown > 0
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-[#005684] hover:bg-[#0a6fa8] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0a6fa8] text-white'
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                        <span>Verifying...</span>
                      </>
                    ) : isVerified ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Confirmed! Proceeding...</span>
                      </>
                    ) : lockoutCooldown && lockoutCooldown > 0 ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                        <span>Locked for {lockoutCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <span>Verify &amp; Continue</span>
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[18px]">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
