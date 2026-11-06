import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { NursesPillowLogo } from './NursesPillowLogo';
import { ACTIVE_CLEARED_STATES } from '../data/mockData';
import { getStateName } from '../lib/constants/states';
import { ActiveStatesMap } from './ui/ActiveStatesMap';

interface FooterProps {
  isNightShiftMode: boolean;
  onOpenSupport: () => void;
  onSelectTab: (tab: any) => void;
  isDeveloper?: boolean;
  activeStates?: string[];
  currentTab?: string;
  userRole?: string;
}

export const Footer: React.FC<FooterProps> = ({
  isNightShiftMode,
  onOpenSupport,
  onSelectTab,
  isDeveloper = false,
  activeStates,
  currentTab = 'find-housing',
  userRole = 'guest',
}) => {
  const [hospitalCount, setHospitalCount] = useState<number>(0);
  useEffect(() => {
    Promise.resolve(db.getHospitals()).then(data => {
      setHospitalCount(data?.length || 0);
    }).catch(console.error);
  }, []);

  const effectiveActiveList = (activeStates || []).map(s => s.toUpperCase());

  const displayedStates = effectiveActiveList.map(code => {
    const matched = ACTIVE_CLEARED_STATES.find(s => s.code.toUpperCase() === code);
    return {
      code,
      name: matched?.name || getStateName(code),
      status: matched?.status || 'Cleared & Active',
    };
  });

  // Only render heavy Active State Coverage Map on public discovery/marketing tabs
  const publicDiscoveryTabs = ['find-housing', 'search-listings', 'how-it-works', 'for-hosts', 'verified-hospitals'];
  const shouldShowCoverageMap = publicDiscoveryTabs.includes(currentTab);

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

          {/* Column 1: Primary Navigation Column */}
          {userRole === 'host' ? (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Host Operations
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('host-dashboard')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left font-semibold cursor-pointer">
                    Host Sanctuary Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('host-onboarding')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Add Property Listing
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('for-hosts')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Furnishing &amp; Rest Standards
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('host-dashboard')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Host Identity &amp; Payout Setup
                  </button>
                </li>
              </ul>
            </div>
          ) : userRole === 'super_admin' || userRole === 'developer' || isDeveloper ? (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Operations &amp; Governance
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('admin-portal')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left font-semibold cursor-pointer">
                    Operations Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('admin-portal')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    States &amp; Housing Supply
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('admin-portal')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Credentialing License Queue
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('system-status')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    System Reliability &amp; Status
                  </button>
                </li>
              </ul>
            </div>
          ) : userRole === 'nurse' ? (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Travel Clinicians
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('nurse-dashboard')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left font-semibold cursor-pointer">
                    My Rotation Workspace
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('find-housing')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Hospital Proximity Search
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('search-listings')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    All Sanctuary Stays
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('verified-hospitals')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Cleared Teaching Hospitals
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('verification')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Clinician Credentialing
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Discovery &amp; Stays
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('find-housing')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Hospital Proximity Search
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('search-listings')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Explore Sanctuary Stays
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('how-it-works')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    How Nurses Pillow Works
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('verified-hospitals')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Cleared Hospital Directory
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('for-hosts')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Host a Travel Clinician
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Column 2: Secondary / Workspace Column */}
          {userRole === 'nurse' ? (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Clinician Workspace
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('messages')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer font-semibold">
                    Host Direct Messages
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('how-it-works')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Stipend &amp; Per Diem Guides
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('nurse-support')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    24/7 Shift Assistance
                  </button>
                </li>
              </ul>
            </div>
          ) : userRole === 'host' ? (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Host Resources
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('messages')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer font-semibold">
                    Clinician Inquiries
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('for-hosts')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Sanctuary Host Guarantees
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('system-status')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Platform Uptime &amp; Status
                  </button>
                </li>
              </ul>
            </div>
          ) : userRole === 'super_admin' || userRole === 'developer' || isDeveloper ? (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Admin Tools
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('messages')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer font-semibold">
                    Platform Messages
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#001848]'}`}>
                Hosts &amp; Community
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onSelectTab('for-hosts')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer font-semibold">
                    List Your Sanctuary ($0 Hold)
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('for-hosts')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Furnishing &amp; Rest Standards
                  </button>
                </li>
                <li>
                  <button onClick={() => onSelectTab('how-it-works')} className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer">
                    Safety &amp; Identity Standards
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Column 3: Platform Policies & Trust */}
          <div>
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                isNightShiftMode ? 'text-white' : 'text-[#001848]'
              }`}
            >
              Trust &amp; Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onSelectTab('legal-policies')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer"
                >
                  Cancellation &amp; Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('legal-policies')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer"
                >
                  Privacy Policy &amp; Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('system-status')}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer"
                >
                  System Reliability &amp; Status
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSupport}
                  className="hover:text-[#005684] focus-visible:text-[#005684] transition-colors text-left cursor-pointer"
                >
                  Clinical Help &amp; Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Multi-State Active Expansion Indicator (Rendered on public discovery tabs) */}
        {shouldShowCoverageMap && (
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
                  Hospital assignment search, nurse licensing/registry verification, and $0-hold furnished listings are currently live in {effectiveActiveList.length} cleared states. Expanding nationwide. Additional healthcare markets opening soon.
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
                {displayedStates.map((st) => (
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
                  activeStates={effectiveActiveList}
                />
              </div>
            </div>
          </div>
        )}

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
