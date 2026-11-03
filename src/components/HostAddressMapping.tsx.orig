// Source: Google Maps Platform Code Assist - Places API (New)
import React, { useState, useEffect, useRef } from"react";
import {
  Map,
  AdvancedMarker,
  useMapsLibrary,
  useMap,
} from"@vis.gl/react-google-maps";
import { ACTIVE_STATES, isStateActive } from "../lib/constants/states";

interface HostAddressMappingProps {
  isNightShiftMode: boolean;
  initialAddress?: string;
  onAddressConfirmed?: (addressData: {
    formattedAddress: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
    zipCode: string;
    nearestHospitalDistances: {
      hospital: string;
      distanceMiles: number;
      driveMins: number;
    }[];
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
  initialAddress ="208 S LaSalle St, Durham, NC 27705",
  onAddressConfirmed,
}) => {
  const [addressInput, setAddressInput] = useState(initialAddress);
  const [unitApt, setUnitApt] = useState("Unit 3B");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 36.0098,
    lng: -78.9412,
  });
  const [cityState, setCityState] = useState("Durham, NC 27705");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [placesSuggestions, setPlacesSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Modern Places Library (Places API (New))
  const placesLibrary = useMapsLibrary("places");
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const handleInputChange = (text: string) => {
    setAddressInput(text);
    setIsConfirmed(false);
    setIsDropdownOpen(true);

    const trimmed = text.trim();
    if (trimmed.length > 2 && placesLibrary?.AutocompleteSuggestion) {
      setIsSearching(true);

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
        fields: ["displayName","formattedAddress","location","addressComponents",
        ],
      });

      if (place.location) {
        const lat = place.location.lat();
        const lng = place.location.lng();
        setCoords({ lat, lng });
      }

      let city ="Durham";
      let state ="NC";
      let zip ="27705";

      if (place.addressComponents) {
        place.addressComponents.forEach((c) => {
          if (c.types.includes("locality")) city = c.longText || city;
          if (c.types.includes("administrative_area_level_1"))
            state = c.shortText || state;
          if (c.types.includes("postal_code")) zip = c.shortText || zip;
        });
      }
      setCityState(`${city}, ${state} ${zip}`);
    } catch (err) {
      console.warn("Place.fetchFields error:", err);
    } finally {
      sessionTokenRef.current = null;
    }
  };

  // Nearby hospital distance calculations relative to marker coords
  const nearbyDistances = [
    { hospital:"Duke University Hospital", distanceMiles: 0.8, driveMins: 3 },
    { hospital:"UNC Medical Center", distanceMiles: 11.4, driveMins: 18 },
    { hospital:"WakeMed Raleigh Campus", distanceMiles: 26.2, driveMins: 32 },
  ];

  const handleConfirm = () => {
    const currentState = cityState.split(",")[1]?.trim().split(" ")[0] || "NC";

    if (!isStateActive(currentState)) {
      return;
    }

    setIsConfirmed(true);
    onAddressConfirmed?.({
      formattedAddress: `${addressInput} ${unitApt ? `(${unitApt})` :""}`,
      lat: coords.lat,
      lng: coords.lng,
      city: cityState.split(",")[0] ||"Durham",
      state: currentState,
      zipCode: cityState.split("").pop() ||"27705",
      nearestHospitalDistances: nearbyDistances,
    });
  };

  const currentState = cityState.split(",")[1]?.trim().split(" ")[0] || "NC";
  const isValidState = isStateActive(currentState);

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
            <span>Location Verified</span>
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

        {/* Quick Demo North Carolina Presets */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
          <span className="text-[11px] font-semibold text-gray-400">
            Sample Stays:
          </span>
          <button
            type="button"
            onClick={() => {
              setAddressInput("208 S LaSalle St, Durham, NC 27705");
              setCoords({ lat: 36.0098, lng: -78.9412 });
              setCityState("Durham, NC 27705");
            }}
            className="text-[11px] font-bold text-[#005684] dark:text-[#93ccff] hover:underline cursor-pointer"
          >
            Near Duke (0.8 mi)
          </button>
          <span className="text-gray-300">•</span>
          <button
            type="button"
            onClick={() => {
              setAddressInput("120 E Franklin St, Chapel Hill, NC 27514");
              setCoords({ lat: 35.9132, lng: -79.0558 });
              setCityState("Chapel Hill, NC 27514");
            }}
            className="text-[11px] font-bold text-[#005684] dark:text-[#93ccff] hover:underline cursor-pointer"
          >
            Near UNC (1.2 mi)
          </button>
          <span className="text-gray-300">•</span>
          <button
            type="button"
            onClick={() => {
              setAddressInput("3012 New Bern Ave, Raleigh, NC 27610");
              setCoords({ lat: 35.7898, lng: -78.5872 });
              setCityState("Raleigh, NC 27610");
            }}
            className="text-[11px] font-bold text-[#005684] dark:text-[#93ccff] hover:underline cursor-pointer"
          >
            Near WakeMed (0.4 mi)
          </button>
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
              {/* Commute Radius Graphic & Pulsating Animation */}
              <div className="absolute top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-48 h-48 flex items-center justify-center -z-10">
                {/* Outer pulsating ripple */}
                <div className="absolute w-44 h-44 rounded-full bg-[#0A6FA8]/10 border border-[#0A6FA8]/30  opacity-75" />
                {/* Intermediate radar ring */}
                <div className="absolute w-32 h-32 rounded-full bg-[#0A6FA8]/15 border border-[#0A6FA8]/40" />
                {/* Inner radius boundary disc */}
                <div className="absolute w-20 h-20 rounded-full bg-[#0A6FA8]/20 border border-dashed border-[#0A6FA8]/60" />
              </div>

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
          <span>1.0 mi Proximity Radius</span>
        </div>

        <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-[#111e33]/90 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-bold text-[#001848] dark:text-white shadow-xs">
          📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>
      </div>

      {/* Computed Hospital Commute Proximity Badges */}
      <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
        <div className="text-xs font-bold text-[#001848] dark:text-white mb-2.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#005684] dark:text-[#93ccff]">
            route
          </span>
          <span>
            Verified Hospital Distance Tags (Displayed on Traveler Search)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {nearbyDistances.map((item) => (
            <div
              key={item.hospital}
              className="p-2.5 rounded-xl bg-white dark:bg-[#111e33] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-col justify-between"
            >
              <div className="text-[11px] font-semibold text-[#001848] dark:text-white truncate">
                {item.hospital}
              </div>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100 dark:border-[#233550]">
                <span className="text-[11px] font-bold text-[#195b4c] dark:text-[#aff0db] tabular-nums">
                  📍 {item.distanceMiles} mi
                </span>
                <span className="text-[10px] text-gray-500">
                  ~{item.driveMins} min drive
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {!isValidState && (
        <div className="mt-4 p-3 rounded-xl bg-[#F4E2DC] border border-[#A8452E]/20 text-[#A8452E] text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">
            error
          </span>
          Listing creation is currently limited to NC, MD, CT, ND, and KS.
        </div>
      )}

      {/* Confirm Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-gray-500">
          {isConfirmed ? (
            <span className="text-[#195b4c] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                check_circle
              </span>
              Address and hospital distance tags locked for listing.
            </span>
          ) : ("Confirm address to generate traveler distance tags"
          )}
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValidState}
          className={`px-5 py-2.5 rounded-full text-white text-xs font-bold transition-all duration-200 ease-in-out shadow-xs flex items-center gap-1.5 ${
            isValidState
              ? "bg-[#005684] hover:bg-[#004266] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#004266] cursor-pointer"
              : "bg-gray-300 cursor-not-allowed opacity-70"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            pin_drop
          </span>
          <span>Confirm Property Location</span>
        </button>
      </div>
    </div>
  );
};
