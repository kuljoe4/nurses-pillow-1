// Source: Google Maps Platform Code Assist - Places API (New)
import React, { useState, useEffect, useRef } from"react";
import {
  Map,
  AdvancedMarker,
  useMapsLibrary,
  useMap,
} from"@vis.gl/react-google-maps";
import { ACTIVE_STATES, isStateActive, getStateName } from "../lib/constants/states";

interface HostAddressMappingProps {
  isNightShiftMode: boolean;
  initialAddress?: string;
  dynamicActiveStates?: string[];
  onAddressConfirmed?: (addressData: {
    formattedAddress: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
    zipCode: string;
    isExpansionWaitlist?: boolean;
    nearestHospitalDistances: {
      hospital: string;
      distanceMiles: number;
      driveMins: number;
      id: string;
    }[];
    placeId?: string | null;
  }) => void;
}

// Map center synchronizer
const PanToLocation: React.FC<{ coords: { lat: number; lng: number } }> = ({
  coords,
}) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(coords);
      map.setZoom(14);
    }
  }, [map, coords.lat, coords.lng]);
  return null;
};

export const HostAddressMapping: React.FC<HostAddressMappingProps> = ({
  isNightShiftMode,
  initialAddress = "",
  dynamicActiveStates,
  onAddressConfirmed,
}) => {
  const [addressInput, setAddressInput] = useState(initialAddress);
  const [unitApt, setUnitApt] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 39.5, lng: -98.35 });
  const [cityState, setCityState] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [placesSuggestions, setPlacesSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyDistances, setNearbyDistances] = useState<{ hospital: string; distanceMiles: number; driveMins: number; id: string }[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);

  // Modern Places Library (Places API (New))
  const placesLibrary = useMapsLibrary("places");
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (text: string) => {
    setAddressInput(text);
    setIsConfirmed(false);
    setPlaceId(null);
    setCityState("");
    setNearbyDistances([]);
    setIsDropdownOpen(true);

    const trimmed = text.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmed.length > 2 && placesLibrary?.AutocompleteSuggestion) {
      setIsSearching(true);

      debounceTimerRef.current = setTimeout(() => {
        // Create Places API (New) session token
        if (!sessionTokenRef.current && placesLibrary.AutocompleteSessionToken) {
          sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
        }

        const request: google.maps.places.AutocompleteRequest = {
          input: trimmed,
          sessionToken: sessionTokenRef.current ?? undefined,
          includedRegionCodes: ["us"],
        };

        placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
          .then((res) => {
            if (res?.suggestions) {
              setPlacesSuggestions(res.suggestions);
            } else {
              setPlacesSuggestions([]);
            }
          })
          .catch(() => {
            setPlacesSuggestions([]);
          })
          .finally(() => {
            setIsSearching(false);
          });
      }, 300);
    } else {
      setPlacesSuggestions([]);
      setIsSearching(false);
    }
  };

  const handleSelectPlacesSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    const formattedAddress =
      prediction.text?.text || prediction.mainText?.text ||"";
    setAddressInput(formattedAddress);
    setIsDropdownOpen(false);

    try {
      // Modern Places API (New) Place.fetchFields()
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "displayName", "formattedAddress", "location", "addressComponents"],
      });

      if (place.location) {
        const lat = place.location.lat();
        const lng = place.location.lng();
        setCoords({ lat, lng });
      } else {
        throw new Error("The selected address did not include map coordinates.");
      }
      setPlaceId(place.id || null);
      setIsConfirmed(false);
      setNearbyDistances([]);

      let city = "";
      let state = "";
      let zip = "";

      if (place.addressComponents) {
        place.addressComponents.forEach((c) => {
          if (c.types.includes("locality") || (!city && c.types.includes("postal_town"))) city = c.longText || city;
          if (c.types.includes("administrative_area_level_1"))
            state = c.shortText || state;
          if (c.types.includes("postal_code")) zip = c.shortText || zip;
          if (!city && c.types.includes("sublocality_level_1")) city = c.longText || city;
          if (!city && c.types.includes("administrative_area_level_2")) city = c.longText || city;
        });
      }
      if (!city || !state || !zip) {
        throw new Error("Select a complete US street address with city, state, and ZIP code.");
      }
      setCityState([city, state, zip].filter(Boolean).join(", "));
      setAddressInput(place.formattedAddress || formattedAddress);
    } catch (err) {
      console.warn("Place.fetchFields error:", err);
    } finally {
      sessionTokenRef.current = null;
    }
  };

  // Nearby hospitals are discovered from the confirmed property coordinates.
  const currentState = cityState.split(",")[1]?.trim().split(" ")[0]?.toUpperCase() || "";
  const isValidState = isStateActive(currentState, dynamicActiveStates);

  useEffect(() => {
    if (!isConfirmed || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return;
    const controller = new AbortController();
    setNearbyLoading(true);
    const params = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng), radiusMiles: "20" });
    fetch("/api/hospitals/nearby?" + params.toString(), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Nearby hospital lookup failed");
        return response.json();
      })
      .then((rows) => setNearbyDistances(Array.isArray(rows) ? rows.map((hospital: any) => ({
        id: hospital.id,
        hospital: hospital.name,
        distanceMiles: Number(hospital.distance_miles),
        driveMins: hospital.estimated_drive_minutes == null ? 0 : Number(hospital.estimated_drive_minutes),
      })) : []))
      .catch((error) => { if (error.name !== "AbortError") setNearbyDistances([]); })
      .finally(() => setNearbyLoading(false));
    return () => controller.abort();
  }, [isConfirmed, coords.lat, coords.lng]);

  const handleConfirm = () => {
    if (!placeId || !cityState || !addressInput.trim()) return;
    setIsConfirmed(true);
    onAddressConfirmed?.({
      formattedAddress: `${addressInput} ${unitApt ? `(${unitApt})` : ""}`.trim(),
      lat: coords.lat,
      lng: coords.lng,
      city: cityState.split(",")[0] || "",
      state: currentState,
      zipCode: cityState.split(",").pop()?.trim() || "",
      isExpansionWaitlist: !isValidState,
      nearestHospitalDistances: nearbyDistances,
      placeId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111e33] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#005684] dark:text-[#93ccff]">
              Host Stepper • Step HL-02
            </div>
            <h3 className="text-base font-bold text-[#001848] dark:text-white">
              Address Entry &amp; Proximity Verification
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#195b4c]/10 text-[#195b4c] dark:bg-[#aff0db]/20 dark:text-[#aff0db] text-xs font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">
              pin_drop
            </span>
            <span>{isConfirmed ? "Address Confirmed" : "Awaiting Address"}</span>
          </span>
        </div>

        {/* Address Autocomplete Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
          <div className="sm:col-span-2 relative">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Street Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Start typing street address..."
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl bg-[#f2f3ff] dark:bg-[#182840] border border-[rgba(11,37,89,0.12)] dark:border-[#233550] text-[#001848] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005684]"
              />
              {isSearching && (
                <div className="absolute right-3 top-3 w-4 h-4 border border-[#005684]/20 border-t-[#005684] rounded-full animate-spin" />
              )}
            </div>

            {/* Places Suggestions */}
            {isDropdownOpen && placesSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-[#111e33] rounded-xl shadow-lg border border-[rgba(11,37,89,0.1)] dark:border-[#233550] overflow-hidden max-h-48 overflow-y-auto">
                {placesSuggestions.map((suggestion, idx) => {
                  const mainText =
                    suggestion.placePrediction?.mainText?.text ||
                    suggestion.placePrediction?.text?.text ||"";
                  const secondaryText =
                    suggestion.placePrediction?.secondaryText?.text ||"";
                  return (
                    <button
                      key={`host-place-${idx}`}
                      type="button"
                      onClick={() => handleSelectPlacesSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff] dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] transition-colors cursor-pointer border-b border-gray-100 dark:border-[#233550] last:border-b-0"
                    >
                      <div className="font-semibold text-[#001848] dark:text-white">
                        {mainText}
                      </div>
                      {secondaryText && (
                        <div className="text-[10px] text-gray-500">
                          {secondaryText}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Unit / Suite / Apt #
            </label>
            <input
              type="text"
              value={unitApt}
              onChange={(e) => setUnitApt(e.target.value)}
              placeholder="e.g. Apt 304, Unit B"
              className="w-full px-3 py-2.5 text-xs font-medium rounded-xl bg-[#f2f3ff] dark:bg-[#182840] border border-[rgba(11,37,89,0.12)] dark:border-[#233550] text-[#001848] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005684]"
            />
          </div>
        </div>

        {/* Interactive Verification Map with Pulsating Animation and Radius Graphic */}
      <div className="h-72 w-full rounded-2xl overflow-hidden border border-[rgba(11,37,89,0.12)] dark:border-[#233550] shadow-sm relative">
        <Map
          mapId="bf51a910020fa25a"
          defaultCenter={coords}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={true}
          style={{ width:"100%", height:"100%" }}
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        >
          <PanToLocation coords={coords} />
          <AdvancedMarker position={coords} title="Your Listing Location">
            <div className="relative -translate-x-1/2 -translate-y-full cursor-pointer flex flex-col items-center">
              {/* Marker Pin */}
              <div className="relative z-10 px-3 py-1.5 rounded-full bg-[#001848] text-white text-xs font-bold shadow-lg ring-2 ring-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-400">
                  home
                </span>
                <span>Listing Location</span>
              </div>
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-[#001848] mx-auto -mt-0.5 z-10" />
            </div>
          </AdvancedMarker>
        </Map>

        {/* Pulsating Radius Graphic Overlay */}
        <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-[#111e33]/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-[#001848] dark:text-white shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#0A6FA8] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0A6FA8]"></span>
          </span>
          <span>20 mi Hospital Discovery Radius</span>
        </div>

        <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-[#111e33]/90 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-bold text-[#001848] dark:text-white shadow-xs">
          📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>
      </div>

      {/* Nearby hospitals are derived from the confirmed property address. */}
      <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
        <div className="text-xs font-bold text-[#001848] dark:text-white mb-2.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#005684] dark:text-[#93ccff]">route</span>
          <span>Nearby hospitals (automatically detected)</span>
        </div>
        {!isConfirmed ? (
          <p className="text-xs text-gray-500">Select and confirm the property address to find hospitals nearby.</p>
        ) : nearbyLoading ? (
          <p className="text-xs text-gray-500">Finding verified hospitals within 20 miles…</p>
        ) : nearbyDistances.length === 0 ? (
          <p className="text-xs text-gray-500">No verified hospitals were found within 20 miles. Your property address is saved independently of hospital availability.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {nearbyDistances.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-white dark:bg-[#111e33] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-col justify-between">
                <div className="text-[11px] font-semibold text-[#001848] dark:text-white">{item.hospital}</div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100 dark:border-[#233550]">
                  <span className="text-[11px] font-bold text-[#195b4c] dark:text-[#aff0db]">{item.distanceMiles} mi</span>
                  <span className="text-[10px] text-gray-500">{item.driveMins > 0 ? "~" + item.driveMins + " min estimated drive" : "Distance estimate"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-Launch Expansion Banner or Active State Confirmation */}
      {currentState && !isValidState ? (
        <div className="mt-4 p-4 rounded-xl bg-[#FBF0D6] dark:bg-[#2a2010] border border-[#B9822E]/30 text-[#8c5d14] dark:text-[#f8d489] text-xs flex items-start gap-3 shadow-xs">
          <span className="material-symbols-outlined text-[20px] text-[#B9822E] shrink-0 mt-0.5">
            hourglass_top
          </span>
          <div className="space-y-1">
            <div className="font-bold text-[#6d460b] dark:text-[#fce5b2] text-[13px] flex items-center gap-2">
              <span>Pre-Launch Expansion Waitlist: {getStateName(currentState)}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B9822E]/20 text-[#6d460b] dark:text-[#fce5b2]">
                Early Access
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#734b12] dark:text-[#f0cb79]">
              Nurses Pillow hasn&apos;t launched in {getStateName(currentState)} yet! You can still complete your listing today to secure priority placement, and we&apos;ll save your home to our Expansion Waitlist until {getStateName(currentState)} officially opens.
            </p>
          </div>
        </div>
      ) : null}

      {/* Confirm Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-gray-500">
          {isConfirmed ? (
            <span className="text-[#195b4c] dark:text-[#aff0db] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                check_circle
              </span>
              {!isValidState
                ? `Address locked! Listing will save to ${getStateName(currentState)} Expansion Waitlist.`
                : "Address and hospital distance tags locked for listing."}
            </span>
          ) : currentState && !isValidState ? (
            <span className="text-[#B9822E] dark:text-[#f8d489] text-[11px] font-medium">
              Confirm location to reserve your priority launch spot in {getStateName(currentState)}.
            </span>
          ) : (
            "Confirm address to generate traveler distance tags"
          )}
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!placeId || !cityState || !addressInput.trim()}
          className={`h-11 px-6 rounded-full text-white text-xs font-bold transition-all duration-200 ease-in-out shadow-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
            !isValidState
              ? "bg-[#B9822E] hover:bg-[#9d6d23] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#B9822E]"
              : "bg-[#005684] hover:bg-[#004266] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#004266]"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {currentState && !isValidState ? "bookmark_add" : "pin_drop"}
          </span>
          <span>
            {currentState && !isValidState ? `Confirm & Save to ${currentState} Waitlist` : "Confirm Property Location"}
          </span>
        </button>
      </div>
    </div>
  );
};
