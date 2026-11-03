// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useMemo, useId } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { fetchLiveCommuteRoute, decodePolyline, LiveCommuteResult, LiveRouteStep } from '../services/liveCommuteApi';
import { HousingListing } from '../types';

export interface MapRouteVisualLayerProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  commuteMode: 'transit' | 'drive';
  selectedListing: HousingListing;
  hospitalName: string;
  onToggleCommuteMode?: (mode: 'transit' | 'drive') => void;
  onClose?: () => void;
}

// Generate realistic road dog-leg curve prior to live API confirmation
function generateRoadPath(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): { lat: number; lng: number }[] {
  const midLat = origin.lat;
  const midLng = destination.lng;
  return [
    origin,
    { lat: origin.lat * 0.75 + midLat * 0.25, lng: origin.lng * 0.75 + origin.lng * 0.25 },
    { lat: midLat, lng: midLng },
    { lat: midLat * 0.25 + destination.lat * 0.75, lng: midLng * 0.25 + destination.lng * 0.75 },
    destination,
  ];
}

export const MapRouteVisualLayer: React.FC<MapRouteVisualLayerProps> = ({
  origin,
  destination,
  commuteMode,
  selectedListing,
  hospitalName,
  onToggleCommuteMode,
  onClose,
}) => {
  const map = useMap();
  const [path, setPath] = useState<{ lat: number; lng: number }[]>(() =>
    generateRoadPath(origin, destination)
  );
  const [routeData, setRouteData] = useState<LiveCommuteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStepsOpen, setIsStepsOpen] = useState(false);
  const routeStepsListId = useId();

  // Fetch live turn-by-turn road polyline and steps from Google Maps Routes API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const initialPath = generateRoadPath(origin, destination);
    setPath(initialPath);

    fetchLiveCommuteRoute(origin, destination, commuteMode)
      .then((res) => {
        if (!isMounted || !res) return;
        setRouteData(res);
        if (res.encodedPolyline) {
          const decoded = decodePolyline(res.encodedPolyline);
          if (decoded.length > 0) {
            setPath(decoded);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, commuteMode]);

  // Multi-stroke layered route polyline (Casing + Primary + Centerline shine)
  useEffect(() => {
    if (!map || path.length === 0 || !(window as any).google?.maps?.Polyline) return;

    // 1. Outer Dark Casing (for crisp contrast against satellite / street basemaps)
    const casing = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#001848',
      strokeOpacity: 0.45,
      strokeWeight: 9,
      map,
    });

    // 2. High-Visibility Route Body (Clinical Teal for Drive, Action Blue for Transit)
    const isTransit = commuteMode === 'transit';
    const mainLine = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: isTransit ? '#0A6FA8' : '#195b4c',
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map,
    });

    // 3. Centerline Shine Highlight (gives modern turn-by-turn navigation glow)
    const shineLine = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: isTransit ? '#d0e6ff' : '#aff0db',
      strokeOpacity: 0.85,
      strokeWeight: 1.5,
      map,
    });

    return () => {
      casing.setMap(null);
      mainLine.setMap(null);
      shineLine.setMap(null);
    };
  }, [map, path, commuteMode]);

  // Compute midpoint along the path for the floating route duration badge
  const midPoint = useMemo(() => {
    if (path.length === 0) return null;
    const midIdx = Math.floor(path.length / 2);
    return path[midIdx];
  }, [path]);

  const activeDuration = routeData?.durationMinutes || selectedListing.driveTimeMinutes || 6;
  const activeDistance = routeData?.distanceMiles || 1.2;
  const activeDescription = routeData?.routeDescription || (commuteMode === 'transit' ? 'Transit Route' : 'Main Arterial');
  const isLive = routeData?.source === 'google-maps-api' || routeData?.source === 'cache';

  return (
    <>
      {/* 1. Mid-Route Floating ETA Marker along the polyline path */}
      {midPoint && (
        <AdvancedMarker position={midPoint} title="Route Travel Time">
          <div className="relative -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <div
              className={`px-2.5 py-1 rounded-full text-[11px] font-black text-white shadow-lg border border-white/40 flex items-center gap-1 whitespace-nowrap backdrop-blur-xs transition-transform hover:scale-105 ${
                commuteMode === 'transit' ? 'bg-[#0A6FA8]' : 'bg-[#195b4c]'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {commuteMode === 'transit' ? 'directions_bus' : 'directions_car'}
              </span>
              <span className="tabular-nums">{activeDuration}m</span>
            </div>
          </div>
        </AdvancedMarker>
      )}

      {/* 2. Interactive Route HUD & Preference Layer Card */}
      <div className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-sm z-20 pointer-events-auto bg-white/95 dark:bg-[#111e33]/95 backdrop-blur-md rounded-2xl shadow-xl border border-[rgba(11,37,89,0.12)] dark:border-[#233550] overflow-hidden text-[#001848] dark:text-white transition-all duration-200">
        {/* Card Header & Travel Mode Toggles */}
        <div className="p-3 pb-2.5 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1] truncate">
                Selected Travel Route
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Commute Mode Preference Toggle */}
              {onToggleCommuteMode && (
                <div className="inline-flex items-center bg-[#EFF6FB] dark:bg-[#182840] p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => onToggleCommuteMode('transit')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                      commuteMode === 'transit'
                        ? 'bg-[#0A6FA8] text-white shadow-2xs'
                        : 'text-gray-500 hover:text-[#0B2559] dark:hover:text-white'
                    }`}
                    title="Switch to Public Transit Route"
                    aria-pressed={commuteMode === 'transit'}
                  >
                    <span className="material-symbols-outlined text-[12px]">directions_bus</span>
                    <span className="hidden xs:inline">Transit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleCommuteMode('drive')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                      commuteMode === 'drive'
                        ? 'bg-[#195b4c] text-white shadow-2xs'
                        : 'text-gray-500 hover:text-[#0B2559] dark:hover:text-white'
                    }`}
                    title="Switch to Driving Route"
                    aria-pressed={commuteMode === 'drive'}
                  >
                    <span className="material-symbols-outlined text-[12px]">directions_car</span>
                    <span className="hidden xs:inline">Drive</span>
                  </button>
                </div>
              )}

              {/* Close Button */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-[#182840] transition-colors"
                  title="Close route highlight"
                  aria-label="Close route highlight"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary Route Summary Banner */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  commuteMode === 'transit' ? 'bg-[#0A6FA8]' : 'bg-[#195b4c]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {commuteMode === 'transit' ? 'directions_bus' : 'directions_car'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black tabular-nums text-[#001848] dark:text-white">
                    {activeDuration} min
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    ({activeDistance} mi)
                  </span>
                </div>
                <div className="text-[11px] text-[#0A6FA8] dark:text-[#3E9AD1] font-medium truncate">
                  {activeDescription}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isLive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                <span>{isLive ? 'Live API' : 'GIS'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Origin & Destination Waypoints */}
        <div className="p-3 py-2 bg-gray-50/70 dark:bg-[#0c1626]/70 flex items-center justify-between text-[11px] gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-[#195b4c] shrink-0" />
            <span className="text-gray-500 dark:text-gray-400 truncate">From:</span>
            <span className="font-bold truncate text-[#001848] dark:text-white">{selectedListing.title}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-[#001848] dark:bg-[#0A6FA8] shrink-0" />
            <span className="text-gray-500 dark:text-gray-400 truncate">To:</span>
            <span className="font-bold truncate text-[#001848] dark:text-white">{hospitalName.split(' - ')[0]}</span>
          </div>
        </div>

        {/* Expandable Step-by-Step Directions Toggle */}
        {routeData?.steps && routeData.steps.length > 0 && (
          <div className="border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
            <button
              type="button"
              onClick={() => setIsStepsOpen(!isStepsOpen)}
              aria-expanded={isStepsOpen}
              aria-pressed={isStepsOpen}
              aria-controls={routeStepsListId}
              className="w-full px-3 py-1.5 text-[11px] font-semibold text-[#0A6FA8] dark:text-[#3E9AD1] hover:bg-gray-50 dark:hover:bg-[#182840] transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>{isStepsOpen ? 'Hide route steps' : `View ${routeData.steps.length} route turns & stops`}</span>
              <span
                className={`material-symbols-outlined text-[15px] transition-transform duration-200 ${
                  isStepsOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {isStepsOpen && (
              <div id={routeStepsListId} className="px-3 py-2 max-h-48 overflow-y-auto space-y-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] text-[11px]">
                {routeData.steps.map((step: LiveRouteStep, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#EFF6FB] dark:bg-[#182840] text-[#0A6FA8] dark:text-[#3E9AD1] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[#001848] dark:text-white font-medium leading-snug">
                        {step.instruction}
                      </div>
                      {(step.distance || step.duration) && (
                        <div className="text-[10px] text-gray-400 font-semibold tabular-nums">
                          {step.distance} {step.duration ? `· ${step.duration}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
