-- ============================================================================
-- NURSES PILLOW — ENTERPRISE PRODUCTION RELATIONAL DATABASE SCHEMA
-- Target Engine: PostgreSQL 15 / 16 (Railway Provisioned)
-- Standard: ACID compliant, strict referential integrity, extensible roadmap
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for overlapping date EXCLUDE constraints
-- Enable PostGIS for geospatial hospital distance lookups if supported
-- CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;

-- ============================================================================
-- 1. ENUMS & DOMAINS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'nurse',       -- Healthcare Traveler / Clinician
    'host',        -- Property Owner / Landlord
    'agency',      -- Phase 2: Staffing Agency / Corporate Placement
    'admin',       -- Operations & Compliance Staff
    'super_admin'  -- Primary Platform Administrator
);

CREATE TYPE healthcare_profession AS ENUM (
    'RN',                      -- Registered Nurse
    'LPN_LVN',                 -- Licensed Practical / Vocational Nurse
    'APRN_NP',                 -- Advanced Practice Registered Nurse / Nurse Practitioner
    'CRNA',                    -- Certified Registered Nurse Anesthetist
    'CNM',                     -- Certified Nurse Midwife
    'CNA',                     -- Certified Nursing Assistant
    'MD_DO',                   -- Physician (MD / DO)
    'PA',                      -- Physician Assistant
    'SURGEON',                 -- Surgeon
    'PHARMACIST',              -- Pharmacist / RPh / PharmD
    'PHARMACY_TECHNICIAN',     -- Pharmacy Technician
    'DENTISTRY',               -- Dentist / Dental Hygienist / Dental Therapist
    'PT_OT',                   -- Physical / Occupational Therapist / Assistant
    'RESPIRATORY_THERAPIST',   -- RT
    'IMAGING_SURGICAL_TECH',   -- Radiology / Rad Tech / Scrub Tech / MRI / CT / Ultrasound
    'LAB_PROFESSIONAL',        -- Medical Lab Scientist / Tech
    'SPEECH_HEARING',          -- Speech-Language Pathologist / Audiologist
    'MENTAL_BEHAVIORAL_HEALTH',-- Psychologist / LCSW / LPC / LMFT
    'EMT_PARAMEDIC',           -- Emergency Medical Technician / Paramedic
    'NUTRITION_DIETETICS',     -- Registered Dietitian / RDN
    'OPTOMETRY',               -- Optometrist / Optician
    'PODIATRY_CHIROPRACTIC',   -- Podiatrist / Chiropractor
    'REHAB_CLINICAL_SERVICES', -- Athletic Trainer / Recreational Therapist / Genetic Counselor, etc.
    'MEDICAL_ASSISTANT',       -- CMA / RMA
    'OTHER_ALLIED_HEALTH'
);

CREATE TYPE verification_type AS ENUM (
    'email_otp',
    'twilio_sms_phone',
    'stripe_identity_biometric',
    'professional_license',
    'host_authority_to_list',
    'facility_assignment'      -- Roadmap: Assignment Confirmed
);

CREATE TYPE verification_status AS ENUM (
    'not_started',
    'pending_review',
    'action_needed',
    'verified',
    'rejected',
    'expired'
);

CREATE TYPE property_type AS ENUM (
    'entire_home',
    'room_in_property',
    'apartment_condo',
    'guest_suite'
);

CREATE TYPE cancellation_policy_tier AS ENUM (
    'flexible',   -- 100% refund 30+ d; 50% 14-29 d; 0% <14 d
    'moderate',   -- 100% refund 60+ d; 50% 30-59 d; 0% <30 d
    'strict'      -- 100% refund 90+ d; 50% 60-89 d; 0% <60 d
);

CREATE TYPE booking_status AS ENUM (
    'requested',
    'accepted',
    'declined',
    'expired',
    'paid',
    'active',
    'completed',
    'cancelled',
    'disputed'
);

CREATE TYPE ticket_category AS ENUM (
    'booking',
    'payment',
    'host_issue',
    'property_issue',
    'safety',
    'account',
    'verification'
);

CREATE TYPE ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);

-- ============================================================================
-- 2. HEALTHCARE FACILITIES & PROXIMITY ENGINE (HOSPITAL FIRST)
-- ============================================================================

CREATE TABLE healthcare_facilities (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- e.g. 'Duke University Hospital'
    health_system VARCHAR(255), -- e.g. 'Duke Health', 'UNC Health'
    address_line1 VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'NC', -- North Carolina gated
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    place_id VARCHAR(255) UNIQUE, -- Google Maps Places Autocomplete ID
    is_active BOOLEAN DEFAULT TRUE,
    trauma_level VARCHAR(100),
    teaching_hospital BOOLEAN DEFAULT FALSE,
    parking_type VARCHAR(255),
    nurse_feedback_score INTEGER CHECK (nurse_feedback_score >= 0 AND nurse_feedback_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facilities_coords ON healthcare_facilities(latitude, longitude);
CREATE INDEX idx_facilities_city_state ON healthcare_facilities(city, state);

-- ============================================================================
-- 3. CORE USERS & ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50) NOT NULL, -- 'staffing_agency', 'property_management_group'
    billing_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'nurse',
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30) UNIQUE,
    avatar_url TEXT,

    -- Verification Flags
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE, -- Stripe Identity
    is_nurse_verified BOOLEAN DEFAULT FALSE, -- True if active professional license confirmed

    clinical_license_number VARCHAR(100),
    clinical_state_board VARCHAR(100),
    profession_type VARCHAR(100),
    specialty VARCHAR(150),
    primary_hospital_id VARCHAR(255) REFERENCES healthcare_facilities(id),
    shift_preference VARCHAR(20),
    clinical_document_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'unverified',
    primary_source_name VARCHAR(150),

    is_host_verified BOOLEAN DEFAULT FALSE,  -- True if Stripe ID & property authority passed
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,

    document_purged BOOLEAN DEFAULT FALSE,
    document_purged_at TIMESTAMPTZ,

    -- Password Reset
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP WITH TIME ZONE,

    -- Financial Custody (Stripe Connect)
    stripe_customer_id VARCHAR(100),         -- For nurses/guests paying checkout
    stripe_connected_account_id VARCHAR(100),-- For hosts (Stripe Express connected account)
    stripe_payouts_enabled BOOLEAN DEFAULT FALSE,

    -- Roadmap Extensibility (Referral Program)
    referral_code VARCHAR(50) UNIQUE,
    referred_by_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ============================================================================
-- 3. AUDITABLE TRUST & VERIFICATION (DECOUPLED ARCHITECTURE)
-- ============================================================================

CREATE TABLE verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type verification_type NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending_review',

    -- Clinical Credential Specifics (Nurses & Healthcare Professionals)
    profession healthcare_profession,
    professional_title VARCHAR(150), -- e.g. 'Certified Registered Nurse Anesthetist'
    credential_type VARCHAR(50), -- 'licensed', 'certified', 'registered'
    issuing_state VARCHAR(2) DEFAULT 'NC',
    license_number_encrypted TEXT, -- Stored encrypted at rest; NEVER exposed to hosts
    primary_source_name VARCHAR(150), -- e.g. 'Nursys QuickConfirm', 'FSMB DocInfo', 'NC Board of Nursing'
    primary_source_url TEXT,
    expiration_date DATE,

    -- Trust Breakdown Presentation Fields (Safe to display publicly to hosts)
    public_trust_badge_label VARCHAR(150), -- e.g. 'Active Professional License Checked (RN — NC)'
    verified_at TIMESTAMPTZ,

    -- Privacy & Sensitive Document Purge Enforcement
    document_purged BOOLEAN DEFAULT FALSE,
    document_purged_at TIMESTAMPTZ,
    temporary_document_storage_url TEXT, -- Wiped post-admin verification

    -- Admin & Vendor Audit Trail
    admin_reviewer_id VARCHAR(255) REFERENCES users(id),
    admin_review_notes TEXT,
    rejection_reason TEXT,
    verification_provider VARCHAR(50) DEFAULT 'manual_admin', -- 'manual_admin', 'verifiable', 'propelus'
    external_vendor_reference_id VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_user ON verification_records(user_id);
CREATE INDEX idx_verification_status ON verification_records(status);

-- ============================================================================
-- 4. LISTINGS, ROOM UNITS & HEALTHCARE AMENITIES
-- ============================================================================

CREATE TABLE listings (
    id VARCHAR(255) PRIMARY KEY,
    host_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_type property_type NOT NULL DEFAULT 'entire_home',
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Physical Location (Gated to NC at Launch)
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'NC',
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,

    -- Entire Property Base Pricing & Fees (Applicable if rented as full home)
    monthly_rent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    security_deposit_enabled BOOLEAN DEFAULT FALSE,
    security_deposit_amount DECIMAL(10, 2) DEFAULT 0.00,
    cleaning_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pet_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    parking_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    extra_options JSONB DEFAULT '[]'::jsonb,

    -- Marketplace Policies
    cancellation_policy cancellation_policy_tier NOT NULL DEFAULT 'flexible',
    house_rules TEXT,

    -- Admin Quality Gates
    is_verified_by_admin BOOLEAN DEFAULT FALSE, -- Must pass Queue A-10 before public view
    is_published BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,

    -- Future Roadmap Compatibility: Readiness Badges
    is_night_shift_ready BOOLEAN DEFAULT FALSE,  -- Roadmap: Night-Shift Ready
    is_nurses_pillow_ready BOOLEAN DEFAULT FALSE,-- Roadmap: Verified property tier
    is_healthcare_ready_plus BOOLEAN DEFAULT FALSE,

    nearest_hospital_id VARCHAR(255) REFERENCES healthcare_facilities(id),
    min_stay_days INT DEFAULT 30,
    max_stay_days INT DEFAULT 365,
    quiet_daytime_environment BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_host ON listings(host_id);
CREATE INDEX idx_listings_coords ON listings(latitude, longitude);
CREATE INDEX idx_listings_published ON listings(is_published, is_verified_by_admin);

-- Individual Room Inventory (For properties with separately rentable rooms)
CREATE TABLE listing_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL, -- e.g. 'Master Suite with Private Bath', 'Room 2'
    description TEXT,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    security_deposit_amount DECIMAL(10, 2) DEFAULT 0.00,
    private_bathroom BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_listing ON listing_rooms(listing_id);

-- Healthcare-Specific Amenities Matrix
CREATE TABLE listing_amenities (
    listing_id VARCHAR(255) PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    blackout_curtains BOOLEAN DEFAULT FALSE,
    quiet_daytime_environment BOOLEAN DEFAULT FALSE, -- Specifically named per Lawrence
    washer_dryer BOOLEAN DEFAULT FALSE,
    furnished BOOLEAN DEFAULT TRUE,
    utilities_included BOOLEAN DEFAULT TRUE,
    high_speed_wifi BOOLEAN DEFAULT TRUE,
    dedicated_workspace BOOLEAN DEFAULT FALSE,
    private_parking BOOLEAN DEFAULT FALSE,
    pet_friendly BOOLEAN DEFAULT FALSE,
    kitchen_access BOOLEAN DEFAULT TRUE,
    flexible_lease BOOLEAN DEFAULT TRUE,
    custom_amenities JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE listing_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Precalculated Hospital Proximity Cache
CREATE TABLE listing_hospital_distances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    facility_id VARCHAR(255) NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
    distance_miles DECIMAL(5, 2) NOT NULL,
    commute_duration_mins INT, -- Roadmap: commute matching
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(listing_id, facility_id)
);

CREATE INDEX idx_hospital_distances ON listing_hospital_distances(facility_id, distance_miles);

-- Calendar & Availability Management
CREATE TABLE listing_availability_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES listing_rooms(id) ON DELETE CASCADE, -- NULL if entire home
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_blocked BOOLEAN DEFAULT TRUE,
    block_reason VARCHAR(100) DEFAULT 'host_blocked', -- 'booking', 'host_blocked', 'maintenance'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_dates ON listing_availability_blocks(listing_id, start_date, end_date);

-- ============================================================================
-- 6. BOOKINGS, PAYMENTS & CANCELLATION ENGINE
-- ============================================================================

CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- 'fixed_amount', 'percentage'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_booking_value DECIMAL(10, 2) DEFAULT 0.00,
    max_uses INT,
    times_used INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
    id VARCHAR(255) PRIMARY KEY,
    listing_id VARCHAR(255) NOT NULL REFERENCES listings(id),
    room_id UUID REFERENCES listing_rooms(id), -- NULL if entire home
    traveler_id VARCHAR(255) NOT NULL REFERENCES users(id),
    host_id VARCHAR(255) NOT NULL REFERENCES users(id),
    hospital_id VARCHAR(255) REFERENCES healthcare_facilities(id), -- Placement hospital context

    -- Stay Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    assignment_duration_weeks INT NOT NULL, -- 4, 8, 13, 26, or custom
    status booking_status NOT NULL DEFAULT 'requested',
    cancellation_policy_agreed cancellation_policy_tier NOT NULL,

    -- Transparent Itemized Financial Ledger (Stored in USD)
    base_monthly_rent DECIMAL(10, 2) NOT NULL,
    total_rent DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pet_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    parking_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    extra_options_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deposit_hold_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    gross_booking_value DECIMAL(10, 2) NOT NULL, -- GBV metric

    -- Platform Economics & Split Architecture
    traveler_platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- STRICT GUARANTEE: $0 Traveler Fee
    host_platform_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00, -- 5% default (capped at 15%)
    host_platform_fee_amount DECIMAL(10, 2) NOT NULL,
    host_payout_amount DECIMAL(10, 2) NOT NULL, -- ~95% routed to Host Connected Account

    -- Promo Code Applied
    promo_code_id UUID REFERENCES promo_codes(id),
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,

    -- Stripe Integration References (Never holds custody)
    stripe_payment_intent_id VARCHAR(100),
    stripe_transfer_id VARCHAR(100),
    deposit_hold_payment_intent_id VARCHAR(100),

    -- Workflow Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Host decision SLA
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- STRICT DATA INTEGRITY: Prevent overlapping bookings for the same room or listing
    -- Only active or approved bookings are checked. Canceled/rejected bookings can overlap.
    CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
        listing_id WITH =,
        COALESCE(room_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
        daterange(start_date, end_date, '[)') WITH &&
    ) WHERE (status IN ('requested', 'accepted', 'approved', 'active', 'paid', 'pending_host_approval'))
);

CREATE INDEX idx_bookings_traveler ON bookings(traveler_id);
CREATE INDEX idx_bookings_host ON bookings(host_id);
CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Cancellation & Automated Refund Engine Records
CREATE TABLE booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(255) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    cancelled_by_user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    cancellation_reason TEXT,
    days_prior_to_checkin INT NOT NULL,

    -- Refund Calculations
    policy_tier_applied cancellation_policy_tier NOT NULL,
    rent_refund_percent DECIMAL(5, 2) NOT NULL,
    rent_refund_amount DECIMAL(10, 2) NOT NULL,
    cleaning_fee_refunded DECIMAL(10, 2) NOT NULL, -- 100% refunded prior to move-in
    total_refund_amount DECIMAL(10, 2) NOT NULL,

    -- Stripe Reversal
    stripe_refund_id VARCHAR(100),
    is_disputed BOOLEAN DEFAULT FALSE,
    is_manual_admin_override BOOLEAN DEFAULT FALSE,
    admin_reviewer_id VARCHAR(255) REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. REVIEWS, FAVORITES & SOCIAL TRUST (MILESTONE 2 PLANNED)
-- ============================================================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Reviews are unlocked strictly upon completed stay
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(255) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(255) NOT NULL REFERENCES users(id),
    reviewee_id VARCHAR(255) NOT NULL REFERENCES users(id),
    listing_id VARCHAR(255) REFERENCES listings(id),

    rating_overall INT CHECK (rating_overall BETWEEN 1 AND 5),
    rating_cleanliness INT CHECK (rating_cleanliness BETWEEN 1 AND 5),
    rating_accuracy INT CHECK (rating_accuracy BETWEEN 1 AND 5),
    rating_quietness INT CHECK (rating_quietness BETWEEN 1 AND 5), -- Night-shift specific
    review_text TEXT NOT NULL,

    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. COMMUNICATIONS, SUPPORT & NOTIFICATIONS
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id VARCHAR(255) REFERENCES bookings(id),
    traveler_id VARCHAR(255) NOT NULL REFERENCES users(id),
    host_id VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL REFERENCES users(id),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    booking_id VARCHAR(255) REFERENCES bookings(id),
    category ticket_category NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    assigned_admin_id VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_safety_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporting_user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    reported_user_id VARCHAR(255) REFERENCES users(id),
    reported_listing_id VARCHAR(255) REFERENCES listings(id),
    reason TEXT NOT NULL,
    admin_action_taken VARCHAR(100),
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_trigger VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'booking_requested', 'license_verified'
    email_template_alias VARCHAR(100) NOT NULL, -- Postmark template alias
    push_title_template VARCHAR(255),
    push_body_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. FUTURE ROADMAP EXTENSIONS (PHASE 2 & AFTER-SCOPE ENABLERS)
-- Built now so no rebuild is needed when activated.
-- ============================================================================

-- Pillow Match & Clinician Preferences (Assignment-based matching)
CREATE TABLE clinician_matching_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_hospital_id VARCHAR(255) REFERENCES healthcare_facilities(id),
    max_commute_miles INT DEFAULT 15,
    sleep_schedule VARCHAR(20) DEFAULT 'night_shift', -- 'day_shift', 'night_shift', 'rotating'
    pet_present BOOLEAN DEFAULT FALSE,
    max_budget_monthly DECIMAL(10, 2),
    earliest_move_in DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roommate Matching (Clinician-to-Clinician opt-in connection)
CREATE TABLE roommate_matching_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_opted_in BOOLEAN DEFAULT FALSE,
    target_facility_id VARCHAR(255) REFERENCES healthcare_facilities(id),
    target_start_date DATE,
    target_end_date DATE,
    budget_share_monthly DECIMAL(10, 2),
    cleanliness_preference VARCHAR(50),
    gender_preference VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gap Filler Tool (Hosts filling short calendar vacancies)
CREATE TABLE listing_gap_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES listing_rooms(id) ON DELETE CASCADE,
    gap_start_date DATE NOT NULL,
    gap_end_date DATE NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Dynamic Configuration & Analytics Snapshot
CREATE TABLE platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default initial configuration
INSERT INTO platform_settings (key, value, description)
VALUES
    ('host_fee_config', '{"default_percentage": 5.0, "maximum_cap_percentage": 15.0}', 'Platform host service fee rules'),
    ('geo_fencing', '{"restricted_state": "NC", "allow_national": false}', 'Active geographic operational boundaries')
ON CONFLICT (key) DO NOTHING;

-- M1 Audit Logs Compatibility Table (For our API endpoint)
CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  actor VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_hospitals_modtime BEFORE UPDATE ON healthcare_facilities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_listings_modtime BEFORE UPDATE ON listings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_rooms_modtime BEFORE UPDATE ON listing_rooms FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
