// Nurses Pillow - Seed Data & Core Facility/Listing Models
// Isolated from database service to eliminate circular ESM imports

export interface DbHospital {
  id: string;
  name: string;
  health_system: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  trauma_level: string;
  teaching_hospital: boolean;
  shift_types: string[];
  parking_type: string;
  nurse_feedback_score: number;
}

export interface DbListingRoom {
  id: string;
  listing_id: string;
  room_name: string;
  bed_type: 'King' | 'Queen' | 'Double' | 'Twin XL';
  private_bath: boolean;
  dedicated_workspace: boolean;
  blackout_curtains: boolean;
  white_noise_machine: boolean;
  monthly_rate_override?: number;
  is_available: boolean;
}

export interface DbPricingCalendar {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  monthly_rate: number;
  minimum_stay_weeks: number;
  is_available: boolean;
  notes?: string;
}

export interface DbListing {
  id: string;
  host_id: string;
  title: string;
  property_type: string;
  cancellation_tier: 'flexible_30d' | 'moderate_60d' | 'strict_90d';
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  nearest_hospital_id: string;
  monthly_rate: number;
  security_deposit: number;
  cleaning_fee: number;
  is_active: boolean;
  rooms: DbListingRoom[];
  pricing_calendar: DbPricingCalendar[];
}

export const NC_HOSPITAL_SEEDS: DbHospital[] = [
  {
    id: 'h-johns-hopkins',
    name: 'Johns Hopkins Hospital',
    health_system: 'Johns Hopkins Medicine',
    address: '1800 Orleans St',
    city: 'Baltimore',
    state: 'MD',
    zip: '21287',
    latitude: 39.2973,
    longitude: -76.5916,
    trauma_level: 'Level I Adult & Pediatric Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', '12h Rotating'],
    parking_type: 'On-site Garage / Shuttle',
    nurse_feedback_score: 95,
  },
  {
    id: 'h-yale-new-haven',
    name: 'Yale New Haven Hospital',
    health_system: 'Yale New Haven Health',
    address: '20 York St',
    city: 'New Haven',
    state: 'CT',
    zip: '06510',
    latitude: 41.3039,
    longitude: -72.9360,
    trauma_level: 'Level I Adult Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', '12h Rotating'],
    parking_type: 'Air Rights Garage',
    nurse_feedback_score: 93,
  },
  {
    id: 'h-sanford-fargo',
    name: 'Sanford Medical Center',
    health_system: 'Sanford Health',
    address: '5225 23rd Ave S',
    city: 'Fargo',
    state: 'ND',
    zip: '58104',
    latitude: 46.8329,
    longitude: -96.8624,
    trauma_level: 'Level I Adult Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night'],
    parking_type: 'Free On-site Surface Lot',
    nurse_feedback_score: 94,
  },
  {
    id: 'h-ku-med',
    name: 'University of Kansas Medical Center',
    health_system: 'The University of Kansas Health System',
    address: '3901 Rainbow Blvd',
    city: 'Kansas City',
    state: 'KS',
    zip: '66160',
    latitude: 39.0560,
    longitude: -94.6105,
    trauma_level: 'Level I Adult Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', '12h Rotating'],
    parking_type: 'Olathe II Parking Deck',
    nurse_feedback_score: 92,
  },
  {
    id: 'h-duke',
    name: 'Duke University Hospital',
    health_system: 'Duke Health',
    address: '2301 Erwin Rd',
    city: 'Durham',
    state: 'NC',
    zip: '27710',
    latitude: 36.0076,
    longitude: -78.9382,
    trauma_level: 'Level I Adult & Pediatric Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', '12h Rotating ICU'],
    parking_type: 'Erwin Rd Dedicated Clinical Garage / Free Express Shuttle',
    nurse_feedback_score: 99,
  },
  {
    id: 'h-unc',
    name: 'UNC Medical Center',
    health_system: 'UNC Health',
    address: '101 Manning Dr',
    city: 'Chapel Hill',
    state: 'NC',
    zip: '27514',
    latitude: 35.9049,
    longitude: -79.0526,
    trauma_level: 'Level I Adult Trauma & Comprehensive Burn Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', 'Variable Shifts'],
    parking_type: 'Dogwood Deck Reserved Nurse Permit & Tar Heel Express',
    nurse_feedback_score: 98,
  },
  {
    id: 'h-wakemed',
    name: 'WakeMed Raleigh Campus',
    health_system: 'WakeMed Health & Hospitals',
    address: '3000 New Bern Ave',
    city: 'Raleigh',
    state: 'NC',
    zip: '27610',
    latitude: 35.7892,
    longitude: -78.5886,
    trauma_level: 'Level I Trauma & Regional Children’s Emergency',
    teaching_hospital: true,
    shift_types: ['12-hr Day', '12-hr Night Rotations'],
    parking_type: 'New Bern Staff Deck w/ 24/7 Security Escort',
    nurse_feedback_score: 97,
  },
  {
    id: 'h-atrium',
    name: 'Atrium Health Carolinas Medical Center',
    health_system: 'Advocate Health',
    address: '1000 Blythe Blvd',
    city: 'Charlotte',
    state: 'NC',
    zip: '28203',
    latitude: 35.2036,
    longitude: -80.8385,
    trauma_level: 'Level I Regional Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', '36h Weekly Guaranteed'],
    parking_type: 'Medical Center Plaza Deck (Nurse Badged Access)',
    nurse_feedback_score: 96,
  },
  {
    id: 'h-ecu',
    name: 'ECU Health Medical Center',
    health_system: 'ECU Health',
    address: '2100 Stantonsburg Rd',
    city: 'Greenville',
    state: 'NC',
    zip: '27834',
    latitude: 35.6074,
    longitude: -77.4048,
    trauma_level: 'Level I Regional Trauma Center',
    teaching_hospital: true,
    shift_types: ['12-hr Rotating ICU / Med-Surg'],
    parking_type: 'Employee Deck A with 5-minute Bedside Transit',
    nurse_feedback_score: 95,
  },
  {
    id: 'h-hopkins',
    name: 'The Johns Hopkins Hospital',
    health_system: 'Johns Hopkins Medicine',
    address: '1800 Orleans St',
    city: 'Baltimore',
    state: 'MD',
    zip: '21287',
    latitude: 39.2974,
    longitude: -76.5925,
    trauma_level: 'Level I Adult & Pediatric Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', '12h Rotating Shifts'],
    parking_type: 'Orleans St Garage Nurse Direct Link',
    nurse_feedback_score: 99,
  },
  {
    id: 'h-ummc',
    name: 'University of Maryland Medical Center',
    health_system: 'University of Maryland Medical System',
    address: '22 S Greene St',
    city: 'Baltimore',
    state: 'MD',
    zip: '21201',
    latitude: 39.2882,
    longitude: -76.6239,
    trauma_level: 'R Adams Cowley Shock Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', 'Shock Trauma Rotations'],
    parking_type: 'Pratt St Garage w/ Guard Escort',
    nurse_feedback_score: 98,
  },
  {
    id: 'h-yale',
    name: 'Yale New Haven Hospital',
    health_system: 'Yale New Haven Health',
    address: '20 York St',
    city: 'New Haven',
    state: 'CT',
    zip: '06510',
    latitude: 41.3042,
    longitude: -72.9358,
    trauma_level: 'Level I Adult & Pediatric Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night', 'Variable Unit Rotations'],
    parking_type: 'Air Rights Garage & Clinician Shuttle',
    nurse_feedback_score: 97,
  },
  {
    id: 'h-hartford',
    name: 'Hartford Hospital',
    health_system: 'Hartford HealthCare',
    address: '80 Seymour St',
    city: 'Hartford',
    state: 'CT',
    zip: '06102',
    latitude: 41.7533,
    longitude: -72.6784,
    trauma_level: 'Level I Regional Trauma Center',
    teaching_hospital: true,
    shift_types: ['7a-7p Day', '7p-7a Night'],
    parking_type: 'Jefferson St Staff Garage',
    nurse_feedback_score: 96,
  },
  {
    id: 'h-sanford-nd',
    name: 'Sanford Medical Center Fargo',
    health_system: 'Sanford Health',
    address: '5225 23rd Ave S',
    city: 'Fargo',
    state: 'ND',
    zip: '58104',
    latitude: 46.8456,
    longitude: -96.8698,
    trauma_level: 'Level I Adult Trauma Center',
    teaching_hospital: true,
    shift_types: ['12-hr Day/Night Rotations'],
    parking_type: 'Heated Staff Parking & Plug-in Stalls',
    nurse_feedback_score: 98,
  },
];

export const NC_LISTING_SEEDS: DbListing[] = [
  {
    id: 'md-hopkins-apt1',
    host_id: 'host-sarah-m',
    title: 'Fells Point Historic Studio',
    property_type: 'Entire Apartment',
    cancellation_tier: 'strict_90d',
    address: '1700 Thames St',
    city: 'Baltimore',
    state: 'MD',
    zip: '21231',
    latitude: 39.2816,
    longitude: -76.5910,
    nearest_hospital_id: 'h-johns-hopkins',
    monthly_rate: 1850,
    security_deposit: 300,
    cleaning_fee: 150,
    is_active: true,
    rooms: [
      { id: 'md-hopkins-room1', listing_id: 'md-hopkins-apt1', room_name: 'Primary Bedroom', bed_type: 'Queen', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'md-hopkins-apt2',
    host_id: 'host-karen-b',
    title: 'Canton Rowhome Basement Suite',
    property_type: 'Private Room',
    cancellation_tier: 'flexible_30d',
    address: '2800 O Donnell St',
    city: 'Baltimore',
    state: 'MD',
    zip: '21224',
    latitude: 39.2804,
    longitude: -76.5777,
    nearest_hospital_id: 'h-johns-hopkins',
    monthly_rate: 1200,
    security_deposit: 150,
    cleaning_fee: 100,
    is_active: true,
    rooms: [
      { id: 'md-hopkins-room2', listing_id: 'md-hopkins-apt2', room_name: 'Primary Bedroom', bed_type: 'Double', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'ct-yale-apt1',
    host_id: 'host-james-l',
    title: 'Downtown NHV Loft',
    property_type: 'Entire Loft',
    cancellation_tier: 'strict_90d',
    address: '900 Chapel St',
    city: 'New Haven',
    state: 'CT',
    zip: '06510',
    latitude: 41.3056,
    longitude: -72.9264,
    nearest_hospital_id: 'h-yale-new-haven',
    monthly_rate: 2400,
    security_deposit: 500,
    cleaning_fee: 200,
    is_active: true,
    rooms: [
      { id: 'ct-yale-room1', listing_id: 'ct-yale-apt1', room_name: 'Primary Bedroom', bed_type: 'King', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'ct-yale-apt2',
    host_id: 'host-sarah-m',
    title: 'East Rock Quiet Floor',
    property_type: 'Entire Apartment',
    cancellation_tier: 'flexible_30d',
    address: '500 Orange St',
    city: 'New Haven',
    state: 'CT',
    zip: '06511',
    latitude: 41.3142,
    longitude: -72.9168,
    nearest_hospital_id: 'h-yale-new-haven',
    monthly_rate: 1900,
    security_deposit: 250,
    cleaning_fee: 150,
    is_active: true,
    rooms: [
      { id: 'ct-yale-room2', listing_id: 'ct-yale-apt2', room_name: 'Primary Bedroom', bed_type: 'Queen', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'nd-sanford-apt1',
    host_id: 'host-karen-b',
    title: 'South Fargo Modern Condo',
    property_type: 'Entire Condo',
    cancellation_tier: 'flexible_30d',
    address: '4500 32nd Ave S',
    city: 'Fargo',
    state: 'ND',
    zip: '58104',
    latitude: 46.8183,
    longitude: -96.8524,
    nearest_hospital_id: 'h-sanford-fargo',
    monthly_rate: 1500,
    security_deposit: 200,
    cleaning_fee: 125,
    is_active: true,
    rooms: [
      { id: 'nd-sanford-room1', listing_id: 'nd-sanford-apt1', room_name: 'Primary Bedroom', bed_type: 'Queen', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'nd-sanford-apt2',
    host_id: 'host-james-l',
    title: 'Osgood Neighborhood Home',
    property_type: 'Private Room',
    cancellation_tier: 'strict_90d',
    address: '4200 45th St S',
    city: 'Fargo',
    state: 'ND',
    zip: '58104',
    latitude: 46.8049,
    longitude: -96.8601,
    nearest_hospital_id: 'h-sanford-fargo',
    monthly_rate: 800,
    security_deposit: 100,
    cleaning_fee: 75,
    is_active: true,
    rooms: [
      { id: 'nd-sanford-room2', listing_id: 'nd-sanford-apt2', room_name: 'Primary Bedroom', bed_type: 'Double', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'ks-kumed-apt1',
    host_id: 'host-sarah-m',
    title: 'Rosedale Ridge Apartment',
    property_type: 'Entire Apartment',
    cancellation_tier: 'flexible_30d',
    address: '4400 State Line Rd',
    city: 'Kansas City',
    state: 'KS',
    zip: '66103',
    latitude: 39.0460,
    longitude: -94.6055,
    nearest_hospital_id: 'h-ku-med',
    monthly_rate: 1650,
    security_deposit: 200,
    cleaning_fee: 120,
    is_active: true,
    rooms: [
      { id: 'ks-kumed-room1', listing_id: 'ks-kumed-apt1', room_name: 'Primary Bedroom', bed_type: 'Queen', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'ks-kumed-apt2',
    host_id: 'host-karen-b',
    title: 'Westwood Park Studio',
    property_type: 'Entire Apartment',
    cancellation_tier: 'strict_90d',
    address: '3000 W 47th Ave',
    city: 'Westwood',
    state: 'KS',
    zip: '66205',
    latitude: 39.0435,
    longitude: -94.6200,
    nearest_hospital_id: 'h-ku-med',
    monthly_rate: 1400,
    security_deposit: 150,
    cleaning_fee: 100,
    is_active: true,
    rooms: [
      { id: 'ks-kumed-room2', listing_id: 'ks-kumed-apt2', room_name: 'Primary Bedroom', bed_type: 'Double', private_bath: true, dedicated_workspace: true, blackout_curtains: true, white_noise_machine: true, is_available: true },
    ],
    pricing_calendar: []
  },
  {
    id: 'nc-duke-condo',
    host_id: 'host-sarah-m',
    title: 'Acoustically Insulated Ninth Street Suite',
    property_type: 'Entire Condo',
    cancellation_tier: 'flexible_30d',
    address: '810 9th St',
    city: 'Durham',
    state: 'NC',
    zip: '27705',
    latitude: 36.0125,
    longitude: -78.9228,
    nearest_hospital_id: 'h-duke',
    monthly_rate: 2100,
    security_deposit: 250,
    cleaning_fee: 150,
    is_active: true,
    rooms: [
      {
        id: 'room-1',
        listing_id: 'nc-duke-condo',
        room_name: 'Primary Sanctuary Suite',
        bed_type: 'Queen',
        private_bath: true,
        dedicated_workspace: true,
        blackout_curtains: true,
        white_noise_machine: true,
        is_available: true,
      },
    ],
    pricing_calendar: [
      {
        id: 'cal-1',
        listing_id: 'nc-duke-condo',
        start_date: '2026-10-01',
        end_date: '2026-12-31',
        monthly_rate: 2100,
        minimum_stay_weeks: 13,
        is_available: true,
        notes: 'Fall/Winter travel rotation rate locked',
      },
    ],
  },
  {
    id: 'nc-chapel-hill-loft',
    host_id: 'host-karen-b',
    title: 'Historic Franklin Street Daylight Sanctuary',
    property_type: 'Entire Apartment',
    cancellation_tier: 'moderate_60d',
    address: '140 E Franklin St',
    city: 'Chapel Hill',
    state: 'NC',
    zip: '27514',
    latitude: 35.9138,
    longitude: -79.0528,
    nearest_hospital_id: 'h-unc',
    monthly_rate: 2350,
    security_deposit: 300,
    cleaning_fee: 160,
    is_active: true,
    rooms: [
      {
        id: 'room-1',
        listing_id: 'nc-chapel-hill-loft',
        room_name: 'Soundproof Master Suite',
        bed_type: 'King',
        private_bath: true,
        dedicated_workspace: true,
        blackout_curtains: true,
        white_noise_machine: true,
        is_available: true,
      },
      {
        id: 'room-2',
        listing_id: 'nc-chapel-hill-loft',
        room_name: 'Second Bedroom / Clinical Study',
        bed_type: 'Queen',
        private_bath: false,
        dedicated_workspace: true,
        blackout_curtains: true,
        white_noise_machine: true,
        monthly_rate_override: 1400,
        is_available: true,
      },
    ],
    pricing_calendar: [
      {
        id: 'cal-2',
        listing_id: 'nc-chapel-hill-loft',
        start_date: '2026-10-15',
        end_date: '2027-01-15',
        monthly_rate: 2350,
        minimum_stay_weeks: 13,
        is_available: true,
      },
    ],
  },
  {
    id: 'nc-wakemed-cottage',
    host_id: 'host-james-l',
    title: 'North Hills Day-Sleeper Garden Cottage',
    property_type: 'Private Cottage',
    cancellation_tier: 'strict_90d',
    address: '4201 Six Forks Rd',
    city: 'Raleigh',
    state: 'NC',
    zip: '27609',
    latitude: 35.8398,
    longitude: -78.6437,
    nearest_hospital_id: 'h-wakemed',
    monthly_rate: 1950,
    security_deposit: 200,
    cleaning_fee: 140,
    is_active: true,
    rooms: [
      {
        id: 'room-1',
        listing_id: 'nc-wakemed-cottage',
        room_name: 'Quiet Oak Bedroom',
        bed_type: 'Queen',
        private_bath: true,
        dedicated_workspace: true,
        blackout_curtains: true,
        white_noise_machine: true,
        is_available: true,
      },
    ],
    pricing_calendar: [
      {
        id: 'cal-3',
        listing_id: 'nc-wakemed-cottage',
        start_date: '2026-10-01',
        end_date: '2027-04-01',
        monthly_rate: 1950,
        minimum_stay_weeks: 13,
        is_available: true,
      },
    ],
  },
];
