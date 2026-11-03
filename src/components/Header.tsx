import React, { useState, useEffect, useRef } from 'react';
import { NavigationTab, UserRole, BookingRequest } from '../types';
import { NursesPillowLogo } from './NursesPillowLogo';

interface HeaderProps {
  topBanner?: React.ReactNode;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  savedCount: number;
  onOpenSaved: () => void;
  isNightShiftMode: boolean;
  onToggleNightShift: () => void;
  onOpenSupport: () => void;
  isVerified: boolean;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  currentUser: { role: UserRole; name: string; verificationStatus?: string };
  isDeveloper?: boolean;
  onLogout?: () => void;
  activeBooking?: BookingRequest | null;
  onOpenBookingDetail?: (booking: BookingRequest) => void;
  onSwitchRole?: (role: UserRole) => void;
  isNurseVerified?: boolean;
  isHostVerified?: boolean;
  verificationStatus?: string;
}

export const LOGO_URL = '/nurses-pillow-logo.png';

export const Header: React.FC<HeaderProps> = ({
  topBanner,
  currentTab,
  onSelectTab,
  savedCount,
  onOpenSaved,
  isNightShiftMode,
  onToggleNightShift,
  onOpenSupport,
  isVerified,
  onOpenAuth,
  currentUser,
  isDeveloper = false,
  onLogout,
  activeBooking,
  onOpenBookingDetail,
  onSwitchRole,
  isNurseVerified,
  isHostVerified,
  verificationStatus,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(72);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Track dynamic header height to prevent any clipping of dropdowns or mobile drawers
  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Close menus on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile navigation drawer if viewport expands to desktop size
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'nurse':
        return 'Clinician';
      case 'host':
        return 'Property Host';
      case 'dual':
        return 'Host & Clinician';
      case 'super_admin':
        return 'Super-Admin';
      case 'developer':
        return 'Developer';
      case 'guest':
        return 'Guest Traveler';
    }
  };

  const getRoleInitials = (role: UserRole) => {
    switch (role) {
      case 'nurse':
        return 'SJ';
      case 'host':
        return 'MV';
      case 'dual':
        return 'NP';
      case 'super_admin':
        return 'OA';
      case 'developer':
        return 'JD';
      case 'guest':
        return 'GT';
    }
  };

  const getRoleColorStyles = (role: UserRole) => {
    switch (role) {
      case 'nurse':
        return {
          badge: 'bg-[#195b4c]/10 text-[#195b4c] dark:bg-[#aff0db]/15 dark:text-[#aff0db]',
          avatar: 'bg-[#195b4c] text-white',
        };
      case 'host':
        return {
          badge: 'bg-[#005684]/10 text-[#005684] dark:bg-[#93ccff]/15 dark:text-[#93ccff]',
          avatar: 'bg-[#005684] text-white',
        };
      case 'dual':
        return {
          badge: 'bg-teal-500/15 text-teal-800 dark:text-teal-300',
          avatar: 'bg-[#005684] text-white',
        };
      case 'super_admin':
        return {
          badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
          avatar: 'bg-amber-600 text-white',
        };
      case 'developer':
        return {
          badge: 'bg-purple-500/15 text-purple-800 dark:text-purple-300',
          avatar: 'bg-purple-700 text-white',
        };
      case 'guest':
        return {
          badge: 'bg-gray-500/15 text-gray-700 dark:text-gray-300',
          avatar: 'bg-gray-500 text-white',
        };
    }
  };

  const roleStyles = getRoleColorStyles(currentUser.role);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-[100] w-full transition-colors duration-200 ${
        isNightShiftMode
          ? 'bg-[#0B1626]/95 backdrop-blur-md border-b border-[#233550] shadow-[0_4px_24px_rgba(0,0,0,0.5)] text-[#E6ECF7]'
          : 'bg-white/95 backdrop-blur-md border-b border-[rgba(11,37,89,0.08)] shadow-[0_4px_24px_rgba(11,37,89,0.04)] text-[#001848]'
      }`}
    >
      {topBanner}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Lockup */}
        <button
          onClick={() => onSelectTab('find-housing')}
          className="flex items-center gap-2 sm:gap-3 min-w-0 shrink text-left focus:outline-none group cursor-pointer"
          type="button"
          aria-label="Go to Nurses Pillow homepage"
        >
          <NursesPillowLogo size={32} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 transition-transform group-hover:scale-105" />
          <div className="flex flex-col min-w-0">
            <span
              className={`text-[17px] sm:text-[20px] font-bold tracking-tight leading-tight transition-colors truncate ${
                isNightShiftMode ? 'text-white' : 'text-[#001848]'
              }`}
            >
              Nurses Pillow
            </span>
            <span
              className="hidden sm:block text-[#745b0d] dark:text-[#ffdf91] text-[13px] sm:text-[14px] leading-none"
              style={{ fontFamily:"'Kaushan Script', cursive" }}
            >
              Rest Well. Heal Better.
            </span>
          </div>
        </button>

        {/* Desktop Primary Navigation - Role-Tailored */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {/* Clinician Navigation */}
          {currentUser.role === 'nurse' && (
            <>
              <button onClick={() => onSelectTab('nurse-dashboard')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'nurse-dashboard' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">space_dashboard</span>
                <span>My Dashboard</span>
              </button>
              <button onClick={() => onSelectTab('messages')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'messages' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">forum</span>
                <span>Messages</span>
              </button>
              <button onClick={() => onSelectTab('find-housing')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${currentTab === 'find-housing' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span>Explore Stays</span>
              </button>
              <button onClick={() => onSelectTab('search-listings')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'search-listings' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">travel_explore</span>
                <span>Search &amp; Map</span>
              </button>
            </>
          )}

          {/* Dual Role Navigation */}
          {currentUser.role === 'dual' && (
            <>
              <button onClick={() => onSelectTab('nurse-dashboard')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'nurse-dashboard' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">space_dashboard</span>
                <span>Clinician Dashboard</span>
              </button>
              <button onClick={() => onSelectTab('host-dashboard')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'host-dashboard' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">real_estate_agent</span>
                <span>Host Portal</span>
              </button>
              <button onClick={() => onSelectTab('messages')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'messages' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">forum</span>
                <span>Messages</span>
              </button>
              <button onClick={() => onSelectTab('find-housing')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${currentTab === 'find-housing' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span>Explore Stays</span>
              </button>
            </>
          )}

          {/* Pure Host Navigation */}
          {currentUser.role === 'host' && (
            <>
              <button onClick={() => onSelectTab('host-dashboard')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'host-dashboard' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">real_estate_agent</span>
                <span>My Sanctuaries</span>
              </button>
              <button onClick={() => onSelectTab('messages')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'messages' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">forum</span>
                <span>Messages</span>
              </button>
              <button onClick={() => onSelectTab('find-housing')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${currentTab === 'find-housing' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span>Explore Stays</span>
              </button>
              <button onClick={() => onSelectTab('search-listings')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'search-listings' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">travel_explore</span>
                <span>Search &amp; Map</span>
              </button>
            </>
          )}

          {/* Super Admin / Operations Navigation */}
          {currentUser.role === 'super_admin' && (
            <>
              <button onClick={() => onSelectTab('admin-portal')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'admin-portal' ? 'bg-amber-500 text-white font-bold' : (isNightShiftMode ? 'text-amber-400 hover:bg-amber-400/10' : 'text-amber-700 hover:bg-amber-50')}`}>
                <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
                <span>Operations Portal</span>
              </button>
              <button onClick={() => onSelectTab('find-housing')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${currentTab === 'find-housing' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span>Explore Stays</span>
              </button>
              <button onClick={() => onSelectTab('search-listings')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${currentTab === 'search-listings' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span>Search &amp; Map</span>
              </button>
            </>
          )}

          {/* Guest Navigation */}
          {currentUser.role === 'guest' && (
            <>
              <button onClick={() => onSelectTab('find-housing')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${currentTab === 'find-housing' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span>Explore Stays</span>
              </button>
              <button onClick={() => onSelectTab('search-listings')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'search-listings' ? (isNightShiftMode ? 'bg-[#182840] text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">travel_explore</span>
                <span>Search &amp; Map</span>
              </button>
              <button onClick={() => onSelectTab('for-hosts')} className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${currentTab === 'for-hosts' ? (isNightShiftMode ? 'bg-[#005684]/25 text-[#93ccff] font-bold' : 'bg-[#eaedff] text-[#005684] font-bold') : (isNightShiftMode ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5' : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100')}`}>
                <span className="material-symbols-outlined text-[17px]">home</span>
                <span>For Property Hosts</span>
              </button>
            </>
          )}

          {/* More Menu Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                isMoreMenuOpen
                  ? isNightShiftMode
                    ? 'bg-[#182840] text-white'
                    : 'bg-gray-100 text-[#001848]'
                  : isNightShiftMode
                  ? 'text-[#c0c7d1] hover:text-white hover:bg-white/5'
                  : 'text-[#404850] hover:text-[#001848] hover:bg-gray-100'
              }`}
            >
              <span>More</span>
              <span className="material-symbols-outlined text-[18px] transition-transform duration-200">
                {isMoreMenuOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isMoreMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-gray-200 dark:border-[#233550] shadow-lg p-2 z-50 text-xs overflow-y-auto custom-scrollbar"
                style={{
                  maxHeight: 'min(480px, calc(100vh - 5.5rem))',
                  WebkitOverflowScrolling: 'touch',
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {/* Healthcare Directory & Credentialing */}
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Healthcare Directory
                </div>

                <button type="button" onClick={() => { onSelectTab('verified-hospitals'); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182840] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] text-[#005684] dark:text-[#93ccff]">local_hospital</span>
                  <div>
                    <div className="font-bold text-[#001848] dark:text-white">Verified Hospitals Directory</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">NC trauma centers &amp; teaching systems</div>
                  </div>
                </button>

                {/* Role-Specific Additional Resources */}
                {(currentUser.role === 'nurse' || currentUser.role === 'guest') && (
                  <button type="button" onClick={() => { onSelectTab('how-it-works'); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182840] flex items-center gap-2.5 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] text-[#005684] dark:text-[#93ccff]">verified</span>
                    <div className="font-bold text-[#001848] dark:text-white">How It Works</div>
                  </button>
                )}

                {(currentUser.role === 'host' || currentUser.role === 'dual') && (
                  <>
                    <button type="button" onClick={() => { onSelectTab('host-onboarding'); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182840] flex items-center gap-2.5 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px] text-[#005684] dark:text-[#93ccff]">add_home</span>
                      <div className="font-bold text-[#001848] dark:text-white">List Sanctuary</div>
                    </button>
                    <button type="button" onClick={() => { onSelectTab('for-hosts'); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182840] flex items-center gap-2.5 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px] text-[#005684] dark:text-[#93ccff]">verified_user</span>
                      <div className="font-bold text-[#001848] dark:text-white">Host Standards</div>
                    </button>
                  </>
                )}

                <button type="button" onClick={() => { onSelectTab('system-status'); setIsMoreMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182840] flex items-center gap-2.5 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">dns</span>
                  <div>
                    <div className="font-bold text-[#001848] dark:text-white">Platform Reliability &amp; Status</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">Live uptime &amp; system health metrics</div>
                  </div>
                </button>

                {/* Separator was here */}
                <div className="my-1.5 border-t border-gray-100 dark:border-[#1e3048]"></div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Cluster - Desktop Utilities & Mobile/Tablet Unified Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">


          {/* Night Shift Mode Toggle (Desktop only; on mobile/tablet accessible via unified menu) */}
          <button
            onClick={onToggleNightShift}
            type="button"
            aria-label="Toggle Night Shift Mode"
            className={`hidden lg:flex p-1.5 sm:p-2.5 rounded-xl transition-all duration-200 ease-in-out cursor-pointer shrink-0 ${
              isNightShiftMode
                ? 'text-[#F1CF78] hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]'
                : 'text-[#0B2559] hover:bg-[#EFF6FB] hover:text-[#0A6FA8] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]'
            }`}
            title={isNightShiftMode ? 'Switch to Day Shift Mode' : 'Switch to Night Shift Mode (Day-Sleeper Dark)'}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
              {isNightShiftMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Guest Sign In & Register Buttons or User Profile Capsule (Desktop only; on mobile/tablet unified in drawer menu) */}
          {currentUser.role === 'guest' ? (
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth?.('signin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ease-in-out cursor-pointer ${
                  isNightShiftMode
                    ? 'border-[#233550] text-[#93ccff] hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]'
                    : 'border-gray-200 text-[#001848] hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth?.('signup')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#001848] dark:bg-[#005684] text-white hover:opacity-90 transition-all duration-200 ease-in-out cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex relative shrink-0" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border transition-all duration-200 ease-in-out cursor-pointer shadow-[0_1px_3px_rgba(11,37,89,0.06)] hover:shadow-[0_2px_8px_rgba(11,37,89,0.1)] ${
                  isProfileMenuOpen
                    ? isNightShiftMode
                      ? 'bg-[#182840] border-[#0A6FA8] text-white ring-2 ring-[#0A6FA8]/30'
                      : 'bg-[#EFF6FB] border-[#0A6FA8] text-[#0B2559] ring-2 ring-[#0A6FA8]/20'
                    : isNightShiftMode
                    ? 'bg-[#0E1A2E] border-[#233550] text-[#E6ECF7] hover:border-[#385175]'
                    : 'bg-white border-[rgba(11,37,89,0.12)] text-[#0B2559] hover:border-[#0A6FA8]/50 hover:bg-[#EFF6FB]/40'
                }`}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
                aria-label="User profile and account settings"
              >
                {/* Avatar with Verified checkmark */}
                <div className="relative shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs tracking-tight ${roleStyles.avatar}`}
                  >
                    {getRoleInitials(currentUser.role)}
                  </div>
                  {isVerified && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white dark:border-[#0E1A2E] flex items-center justify-center shadow-2xs"
                      title="Verified Identity & Clinical Credentials"
                    >
                      <span className="material-symbols-outlined text-[9px] text-white font-bold">check</span>
                    </span>
                  )}
                </div>

                {/* Identity Details (Desktop) */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight max-w-[120px] truncate text-[#0B2559] dark:text-white">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-medium opacity-70 leading-none flex items-center gap-1">
                    <span>{getRoleLabel(currentUser.role)}</span>
                    {isVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">✓</span>
                    ) : currentUser.role === 'nurse' && (
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-[9px]">!</span>
                    )}
                  </span>
                </div>

                <span className={`material-symbols-outlined text-[18px] opacity-60 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Profile & Perspective Switcher Popover */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-[0_12px_36px_rgba(11,37,89,0.12)] p-4 z-50 text-xs space-y-3 overflow-y-auto custom-scrollbar origin-top-right transition-all"
                    style={{
                      maxHeight: 'min(500px, calc(100vh - 5.5rem))',
                      WebkitOverflowScrolling: 'touch',
                    }}
                    onWheel={(e) => e.stopPropagation()}
                  >
                  {/* Account Card */}
                  <div className="p-3 rounded-xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${roleStyles.avatar}`}>
                      {getRoleInitials(currentUser.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate text-[#0B2559] dark:text-white flex items-center gap-1.5">
                        <span className="truncate">{currentUser.name}</span>
                        {isVerified && (
                          <span
                            className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"
                            title="Verified Platform Credentials"
                          >
                            <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleStyles.badge}`}>
                          {getRoleLabel(currentUser.role)}
                        </span>
                        {isVerified ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUser.role === 'nurse') onSelectTab('verification');
                              setIsProfileMenuOpen(false);
                            }}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 cursor-pointer group"
                          >
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span className="group-hover:underline">Verified Status</span>
                          </button>
                        ) : currentUser.role === 'nurse' && verificationStatus === 'pending_review' ? (
                          <div
                            className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[12px]">hourglass_top</span>
                            <span>Pending Admin Approval</span>
                          </div>
                        ) : currentUser.role === 'nurse' && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTab('verification');
                              setIsProfileMenuOpen(false);
                            }}
                            className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5 cursor-pointer group"
                          >
                            <span className="material-symbols-outlined text-[12px]">pending_actions</span>
                            <span className="group-hover:underline">Complete Verification</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Clinician Reservation Status (Not Gated for M1) */}
                  {currentUser.role === 'nurse' && activeBooking && (
                    <div className="p-3 rounded-xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Active Request Status
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider"
                          style={
                            activeBooking.status === 'approved' || activeBooking.status === 'active'
                              ? { backgroundColor: '#E1EFE9', color: '#2F6E5E' }
                              : activeBooking.status === 'declined'
                              ? { backgroundColor: '#F4E2DC', color: '#A8452E' }
                              : { backgroundColor: '#FBF0D6', color: '#B9822E' }
                          }
                        >
                          {activeBooking.status === 'approved' || activeBooking.status === 'active'
                            ? 'Accepted'
                            : activeBooking.status === 'declined'
                            ? 'Declined'
                            : 'Requested'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#0B2559] dark:text-white truncate">
                        {activeBooking.listingTitle}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {activeBooking.hospitalName} • {activeBooking.durationWeeks || 13} wks
                      </div>
                    {onOpenBookingDetail && activeBooking.status !== 'declined' && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenBookingDetail(activeBooking);
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-white dark:bg-[#0E1A2E] hover:bg-[#0A6FA8] hover:text-white border border-[rgba(11,37,89,0.08)] dark:border-[#233550] text-[11px] font-bold text-[#0A6FA8] dark:text-[#3E9AD1] transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>Review stay details</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Perspective / Role Switcher */}
                  {onSwitchRole && currentUser && (currentUser.role === 'dual' || currentUser.role === 'super_admin' || currentUser.role === 'developer') && (
                    <div className="pt-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span>Workspace Perspective</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchRole('nurse');
                            setIsProfileMenuOpen(false);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-center cursor-pointer transition-colors ${currentTab === 'nurse-dashboard' ? 'bg-[#0A6FA8] text-white font-bold' : 'bg-gray-100 dark:bg-[#182840] hover:bg-gray-200 text-gray-700 dark:text-gray-300'}`}
                        >
                          Clinician
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchRole('host');
                            setIsProfileMenuOpen(false);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-center cursor-pointer transition-colors ${currentTab === 'host-dashboard' ? 'bg-[#0A6FA8] text-white font-bold' : 'bg-gray-100 dark:bg-[#182840] hover:bg-gray-200 text-gray-700 dark:text-gray-300'}`}
                        >
                          Host
                        </button>
                        {(currentUser.role === 'super_admin' || currentUser.role === 'developer') && (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchRole('super_admin');
                              setIsProfileMenuOpen(false);
                            }}
                            className={`col-span-2 py-1.5 px-2 rounded-lg text-center cursor-pointer transition-colors ${currentUser.role === 'super_admin' ? 'bg-amber-600 text-white font-bold' : 'bg-gray-100 dark:bg-[#182840] hover:bg-gray-200 text-gray-700 dark:text-gray-300'}`}
                          >
                            Operations Admin
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Unified Footer: Support & Log Out Aligned */}
                  <div className="pt-2.5 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center justify-between">
                    {onOpenSupport && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenSupport();
                          setIsProfileMenuOpen(false);
                        }}
                        className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-[#0B2559] dark:hover:text-white flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-gray-500">help_outline</span>
                        <span>Support</span>
                      </button>
                    )}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          setIsProfileMenuOpen(false);
                        }}
                        className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-[#A8452E] dark:hover:text-[#F4E2DC] flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-[#F4E2DC]/30 dark:hover:bg-[#15233a] transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        <span>Log out</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

          {/* Mobile & Tablet Unified Menu Toggle Button - Pinned with Saved Counter Badge */}
          <button
            id="mobile-menu-toggle-button"
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            type="button"
            className={`lg:hidden shrink-0 relative flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all duration-200 ease-in-out cursor-pointer border ${
              isMobileMenuOpen
                ? isNightShiftMode
                  ? 'bg-[#182840] border-[#005684] text-[#93ccff]'
                  : 'bg-[#eaedff] border-[#005684] text-[#005684]'
                : isNightShiftMode
                ? 'bg-[#15233a] border-[#233550] text-[#E6ECF7] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                : 'bg-gray-100 border-gray-200 text-[#001848] hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-200'
            } focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]`}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px] leading-none transition-transform duration-200">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
            <span className="text-xs font-bold">
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </span>

          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Drawer / Dropdown Panel */}
      <div
        id="mobile-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        className={`lg:hidden fixed inset-x-0 bottom-auto z-50 flex flex-col justify-start transition-all duration-200 ease-in-out duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        style={{ top: `${headerHeight}px` }}
      >
        {/* Backdrop Overlay with smooth fade */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Sliding / Expanding Container */}
        <div
          className={`relative w-full max-w-lg mx-auto bg-white dark:bg-[#0E1A2E] border-b border-gray-200 dark:border-[#233550] shadow-lg transition-all duration-200 ease-in-out duration-300 ease-out transform flex flex-col rounded-b-2xl overflow-hidden z-10 ${
            isMobileMenuOpen
              ? 'translate-y-0 opacity-100 scale-100'
              : '-translate-y-4 opacity-0 scale-[0.98]'
          }`}
          style={{
            maxHeight: `calc(100dvh - ${headerHeight+ 8}px)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable Content inside Drawer */}
          <div
            className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* 1. Quick Auth / Profile Strip for Mobile */}
            {currentUser.role === 'guest' ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-[#13233a] dark:to-[#172b47] border border-blue-100 dark:border-[#233550] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#001848] dark:bg-[#005684] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#001848] dark:text-white">
                      Clinician &amp; Host Access
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Sign in for verified booking &amp; listings
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth?.('signin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 sm:flex-none py-1.5 px-3.5 rounded-xl border border-gray-300 dark:border-[#233550] text-xs font-bold text-[#001848] dark:text-white bg-white dark:bg-[#0E1A2E] text-center hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth?.('signup');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 sm:flex-none py-1.5 px-3.5 rounded-xl bg-[#001848] dark:bg-[#005684] text-white text-xs font-bold text-center hover:opacity-90 cursor-pointer shadow-xs"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#15233a] border border-gray-200 dark:border-[#233550] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${roleStyles.avatar}`}>
                    {getRoleInitials(currentUser.role)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#001848] dark:text-white truncate flex items-center gap-1">
                      <span className="truncate">{currentUser.name}</span>
                      {isVerified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className={`px-1.5 py-0.2 rounded font-bold ${roleStyles.badge}`}>
                        {getRoleLabel(currentUser.role)}
                      </span>
                      {isVerified ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Verified</span>
                      ) : currentUser.role === 'nurse' && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTab('verification');
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span>• Unverified (Click to Complete)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. PRIMARY NAVIGATION LINKS - Tailored by User Role */}
            <div className="space-y-1">
              <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 flex items-center justify-between">
                <span>Main Navigation</span>
              </div>

              {/* Clinician Navigation (3 items) */}
              {currentUser.role === 'nurse' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('nurse-dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'nurse-dashboard'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'nurse-dashboard' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>space_dashboard</span>
                      <span>My Dashboard</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('find-housing');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'find-housing'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'find-housing' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>bed</span>
                      <span>Explore Stays</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('search-listings');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'search-listings'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'search-listings' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>travel_explore</span>
                      <span>Search &amp; Map</span>
                    </div>
                  </button>
                </>
              )}

              {/* Dual Role Navigation (3 items) */}
              {currentUser.role === 'dual' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('nurse-dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'nurse-dashboard'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'nurse-dashboard' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>space_dashboard</span>
                      <span>Clinician Dashboard</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('host-dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'host-dashboard'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'host-dashboard' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>real_estate_agent</span>
                      <span>Host Portal</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('find-housing');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'find-housing'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'find-housing' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>bed</span>
                      <span>Explore Stays</span>
                    </div>
                  </button>
                </>
              )}

              {/* Pure Host Navigation (3 items) */}
              {currentUser.role === 'host' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('host-dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'host-dashboard'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'host-dashboard' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>real_estate_agent</span>
                      <span>My Sanctuaries</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('find-housing');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'find-housing'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'find-housing' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>bed</span>
                      <span>Explore Stays</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('search-listings');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'search-listings'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'search-listings' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>travel_explore</span>
                      <span>Search &amp; Map</span>
                    </div>
                  </button>
                </>
              )}

              {/* Super Admin Navigation (3 items) */}
              {currentUser.role === 'super_admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('admin-portal');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'admin-portal'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                      <span>Operations Portal</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('find-housing');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'find-housing'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">bed</span>
                      <span>Explore Stays</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('search-listings');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'search-listings'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                      <span>Search &amp; Map</span>
                    </div>
                  </button>
                </>
              )}

              {/* Guest Navigation (3 items) */}
              {currentUser.role === 'guest' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('find-housing');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'find-housing'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'find-housing' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>bed</span>
                      <span>Explore Stays</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('search-listings');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'search-listings'
                        ? 'bg-[#eaedff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${
                        currentTab === 'search-listings' ? 'text-[#005684] dark:text-[#93ccff]' : 'text-gray-500 dark:text-gray-400'
                      }`}>travel_explore</span>
                      <span>Search &amp; Map</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('for-hosts');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      currentTab === 'for-hosts'
                        ? 'bg-[#005684]/15 text-[#005684] dark:text-[#93ccff] shadow-2xs'
                        : 'text-[#001848] dark:text-white hover:bg-gray-100 dark:hover:bg-[#182840]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-gray-500 dark:text-gray-400">home</span>
                      <span>For Property Hosts</span>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* 3. DIRECTORY & CLINICAL RESOURCES */}
            <div className="pt-2 border-t border-gray-100 dark:border-[#233550] space-y-1">
              <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Directory &amp; Standards
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('verified-hospitals');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  currentTab === 'verified-hospitals'
                    ? 'bg-blue-50 dark:bg-[#182840] text-[#005684] dark:text-[#93ccff] font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#005684]">
                    local_hospital
                  </span>
                  <span>Verified Hospitals Directory</span>
                </div>

              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('system-status');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  currentTab === 'system-status'
                    ? 'bg-emerald-50 dark:bg-[#182840] text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                    dns
                  </span>
                  <span>Platform Reliability &amp; Status</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  99.9%
                </span>
              </button>
            </div>

            {/* 4. UTILITIES (Saved & Night Shift Toggle) */}
            <div className="pt-2 border-t border-gray-100 dark:border-[#233550] grid grid-cols-1 gap-2">


              <button
                type="button"
                onClick={onToggleNightShift}
                className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-[#233550] bg-gray-50 dark:bg-[#15233a] flex items-center justify-between text-xs font-bold text-[#001848] dark:text-white hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-[#1c2e4c] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1c2e4c] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#ffdf91]">
                    {isNightShiftMode ? 'light_mode' : 'dark_mode'}
                  </span>
                  <span>{isNightShiftMode ? 'Day Mode' : 'Night Mode'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  {isNightShiftMode ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* 5. ROLE PERSPECTIVE SWITCHER */}
            {onSwitchRole && currentUser && (currentUser.role === 'dual' || currentUser.role === 'super_admin' || currentUser.role === 'developer') && (
              <div className="pt-2 border-t border-gray-100 dark:border-[#233550] space-y-1.5">
                <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  <span>Workspace Perspective</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchRole('nurse');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-center cursor-pointer transition-colors ${currentTab === 'nurse-dashboard' ? 'bg-[#0A6FA8] text-white font-bold' : 'bg-gray-100 dark:bg-[#15233a] text-gray-700 dark:text-gray-300'}`}
                  >
                    Clinician
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchRole('host');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 rounded-xl text-center cursor-pointer transition-colors ${currentTab === 'host-dashboard' ? 'bg-[#0A6FA8] text-white font-bold' : 'bg-gray-100 dark:bg-[#15233a] text-gray-700 dark:text-gray-300'}`}
                  >
                    Host
                  </button>
                  {(currentUser.role === 'super_admin' || currentUser.role === 'developer') && (
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchRole('super_admin');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`col-span-2 py-2 px-3 rounded-xl text-center cursor-pointer transition-colors ${currentUser.role === 'super_admin' ? 'bg-amber-600 text-white font-bold' : 'bg-gray-100 dark:bg-[#15233a] text-gray-700 dark:text-gray-300'}`}
                    >
                      Operations Portal
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 6. SUPPORT & AUTH ACTIONS */}
            <div className="pt-2 border-t border-gray-100 dark:border-[#233550] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenSupport();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-[#233550] text-xs font-bold flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#005684]">support_agent</span>
                <span>24/7 Clinical Support</span>
              </button>

              {currentUser.role !== 'guest' && onLogout ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-[#233550] text-gray-600 dark:text-gray-300 hover:text-[#A8452E] dark:hover:text-[#F4E2DC] hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Log out</span>
                </button>
              ) : onOpenAuth ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('signin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-[#233550] text-xs font-bold text-center text-[#001848] dark:text-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840]"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('signup');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#001848] dark:bg-[#005684] text-white text-xs font-bold text-center hover:opacity-90 shadow-xs"
                  >
                    Get Started
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
