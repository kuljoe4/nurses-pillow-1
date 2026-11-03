// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { HousingListing } from "../types";
import { fetchLiveCommuteRoute, decodePolyline } from "../services/liveCommuteApi";

interface HospitalLocation {
  name: string;
  lat: number;
  lng: number;
  system: string;
}

const NC_HOSPITALS: Record<string, HospitalLocation> = {
  "Duke University Hospital": {
    name: "Duke University Hospital",
    lat: 36.0076,
    lng: -78.9382,
    system: "Duke Health (Level I Trauma)",
  },
  "UNC Medical Center": {
    name: "UNC Medical Center",
    lat: 35.9049,
    lng: -79.0526,
    system: "UNC Health (Level I Trauma & Burn Center)",
  },
  "WakeMed Raleigh Campus": {
    name: "WakeMed Raleigh Campus",
    lat: 35.7892,
    lng: -78.5886,
    system: "WakeMed Health (Level I Trauma)",
  },
  "Atrium Health Carolinas Medical Center": {
    name: "Atrium Health Carolinas Medical Center",
    lat: 35.2036,
    lng: -80.8385,
    system: "Advocate Health (Level I Trauma)",
  },
  "ECU Health Medical Center": {
    name: "ECU Health Medical Center",
    lat: 35.6074,
    lng: -77.4048,
    system: "ECU Health (Level I Trauma)",
  },
};

interface GoogleMapsSplitViewProps {
  isNightShiftMode: boolean;
  listings: HousingListing[];
  selectedListingId: string | null;
  onSelectListing: (listing: HousingListing) => void;
  hospitalName?: string;
  radiusMiles?: number;
  commuteMode?: 'transit' | 'drive';
  onToggleCommuteMode?: (mode: 'transit' | 'drive') => void;
  onOpenDetails?: (listing: HousingListing) => void;
}

// Generate realistic initial road path prior to API response
function generateRoadPath(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [origin];
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    const curve = Math.sin(t * Math.PI) * 0.003 * (i % 2 === 0 ? 1 : -0.7);
    points.push({
      lat: origin.lat + (destination.lat - origin.lat) * t + curve,
      lng: origin.lng + (destination.lng - origin.lng) * t - curve * 0.8,
    });
  }
  points.push(destination);
  return points;
}

/**
 * Smoothly zooms and centers the Google Map camera on the selected housing property
 * using requestAnimationFrame with a custom cubic-bezier easing curve for fluid, cinema-like zoom motion.
 */
function animateCameraToProperty(
  map: google.maps.Map,
  target: { lat: number; lng: number },
  targetZoom: number = 15.5,
  durationMs: number = 650
): () => void {
  if (!map) return () => {};

  const currentZoom = map.getZoom() || 13;
  const currentCenter = map.getCenter();
  const startLat = currentCenter ? currentCenter.lat() : target.lat;
  const startLng = currentCenter ? currentCenter.lng() : target.lng;

  // Ease-out cubic curve (Nurses Pillow token: cubic-bezier(0.2, 0.8, 0.2, 1))
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const startTime = performance.now();

  let animId: number;

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeOut(progress);

    const lat = startLat + (target.lat - startLat) * eased;
    const lng = startLng + (target.lng - startLng) * eased;
    const zoom = currentZoom + (targetZoom - currentZoom) * eased;

    if (typeof (map as any).moveCamera === 'function') {
      (map as any).moveCamera({
        center: { lat, lng },
        zoom,
      });
    } else {
      map.setCenter({ lat, lng });
      map.setZoom(Math.round(zoom));
    }

    if (progress < 1) {
      animId = requestAnimationFrame(step);
    } else {
      if (typeof (map as any).moveCamera === 'function') {
        (map as any).moveCamera({
          center: target,
          zoom: targetZoom,
        });
      } else {
        map.panTo(target);
        map.setZoom(targetZoom);
      }
    }
  };

  animId = requestAnimationFrame(step);
  return () => {
    if (animId) cancelAnimationFrame(animId);
  };
}

// Map Controller to smoothly animate zoom & center on selected housing property or full corridor
const MapPanController: React.FC<{
  targetPropertyPosition?: { lat: number; lng: number };
  selectedListingId: string | null;
  hospitalPosition: { lat: number; lng: number };
  cameraMode: 'property' | 'corridor';
}> = ({ targetPropertyPosition, selectedListingId, hospitalPosition, cameraMode }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (cameraMode === 'property' && targetPropertyPosition) {
      // Execute smooth zoom animation centering directly on the selected housing property
      const cancelAnim = animateCameraToProperty(map, targetPropertyPosition, 15.5, 650);
      return cancelAnim;
    } else if (cameraMode === 'corridor' && targetPropertyPosition && (window as any).google?.maps?.LatLngBounds) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(targetPropertyPosition);
      bounds.extend(hospitalPosition);
      map.fitBounds(bounds, { top: 85, right: 70, bottom: 95, left: 70 });
    } else {
      map.panTo(hospitalPosition);
      map.setZoom(13);
    }
  }, [
    map,
    selectedListingId,
    targetPropertyPosition?.lat,
    targetPropertyPosition?.lng,
    cameraMode,
    hospitalPosition.lat,
    hospitalPosition.lng,
  ]);

  return null;
};

// Route Polyline & Directions API Visual Highlight Component
interface MapRouteHighlightProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  commuteMode: 'transit' | 'drive';
  onRouteCalculated?: (info: {
    duration: number;
    distance: number;
    description: string;
    isLive: boolean;
    steps?: string[];
  }) => void;
}

const MapRouteHighlight: React.FC<MapRouteHighlightProps> = ({
  origin,
  destination,
  commuteMode,
  onRouteCalculated,
}) => {
  const map = useMap();
  const [path, setPath] = useState<{ lat: number; lng: number }[]>(() =>
    generateRoadPath(origin, destination)
  );

  // Modern Routes API integration via backend proxy service (eliminates legacy DirectionsService errors)
  useEffect(() => {
    let isMounted = true;
    const initialPath = generateRoadPath(origin, destination);
    setPath(initialPath);

    fetchLiveCommuteRoute(origin, destination, commuteMode).then((res) => {
      if (!isMounted || !res) return;
      let routePoints: { lat: number; lng: number }[] = [];
      if (res.encodedPolyline) {
        routePoints = decodePolyline(res.encodedPolyline);
      } else if (res.coordinates && res.coordinates.length > 0) {
        routePoints = res.coordinates;
      }

      if (routePoints.length > 0) {
        setPath(routePoints);
      }

      const stepInstructions = res.steps?.map((s) => s.instruction) || [];
      onRouteCalculated?.({
        duration: res.durationMinutes,
        distance: res.distanceMiles,
        description: res.routeDescription,
        isLive: res.source === 'google-maps-api' || res.source === 'cache',
        steps: stepInstructions,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, commuteMode]);

  // Dual-Polyline Highlight Rendering for visual contrast
  useEffect(() => {
    if (!map || path.length === 0 || !(window as any).google?.maps?.Polyline) return;

    // Smoothly fit bounds to show the entire travel corridor
    if ((window as any).google?.maps?.LatLngBounds) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 85, right: 70, bottom: 95, left: 70 });
    }

    // Dark casing line for strong visual contrast on all map textures
    const casing = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#001848',
      strokeOpacity: 0.5,
      strokeWeight: 8,
      zIndex: 35,
      map,
    });

    // Primary highlight line (Blue for transit, Teal for drive)
    const isTransit = commuteMode === 'transit';
    const mainLine = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: isTransit ? '#0A6FA8' : '#195b4c',
      strokeOpacity: 0.95,
      strokeWeight: 4.5,
      zIndex: 36,
      icons: (window as any).google?.maps?.SymbolPath
        ? [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 2.2,
                strokeColor: '#FFFFFF',
                fillColor: isTransit ? '#0A6FA8' : '#195b4c',
                fillOpacity: 1,
                strokeWeight: 1,
              },
              offset: '50%',
              repeat: '90px',
            },
          ]
        : undefined,
      map,
    });

    return () => {
      casing.setMap(null);
      mainLine.setMap(null);
    };
  }, [map, path, commuteMode]);

  return null;
};

// Clustered Listing Markers Component using @googlemaps/markerclusterer
interface ClusteredListingMarkersProps {
  markers: Array<{
    listing: HousingListing;
    position: { lat: number; lng: number };
    isSelected: boolean;
    distanceMiles: number;
  }>;
  selectedListingId: string | null;
  commuteMode: 'transit' | 'drive';
  onSelectListing: (listing: HousingListing) => void;
}

const ClusteredListingMarkers: React.FC<ClusteredListingMarkersProps> = ({
  markers,
  selectedListingId,
  commuteMode,
  onSelectListing,
}) => {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerElementsRef = useRef<globalThis.Map<string, google.maps.marker.AdvancedMarkerElement>>(new globalThis.Map());

  // Initialize MarkerClusterer with customized Nurses Pillow cluster styling
  useEffect(() => {
    if (!map || !(window as any).google?.maps?.marker?.AdvancedMarkerElement) return;

    const renderer = {
      render({ count, position }: { count: number; position: google.maps.LatLng }) {
        const clusterContainer = document.createElement('div');
        clusterContainer.className = 'cursor-pointer group select-none';
        clusterContainer.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);">
            <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(10, 111, 168, 0.25); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div style="
              position: relative;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 14px;
              border-radius: 9999px;
              background: #0B2559;
              color: #ffffff;
              font-family: Poppins, sans-serif;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 4px 14px rgba(11, 37, 89, 0.35);
              border: 2px solid #ffffff;
              white-space: nowrap;
            ">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #3E9AD1; display: inline-block;"></span>
              <span style="font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 800;">${count}</span>
              <span style="font-size: 10px; opacity: 0.9; font-weight: 600;">Sanctuaries</span>
            </div>
          </div>
        `;

        const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
          position,
          content: clusterContainer,
          zIndex: 1000 + count,
          title: `${count} hospital-area sanctuaries. Click to expand cluster.`,
        });

        return advancedMarker;
      },
    };

    const clusterer = new MarkerClusterer({
      map,
      renderer,
      onClusterClick: (event, cluster, mapInstance) => {
        if (cluster.bounds) {
          mapInstance.fitBounds(cluster.bounds, { top: 85, right: 65, bottom: 85, left: 65 });
          const currentZoom = mapInstance.getZoom() || 13;
          mapInstance.setZoom(Math.min(currentZoom + 2, 17));
        }
      },
    });

    clustererRef.current = clusterer;

    return () => {
      clusterer.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  // Update clusterer markers when listings or selection change
  useEffect(() => {
    if (!clustererRef.current) return;
    clustererRef.current.clearMarkers();

    const markersToCluster: google.maps.marker.AdvancedMarkerElement[] = [];
    markerElementsRef.current.forEach((markerElement, id) => {
      // Keep selected listing outside cluster so its price, route, and radar are always prominently visible
      if (id !== selectedListingId) {
        markersToCluster.push(markerElement);
      }
    });

    clustererRef.current.addMarkers(markersToCluster);
  }, [markers, selectedListingId]);

  const handleMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    if (marker) {
      markerElementsRef.current.set(id, marker);
      if (clustererRef.current && id !== selectedListingId) {
        clustererRef.current.addMarker(marker, true);
      }
    } else {
      const existing = markerElementsRef.current.get(id);
      if (existing && clustererRef.current) {
        clustererRef.current.removeMarker(existing, true);
      }
      markerElementsRef.current.delete(id);
    }
  }, [selectedListingId]);

  return (
    <>
      {markers.map(({ listing, position, isSelected, distanceMiles }) => (
        <AdvancedMarker
          key={listing.id}
          position={position}
          title={`${listing.title} - $${listing.monthlyRate}/mo`}
          onClick={() => onSelectListing(listing)}
          ref={(marker) => handleMarkerRef(marker as any, listing.id)}
          zIndex={isSelected ? 120 : 10}
        >
          <div
            className={`relative cursor-pointer transition-all duration-200 ease-in-out -translate-x-1/2 -translate-y-full flex flex-col items-center ${
              isSelected ? "scale-110 z-30" : "hover:scale-105 z-10"
            }`}
          >
            {/* Glowing Radar Target Ping for Selected Property */}
            {isSelected && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10">
                <div className="w-16 h-16 rounded-full bg-[#0A6FA8]/25 animate-ping" />
                <div className="absolute inset-0 w-12 h-12 m-auto rounded-full bg-[#0A6FA8]/35 animate-pulse" />
              </div>
            )}

            {/* Proximity Badge above price pin when hovered/selected */}
            <div
              className={`absolute -top-7 whitespace-nowrap px-2 py-1 rounded-md text-white text-[10px] font-bold shadow-sm transition-opacity duration-200 ${
                isSelected
                  ? commuteMode === 'transit'
                    ? 'bg-[#0A6FA8] opacity-100 ring-1 ring-white'
                    : 'bg-[#195b4c] opacity-100 ring-1 ring-white'
                  : 'bg-[#195b4c] opacity-0 group-hover:opacity-100'
              }`}
            >
              {commuteMode === 'transit' ? '🚌 ' : '🚗 '}
              {commuteMode === 'transit'
                ? `${Math.round((listing.driveTimeMinutes || 8) * 1.8 + 2)} min transit`
                : `${listing.driveTimeMinutes || Math.max(2, Math.round(distanceMiles * 2.5))} min drive`} ({distanceMiles} mi)
            </div>
            <div
              className={`px-2.5 py-1 mt-6 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1 whitespace-nowrap transition-colors ${
                isSelected
                  ? commuteMode === 'transit'
                    ? "bg-[#0A6FA8] text-white ring-2 ring-white ring-offset-1"
                    : "bg-[#195b4c] text-white ring-2 ring-white ring-offset-1"
                  : "bg-white dark:bg-[#111e33] text-[#001848] dark:text-white border border-[rgba(11,37,89,0.18)] hover:bg-[#f2f3ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#f2f3ff]"
              }`}
            >
              <span className="material-symbols-outlined text-[13px] text-amber-500">
                bed
              </span>
              <span className="tabular-nums">
                ${listing.monthlyRate.toLocaleString()}
              </span>
            </div>
            {/* Point */}
            <div
              className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] mx-auto -mt-0.5 ${
                isSelected
                  ? commuteMode === 'transit'
                    ? "border-t-[#0A6FA8]"
                    : "border-t-[#195b4c]"
                  : "border-t-white dark:border-t-[#111e33]"
              }`}
            />
          </div>
        </AdvancedMarker>
      ))}
    </>
  );
};

export const GoogleMapsSplitView: React.FC<GoogleMapsSplitViewProps> = ({
  isNightShiftMode,
  listings,
  selectedListingId,
  onSelectListing,
  hospitalName = "Duke University Hospital",
  radiusMiles = 5,
  commuteMode = 'transit',
  onToggleCommuteMode,
  onOpenDetails,
}) => {
  // Find hospital coordinates
  const matchedHospitalKey =
    Object.keys(NC_HOSPITALS).find((k) =>
      hospitalName.toLowerCase().includes(k.toLowerCase()),
    ) || "Duke University Hospital";
  const hospital =
    NC_HOSPITALS[matchedHospitalKey] ||
    NC_HOSPITALS["Duke University Hospital"];

  const [activeCenter, setActiveCenter] = useState({
    lat: hospital.lat,
    lng: hospital.lng,
  });
  const [activeZoom, setActiveZoom] = useState(13);
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const [cameraMode, setCameraMode] = useState<'property' | 'corridor'>('property');
  const routeStepsContainerId = useId();

  // Sync center when hospital changes
  useEffect(() => {
    setActiveCenter({ lat: hospital.lat, lng: hospital.lng });
    setActiveZoom(13);
  }, [hospital.lat, hospital.lng]);

  // When user selects a listing from the sidebar, automatically switch to 'property' camera mode to trigger smooth zoom
  useEffect(() => {
    setIsStepsExpanded(false);
    if (selectedListingId) {
      setCameraMode('property');
    }
  }, [selectedListingId, commuteMode]);

  // Ensure selected listing is always included in markers
  // ⚡ Bolt Performance Optimization: Optimize selected listing prioritization
  // Replaced multiple O(N) array scans (.slice, .some, .find) with a single O(N) .findIndex lookup
  // and prevented unnecessary object duplication
  const activeListingPool = [...listings];
  if (selectedListingId) {
    const selectedIdx = activeListingPool.findIndex((l) => l.id === selectedListingId);
    if (selectedIdx > 9) {
      const [selectedObj] = activeListingPool.splice(selectedIdx, 1);
      activeListingPool.unshift(selectedObj);
    }
  }

  // Compute positions for listings around the hospital
  const listingMarkers = activeListingPool.slice(0, 12).map((listing, idx) => {
    const angle = (idx * (2 * Math.PI)) / Math.min(activeListingPool.length, 12) + 0.4;
    const distanceKm = 0.8 + (idx % 4) * 1.2;
    const degLat = distanceKm / 111;
    const degLng =
      distanceKm / (111 * Math.cos((hospital.lat * Math.PI) / 180));

    const lat = hospital.lat + Math.sin(angle) * degLat;
    const lng = hospital.lng + Math.cos(angle) * degLng;
    const isSelected = selectedListingId === listing.id;
    const distanceMiles = Math.max(
      0.1,
      Math.round(distanceKm * 0.621371 * 10) / 10,
    );

    return {
      listing,
      position: { lat, lng },
      isSelected,
      distanceMiles,
    };
  });

  const selectedMarker = listingMarkers.find((m) => m.isSelected) || listingMarkers[0];

  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    duration: number;
    distance: number;
    description: string;
    isLive: boolean;
    steps?: string[];
  } | null>(null);

  // Reset steps expansion when listing changes
  useEffect(() => {
    setIsStepsExpanded(false);
  }, [selectedListingId, commuteMode]);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-3xl overflow-hidden border border-[rgba(11,37,89,0.1)] dark:border-[#233550] shadow-sm flex flex-col bg-[#eaf1f8] dark:bg-[#0c1626]">
      {/* Top Map HUD: Hospital & Proximity Tag */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 dark:bg-[#111e33]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex items-center gap-2.5 max-w-[85%]">
          <div className="w-7 h-7 rounded-xl bg-[#005684] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[16px]">
              local_hospital
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#005684] dark:text-[#93ccff]">
              Active Assignment Hub
            </div>
            <div className="text-xs font-bold text-[#001848] dark:text-white truncate">
              {hospital.name}
            </div>
          </div>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#195b4c]/10 text-[#195b4c] dark:bg-[#aff0db]/20 dark:text-[#aff0db] text-[10px] font-bold shrink-0">
            ≤{radiusMiles} mi radius
          </span>
        </div>

        <div className="pointer-events-auto bg-white/90 dark:bg-[#111e33]/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs border border-[rgba(11,37,89,0.08)] dark:border-[#233550] text-[11px] font-bold text-[#005684] dark:text-[#93ccff]">
          {listings.length} Sanctuaries
        </div>
      </div>

      {/* Floating Active Route Highlight HUD (Connected with Google Maps Directions API) */}
      {selectedMarker && (
        <div className="absolute top-16 left-3 z-20 pointer-events-auto bg-[#001848]/95 dark:bg-[#0B1626]/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.18)] max-w-sm w-[92%] sm:w-auto transition-all animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                  commuteMode === 'transit' ? 'bg-[#0A6FA8]' : 'bg-[#195b4c]'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">
                  {commuteMode === 'transit' ? 'directions_bus' : 'directions_car'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-xs sm:text-sm tabular-nums">
                    {activeRouteInfo
                      ? `${activeRouteInfo.duration} min ${commuteMode}`
                      : `${selectedMarker.distanceMiles} mi route`}
                  </span>
                  <span className="text-gray-300 text-xs font-normal truncate max-w-[110px] sm:max-w-[160px]">
                    ({activeRouteInfo ? `${activeRouteInfo.distance} mi` : selectedMarker.listing.title})
                  </span>
                </div>
                <div className="text-[10px] text-[#aff0db] font-medium truncate max-w-[190px] sm:max-w-[240px]">
                  {activeRouteInfo?.description || 'Calculating live route...'}
                </div>
              </div>
            </div>

            {/* Commute Mode Quick Toggle in Map HUD */}
            {onToggleCommuteMode && (
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[10px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleCommuteMode('drive')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    commuteMode === 'drive'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Switch to vehicle drive route"
                >
                  Drive
                </button>
                <button
                  type="button"
                  onClick={() => onToggleCommuteMode('transit')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    commuteMode === 'transit'
                      ? 'bg-[#0A6FA8] text-white shadow-xs'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Switch to public transit and bus route"
                >
                  Transit
                </button>
              </div>
            )}
          </div>

          {/* Secondary Actions: Turn-by-Turn Steps & View Details */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  activeRouteInfo?.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
                }`}
              />
              <span className="text-[10px] text-gray-300 font-medium">
                {activeRouteInfo?.isLive ? 'Directions API Active' : 'Route Highlighted'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Camera Mode Toggle: Smooth Zoom on Property vs Full Route Corridor */}
              <button
                type="button"
                onClick={() => setCameraMode(cameraMode === 'property' ? 'corridor' : 'property')}
                className="text-[10px] font-bold text-[#aff0db] hover:underline flex items-center gap-0.5 cursor-pointer"
                title={cameraMode === 'property' ? 'Zoom out to view full commute corridor to hospital' : 'Smooth zoom to center on selected housing property'}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {cameraMode === 'property' ? 'zoom_out_map' : 'filter_center_focus'}
                </span>
                <span>{cameraMode === 'property' ? 'Full Route' : 'Center Property'}</span>
              </button>

              {activeRouteInfo?.steps && activeRouteInfo.steps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsStepsExpanded(!isStepsExpanded)}
                  aria-expanded={isStepsExpanded}
                  aria-controls={routeStepsContainerId}
                  className="text-[10px] font-bold text-[#aff0db] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isStepsExpanded ? 'Hide Steps' : `${activeRouteInfo.steps.length} Steps`}</span>
                  <span className="material-symbols-outlined text-[13px]">
                    {isStepsExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )}

              {onOpenDetails && (
                <button
                  type="button"
                  onClick={() => onOpenDetails(selectedMarker.listing)}
                  className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Details
                </button>
              )}
            </div>
          </div>

          {/* Expandable Turn-by-Turn Directions */}
          {isStepsExpanded && activeRouteInfo?.steps && (
            <div
              id={routeStepsContainerId}
              className="mt-2 pt-2 border-t border-white/15 max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin text-[11px]"
            >
              {activeRouteInfo.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-gray-200">
                  <span className="w-4 h-4 rounded-full bg-white/10 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Google Map Container */}
      <div className="w-full h-full flex-1 min-h-[460px] relative">
        <Map
          mapId="bf51a910020fa25a"
          defaultCenter={{ lat: hospital.lat, lng: hospital.lng }}
          defaultZoom={activeZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl={true}
          style={{ width: "100%", height: "100%" }}
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        >
          {/* Smooth Zoom & Camera Controller */}
          <MapPanController
            targetPropertyPosition={selectedMarker?.position}
            selectedListingId={selectedListingId}
            hospitalPosition={{ lat: hospital.lat, lng: hospital.lng }}
            cameraMode={cameraMode}
          />

          {/* Active Route Polyline Highlight connecting Sanctuary & Hospital */}
          {selectedMarker && (
            <MapRouteHighlight
              origin={selectedMarker.position}
              destination={{ lat: hospital.lat, lng: hospital.lng }}
              commuteMode={commuteMode}
              onRouteCalculated={setActiveRouteInfo}
            />
          )}

          {/* Hospital Anchor Marker */}
          <AdvancedMarker
            position={{ lat: hospital.lat, lng: hospital.lng }}
            title={hospital.name}
          >
            <div className="relative group cursor-pointer -translate-x-1/2 -translate-y-full flex flex-col items-center">
              {/* Commute Radius Graphic & Pulsating Radar Rings */}
              <div className="absolute top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-56 h-56 flex items-center justify-center -z-10">
                <div className="absolute w-52 h-52 rounded-full bg-[#0A6FA8]/10 border border-[#0A6FA8]/25 opacity-75" />
                <div className="absolute w-36 h-36 rounded-full bg-[#0A6FA8]/15 border border-[#0A6FA8]/40" />
                <div className="absolute w-20 h-20 rounded-full bg-[#195b4c]/20 border border-dashed border-[#195b4c]/50" />
              </div>

              <div className="relative z-10 px-3 py-1.5 rounded-2xl bg-[#001848] text-white text-xs font-extrabold shadow-md ring-2 ring-white flex items-center gap-1.5 whitespace-nowrap">
                <span className="material-symbols-outlined text-[15px] text-[#aff0db]">
                  local_hospital
                </span>
                <span>{hospital.name.split(" ")[0]} Hub</span>
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#001848] mx-auto -mt-0.5 z-10" />
            </div>
          </AdvancedMarker>

          {/* Housing Listing Markers */}
          {listingMarkers.map(
            ({ listing, position, isSelected, distanceMiles }) => (
              <AdvancedMarker
                key={listing.id}
                position={position}
                title={`${listing.title} - $${listing.monthlyRate}/mo`}
                onClick={() => onSelectListing(listing)}
              >
                <div
                  className={`relative cursor-pointer transition-all duration-200 ease-in-out -translate-x-1/2 -translate-y-full flex flex-col items-center ${
                    isSelected ? "scale-110 z-30" : "hover:scale-105 z-10"
                  }`}
                >
                  {/* Glowing Radar Target Ping for Selected Property */}
                  {isSelected && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10">
                      <div className="w-16 h-16 rounded-full bg-[#0A6FA8]/25 animate-ping" />
                      <div className="absolute inset-0 w-12 h-12 m-auto rounded-full bg-[#0A6FA8]/35 animate-pulse" />
                    </div>
                  )}

                  {/* Proximity Badge above price pin when hovered/selected */}
                  <div
                    className={`absolute -top-7 whitespace-nowrap px-2 py-1 rounded-md text-white text-[10px] font-bold shadow-sm transition-opacity duration-200 ${
                      isSelected
                        ? commuteMode === 'transit'
                          ? 'bg-[#0A6FA8] opacity-100 ring-1 ring-white'
                          : 'bg-[#195b4c] opacity-100 ring-1 ring-white'
                        : 'bg-[#195b4c] opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {commuteMode === 'transit' ? '🚌 ' : '🚗 '}
                    {commuteMode === 'transit'
                      ? `${Math.round((listing.driveTimeMinutes || 8) * 1.8 + 2)} min transit`
                      : `${listing.driveTimeMinutes || Math.max(2, Math.round(distanceMiles * 2.5))} min drive`} ({distanceMiles} mi)
                  </div>
                  <div
                    className={`px-2.5 py-1 mt-6 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1 whitespace-nowrap transition-colors ${
                      isSelected
                        ? commuteMode === 'transit'
                          ? "bg-[#0A6FA8] text-white ring-2 ring-white ring-offset-1"
                          : "bg-[#195b4c] text-white ring-2 ring-white ring-offset-1"
                        : "bg-white dark:bg-[#111e33] text-[#001848] dark:text-white border border-[rgba(11,37,89,0.18)] hover:bg-[#f2f3ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#f2f3ff]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] text-amber-500">
                      bed
                    </span>
                    <span className="tabular-nums">
                      ${listing.monthlyRate.toLocaleString()}
                    </span>
                  </div>
                  {/* Point */}
                  <div
                    className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] mx-auto -mt-0.5 ${
                      isSelected
                        ? commuteMode === 'transit'
                          ? "border-t-[#0A6FA8]"
                          : "border-t-[#195b4c]"
                        : "border-t-white dark:border-t-[#111e33]"
                    }`}
                  />
                </div>
              </AdvancedMarker>
            ),
          )}
        </Map>
      </div>

      {/* Bottom Floating Legend / Proximity Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between p-2.5 rounded-2xl bg-white/95 dark:bg-[#111e33]/95 backdrop-blur-md border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-md text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#001848] dark:text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#001848] ring-1 ring-white" />
            <span>Hospital Assignment</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#005684] dark:text-[#93ccff]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#005684]" />
            <span>Furnished Sanctuary</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              commuteMode === 'transit'
                ? 'text-[#0A6FA8] dark:text-[#3E9AD1] bg-[#EFF6FB] dark:bg-[#182840]'
                : 'text-[#195b4c] dark:text-[#aff0db] bg-[#E1EFE9] dark:bg-[#15342c]'
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">
              {commuteMode === 'transit' ? 'directions_bus' : 'directions_car'}
            </span>
            <span>{commuteMode === 'transit' ? 'Transit route timing' : 'Driving route timing'}</span>
          </div>
          <span className="text-[11px] text-[#404850] dark:text-[#c0c7d1] hidden sm:inline">
            Click pin or card to highlight route
          </span>
        </div>
      </div>
    </div>
  );
};

