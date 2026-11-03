import React from 'react';
import { VerificationFormData, VerificationStepId } from '../types';

interface VerificationStepperNavProps {
  currentStep: VerificationStepId;
  data: VerificationFormData;
  onSelectStep: (step: VerificationStepId) => void;
  isNightShiftMode: boolean;
}

export const VerificationStepperNav: React.FC<VerificationStepperNavProps> = ({
  currentStep,
  data,
  onSelectStep,
  isNightShiftMode,
}) => {
  // Real step completion statuses based on database and form state
  const isStep1Verified = Boolean(data.isIdVerified);
  const isStep2Verified = Boolean(data.phoneVerified && data.isContactVerified);
  const isStep2Partial = Boolean(data.phoneVerified || data.isContactVerified) && !isStep2Verified;
  const isStep3Verified = data.licenseStatus === 'verified';
  const isStep3Pending = data.licenseStatus === 'pending_review';

  const steps: {
    id: VerificationStepId;
    label: string;
    isVerified: boolean;
    isPending?: boolean;
  }[] = [
    { id: 1, label: 'Identity', isVerified: isStep1Verified },
    { id: 2, label: 'Email & Phone', isVerified: isStep2Verified, isPending: isStep2Partial },
    { id: 3, label: 'Clinical License', isVerified: isStep3Verified, isPending: isStep3Pending },
  ];

  return (
    <div className="max-w-3xl mx-auto mb-8">
      <div
        className={`rounded-full p-2 shadow-xs transition-colors ${
          isNightShiftMode
            ? 'bg-[#0E1A2E] border border-[#233550]'
            : 'bg-white border border-[rgba(11,37,89,0.06)]'
        }`}
      >
        <div className={`grid grid-cols-${steps.length} items-center gap-1.5 sm:gap-2`}>
          {steps.map((step) => {
            const isActive = currentStep === step.id;

            const isProduction = import.meta.env.PROD;
            // Can only navigate to this step if it's the current step, or it's verified,
            // or the directly preceding step is completely verified.
            let canNavigate = false;
            if (isActive || step.isVerified || step.isPending) {
              canNavigate = true;
            } else if (step.id === 1) {
              canNavigate = true; // Step 1 is always accessible
            } else {
              // Check if previous step is verified
              const prevStep = steps.find(s => s.id === step.id - 1);
              if (prevStep?.isVerified) {
                canNavigate = true;
              }
            }

            // In production, strictly enforce sequential completion
            if (isProduction) {
              for (let i = 0; i < steps.indexOf(step); i++) {
                if (!steps[i].isVerified) {
                  canNavigate = false;
                  break;
                }
              }
            }

            const handleClick = () => {
              if (canNavigate) {
                onSelectStep(step.id);
              }
            };

            if (isActive) {
              return (
                <button
                  key={step.id}
                  onClick={handleClick}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#0A6FA8] text-white text-left cursor-pointer transition-colors shadow-xs"
                >
                  <span className="w-6 h-6 rounded-full bg-white text-[#0A6FA8] font-bold text-xs flex items-center justify-center shrink-0">
                    {step.id}
                  </span>
                  <span className="text-xs font-bold truncate hidden sm:inline">{step.label}</span>
                </button>
              );
            }

            if (step.isVerified) {
              return (
                <button
                  key={step.id}
                  onClick={handleClick}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#142823] dark:text-[#aff0db] text-left cursor-pointer transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-[#2F6E5E] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </span>
                  <span className="text-xs font-bold truncate hidden sm:inline">{step.label}</span>
                </button>
              );
            }

            if (step.isPending) {
              return (
                <button
                  key={step.id}
                  onClick={handleClick}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#FBF0D6] text-[#B9822E] dark:bg-[#2b2413] dark:text-[#F1CF78] text-left cursor-pointer transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-[#B9822E] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {step.id}
                  </span>
                  <span className="text-xs font-bold truncate hidden sm:inline">{step.label}</span>
                </button>
              );
            }

            return (
              <button
                key={step.id}
                onClick={handleClick}
                disabled={!canNavigate}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-left transition-colors ${
                  canNavigate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                } ${
                  isNightShiftMode
                    ? 'bg-[#15233a] text-gray-400 hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:text-[#0B2559]'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 font-bold text-xs flex items-center justify-center shrink-0">
                  {step.id}
                </span>
                <span className="text-xs font-medium truncate hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
