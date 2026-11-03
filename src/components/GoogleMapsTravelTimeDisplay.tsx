import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommuteCalculationResult } from '../lib/googleMapsCommute';
import { fetchLiveCommuteRoute, LiveCommuteResult } from '../services/liveCommuteApi';

export interface GoogleMapsTravelTimeDisplayProps {
  commute: CommuteCalculationResult;
  compact?: boolean;
  className?: string;
  isNightShiftMode?: boolean;
  initialMode?: 'drive' | 'transit' | 'walk';
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}

export const GoogleMapsTravelTimeDisplay: React.FC<GoogleMapsTravelTimeDisplayProps> = ({
  commute,
  compact = false,
  className = '',
  isNightShiftMode = false,
  initialMode = 'drive',
  origin,
  destination,
}) => {
  const [selectedMode, setSelectedMode] = useState<'drive' | 'transit' | 'walk'>(initialMode);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [liveRoute, setLiveRoute] = useState<LiveCommuteResult | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Sync when initialMode changes externally
  useEffect(() => {
    if (initialMode) {
      setSelectedMode(initialMode);
    }
  }, [initialMode]);

  // Fetch real Google Maps Routes API data on-demand
  useEffect(() => {
    let isMounted = true;
    if (origin && destination) {
      setIsLoadingLive(true);
      fetchLiveCommuteRoute(origin, destination, selectedMode)
        .then((res) => {
          if (isMounted && res?.success) {
            setLiveRoute(res);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingLive(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, selectedMode]);

  // Dynamic route and departure calculation based on active commute mode (uses live API when resolved)
  const isLive = !!liveRoute && (liveRoute.source === 'google-maps-api' || liveRoute.source === 'cache');
  const activeMinutes = liveRoute
    ? liveRoute.durationMinutes
    : selectedMode === 'transit'
    ? commute.transitMinutes
    : selectedMode === 'walk'
    ? commute.walkMinutes
    : commute.driveMinutes;

  const displayDistance = liveRoute ? liveRoute.distanceMiles : commute.distanceMiles;

  // Buffer: transit needs shuttle boarding window (15m), walking needs scrub-in (10m), driving needs garage parking & ward walk (12m)
  const shiftBuffer = selectedMode === 'transit' ? 16 : selectedMode === 'walk' ? 10 : 12;
  const dayTotalMinutes = activeMinutes + shiftBuffer;
  const dayDepMinute = (60 - (dayTotalMinutes % 60)) % 60;
  const dayDepHour = dayTotalMinutes > 60 ? 5 : 6;
  const activeDayDeparture = `${dayDepHour}:${dayDepMinute.toString().padStart(2, '0')} AM (for 7 AM shift)`;

  const nightTotalMinutes = activeMinutes + (selectedMode === 'transit' ? 14 : selectedMode === 'walk' ? 10 : 10);
  const nightDepMinute = (60 - (nightTotalMinutes % 60)) % 60;
  const nightDepHour = nightTotalMinutes > 60 ? 5 : 6;
  const activeNightDeparture = `${nightDepHour}:${nightDepMinute.toString().padStart(2, '0')} PM (for 7 PM shift)`;

  const dynamicRouteSummary =
    liveRoute?.routeDescription ||
    (selectedMode === 'transit'
      ? `${commute.hospitalShortName} Campus Shuttle / Express Line (${commute.transitMinutes} min)`
      : selectedMode === 'walk'
      ? `Hospital Pedestrian Greenline (${commute.walkMinutes} min walk)`
      : commute.routeSummary);

  const dynamicTrafficStatus =
    selectedMode === 'transit'
      ? liveRoute?.transitInfo?.headsign ? `Headsign: ${liveRoute.transitInfo.headsign}` : 'Scheduled every 10–15m'
      : selectedMode === 'walk'
      ? 'Pedestrian walking path'
      : commute.trafficStatus;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ease-in-out duration-200 ${
        isNightShiftMode
          ? 'bg-[#15233a] border-[#233550] text-[#E6ECF7]'
          : 'bg-[#EFF6FB]/80 border-[rgba(11,37,89,0.08)] text-[#0B2559]'
      } ${className}`}
    >
      {/* 1. Header: Target Hospital & Proximity Tag */}
      <div className="p-3 pb-2 flex items-center justify-between gap-2 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550]/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[16px] text-[#0A6FA8] dark:text-[#3E9AD1] shrink-0">
            local_hospital
          </span>
          <span className="text-xs font-bold truncate">
            {commute.hospitalShortName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live API provenance tag */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isLive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
            }`}
            title={isLive ? 'Real-time calculation from Google Maps Routes API' : 'Calculated using GIS coordinates and speed models'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse' : 'bg-[#0A6FA8]'
              }`}
            />
            <span>{isLive ? 'Google Maps Live API' : 'GIS Model'}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              commute.isShiftSafe
                ? 'bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#195b4c]/30 dark:text-[#aff0db]'
                : 'bg-[#FBF0D6] text-[#B9822E] dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                commute.isShiftSafe ? 'bg-[#2F6E5E] dark:bg-[#aff0db]' : 'bg-[#B9822E]'
              }`}
            />
            <span>{commute.isShiftSafe ? 'Shift-Safe' : 'Suburban'}</span>
          </span>
        </div>
      </div>

      {/* 2. Interactive Travel Time Mode Grid */}
      <div className="p-3 pt-2.5 space-y-2">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {/* Drive Time */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMode('drive');
            }}
            className={`p-1.5 rounded-xl border transition-all duration-200 ease-in-out duration-150 cursor-pointer ${
              selectedMode === 'drive'
                ? 'bg-white dark:bg-[#111e33] border-[#0A6FA8] shadow-xs text-[#0B2559] dark:text-white ring-1 ring-[#0A6FA8]/20'
                : 'bg-white/50 dark:bg-[#111e33]/50 border-transparent hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white/80 dark:hover:bg-[#111e33] text-[#0B2559]/80 dark:text-[#E6ECF7]/80'
            }`}
            title="Drive Time to Hospital"
          >
            <div className="flex items-center justify-center gap-1 text-xs font-bold tabular-nums">
              <span className="material-symbols-outlined text-[14px] text-[#0A6FA8] dark:text-[#3E9AD1]">
                directions_car
              </span>
              <span>{selectedMode === 'drive' && liveRoute ? liveRoute.durationMinutes : commute.driveMinutes}m</span>
              {isLoadingLive && selectedMode === 'drive' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A6FA8] animate-ping" />
              )}
            </div>
            <div className="text-[10px] text-[#0B2559]/70 dark:text-[#9CB3D3] font-medium">Drive</div>
          </button>

          {/* Transit Time */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMode('transit');
            }}
            className={`p-1.5 rounded-xl border transition-all duration-200 ease-in-out duration-150 cursor-pointer ${
              selectedMode === 'transit'
                ? 'bg-white dark:bg-[#111e33] border-[#0A6FA8] shadow-xs text-[#0B2559] dark:text-white ring-1 ring-[#0A6FA8]/20'
                : 'bg-white/50 dark:bg-[#111e33]/50 border-transparent hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white/80 dark:hover:bg-[#111e33] text-[#0B2559]/80 dark:text-[#E6ECF7]/80'
            }`}
            title="Hospital Shuttle or Public Transit"
          >
            <div className="flex items-center justify-center gap-1 text-xs font-bold tabular-nums">
              <span className="material-symbols-outlined text-[14px] text-[#0A6FA8] dark:text-[#3E9AD1]">
                directions_bus
              </span>
              <span>{selectedMode === 'transit' && liveRoute ? liveRoute.durationMinutes : commute.transitMinutes}m</span>
              {isLoadingLive && selectedMode === 'transit' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A6FA8] animate-ping" />
              )}
            </div>
            <div className="text-[10px] text-[#0B2559]/70 dark:text-[#9CB3D3] font-medium">Transit</div>
          </button>

          {/* Distance */}
          <div
            className="p-1.5 rounded-xl bg-white/50 dark:bg-[#111e33]/50 border border-transparent select-none"
            title="Distance in miles"
          >
            <div className="flex items-center justify-center gap-1 text-xs font-bold tabular-nums text-[#0B2559] dark:text-white">
              <span className="material-symbols-outlined text-[14px] text-[#0A6FA8] dark:text-[#3E9AD1]">
                distance
              </span>
              <span>{displayDistance} mi</span>
            </div>
            <div className="text-[10px] text-[#0B2559]/70 dark:text-[#9CB3D3] font-medium">Distance</div>
          </div>
        </div>

        {/* Live Transit Line Details Banner (When returned by Google Maps Transit API) */}
        {selectedMode === 'transit' && liveRoute?.transitInfo && (
          <div className="p-2 rounded-xl bg-white dark:bg-[#111e33] border border-[#0A6FA8]/20 shadow-2xs flex items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[15px] text-[#0A6FA8] dark:text-[#3E9AD1] shrink-0">
                directions_bus
              </span>
              <span className="font-bold text-[#0B2559] dark:text-white truncate">
                {liveRoute.transitInfo.lineName}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[#2F6E5E] dark:text-[#aff0db] shrink-0">
              {liveRoute.transitInfo.stopCount ? `${liveRoute.transitInfo.stopCount} stops` : 'Campus Line'}
            </span>
          </div>
        )}

        {/* Route Snapshot Bar */}
        <div className="flex items-center justify-between text-[11px] text-[#0B2559]/70 dark:text-[#9CB3D3] pt-0.5">
          <span className="flex items-center gap-1 truncate max-w-[70%]">
            <span className="material-symbols-outlined text-[13px] text-[#2F6E5E] dark:text-[#aff0db] shrink-0">
              {selectedMode === 'transit' ? 'directions_bus' : selectedMode === 'walk' ? 'directions_walk' : 'alt_route'}
            </span>
            <span className="truncate">{dynamicRouteSummary}</span>
          </span>
          <span className="text-[10px] font-semibold text-[#0A6FA8] dark:text-[#3E9AD1] shrink-0 tabular-nums">
            {dynamicTrafficStatus}
          </span>
        </div>

        {/* 3. Progressive Disclosure Toggle: Shift Departure Advisor */}
        {!compact && (
          <div className="pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailsOpen(!isDetailsOpen);
              }}
              aria-expanded={isDetailsOpen}
              aria-controls="shift-departure-advisor"
              className="w-full py-1 text-[11px] font-semibold text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isDetailsOpen ? 'Hide shift departure schedule' : 'View shift departure advisor'}</span>
              <span
                className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${
                  isDetailsOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            <AnimatePresence>
              {isDetailsOpen && (
                <motion.div
                  id="shift-departure-advisor"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-1.5 pt-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] space-y-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between bg-white/70 dark:bg-[#111e33] px-2.5 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1.5 text-[#0B2559] dark:text-white font-medium">
                      <span className="material-symbols-outlined text-[13px] text-amber-500">wb_sunny</span>
                      <span>Day Shift (7 AM)</span>
                    </span>
                    <span className="font-bold text-[#0A6FA8] dark:text-[#3E9AD1] tabular-nums">
                      Depart by {activeDayDeparture}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white/70 dark:bg-[#111e33] px-2.5 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1.5 text-[#0B2559] dark:text-white font-medium">
                      <span className="material-symbols-outlined text-[13px] text-indigo-400">bedtime</span>
                      <span>Night Shift (7 PM)</span>
                    </span>
                    <span className="font-bold text-[#0A6FA8] dark:text-[#3E9AD1] tabular-nums">
                      Depart by {activeNightDeparture}
                    </span>
                  </div>

                  {commute.distanceMiles <= 2.0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-[#2F6E5E] dark:text-[#aff0db] bg-[#E1EFE9]/60 dark:bg-[#195b4c]/20 rounded-md">
                      <span className="material-symbols-outlined text-[12px]">directions_walk</span>
                      <span>Walkable / bikeable: ~{commute.walkMinutes} min shift walk or ~{Math.round(commute.walkMinutes * 0.35)} min bike ride</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
