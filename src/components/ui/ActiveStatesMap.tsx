import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { ACTIVE_STATES } from '../../lib/constants/states';

const geoUrl = '/states-10m.json';

// Utility to convert FIPS codes to State abbreviations
const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY"
};

const ACTIVE_HUBS: { code: string; name: string; hub: string; coordinates: [number, number] }[] = [
  { code: 'NC', name: 'North Carolina', hub: 'Duke & UNC Health Systems', coordinates: [-79.4, 35.6] },
  { code: 'MD', name: 'Maryland', hub: 'Johns Hopkins & UM Medical Center', coordinates: [-76.7, 39.1] },
  { code: 'CT', name: 'Connecticut', hub: 'Yale New Haven & Hartford Hospital', coordinates: [-72.7, 41.6] },
  { code: 'ND', name: 'North Dakota', hub: 'Sanford Health & Essentia Hub', coordinates: [-100.5, 47.5] },
  { code: 'KS', name: 'Kansas', hub: 'KU Medical Center & Stormont', coordinates: [-98.4, 38.5] },
];

export const ActiveStatesMap: React.FC<{
  className?: string;
  isNightShiftMode?: boolean;
  onSelectState?: (code: string) => void;
}> = ({ className = '', isNightShiftMode = false, onSelectState }) => {
  const [hoveredState, setHoveredState] = useState<{ code: string; name: string; hub: string } | null>(null);

  return (
    <div
      className={`relative w-full rounded-2xl border p-3 flex flex-col justify-between overflow-hidden transition-all ${
        isNightShiftMode
          ? 'bg-[#0B1626] border-[#233550] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
          : 'bg-[#EFF6FB]/60 border-[rgba(11,37,89,0.08)] shadow-[0_2px_12px_rgba(11,37,89,0.04)]'
      } ${className}`}
    >
      {/* Mini Header / Active Hub Indicator */}
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[11px] font-bold text-[#0B2559] dark:text-white">
            {hoveredState ? `${hoveredState.name} (${hoveredState.code})` : 'Active Market Coverage'}
          </span>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#0f766e] dark:text-[#aff0db]">
          {hoveredState ? hoveredState.hub : '5 Cleared States'}
        </span>
      </div>

      {/* Interactive Map */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: "100%", height: "100%", maxHeight: "190px" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) => (
              <>
                {geographies.map((geo) => {
                  const stateId = geo.id as string;
                  const stateAbbr = FIPS_TO_STATE[stateId];
                  const isActive = ACTIVE_STATES.includes(stateAbbr as any);
                  const isHovered = hoveredState?.code === stateAbbr;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={
                        isActive
                          ? isHovered
                            ? (isNightShiftMode ? '#5bb5ec' : '#0C7EBF')
                            : (isNightShiftMode ? '#3E9AD1' : '#0A6FA8')
                          : (isNightShiftMode ? '#162338' : '#DCE6F2')
                      }
                      stroke={isNightShiftMode ? '#233550' : '#ffffff'}
                      strokeWidth={isActive ? 1.2 : 0.6}
                      onMouseEnter={() => {
                        const hub = ACTIVE_HUBS.find(h => h.code === stateAbbr);
                        if (hub) setHoveredState(hub);
                      }}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => {
                        if (isActive && onSelectState) onSelectState(stateAbbr);
                      }}
                      style={{
                        default: { outline: 'none', transition: 'fill 200ms ease' },
                        hover: {
                          fill: isActive
                            ? (isNightShiftMode ? '#5bb5ec' : '#0C7EBF')
                            : (isNightShiftMode ? '#1e304c' : '#ccd9e8'),
                          outline: 'none',
                          cursor: isActive ? 'pointer' : 'default',
                        },
                        pressed: { outline: 'none' },
                      } as any}
                    >
                      <title>{geo.properties?.name}</title>
                    </Geography>
                  );
                })}
              </>
            )}
          </Geographies>

          {/* Glowing Beacon Markers for Active Medical Hubs */}
          {ACTIVE_HUBS.map((hub) => (
            <Marker
              key={hub.code}
              coordinates={hub.coordinates}
              onMouseEnter={() => setHoveredState(hub)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => onSelectState?.(hub.code)}
            >
              <g className="cursor-pointer">
                {/* Radar Pulse Ring */}
                <circle r={8} fill={isNightShiftMode ? '#10B981' : '#0A6FA8'} opacity={0.25} className="animate-ping" />
                {/* Center Core Dot */}
                <circle r={4} fill={isNightShiftMode ? '#34D399' : '#0A6FA8'} stroke="#ffffff" strokeWidth={1.5} />
                {/* State Tag */}
                <text
                  textAnchor="middle"
                  y={-7}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '8px',
                    fontWeight: 800,
                    fill: isNightShiftMode ? '#E6ECF7' : '#0B2559',
                    pointerEvents: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  {hub.code}
                </text>
              </g>
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {/* Mini Legend Footer */}
      <div className="pt-1 mt-1 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0A6FA8] dark:bg-[#3E9AD1]" />
          <span>Live Clinical Hub</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
          <span>Expansion Stage</span>
        </div>
      </div>
    </div>
  );
};
