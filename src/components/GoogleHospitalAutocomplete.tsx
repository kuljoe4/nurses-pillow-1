// Source: Google Maps Platform Code Assist - Places API (New)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { db } from '../services/database';

export interface SelectedHospitalInfo {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  system?: string;
  state?: string;
}

interface GoogleHospitalAutocompleteProps {
  value: string;
  onChange: (hospitalName: string) => void;
  onSelectHospital?: (hospital: SelectedHospitalInfo) => void;
  placeholder?: string;
  isNightShiftMode?: boolean;
}

export const GoogleHospitalAutocomplete: React.FC<GoogleHospitalAutocompleteProps> = ({
  value,
  onChange,
  onSelectHospital,
  placeholder = 'Search hospital or medical center...',
  isNightShiftMode,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [placesSuggestions, setPlacesSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [curatedHospitals, setCuratedHospitals] = useState<SelectedHospitalInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modern Places Library (Places API (New))
  const placesLibrary = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    Promise.resolve(db.getHospitals()).then((data: any[]) => {
        if (data && data.length > 0) {
          const fetched = data.map(h => ({
            name: h.name,
            address: `${h.address || ''}, ${h.city || ''}, ${h.state || ''} ${h.zip || ''}`.trim().replace(/^,|,$/g, ''),
            lat: h.latitude,
            lng: h.longitude,
            system: h.health_system,
            state: h.state,
          }));
          setCuratedHospitals(fetched);
        }
      })
      .catch(console.error);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter curated hospitals based on user input
  const filteredCurated = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return curatedHospitals.slice(0, 6);
    }
    return curatedHospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query) ||
        (h.system && h.system.toLowerCase().includes(query))
    );
  }, [inputValue, curatedHospitals]);

  // Handle typing: use Places API (New) AutocompleteSuggestion if available
  const handleInputChange = (text: string) => {
    setInputValue(text);
    onChange(text);
    setIsOpen(true);

    const trimmed = text.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (trimmed.length > 2 && placesLibrary?.AutocompleteSuggestion) {
      setIsSearching(true);

      debounceTimerRef.current = setTimeout(() => {
        // Initialize session token for Places API (New) if needed
        if (!sessionTokenRef.current && placesLibrary.AutocompleteSessionToken) {
          sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
        }

        const request: google.maps.places.AutocompleteRequest = {
          input: trimmed,
          sessionToken: sessionTokenRef.current ?? undefined,
          includedRegionCodes: ['us'], // Modern Places API property
        };

        placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
          .then((res) => {
            if (res?.suggestions) {
              setPlacesSuggestions(res.suggestions);
            } else {
              setPlacesSuggestions([]);
            }
          })
          .catch((err) => {
            // Graceful fallback to curated directory on any API error
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

  // User selects a curated hospital
  const handleSelectCurated = (hosp: SelectedHospitalInfo) => {
    setInputValue(hosp.name);
    onChange(hosp.name);
    setIsOpen(false);
    onSelectHospital?.(hosp);
  };

  // User selects a Places API (New) suggestion
  const handleSelectPlacesSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    const name = prediction.mainText?.text || prediction.text?.text || '';
    const address = prediction.secondaryText?.text || prediction.text?.text || '';

    setInputValue(name);
    onChange(name);
    setIsOpen(false);

    try {
      // Use modern Places API (New) Place.fetchFields()
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
      });

      const lat = place.location ? place.location.lat() : undefined;
      const lng = place.location ? place.location.lng() : undefined;

      let parsedState: string | undefined = undefined;
      if (place.addressComponents) {
        for (const component of place.addressComponents) {
          if (component.types.includes('administrative_area_level_1')) {
            parsedState = component.shortText || undefined;
            break;
          }
        }
      }

      onSelectHospital?.({
        name: place.displayName || name,
        address: place.formattedAddress || address,
        lat,
        lng,
        state: parsedState,
      });
    } catch {
      onSelectHospital?.({ name, address });
    } finally {
      // Session concludes after place resolution
      sessionTokenRef.current = null;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#0A6FA8] dark:text-[#3E9AD1] pointer-events-none text-[22px]">
          local_hospital
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-14 pl-12 pr-28 rounded-xl bg-[#EFF6FB] hover:bg-[#E5F0F8] dark:bg-[#182840] dark:hover:bg-[#1f3350] text-[#0B2559] dark:text-white text-sm sm:text-base font-semibold border border-[rgba(11,37,89,0.1)] dark:border-[#2b4162] focus:outline-none focus:ring-2 focus:ring-[#0A6FA8] transition-colors"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isSearching && (
            <div className="w-4 h-4 border border-[#0A6FA8]/20 border-t-[#0A6FA8] rounded-full animate-spin mr-1" />
          )}
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#195b4c]/30 dark:text-[#aff0db] text-[11px] font-bold">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            Verified Directory
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-colors cursor-pointer text-[#0B2559]/70 dark:text-[#E6ECF7]/70"
            aria-label="Toggle hospital search options"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#15233a] rounded-2xl shadow-lg z-50 border border-[rgba(11,37,89,0.12)] dark:border-[#2b4162] overflow-hidden flex flex-col max-h-96">
          {/* Quick preset chips */}
          {curatedHospitals.length > 0 && (
            <div className="p-3 bg-[#EFF6FB]/60 dark:bg-[#111e33] border-b border-[rgba(11,37,89,0.08)] dark:border-[#2b4162]">
              <div className="text-[10px] font-bold text-[#0B2559]/60 dark:text-[#9CB3D3] uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-[#0A6FA8]">stars</span>
                <span>Featured Medical Centers</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {curatedHospitals.slice(0, 5).map((h) => (
                  <button
                  key={h.name}
                  type="button"
                  onClick={() => handleSelectCurated(h)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-[#182840] border border-[rgba(11,37,89,0.1)] dark:border-[#2b4162] text-[#0B2559] dark:text-white hover:bg-[#0A6FA8] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] hover:text-white dark:hover:bg-[#0A6FA8] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] transition-colors cursor-pointer"
                >
                  {h.name.replace(' Hospital', '').replace(' Medical Center', '')}
                </button>
                ))}
              </div>
            </div>
          )}

          {/* List of results */}
          <div className="overflow-y-auto overscroll-contain py-1">
            {/* Live Places API (New) suggestions if available */}
            {placesSuggestions.length > 0 && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
                Verified Hospital Directory
              </div>
            )}
            {placesSuggestions.map((suggestion, idx) => {
              const mainText = suggestion.placePrediction?.mainText?.text || suggestion.placePrediction?.text?.text || '';
              const secondaryText = suggestion.placePrediction?.secondaryText?.text || '';
              return (
                <div
                  key={`places-${idx}`}
                  onClick={() => handleSelectPlacesSuggestion(suggestion)}
                  className="px-4 py-2.5 hover:bg-[#EFF6FB] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#EFF6FB] dark:hover:bg-[#1f3350] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1f3350] cursor-pointer flex items-center justify-between transition-colors border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                >
                  <div className="flex items-center gap-2.5 pr-2">
                    <span className="material-symbols-outlined text-[#0A6FA8] dark:text-[#3E9AD1] text-[18px] shrink-0">
                      local_hospital
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-[#0B2559] dark:text-white">
                        {mainText}
                      </div>
                      {secondaryText && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {secondaryText}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#195b4c]/30 dark:text-[#aff0db] text-[10px] font-bold shrink-0">
                    Live
                  </span>
                </div>
              );
            })}

            {/* Curated Verified Hospital Matches */}
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#0B2559]/60 dark:text-[#9CB3D3]">
              Verified Hospital Registry
            </div>
            {filteredCurated.length === 0 && placesSuggestions.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                No hospitals match "{inputValue}". Select from the list above or try another name.
              </div>
            ) : (
              filteredCurated.map((hosp) => (
                <div
                  key={hosp.name}
                  onClick={() => handleSelectCurated(hosp)}
                  className={`px-4 py-2.5 hover:bg-[#EFF6FB] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#EFF6FB] dark:hover:bg-[#1f3350] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1f3350] cursor-pointer flex items-center justify-between transition-colors ${
                    inputValue === hosp.name ? 'bg-[#EFF6FB] dark:bg-[#1f3350]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 pr-2">
                    <span className="material-symbols-outlined text-[#0A6FA8] dark:text-[#3E9AD1] text-[18px] shrink-0">
                      local_hospital
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-[#0B2559] dark:text-white">
                        {hosp.name}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {hosp.address} {hosp.system ? `• ${hosp.system}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#2F6E5E] dark:text-[#aff0db] text-[16px] shrink-0">
                    verified
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-[#EFF6FB]/50 dark:bg-[#111e33] border-t border-[rgba(11,37,89,0.08)] dark:border-[#2b4162] flex items-center justify-between text-[11px] text-[#0B2559]/70 dark:text-[#9CB3D3]">
            <span>Hospital Directory Connected</span>
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[13px] text-[#2F6E5E]">check_circle</span>
              Clinical Anchor
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
