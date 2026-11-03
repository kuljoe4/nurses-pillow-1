import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HousingListing } from '../types';
import { PillowSaveButton } from './PillowSaveButton';
import { GoogleMapsTravelTimeDisplay } from './GoogleMapsTravelTimeDisplay';
import { calculateCommuteDuration, resolveHospitalCoordinates, getListingCoordinates } from '../lib/googleMapsCommute';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { calculateStayPricing } from '../lib/utils/pricing';

interface ListingDetailModalProps {
  listing: HousingListing | null;
  onClose: () => void;
  isNightShiftMode: boolean;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  isVerified: boolean;
  onGoToVerification: () => void;
  onRequestToBook?: (listing: HousingListing) => void;
  selectedHospital?: string;
  commuteMode?: 'transit' | 'drive';
  checkInDate?: string;
  checkOutDate?: string;
  onOpenHostProfile?: (hostId: string) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  isNightShiftMode,
  isSaved,
  onToggleSave,
  isVerified,
  onGoToVerification,
  onRequestToBook,
  selectedHospital = 'Duke University Hospital',
  commuteMode = 'transit',
  checkInDate = '2026-10-05',
  checkOutDate = '2027-01-04',
  onOpenHostProfile,
}) => {
  useBodyScrollLock(!!listing);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [hostContactStatus, setHostContactStatus] = useState<string | null>(null);

  // ⚡ Bolt Performance Optimization: Wrapped with useCallback to provide a stable reference
  // to PillowSaveButton which is wrapped in React.memo, preventing unnecessary re-renders.
  const handleToggleSave = React.useCallback(() => {
    if (listing) {
      onToggleSave(listing.id);
    }
  }, [onToggleSave, listing]);

  // Synchronize default room on listing change
  useEffect(() => {
    if (listing?.rooms && listing.rooms.length > 0) {
      setSelectedRoomId(listing.rooms[0].id);
    } else {
      setSelectedRoomId(null);
    }
  }, [listing?.id]);

  const selectedRoom = useMemo(() => {
    if (!listing?.rooms || !selectedRoomId) return null;
    return listing.rooms.find((r) => r.id === selectedRoomId) || listing.rooms[0];
  }, [listing?.rooms, selectedRoomId]);

  const activeMonthlyRate = selectedRoom ? selectedRoom.monthlyRate : (listing?.monthlyRate || 1950);

  // Calculate Stay Pricing
  const { daysCount, accommodationTotal, dailyRate } = calculateStayPricing(activeMonthlyRate, checkInDate, checkOutDate);
  const cleaningFee = 150;

  const petFee = listing?.petFee || 0;
  const parkingFee = listing?.parkingFee || 0;

  // Note: We don't have interactive checkbox state here to select individual options,
  // so we'll just show them as "add-ons available" or optionally pre-sum them.
  // We'll leave the interactive selection for the Checkout Modal to keep this view clean.

  const initialDueAtHold = accommodationTotal + cleaningFee + petFee + parkingFee;

  const commute = useMemo(() => {
    if (!listing) return null;
    return calculateCommuteDuration(listing, selectedHospital);
  }, [listing, selectedHospital]);

  const originCoords = useMemo(() => {
    if (!listing) return undefined;
    const coords = getListingCoordinates(listing);
    return { lat: coords.lat, lng: coords.lng };
  }, [listing]);

  const destCoords = useMemo(() => {
    if (!selectedHospital) return undefined;
    const hosp = resolveHospitalCoordinates(selectedHospital);
    return { lat: hosp.lat, lng: hosp.lng };
  }, [selectedHospital]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!listing) return null;

  // Sample photo mosaic collection if listing only has 1 or 2
  const galleryPhotos = [
    listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    listing.images?.[1] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    listing.images?.[2] || 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
    listing.images?.[3] || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[150] overflow-y-auto custom-scrollbar overscroll-contain p-4 sm:p-6 pt-16 sm:pt-20 bg-black/70 backdrop-blur-xs flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-5xl my-auto rounded-3xl p-6 sm:p-8 shadow-lg transition-colors relative border ${
          isNightShiftMode
            ? 'bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]'
            : 'bg-white border-[rgba(11,37,89,0.1)] text-[#001848]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/90 dark:bg-[#15233a] shadow-md flex items-center justify-center text-[#001848] dark:text-white hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-[#1f3454] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1f3454] cursor-pointer"
          aria-label="Close details modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Top Header & Badges */}
        <div className="mb-4 pr-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#195b4c]/15 text-[#195b4c] dark:text-[#aff0db] text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>Nurses Pillow Verified</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ffdc84] text-[#795f12] text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">nightlight</span>
              <span>Shift-Ready Certified</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f2f3ff] dark:bg-[#182840] text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px] text-[#745b0d] dark:text-[#ffdf91]">star</span>
              <span>{listing.nurseRating || 4.98} ({listing.reviewsCount || 19} traveling clinician reviews)</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
            {listing.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#404850] dark:text-[#c0c7d1]">
            <span className="text-[#005684] dark:text-[#93ccff] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">near_me</span>
              <span>{listing.proximityToHospital}</span>
            </span>
            <span>•</span>
            <span>{listing.neighborhood}, {listing.city}, {listing.state}</span>
          </div>
        </div>

        {/* 5-Photo Mosaic Grid Layout */}
        <div className="relative mb-6 rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96 relative">
            <div className="md:col-span-2 md:row-span-2 relative overflow-hidden group">
              <img
                src={galleryPhotos[selectedImageIndex] || galleryPhotos[0]}
                alt="Primary view"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                onClick={() => setSelectedImageIndex((prev) => (prev + 1) % galleryPhotos.length)}
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 dark:bg-black/80 text-xs font-semibold backdrop-blur-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#005684]">nights_stay</span>
                <span>Daytime Sleep Sanctuary Guarantee</span>
              </div>

              {/* Mobile Photo Carousel Controls (< md) */}
              <div className="md:hidden absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryPhotos.length - 1));
                  }}
                  className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs cursor-pointer shadow-md"
                  aria-label="Previous photo"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev < galleryPhotos.length - 1 ? prev + 1 : 0));
                  }}
                  className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs cursor-pointer shadow-md"
                  aria-label="Next photo"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              {/* Photo Index Counter */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold backdrop-blur-xs tabular-nums select-none">
                {selectedImageIndex + 1} / {galleryPhotos.length}
              </div>
            </div>
            {galleryPhotos.slice(1, 5).map((photo, idx) => (
              <div key={idx} className="relative overflow-hidden group hidden md:block">
                <img
                  src={photo}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() => setSelectedImageIndex(idx + 1)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedImageIndex((prev) => (prev + 1) % galleryPhotos.length)}
            className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-black/80 text-xs font-bold backdrop-blur-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            aria-label="View all photos"
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>View all photos ({galleryPhotos.length})</span>
          </button>
        </div>

        {/* Two Column Layout: Content (Left) & Sticky Booking Widget (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Host Mini-Profile Banner */}
            <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                    alt="Host Sarah M."
                    className="w-13 h-13 rounded-full object-cover shadow-xs"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-[#195b4c] text-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px]">medical_services</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">Hosted by Sarah M.</h3>
                    <span className="px-2 py-0.2 rounded-full bg-[#195b4c]/15 text-[#195b4c] dark:text-[#aff0db] text-[10px] font-bold">
                      RN Host
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Superhost • Former UCSF Neuro ICU RN</p>
                  <div className="text-[11px] text-[#005684] dark:text-[#93ccff] font-semibold mt-0.5">
                    Response time &lt; 2 hrs • 100% acceptance for verified RNs
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onOpenHostProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenHostProfile(listing?.hostId || 'host-sarah-m')}
                    className="px-4 py-2 rounded-full bg-[#0A6FA8] text-white text-xs font-bold shadow-xs hover:bg-[#0C7EBF] transition-colors cursor-pointer shrink-0"
                  >
                    View Host Profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setHostContactStatus('Connecting you with Host Sarah M...');
                    setTimeout(() => setHostContactStatus(null), 3500);
                  }}
                  className="px-4 py-2 rounded-full bg-white dark:bg-[#111e33] text-xs font-bold text-[#005684] dark:text-[#93ccff] shadow-xs hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 cursor-pointer shrink-0"
                >
                  Contact Sarah
                </button>
              </div>
            </div>

            {hostContactStatus && (
              <div className="p-3 rounded-xl bg-[#E1EFE9] text-[#2F6E5E] text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{hostContactStatus}</span>
              </div>
            )}

            {/* Unit Overview Stats Pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-[#eaedff] dark:bg-[#15233a] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#005684]">
                  {listing.rooms && listing.rooms.length > 0 ? 'meeting_room' : 'home'}
                </span>
                <span>{listing.propertyType || (listing.rooms ? 'INDIVIDUAL ROOMS' : 'ENTIRE CONDO')}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#eaedff] dark:bg-[#15233a] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#005684]">king_bed</span>
                <span>{selectedRoom ? selectedRoom.bedType : `${listing.beds || 1} Bed`}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#eaedff] dark:bg-[#15233a] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#005684]">bathtub</span>
                <span>{selectedRoom ? selectedRoom.bathType : `${listing.baths || 1} Bath`}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#eaedff] dark:bg-[#15233a] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#005684]">key</span>
                <span>Keyless Digital PIN</span>
              </span>
            </div>

            {/* Individual Room Pricing & Availability Calendars Section */}
            {listing.rooms && listing.rooms.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#EFF6FB] dark:bg-[#14233a] border border-[#0A6FA8]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0A6FA8] dark:text-[#3E9AD1] text-[20px]">
                      meeting_room
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#0B2559] dark:text-white">
                        Individual Room Selection &amp; Availability Calendars
                      </h3>
                      <p className="text-[11px] text-[#404850] dark:text-[#93ccff]">
                        Select an individual room to review specific monthly pricing, bathroom access, and calendar windows
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A6FA8]/10 text-[#0A6FA8] dark:text-[#93ccff]">
                    {listing.rooms.length} Rooms Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {listing.rooms.map((room) => {
                    const isRoomSelected = selectedRoomId === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isRoomSelected
                            ? 'border-[#0A6FA8] bg-white dark:bg-[#0B1626] shadow-sm ring-1 ring-[#0A6FA8]'
                            : 'border-transparent bg-white/70 dark:bg-[#0B1626]/60 hover:bg-white dark:hover:bg-[#0B1626]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-[#0B2559] dark:text-white flex items-center gap-1.5">
                              <span>{room.name}</span>
                              {isRoomSelected && (
                                <span className="material-symbols-outlined text-[15px] text-[#0A6FA8]">
                                  check_circle
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {room.bedType} · {room.bathType} · {room.sqft} sqft
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-[#0B2559] dark:text-white tabular-nums">
                              ${room.monthlyRate.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-500 block">/month</span>
                          </div>
                        </div>

                        {/* Room Specific Calendar Strip */}
                        <div className="pt-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-[#2F6E5E] dark:text-[#aff0db] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span>{room.availableFrom}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            room.isAvailable
                              ? 'bg-[#E1EFE9] text-[#2F6E5E]'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {room.isAvailable ? 'Shift Open' : 'Reserved'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Google Maps-Powered Commute to Clinician's Selected Hospital */}
            {commute && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0B2559] dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#0A6FA8] dark:text-[#3E9AD1]">
                      directions_car
                    </span>
                    <span>Hospital Commute &amp; Travel Duration</span>
                  </span>
                  <span className="text-[11px] text-[#2F6E5E] dark:text-[#aff0db] font-semibold">
                    Live Travel Duration
                  </span>
                </div>
                <GoogleMapsTravelTimeDisplay
                  commute={commute}
                  isNightShiftMode={isNightShiftMode}
                  initialMode={commuteMode}
                  origin={originCoords}
                  destination={destCoords}
                />
              </div>
            )}

            {/* Clinical Sanctuary Highlight Bento (3-Card Stack) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] space-y-1">
                <span className="material-symbols-outlined text-[#005684] text-[22px]">volume_off</span>
                <h4 className="font-bold text-xs">Tested Sound Sanctuary</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Certified &lt; 35dB daytime ambient noise. Acoustic double-pane glass &amp; LectroFan included.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] space-y-1">
                <span className="material-symbols-outlined text-[#745b0d] text-[22px]">event_repeat</span>
                <h4 className="font-bold text-xs">Shift-Flex Protection</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Full refund if hospital cancels travel contract prior to arrival. Contract extension priority.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] space-y-1">
                <span className="material-symbols-outlined text-[#195b4c] text-[22px]">payments</span>
                <h4 className="font-bold text-xs">Stipend Matched Rate</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Zero hidden booking fees. Monthly pricing calibrated directly for traveling clinician stipends.
                </p>
              </div>
            </div>

            {/* Healthcare Amenities Matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Healthcare Amenities Matrix
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#cde5ff] text-[#001d32] text-[11px] font-bold">
                  12 Nurse Standards Met
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="material-symbols-outlined text-[#005684] text-[20px]">curtains_closed</span>
                  <div>
                    <div className="font-bold">100% Blackout Drapes</div>
                    <div className="text-[10px] text-gray-500">Zero-bleed perimeter tracks</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="material-symbols-outlined text-[#005684] text-[20px]">do_not_disturb_on</span>
                  <div>
                    <div className="font-bold">Daytime Quiet Hours</div>
                    <div className="text-[10px] text-gray-500">Enforced 8 AM – 5 PM</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="material-symbols-outlined text-[#005684] text-[20px]">local_laundry_service</span>
                  <div>
                    <div className="font-bold">In-Unit Washer &amp; Dryer</div>
                    <div className="text-[10px] text-gray-500">High heat scrub sanitization</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="material-symbols-outlined text-[#005684] text-[20px]">wifi</span>
                  <div>
                    <div className="font-bold">500 Mbps Fiber Wi-Fi</div>
                    <div className="text-[10px] text-gray-500">Low latency for Epic EHR</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="material-symbols-outlined text-[#005684] text-[20px]">desk</span>
                  <div>
                    <div className="font-bold">Ergonomic Workstation</div>
                    <div className="text-[10px] text-gray-500">Herman Miller mesh chair</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="material-symbols-outlined text-[#005684] text-[20px]">directions_car</span>
                  <div>
                    <div className="font-bold">Dedicated Off-Street Spot</div>
                    <div className="text-[10px] text-gray-500">Assigned private driveway</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy Tier Card */}
            <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#005684] uppercase tracking-wider">Policy Protection</span>
                  <h4 className="text-sm font-bold">Shift-Flexible Tier (Healthcare Special)</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#195b4c]/15 text-[#195b4c] dark:text-[#aff0db] text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  <span>Hospital Cancel Guard</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#111e33]">
                  <div className="font-bold text-[#195b4c] dark:text-[#aff0db]">Up to 14 Days Prior</div>
                  <div className="font-semibold text-xs">100% Full Refund</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#111e33]">
                  <div className="font-bold text-[#745b0d] dark:text-[#ffdf91]">Hospital Cancellation</div>
                  <div className="font-semibold text-xs">100% Protected</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#111e33]">
                  <div className="font-bold text-[#005684] dark:text-[#93ccff]">Contract Extension</div>
                  <div className="font-semibold text-xs">First Priority Lock</div>
                </div>
              </div>
            </div>

            {/* Clinician Reviews */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">4.98 ★</span>
                  <span className="text-xs text-gray-500">(19 verified reviews)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#195b4c]/15 text-[#195b4c] text-xs font-bold">
                  100% Nurse Recommended
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Marcus T., Travel ICU RN (UCSF Parnassus)</span>
                  <span className="text-[#745b0d]">5.0 ★</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  “Absolute game-changer for night shifts. Blackout curtains seal around the trim with zero light bleed at midday. Slept uninterrupted through garbage trucks without hearing a peep.”
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Booking Widget (Right 4 cols) */}
          <div className="lg:col-span-4 sticky top-6">
            <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#0B1626] shadow-md border border-[rgba(11,37,89,0.1)] dark:border-[#233550] space-y-4">
              <div className="flex items-baseline justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div>
                  <span className="text-2xl font-black tabular-nums">${activeMonthlyRate.toLocaleString()}</span>
                  <span className="text-xs text-gray-500"> / month</span>
                  {selectedRoom && (
                    <div className="text-[11px] text-[#0A6FA8] dark:text-[#3E9AD1] font-semibold mt-0.5 truncate max-w-[200px]">
                      {selectedRoom.name}
                    </div>
                  )}
                  <div className="text-[11px] text-[#195b4c] font-semibold flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    <span>Shift-Certified Direct Rate</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#195b4c]/10 text-[#195b4c] text-[11px] font-bold">
                  {selectedRoom ? 'Room Rate' : 'Direct RN Rate'}
                </span>
              </div>

              {/* Assignment Window */}
              <div className="p-3 rounded-xl bg-[#f2f3ff] dark:bg-[#182840] text-xs">
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                  {selectedRoom ? 'Room Availability & Window' : 'Assignment Window'}
                </div>
                <div className="font-bold">
                  {selectedRoom ? selectedRoom.availableFrom : 'Oct 1, 2024 – Dec 31, 2024'}
                </div>
                <div className="text-[11px] text-gray-500">
                  {selectedRoom ? `${selectedRoom.bedType} · ${selectedRoom.bathType}` : '13 Weeks • Standard Travel Contract'}
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-1.5 text-xs text-[#404850] dark:text-[#c0c7d1]">
                <div className="flex justify-between">
                  <span>Accommodation ({daysCount} nights)</span>
                  <span className="font-bold tabular-nums text-[#001848] dark:text-white">${accommodationTotal.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Clinical Sanitization</span>
                  <span className="font-bold tabular-nums text-[#001848] dark:text-white">${cleaningFee.toLocaleString()}.00</span>
                </div>
                {petFee > 0 && (
                  <div className="flex justify-between">
                    <span>Pet Fee</span>
                    <span className="font-bold tabular-nums text-[#001848] dark:text-white">${petFee.toLocaleString()}.00</span>
                  </div>
                )}
                {parkingFee > 0 && (
                  <div className="flex justify-between">
                    <span>Parking Fee</span>
                    <span className="font-bold tabular-nums text-[#001848] dark:text-white">${parkingFee.toLocaleString()}.00</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[#404850] dark:text-[#c0c7d1]">
                  <span className="flex items-center gap-1.5">
                    <span>Security Deposit Hold</span>
                    <span className="text-[10px] font-bold text-[#2F6E5E] dark:text-[#aff0db] bg-[#E1EFE9] dark:bg-[#142823] px-2 py-0.5 rounded-full">
                      $0 Policy
                    </span>
                  </span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    $0.00 (No Card Hold)
                  </span>
                </div>
                {listing?.extraOptions && listing.extraOptions.length > 0 && (
                  <div className="flex justify-between items-center text-[#404850] dark:text-[#c0c7d1]">
                    <span>Host Add-ons Available</span>
                    <span className="font-medium text-[10px]">{listing.extraOptions.length} Options</span>
                  </div>
                )}
                <div className="flex justify-between text-[#195b4c] font-semibold">
                  <span>$0 Traveler Fee (Guarantee)</span>
                  <span className="font-bold tabular-nums">Free ($0.00)</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes &amp; Local Lodging</span>
                  <span className="font-bold tabular-nums text-[#001848] dark:text-white">$0.00 (Exempt)</span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between font-bold text-sm text-[#001848] dark:text-white">
                  <span>Initial Due at Hold</span>
                  <span className="text-[#0A6FA8] dark:text-[#93ccff] font-black tabular-nums">${initialDueAtHold.toLocaleString()}.00</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onRequestToBook) {
                      const bookingListing = selectedRoom
                        ? { ...listing, monthlyRate: activeMonthlyRate, title: `${listing.title} (${selectedRoom.name})` }
                        : listing;
                      onRequestToBook(bookingListing);
                    }
                  }}
                  className="w-full py-3.5 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white font-bold text-xs shadow-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">shield</span>
                  <span>Request to book (Shift-protected)</span>
                </button>

                <PillowSaveButton
                  isSaved={isSaved}
                  onToggle={handleToggleSave}
                  showLabel={true}
                  size={18}
                  className={`w-full py-2.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ease-in-out cursor-pointer ${
                    isSaved
                      ? 'bg-[#EFF6FB] dark:bg-[#15233a] text-[#0B2559] dark:text-[#3E9AD1] border-[#0A6FA8]/40 shadow-xs'
                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-[#15233a] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#15233a]'
                  }`}
                />
              </div>

              <div className="text-center text-[11px] text-gray-400">
                Stripe Identity &amp; RN Verified guests get 24-hr priority approval
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Booking Bar (< lg) */}
        <div className="lg:hidden sticky bottom-0 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-3.5 sm:p-4 bg-white/95 dark:bg-[#0B1626]/95 backdrop-blur-md border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex items-center justify-between gap-3 z-30 shadow-lg mt-6">
          <div>
            <div className="text-base sm:text-lg font-black text-[#0B2559] dark:text-white tabular-nums">
              ${activeMonthlyRate.toLocaleString()}<span className="text-xs font-normal text-gray-500"> / mo</span>
            </div>
            <div className="text-[10px] text-[#2F6E5E] dark:text-[#aff0db] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              <span>$0 fee • Shift-ready</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onRequestToBook) {
                const bookingListing = selectedRoom
                  ? { ...listing, monthlyRate: activeMonthlyRate, title: `${listing.title} (${selectedRoom.name})` }
                  : listing;
                onRequestToBook(bookingListing);
              }
            }}
            className="px-5 py-2.5 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Request to book</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
