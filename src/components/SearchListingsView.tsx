import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HousingListing } from '../types';
import { db } from '../services/database';
const ListingDetailModal = React.lazy(() => import('./ListingDetailModal').then((m) => ({ default: m.ListingDetailModal })));
const HealthcareAmenitiesFilterModal = React.lazy(() => import('./HealthcareAmenitiesFilterModal').then((m) => ({ default: m.HealthcareAmenitiesFilterModal })));
import { SearchListingsSkeleton } from './skeletons/SearchListingsSkeleton';
import { PillowSaveButton } from './PillowSaveButton';
import { SearchListingCard } from './SearchListingCard';
import { GoogleMapsSplitView } from './GoogleMapsSplitView';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ClinicalDatePicker } from './ClinicalDatePicker';
import { ClinicalDateRangePicker, calculateAssignmentDuration } from './ClinicalDateRangePicker';
import { Calendar as CalendarIcon, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateCommuteDuration, resolveHospitalCoordinates, getListingCoordinates } from '../lib/googleMapsCommute';
import { fetchLiveCommuteRoute, LiveCommuteResult } from '../services/liveCommuteApi';
import { useAvailability } from '../context/AvailabilityContext';

interface SearchListingsViewProps {
  isNightShiftMode: boolean;
  savedListingIds: string[];
  onToggleSave: (id: string) => void;
  isVerified: boolean;
  onGoToVerification: () => void;
  onRequestToBookListing?: (listing: HousingListing) => void;
  initialHospital?: string;
  initialDuration?: string;
  initialRadius?: number;
  initialCheckInDate?: string;
  initialCheckOutDate?: string;
  isLoading?: boolean;
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

export const SearchListingsView: React.FC<SearchListingsViewProps> = React.memo(({
  isNightShiftMode,
  savedListingIds,
  onToggleSave,
  isVerified,
  onGoToVerification,
  onRequestToBookListing,
  initialHospital = '',
  initialDuration = '13',
  initialRadius = 5,
  initialCheckInDate,
  initialCheckOutDate,
  isLoading,
}) => {


  const [selectedHospital, setSelectedHospital] = useState(initialHospital);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');
  const [commuteBuffer, setCommuteBuffer] = useState<number>(initialRadius);
  const isInitialPreset = ['4', '8', '13', '26'].includes(initialDuration);
  const parsedInitDur = parseInt(initialDuration, 10);
  const [selectedDuration, setSelectedDuration] = useState(isInitialPreset ? initialDuration : 'custom');
  const [customDuration, setCustomDuration] = useState<number>(() => {
    if (!isNaN(parsedInitDur) && parsedInitDur > 0) return parsedInitDur;
    if (initialCheckInDate && initialCheckOutDate) {
      const [y1, m1, d1] = initialCheckInDate.split('-').map(Number);
      const [y2, m2, d2] = initialCheckOutDate.split('-').map(Number);
      const diff = Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) return Math.max(1, Math.round(diff / 7));
    }
    return 13;
  });
  const [earliestCheckIn, setEarliestCheckIn] = useState(initialCheckInDate || '2026-10-05');
  const [latestCheckOut, setLatestCheckOut] = useState(
    initialCheckOutDate || '2027-01-04'
  );
  const [blackoutBlocks, setBlackoutBlocks] = useState<any[]>([]);

  // Sync dates when props change (e.g. user goes back to find housing and changes search params)
  useEffect(() => {
    if (initialCheckInDate) setEarliestCheckIn(initialCheckInDate);
    if (initialCheckOutDate) setLatestCheckOut(initialCheckOutDate);
    if (initialDuration) {
      const p = parseInt(initialDuration, 10);
      if (['4', '8', '13', '26'].includes(initialDuration)) {
        setSelectedDuration(initialDuration);
      } else if (!isNaN(p) && p > 0) {
        setSelectedDuration('custom');
        setCustomDuration(p);
      }
    }
  }, [initialCheckInDate, initialCheckOutDate, initialDuration]);

  // Safe display duration label preventing any NaN wks display
  const durationSummaryLabel = useMemo(() => {
    if (earliestCheckIn && latestCheckOut) {
      const dur = calculateAssignmentDuration(earliestCheckIn, latestCheckOut);
      if (dur.weeks > 0 && dur.days % 7 === 0) return `${dur.weeks} wks`;
      if (dur.weeks > 0) return `${dur.weeks}w ${dur.days % 7}d`;
      if (dur.days > 0) return `${dur.days} nights`;
    }
    if (['4', '8', '13', '26'].includes(selectedDuration)) {
      return `${selectedDuration} wks`;
    }
    if (typeof customDuration === 'number' && !isNaN(customDuration) && customDuration > 0) {
      return `${customDuration} wks`;
    }
    return '13 wks';
  }, [earliestCheckIn, latestCheckOut, selectedDuration, customDuration]);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [activeDetailListing, setActiveDetailListing] = useState<HousingListing | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split-map' | 'grid'>('split-map');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [sortOption, setSortOption] = useState<'closest' | 'price_low' | 'quiet_score'>('closest');
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'entire' | 'private' | 'blackout' | 'laundry' | 'parking'>('all');
  const [commuteMode, setCommuteMode] = useState<'transit' | 'drive'>('transit');
  const [selectedMapListingId, setSelectedMapListingId] = useState<string>('nc-duke-condo');
  const [mapZoom, setMapZoom] = useState(1);
  const [mapNotification, setMapNotification] = useState<string | null>(null);
  const [isGsaModalOpen, setIsGsaModalOpen] = useState(false);
useBodyScrollLock(isGsaModalOpen);

  const handleSelectOnMap = useCallback((id: string) => {
    setSelectedMapListingId(id);
    // On smaller screens where map is stacked below sidebar, gently scroll map into view
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.getElementById('split-map-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleViewDetails = useCallback((listing: HousingListing) => {
    setActiveDetailListing(listing);
  }, []);

  const [activeAmenityCount, setActiveAmenityCount] = useState(4);
  const [internalLoading, setInternalLoading] = useState(true);

  // Progressive disclosure for assignment details (dates, duration, radius buffer)
  const [isAssignmentDrawerExpanded, setIsAssignmentDrawerExpanded] = useState(false);

  // Filter Panel Expansion & Criteria (Smooth Height Transitions)
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(3500);
  const [minRating, setMinRating] = useState<number>(0);
  const [filterBlackout, setFilterBlackout] = useState(false);
  const [filterScrubWasher, setFilterScrubWasher] = useState(false);
  const [filterQuietDay, setFilterQuietDay] = useState(false);
  const [filterSoundMachine, setFilterSoundMachine] = useState(false);
  const [filterDedicatedParking, setFilterDedicatedParking] = useState(false);
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);
  const [filterContractFlex, setFilterContractFlex] = useState(false);

  // Reset all filters to default baseline
  const handleResetAllFilters = useCallback(() => {
    setActiveFilterChip('all');
    setMaxPrice(3500);
    setMinRating(0);
    setFilterBlackout(false);
    setFilterScrubWasher(false);
    setFilterQuietDay(false);
    setFilterSoundMachine(false);
    setFilterDedicatedParking(false);
    setFilterPetFriendly(false);
    setFilterContractFlex(false);
    setCommuteBuffer(initialRadius);
  }, [initialRadius]);

  // Active filter count for badge indicator
  const activePanelFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilterChip !== 'all') count++;
    if (maxPrice < 3500) count++;
    if (minRating > 0) count++;
    if (filterBlackout) count++;
    if (filterScrubWasher) count++;
    if (filterQuietDay) count++;
    if (filterSoundMachine) count++;
    if (filterDedicatedParking) count++;
    if (filterPetFriendly) count++;
    if (filterContractFlex) count++;
    return count;
  }, [
    activeFilterChip,
    maxPrice,
    minRating,
    filterBlackout,
    filterScrubWasher,
    filterQuietDay,
    filterSoundMachine,
    filterDedicatedParking,
    filterPetFriendly,
    filterContractFlex,
  ]);

  // Initial simulated load for realistic clinical data fetching feedback and database sync
  const [listingsVersion, setListingsVersion] = useState(0);
  useEffect(() => {
    Promise.all([
      db.fetchListings(),
      db.fetchBookings(),
      db.fetchAllAvailabilityBlocks(),
    ]).then(([_, __, blocks]) => {
      if (Array.isArray(blocks)) {
        setBlackoutBlocks(blocks);
      }
      setListingsVersion(v => v + 1);
    }).catch(console.error);

    const timer = setTimeout(() => {
      setInternalLoading(false);
    }, 550);
    return () => clearTimeout(timer);
  }, []);

  // Re-trigger brief skeleton transition when hospital or key search criteria change
  const prevFilterRef = useRef({ selectedHospital, commuteBuffer, selectedDuration });
  useEffect(() => {
    if (
      prevFilterRef.current.selectedHospital !== selectedHospital ||
      prevFilterRef.current.commuteBuffer !== commuteBuffer ||
      prevFilterRef.current.selectedDuration !== selectedDuration
    ) {
      prevFilterRef.current = { selectedHospital, commuteBuffer, selectedDuration };
      setInternalLoading(true);
      const timer = setTimeout(() => {
        setInternalLoading(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [selectedHospital, commuteBuffer, selectedDuration]);

  const isDataLoading = isLoading !== undefined ? isLoading : internalLoading;

  const triggerLiveQueryRefresh = () => {
    setInternalLoading(true);
    db.fetchAllAvailabilityBlocks().then(blocks => {
      if (Array.isArray(blocks)) setBlackoutBlocks(blocks);
      setListingsVersion(v => v + 1);
    }).catch(console.error);
    setTimeout(() => {
      setInternalLoading(false);
    }, 600);
  };

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
        setIsGsaModalOpen(false);
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

  const durationOptions = [
    { label: '4 wks', value: '4' },
    { label: '8 wks', value: '8' },
    { label: '13 wks', value: '13' },
    { label: '26 wks', value: '26' },
    { label: 'Custom', value: 'custom' },
  ];

  const commuteOptions = [
    { miles: 1, label: '1 mi', desc: 'Shift walk / immediate' },
    { miles: 3, label: '3 mi', desc: 'Shift walk/bike' },
    { miles: 5, label: '5 mi', desc: 'Quick commute' },
    { miles: 10, label: '10 mi', desc: 'Suburban retreat' },
    { miles: 15, label: '15+ mi', desc: 'Max value radius' },
  ];

  const [popularHubs, setPopularHubs] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    db.fetchHospitals().then((data: any[]) => {
      if (!active || !Array.isArray(data)) return;
      const names = data.map((hospital: any) => hospital.name).filter(Boolean);
      setPopularHubs(names);
      setSelectedHospital((current) => current || initialHospital || names[0] || "");
    }).catch((error) => console.error("Unable to load the active hospital directory:", error));
    return () => { active = false; };
  }, [initialHospital]);

  const filteredHospitals = useMemo(() => {
    if (!hospitalSearchQuery.trim()) return popularHubs;
    const q = hospitalSearchQuery.toLowerCase();
    return popularHubs.filter((h) => h.toLowerCase().includes(q));
  }, [hospitalSearchQuery, popularHubs]);

  // Filter listings based on current settings
  const filteredListings = useMemo(() => {
    const dbListings = db.getListings() || [];
    let list = dbListings;

    // Single-pass early return filtering
    const targetWeeks = selectedDuration === 'custom' ? (customDuration || 13) : parseInt(selectedDuration, 10);

    const filtered = [];
    for (let i = 0; i < list.length; i++) {
      const l = list[i];

      // 0. Listing Visibility Gating (Exclude unpublished or unlisted properties)
      if (l.is_published === false || (l as any).status === 'unlisted' || (l as any).status === 'draft') {
        continue;
      }

      // 1. Space type chip filter
      const typeLower = l.propertyType?.toLowerCase() || '';
      if (activeFilterChip === 'entire' && !(typeLower.includes('entire') || typeLower.includes('condo'))) continue;
      if (activeFilterChip === 'private' && !(typeLower.includes('room') || typeLower.includes('suite') || typeLower.includes('studio'))) continue;

      let hasBlackout = !!l.amenities?.blackoutCurtains;
      let hasLaundry = !!l.amenities?.washerDryerInUnit;
      let hasParking = !!l.amenities?.dedicatedParking;
      let hasQuiet = l.amenities?.daySleeperQuietHours === true;

      if (l.highlightBadges && (!hasBlackout || !hasLaundry || !hasParking || !hasQuiet)) {
        for (let j = 0; j < l.highlightBadges.length; j++) {
          const badgeLower = l.highlightBadges[j].toLowerCase();
          if (!hasBlackout && badgeLower.includes('blackout')) hasBlackout = true;
          if (!hasLaundry && (badgeLower.includes('washer') || badgeLower.includes('laundry'))) hasLaundry = true;
          if (!hasParking && badgeLower.includes('parking')) hasParking = true;
          if (!hasQuiet && (badgeLower.includes('quiet') || badgeLower.includes('day-sleeper'))) hasQuiet = true;
        }
      }

      if (activeFilterChip === 'blackout' && !hasBlackout) continue;
      if (activeFilterChip === 'laundry' && !hasLaundry) continue;
      if (activeFilterChip === 'parking' && !hasParking) continue;

      // 2. Commute Buffer
      if (commuteBuffer && commuteBuffer < 15) {
        const commute = calculateCommuteDuration(l, selectedHospital);
        if (commute.distanceMiles > commuteBuffer) continue;
      }

      // 3. Assignment Duration Bounds
      if (targetWeeks && !isNaN(targetWeeks)) {
        const minWeeks = l.minWeeks || ((typeLower.includes('entire') || typeLower.includes('condo')) ? 8 : 4);
        const maxWeeks = l.maxWeeks || 52;
        if (targetWeeks < minWeeks || targetWeeks > maxWeeks) continue;
      }

      // 4. Extended filter criteria
      if (maxPrice < 3500 && l.monthlyRate > maxPrice) continue;
      if (minRating > 0 && l.nurseRating < minRating) continue;
      if (filterBlackout && !hasBlackout) continue;
      if (filterScrubWasher && !hasLaundry) continue;
      if (filterQuietDay && !hasQuiet) continue;
      if (filterSoundMachine && !l.amenities?.whiteNoiseMachine) continue;
      if (filterDedicatedParking && !hasParking) continue;
      if (filterPetFriendly && !l.amenities?.petFriendly) continue;
      if (filterContractFlex && !l.contractFlexProtection) continue;

      // 5. Strictly Exclude Conflicting Blackout Dates & Booking Overlaps
      if (earliestCheckIn && latestCheckOut) {
        // 5a. Blackout Dates / Availability Blocks Check
        let hasBlackoutConflict = false;
        for (let k = 0; k < blackoutBlocks.length; k++) {
          const blk = blackoutBlocks[k];
          if (blk.listing_id !== l.id || !blk.is_blocked) continue;
          const bStart = blk.start_date;
          const bEnd = blk.end_date;
          if (!bStart || !bEnd) continue;
          // Interval overlap: [bStart, bEnd) overlaps with [earliestCheckIn, latestCheckOut)
          if (bStart < latestCheckOut && bEnd > earliestCheckIn) {
            hasBlackoutConflict = true;
            break;
          }
        }
        if (hasBlackoutConflict) continue;

        // 5b. Booking Conflicts Check: strictly exclude overlapping active bookings
        const bookings = db.getBookings() || [];
        let isBooked = false;
        for (let b = 0; b < bookings.length; b++) {
          const booking = bookings[b];
          const bListingId = booking.listing_id || (booking as any).listingId;
          if (bListingId !== l.id) continue;
          if (booking.status === 'declined' || booking.status === 'cancelled' || booking.status === 'refunded') continue;
          const bStart = booking.start_date || (booking as any).startDate;
          const bEnd = booking.end_date || (booking as any).endDate;
          if (!bStart || !bEnd) continue;

          if (bStart < latestCheckOut && bEnd > earliestCheckIn) {
            isBooked = true;
            break;
          }
        }
        if (isBooked) continue;
      }

      filtered.push(l); // Passed all active filters
    }
    list = filtered;

    // Sort listings
    if (sortOption === 'closest') {
      list = list.map(item => ({ item, dist: calculateCommuteDuration(item, selectedHospital).driveMinutes }))
                 .sort((a, b) => a.dist - b.dist)
                 .map(({ item }) => item);
    } else if (sortOption === 'price_low') {
      list.sort((a: HousingListing, b: HousingListing) => a.monthlyRate - b.monthlyRate);
    } else if (sortOption === 'quiet_score') {
      list.sort((a: HousingListing, b: HousingListing) => b.nurseRating - a.nurseRating);
    }

    return list;
  }, [
    activeFilterChip,
    sortOption,
    maxPrice,
    minRating,
    filterBlackout,
    filterScrubWasher,
    filterQuietDay,
    filterSoundMachine,
    filterDedicatedParking,
    filterPetFriendly,
    filterContractFlex,
    commuteBuffer,
    selectedDuration,
    customDuration,
    selectedHospital,
    earliestCheckIn,
    latestCheckOut,
    listingsVersion,
    blackoutBlocks,
  ]);

  const selectedMapListing = useMemo(() => {
    if (!selectedMapListingId) return null;
    return filteredListings.find((l: HousingListing) => l.id === selectedMapListingId) || filteredListings[0] || null;
  }, [selectedMapListingId, filteredListings]);

  const currentMapListingIndex = useMemo(() => {
    return filteredListings.findIndex((l) => l.id === selectedMapListing?.id);
  }, [filteredListings, selectedMapListing]);

  const handlePrevMapListing = useCallback(() => {
    if (filteredListings.length === 0) return;
    const prevIdx = (currentMapListingIndex - 1 + filteredListings.length) % filteredListings.length;
    setSelectedMapListingId(filteredListings[prevIdx].id);
  }, [filteredListings, currentMapListingIndex]);

  const handleNextMapListing = useCallback(() => {
    if (filteredListings.length === 0) return;
    const nextIdx = (currentMapListingIndex + 1) % filteredListings.length;
    setSelectedMapListingId(filteredListings[nextIdx].id);
  }, [filteredListings, currentMapListingIndex]);

  const handleToggleCommuteMode = useCallback((mode: 'transit' | 'drive') => {
    setCommuteMode(mode);
    setMapNotification(mode === 'transit' ? 'Transit mode active: Bus & rail times' : 'Drive mode active: Vehicle commute times');
    setTimeout(() => {
      setMapNotification(null);
    }, 2200);
  }, []);

  // Fetch real Google Maps Routes API commute data on-demand for active map preview
  const [selectedMapLiveRoute, setSelectedMapLiveRoute] = useState<LiveCommuteResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (selectedMapListing && selectedHospital) {
      const origin = getListingCoordinates(selectedMapListing);
      const dest = resolveHospitalCoordinates(selectedHospital);
      fetchLiveCommuteRoute({ lat: origin.lat, lng: origin.lng }, { lat: dest.lat, lng: dest.lng }, commuteMode)
        .then((res) => {
          if (isMounted && res?.success) {
            setSelectedMapLiveRoute(res);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [selectedMapListing?.id, selectedHospital, commuteMode]);

  return (
    <div className={`w-full min-h-screen transition-colors ${isNightShiftMode ? 'bg-[#08101C] text-[#E6ECF7]' : 'bg-[#faf8ff] text-[#001848]'}`}>
      {/* Commute Mode Feedback Toast */}
      <AnimatePresence>
        {mapNotification && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#0B2559]/95 dark:bg-[#111e33]/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-[rgba(255,255,255,0.2)] backdrop-blur-md flex items-center gap-2 pointer-events-none"
          >
            <span className="material-symbols-outlined text-[16px] text-[#aff0db]">
              {commuteMode === 'transit' ? 'directions_bus' : 'directions_car'}
            </span>
            <span>{mapNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. COMPACT CLINICAL SEARCH & ASSIGNMENT HUB */}
      <section className="w-full bg-white dark:bg-[#111e33] border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-xs px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          {/* Main Controls Row: Single Compact Responsive Bar */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-2.5">
            {/* Hospital Selector (Primary Clinical Anchor) */}
            <div ref={hospitalDropdownRef} className="relative flex-1 min-w-[180px] sm:min-w-[260px]">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-10 px-3 rounded-xl bg-[#EFF6FB] dark:bg-[#182840] border border-transparent hover:border-[#0A6FA8]/30 dark:hover:border-[#3E9AD1]/40 transition-colors flex items-center justify-between cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-expanded={isDropdownOpen}
                aria-label="Select assigned hospital campus"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[#0A6FA8] dark:text-[#3E9AD1] text-[18px] shrink-0">
                    local_hospital
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#0B2559] dark:text-white truncate">
                    {selectedHospital}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#404850] dark:text-[#93ccff] text-[18px] shrink-0 transition-transform duration-200 group-hover:text-[#0A6FA8] focus-visible:text-[#0A6FA8]">
                  {isDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#15233a] rounded-xl shadow-md z-50 border border-[#c0c7d1]/40 dark:border-[#2b4162] overflow-hidden flex flex-col max-w-lg"
                  >
                    {/* Quick search input */}
                    <div className="p-2 border-b border-[#c0c7d1]/20 dark:border-[#2b4162] bg-[#f8faff] dark:bg-[#111e33]">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                          search
                        </span>
                        <input
                          aria-label="Search hospitals"
                          type="text"
                          value={hospitalSearchQuery}
                          onChange={(e) => setHospitalSearchQuery(e.target.value)}
                          placeholder="Search or scroll campuses..."
                          className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#182840] border border-gray-200 dark:border-[#233550] text-[#001848] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#005684]"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Scrollable list container */}
                    <div
                      className="max-h-60 overflow-y-auto custom-scrollbar py-1"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {filteredHospitals.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                          No hospital matches "{hospitalSearchQuery}".
                        </div>
                      ) : (
                        filteredHospitals.map((hosp) => (
                          <div
                            key={hosp}
                            onClick={() => {
                              setSelectedHospital(hosp);
                              setIsDropdownOpen(false);
                              setHospitalSearchQuery('');
                            }}
                            className={`px-3 py-2 text-xs font-semibold hover:bg-[#f2f3ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#f2f3ff] dark:hover:bg-[#1f3350] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1f3350] cursor-pointer flex items-center justify-between transition-colors ${
                              selectedHospital === hosp ? 'bg-[#eaedff] dark:bg-[#1f3350] text-[#005684]' : 'text-[#001848] dark:text-white'
                            }`}
                          >
                            <span className="truncate pr-2">{hosp}</span>
                            {selectedHospital === hosp ? (
                              <span className="material-symbols-outlined text-[14px] text-[#195b4c] shrink-0">check</span>
                            ) : (
                              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono shrink-0">Verified</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Scroll indicator footer */}
                    <div className="px-2.5 py-1 bg-[#f8faff] dark:bg-[#111e33] border-t border-[#c0c7d1]/20 dark:border-[#2b4162] flex items-center justify-between text-[10px] text-[#404850] dark:text-[#9CB3D3]">
                      <span>{filteredHospitals.length} campuses</span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">swap_vert</span>
                        Scroll to explore
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Assignment Details Trigger (Progressive Disclosure) */}
            <button
              type="button"
              onClick={() => {
                setIsAssignmentDrawerExpanded((prev) => !prev);
                if (isFilterPanelExpanded) setIsFilterPanelExpanded(false);
              }}
              className={`h-10 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-200 ease-in-out duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                isAssignmentDrawerExpanded
                  ? 'bg-[#0A6FA8] text-white shadow-xs'
                  : 'bg-[#EFF6FB] dark:bg-[#182840] text-[#0B2559] dark:text-[#E6ECF7] hover:bg-[#e2edf7] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#e2edf7] dark:hover:bg-[#20324e] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#20324e]'
              }`}
              title="Edit move-in date, contract rotation length, or commute radius"
              aria-expanded={isAssignmentDrawerExpanded}
              aria-controls="assignment-drawer-panel"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0A6FA8] dark:text-[#3E9AD1]">
                calendar_today
              </span>
              <span>
                {formatDateFriendly(earliestCheckIn)} · {durationSummaryLabel} · {commuteBuffer} mi
              </span>
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                  isAssignmentDrawerExpanded ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Clinical Filters Trigger (Progressive Disclosure) */}
            <button
              type="button"
              id="toggle-filter-panel-button"
              onClick={() => {
                setIsFilterPanelExpanded((prev) => !prev);
                if (isAssignmentDrawerExpanded) setIsAssignmentDrawerExpanded(false);
              }}
              className={`h-10 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-200 ease-in-out duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                isFilterPanelExpanded || activePanelFilterCount > 0
                  ? 'bg-[#001848] text-white shadow-xs'
                  : 'bg-[#EFF6FB] dark:bg-[#182840] text-[#0B2559] dark:text-[#E6ECF7] hover:bg-[#e2edf7] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#e2edf7] dark:hover:bg-[#20324e] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#20324e]'
              }`}
              title="Filter by rent ceiling, day-sleeper quiet score, and shift logistics"
              aria-expanded={isFilterPanelExpanded}
              aria-controls="search-filter-panel"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Filters</span>
              {activePanelFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#001848] text-[10px] flex items-center justify-center font-extrabold shadow-2xs">
                  {activePanelFilterCount}
                </span>
              )}
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                  isFilterPanelExpanded ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Quick Actions & Layout Toggle (Right-aligned) */}
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsGsaModalOpen(true)}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
                title="Calculate allowable federal GSA lodging per-diem (Phase 2 Contract Scope)"
              >
                <span className="material-symbols-outlined text-[14px]">lock_clock</span>
                <span>GSA Stipend</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono font-bold">Phase 2</span>
              </button>

              <button
                type="button"
                onClick={triggerLiveQueryRefresh}
                disabled={isDataLoading}
                title="Refresh listings for assigned campus"
                aria-label="Refresh listings for assigned campus"
                className="h-9 w-9 rounded-xl bg-[#EFF6FB] dark:bg-[#182840] hover:bg-[#e2edf7] dark:hover:bg-[#20324e] text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className={`material-symbols-outlined text-[16px] ${isDataLoading ? 'animate-spin' : ''}`}>
                  sync
                </span>
              </button>

              {/* Global Commute Mode Switcher (Transit vs Drive) */}
              <div className="inline-flex items-center p-0.5 rounded-xl bg-[#EFF6FB] dark:bg-[#182840] border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
                <button
                  type="button"
                  onClick={() => handleToggleCommuteMode('transit')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                    commuteMode === 'transit'
                      ? 'bg-[#0A6FA8] text-white shadow-xs'
                      : 'text-[#404850] dark:text-[#c0c7d1] hover:text-[#0B2559] dark:hover:text-white'
                  }`}
                  title="Switch commute calculations to Transit & Hospital Shuttle routes"
                  aria-pressed={commuteMode === 'transit'}
                >
                  <span className="material-symbols-outlined text-[14px]">directions_bus</span>
                  <span className="hidden sm:inline">Transit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCommuteMode('drive')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                    commuteMode === 'drive'
                      ? 'bg-[#0A6FA8] text-white shadow-xs'
                      : 'text-[#404850] dark:text-[#c0c7d1] hover:text-[#0B2559] dark:hover:text-white'
                  }`}
                  title="Switch commute calculations to Driving & Highway vehicle times"
                  aria-pressed={commuteMode === 'drive'}
                >
                  <span className="material-symbols-outlined text-[14px]">directions_car</span>
                  <span className="hidden sm:inline">Drive</span>
                </button>
              </div>

              {/* Desktop View Mode Switcher */}
              <div className="hidden lg:inline-flex items-center p-0.5 rounded-xl bg-[#EFF6FB] dark:bg-[#182840]">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('split-map');
                    setIsMapExpanded(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                    viewMode === 'split-map' && !isMapExpanded
                      ? 'bg-white dark:bg-[#0B2559] text-[#001848] dark:text-white shadow-xs'
                      : 'text-[#404850] dark:text-[#c0c7d1]'
                  }`}
                  title="View split map and listings"
                >
                  <span className="material-symbols-outlined text-[15px]">vertical_split</span>
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('split-map');
                    setIsMapExpanded(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                    viewMode === 'split-map' && isMapExpanded
                      ? 'bg-white dark:bg-[#0B2559] text-[#001848] dark:text-white shadow-xs'
                      : 'text-[#404850] dark:text-[#c0c7d1]'
                  }`}
                  title="Expand map to fullscreen (hide list)"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Full Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('grid');
                    setIsMapExpanded(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#0B2559] text-[#001848] dark:text-white shadow-xs'
                      : 'text-[#404850] dark:text-[#c0c7d1]'
                  }`}
                  title="View full grid layout"
                >
                  <span className="material-symbols-outlined text-[15px]">grid_view</span>
                  <span>Grid</span>
                </button>
              </div>

              {/* Mobile & Medium Device Segmented Switcher (< lg) */}
              <div className="lg:hidden inline-flex items-center p-0.5 rounded-xl bg-[#EFF6FB] dark:bg-[#182840] border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                    !isMapExpanded
                      ? 'bg-[#0A6FA8] text-white shadow-xs'
                      : 'text-[#404850] dark:text-[#c0c7d1]'
                  }`}
                  aria-pressed={!isMapExpanded}
                >
                  <span className="material-symbols-outlined text-[15px]">list</span>
                  <span>List ({filteredListings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('split-map');
                    setIsMapExpanded(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                    isMapExpanded
                      ? 'bg-[#0A6FA8] text-white shadow-xs'
                      : 'text-[#404850] dark:text-[#c0c7d1]'
                  }`}
                  aria-pressed={isMapExpanded}
                >
                  <span className="material-symbols-outlined text-[15px]">map</span>
                  <span>Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* PROGRESSIVE DISCLOSURE 1: ASSIGNMENT DATES & RADIUS DRAWER */}
          <AnimatePresence initial={false}>
            {isAssignmentDrawerExpanded && (
              <motion.div
                id="assignment-drawer-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                  transition: {
                    height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.2, delay: 0.04 },
                  },
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  transition: {
                    height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.12 },
                  },
                }}
                className="border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550] pt-3 pb-1 px-1 -mx-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-[#EFF6FB]/60 dark:bg-[#15233a] border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
                  {/* Assignment Dates (Connected Range) */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#404850] dark:text-[#93ccff] mb-1">
                      Assignment Dates
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDateRangeModalOpen(true)}
                      className="w-full h-12 px-3.5 rounded-xl border border-[rgba(11,37,89,0.12)] dark:border-[#233550] bg-white dark:bg-[#182840] hover:border-[#0A6FA8] flex items-center justify-between text-left cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CalendarIcon className="w-4 h-4 text-[#0A6FA8] dark:text-[#3E9AD1] shrink-0" aria-hidden="true" />
                        <span className="text-xs font-bold text-[#0B2559] dark:text-white tabular-nums whitespace-nowrap truncate">
                          {formatDateFriendly(earliestCheckIn)} – {formatDateFriendly(latestCheckOut)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#0A6FA8] dark:text-[#3E9AD1] bg-[#EFF6FB] dark:bg-[#0A6FA8]/20 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                        {calculateAssignmentDuration(earliestCheckIn, latestCheckOut).weeks > 0 ? `${calculateAssignmentDuration(earliestCheckIn, latestCheckOut).weeks}w` : 'Set'}
                      </span>
                    </button>
                  </div>

                  {/* Rotation Duration */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#404850] dark:text-[#93ccff] mb-1">
                      Rotation Length
                    </label>
                    <div className="flex items-center gap-1">
                      {durationOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSelectedDuration(opt.value);
                            const w = parseInt(opt.value);
                            if (!isNaN(w) && earliestCheckIn) {
                              const parts = earliestCheckIn.split('-').map(Number);
                              const d = new Date(parts[0], parts[1] - 1, parts[2], 12);
                              d.setDate(d.getDate() + w * 7);
                              const y = d.getFullYear();
                              const m = String(d.getMonth() + 1).padStart(2, '0');
                              const day = String(d.getDate()).padStart(2, '0');
                              setLatestCheckOut(`${y}-${m}-${day}`);
                            }
                          }}
                          className={`flex-1 h-9 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                            selectedDuration === opt.value
                              ? 'bg-[#0A6FA8] text-white shadow-2xs'
                              : 'bg-white dark:bg-[#182840] text-[#404850] dark:text-[#c0c7d1] hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-[#1f3350] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1f3350] border border-[rgba(11,37,89,0.08)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {selectedDuration === 'custom' && (
                      <input
                        type="number"
                        min="1"
                        value={customDuration || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setCustomDuration(isNaN(val) ? 0 : val);
                          if (!isNaN(val) && val > 0 && earliestCheckIn) {
                            const parts = earliestCheckIn.split('-').map(Number);
                            const d = new Date(parts[0], parts[1] - 1, parts[2], 12);
                            d.setDate(d.getDate() + val * 7);
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            setLatestCheckOut(`${y}-${m}-${day}`);
                          }
                        }}
                        placeholder="Weeks count"
                        className="w-full h-8 px-2.5 mt-1.5 rounded-lg bg-white dark:bg-[#182840] text-[#001848] dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0A6FA8] border border-[rgba(11,37,89,0.08)]"
                      />
                    )}
                  </div>

                  {/* Commute Radius */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#404850] dark:text-[#93ccff]">
                        Max Commute Buffer
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAssignmentDrawerExpanded(false)}
                        className="text-[11px] font-bold text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {commuteOptions.map((opt) => (
                        <button
                          key={opt.miles}
                          type="button"
                          onClick={() => setCommuteBuffer(opt.miles)}
                          className={`flex-1 h-9 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                            commuteBuffer === opt.miles
                              ? 'bg-[#001848] text-white shadow-2xs'
                              : 'bg-white dark:bg-[#182840] text-[#404850] dark:text-[#c0c7d1] hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-[#1f3350] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1f3350] border border-[rgba(11,37,89,0.08)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Filter Chips Row */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 pb-0.5 custom-scrollbar text-xs">
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: 'all', label: 'All Sanctuaries' },
                { id: 'entire', label: 'Entire property' },
                { id: 'private', label: 'Private suite' },
              ].map((chip) => {
                const isSelected = activeFilterChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveFilterChip(chip.id as 'all' | 'entire' | 'private')}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B2559] text-white shadow-xs font-semibold'
                        : 'bg-[#EFF6FB] dark:bg-[#182840] text-[#404850] dark:text-[#c0c7d1] hover:bg-[#e2edf7] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#e2edf7] dark:hover:bg-[#20324e] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#20324e]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}

              <button
                type="button"
                id="open-full-filter-modal-button"
                onClick={() => setIsFilterModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0A6FA8] dark:text-[#3E9AD1] bg-[#0A6FA8]/10 hover:bg-[#0A6FA8]/20 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] transition-colors cursor-pointer ml-1"
                title="Open comprehensive 25-point clinical amenities checklist"
              >
                <span className="material-symbols-outlined text-[14px]">checklist</span>
                <span>25-Pt Checklist</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-[#195b4c] dark:text-[#aff0db] shrink-0 bg-[#195b4c]/10 dark:bg-[#aff0db]/10 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>$0 Traveler Booking Fee</span>
            </div>
          </div>

          {/* EXPANDABLE FILTER PANEL WITH SMOOTH HEIGHT & FADE-IN TRANSITIONS */}
          <AnimatePresence initial={false}>
            {isFilterPanelExpanded && (
              <motion.div
                id="search-filter-panel"
                key="search-filter-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                  transition: {
                    height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.25, delay: 0.05 },
                  },
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  transition: {
                    height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.16 },
                  },
                }}
                className="overflow-hidden border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550] bg-gradient-to-b from-[#f8faff] to-white dark:from-[#0c182c] dark:to-[#111e33] mt-3 -mx-4 sm:-mx-6 lg:-mx-12 px-4 sm:px-6 lg:px-12 py-5"
              >
                <div className="max-w-7xl mx-auto flex flex-col gap-5">
                  {/* Panel Header */}
                  <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#005684]/10 dark:bg-[#93ccff]/15 flex items-center justify-center text-[#005684] dark:text-[#93ccff]">
                        <span className="material-symbols-outlined text-[15px]">tune</span>
                      </span>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#001848] dark:text-white">
                          Clinical Criteria & Stipends
                        </h3>
                        <p className="text-[11px] text-[#404850] dark:text-[#93ccff]">
                          Adjust stipend limits, quiet scores, and shift amenities
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {activePanelFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetAllFilters}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-[14px]">refresh</span>
                          <span className="group-hover:underline">Reset ({activePanelFilterCount})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsFilterModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#005684] dark:text-[#93ccff] cursor-pointer group"
                      >
                        <span className="material-symbols-outlined text-[14px]">checklist</span>
                        <span className="group-hover:underline">25-Point Checklist</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Modular Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Monthly Per-Diem / Budget Limit */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-2xs flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-[#001848] dark:text-white mb-2">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#005684] dark:text-[#93ccff]">
                              payments
                            </span>
                            Monthly Rent Ceiling
                          </span>
                          <span className="text-sm font-black text-[#005684] dark:text-[#93ccff]">
                            {maxPrice >= 3500 ? 'Any ($3,500+)' : `$${maxPrice.toLocaleString()} / mo`}
                          </span>
                        </div>

                        <input
                          aria-label="Maximum price"
                          type="range"
                          min="1500"
                          max="3500"
                          step="100"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="w-full accent-[#005684] h-2 bg-[#eaedff] dark:bg-[#182840] rounded-lg cursor-pointer"
                        />

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 mt-3">
                          {[2000, 2500, 3000, 3500].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setMaxPrice(preset)}
                              className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                maxPrice === preset
                                  ? 'bg-[#005684] text-white shadow-2xs'
                                  : 'bg-[#f2f3ff] dark:bg-[#182840] text-[#404850] dark:text-[#c0c7d1] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                              }`}
                            >
                              {preset === 3500 ? 'Any' : `$${preset / 1000}k`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="text-[10px] text-[#195b4c] dark:text-[#aff0db] bg-[#195b4c]/10 dark:bg-[#aff0db]/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        <span>$0 Traveler Booking Fee on all contracts</span>
                      </div>
                    </div>

                    {/* 2. Clinical Sleep & Acoustic Quality */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-2xs flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-[#001848] dark:text-white mb-2">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#005684] dark:text-[#93ccff]">
                              bedtime
                            </span>
                            Sleep Acoustic Standards
                          </span>
                        </div>

                        {/* Rating threshold pills */}
                        <div className="flex items-center gap-1.5 mb-3">
                          {[
                            { val: 0, label: 'Any Rating' },
                            { val: 4.8, label: '4.8+ ★' },
                            { val: 4.9, label: '4.9+ ★' },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setMinRating(opt.val)}
                              className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                minRating === opt.val
                                  ? 'bg-[#005684] text-white shadow-2xs'
                                  : 'bg-[#f2f3ff] dark:bg-[#182840] text-[#404850] dark:text-[#c0c7d1] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2">
                          <label htmlFor="filterBlackout" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#001848] dark:text-white">
                            <input
                              id="filterBlackout"
                              type="checkbox"
                              checked={filterBlackout}
                              onChange={(e) => setFilterBlackout(e.target.checked)}
                              className="w-4 h-4 rounded text-[#005684] accent-[#005684] cursor-pointer"
                            />
                            <span>Blackout Curtains (100% light block)</span>
                          </label>

                          <label htmlFor="filterQuietDay" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#001848] dark:text-white">
                            <input
                              id="filterQuietDay"
                              type="checkbox"
                              checked={filterQuietDay}
                              onChange={(e) => setFilterQuietDay(e.target.checked)}
                              className="w-4 h-4 rounded text-[#005684] accent-[#005684] cursor-pointer"
                            />
                            <span>Day-Sleeper Quiet Hours (≤35dB)</span>
                          </label>

                          <label htmlFor="filterSoundMachine" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#001848] dark:text-white">
                            <input
                              id="filterSoundMachine"
                              type="checkbox"
                              checked={filterSoundMachine}
                              onChange={(e) => setFilterSoundMachine(e.target.checked)}
                              className="w-4 h-4 rounded text-[#005684] accent-[#005684] cursor-pointer"
                            />
                            <span>White Noise Sound Machine</span>
                          </label>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#404850] dark:text-[#93ccff]">
                        Acoustically inspected for night shift day-sleepers.
                      </div>
                    </div>

                    {/* 3. Shift Logistics & Clinician Protections */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#15233a] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-2xs flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-[#001848] dark:text-white mb-2">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#005684] dark:text-[#93ccff]">
                              local_laundry_service
                            </span>
                            Shift Logistics & Protection
                          </span>
                        </div>

                        <div className="space-y-2 mt-2">
                          <label htmlFor="filterScrubWasher" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#001848] dark:text-white">
                            <input
                              id="filterScrubWasher"
                              type="checkbox"
                              checked={filterScrubWasher}
                              onChange={(e) => setFilterScrubWasher(e.target.checked)}
                              className="w-4 h-4 rounded text-[#005684] accent-[#005684] cursor-pointer"
                            />
                            <span>In-Unit Scrub Washer & Dryer</span>
                          </label>

                          <label htmlFor="filterDedicatedParking" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#001848] dark:text-white">
                            <input
                              id="filterDedicatedParking"
                              type="checkbox"
                              checked={filterDedicatedParking}
                              onChange={(e) => setFilterDedicatedParking(e.target.checked)}
                              className="w-4 h-4 rounded text-[#005684] accent-[#005684] cursor-pointer"
                            />
                            <span>Dedicated Reserved Parking Spot</span>
                          </label>

                          <label htmlFor="filterContractFlex" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#001848] dark:text-white">
                            <input
                              id="filterContractFlex"
                              type="checkbox"
                              checked={filterContractFlex}
                              onChange={(e) => setFilterContractFlex(e.target.checked)}
                              className="w-4 h-4 rounded text-[#005684] accent-[#005684] cursor-pointer"
                            />
                            <span>Contract Flex Protection ($0 Cancellation)</span>
                          </label>

                          <label htmlFor="filterPetFriendly" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#001848] dark:text-white">
                            <input
                              id="filterPetFriendly"
                              type="checkbox"
                              checked={filterPetFriendly}
                              onChange={(e) => setFilterPetFriendly(e.target.checked)}
                              className="w-4 h-4 rounded text-[#005684] accent-[#005684] cursor-pointer"
                            />
                            <span>Pet-Friendly Sanctuary</span>
                          </label>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#404850] dark:text-[#93ccff]">
                        All homes include verified high-speed Wi-Fi for charting.
                      </div>
                    </div>
                  </div>

                  {/* Panel Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
                    <div className="flex items-center gap-2" aria-live="polite">
                      <span className="text-xs font-bold text-[#001848] dark:text-white">
                        {filteredListings.length} {filteredListings.length === 1 ? 'Sanctuary' : 'Sanctuaries'} Found
                      </span>
                      {activePanelFilterCount > 0 && (
                        <span className="text-[10px] font-semibold text-[#005684] dark:text-[#93ccff] bg-[#005684]/10 dark:bg-[#93ccff]/15 px-2 py-0.5 rounded-full">
                          {activePanelFilterCount} active criteria applied
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFilterPanelExpanded(false)}
                      className="px-4 py-2 rounded-xl bg-[#001848] text-white text-xs font-bold hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Done Filtering</span>
                      <span className="material-symbols-outlined text-[15px]">keyboard_arrow_up</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 2. RESULTS CONTENT AREA */}
      <section className="w-full">
        {isDataLoading ? (
          <SearchListingsSkeleton
            viewMode={viewMode}
            isNightShiftMode={isNightShiftMode}
            hospitalName={selectedHospital}
            count={4}
          />
        ) : (
          <>
            {/* Split / Full Map View Mode */}
            {viewMode === 'split-map' && (
              <div className={`w-full ${isMapExpanded ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-12'} min-h-[820px] transition-all duration-300`}>
                {/* LEFT 7 COLS: Listings Feed (hidden when map is expanded) */}
                {!isMapExpanded && (
                  <div className="lg:col-span-7 px-3 sm:px-6 lg:px-8 py-3.5 flex flex-col gap-4">
                    {/* Feed Header & Sort Controls */}
                    <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550] gap-2">
                      <div className="flex items-baseline gap-2" aria-live="polite">
                        <h2 className="text-base sm:text-lg font-bold text-[#001848] dark:text-white tabular-nums">
                          {filteredListings.length} {filteredListings.length === 1 ? 'Sanctuary' : 'Sanctuaries'}
                        </h2>
                        <span className="text-xs text-[#404850] dark:text-[#93ccff] truncate max-w-[280px]">
                          near {selectedHospital.split(' - ')[0]} (≤{commuteBuffer} mi)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <label htmlFor="search-sort-select" className="text-xs font-semibold text-[#404850] dark:text-[#93ccff]">
                            Sort:
                          </label>
                          <select
                            id="search-sort-select"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as 'closest' | 'price_low' | 'quiet_score')}
                            className="text-xs font-semibold bg-white dark:bg-[#182840] border border-[rgba(11,37,89,0.12)] dark:border-[#233550] rounded-lg px-2.5 py-1 text-[#001848] dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#005684]"
                          >
                            <option value="closest">Closest</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="quiet_score">Quiet Rating</option>
                          </select>
                        </div>

                        {/* Expand Map Quick Button */}
                        <button
                          type="button"
                          onClick={() => setIsMapExpanded(true)}
                          className="h-8 px-2.5 rounded-lg border border-[rgba(11,37,89,0.12)] dark:border-[#233550] bg-white dark:bg-[#182840] hover:bg-[#EFF6FB] dark:hover:bg-[#1f3352] text-[#0A6FA8] dark:text-[#3E9AD1] text-xs font-bold hidden lg:flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          title="Expand map to fullscreen (hide list)"
                          aria-label="Expand map to fullscreen (hide list)"
                        >
                          <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="whitespace-nowrap">Expand view</span>
                        </button>
                      </div>
                    </div>

                    {/* Listings Cards Feed */}
                    {filteredListings.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-16 px-6 text-center rounded-2xl bg-white dark:bg-[#111e33] border border-dashed border-[rgba(11,37,89,0.15)] dark:border-[#233550] flex flex-col items-center justify-center gap-3"
                      >
                        <span className="w-12 h-12 rounded-full bg-[#f2f3ff] dark:bg-[#182840] flex items-center justify-center text-[#005684] dark:text-[#93ccff]">
                          <span className="material-symbols-outlined text-[24px]">filter_alt_off</span>
                        </span>
                        <h3 className="text-sm font-bold text-[#001848] dark:text-white">
                          No sanctuaries match the current filters
                        </h3>
                        <p className="text-xs text-[#404850] dark:text-[#93ccff] max-w-sm">
                          Try raising your rent ceiling or unchecking specialized day-sleeper amenities.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetAllFilters}
                          className="mt-2 px-4 py-2 rounded-xl bg-[#0A6FA8] text-white text-xs font-bold hover:bg-[#0C7EBF] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] transition-colors shadow-xs cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <AnimatePresence>
                          {filteredListings.map((listing) => {
                            const isSaved = savedListingIds.includes(listing.id);
                            const isSelectedOnMap = selectedMapListingId === listing.id;

                            return (
                              <SearchListingCard
                                key={listing.id}
                                listing={listing}
                                isSaved={isSaved}
                                isSelectedOnMap={isSelectedOnMap}
                                onToggleSave={onToggleSave}
                                onSelectOnMap={handleSelectOnMap}
                                onViewDetails={handleViewDetails}
                                onRequestToBook={onRequestToBookListing}
                                selectedHospital={selectedHospital}
                                viewMode="split-map"
                                isNightShiftMode={isNightShiftMode}
                                commuteMode={commuteMode}
                              />
                            );
                          })}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* RIGHT 5 COLS / FULLSCREEN 12 COLS: Interactive Google Map */}
                <div
                  id="split-map-canvas"
                  className={`${
                    isMapExpanded
                      ? 'w-full h-[calc(100dvh-135px)] min-h-[520px]'
                      : 'hidden lg:flex lg:col-span-5 relative lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] border-l'
                  } bg-[#eef3f9] dark:bg-[#0a1424] border-[rgba(11,37,89,0.08)] dark:border-[#233550] p-3 sm:p-4 flex flex-col justify-between overflow-hidden transition-all duration-300`}
                >
                  {/* Map Canvas Header Overlay */}
                  <div className="relative z-10 flex items-center justify-between bg-white/95 dark:bg-[#111e33]/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-2xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[#0A6FA8] dark:text-[#3E9AD1] text-[18px] shrink-0">map</span>
                      <div className="text-xs font-bold text-[#001848] dark:text-white truncate">
                        <span>Medical Zone: </span>
                        <span className="text-[#0A6FA8] dark:text-[#3E9AD1]">{selectedHospital.split(' - ')[0]}</span>
                        {isMapExpanded && (
                          <span className="ml-2 text-[11px] font-semibold text-[#404850] dark:text-[#93ccff] hidden md:inline">
                            ({filteredListings.length} sanctuaries)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-[#f2f3ff] dark:bg-[#182840] p-0.5 rounded-lg text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleToggleCommuteMode('transit')}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${commuteMode === 'transit' ? 'bg-[#0A6FA8] text-white shadow-2xs' : 'text-[#404850] dark:text-gray-300 hover:text-[#0B2559]'}`}
                          title="Calculate public transit and campus bus routes"
                        >
                          Transit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCommuteMode('drive')}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${commuteMode === 'drive' ? 'bg-[#0A6FA8] text-white shadow-2xs' : 'text-[#404850] dark:text-gray-300 hover:text-[#0B2559]'}`}
                          title="Calculate vehicle driving and highway times"
                        >
                          Drive
                        </button>
                      </div>

                      {/* 'Expand View' / 'Show List' Button (Airbnb Interaction) */}
                      <button
                        type="button"
                        onClick={() => setIsMapExpanded((prev) => !prev)}
                        className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] ${
                          isMapExpanded
                            ? 'bg-[#0B2559] dark:bg-[#0A6FA8] hover:bg-[#0A6FA8] text-white'
                            : 'bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white'
                        }`}
                        title={isMapExpanded ? "Show listings list (Collapse view)" : "Hide listings list and expand map to fullscreen"}
                        aria-label={isMapExpanded ? "Show listings list (Collapse view)" : "Hide listings list and expand map to fullscreen"}
                      >
                        {isMapExpanded ? (
                          <>
                            <Minimize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span className="whitespace-nowrap">Show list</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span className="whitespace-nowrap">Expand view</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Live Interactive Google Maps Split View */}
                  <div className="relative my-2 sm:my-3 flex-1 min-h-[420px] lg:min-h-0 w-full rounded-2xl overflow-hidden shadow-sm">
                    <GoogleMapsSplitView
                      isNightShiftMode={isNightShiftMode}
                      listings={filteredListings}
                      selectedListingId={selectedMapListingId}
                      onSelectListing={(listing: HousingListing) => {
                        setSelectedMapListingId(listing.id);
                      }}
                      onOpenDetails={handleViewDetails}
                      onToggleCommuteMode={handleToggleCommuteMode}
                      hospitalName={selectedHospital}
                      radiusMiles={commuteBuffer}
                      commuteMode={commuteMode}
                    />
                  </div>

                  {/* Bottom Selected Listing Preview Card */}
                  {selectedMapListing && (
                    <div
                      className={`relative z-10 bg-white dark:bg-[#111e33] rounded-2xl p-3 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-md flex items-center justify-between gap-3 ${
                        isMapExpanded ? 'max-w-xl mx-auto w-full shadow-xl' : 'w-full'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isMapExpanded && filteredListings.length > 1 && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={handlePrevMapListing}
                              className="w-7 h-7 rounded-full bg-[#EFF6FB] dark:bg-[#182840] hover:bg-[#e2edf7] dark:hover:bg-[#20324e] text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center justify-center cursor-pointer transition-colors"
                              title="Previous sanctuary on map"
                              aria-label="Previous sanctuary on map"
                            >
                              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNextMapListing}
                              className="w-7 h-7 rounded-full bg-[#EFF6FB] dark:bg-[#182840] hover:bg-[#e2edf7] dark:hover:bg-[#20324e] text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center justify-center cursor-pointer transition-colors"
                              title="Next sanctuary on map"
                              aria-label="Next sanctuary on map"
                            >
                              <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                        <img
                          src={selectedMapListing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
                          alt={selectedMapListing.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#195b4c] font-bold">
                            <span className="material-symbols-outlined text-[13px]">
                              {commuteMode === 'transit' ? 'directions_bus' : 'directions_car'}
                            </span>
                            <span className="truncate">
                              {selectedMapLiveRoute && selectedMapLiveRoute.travelMode.toLowerCase() === commuteMode
                                ? `${selectedMapLiveRoute.durationMinutes} min ${commuteMode} (Live Maps API)`
                                : commuteMode === 'transit'
                                ? `${Math.round((selectedMapListing.driveTimeMinutes || 8) * 1.8)} min transit to hospital`
                                : `${selectedMapListing.driveTimeMinutes || 8} min drive to hospital`}
                            </span>
                            {selectedMapLiveRoute && selectedMapLiveRoute.travelMode.toLowerCase() === commuteMode && (
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                                title="Real-time route calculation from Google Maps Routes API"
                              />
                            )}
                            {isMapExpanded && currentMapListingIndex >= 0 && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold tabular-nums ml-1">
                                ({currentMapListingIndex + 1}/{filteredListings.length})
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-[#001848] dark:text-white line-clamp-1 truncate">
                            {selectedMapListing.title}
                          </h4>
                          <div className="text-xs font-extrabold text-[#005684] dark:text-[#93ccff] tabular-nums">
                            ${selectedMapListing.monthlyRate.toLocaleString()} / mo
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isMapExpanded && (
                          <button
                            type="button"
                            onClick={() => setIsMapExpanded(false)}
                            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#182840] dark:hover:bg-[#1f3352] text-[#001848] dark:text-white text-xs font-bold transition-colors cursor-pointer hidden sm:block whitespace-nowrap"
                          >
                            Show list
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveDetailListing(selectedMapListing)}
                          className="px-3.5 py-2 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          View Stay
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile & Medium Device Floating Map / List Toggle Button */}
            {viewMode === 'split-map' && (
              <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isMapExpanded;
                    setIsMapExpanded(next);
                    if (next) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#001848] dark:bg-[#0A6FA8] text-white text-xs font-bold shadow-[0_8px_24px_rgba(11,37,89,0.3)] border border-white/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
                  aria-label={isMapExpanded ? "Show listing cards list" : "Show interactive hospital map"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isMapExpanded ? 'format_list_bulleted' : 'map'}
                  </span>
                  <span>{isMapExpanded ? `Show List (${filteredListings.length})` : `Show Map (${filteredListings.length})`}</span>
                </button>
              </div>
            )}

        {/* 3-Column Grid View Mode */}
        {viewMode === 'grid' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between pb-2.5 mb-4 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550] gap-2">
              <div className="flex items-baseline gap-2" aria-live="polite">
                <h2 className="text-base sm:text-lg font-bold text-[#001848] dark:text-white tabular-nums">
                  {filteredListings.length} {filteredListings.length === 1 ? 'Sanctuary' : 'Sanctuaries'}
                </h2>
                <span className="text-xs text-[#404850] dark:text-[#93ccff]">
                  near {selectedHospital.split(' - ')[0]} (≤{commuteBuffer} mi)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="grid-sort-select" className="text-xs font-semibold text-[#404850] dark:text-[#93ccff]">
                  Sort:
                </label>
                <select
                  id="grid-sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as 'closest' | 'price_low' | 'quiet_score')}
                  className="text-xs font-semibold bg-white dark:bg-[#182840] border border-[rgba(11,37,89,0.12)] dark:border-[#233550] rounded-lg px-2.5 py-1 text-[#001848] dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#005684]"
                >
                  <option value="closest">Closest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="quiet_score">Quiet Rating</option>
                </select>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 px-6 text-center rounded-3xl bg-white dark:bg-[#111e33] border border-dashed border-[rgba(11,37,89,0.15)] dark:border-[#233550] flex flex-col items-center justify-center gap-3"
              >
                <span className="w-14 h-14 rounded-full bg-[#f2f3ff] dark:bg-[#182840] flex items-center justify-center text-[#005684] dark:text-[#93ccff]">
                  <span className="material-symbols-outlined text-[28px]">filter_alt_off</span>
                </span>
                <h3 className="text-base font-bold text-[#001848] dark:text-white">
                  No sanctuaries match the current filters
                </h3>
                <p className="text-xs text-[#404850] dark:text-[#93ccff] max-w-sm">
                  Try raising your rent ceiling or unchecking specialized day-sleeper amenities.
                </p>
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#0A6FA8] text-white text-xs font-bold hover:bg-[#0C7EBF] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] transition-colors shadow-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </motion.div>
            ) : (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence >
                  {filteredListings.map((listing) => {
                    const isSaved = savedListingIds.includes(listing.id);
                    return (
                      <SearchListingCard
                        key={listing.id}
                        listing={listing}
                        isSaved={isSaved}
                        onToggleSave={onToggleSave}
                        onViewDetails={handleViewDetails}
                        onRequestToBook={onRequestToBookListing}
                        selectedHospital={selectedHospital}
                        viewMode="grid"
                        isNightShiftMode={isNightShiftMode}
                        commuteMode={commuteMode}
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
          </>
        )}
      </section>

      {/* MODALS */}
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
        commuteMode={commuteMode}
        checkInDate={earliestCheckIn}
        checkOutDate={latestCheckOut}
        onRequestToBook={useCallback((listing: HousingListing) => {
          setActiveDetailListing(null);
          onRequestToBookListing?.(listing);
        }, [onRequestToBookListing])}
      />
      </Suspense>

      <Suspense fallback={null}>
      <HealthcareAmenitiesFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={() => {
          setIsFilterModalOpen(false);
          setActiveAmenityCount(5);
        }}
        isNightShiftMode={isNightShiftMode}
        activeHospitalName={selectedHospital}
      />
      </Suspense>

      {/* Interactive Clinical Date Range Picker Modal */}
      <AnimatePresence>
        {isDateRangeModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/40 backdrop-blur-xs overflow-y-auto">
            <div
              className="fixed inset-0"
              onClick={() => setIsDateRangeModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.16 }}
              className="relative z-10 w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <ClinicalDateRangePicker
                startDate={earliestCheckIn}
                endDate={latestCheckOut}
                onChange={(start, end) => {
                  setEarliestCheckIn(start);
                  setLatestCheckOut(end);
                }}
                isNightShiftMode={isNightShiftMode}
                onApply={() => setIsDateRangeModalOpen(false)}
                onClose={() => setIsDateRangeModalOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GSA Stipend Audit Modal */}
      {isGsaModalOpen && (
        <div
          className="fixed inset-0 z-[150] overflow-y-auto p-4 sm:p-6 pt-16 sm:pt-20 bg-black/70 backdrop-blur-xs flex justify-center items-start"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsGsaModalOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-lg my-auto bg-white dark:bg-[#111e33] rounded-3xl p-6 sm:p-8 shadow-lg border border-[rgba(11,37,89,0.08)] dark:border-[#233550] text-[#001848] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#195b4c] text-[24px]">verified</span>
                <div>
                  <h3 className="font-bold text-base">GSA Per-Diem Stipend Comparison</h3>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Federal Lodging Allowance Analysis</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGsaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-200 cursor-pointer"
                aria-label="Close GSA Stipend Comparison"
              >
                ✕
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-[#404850] dark:text-[#c0c7d1]">
              <p>
                Under IRS Revenue Procedure guidelines, traveling healthcare professionals can receive tax-free housing stipends when duplicating expenses away from their tax home.
              </p>
              <div className="p-4 rounded-xl bg-[#EFF6FB] dark:bg-[#182840] space-y-2">
                <div className="flex justify-between font-bold text-sm text-[#001848] dark:text-white">
                  <span>Standard Regional Lodging Cap:</span>
                  <span>$2,850 / month</span>
                </div>
                <div className="flex justify-between text-xs text-[#195b4c] font-semibold">
                  <span>Nurses Pillow Average Rent:</span>
                  <span>$1,950 / month</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#005684] dark:text-[#93ccff] pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span>Estimated Stipend Surplus:</span>
                  <span>+$900 / month retained</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Itemized invoices with facility proximity and quiet guarantees generate automatically in your clinician portal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGsaModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#001848] text-white text-xs font-bold cursor-pointer hover:bg-[#0A6FA8] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
