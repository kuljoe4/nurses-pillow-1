export interface DbListingRow {
  id: string;
  host_id?: string;
  title: string;
  property_type?: string;
  address?: string;
  city: string;
  state: string;
  zip?: string;
  latitude: number | string;
  longitude: number | string;
  nearest_hospital_id?: string;
  monthly_rate: number | string;
  security_deposit?: number | string;
  cleaning_fee?: number | string;
  is_active?: boolean;
  cancellation_tier?: string;
  pet_fee: number | string;
  parking_fee?: number | string;
  extra_options?: any;
  images?: string[];
}

// Maps enterprise DB schema formats to the `HousingListing` format the frontend expects.
export function mapDbListingToFrontend(dbRow: DbListingRow) {

  return {
    id: dbRow.id,
    title: dbRow.title,
    neighborhood: dbRow.address || '',
    city: dbRow.city,
    state: dbRow.state,
    proximityToHospital: "Under 5 Miles",
    nearestHospital: dbRow.nearest_hospital_id || 'Unknown',
    driveTimeMinutes: 10,
    monthlyRate: Number(dbRow.monthly_rate),
    weeklyRate: Math.round(Number(dbRow.monthly_rate) / 4),
    beds: 1,
    baths: 1,
    sqft: 800,
    images: Array.isArray(dbRow.images) ? dbRow.images : [],
    nurseRating: 98,
    reviewsCount: 12,
    amenities: {
      blackoutCurtains: true,
      whiteNoiseMachine: true,
      daySleeperQuietHours: true,
      washerDryerInUnit: true,
      dedicatedParking: true,
      highSpeedWifi: true,
      fullyFurnished: true,
      petFriendly: Number(dbRow.pet_fee) > 0,
      privateEntrance: false
    },
    contractFlexProtection: dbRow.cancellation_tier === 'flexible',
    featuredSanctuary: false,
    propertyType: dbRow.property_type,
    latitude: Number(dbRow.latitude),
    longitude: Number(dbRow.longitude),
    petFee: Number(dbRow.pet_fee || 0),
    parkingFee: Number(dbRow.parking_fee || 0),
    extraOptions: typeof dbRow.extra_options === 'string' ? JSON.parse(dbRow.extra_options) : dbRow.extra_options,
  };
}

export function mapDbBookingToFrontend(b: any) {
  const startDateStr = b.start_date || b.check_in_date;
  const endDateStr = b.end_date || b.check_out_date;
  const startDateFormatted = startDateStr
    ? new Date(startDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Oct 15, 2026';
  const endDateFormatted = endDateStr
    ? new Date(endDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Jan 15, 2027';

  const monthlyRent = Number(b.base_monthly_rent || b.total_rent || 1950);
  const cleaningFee = Number(b.cleaning_fee || 150);
  const petFee = Number(b.pet_fee || 0);
  const durationWeeks = Number(b.duration_weeks || b.assignment_duration_weeks || 13);
  const totalInitialCharge = Number(b.gross_booking_value || b.total_rent || (monthlyRent + cleaningFee + petFee));
  const hostNetPayout = Number(b.host_payout_amount || (totalInitialCharge * 0.95));

  return {
    id: b.id,
    listingId: b.listing_id,
    listingTitle: b.listing_title || b.listing_title_from_db || 'Sanctuary Suite',
    clinicianName: b.traveler_name || b.traveler_name_from_db || 'Sarah Jenkins, RN',
    clinicianTitle: 'BSN, RN — Travel Clinician',
    clinicianAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    clinicianPhone: b.traveler_phone_from_db || '+1 (919) 555-0198',
    hospitalName: b.hospital_name || 'Duke University Hospital',
    unitSpecialty: 'Critical Care / ICU',
    startDate: startDateFormatted,
    endDate: endDateFormatted,
    durationWeeks,
    monthlyRent,
    securityDeposit: 0,
    cleaningFee,
    petFee,
    travelerFee: 0,
    totalInitialCharge,
    hostNetPayout,
    status: b.status || 'pending_host_approval',
    submittedAt: b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
    deadlineHoursRemaining: 18,
    doorCode: (b.status === 'approved' || b.status === 'active') ? '8294#' : undefined,
    wifiNetwork: (b.status === 'approved' || b.status === 'active') ? 'NRS-Sanctuary-5G' : undefined,
    paymentIntentId: b.stripe_payment_intent_id,
  };
}

