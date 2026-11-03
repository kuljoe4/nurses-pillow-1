import React from 'react';

interface Milestone2ScopeGateProps {
  isNightShiftMode: boolean;
  featureTitle: string;
  featureDescription?: string;
  onReturnToMarketplace: () => void;
  onBypassGate?: () => void;
}

export const Milestone2ScopeGate: React.FC<Milestone2ScopeGateProps> = ({
  isNightShiftMode,
  featureTitle,
  featureDescription,
  onReturnToMarketplace,
  onBypassGate,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div
        className={`rounded-3xl p-6 sm:p-10 shadow-md border transition-all duration-200 ease-in-out ${
          isNightShiftMode
            ? 'bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]'
            : 'bg-white border-black/5 text-[#001848]'
        }`}
      >
        {/* Badge & Lock Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#745b0d]/20 text-[#745b0d] dark:text-[#ffdf91] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">lock_clock</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#ffdc84]/40 text-[#745b0d] dark:bg-[#745b0d]/30 dark:text-[#ffdf91]">
              <span className="material-symbols-outlined text-xs">event_upcoming</span>
              Upcoming Platform Release
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
              {featureTitle}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-[#404850] dark:text-[#8ea5c8] mb-6">
          {featureDescription ||
            'This enterprise module is scheduled for rollout in the upcoming platform release. All core housing discovery, clinical credential verification, and booking management features are fully active and production ready.'}
        </p>

        {/* Milestone Comparison Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* M1 Core Deliverables (Ready for Acceptance) */}
          <div
            className={`p-5 rounded-2xl border ${
              isNightShiftMode
                ? 'bg-[#15233a] border-[#233550]'
                : 'bg-[#f2f3ff] border-[#dae2ff]'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 text-[#195b4c] dark:text-[#aff0db] font-semibold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Milestone 1 Deliverables (Active & Ready)
            </div>
            <ul className="space-y-2 text-xs text-[#404850] dark:text-[#8ea5c8]">
              <li className="flex items-start gap-2">
                <span className="text-[#195b4c] font-bold">✓</span>
                <span>Hospital Proximity Search & Autocomplete (NC Duke, UNC, WakeMed)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#195b4c] font-bold">✓</span>
                <span>Clinician License Verification & Auto-Purge Privacy Guarantee</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#195b4c] font-bold">✓</span>
                <span>Transparent Itemized Checkout ($0 Deposit)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#195b4c] font-bold">✓</span>
                <span>Quiet Daytime Environment Multi-Room Listing Setup & Host Approvals</span>
              </li>
            </ul>
          </div>

          {/* M2 Deliverables (Next SOW Phase) */}
          <div
            className={`p-5 rounded-2xl border ${
              isNightShiftMode
                ? 'bg-[#15233a]/60 border-[#233550]'
                : 'bg-white border-black/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 text-[#745b0d] dark:text-[#ffdf91] font-semibold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Milestone 2 In-Flight Roadmap
            </div>
            <ul className="space-y-2 text-xs text-[#404850] dark:text-[#8ea5c8]">
              <li className="flex items-start gap-2">
                <span className="text-[#745b0d] font-bold">⏳</span>
                <span>Active Stay Dashboard & Keyless Entry Door Code Delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#745b0d] font-bold">⏳</span>
                <span>Real-Time Host-to-Clinician Direct Messaging Suite</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#745b0d] font-bold">⏳</span>
                <span>24/7 Ticketing Support Desk & Incident Resolution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#745b0d] font-bold">⏳</span>
                <span>Post-Stay Star Reviews & Verified Clinician Badging</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onReturnToMarketplace}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#0a6fa8] hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] text-white text-sm font-semibold transition-all duration-200 ease-in-out shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Return to Milestone 1 Marketplace</span>
          </button>

          {onBypassGate && (
            <button
              type="button"
              onClick={onBypassGate}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                isNightShiftMode
                  ? 'border-[#233550] text-[#93ccff] hover:bg-[#15233a] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#15233a]'
                  : 'border-[#dae2ff] text-[#005684] hover:bg-[#f2f3ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#f2f3ff]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Developer Preview: Inspect M2 Scaffold</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
