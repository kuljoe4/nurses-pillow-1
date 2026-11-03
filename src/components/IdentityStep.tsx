import React, { useState, useRef, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { VerificationFormData, VerificationStepId } from '../types';
import { VerificationStepperNav } from './VerificationStepperNav';

const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface IdentityStepProps {
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  data: VerificationFormData;
  onChange: (updates: Partial<VerificationFormData>) => void;
  onNextStep: () => void;
  onSelectStep: (step: VerificationStepId) => void;
  isNightShiftMode: boolean;
  onExit?: () => void;
  isHostVerified?: boolean;
}

export const IdentityStep: React.FC<IdentityStepProps> = ({
  data,
  onChange,
  onNextStep,
  onSelectStep,
  isNightShiftMode,
  onOpenAuth,
  onExit,
  isHostVerified,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHostVerified && !data.isIdVerified) {
       onChange({ isIdVerified: true });
       // Auto-redirect to Step 2 after short delay for better UX
       setTimeout(() => {
         onSelectStep(2);
       }, 500);
    }
  }, [isHostVerified, data.isIdVerified, onChange, onSelectStep]);

  useEffect(() => {
    if (verificationError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [verificationError]);

  const validateInputs = (): string | null => {
    const firstName = (data.legalFirstName || '').trim();
    if (!firstName || firstName.length < 2) {
      return 'Please enter your legal first name (minimum 2 characters).';
    }

    const lastName = (data.legalLastName || '').trim();
    if (!lastName || lastName.length < 2) {
      return 'Please enter your legal last name (minimum 2 characters).';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isHostVerified || data.isIdVerified) {
      if (data.legalFirstName && data.legalLastName) {
        onChange({
          isIdVerified: true,
          legalFirstName: data.legalFirstName.trim(),
          legalLastName: data.legalLastName.trim(),
        });
      }
      onSelectStep(2);
      return;
    }

    const validationMsg = validateInputs();
    if (validationMsg) {
      setVerificationError(validationMsg);
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const userEmail = localStorage.getItem('np_user_email') || data.workEmail;

      if (!token) {
        if (onOpenAuth) {
           onOpenAuth('signup');
        } else {
           throw new Error("Authorization Required: Please sign in or create an account.");
        }
        setIsVerifying(false);
        return;
      }

      // 1. Send data to /api/verify/identity to persist input first
      const res = await fetch('/api/verify/identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          legalFirstName: data.legalFirstName.trim(),
          legalLastName: data.legalLastName.trim(),
          email: userEmail,
        }),
      });

      const result = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
      if (!res.ok) {
        throw new Error(result.error || 'Verification validation failed.');
      }

      // 2. Fetch Stripe Identity Session
      const stripeRes = await fetch('/api/stripe/identity/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const stripeData = (stripeRes.headers.get('content-type')?.includes('application/json') ? await stripeRes.json() : {});
      if (!stripeRes.ok) {
         throw new Error(stripeData.error || 'Failed to initiate Stripe Identity Session.');
      }

      const stripe = await stripePromise;
      if (!stripe) {
         throw new Error('Stripe failed to load.');
      }


      // 3. Open Stripe Identity verification modal
      // Ensure that setting isIdVerified: true only happens after successful stripe check.
      // In non-production environments, mockups can fallback gracefully.
      const { error } = await stripe.verifyIdentity(stripeData.client_secret);

      if (error) {
         throw new Error(error.message || 'Stripe Identity verification failed.');
      }

      onChange({
        isIdVerified: true,
        legalFirstName: data.legalFirstName.trim(),
        legalLastName: data.legalLastName.trim(),
      });

      setTimeout(() => {
        onSelectStep(2);
      }, 300);
    } catch (err: any) {
      setVerificationError(err.message || 'Verification could not be completed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className={`w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors ${
        isNightShiftMode ? 'bg-[#08101C]' : 'bg-[#EFF6FB]'
      }`}
    >
      {/* Stepper Navigation Bar */}
      <VerificationStepperNav
        currentStep={1}
        data={data}
        onSelectStep={onSelectStep}
        isNightShiftMode={isNightShiftMode}
      />

      {/* Main Card */}
      <div
        className={`max-w-2xl mx-auto rounded-3xl p-6 sm:p-8 shadow-sm transition-all ${
          isNightShiftMode ? 'bg-[#0B1626] border border-[#233550] text-[#E6ECF7]' : 'bg-white border border-[rgba(11,37,89,0.06)] text-[#0B2559]'
        }`}
      >
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FB] dark:bg-[#15233a] text-[#0A6FA8] dark:text-[#3E9AD1]">
              <span className="material-symbols-outlined text-[15px]">badge</span>
              Step 1 of 3 • Identity
            </span>
            {data.isIdVerified ? (
              <span className="text-xs font-bold text-[#2F6E5E] dark:text-[#aff0db] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Verified
              </span>
            ) : (
              <span className="text-xs font-bold text-[#B9822E] dark:text-[#F1CF78] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                Pending Verification
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-[#0B2559] dark:text-white">
            Confirm your legal identity
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Verify your legal details to access clinician-exclusive rates and connect with host properties.
          </p>
        </div>

        {verificationError && (
          <div ref={errorRef} className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{verificationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Legal First Name *</label>
              <input
                type="text"
                required
                value={data.legalFirstName}
                onChange={(e) => {
                  setVerificationError(null);
                  onChange({ legalFirstName: e.target.value });
                }}
                placeholder="e.g. Sarah"
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A6FA8] ${
                  isNightShiftMode
                    ? 'bg-[#15233a] text-white border border-[#233550]'
                    : 'bg-[#EFF6FB] text-[#0B2559]'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Legal Last Name *</label>
              <input
                type="text"
                required
                value={data.legalLastName}
                onChange={(e) => {
                  setVerificationError(null);
                  onChange({ legalLastName: e.target.value });
                }}
                placeholder="e.g. Jenkins"
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A6FA8] ${
                  isNightShiftMode
                    ? 'bg-[#15233a] text-white border border-[#233550]'
                    : 'bg-[#EFF6FB] text-[#0B2559]'
                }`}
              />
            </div>
          </div>

          <div className="pt-2">
            {isHostVerified || data.isIdVerified ? (
              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                isNightShiftMode ? 'bg-[#142823] border-[#2F6E5E]/40 text-[#aff0db]' : 'bg-[#E1EFE9] border-[#2F6E5E]/30 text-[#2F6E5E]'
              }`}>
                <div className="mt-0.5 text-[#2F6E5E] dark:text-[#aff0db]">
                  <span className="material-symbols-outlined text-xl">verified_user</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1">Identity Verified via Host Verification (Stripe KYC)</h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    Your legal identity was already verified during host onboarding with Stripe KYC. You do not need to re-verify your ID. You can proceed directly to contact details and clinical licensing.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                isNightShiftMode ? 'bg-[#15233a] border-[#233550]' : 'bg-[#EFF6FB] border-[#0A6FA8]/20'
              }`}>
                <div className="mt-0.5 text-[#0A6FA8] dark:text-[#3E9AD1]">
                  <span className="material-symbols-outlined text-xl">shield_person</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1 text-[#0B2559] dark:text-white">Secure Identity Verification</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Upon continuing, you will be redirected to our secure partner, <strong>Stripe Identity</strong>. You will be asked to securely upload a government-issued photo ID and take a real-time selfie. We do not store your documents.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={isVerifying}
              className="px-6 py-2.5 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span>{isVerifying ? 'Verifying legal identity...' : (isHostVerified || data.isIdVerified ? 'Continue to Step 2 (Contact)' : 'Save & continue')}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            {(data.isIdVerified || isHostVerified) && (
              <button
                type="button"
                onClick={() => onSelectStep(2)}
                className="px-3 py-1.5 text-xs text-[#0A6FA8] dark:text-[#3E9AD1] font-semibold hover:underline cursor-pointer"
              >
                Skip to Step 2 →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
