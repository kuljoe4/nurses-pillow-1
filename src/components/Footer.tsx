import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { NursesPillowLogo } from './NursesPillowLogo';
import { ACTIVE_CLEARED_STATES } from '../data/mockData';
import { ACTIVE_STATES } from '../lib/constants/states';
import { ActiveStatesMap } from './ui/ActiveStatesMap';

interface FooterProps {
  isNightShiftMode: boolean;
  onOpenSupport: () => void;
  onSelectTab: (tab: any) => void;
  isDeveloper?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  isNightShiftMode,
  onOpenSupport,
  onSelectTab,
  isDeveloper = false,
}) => {
  const [hospitalCount, setHospitalCount] = useState<number>(0);
  useEffect(() => {
    Promise.resolve(db.getHospitals()).then(data => {
      setHospitalCount(data?.length || 0);
    }).catch(console.error);
  }, []);

  return (
    <footer
      className={`w-full border-t transition-colors mt-auto ${
        isNightShiftMode
          ? 'bg-[#08101C] border-[#233550] text-[#9CB3D3]'
          : 'bg-[#EFF6FB] border-[rgba(11,37,89,0.08)] text-[#404850]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <NursesPillowLogo size={26} className="h-6 w-6" />
              <span
                className={`text-[20px] font-bold tracking-tight ${
                  isNightShiftMode ? 'text-white' : 'text-[#001848]'
                }`}
              >
                Nurses Pillow
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Sanctuary-grade housing built exclusively for verified healthcare professionals. $0 to list — pay only when booked.
            </p>

            {/* 24/7 Clinician Support badge */}
            <button
              onClick={onOpenSupport}
              type="button"
              className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-left transition-all duration-200 ease-in-out ${
                isNightShiftMode
                  ? 'bg-[#0E1A2E] border-[#233550] shadow-md hover:border-[#3E9AD1]'
                  : 'bg-white border-[rgba(11,37,89,0.08)] shadow-[0_4px_20px_rgba(11,37,89,0.06)] hover:border-[#0a6fa8]'
              }`}
            >
              <span className="material-symbols-outlined text-[#005684] dark:text-[#3E9AD1] text-[22px]">
                support_agent
              </span>
              <div>
                <div
                  className={`text-xs font-semibold ${
                    isNightShiftMode ? 'text-white' : 'text-[#001848]'
                  }`}
                >
                  Clinician Help &amp; Support
                </div>
                <div className="text-[11px] opacity-80 leading-none">
                  Shift assistance &amp; ticket portal
                </div>
              </div>
            </button>
          </div>

          {/* Column 1: Travel Nurses */}
          <div>
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                isNightShiftMode ? 'text-white' : 'text-[#001848]'
              }`}
            >
              Travel Nurses
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onSelectTab('find-housing')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Hospital Proximity Search
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('how-it-works')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Stipend &amp; Per Diem Guides
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('find-housing')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Shift-Friendly Housing
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('how-it-works')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Blackout Curtains Guarantee
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('how-it-works')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Quiet Hours Certification
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Hosts & Properties */}
          <div>
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                isNightShiftMode ? 'text-white' : 'text-[#001848]'
              }`}
            >
              Hosts &amp; Properties
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onSelectTab('for-hosts')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Host a Nurse
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('for-hosts')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Furnishing Standards Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('verification')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Safety &amp; ID Verification
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('for-hosts')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Contract Flex Protection
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('for-hosts')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Host Resource Center
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Sanctuary */}
          <div>
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                isNightShiftMode ? 'text-white' : 'text-[#001848]'
              }`}
            >
              Trust &amp; Sanctuary
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onSelectTab('how-it-works')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Safety Protocols
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('verified-hospitals')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left"
                >
                  Hospital Safe Badges
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('legal-policies')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] dark:hover:text-[#93ccff] focus-visible:text-[#93ccff] transition-colors text-left"
                >
                  Cancellation &amp; Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('legal-policies')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] dark:hover:text-[#93ccff] focus-visible:text-[#93ccff] transition-colors text-left"
                >
                  Privacy Policy &amp; Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('system-status')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] dark:hover:text-[#93ccff] focus-visible:text-[#93ccff] transition-colors text-left"
                >
                  Platform Reliability &amp; Status
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSupport}
                  className="hover:text-[#005684] focus-visible:text-[#005684] dark:hover:text-[#93ccff] focus-visible:text-[#93ccff] transition-colors text-left cursor-pointer"
                >
                  Help &amp; Clinical Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Multi-State Active Expansion Indicator (NC, MD, CT, ND, KS) */}
        <div
          className={`p-5 rounded-2xl border mb-10 transition-colors ${
            isNightShiftMode
              ? 'bg-[#0E1A2E] border-[#233550]'
              : 'bg-white border-[rgba(11,37,89,0.08)] shadow-[0_2px_12px_rgba(11,37,89,0.04)]'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <h4
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isNightShiftMode ? 'text-white' : 'text-[#001848]'
                  }`}
                >
                  Coverage Areas
                </h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hospital assignment search, nurse licensing/registry verification, and $0-hold furnished listings are currently live in 5 cleared states. Expanding nationwide. Additional healthcare markets opening soon.
              </p>
            </div>
            <button
              onClick={() => onSelectTab('verified-hospitals')}
              type="button"
              className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>{hospitalCount > 0 ? `View All ${hospitalCount}+ Cleared Hospitals` : 'View All Cleared Hospitals'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 flex-1">
              {ACTIVE_CLEARED_STATES.filter(st => ACTIVE_STATES.includes(st.code as any)).map((st) => (
                <button
                  key={st.code}
                  onClick={() => onSelectTab('find-housing')}
                  type="button"
                  className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between ${
                    isNightShiftMode
                      ? 'bg-[#15233a] border-[#233550] hover:border-[#3E9AD1]'
                      : 'bg-[#EFF6FB] border-[rgba(11,37,89,0.06)] hover:border-[#0A6FA8]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="font-extrabold text-sm text-[#0A6FA8] dark:text-[#3E9AD1]">
                        {st.code}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#142823] dark:text-[#aff0db]">
                      Live
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B2559] dark:text-white truncate">
                      {st.name}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {st.status}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full lg:w-80 xl:w-96 shrink-0">
              <ActiveStatesMap
                isNightShiftMode={isNightShiftMode}
                onSelectState={() => onSelectTab('find-housing')}
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isNightShiftMode ? 'border-[#233550]' : 'border-[rgba(11,37,89,0.08)]'
          }`}
        >
          <div className="text-sm">
            © 2026 Nurses Pillow Inc. All clinical housing verified.
          </div>
          <div
            className="text-[#745b0d] dark:text-[#E4C36D] text-[20px]"
            style={{ fontFamily: "'Kaushan Script', cursive" }}
          >
            Rest Well. Heal Better.
          </div>
        </div>
      </div>
    </footer>
  );
};
