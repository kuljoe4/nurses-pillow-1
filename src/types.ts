export type NavigationTab = 
  | 'verification'
  | 'email-verification'
  | 'phone-verification'
  | 'find-housing'
  | 'search-listings'
  | 'nurse-dashboard'
  | 'host-dashboard'
  | 'host-onboarding'
  | 'messages'
  | 'admin-portal'
  | 'how-it-works'
  | 'for-hosts'
  | 'nurse-support'
  | 'verified-hospitals'
  | 'phase1-inventory'
  | 'legal-policies'
  | 'mobile-preview'
  | 'system-status';

export type UserRole = 'nurse' | 'host' | 'dual' | 'super_admin' | 'developer' | 'guest';

export type CancellationTier = 'flexible_30d' | 'moderate_60d' | 'strict_90d';

export interface BookingRequest {
  id: string;
  clinicianName: string;
  clinicianTitle: string;
  clinicianAvatar: string;
  clinicianPhone: string;
  hospitalName: string;
  unitSpecialty: string;
  listingId: string;
  roomId?: string;

  listingTitle: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  monthlyRent: number;
  securityDeposit: number;
  cleaningFee: number;
  petFee: number;
  travelerFee: number;
  parkingFee?: number;
  extraOptionsFee?: number;
  selectedExtraOptions?: Array<{ name: string; price: number }>;
  totalInitialCharge: number;
  hostNetPayout: number;
  platformFeeAmount?: number;
  platformFeePercent?: number;
  status: 'pending_host_approval' | 'approved' | 'declined' | 'active' | 'completed';
  submittedAt: string;
  deadlineHoursRemaining: number;
  specialRequests?: string;
  doorCode?: string;
  wifiNetwork?: string;
  paymentIntentId?: string;
  hostId?: string;
  clinicianId?: string;
  traveler_user_id?: string;
}

export interface AdminLicenseReview {
  id: string;
  clinicianLegalName: string;
  profession: string;
  issuingState: string;
  licenseNumber: string;
  licenseStatus: 'pending_review' | 'verified' | 'rejected' | 'info_requested';
  hospitalAffiliation: string;
  submittedAt: string;
  nursysLookupUrl: string;
  documentPurged: boolean;
  isDualRole?: boolean;
  userRole?: string;
}

export interface MarketDemandReport {
  hospitalName: string;
  healthSystem: string;
  cityState: string;
  clinicianSearchCount30d: number;
  activeHostListings: number;
  priorityRecruitmentTier: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercentage: number;
  minBookingValue: number;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

export type VerificationStepId = 1 | 2 | 3;

export interface VerificationFormData {
  // Step 1: Identity
  legalFirstName: string;
  legalLastName: string;
  isIdVerified: boolean;

  // Step 2: Email & Phone
  workEmail: string;
  mobilePhone: string;
  phoneVerified: boolean;
  isContactVerified: boolean;

  // Step 3: Clinical License (Exact screen)
  profession: string;
  professionSpecialty: string;
  licenseNumber: string;
  issuingStateBoard: string;
  licenseExpirationDate: string;
  uploadedDocument: {
    name: string;
    size: string;
    uploadedAt: string;
    fileType: string;
  } | null;
  licenseStatus: 'pending_review' | 'verified' | 'unsubmitted' | 'not_started';
}

export interface HousingListing {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  state: string;
  proximityToHospital: string;
  nearestHospital: string;
  driveTimeMinutes: number;
  monthlyRate: number;
  weeklyRate: number;
  beds: number;
  baths: number;
  sqft: number;
  images: string[];
  nurseRating: number;
  reviewsCount: number;
  amenities: {
    blackoutCurtains: boolean;
    whiteNoiseMachine: boolean;
    daySleeperQuietHours: boolean;
    washerDryerInUnit: boolean;
    dedicatedParking: boolean;
    highSpeedWifi: boolean;
    fullyFurnished: boolean;
    petFriendly: boolean;
    privateEntrance: boolean;
  };
  contractFlexProtection: boolean;
  featuredSanctuary: boolean;
  propertyType?: string;
  hostType?: string;
  hostId?: string;
  hostName?: string;
  highlightBadges?: string[];
  distanceBadge?: string;
  verified?: boolean;
  isVerifiedByAdmin?: boolean;
  requiresSecurityDeposit?: boolean;
  securityDeposit?: number;
  parkingFee?: number;
  petFee?: number;
  extraOptions?: Array<{ name: string; price: number }>;
  depositTermsExplainer?: string;
  customFeeOverridePercent?: number;
  hasFeeOverride?: boolean;
  minWeeks?: number;
  maxWeeks?: number;
  rooms?: Array<{
    id: string;
    name: string;
    monthlyRate: number;
    bedType: string;
    bathType: string;
    isAvailable: boolean;
    availableFrom: string;
    sqft: number;
  }>;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  traumaLevel: string;
  teachingHospital: boolean;
  availableSanctuariesCount: number;
  shiftTypes: string[];
  parkingType: string;
  nurseFeedbackScore: number;
}
