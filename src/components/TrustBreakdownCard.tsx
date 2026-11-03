import React from 'react';

interface TrustBreakdownCardProps {
  isNightShiftMode?: boolean;
  clinicianName?: string;
  clinicianTitle?: string;
  verificationTimestamp?: string;
  stateBoard?: string;
  className?: string;
  titleBadge?: string;
  isVerified?: boolean;
  identityVerified?: boolean;
  phoneVerified?: boolean;
  licenseVerified?: boolean;
}

export const TrustBreakdownCard: React.FC<TrustBreakdownCardProps> = ({
  isNightShiftMode = false,
  clinicianName,
  clinicianTitle,
  verificationTimestamp = 'September 2026',
  stateBoard = 'State Board of Nursing',
  className = '',
  titleBadge,
  isVerified,
  identityVerified = false,
  phoneVerified = false,
  licenseVerified = false,
}) => {
  const isActuallyVerified = isVerified ?? (Boolean(identityVerified) && Boolean(phoneVerified) && Boolean(licenseVerified));

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 ease-in-out ${
        isNightShiftMode
          ? 'bg-[#101E33] border-[#223854] text-[#E6ECF7]'
          : 'bg-white border-[#d8e2ee] text-[#001848] shadow-sm'
      } ${className}`}
    >
      {/* Header: Status Pill Tag + Verification Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          {/* Status pill tag */}
          {isActuallyVerified ? (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-tight shadow-2xs"
              style={{ backgroundColor: '#E1EFE9', color: '#2F6E5E' }}
            >
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Nurses Pillow Verified</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-tight shadow-2xs"
              style={{ backgroundColor: '#FBF0D6', color: '#B9822E' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#B9822E]"></span>
              <span>Verification in Progress</span>
            </span>
          )}

          {titleBadge && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#0a6fa8]/10 text-[#005684] dark:bg-[#0a6fa8]/20 dark:text-[#93ccff]">
              {titleBadge}
            </span>
          )}
        </div>

        {/* Verification timestamp (Month, Year) */}
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#404850] dark:text-[#9bb3d3]">
          <span className="material-symbols-outlined text-[15px] text-[#0a6fa8] dark:text-[#93ccff]">
            event_available
          </span>
          <span>{isActuallyVerified ? `Verified: ${verificationTimestamp}` : 'Status: In Review'}</span>
        </div>
      </div>

      {clinicianName && (
        <div className="mt-2.5 mb-1 text-xs text-[#404850] dark:text-[#8ea5c8]">
          Primary Clinician Credential Audit:{' '}
          <strong className="text-[#001848] dark:text-white">{clinicianName}</strong>
          {clinicianTitle ? ` • ${clinicianTitle}` : ''}
        </div>
      )}

      {/* Itemized Verification Sources */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
        {/* Source 1: Identity (Stripe Identity) */}
        <div
          className={`relative p-3 rounded-xl border flex flex-col justify-between transition-colors overflow-hidden group ${
            isNightShiftMode
              ? 'bg-[#152740] border-[#223c60]'
              : 'bg-[#f7fafc] border-[#e2e8f0]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5 relative z-10">
            <div className="w-7 h-7 rounded-lg bg-[#005684]/10 dark:bg-[#005684]/25 flex items-center justify-center text-[#005684] dark:text-[#93ccff] shrink-0">
              <span className="material-symbols-outlined text-[17px]">badge</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
                Identity
              </span>
              <span className="text-xs font-bold text-[#001848] dark:text-[#E6ECF7]">
                Government RealID
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#404850] dark:text-[#9bb3d3] leading-snug relative z-10">
            {identityVerified
              ? 'Government RealID & biometric liveness match verified.'
              : 'Government RealID verification in progress.'}
          </p>
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none transform translate-x-2 translate-y-2">
            <span className="material-symbols-outlined text-[64px] text-[#0a6fa8] dark:text-[#93ccff]">how_to_reg</span>
          </div>
        </div>

        {/* Source 2: Mobile (Twilio SMS) */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
            isNightShiftMode
              ? 'bg-[#152740] border-[#223c60]'
              : 'bg-[#f7fafc] border-[#e2e8f0]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#005684]/10 dark:bg-[#005684]/25 flex items-center justify-center text-[#005684] dark:text-[#93ccff] shrink-0">
              <span className="material-symbols-outlined text-[17px]">phonelink_ring</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
                Mobile
              </span>
              <span className="text-xs font-bold text-[#001848] dark:text-[#E6ECF7]">
                SMS Verification
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#404850] dark:text-[#9bb3d3] leading-snug">
            {phoneVerified
              ? 'Carrier-authenticated OTP mobile line for shift alerts.'
              : 'Carrier mobile line pending OTP verification.'}
          </p>
        </div>

        {/* Source 3: Credential (Official Primary Source Registry & State) */}
        <div
          className={`relative p-3 rounded-xl border flex flex-col justify-between transition-colors overflow-hidden group ${
            isNightShiftMode
              ? 'bg-[#152740] border-[#223c60]'
              : 'bg-[#f7fafc] border-[#e2e8f0]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5 relative z-10">
            <div className="w-7 h-7 rounded-lg bg-[#2F6E5E]/15 dark:bg-[#2F6E5E]/30 flex items-center justify-center text-[#2F6E5E] dark:text-[#aff0db] shrink-0">
              <span className="material-symbols-outlined text-[17px]">health_and_safety</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
                Credential
              </span>
              <span className="text-xs font-bold text-[#001848] dark:text-[#E6ECF7]">
                {(() => {
                  if (!clinicianTitle) return 'Primary Source Registry';
                  const titleStr = clinicianTitle.toUpperCase();
                  if (titleStr.includes('CNA')) return 'State Nurse Aide Registry';
                  if (titleStr === 'PA' || titleStr.includes('PHYSICIAN ASSISTANT')) return 'State Medical Board';
                  if (titleStr === 'MD' || titleStr === 'DO' || titleStr.includes('PHYSICIAN (MD')) return 'FSMB DocInfo';
                  // ⚡ Bolt Performance Optimization: Single-pass checking
                  // Replaced array .some() with a single loop over predefined tokens
                  const nursingTokens = ['RN', 'LPN', 'LVN', 'NP', 'CRNA', 'CNM', 'APRN'];
                  let isNursing = false;
                  for (let i = 0; i < nursingTokens.length; i++) {
                    if (titleStr.includes(nursingTokens[i])) {
                      isNursing = true;
                      break;
                    }
                  }
                  if (!isNursing) return 'State Professional Registry';
                  return 'Primary Source Registry';
                })()}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#404850] dark:text-[#9bb3d3] leading-snug relative z-10">
            {licenseVerified || isActuallyVerified
              ? `Active, unencumbered standing with ${stateBoard}.`
              : `Standing with ${stateBoard} pending verification.`}
          </p>
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none transform translate-x-2 translate-y-2">
            <span className="material-symbols-outlined text-[64px] text-[#2F6E5E] dark:text-[#aff0db]">verified</span>
          </div>
        </div>
      </div>

      {/* Explicit Privacy Callout */}
      <div className="pt-2.5 mt-2 border-t border-black/5 dark:border-white/10 flex items-start gap-2 text-[11px] text-[#2F6E5E] dark:text-[#aff0db] leading-relaxed">
        <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5 text-[#2F6E5E] dark:text-[#aff0db]">
          lock
        </span>
        <span className="font-semibold">
          Identity documents and license numbers permanently purged post-verification.
        </span>
      </div>
    </div>
  );
};
