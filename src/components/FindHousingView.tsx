import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { HousingListing } from '../types';
import { db } from '../services/database';
const ListingDetailModal = React.lazy(() => import('./ListingDetailModal').then((m) => ({ default: m.ListingDetailModal })));
import { PillowSaveButton } from './PillowSaveButton';
import { GoogleHospitalAutocomplete } from './GoogleHospitalAutocomplete';
import { ACTIVE_STATES, isStateActive } from '../lib/constants/states';
import {
  heroContainerVariant,
  heroItemVariant,
  heroSearchCardVariant,
} from '../lib/animation-utilities';
import { GoogleMapsTravelTimeDisplay } from './GoogleMapsTravelTimeDisplay';
import { calculateCommuteDuration } from '../lib/googleMapsCommute';
import { ClinicalDatePicker } from './ClinicalDatePicker';
import { ClinicalDateRangePicker } from './ClinicalDateRangePicker';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { addWeeks, format, parseISO } from 'date-fns';

interface ObservedListingCardProps {
  listing: HousingListing;
  index: number;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelectListing: (listing: HousingListing) => void;
  onRequestToBook?: (listing: HousingListing) => void;
  shouldReduceMotion?: boolean | null;
  selectedHospital?: string;
  isNightShiftMode?: boolean;
}

/**
 * ObservedListingCard uses lightweight viewport detection
 * with smooth GPU-friendly transform and opacity transitions.
 * Integrates Google Maps-powered commute duration to user's selected hospital.
 */
const ObservedListingCard: React.FC<ObservedListingCardProps> = React.memo(({
  listing,
  index,
  isSaved,
  onToggleSave,
  onSelectListing,
  onRequestToBook,
  shouldReduceMotion,
  selectedHospital = '',
  isNightShiftMode = false,
}) => {
  // ⚡ Bolt Performance Optimization: Wrapped with useCallback to provide a stable reference
  // to PillowSaveButton which is wrapped in React.memo, preventing unnecessary re-renders.
  const handleToggleSave = useCallback(() => {
    onToggleSave(listing.id);
  }, [onToggleSave, listing.id]);

  // Dynamically calculate commute metrics to the user's selected hospital
  const commute = useMemo(() => {
    return calculateCommuteDuration(listing, selectedHospital);
  }, [listing, selectedHospital]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration: 0.3,
        delay: shouldReduceMotion ? 0 : (index % 3) * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="bg-white dark:bg-[#111e33] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-col justify-between group"
    >
      {/* Image Header */}
      <div className="relative h-60 w-full overflow-hidden bg-gray-100">
        <img
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
          alt={listing.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Dynamic Google Maps Commute Badge on Image */}
        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-xs font-semibold shadow-md">
          <span className="material-symbols-outlined text-[14px] text-[#aff0db]">directions_car</span>
          <span className="tabular-nums">{commute.driveMinutes} min drive</span>
          <span className="opacity-60">·</span>
          <span className="tabular-nums opacity-90">{commute.distanceMiles} mi</span>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <PillowSaveButton
            isSaved={isSaved}
            onToggle={handleToggleSave}
            className="w-10 h-10 rounded-full bg-white/95 dark:bg-[#111e33]/90 shadow-md backdrop-blur-xs"
            size={20}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#404850] dark:text-[#93ccff] font-bold uppercase tracking-wider">
            <span>{listing.propertyType || 'ENTIRE CONDO'}</span>
            <div className="flex items-center gap-1 text-amber-500">
              <span className="material-symbols-outlined text-[16px]">star</span>
              <span className="text-[#001848] dark:text-white font-bold">{listing.nurseRating}</span>
              <span className="text-gray-400 font-normal">({listing.reviewsCount})</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-[#001848] dark:text-white line-clamp-1 group-hover:text-[#005684] focus-visible:text-[#005684] transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#001848] dark:text-white tabular-nums">
              ${listing.monthlyRate.toLocaleString()}
            </span>
            <span className="text-xs text-[#404850] dark:text-[#93ccff]">/ month</span>
            <span className="text-[11px] text-[#195b4c] font-bold bg-[#195b4c]/10 px-2 py-0.5 rounded-full ml-auto">
              $0 Traveler Fee
            </span>
          </div>

          {/* Google Maps-Powered Travel Time Module */}
          <GoogleMapsTravelTimeDisplay
            commute={commute}
            isNightShiftMode={isNightShiftMode}
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {(listing.highlightBadges || ['Blackout Curtains', '≤35dB Quiet Daytime', 'In-unit Scrub Washer']).map((badge, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f2f3ff] dark:bg-[#182840] text-[#005684] dark:text-[#93ccff]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectListing(listing)}
            className="font-bold text-xs sm:text-sm text-[#005684] dark:text-[#93ccff] hover:underline cursor-pointer"
          >
            View Stay Details
          </button>
          {onRequestToBook && (
            <button
              type="button"
              onClick={() => onRequestToBook(listing)}
              className="px-4 py-2 rounded-xl bg-[#001848] hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Book Sanctuary
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

interface FindHousingViewProps {
  isNightShiftMode: boolean;
  savedListingIds: string[];
  onToggleSave: (id: string) => void;
  isVerified: boolean;
  onGoToVerification: () => void;
  onGoToEmailVerification?: () => void;
  onGoToPhoneVerification?: () => void;
  onRequestToBookListing?: (listing: HousingListing) => void;
  onGoToSearchListings: (params?: { hospital?: string; duration?: string; radius?: number; checkInDate?: string; checkOutDate?: string }) => void;
  onGoToHostPortal?: () => void;
  userRole?: string;
  userName?: string;
}

const formatDateFriendly = (dateStr: string) => {
  if (!dateStr) return 'Select date';
  try {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  } catch {
    return dateStr;
  }
};

export const FindHousingView: React.FC<FindHousingViewProps> = ({
  isNightShiftMode,
  savedListingIds,
  onToggleSave,
  isVerified,
  onGoToVerification,
  onRequestToBookListing,
  onGoToSearchListings,
  onGoToHostPortal,
  userRole,
  userName,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedHospitalState, setSelectedHospitalState] = useState('NC');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
  const [commuteBuffer, setCommuteBuffer] = useState<number>(5);
  const [selectedDuration, setSelectedDuration] = useState('13');
  const [customDuration, setCustomDuration] = useState<number>(1);
  const [earliestCheckIn, setEarliestCheckIn] = useState('2026-10-05');
  const [latestCheckOut, setLatestCheckOut] = useState('2027-01-04');
  const [dateValidationError, setDateValidationError] = useState('');
    const [activeListingFilter, setActiveListingFilter] = useState<'all' | 'close' | 'quiet' | 'laundry' | 'pets'>('all');
  const [activeProtectionTab, setActiveProtectionTab] = useState<'clinicians' | 'hosts'>(
    userRole === 'host' ? 'hosts' : 'clinicians'
  );
  const [activeDetailListing, setActiveDetailListing] = useState<HousingListing | null>(null);
  const [isDatesPopoverOpen, setIsDatesPopoverOpen] = useState(false);
  const [isDistancePopoverOpen, setIsDistancePopoverOpen] = useState(false);
  const [activeSearchStep, setActiveSearchStep] = useState<'dates' | 'distance' | 'search' | null>(null);
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);


  // ⚡ Bolt Performance Optimization: Wrapped with useCallback to provide a stable reference
  // to child components like ObservedListingCard that use React.memo,
  // preventing unnecessary re-renders when FindHousingView re-renders.
  const handleSelectListing = useCallback((listing: HousingListing) => {
    setActiveDetailListing(listing);
  }, []);

  const hospitalDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
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

  const [popularHubs, setPopularHubs] = useState<string[]>([]);
  useEffect(() => {
    Promise.resolve(db.getHospitals()).then(data => {
      if (data && data.length > 0) {
        setPopularHubs(data.map((h: any) => h.name));
      }
    }).catch(console.error);
  }, []);

  const filteredHospitals = useMemo(() => {
    if (!hospitalSearchQuery.trim()) return popularHubs;
    const q = hospitalSearchQuery.toLowerCase();
    return popularHubs.filter((h) => h.toLowerCase().includes(q));
  }, [hospitalSearchQuery, popularHubs]);

  // Curated Featured Listings for the Home Page
  const featuredListings = useMemo(() => {
    const dbListings = db.getListings() || [];
    return dbListings.slice(0, 6);
  }, []);

  const displayedFeaturedListings = useMemo(() => {
    if (activeListingFilter === 'all') return featuredListings;

    // ⚡ Bolt Performance Optimization: Single-pass early return filtering
    // Replaced four separate .filter() and multiple .some() array operations with a single O(N) loop
    const result = [];
    for (let i = 0; i < featuredListings.length; i++) {
      const l = featuredListings[i];
      if (activeListingFilter === 'close') {
        if ((l.driveTimeMinutes || 10) <= 6 || (l.distanceBadge && l.distanceBadge.includes('0.'))) {
          result.push(l);
        }
      } else if (activeListingFilter === 'quiet') {
        if (l.amenities?.daySleeperQuietHours || l.amenities?.blackoutCurtains) {
          result.push(l);
        } else if (l.highlightBadges) {
          for (let j = 0; j < l.highlightBadges.length; j++) {
            const b = l.highlightBadges[j];
            if (b.includes('Quiet') || b.includes('dB') || b.includes('Blackout')) {
              result.push(l);
              break;
            }
          }
        }
      } else if (activeListingFilter === 'laundry') {
        if (l.amenities?.washerDryerInUnit) {
          result.push(l);
        } else if (l.highlightBadges) {
          for (let j = 0; j < l.highlightBadges.length; j++) {
            if (l.highlightBadges[j].toLowerCase().includes('laundry')) {
              result.push(l);
              break;
            }
          }
        }
      } else if (activeListingFilter === 'pets') {
        if (l.amenities?.petFriendly) result.push(l);
      }
    }
    return result;
  }, [featuredListings, activeListingFilter]);

  // Streamlined date display with zero text wrapping
  const dateDisplay = useMemo(() => {
    try {
      if (!earliestCheckIn) {
        return { rangeText: 'Select dates', weeksBadge: '' };
      }
      const [y1, m1, d1] = earliestCheckIn.split('-').map(Number);
      const startD = new Date(y1, m1 - 1, d1, 12);
      const startFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(startD);

      if (!latestCheckOut) {
        return { rangeText: `${startFmt} → Check-out`, weeksBadge: '' };
      }

      const [y2, m2, d2] = latestCheckOut.split('-').map(Number);
      const endD = new Date(y2, m2 - 1, d2, 12);
      const endFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(endD);

      const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
      const weeks = Math.round(diffDays / 7);

      return {
        rangeText: `${startFmt} – ${endFmt}`,
        weeksBadge: weeks > 0 ? `${weeks} wks` : `${diffDays}d`,
      };
    } catch {
      return { rangeText: 'Select dates', weeksBadge: '' };
    }
  }, [earliestCheckIn, latestCheckOut]);

  // Progressive transition handler: when dates are applied, smoothly highlight Max Distance without opening dropdown
  const handleDatesCompleted = useCallback(() => {
    setIsDatesPopoverOpen(false);
    setActiveSearchStep('distance');
    setIsDistancePopoverOpen(false);
  }, []);

  // Progressive transition handler: when distance is chosen, highlight Search CTA
  const handleDistanceSelected = useCallback((miles: number) => {
    setCommuteBuffer(miles);
    setIsDistancePopoverOpen(false);
    setActiveSearchStep('search');
    setIsSearchHighlighted(true);
    setTimeout(() => {
      setIsSearchHighlighted(false);
    }, 2400);
  }, []);

  const handleExecuteSearch = useCallback(() => {
    setDateValidationError('');
    if (!earliestCheckIn || !latestCheckOut) {
      setDateValidationError('Both check-in and check-out dates are required.');
      return;
    }
    if (new Date(latestCheckOut) <= new Date(earliestCheckIn)) {
      setDateValidationError('Check-out date must be after check-in date.');
      return;
    }

    const [y1, m1, d1] = earliestCheckIn.split('-').map(Number);
    const startD = new Date(y1, m1 - 1, d1, 12);
    const [y2, m2, d2] = latestCheckOut.split('-').map(Number);
    const endD = new Date(y2, m2 - 1, d2, 12);
    const diffDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
    const calculatedWeeks = Math.max(1, Math.round(diffDays / 7));

    onGoToSearchListings({
      hospital: selectedHospital,
      duration: String(calculatedWeeks),
      radius: commuteBuffer,
      checkInDate: earliestCheckIn,
      checkOutDate: latestCheckOut,
    });
  }, [selectedHospital, commuteBuffer, earliestCheckIn, latestCheckOut, onGoToSearchListings]);

  return (
    <div className={`w-full transition-colors ${isNightShiftMode ? 'bg-[#08101C] text-[#E6ECF7]' : 'bg-[#faf8ff] text-[#001848]'}`}>
      {/* 1. HERO SECTION & ASSIGNMENT CARD */}
      <section className="relative px-4 sm:px-6 lg:px-12 pt-6 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20">
        {/* Soft Ambient Radial Accents (zero blur-filter rasterization overhead) */}
        <div
          className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full pointer-events-none opacity-60 dark:opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(10, 111, 168, 0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/2 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none opacity-50 dark:opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(25, 91, 76, 0.15) 0%, transparent 70%)',
          }}
        />

        <motion.div
          variants={shouldReduceMotion ? undefined : heroContainerVariant}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10"
        >
          {/* Brand Script Greeting */}
          <motion.div
            variants={heroItemVariant}
            className="flex justify-center mb-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#111e33]/80 border border-[#F1CF78]/60 shadow-[0_2px_8px_rgba(11,37,89,0.06)] backdrop-blur-xs cursor-default select-none transition-transform hover:scale-[1.02]">
              <img src="/nurses-pillow-logo.png" alt="Nurses Pillow" className="w-5 h-5 object-contain drop-shadow-xs" />
              <span
                className="text-[26px] sm:text-[30px] leading-tight text-[#745b0d] dark:text-[#E4C36D]"
                style={{ fontFamily:"'Kaushan Script', cursive" }}
              >
                Rest Well. Heal Better.
              </span>
              <span className="w-2 h-2 rounded-full bg-[#195b4c] dark:bg-[#aff0db]" />
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={heroItemVariant}
            className="text-3xl sm:text-4xl lg:text-[46px] lg:leading-[54px] font-bold text-[#001848] dark:text-white max-w-4xl tracking-tight mb-4"
          >
            Verified Healthcare Professionals Only.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={heroItemVariant}
            className="text-base sm:text-lg text-[#404850] dark:text-[#c0c7d1] max-w-2xl leading-relaxed mb-8"
          >
            Find your home near your next assignment. Curated furnished quiet spaces vetted for day-sleepers, shift schedules, and contract flexibility.
          </motion.p>


          {/* Signature Assignment Card (Streamlined, Low-Cognitive-Load & Fluid Airbnb-Style Transitions) */}
          <motion.div
            variants={heroSearchCardVariant}
            className="w-full max-w-4xl bg-white dark:bg-[#111e33] rounded-[24px] p-5 sm:p-7 shadow-[0_12px_36px_rgba(11,37,89,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] text-left relative border border-[rgba(11,37,89,0.08)] dark:border-[#233550]"
          >
            <div className="flex flex-col gap-3">
              {/* Row 1: Hospital Assignment Search */}
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-20"
              >
                <div className="w-full relative">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-[#0B2559]/75 dark:text-[#E6ECF7]/75 uppercase tracking-wider mb-1.5 ml-1">
                    Where are you assigned?
                  </label>
                  <GoogleHospitalAutocomplete
                    value={selectedHospital}
                    onChange={(hosp) => setSelectedHospital(hosp)}
                    onSelectHospital={(hosp) => {
                      setSelectedHospital(hosp.name);
                      if (hosp.state) {
                        setSelectedHospitalState(hosp.state);
                      } else if (hosp.address) {
                        const parts = hosp.address.split(',');
                        if (parts.length > 1) {
                          const potentialState = parts[1].trim().split(' ')[0];
                          if (potentialState.length === 2) {
                            setSelectedHospitalState(potentialState.toUpperCase());
                          }
                        }
                      }
                      // Smooth progressive transition to assignment dates (like Airbnb)
                      setActiveSearchStep('dates');
                      setIsDatesPopoverOpen(true);
                      setIsDistancePopoverOpen(false);
                    }}
                    isNightShiftMode={isNightShiftMode}
                    placeholder="Search hospital or healthcare system..."
                  />
                </div>
              </motion.div>

              {/* Regional Limitation Banner */}
              {!isStateActive(selectedHospitalState) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-[#F4E2DC] border border-[#A8452E]/20 text-[#A8452E] text-xs font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0">location_off</span>
                  <span>We are launching soon in your state. Currently active in NC, MD, CT, ND, and KS.</span>
                </motion.div>
              )}

              {/* Row 2: Grid for Dates, Distance, and Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_auto] gap-3 items-end relative z-10">
                {/* Assignment Dates Selector */}
                <div className="relative">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-[#0B2559]/75 dark:text-[#E6ECF7]/75 uppercase tracking-wider mb-1.5 ml-1 whitespace-nowrap">
                    Assignment dates
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isDatesPopoverOpen;
                      setIsDatesPopoverOpen(next);
                      setActiveSearchStep(next ? 'dates' : null);
                      setIsDistancePopoverOpen(false);
                    }}
                    aria-expanded={isDatesPopoverOpen}
                    aria-controls="dates-popover"
                    className={`w-full h-[52px] px-3.5 sm:px-4 rounded-xl border transition-all duration-200 flex items-center justify-between text-left cursor-pointer group ${
                      activeSearchStep === 'dates' || isDatesPopoverOpen
                        ? 'bg-white dark:bg-[#182840] border-[#0A6FA8] ring-2 ring-[#0A6FA8]/25 shadow-md'
                        : 'bg-[#EFF6FB] dark:bg-[#15233a] border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:bg-[#E5F0F8] dark:hover:bg-[#1a2d48]'
                    } focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]`}
                  >
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden pr-2">
                      <span className="text-xs sm:text-sm font-bold text-[#0B2559] dark:text-white group-hover:text-[#0A6FA8] dark:group-hover:text-[#3E9AD1] transition-colors tabular-nums whitespace-nowrap truncate">
                        {dateDisplay.rangeText}
                      </span>
                      {dateDisplay.weeksBadge && (
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#0A6FA8] dark:text-[#3E9AD1] bg-[#EFF6FB] dark:bg-[#0A6FA8]/20 px-2 py-0.5 rounded-full tabular-nums whitespace-nowrap shrink-0">
                          {dateDisplay.weeksBadge}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#0A6FA8] dark:text-[#3E9AD1] shrink-0 transition-transform duration-200 ${
                        isDatesPopoverOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {/* Maximum Distance Selector */}
                <div className="relative">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-[#0B2559]/75 dark:text-[#E6ECF7]/75 uppercase tracking-wider mb-1.5 ml-1 whitespace-nowrap">
                    Max distance
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isDistancePopoverOpen;
                      setIsDistancePopoverOpen(next);
                      setActiveSearchStep(next ? 'distance' : null);
                      setIsDatesPopoverOpen(false);
                    }}
                    aria-expanded={isDistancePopoverOpen}
                    aria-controls="distance-popover"
                    className={`w-full h-[52px] px-3.5 sm:px-4 rounded-xl border transition-all duration-300 flex items-center justify-between text-left cursor-pointer group ${
                      activeSearchStep === 'distance' || isDistancePopoverOpen
                        ? 'bg-white dark:bg-[#182840] border-[#0A6FA8] ring-2 ring-[#0A6FA8]/30 shadow-md scale-[1.01]'
                        : 'bg-[#EFF6FB] dark:bg-[#15233a] border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:bg-[#E5F0F8] dark:hover:bg-[#1a2d48]'
                    } focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]`}
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#0B2559] dark:text-white group-hover:text-[#0A6FA8] dark:group-hover:text-[#3E9AD1] transition-colors tabular-nums whitespace-nowrap">
                      Within {commuteBuffer} miles
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#0A6FA8] dark:text-[#3E9AD1] shrink-0 transition-transform duration-200 ${
                        isDistancePopoverOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Distance Dropdown (Generous width, clean scannable options) */}
                  <AnimatePresence>
                    {isDistancePopoverOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                          onClick={() => {
                            setIsDistancePopoverOpen(false);
                            setActiveSearchStep(null);
                          }}
                        />
                        <motion.div
                      id="distance-popover"
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-[calc(100%+8px)] right-0 w-64 sm:w-72 bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.1)] dark:border-[#233550] rounded-2xl shadow-xl z-50 p-2 flex flex-col gap-1"
                        >
                          {[
                            { miles: 3, label: '3 miles', desc: 'Shift walk / bike' },
                            { miles: 5, label: '5 miles', desc: 'Recommended (Quick commute)' },
                            { miles: 10, label: '10 miles', desc: '15–20 min drive' },
                            { miles: 15, label: '15 miles', desc: 'Extended radius' },
                            { miles: 25, label: '25 miles', desc: 'Regional hospital hub' },
                          ].map((opt) => (
                            <button
                              key={opt.miles}
                              type="button"
                              onClick={() => handleDistanceSelected(opt.miles)}
                              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                                commuteBuffer === opt.miles
                                  ? 'bg-[#0A6FA8]/10 dark:bg-[#0A6FA8]/20 border border-[#0A6FA8]/30'
                                  : 'hover:bg-[#EFF6FB] dark:hover:bg-[#182840] border border-transparent'
                              }`}
                            >
                              <div>
                                <span className="text-xs sm:text-sm font-bold text-[#0B2559] dark:text-white tabular-nums block whitespace-nowrap">
                                  {opt.label}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {opt.desc}
                                </span>
                              </div>
                              {commuteBuffer === opt.miles && (
                                <Check className="w-4 h-4 text-[#0A6FA8] dark:text-[#3E9AD1]" aria-hidden="true" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Housing Action Button */}
                <div className="flex items-end sm:col-span-2 md:col-span-1">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsDatesPopoverOpen(false);
                      setIsDistancePopoverOpen(false);
                      setActiveSearchStep(null);
                      handleExecuteSearch();
                    }}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full md:w-auto h-[52px] px-8 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer ${
                      isSearchHighlighted || activeSearchStep === 'search'
                        ? 'ring-4 ring-[#0A6FA8]/40 shadow-xl scale-[1.02] bg-[#0C7EBF]'
                        : ''
                    }`}
                  >
                    <span className="whitespace-nowrap">Search housing →</span>
                  </motion.button>
                </div>
              </div>

              {/* Validation Error Message */}
              {dateValidationError && (
                <p className="text-xs text-[#A8452E] font-semibold mt-1">
                  {dateValidationError}
                </p>
              )}

              {/* Active States Badge */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 mt-4 pt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-[#2b4162] text-xs font-semibold">
                <span className="text-[#0B2559]/75 dark:text-[#E6ECF7]/75">Currently active in:</span>
                <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                  {['NC', 'MD', 'CT', 'ND', 'KS'].map((state) => (
                    <span key={state} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#195b4c]/30 dark:text-[#aff0db] shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2F6E5E] dark:bg-[#aff0db]" />
                      {state}
                    </span>
                  ))}
                </div>
              </div>

              {/* Unconstrained Floating Dates Popover (Anchored Responsively Across Assignment Card) */}
              <AnimatePresence>
                {isDatesPopoverOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                      onClick={() => {
                        setIsDatesPopoverOpen(false);
                        setActiveSearchStep(null);
                      }}
                    />
                    <motion.div
                      id="dates-popover"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:top-[calc(100%+8px)] sm:left-0 md:left-1/2 md:-translate-x-1/2 z-50 w-[calc(100%-24px)] sm:w-full md:w-[700px] lg:w-[720px] max-w-full drop-shadow-2xl"
                    >
                      <ClinicalDateRangePicker
                        startDate={earliestCheckIn}
                        endDate={latestCheckOut}
                        onChange={(start, end) => {
                          setEarliestCheckIn(start);
                          setLatestCheckOut(end);
                          setDateValidationError('');
                          if (start && end) {
                            // Highlight the next input ('distance') to signal what is next,
                            // while STILL keeping the dates dropdown open so user can clearly see range visual!
                            setActiveSearchStep('distance');
                            setIsDistancePopoverOpen(false);
                          }
                        }}
                        isNightShiftMode={isNightShiftMode}
                        onApply={handleDatesCompleted}
                        onClose={() => {
                          setIsDatesPopoverOpen(false);
                        }}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Quick Hubs */}
          <motion.div
            variants={heroItemVariant}
            className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-[#404850] dark:text-[#c0c7d1]"
          >
            <span className="font-semibold text-[#0B2559] dark:text-[#E6ECF7]">Popular Clinical Hubs:</span>
            {popularHubs.slice(0, 5).map((hub) => (
              <motion.button
                key={hub}
                type="button"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedHospital(hub);
                  onGoToSearchListings({ hospital: hub, duration: selectedDuration, radius: commuteBuffer });
                }}
                className="px-3 py-1 rounded-full bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:border-[#0A6FA8] dark:hover:border-[#3E9AD1] font-medium transition-colors cursor-pointer text-[#0B2559] dark:text-white shadow-xs"
              >
                {hub.split(' - ')[0]}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* 2. TRUST SANCTUARY BANNER (Scroll Reveal with Staggered Cards) */}
      <section className="w-full bg-[#f2f3ff] dark:bg-[#111e33] px-4 sm:px-6 lg:px-12 py-10 transition-colors border-y border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trust 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] shadow-xs"
            >
              <div className="w-12 h-12 rounded-xl bg-[#cde5ff] dark:bg-[#005684]/40 flex items-center justify-center text-[#001d32] dark:text-[#93ccff] shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B2559] dark:text-white">License-Verified Nurses</h4>
                <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-1 leading-relaxed">
                  Only active clinical licenses granted access. Safe community of verified healthcare professionals.
                </p>
              </div>
            </motion.div>

            {/* Trust 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] shadow-xs"
            >
              <div className="w-12 h-12 rounded-xl bg-[#aff0db]/50 dark:bg-[#195b4c]/40 flex items-center justify-center text-[#195b4c] dark:text-[#aff0db] shrink-0">
                <span className="material-symbols-outlined text-[24px]">bedtime</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B2559] dark:text-white">Daytime Quiet Guarantee</h4>
                <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-1 leading-relaxed">
                  Decibel checked spaces for post-night shift sleep. Sound isolation under 35dB guaranteed.
                </p>
              </div>
            </motion.div>

            {/* Trust 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] shadow-xs"
            >
              <div className="w-12 h-12 rounded-xl bg-[#ffdc84]/50 dark:bg-[#745b0d]/40 flex items-center justify-center text-[#745b0d] dark:text-[#ffdc84] shrink-0">
                <span className="material-symbols-outlined text-[24px]">price_check</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0B2559] dark:text-white">Zero Hidden Fees</h4>
                <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-1 leading-relaxed">
                  Fair pricing transparently aligned with your stipend. $0 traveler booking fee policy.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED LISTINGS ONLY ON HOME PAGE */}
      <section className="w-full px-4 sm:px-6 lg:px-12 py-14 lg:py-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFF6FB] text-[#0A6FA8] dark:bg-[#182840] dark:text-[#3E9AD1] mb-2 border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <span className="material-symbols-outlined text-[14px]">hotel_class</span>
              <span>Curated by Nurses Pillow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2559] dark:text-white tracking-tight">
              Featured Sanctuary Stays
            </h2>
            <p className="text-sm text-[#404850] dark:text-[#c0c7d1] mt-1">
              Top-rated shift-ready homes with verified quiet certifications near major medical centers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExecuteSearch}
            className="inline-flex items-center gap-1 text-sm font-bold text-[#0A6FA8] dark:text-[#3E9AD1] cursor-pointer self-start md:self-auto group"
          >
            <span className="group-hover:underline">Explore all 28 stays in Interactive Map</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Active Commute Anchor Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-7 h-7 rounded-xl bg-[#0A6FA8] text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
            </span>
            <div>
              <span className="text-[#0B2559]/70 dark:text-[#c0c7d1] block text-[11px]">
                Travel Time &amp; Commute Anchored To
              </span>
              <span className="font-bold text-[#0B2559] dark:text-white">
                {selectedHospital.split(' - ')[0]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#2F6E5E] dark:text-[#aff0db] font-semibold bg-white/80 dark:bg-[#111e33] px-2.5 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[#2F6E5E] dark:bg-[#aff0db]" />
            <span>Hospital Travel Duration Active</span>
          </div>
        </div>

        {/* Interactive Search Filters with Staggered Viewport Reveal (Progressive Disclosure) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar"
        >
          <span className="text-xs font-bold text-[#0B2559]/70 dark:text-[#E6ECF7]/70 whitespace-nowrap mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#0A6FA8] dark:text-[#3E9AD1]">tune</span>
            <span>Filters:</span>
          </span>
          {[
            { id: 'all', label: `All Stays (${featuredListings.length})`, icon: 'apartment' },
            { id: 'close', label: '< 1 mi to Hospital', icon: 'directions_walk' },
            { id: 'quiet', label: 'Day-Sleep Quiet (<28 dB)', icon: 'bedtime' },
            { id: 'laundry', label: 'In-Unit Scrub Laundry', icon: 'local_laundry_service' },
            { id: 'pets', label: 'Pet Friendly', icon: 'pets' },
          ].map((pill, idx) => {
            const isSelected = activeListingFilter === pill.id;
            return (
              <motion.button
                key={pill.id}
                type="button"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{
                  duration: 0.3,
                  delay: shouldReduceMotion ? 0 : idx * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => setActiveListingFilter(pill.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A6FA8] text-white shadow-xs'
                    : 'bg-white dark:bg-[#15233a] text-[#0B2559]/80 dark:text-[#E6ECF7]/80 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:border-[#0A6FA8] hover:text-[#0A6FA8] focus-visible:text-[#0A6FA8]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{pill.icon}</span>
                <span className="tabular-nums">{pill.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* 3-Column Grid of Featured Listings with Staggered Viewport Entrance */}
        {displayedFeaturedListings.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-[#111e33] border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <span className="material-symbols-outlined text-4xl text-[#0A6FA8] mb-2">filter_alt_off</span>
            <h4 className="text-base font-bold text-[#0B2559] dark:text-white mb-1">No Sanctuaries Match Filter</h4>
            <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mb-4">
              Try choosing another clinical amenity or view all curated hospital stays.
            </p>
            <button
              type="button"
              onClick={() => setActiveListingFilter('all')}
              className="px-4 py-2 rounded-full bg-[#0A6FA8] text-white text-xs font-bold shadow-xs cursor-pointer hover:bg-[#0C7EBF] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0C7EBF]"
            >
              Reset to All Stays
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedFeaturedListings.map((listing, index) => {
              const isSaved = savedListingIds.includes(listing.id);
              return (
                <ObservedListingCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                  isSaved={isSaved}
                  onToggleSave={onToggleSave}
                  onSelectListing={handleSelectListing}
                  onRequestToBook={onRequestToBookListing}
                  shouldReduceMotion={shouldReduceMotion}
                  selectedHospital={selectedHospital}
                  isNightShiftMode={isNightShiftMode}
                />
              );
            })}
          </div>
        )}

        {/* View All Stays Navigation Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111e33] border border-[rgba(11,37,89,0.1)] dark:border-[#233550] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-[#005684]/10 text-[#005684] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">map</span>
            </span>
            <div>
              <h3 className="font-bold text-base text-[#001848] dark:text-white">
                Looking for more hospital locations or transit lines?
              </h3>
              <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                Filter by hospital shuttle routes, dedicated scrub washers, and certified quiet decibels.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExecuteSearch}
            className="px-6 py-3 rounded-xl bg-[#001848] hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] text-white text-xs font-bold transition-all duration-200 ease-in-out shadow-xs cursor-pointer whitespace-nowrap"
          >
            Open Interactive Search &amp; Map →
          </button>
        </div>
      </section>

      {/* 4. HOW NURSES PILLOW PROTECTS YOUR ASSIGNMENT */}
      <section
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}
        className="w-full bg-[#f2f3ff] dark:bg-[#111e33] px-4 sm:px-6 lg:px-12 py-16 lg:py-24 transition-colors"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2559] dark:text-white tracking-tight mb-2">
            How Nurses Pillow Protects Your Assignment
          </h2>
          <p className="text-sm sm:text-base text-[#404850] dark:text-[#c0c7d1] max-w-xl mx-auto mb-8">
            Tailored explicitly for traveling clinical schedules with zero marketplace games.
          </p>

          {/* Toggle Pills */}
          <div className="inline-flex p-1 rounded-full bg-[#eaedff] dark:bg-[#16253c] mb-12 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveProtectionTab('clinicians')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer ${
                activeProtectionTab === 'clinicians'
                  ? 'bg-white dark:bg-[#0A6FA8] text-[#0B2559] dark:text-white shadow-xs'
                  : 'text-[#404850] dark:text-[#93ccff]'
              }`}
            >
              For Traveling Clinicians
            </button>
            <button
              type="button"
              onClick={() => setActiveProtectionTab('hosts')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer ${
                activeProtectionTab === 'hosts'
                  ? 'bg-white dark:bg-[#0A6FA8] text-[#0B2559] dark:text-white shadow-xs'
                  : 'text-[#404850] dark:text-[#93ccff]'
              }`}
            >
              For Property Hosts
            </button>
          </div>

          {/* 3 Protection Cards - Dynamic based on activeProtectionTab */}
          <AnimatePresence mode="wait">
            {activeProtectionTab === 'clinicians' ? (
              <motion.div
                key="clinicians"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left"
              >
                {[
                  {
                    step: 1,
                    title: 'Hospital Search',
                    body: 'Search listings indexed strictly by verified drive time, hospital shuttle lines, or walking transit to your medical center.',
                    meta: 'Radius slider & day-shift filters',
                  },
                  {
                    step: 2,
                    title: '4–Step Verification',
                    body: 'Quick 2FA mobile auth, Stripe biometric ID match, and automated Nursys nursing board check create your vetted profile in minutes.',
                    meta: 'License numbers remain private',
                  },
                  {
                    step: 3,
                    title: '$0 Booking Fees',
                    body: 'Travelers pay exactly what hosts list. Escrow pre-authorization hold with 24–hour host response SLA and shift-cancellation tiers.',
                    meta: 'All utilities itemized & guaranteed',
                  },
                ].map((card, idx) => (
                  <div
                    key={card.step}
                    className="bg-white dark:bg-[#15233a] p-8 rounded-[20px] shadow-xs border border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-full bg-[#0A6FA8] text-white flex items-center justify-center font-bold text-sm mb-6">
                        {card.step}
                      </div>
                      <h3 className="text-lg font-bold text-[#0B2559] dark:text-white mb-2">{card.title}</h3>
                      <p className="text-sm text-[#404850] dark:text-[#c0c7d1] leading-relaxed">
                        {card.body}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
                      <span className="text-xs text-[#0A6FA8] dark:text-[#93ccff] font-semibold">
                        {card.meta}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="hosts"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
                  {[
                    {
                      step: 1,
                      color: 'bg-[#195b4c] dark:bg-[#aff0db] text-white dark:text-[#0B1626]',
                      metaColor: 'text-[#195b4c] dark:text-[#aff0db]',
                      title: '100% Verified Clinicians',
                      body: 'Every guest is an active licensed healthcare professional verified via primary-source Nursys and state medical boards. Zero party tolerance, quiet day-sleepers, and respectful professionals.',
                      meta: 'Board-verified license & ID screening',
                    },
                    {
                      step: 2,
                      color: 'bg-[#0A6FA8] text-white',
                      metaColor: 'text-[#0A6FA8] dark:text-[#93ccff]',
                      title: 'Guaranteed Mid-Term Income',
                      body: 'Enjoy predictable 30 to 90-day stays aligned with 13-week hospital rotations. Transparent 5% flat platform fee with automated direct deposits powered by Stripe Connect Escrow.',
                      meta: 'Zero guest churn • Flat 5% host take-rate',
                    },
                    {
                      step: 3,
                      color: 'bg-[#745b0d] text-white',
                      metaColor: 'text-[#745b0d] dark:text-[#ffdf91]',
                      title: 'Contract Flex Vacancy Protection',
                      body:"If a nurse's clinical placement is unexpectedly cancelled by the hospital with staffing agency documentation, hosts receive a guaranteed 14-day vacancy stipend payout and re-listing boost.",
                      meta: '14-day vacancy stipend guarantee',
                    },
                  ].map((card, idx) => (
                    <div
                      key={card.step}
                      className="bg-white dark:bg-[#15233a] p-8 rounded-[20px] shadow-xs border border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className={`w-10 h-10 rounded-full ${card.color} flex items-center justify-center font-bold text-sm mb-6`}>
                          {card.step}
                        </div>
                        <h3 className="text-lg font-bold text-[#0B2559] dark:text-white mb-2">{card.title}</h3>
                        <p className="text-sm text-[#404850] dark:text-[#c0c7d1] leading-relaxed">
                          {card.body}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
                        <span className={`text-xs ${card.metaColor} font-semibold`}>
                          {card.meta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {onGoToHostPortal && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onGoToHostPortal}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 ease-in-out cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_home</span>
                      <span>Enter Host Workspace &amp; Add Sanctuary Listing →</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 4.5 MARKETING & TRUST COMPARISON MATRIX */}
      <section
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
        className="px-4 sm:px-6 lg:px-12 py-16 max-w-7xl mx-auto w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0A6FA8]/10 text-[#0A6FA8] dark:bg-[#3E9AD1]/15 dark:text-[#3E9AD1] mb-3">
            <span className="material-symbols-outlined text-[15px]">compare_arrows</span>
            <span>Marketplace Transparency</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2559] dark:text-white tracking-tight mb-3">
            Nurses Pillow vs. Traditional Directories (Furnished Finder)
          </h2>
          <p className="text-sm sm:text-base text-[#404850] dark:text-[#c0c7d1] max-w-2xl mx-auto leading-relaxed mb-10">
            Verified healthcare professionals only. $0 to list — pay only when booked. No upfront paywalls or unvetted marketplace risks.
          </p>

          {/* Desktop & Tablet Table (Hidden on small mobile) */}
          <div className="hidden sm:block overflow-hidden rounded-[24px] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] bg-white dark:bg-[#111e33] shadow-md text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#EFF6FB] dark:bg-[#15233a] border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550] text-[#0B2559] dark:text-white">
                  <th className="p-4 sm:p-5 font-bold text-xs uppercase tracking-wider w-1/3">Standard / Feature</th>
                  <th className="p-4 sm:p-5 font-bold text-xs uppercase tracking-wider w-1/3 bg-[#0A6FA8]/10 text-[#0A6FA8] dark:text-[#3E9AD1]">
                    Nurses Pillow
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-xs uppercase tracking-wider w-1/3 opacity-70">
                    Traditional Directories
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm text-[#404850] dark:text-[#c0c7d1]">
                <tr className="border-b border-[rgba(11,37,89,0.04)] dark:border-white/5">
                  <td className="p-4 sm:p-5 font-bold text-[#0B2559] dark:text-white">Upfront Cost</td>
                  <td className="p-4 sm:p-5 font-bold text-[#2F6E5E] dark:text-[#aff0db] bg-[#0A6FA8]/5 tabular-nums">
                    $0 to list — pay only when booked
                  </td>
                  <td className="p-4 sm:p-5 opacity-80 tabular-nums">$199/yr. recurring upfront fee</td>
                </tr>
                <tr className="border-b border-[rgba(11,37,89,0.04)] dark:border-white/5">
                  <td className="p-4 sm:p-5 font-bold text-[#0B2559] dark:text-white">Traveler Identity</td>
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white bg-[#0A6FA8]/5">
                    <div className="flex items-center gap-1.5 text-[#2F6E5E] dark:text-[#aff0db] font-bold">
                      <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                      <span>Biometric ID Verified</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 opacity-80">Unverified at signup</td>
                </tr>
                <tr className="border-b border-[rgba(11,37,89,0.04)] dark:border-white/5">
                  <td className="p-4 sm:p-5 font-bold text-[#0B2559] dark:text-white">Professional Credentials</td>
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white bg-[#0A6FA8]/5">
                    <div className="flex items-center gap-1.5 text-[#2F6E5E] dark:text-[#aff0db] font-bold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Official Registry/Board Verified</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 opacity-80">Unchecked / Self-reported</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#0B2559] dark:text-white">Booking &amp; Payments</td>
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white bg-[#0A6FA8]/5">
                    <div className="flex items-center gap-1.5 text-[#0A6FA8] dark:text-[#3E9AD1] font-bold">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      <span>Secure Stripe Connect split</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 opacity-80">Manual off-platform coordination</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Touch Cards (< 640px) */}
          <div className="sm:hidden space-y-3 text-left">
            {[
              {
                feature: 'Upfront Cost',
                np: '$0 to list — pay only when booked',
                trad: '$199/yr. recurring fee',
                icon: 'payments',
              },
              {
                feature: 'Traveler Identity',
                np: 'Biometric ID Verified',
                trad: 'Unverified at signup',
                icon: 'fingerprint',
              },
              {
                feature: 'Professional Credentials',
                np: 'Official Registry/Board Verified',
                trad: 'Unchecked / Self-reported',
                icon: 'verified',
              },
              {
                feature: 'Booking & Payments',
                np: 'Secure Stripe Connect split',
                trad: 'Manual off-platform coordination',
                icon: 'lock',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] bg-white dark:bg-[#111e33] shadow-xs"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[#404850] dark:text-[#93ccff] mb-2.5">
                  {item.feature}
                </div>
                <div className="p-3 rounded-xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 mb-2">
                  <div className="text-[10px] font-bold text-[#0A6FA8] dark:text-[#3E9AD1] uppercase mb-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Nurses Pillow
                  </div>
                  <div className="text-xs font-bold text-[#0B2559] dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#2F6E5E] dark:text-[#aff0db]">{item.icon}</span>
                    <span>{item.np}</span>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-xs text-gray-500 dark:text-gray-400">
                  <div className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">Traditional Directories</div>
                  <div>{item.trad}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 5. HOST COMMUNITY INVITATION CARD (Accessible, Clean Light Contrast with Scroll Reveal) */}
      <section
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
        className="px-4 sm:px-6 lg:px-12 py-16 max-w-7xl mx-auto w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[24px] p-8 sm:p-12 bg-white dark:bg-[#111e33] border border-[rgba(11,37,89,0.12)] dark:border-[#233550] shadow-md relative overflow-hidden"
        >
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#195b4c]/10 text-[#195b4c] dark:bg-[#aff0db]/15 dark:text-[#aff0db] mb-4">
              <span className="material-symbols-outlined text-[14px]">home_work</span>
              <span>Host Partner Network</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B2559] dark:text-white tracking-tight mb-3">
              Have a quiet property near a major hospital?
            </h2>

            <p className="text-sm sm:text-base text-[#404850] dark:text-[#c0c7d1] leading-relaxed mb-6">
              Connect directly with verified traveling RNs, MDs, and allied specialists. Enjoy guaranteed 13-week rotations, zero party risks, and transparent payments with 5% flat platform take-rate.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {onGoToHostPortal && (
                <button
                  type="button"
                  onClick={onGoToHostPortal}
                  className="px-6 py-3.5 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white text-xs font-bold shadow-sm transition-all duration-200 ease-in-out cursor-pointer"
                >
                  Enter Host Portal
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-[#195b4c] font-bold">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>100% Nursys Verified Clinician Guests</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* DETAIL MODAL */}
      <Suspense fallback={null}>
      <ListingDetailModal
        listing={activeDetailListing}
        onClose={useCallback(() => setActiveDetailListing(null), [])}
        isNightShiftMode={isNightShiftMode}
        isSaved={activeDetailListing ? savedListingIds.includes(activeDetailListing.id) : false}
        onToggleSave={onToggleSave}
        isVerified={isVerified}
        onGoToVerification={onGoToVerification}
        selectedHospital={selectedHospital}
        checkInDate={earliestCheckIn}
        checkOutDate={latestCheckOut}
        onRequestToBook={useCallback((listing: HousingListing) => {
          setActiveDetailListing(null);
          onRequestToBookListing?.(listing);
        }, [onRequestToBookListing])}
      />
      </Suspense>
    </div>
  );
};
