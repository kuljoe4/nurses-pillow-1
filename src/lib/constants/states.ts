export const ACTIVE_STATES = ['NC', 'MD', 'CT', 'ND', 'KS'] as const;

export type ActiveState = typeof ACTIVE_STATES[number];

export const EXPANSION_STATES = ['FL', 'TX', 'VA', 'CA', 'NY', 'CO'] as const;

export type ExpansionState = typeof EXPANSION_STATES[number];

export const ALL_US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia'
};

export const STATE_NAMES: Record<string, string> = {
  NC: 'North Carolina',
  MD: 'Maryland',
  CT: 'Connecticut',
  ND: 'North Dakota',
  KS: 'Kansas',
  FL: 'Florida',
  TX: 'Texas',
  VA: 'Virginia',
  CA: 'California',
  NY: 'New York',
  CO: 'Colorado',
};

export interface StateMapCenter {
  lat: number;
  lng: number;
  zoom: number;
  hubName: string;
}

export const STATE_COORDINATES: Record<string, StateMapCenter> = {
  AL: { lat: 33.5020, lng: -86.8049, zoom: 11, hubName: 'Birmingham Medical Hub (UAB Medicine)' },
  AK: { lat: 61.1895, lng: -149.8164, zoom: 11, hubName: 'Anchorage Medical Center (Providence Alaska)' },
  AZ: { lat: 33.4503, lng: -112.0673, zoom: 11, hubName: 'Phoenix Medical Corridor (Banner Health, Mayo Clinic)' },
  AR: { lat: 34.7505, lng: -92.3255, zoom: 11, hubName: 'Little Rock Health Hub (UAMS Medical Center)' },
  CA: { lat: 37.7749, lng: -122.4194, zoom: 11, hubName: 'Bay Area Hospital Network (UCSF, Stanford)' },
  CO: { lat: 39.7392, lng: -104.9903, zoom: 11, hubName: 'Denver Metro Medical Network (UCHealth, Denver Health)' },
  CT: { lat: 41.3083, lng: -72.9279, zoom: 12, hubName: 'New Haven Medical Hub (Yale New Haven Health)' },
  DE: { lat: 39.7459, lng: -75.5466, zoom: 11, hubName: 'Wilmington Health Corridor (ChristianaCare)' },
  FL: { lat: 28.5383, lng: -81.3792, zoom: 11, hubName: 'Central Florida Medical Hub (Orlando Health, AdventHealth)' },
  GA: { lat: 33.7925, lng: -84.3218, zoom: 11, hubName: 'Atlanta Medical Hub (Emory Healthcare, Grady Health)' },
  HI: { lat: 21.3069, lng: -157.8583, zoom: 11, hubName: 'Honolulu Medical Hub (The Queens Medical Center)' },
  ID: { lat: 43.6150, lng: -116.2023, zoom: 11, hubName: 'Boise Health Corridor (St. Lukes Regional)' },
  IL: { lat: 41.8781, lng: -87.6298, zoom: 11, hubName: 'Chicago Medical Hub (Northwestern Memorial, Rush)' },
  IN: { lat: 39.7684, lng: -86.1581, zoom: 11, hubName: 'Indianapolis Health Hub (IU Health University Hospital)' },
  IA: { lat: 41.6611, lng: -91.5302, zoom: 11, hubName: 'Iowa City Medical Hub (University of Iowa Hospitals)' },
  KS: { lat: 39.0558, lng: -94.6708, zoom: 11, hubName: 'Kansas City Medical Corridor (KU Medical)' },
  KY: { lat: 38.2527, lng: -85.7585, zoom: 11, hubName: 'Louisville Health Corridor (UofL Health, Norton)' },
  LA: { lat: 29.9511, lng: -90.0715, zoom: 11, hubName: 'New Orleans Health Hub (Ochsner Medical Center)' },
  ME: { lat: 43.6591, lng: -70.2568, zoom: 11, hubName: 'Portland Medical Hub (Maine Medical Center)' },
  MD: { lat: 39.2904, lng: -76.6122, zoom: 11, hubName: 'Baltimore Medical Hub (Johns Hopkins, UM Medical)' },
  MA: { lat: 42.3601, lng: -71.0589, zoom: 11, hubName: 'Boston Medical Hub (Mass General Brigham, BIDMC)' },
  MI: { lat: 42.2808, lng: -83.7430, zoom: 11, hubName: 'Ann Arbor Health Hub (Michigan Medicine)' },
  MN: { lat: 44.0225, lng: -92.4666, zoom: 11, hubName: 'Rochester Medical Corridor (Mayo Clinic)' },
  MS: { lat: 32.2988, lng: -90.1848, zoom: 11, hubName: 'Jackson Medical Hub (UMMC)' },
  MO: { lat: 38.6270, lng: -90.1994, zoom: 11, hubName: 'St. Louis Medical Hub (Barnes-Jewish Hospital)' },
  MT: { lat: 45.7833, lng: -108.5007, zoom: 11, hubName: 'Billings Health Hub (Billings Clinic)' },
  NE: { lat: 41.2565, lng: -95.9345, zoom: 11, hubName: 'Omaha Medical Hub (Nebraska Medicine)' },
  NV: { lat: 36.1699, lng: -115.1398, zoom: 11, hubName: 'Las Vegas Medical Corridor (UMC of Southern Nevada)' },
  NH: { lat: 43.6420, lng: -72.2518, zoom: 11, hubName: 'Dartmouth-Hitchcock Medical Corridor' },
  NJ: { lat: 40.7357, lng: -74.1724, zoom: 11, hubName: 'Newark & Central NJ Health Hub (RWJBarnabas)' },
  NM: { lat: 35.0844, lng: -106.6504, zoom: 11, hubName: 'Albuquerque Medical Hub (UNM Hospital)' },
  NY: { lat: 40.7128, lng: -74.0060, zoom: 11, hubName: 'New York Metro Medical Network (NYU Langone, Columbia)' },
  NC: { lat: 35.9940, lng: -78.8986, zoom: 11, hubName: 'Triangle Medical Hub (Duke, UNC, WakeMed)' },
  ND: { lat: 46.8772, lng: -96.7898, zoom: 12, hubName: 'Fargo Medical Hub (Sanford Medical Center)' },
  OH: { lat: 41.4993, lng: -81.6944, zoom: 11, hubName: 'Cleveland Medical Hub (Cleveland Clinic, MetroHealth)' },
  OK: { lat: 35.4676, lng: -97.5164, zoom: 11, hubName: 'Oklahoma City Medical Hub (OU Health)' },
  OR: { lat: 45.5152, lng: -122.6784, zoom: 11, hubName: 'Portland Health Hub (OHSU Hospital, Legacy Health)' },
  PA: { lat: 39.9526, lng: -75.1652, zoom: 11, hubName: 'Philadelphia Medical Corridor (Penn Medicine, Jefferson)' },
  RI: { lat: 41.8240, lng: -71.4128, zoom: 11, hubName: 'Providence Medical Hub (Rhode Island Hospital)' },
  SC: { lat: 32.7765, lng: -79.9311, zoom: 11, hubName: 'Charleston Medical Hub (MUSC Health)' },
  SD: { lat: 43.5460, lng: -96.7313, zoom: 11, hubName: 'Sioux Falls Health Hub (Sanford USD Medical)' },
  TN: { lat: 36.1627, lng: -86.7816, zoom: 11, hubName: 'Nashville Medical Hub (Vanderbilt University Medical Center)' },
  TX: { lat: 30.2672, lng: -97.7431, zoom: 11, hubName: 'Texas Medical Center Corridor (Austin, Houston)' },
  UT: { lat: 40.7608, lng: -111.8910, zoom: 11, hubName: 'Salt Lake City Health Hub (University of Utah Hospital)' },
  VT: { lat: 44.4759, lng: -73.2121, zoom: 11, hubName: 'Burlington Medical Hub (UVM Medical Center)' },
  VA: { lat: 37.5407, lng: -77.4360, zoom: 11, hubName: 'Richmond Medical Corridor (VCU Medical, Inova)' },
  WA: { lat: 47.6062, lng: -122.3321, zoom: 11, hubName: 'Seattle Medical Hub (UW Medicine, Swedish)' },
  WV: { lat: 39.6295, lng: -79.9559, zoom: 11, hubName: 'Morgantown Medical Hub (WVU Medicine)' },
  WI: { lat: 43.0389, lng: -87.9065, zoom: 11, hubName: 'Milwaukee & Madison Health Hub (UW Health, Froedtert)' },
  WY: { lat: 41.1400, lng: -104.8202, zoom: 11, hubName: 'Cheyenne Health Corridor (Cheyenne Regional)' },
  DC: { lat: 38.9072, lng: -77.0369, zoom: 11, hubName: 'Washington DC Health Hub (MedStar Washington, GW Hospital)' },
};

export function isStateActive(stateCode: string, dynamicActiveList?: string[]): boolean {
  if (dynamicActiveList && dynamicActiveList.length > 0) {
    return dynamicActiveList.includes(stateCode.toUpperCase());
  }
  return (ACTIVE_STATES as readonly string[]).includes(stateCode.toUpperCase());
}

export function getStateName(stateCode: string): string {
  const upper = stateCode.toUpperCase();
  return ALL_US_STATES[upper] || STATE_NAMES[upper] || upper;
}

export function getStateCoordinates(stateCode: string): StateMapCenter {
  const upper = stateCode.toUpperCase();
  return STATE_COORDINATES[upper] || { lat: 39.8283, lng: -98.5795, zoom: 4, hubName: 'National Overview' };
}
