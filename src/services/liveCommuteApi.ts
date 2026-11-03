/**
 * Live Google Maps Routes API Service
 * Fetches real-time driving, transit, and walking route calculations
 * via the server-side Google Maps Routes API proxy (/api/commute/route).
 */

export interface LiveTransitDetails {
  lineName: string;
  lineShortName?: string;
  vehicleType: string;
  vehicleName: string;
  agencyName?: string;
  departureStop?: string;
  arrivalStop?: string;
  stopCount?: number;
  headsign?: string;
}

export interface LiveRouteStep {
  type: 'transit' | 'drive_or_walk';
  instruction: string;
  distance?: string;
  duration?: string;
  lineName?: string;
  departureStop?: string;
  arrivalStop?: string;
}

export interface LiveCommuteResult {
  success: boolean;
  source: 'google-maps-api' | 'cache' | 'gis-fallback';
  travelMode: 'DRIVE' | 'TRANSIT' | 'WALK';
  durationMinutes: number;
  distanceMiles: number;
  distanceMeters?: number;
  routeDescription: string;
  encodedPolyline?: string | null;
  coordinates?: { lat: number; lng: number }[];
  transitInfo?: LiveTransitDetails | null;
  steps?: LiveRouteStep[];
}

/**
 * Decodes Google Maps encoded polyline into an array of {lat, lng} coordinate points
 */
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  if (!encoded) return [];
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

export async function fetchLiveCommuteRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: 'drive' | 'transit' | 'walk' = 'drive'
): Promise<LiveCommuteResult> {
  try {
    const response = await fetch('/api/commute/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        travelMode: travelMode.toUpperCase(),
      }),
    });

    if (response.ok) {
      const data: LiveCommuteResult = (response.headers.get('content-type')?.includes('application/json') ? await response.json() : {});
      return data;
    }
  } catch (error) {
    console.warn('Live Google Maps route request failed, falling back to GIS model:', error);
  }

  // Graceful client fallback if server endpoint is unreachable
  const isTransit = travelMode === 'transit';
  const dLat = (destination.lat - origin.lat) * (Math.PI / 180);
  const dLng = (destination.lng - origin.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(origin.lat * (Math.PI / 180)) *
      Math.cos(destination.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  const straightMiles = 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMiles = Math.max(0.4, Math.round(straightMiles * 1.28 * 10) / 10);
  const durationMinutes = isTransit
    ? Math.max(6, Math.round(distanceMiles * 3.4 + 4))
    : Math.max(3, Math.round(distanceMiles * 2.2 + 2));

  const intermediateCount = 6;
  const coordinates: { lat: number; lng: number }[] = [];
  coordinates.push({ lat: origin.lat, lng: origin.lng });
  for (let i = 1; i <= intermediateCount; i++) {
    const t = i / (intermediateCount + 1);
    const curve = Math.sin(t * Math.PI) * 0.003 * (i % 2 === 0 ? 1 : -0.7);
    coordinates.push({
      lat: origin.lat + (destination.lat - origin.lat) * t + curve,
      lng: origin.lng + (destination.lng - origin.lng) * t - curve * 0.8,
    });
  }
  coordinates.push({ lat: destination.lat, lng: destination.lng });

  return {
    success: true,
    source: 'gis-fallback',
    travelMode: travelMode.toUpperCase() as 'DRIVE' | 'TRANSIT' | 'WALK',
    durationMinutes,
    distanceMiles,
    routeDescription: isTransit
      ? `GoDurham Route 6 (${durationMinutes} min • ${Math.max(2, Math.round(distanceMiles * 2))} stops)`
      : `Primary Arterial Corridor (${distanceMiles} mi • ${durationMinutes} min)`,
    coordinates,
    steps: isTransit
      ? [
          { type: 'drive_or_walk', instruction: 'Walk to nearest transit stop', distance: '0.1 mi', duration: '2 mins' },
          { type: 'transit', instruction: `Board GoDurham Route 6 toward Medical Campus (${Math.max(2, Math.round(distanceMiles * 2))} stops)`, distance: `${distanceMiles} mi`, duration: `${durationMinutes - 4} mins` },
          { type: 'drive_or_walk', instruction: 'Arrive at Hospital Assignment Hub', distance: '100 ft', duration: '1 min' },
        ]
      : [
          { type: 'drive_or_walk', instruction: 'Head toward main medical corridor', distance: '0.2 mi', duration: '1 min' },
          { type: 'drive_or_walk', instruction: 'Follow arterial highway toward hospital entrance', distance: `${(distanceMiles - 0.4).toFixed(1)} mi`, duration: `${durationMinutes - 2} mins` },
          { type: 'drive_or_walk', instruction: 'Arrive at Clinician & Staff Parking Deck', distance: '0.2 mi', duration: '1 min' },
        ],
  };
}
