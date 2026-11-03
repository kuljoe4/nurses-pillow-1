import React, { useState, useRef, useEffect } from 'react';
import { NavigationTab, VerificationStepId, UserRole } from '../types';

export interface BreadcrumbsProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isNightShiftMode: boolean;
  verificationStep?: VerificationStepId;
  onSelectVerificationStep?: (step: VerificationStepId) => void;
  searchHospital?: string;
  currentUserRole?: UserRole;
  showScreenCodes?: boolean;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

interface CrumbItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  onClick?: () => void;
  isCurrent?: boolean;
  badge?: string;
}

interface CrumbTooltipProps {
  label: string;
  badge?: string;
  align?: 'left' | 'center' | 'right';
  disabled?: boolean;
  children: React.ReactNode;
  isNightShiftMode: boolean;
}

const CrumbTooltip: React.FC<CrumbTooltipProps> = ({
  label,
  badge,
  align = 'center',
  disabled = false,
  children,
  isNightShiftMode,
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  const alignClasses =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  const caretClasses =
    align === 'left'
      ? 'left-3'
      : align === 'right'
      ? 'right-3'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div className="relative group/crumb inline-flex items-center">
      {children}
      {/* Tooltip Card with rich path and clarity metadata */}
      <div
        role="tooltip"
        className={`pointer-events-none absolute top-full mt-2 ${alignClasses} hidden group-hover/crumb:flex group-focus-within/crumb:flex flex-col z-50 w-max max-w-[280px] sm:max-w-xs p-2.5 rounded-xl shadow-lg border text-left transition-all duration-200 ease-in-out duration-150 animate-in fade-in-0 zoom-in-95 ${
          isNightShiftMode
            ? 'bg-[#0E1A2E]/95 backdrop-blur-md border-[#233550] text-[#E6ECF7] shadow-black/60'
            : 'bg-[#001848]/95 backdrop-blur-md border-[rgba(255,255,255,0.15)] text-white shadow-md shadow-blue-950/20'
        }`}
      >
        {/* Upward Caret */}
        <div
          className={`absolute -top-1 ${caretClasses} w-2 h-2 rotate-45 border-t border-l ${
            isNightShiftMode
              ? 'bg-[#0E1A2E] border-[#233550]'
              : 'bg-[#001848] border-[rgba(255,255,255,0.15)]'
          }`}
          aria-hidden="true"
        />

        {/* Header: Segment Title & Badges */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="font-bold text-xs leading-snug">{label}</span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-semibold shrink-0">
              {badge}
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentTab,
  onSelectTab,
  isNightShiftMode,
  verificationStep = 1,
  onSelectVerificationStep,
  searchHospital,
  currentUserRole = 'nurse',
  showScreenCodes = false,
  onGoBack,
  canGoBack = false,
}) => {
  const [isEllipsisOpen, setIsEllipsisOpen] = useState(false);
  const ellipsisMenuRef = useRef<HTMLDivElement>(null);

  // Close ellipsis menu on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ellipsisMenuRef.current && !ellipsisMenuRef.current.contains(event.target as Node)) {
        setIsEllipsisOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsEllipsisOpen(false);
      }
    }
    if (isEllipsisOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEllipsisOpen]);

  // Reset ellipsis menu on tab or step change
  useEffect(() => {
    setIsEllipsisOpen(false);
  }, [currentTab, verificationStep]);

  // Hide breadcrumbs on top-level pages and during verification stepper
  // to avoid redundancy and reclaim prime vertical space
  const isTopLevelPage =
    currentTab === 'find-housing' ||
    currentTab === 'search-listings' ||
    currentTab === 'how-it-works' ||
    currentTab === 'for-hosts' ||
    currentTab === 'nurse-dashboard' ||
    currentTab === 'verification' ||
    currentTab === 'email-verification' ||
    currentTab === 'phone-verification';

  if (isTopLevelPage) {
    return null;
  }

  const navigateTo = (tab: NavigationTab) => {
    onSelectTab(tab);
  };

  const getVerificationStepTitle = (step: VerificationStepId) => {
    switch (step) {
      case 1:
        return 'Step 1: Identity & Legal Name';
      case 2:
        return 'Step 2: Contact & Auth';
      case 3:
        return 'Step 3: Primary Source Clinical License';
    }
  };

  // Build the hierarchical trail items based on currentTab
  const buildTrail = (): CrumbItem[] => {
    const homeCrumb: CrumbItem = {
      id: 'home',
      label: 'Home',
      icon: 'home',
      onClick: () => navigateTo('find-housing'),
    };

    switch (currentTab as NavigationTab) {
      case 'search-listings': {
        const items: CrumbItem[] = [
          homeCrumb,
          {
            id: 'search-root',
            label: 'Sanitized Housing Search',
            shortLabel: 'Search',
            icon: 'travel_explore',
            isCurrent: !searchHospital,
            onClick: searchHospital ? () => navigateTo('search-listings') : undefined,
          },
        ];
        if (searchHospital) {
          items.push({
            id: 'hospital-filter',
            label: searchHospital,
            icon: 'local_hospital',
            isCurrent: true,
          });
        }
        return items;
      }

      case 'verification': {
        return [
          homeCrumb,
          {
            id: 'credentialing',
            label: 'Clinician Credentialing',
            shortLabel: 'Credentialing',
            icon: 'verified_user',
            onClick: () => {
              navigateTo('verification');
              onSelectVerificationStep?.(1);
            },
          },
          {
            id: `step-${verificationStep}`,
            label: getVerificationStepTitle(verificationStep),
            icon: 'badge',
            badge: `Step ${verificationStep} of 4`,
            isCurrent: true,
          },
        ];
      }

      case 'email-verification': {
        return [
          homeCrumb,
          {
            id: 'credentialing',
            label: 'Clinician Credentialing',
            shortLabel: 'Credentialing',
            icon: 'verified_user',
            onClick: () => {
              navigateTo('verification');
              onSelectVerificationStep?.(2);
            },
          },
          {
            id: 'email-verify',
            label: 'Institutional Email Verification',
            shortLabel: 'Email Verification',
            icon: 'mark_email_read',
            isCurrent: true,
          },
        ];
      }

      case 'phone-verification': {
        return [
          homeCrumb,
          {
            id: 'credentialing',
            label: 'Clinician Credentialing',
            shortLabel: 'Credentialing',
            icon: 'verified_user',
            onClick: () => {
              navigateTo('verification');
              onSelectVerificationStep?.(2);
            },
          },
          {
            id: 'phone-verify',
            label: 'Mobile Phone Verification',
            shortLabel: 'Phone Verification',
            icon: 'sms',
            isCurrent: true,
          },
        ];
      }

      case 'nurse-dashboard': {
        return [
          homeCrumb,
          {
            id: 'clinician-portal',
            label: 'Clinician Workspace',
            shortLabel: 'Clinician',
            icon: 'clinical_notes',
          },
          {
            id: 'nurse-dashboard-current',
            label: 'My Bookings & Verified Profile',
            shortLabel: 'My Bookings',
            icon: 'inventory_2',
            isCurrent: true,
          },
        ];
      }

      case 'host-dashboard': {
        return [
          homeCrumb,
          {
            id: 'host-portal',
            label: 'Property Host Hub',
            shortLabel: 'Host Hub',
            icon: 'apartment',
          },
          {
            id: 'host-dashboard-current',
            label: 'Sanctuary Listings & Reservation Requests',
            shortLabel: 'Listings & Requests',
            icon: 'home_work',
            isCurrent: true,
          },
        ];
      }

      case 'host-onboarding': {
        return [
          homeCrumb,
          {
            id: 'host-portal',
            label: 'Property Host Hub',
            shortLabel: 'Host Hub',
            icon: 'apartment',
            onClick: () => navigateTo('host-dashboard'),
          },
          {
            id: 'host-onboarding-current',
            label: 'List a Clinician Sanctuary',
            shortLabel: 'New Sanctuary',
            icon: 'add_home_work',
            isCurrent: true,
          },
        ];
      }

      case 'admin-portal': {
        return [
          homeCrumb,
          {
            id: 'admin-root',
            label: 'Operations Portal',
            shortLabel: 'Operations',
            icon: 'admin_panel_settings',
          },
          {
            id: 'admin-queue',
            label: 'Primary Source License Verification Queue',
            shortLabel: 'License Queue',
            icon: 'fact_check',
            isCurrent: true,
          },
        ];
      }

      case 'verified-hospitals': {
        return [
          homeCrumb,
          {
            id: 'healthcare-directory',
            label: 'Healthcare Directory',
            shortLabel: 'Directory',
            icon: 'domain',
          },
          {
            id: 'hospitals-current',
            label: 'NC Trauma Centers & Verified Teaching Hospitals',
            shortLabel: 'Verified Hospitals',
            icon: 'local_hospital',
            isCurrent: true,
          },
        ];
      }

      case 'how-it-works': {
        return [
          homeCrumb,
          {
            id: 'resources',
            label: 'Platform Resources',
            icon: 'auto_stories',
          },
          {
            id: 'how-it-works-current',
            label: 'How Nurses Pillow Works',
            shortLabel: 'How It Works',
            icon: 'psychology_alt',
            isCurrent: true,
          },
        ];
      }

      case 'for-hosts': {
        return [
          homeCrumb,
          {
            id: 'resources',
            label: 'Host Resources',
            icon: 'real_estate_agent',
          },
          {
            id: 'for-hosts-current',
            label: 'Sanctuary Host Standards & Guarantees',
            shortLabel: 'Host Standards',
            icon: 'shield_lock',
            isCurrent: true,
          },
        ];
      }

      case 'nurse-support': {
        return [
          homeCrumb,
          {
            id: 'resources',
            label: 'Clinician Support',
            icon: 'support_agent',
          },
          {
            id: 'support-current',
            label: '24/7 Clinical Support Hotline & Dispatch',
            shortLabel: '24/7 Support',
            icon: 'headset_mic',
            isCurrent: true,
          },
        ];
      }

      case 'legal-policies': {
        return [
          homeCrumb,
          {
            id: 'compliance',
            label: 'Standards & Reliability',
            icon: 'policy',
          },
          {
            id: 'policies-current',
            label: 'Sanctuary Standards, Cancellation & Terms',
            shortLabel: 'Legal & Policies',
            icon: 'gavel',
            isCurrent: true,
          },
        ];
      }

      case 'system-status': {
        return [
          homeCrumb,
          {
            id: 'compliance',
            label: 'Standards & Reliability',
            icon: 'policy',
          },
          {
            id: 'status-current',
            label: 'Platform Reliability & Live Health',
            shortLabel: 'System Status',
            icon: 'dns',
            isCurrent: true,
          },
        ];
      }

      case 'phase1-inventory': {
        return [
          homeCrumb,
          {
            id: 'dev-workspace',
            label: 'Platform Architecture',
            shortLabel: 'Architecture',
            icon: 'terminal',
          },
          {
            id: 'inventory-current',
            label: 'Phase 1 Master Screen Inventory & Scope Navigator',
            shortLabel: 'Screen Inventory',
            icon: 'integration_instructions',
            isCurrent: true,
          },
        ];
      }

      case 'mobile-preview': {
        return [
          homeCrumb,
          {
            id: 'dev-workspace',
            label: 'Platform Architecture',
            shortLabel: 'Architecture',
            icon: 'terminal',
            onClick: () => navigateTo('phase1-inventory'),
          },
          {
            id: 'mobile-preview-current',
            label: 'Native Mobile App Preview',
            shortLabel: 'Mobile Preview',
            icon: 'smartphone',
            isCurrent: true,
          },
        ];
      }

      default:
        return [
          homeCrumb,
          {
            id: 'current',
            label: 'Application View',
            isCurrent: true,
          },
        ];
    }
  };

  const trail = buildTrail();
  const firstCrumb = trail[0];
  const lastCrumb = trail[trail.length - 1];
  const middleCrumbs = trail.slice(1, -1);

  return (
    <div
      id="content-breadcrumb-nav"
      className={`w-full border-b transition-colors z-20 ${
        isNightShiftMode
          ? 'bg-[#091322]/90 border-[#1c2c44] text-[#a1b5d8]'
          : 'bg-[#faf8ff] border-[rgba(11,37,89,0.06)] text-gray-500'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Left Side: Back Shortcut & Trail */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back Button */}
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                isNightShiftMode
                  ? 'text-[#93ccff] hover:text-white hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840]'
                  : 'text-[#005684] hover:text-[#001848] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
              }`}
              title="Return to previous screen"
              aria-label="Navigate to previous screen"
            >
              <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">
                arrow_back
              </span>
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {onGoBack && (
            <div
              className={`h-4 w-px shrink-0 ${
                isNightShiftMode ? 'bg-[#233550]' : 'bg-gray-200'
              }`}
              aria-hidden="true"
            />
          )}

          {/* Breadcrumb Navigation Trail */}
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            {/* Mobile View (< sm): Truncates middle segments into an interactive ellipsis if trail has > 2 segments */}
            <ol className="flex sm:hidden items-center flex-nowrap gap-1 whitespace-nowrap text-xs">
              {/* Root / Home Crumb */}
              {firstCrumb && (
                <li className="flex items-center gap-1 shrink-0">
                  <CrumbTooltip
                    label={firstCrumb.label}
                    align="left"
                    isNightShiftMode={isNightShiftMode}
                  >
                    {firstCrumb.onClick ? (
                      <button
                        type="button"
                        onClick={firstCrumb.onClick}
                        className={`flex items-center gap-1 font-medium transition-colors cursor-pointer group ${
                          isNightShiftMode
                            ? 'text-[#a1b5d8] hover:text-[#93ccff] focus-visible:text-[#93ccff]'
                            : 'text-gray-600 hover:text-[#005684] focus-visible:text-[#005684]'
                        }`}
                      >
                        {firstCrumb.icon && (
                          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                            {firstCrumb.icon}
                          </span>
                        )}
                        <span className="group-hover:underline underline-offset-2">{firstCrumb.shortLabel || firstCrumb.label}</span>
                      </button>
                    ) : (
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          isNightShiftMode ? 'text-[#6e85a6]' : 'text-gray-400'
                        }`}
                      >
                        {firstCrumb.icon && (
                          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                            {firstCrumb.icon}
                          </span>
                        )}
                        <span>{firstCrumb.shortLabel || firstCrumb.label}</span>
                      </span>
                    )}
                  </CrumbTooltip>
                </li>
              )}

              {/* Separator after root */}
              {trail.length > 1 && (
                <li aria-hidden="true" className="shrink-0 flex items-center">
                  <span
                    className={`material-symbols-outlined text-[14px] select-none ${
                      isNightShiftMode ? 'text-[#385175]' : 'text-gray-300'
                    }`}
                  >
                    chevron_right
                  </span>
                </li>
              )}

              {/* Middle Segments Collapsed into Ellipsis on Mobile */}
              {middleCrumbs.length > 0 && (
                <li className="relative shrink-0 flex items-center gap-1">
                  <CrumbTooltip
                    label={`Collapsed Steps (${middleCrumbs.length})`}
                    align="center"
                    disabled={isEllipsisOpen}
                    isNightShiftMode={isNightShiftMode}
                  >
                    <button
                      type="button"
                      onClick={() => setIsEllipsisOpen(!isEllipsisOpen)}
                      className={`px-1.5 py-0.5 rounded-md font-bold text-xs flex items-center justify-center transition-colors cursor-pointer border ${
                        isNightShiftMode
                          ? 'bg-[#182840] hover:bg-[#203656] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#203656] text-[#93ccff] border-[#233550]'
                          : 'bg-gray-100 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-200 text-gray-700 border-gray-200'
                      }`}
                      aria-expanded={isEllipsisOpen}
                      aria-haspopup="menu"
                      aria-label={`Show ${middleCrumbs.length} collapsed breadcrumb segments: ${middleCrumbs.map((c) => c.label).join(' › ')}`}
                      title={`Show ${middleCrumbs.length} collapsed segments: ${middleCrumbs.map((c) => c.label).join(' › ')}`}
                    >
                      <span className="material-symbols-outlined text-[15px] leading-none" aria-hidden="true">
                        more_horiz
                      </span>
                    </button>
                  </CrumbTooltip>

                  {/* Dropdown Popover for Collapsed Intermediate Segments */}
                  {isEllipsisOpen && (
                    <div
                      ref={ellipsisMenuRef}
                      role="menu"
                      className={`absolute left-0 top-full mt-1.5 min-w-[180px] max-w-xs max-h-60 overflow-y-auto overscroll-contain custom-scrollbar rounded-xl shadow-lg border p-1.5 z-50 text-xs space-y-1 ${
                        isNightShiftMode
                          ? 'bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]'
                          : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Intermediate Path Segments
                      </div>
                      {middleCrumbs.map((crumb) => (
                        <button
                          key={crumb.id}
                          role="menuitem"
                          type="button"
                          onClick={() => {
                            setIsEllipsisOpen(false);
                            crumb.onClick?.();
                          }}
                          disabled={!crumb.onClick}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                            crumb.onClick
                              ? isNightShiftMode
                                ? 'hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] text-[#93ccff] cursor-pointer'
                                : 'hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff] text-[#005684] cursor-pointer'
                              : 'text-gray-400 cursor-default'
                          }`}
                        >
                          {crumb.icon && (
                            <span className="material-symbols-outlined text-[15px] shrink-0" aria-hidden="true">
                              {crumb.icon}
                            </span>
                          )}
                          <span className="truncate flex-1 font-medium">{crumb.shortLabel || crumb.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Separator after Ellipsis */}
                  <span
                    className={`material-symbols-outlined text-[14px] select-none ${
                      isNightShiftMode ? 'text-[#385175]' : 'text-gray-300'
                    }`}
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                </li>
              )}

              {/* Active / Current Page Crumb on Mobile */}
              {lastCrumb && trail.length > 1 && (
                <li className="flex items-center gap-1 shrink-0 min-w-0 font-bold" aria-current="page">
                  <CrumbTooltip
                    label={lastCrumb.label}
                    badge={lastCrumb.badge}
                    align="right"
                    isNightShiftMode={isNightShiftMode}
                  >
                    <div
                      className={`flex items-center gap-1 font-bold truncate cursor-default ${
                        isNightShiftMode ? 'text-white' : 'text-[#001848]'
                      }`}
                    >
                      {lastCrumb.icon && (
                        <span
                          className={`material-symbols-outlined text-[15px] shrink-0 ${
                            isNightShiftMode ? 'text-[#93ccff]' : 'text-[#005684]'
                          }`}
                          aria-hidden="true"
                        >
                          {lastCrumb.icon}
                        </span>
                      )}
                      <span className="truncate max-w-[130px] xs:max-w-[190px]">
                        {lastCrumb.shortLabel || lastCrumb.label}
                      </span>

                      {lastCrumb.badge && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                            isNightShiftMode
                              ? 'bg-[#182840] text-[#93ccff] border border-[#233550]'
                              : 'bg-[#eaedff] text-[#005684]'
                          }`}
                        >
                          {lastCrumb.badge}
                        </span>
                      )}
                    </div>
                  </CrumbTooltip>
                </li>
              )}
            </ol>

            {/* Desktop View (sm:flex): Full Expanded Breadcrumb Trail */}
            <ol className="hidden sm:flex items-center flex-wrap gap-1 sm:gap-1.5 whitespace-nowrap text-xs">
              {trail.map((crumb, index) => {
                const isLast = index === trail.length - 1;

                return (
                  <li key={crumb.id} className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {index > 0 && (
                      <span
                        className={`material-symbols-outlined text-[14px] select-none ${
                          isNightShiftMode ? 'text-[#385175]' : 'text-gray-300'
                        }`}
                        aria-hidden="true"
                      >
                        chevron_right
                      </span>
                    )}

                    <CrumbTooltip
                      label={crumb.label}
                      badge={crumb.badge}
                      align={index === 0 ? 'left' : isLast ? 'right' : 'center'}
                      isNightShiftMode={isNightShiftMode}
                    >
                      {isLast ? (
                        <div
                          className={`flex items-center gap-1 sm:gap-1.5 font-bold cursor-default ${
                            isNightShiftMode ? 'text-white' : 'text-[#001848]'
                          }`}
                          aria-current="page"
                        >
                          {crumb.icon && (
                            <span
                              className={`material-symbols-outlined text-[15px] ${
                                isNightShiftMode ? 'text-[#93ccff]' : 'text-[#005684]'
                              }`}
                              aria-hidden="true"
                            >
                              {crumb.icon}
                            </span>
                          )}
                          <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                            {crumb.label}
                          </span>

                          {crumb.badge && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                isNightShiftMode
                                  ? 'bg-[#182840] text-[#93ccff] border border-[#233550]'
                                  : 'bg-[#eaedff] text-[#005684]'
                              }`}
                            >
                              {crumb.badge}
                            </span>
                          )}
                        </div>
                      ) : crumb.onClick ? (
                        <button
                          type="button"
                          onClick={crumb.onClick}
                          className={`flex items-center gap-1 font-medium transition-colors cursor-pointer group ${
                            isNightShiftMode
                              ? 'text-[#a1b5d8] hover:text-[#93ccff] focus-visible:text-[#93ccff]'
                              : 'text-gray-600 hover:text-[#005684] focus-visible:text-[#005684]'
                          }`}
                        >
                          {crumb.icon && (
                            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                              {crumb.icon}
                            </span>
                          )}
                          <span className="group-hover:underline underline-offset-2">{crumb.label}</span>
                        </button>
                      ) : (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            isNightShiftMode ? 'text-[#6e85a6]' : 'text-gray-400'
                          }`}
                        >
                          {crumb.icon && (
                            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                              {crumb.icon}
                            </span>
                          )}
                          <span>{crumb.label}</span>
                        </span>
                      )}
                    </CrumbTooltip>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
};
