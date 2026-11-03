import React, { useState, useEffect, useRef } from 'react';
import { VerificationFormData, VerificationStepId } from '../types';
import { VerificationStepperNav } from './VerificationStepperNav';
import { twilioVerify } from '../services/twilioVerify';

interface ContactStepProps {
  data: VerificationFormData;
  onChange: (updates: Partial<VerificationFormData>) => void;
  onNextStep: () => void;
  onSelectStep: (step: VerificationStepId) => void;
  isNightShiftMode: boolean;
  onOpenPostmarkEmail?: () => void;
  onOpenTwilioOtp?: () => void;
}

export const ContactStep: React.FC<ContactStepProps> = ({
  data,
  onChange,
  onNextStep,
  onSelectStep,
  isNightShiftMode,
  onOpenPostmarkEmail,
  onOpenTwilioOtp,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Inline verification states
  const [verifyingEmailInline, setVerifyingEmailInline] = useState(false);
  const [inlineEmailPin, setInlineEmailPin] = useState('');
  const [inlineEmailMsg, setInlineEmailMsg] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [verifyingPhoneInline, setVerifyingPhoneInline] = useState(false);
  const [inlinePhonePin, setInlinePhonePin] = useState('');
  const [inlinePhoneMsg, setInlinePhoneMsg] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    if (errorMessage && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '').slice(0, 16);
    if (cleaned.length === 10 && !cleaned.startsWith('+')) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 3 && cleaned.length < 10 && !cleaned.startsWith('+')) {
       if (cleaned.length > 6) {
           return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
       }
       return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handleStartEmailVerify = async () => {
    const email = (data.workEmail || '').trim();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email first.');
      return;
    }
    setVerifyingEmailInline(true);
    setVerifyingPhoneInline(false);
    setInlineEmailMsg('Sending 6-digit verification code...');
    try {
      const res = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInlineEmailMsg(resData.error || 'Failed to send verification code.');
        if (resData.pin) {
          setInlineEmailMsg(`Preview PIN: ${resData.pin}`);
        }
      } else {
        setInlineEmailMsg(resData.pin ? `Verification code sent! (Preview PIN: ${resData.pin})` : `Verification code sent to ${email}`);
      }
    } catch (err) {
      setInlineEmailMsg('Network error contacting verification service.');
    }
  };

  const handleConfirmEmailPin = async () => {
    if (inlineEmailPin.trim().length !== 6) {
      setInlineEmailMsg('Please enter the 6-digit verification PIN.');
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.workEmail, pin: inlineEmailPin.trim() }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInlineEmailMsg(resData.error || 'Invalid verification PIN.');
      } else {
        onChange({ isContactVerified: true });
        setInlineEmailMsg('Email verified successfully!');
        setTimeout(() => {
          setVerifyingEmailInline(false);
          setInlineEmailPin('');
        }, 1200);
      }
    } catch (err) {
      setInlineEmailMsg('Verification failed. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleStartPhoneVerify = async () => {
    const rawPhone = (data.mobilePhone || '').replace(/[^\d+]/g, '');
    if (!rawPhone || rawPhone.length < 7) {
      setErrorMessage('Please enter a valid mobile phone number first.');
      return;
    }
    setVerifyingPhoneInline(true);
    setVerifyingEmailInline(false);
    setInlinePhoneMsg('Sending SMS verification code...');
    try {
      const dispatch = await twilioVerify.sendOtp(data.mobilePhone);
      setInlinePhoneMsg(dispatch.codeSent ? `SMS OTP sent! (Preview Code: ${dispatch.codeSent})` : `SMS verification code sent to ${data.mobilePhone}`);
    } catch (err) {
      setInlinePhoneMsg('Failed to send SMS verification code.');
    }
  };

  const handleConfirmPhonePin = async () => {
    if (inlinePhonePin.trim().length !== 6) {
      setInlinePhoneMsg('Please enter the 6-digit OTP code.');
      return;
    }
    setPhoneLoading(true);
    try {
      const result = await twilioVerify.verifyOtp(data.mobilePhone, inlinePhonePin.trim());
      if (!result.success) {
        setInlinePhoneMsg(result.message || 'Invalid verification code.');
      } else {
        onChange({ phoneVerified: true });
        setInlinePhoneMsg('Mobile phone verified successfully!');
        setTimeout(() => {
          setVerifyingPhoneInline(false);
          setInlinePhonePin('');
        }, 1200);
      }
    } catch (err) {
      setInlinePhoneMsg('Verification failed. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const validateInputs = (): string | null => {
    const email = (data.workEmail || '').trim();
    if (!email) {
      return 'Please enter your hospital or work email.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g. name@hospital.org).';
    }

    const rawPhone = (data.mobilePhone || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 7 || rawPhone.length > 15) {
      return 'Please enter a valid mobile phone number (7 to 15 digits).';
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateInputs();
    if (error) {
      setErrorMessage(error);
      return;
    }
    const isBothVerified = Boolean(data.isContactVerified && data.phoneVerified);
    const isProduction = import.meta.env.PROD;

    if (isProduction && !isBothVerified) {
      setErrorMessage("Please complete both email and phone verification before proceeding.");
      return;
    }

    setErrorMessage(null);

    onChange({
      workEmail: data.workEmail.trim(),
      mobilePhone: data.mobilePhone.trim(),
    });

    setTimeout(() => {
      onSelectStep(3);
    }, 300);
  };

  const isBothVerified = Boolean(data.isContactVerified && data.phoneVerified);
  const isPartiallyVerified = Boolean(data.isContactVerified || data.phoneVerified);

  return (
    <div
      className={`w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors ${
        isNightShiftMode ? 'bg-[#08101C]' : 'bg-[#EFF6FB]'
      }`}
    >
      {/* Stepper Navigation Bar */}
      <VerificationStepperNav
        currentStep={2}
        data={data}
        onSelectStep={onSelectStep}
        isNightShiftMode={isNightShiftMode}
      />

      {/* Main Card */}
      <div
        className={`max-w-2xl mx-auto rounded-3xl p-6 sm:p-8 shadow-sm transition-all ${
          isNightShiftMode
            ? 'bg-[#0B1626] border border-[#233550] text-[#E6ECF7]'
            : 'bg-white border border-[rgba(11,37,89,0.06)] text-[#0B2559]'
        }`}
      >
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FB] dark:bg-[#15233a] text-[#0A6FA8] dark:text-[#3E9AD1]">
              <span className="material-symbols-outlined text-[15px]">mark_email_read</span>
              Step 2 of 4 • Contact Information
            </span>

            {isBothVerified ? (
              <span className="text-xs font-bold text-[#2F6E5E] dark:text-[#aff0db] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Verified
              </span>
            ) : isPartiallyVerified ? (
              <span className="text-xs font-bold text-[#B9822E] dark:text-[#F1CF78] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                Partially Verified
              </span>
            ) : (
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">pending</span>
                Pending Verification
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-[#0B2559] dark:text-white">
            Hospital email &amp; direct mobile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Used strictly for check-in access, emergency shift notifications, and direct messaging with hosts.
          </p>
        </div>

        {errorMessage && (
          <div ref={errorRef} className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="workEmail" className="block text-sm font-semibold">
                Work / Health System Email *
              </label>
              {data.isContactVerified ? (
                <span className="text-xs font-bold text-[#2F6E5E] dark:text-[#aff0db] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEmailVerify}
                  className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline cursor-pointer"
                >
                  {verifyingEmailInline ? 'Resend Code' : 'Verify Email'}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="workEmail"
                type="email"
                required
                value={data.workEmail}
                onChange={(e) => {
                  setErrorMessage(null);
                  onChange({ workEmail: e.target.value });
                }}
                placeholder="name@hospital.org"
                className={`w-full rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A6FA8] ${
                  isNightShiftMode
                    ? 'bg-[#15233a] text-white border border-[#233550]'
                    : 'bg-[#EFF6FB] text-[#0B2559]'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                {data.isContactVerified ? (
                  <span className="material-symbols-outlined text-xl text-[#2F6E5E] dark:text-[#aff0db]">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-xl text-gray-400">
                    mail
                  </span>
                )}
              </div>
            </div>

            {/* Inline Email Verification Drawer */}
            {verifyingEmailInline && !data.isContactVerified && (
              <div className="mt-3 p-4 rounded-2xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">mark_email_read</span>
                    Enter 6-Digit Email Verification PIN
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerifyingEmailInline(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                {inlineEmailMsg && (
                  <p className="text-xs text-[#0B2559] dark:text-gray-200 font-medium bg-white/80 dark:bg-black/20 p-2 rounded-lg">
                    {inlineEmailMsg}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={inlineEmailPin}
                    onChange={(e) => setInlineEmailPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="flex-1 rounded-xl px-3 py-2 text-sm tracking-widest font-bold text-center bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6FA8]"
                  />
                  <button
                    type="button"
                    disabled={emailLoading || inlineEmailPin.length !== 6}
                    onClick={handleConfirmEmailPin}
                    className="px-4 py-2 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {emailLoading ? 'Verifying...' : 'Confirm PIN'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="mobilePhone" className="block text-sm font-semibold">
                Mobile Phone (SMS Enabled) *
              </label>
              {data.phoneVerified ? (
                <span className="text-xs font-bold text-[#2F6E5E] dark:text-[#aff0db] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleStartPhoneVerify}
                  className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline cursor-pointer"
                >
                  {verifyingPhoneInline ? 'Resend OTP' : 'Verify Phone'}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="mobilePhone"
                type="tel"
                required
                value={data.mobilePhone}
                onChange={(e) => {
                  setErrorMessage(null);
                  onChange({ mobilePhone: formatPhoneNumber(e.target.value) });
                }}
                placeholder="+1 (555) 000-0000"
                className={`w-full rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A6FA8] tabular-nums ${
                  isNightShiftMode
                    ? 'bg-[#15233a] text-white border border-[#233550]'
                    : 'bg-[#EFF6FB] text-[#0B2559]'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                {data.phoneVerified ? (
                  <span className="material-symbols-outlined text-xl text-[#2F6E5E] dark:text-[#aff0db]">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-xl text-gray-400">
                    smartphone
                  </span>
                )}
              </div>
            </div>

            {/* Inline Phone Verification Drawer */}
            {verifyingPhoneInline && !data.phoneVerified && (
              <div className="mt-3 p-4 rounded-2xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">sms</span>
                    Enter 6-Digit SMS Verification Code
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerifyingPhoneInline(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                {inlinePhoneMsg && (
                  <p className="text-xs text-[#0B2559] dark:text-gray-200 font-medium bg-white/80 dark:bg-black/20 p-2 rounded-lg">
                    {inlinePhoneMsg}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={inlinePhonePin}
                    onChange={(e) => setInlinePhonePin(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="flex-1 rounded-xl px-3 py-2 text-sm tracking-widest font-bold text-center bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6FA8]"
                  />
                  <button
                    type="button"
                    disabled={phoneLoading || inlinePhonePin.length !== 6}
                    onClick={handleConfirmPhonePin}
                    className="px-4 py-2 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {phoneLoading ? 'Verifying...' : 'Confirm Code'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real Status Card */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 border transition-colors ${
              data.phoneVerified
                ? isNightShiftMode
                  ? 'bg-[#15233a] border-[#233550]'
                  : 'bg-[#E1EFE9] border-[#2F6E5E]/20 text-[#0B2559]'
                : isNightShiftMode
                ? 'bg-[#15233a] border-[#3E9AD1]/30'
                : 'bg-[#EFF6FB] border-[#0A6FA8]/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  data.phoneVerified
                    ? 'bg-[#2F6E5E] text-white'
                    : 'bg-[#0A6FA8] text-white'
                }`}
              >
                <span className="material-symbols-outlined">
                  {data.phoneVerified ? 'verified_user' : 'sms'}
                </span>
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {data.phoneVerified
                    ? 'Mobile SMS Authentication Confirmed'
                    : 'Mobile SMS Verification Pending'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {data.phoneVerified
                    ? 'Your phone number is authenticated for check-in codes.'
                    : 'Verify via 6-digit SMS code to enable direct host messaging.'}
                </div>
              </div>
            </div>
            {data.phoneVerified ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2F6E5E] text-white shrink-0">
                Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={handleStartPhoneVerify}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white shrink-0 cursor-pointer"
              >
                Send Code
              </button>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Save &amp; continue</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSelectStep(1)}
                className="px-3 py-1.5 text-xs text-[#0A6FA8] dark:text-[#3E9AD1] font-semibold hover:underline cursor-pointer"
              >
                Back
              </button>
              {isBothVerified && (
                <button
                  type="button"
                  onClick={() => onSelectStep(3)}
                  className="px-3 py-1.5 text-xs text-[#0A6FA8] dark:text-[#3E9AD1] font-semibold hover:underline cursor-pointer"
                >
                  Continue to Step 3
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
