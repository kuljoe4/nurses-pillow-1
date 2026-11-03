// Nurses Pillow - Railway PostgreSQL Production Database Service
// Implements connection parsing, SSL pooling, schema migration, and seed synchronization
// Prioritizes production Railway PostgreSQL over the local in-memory fallback store.

import { NC_HOSPITAL_SEEDS, NC_LISTING_SEEDS } from './seedData.ts';

export interface RailwayConnectionConfig {
  connectionString: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  isInternalNetwork: boolean;
  isPublicProxy: boolean;
}

export interface RailwayDatabaseStatus {
  isConnected: boolean;
  provider: 'Railway PostgreSQL';
  activeStore: 'production_railway' | 'disconnected';
  host: string;
  port: number;
  database: string;
  latencyMs: number | null;
  tableCounts: {
    hospitals: number;
    listings: number;
    bookings: number;
    auditLogs: number;
  };
  diagnostics: string;
  lastChecked: string;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// 1. Connection String Parsing & Sanitization
export function parseRailwayConnectionString(rawUrl?: string): RailwayConnectionConfig | null {
  const url =
    rawUrl ||
    (typeof process !== 'undefined'
      ? process.env.DATABASE_URL ||
        process.env.DATABASE_PUBLIC_URL ||
        process.env.RAILWAY_DATABASE_URL ||
        process.env.POSTGRES_URL
      : '');

  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port, 10) : 5432;
    const database = parsed.pathname.replace(/^\//, '') || 'railway';
    const user = parsed.username || 'postgres';

    const isInternalNetwork = host.includes('railway.internal');
    const isPublicProxy = host.includes('rlwy.net') || host.includes('railway.app');
    const ssl = isPublicProxy || parsed.searchParams.get('sslmode') === 'require' || host !== 'localhost';

    return {
      connectionString: url,
      host,
      port,
      database,
      user,
      ssl,
      isInternalNetwork,
      isPublicProxy,
    };
  } catch {
    return null;
  }
}

// 2. Server-Side Railway Database Connection Manager
class RailwayDatabaseManager {
  private pool: any = null;
  private isConnected = false;
  private isInitializing = false;
  private lastLatencyMs: number | null = null;
  private config: RailwayConnectionConfig | null = null;
  private diagnostics = 'Awaiting connection attempt';

  constructor() {
    this.refreshConfig();
  }

  public refreshConfig() {
    this.config = parseRailwayConnectionString();
  }

  public getConfig(): RailwayConnectionConfig | null {
    if (!this.config) {
      this.refreshConfig();
    }
    return this.config;
  }

  public isReady(): boolean {
    return this.isConnected && this.pool !== null;
  }

  /**
   * Initializes the PostgreSQL connection pool to Railway
   * Supported in Node.js runtime environments
   */
  public async initialize(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      return false; // Browser runtime uses API endpoints
    }

    if (this.isInitializing) return this.isConnected;
    this.isInitializing = true;
    this.refreshConfig();

    if (!this.config) {
      this.diagnostics = 'No DATABASE_URL configured in environment variables.';
      this.isConnected = false;
      this.isInitializing = false;
      console.log(`[Railway DB] ${this.diagnostics} (Using in-memory store)`);
      return false;
    }

    // Diagnostic notice for internal Railway DNS from external containers
    if (this.config.isInternalNetwork) {
      this.diagnostics =
        `Detected Railway private internal domain (${this.config.host}). ` +
        `Railway internal DNS is only accessible when running inside Railway's private network. ` +
        `For external services (e.g. Google Cloud / AI Studio), use Railway's Public TCP Proxy URL ` +
        `(e.g. postgresql://postgres:***@roundhouse.proxy.rlwy.net:PORT/railway).`;
      console.warn(`[Railway DB] Notice: ${this.diagnostics}`);
    }

    try {
      // Dynamic import of pg to ensure clean Vite client-side bundle isolation
      const pgModule = await import(/* @vite-ignore */ 'pg');
      const pg = pgModule.default || pgModule;

      if (this.pool) {
        try {
          await this.pool.end();
        } catch {
          // ignore cleanup errors
        }
      }

      this.pool = new pg.Pool({
        connectionString: this.config.connectionString,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
        max: 10,
        idleTimeoutMillis: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });

      this.pool.on('error', (err: any) => {
        console.warn('[Railway DB] Pool client background error:', err.message);
        this.isConnected = false;
        this.diagnostics = `Background error: ${err.message}`;
      });

      // Test connection with a fast ping
      const startTime = Date.now();
      const testResult = await this.pool.query('SELECT NOW() as current_time, current_database() as db_name');
      this.lastLatencyMs = Date.now() - startTime;
      this.isConnected = true;
      this.diagnostics = `Connected to Railway PostgreSQL (${testResult.rows[0]?.db_name || this.config.database}) in ${this.lastLatencyMs}ms.`;
      console.log(`[Railway DB] ✅ ${this.diagnostics}`);

      // Auto-migrate schema & seed initial North Carolina inventory
      await this.autoBootstrapSchemaAndSeeds();

      this.isInitializing = false;
      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.diagnostics = `Connection attempt failed: ${err.message}`;
      console.warn(`[Railway DB] ⚠️ ${this.diagnostics} — Application continuing with in-memory fallback store.`);
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Automatically creates standard tables if not present and seeds initial NC hospital inventory
   */
  private async autoBootstrapSchemaAndSeeds() {
    if (!this.pool || !this.isConnected) return;

    try {
      // 1. Ensure extensions and core tables exist
      await this.pool.query(`
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        CREATE EXTENSION IF NOT EXISTS "btree_gist";

        CREATE TABLE IF NOT EXISTS healthcare_facilities (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          health_system VARCHAR(255),
          address_line1 VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(2) NOT NULL DEFAULT 'NC',
          postal_code VARCHAR(20) NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          place_id VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          trauma_level VARCHAR(100),
          teaching_hospital BOOLEAN DEFAULT FALSE,
          parking_type VARCHAR(255),
          nurse_feedback_score INTEGER DEFAULT 95,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS listing_availability_blocks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            room_id UUID REFERENCES listing_rooms(id) ON DELETE CASCADE,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            is_blocked BOOLEAN DEFAULT TRUE,
            block_reason VARCHAR(100) DEFAULT 'host_blocked',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_availability_dates ON listing_availability_blocks(listing_id, start_date, end_date);

        -- First create custom ENUM types if they don't exist
        DO $$ BEGIN
            CREATE TYPE verification_type AS ENUM (
                'email_otp',
                'twilio_sms_phone',
                'stripe_identity_biometric',
                'professional_license',
                'host_authority_to_list',
                'facility_assignment'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE verification_status AS ENUM (
                'not_started',
                'pending_review',
                'action_needed',
                'verified',
                'rejected',
                'expired'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
            CREATE TYPE healthcare_profession AS ENUM (
                'RN',
                'LPN_LVN',
                'APRN_NP',
                'CRNA',
                'CNM',
                'CNA',
                'MD_DO',
                'PA',
                'SURGEON',
                'PHARMACIST',
                'PHARMACY_TECHNICIAN',
                'DENTISTRY',
                'PT_OT',
                'RESPIRATORY_THERAPIST',
                'IMAGING_SURGICAL_TECH',
                'LAB_PROFESSIONAL',
                'SPEECH_HEARING',
                'MENTAL_BEHAVIORAL_HEALTH',
                'EMT_PARAMEDIC',
                'NUTRITION_DIETETICS',
                'OPTOMETRY',
                'PODIATRY_CHIROPRACTIC',
                'REHAB_CLINICAL_SERVICES',
                'MEDICAL_ASSISTANT',
                'OTHER_ALLIED_HEALTH'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;


        CREATE TABLE IF NOT EXISTS organizations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            organization_type VARCHAR(50) NOT NULL,
            billing_email VARCHAR(255) NOT NULL,
            phone_number VARCHAR(30),
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          role VARCHAR(50) NOT NULL DEFAULT 'nurse',
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(30),
          email_verified BOOLEAN DEFAULT FALSE,
          phone_verified BOOLEAN DEFAULT FALSE,
          is_nurse_verified BOOLEAN DEFAULT FALSE,
          is_host_verified BOOLEAN DEFAULT FALSE,
          stripe_connected_account_id VARCHAR(100),
          stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );


        ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS clinical_license_number VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS clinical_state_board VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profession_type VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(150);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_hospital_id VARCHAR(255) REFERENCES healthcare_facilities(id);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_preference VARCHAR(20);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS clinical_document_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_source_name VARCHAR(150);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS document_purged BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS document_purged_at TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();



        CREATE TABLE IF NOT EXISTS promo_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            discount_type VARCHAR(20) NOT NULL,
            discount_value DECIMAL(10, 2) NOT NULL,
            min_booking_value DECIMAL(10, 2) DEFAULT 0.00,
            max_uses INT,
            times_used INT DEFAULT 0,
            expires_at TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS clinician_matching_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            preferred_hospital_id VARCHAR(255) REFERENCES healthcare_facilities(id),
            max_commute_miles INT DEFAULT 15,
            sleep_schedule VARCHAR(20) DEFAULT 'night_shift',
            pet_present BOOLEAN DEFAULT FALSE,
            max_budget_monthly DECIMAL(10, 2),
            earliest_move_in DATE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS roommate_matching_profiles (
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

        CREATE TABLE IF NOT EXISTS verification_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            verification_type verification_type NOT NULL,
            status verification_status NOT NULL DEFAULT 'pending_review',
            profession healthcare_profession,
            professional_title VARCHAR(150),
            credential_type VARCHAR(50),
            issuing_state VARCHAR(2) DEFAULT 'NC',
            license_number_encrypted TEXT,
            primary_source_name VARCHAR(150),
            primary_source_url TEXT,
            expiration_date DATE,
            public_trust_badge_label VARCHAR(150),
            verified_at TIMESTAMPTZ,
            document_purged BOOLEAN DEFAULT FALSE,
            document_purged_at TIMESTAMPTZ,
            temporary_document_storage_url TEXT,
            admin_reviewer_id VARCHAR(255) REFERENCES users(id),
            admin_review_notes TEXT,
            rejection_reason TEXT,
            verification_provider VARCHAR(50) DEFAULT 'manual_admin',
            external_vendor_reference_id VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_records(user_id);
        CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_records(status);

        ALTER TABLE verification_records ADD COLUMN IF NOT EXISTS professional_title VARCHAR(150);
        ALTER TABLE verification_records ADD COLUMN IF NOT EXISTS credential_type VARCHAR(50);

        CREATE TABLE IF NOT EXISTS listings (
          id VARCHAR(255) PRIMARY KEY,
          host_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          property_type VARCHAR(50) DEFAULT 'entire_home',
          address_line1 VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(2) NOT NULL DEFAULT 'NC',
          postal_code VARCHAR(20) NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          nearest_hospital_id VARCHAR(255),
          monthly_rent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          security_deposit_amount DECIMAL(10, 2) DEFAULT 0.00,
          cleaning_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          pet_fee DECIMAL(10, 2) DEFAULT 0.00,
          parking_fee DECIMAL(10, 2) DEFAULT 0.00,
          extra_options JSONB DEFAULT '[]'::jsonb,
          cancellation_policy VARCHAR(50) DEFAULT 'flexible',
          is_active BOOLEAN DEFAULT TRUE,
          is_published BOOLEAN DEFAULT TRUE,
          is_verified_by_admin BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Ensure backward-compatible columns exist if table was previously created
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(50) DEFAULT 'flexible';
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS pet_fee DECIMAL(10, 2) DEFAULT 0.00;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS parking_fee DECIMAL(10, 2) DEFAULT 0.00;
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS extra_options JSONB DEFAULT '[]'::jsonb;

        -- Set default value for security_deposit_amount or make the column nullable
        ALTER TABLE listings ALTER COLUMN security_deposit_amount SET DEFAULT 0;

        -- Sanitize existing listings records to enforce security_deposit defaults
        UPDATE listings SET security_deposit_amount = 0 WHERE security_deposit_amount IS NULL;


        CREATE TABLE IF NOT EXISTS listing_rooms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            room_name VARCHAR(100) NOT NULL,
            description TEXT,
            monthly_rent DECIMAL(10, 2) NOT NULL,
            security_deposit_amount DECIMAL(10, 2) DEFAULT 0.00,
            private_bathroom BOOLEAN DEFAULT FALSE,
            is_available BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_rooms_listing ON listing_rooms(listing_id);

        CREATE TABLE IF NOT EXISTS listing_gap_rules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            room_id UUID REFERENCES listing_rooms(id) ON DELETE CASCADE,
            gap_start_date DATE NOT NULL,
            gap_end_date DATE NOT NULL,
            discount_percentage DECIMAL(5, 2) DEFAULT 10.00,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS listing_photos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            photo_url TEXT NOT NULL,
            caption VARCHAR(255),
            display_order INT DEFAULT 0,
            is_cover BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id VARCHAR(255) PRIMARY KEY,
          listing_id VARCHAR(255) NOT NULL,
          traveler_user_id VARCHAR(255) NOT NULL,
          check_in_date DATE NOT NULL,
          check_out_date DATE NOT NULL,
          duration_weeks INTEGER NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'requested',
          total_rent DECIMAL(10, 2) NOT NULL,
          base_monthly_rent DECIMAL(10, 2) NOT NULL,
          cleaning_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          pet_fee DECIMAL(10, 2) DEFAULT 0.00,
          parking_fee DECIMAL(10, 2) DEFAULT 0.00,
          extra_options_fee DECIMAL(10, 2) DEFAULT 0.00,
          deposit_hold_amount DECIMAL(10, 2) DEFAULT 0.00,
          gross_booking_value DECIMAL(10, 2) NOT NULL,
          host_platform_fee_amount DECIMAL(10, 2) NOT NULL,
          host_payout_amount DECIMAL(10, 2) NOT NULL,
          cancellation_policy_agreed VARCHAR(50) DEFAULT 'flexible',
          host_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS parking_fee DECIMAL(10, 2) DEFAULT 0.00;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_date DATE;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_date DATE;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_id UUID;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS traveler_id VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS traveler_user_id VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pet_fee NUMERIC DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extra_options_fee NUMERIC DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_hold_amount NUMERIC DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gross_booking_value NUMERIC DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_platform_fee_amount NUMERIC DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_payout_amount NUMERIC DEFAULT 0;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy_agreed VARCHAR(50) DEFAULT 'flexible';
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'uncaptured';
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_transfer_id VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_hold_payment_intent_id VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS traveler_name VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS listing_title VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255);
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

        -- Safely add the overlapping bookings constraint if it doesn't already exist
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'no_overlapping_bookings'
            ) THEN
                ALTER TABLE bookings
                ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
                    listing_id WITH =,
                    COALESCE(room_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
                    daterange(start_date, end_date, '[)') WITH &&
                ) WHERE (status IN ('requested', 'accepted', 'approved', 'active', 'paid', 'pending_host_approval'));
            END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(255) PRIMARY KEY,
          event_type VARCHAR(100) NOT NULL,
          record_id VARCHAR(255) NOT NULL,
          details TEXT NOT NULL,
          actor VARCHAR(255) NOT NULL,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          listing_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT uq_favorites_user_listing UNIQUE (user_id, listing_id)
        );

        CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);
      `);

      // Alter ENUM to add missing types safely outside of transaction blocks
      const newProfessions = [
          'CRNA', 'CNM', 'SURGEON', 'PHARMACY_TECHNICIAN', 'DENTISTRY',
          'SPEECH_HEARING', 'MENTAL_BEHAVIORAL_HEALTH', 'NUTRITION_DIETETICS',
          'OPTOMETRY', 'PODIATRY_CHIROPRACTIC', 'REHAB_CLINICAL_SERVICES'
      ];

      for (const profession of newProfessions) {
          try {
              await this.pool.query(`ALTER TYPE healthcare_profession ADD VALUE IF NOT EXISTS '${profession}';`);
          } catch (e: any) {
              // Ignore duplicate object errors or syntax errors in older PG versions if IF NOT EXISTS fails
              if (e.code !== '42710') {
                 console.warn(`[Railway DB] Notice when adding ENUM ${profession}:`, e.message);
              }
          }
      }

      // 2. Check if facilities table needs initial seeding
      const countRes = await this.pool.query('SELECT COUNT(*) as count FROM healthcare_facilities');
      const count = parseInt(countRes.rows[0]?.count || '0', 10);

      if (count === 0) {
        console.log('[Railway DB] Seeding initial North Carolina hospital facilities and listings into Railway...');

        if (NC_HOSPITAL_SEEDS.length > 0) {
          const hParams: any[] = [];
          const hValues = NC_HOSPITAL_SEEDS.map((h, i) => {
            const offset = i * 13;
            hParams.push(h.id, h.name, h.health_system, h.address, h.city, h.state, h.zip, h.latitude, h.longitude, h.trauma_level, h.teaching_hospital, h.parking_type, h.nurse_feedback_score);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`;
          }).join(', ');

          await this.pool.query(
            `INSERT INTO healthcare_facilities (id, name, health_system, address_line1, city, state, postal_code, latitude, longitude, trauma_level, teaching_hospital, parking_type, nurse_feedback_score)
             VALUES ${hValues}
             ON CONFLICT (id) DO NOTHING;`,
            hParams
          );
        }

        if (NC_LISTING_SEEDS.length > 0) {
          const lParams: any[] = [];
          const lValues = NC_LISTING_SEEDS.map((l, i) => {
            const offset = i * 16;
            lParams.push(l.id, l.host_id, l.title, 'Curated peaceful sanctuary for clinicians.', l.address, l.city, l.state, l.zip, l.latitude, l.longitude, l.nearest_hospital_id, l.monthly_rate, l.security_deposit, l.cleaning_fee, l.is_active, true);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`;
          }).join(', ');

          await this.pool.query(
            `INSERT INTO listings (id, host_id, title, description, address_line1, city, state, postal_code, latitude, longitude, nearest_hospital_id, monthly_rent, security_deposit_amount, cleaning_fee, is_active, is_verified_by_admin)
             VALUES ${lValues}
             ON CONFLICT (id) DO NOTHING;`,
            lParams
          );

          const defaultImages = [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
          ];
          const photoParams: any[] = [];
          const photoValues: string[] = [];
          let pIdx = 1;
          for (const l of NC_LISTING_SEEDS) {
            defaultImages.forEach((img, index) => {
              photoValues.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
              photoParams.push(l.id, img, index, index === 0);
            });
          }

          if (photoValues.length > 0) {
            await this.pool.query(
              `INSERT INTO listing_photos (listing_id, photo_url, display_order, is_cover)
               VALUES ${photoValues.join(', ')}
               ON CONFLICT DO NOTHING;`,
              photoParams
            );
          }
        }
        console.log('[Railway DB] ✅ Initial seed sync to Railway complete.');
      }
    } catch (err: any) {
      console.warn('[Railway DB] Schema auto-bootstrap notice:', err.message);
    }
  }

  /**
   * Executes a SQL query against Railway with automatic fallback handling
   */
  public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (this.isReady()) {
      let retries = 3;
      while (retries > 0) {
        try {
          const result = params && params.length > 0
            ? await this.pool.query(text, params)
            : await this.pool.query(text);

          if (Array.isArray(result)) {
            const lastResult = result[result.length - 1];
            const rows = lastResult?.rows || [];
            const rowCount = lastResult?.rowCount ?? (rows ? rows.length : 0);
            return {
              rows,
              rowCount,
            };
          }

          const rows = result?.rows || [];
          const rowCount = result?.rowCount ?? (rows ? rows.length : 0);
          return {
            rows,
            rowCount,
          };
        } catch (err: any) {
          const isConnectionError = 
            err.code === 'ECONNRESET' || 
            err.code === 'ECONNREFUSED' || 
            err.code === 'ETIMEDOUT' || 
            err.message?.includes('terminated unexpectedly') || 
            err.message?.includes('closed') ||
            err.message?.includes('Connection terminated');

          if (isConnectionError && retries > 1) {
            retries--;
            console.warn(`[Railway DB] Connection lost (${err.message}). Re-initializing and retrying (${retries} retries left)...`);
            this.isConnected = false;
            await this.initialize();
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          console.warn('[Railway DB] Query execution error:', err.message);
          throw err;
        }
      }
    }
    throw new Error('Railway database is not currently connected');
  }

  /**
   * Fetches detailed connection diagnostics and table statistics
   */
  public async getStatus(): Promise<RailwayDatabaseStatus> {
    const config = this.getConfig();
    let tableCounts = {
      hospitals: 3,
      listings: 3,
      bookings: 0,
      auditLogs: 2,
    };

    if (this.isReady()) {
      try {
        const t0 = Date.now();
        await this.pool.query('SELECT 1');
        this.lastLatencyMs = Date.now() - t0;

        const [hRes, lRes, bRes, aRes] = await Promise.allSettled([
          this.pool.query('SELECT COUNT(*) as c FROM healthcare_facilities'),
          this.pool.query('SELECT COUNT(*) as c FROM listings'),
          this.pool.query('SELECT COUNT(*) as c FROM bookings'),
          this.pool.query('SELECT COUNT(*) as c FROM audit_logs'),
        ]);

        tableCounts = {
          hospitals: hRes.status === 'fulfilled' ? parseInt(hRes.value.rows[0]?.c || '0', 10) : 3,
          listings: lRes.status === 'fulfilled' ? parseInt(lRes.value.rows[0]?.c || '0', 10) : 3,
          bookings: bRes.status === 'fulfilled' ? parseInt(bRes.value.rows[0]?.c || '0', 10) : 0,
          auditLogs: aRes.status === 'fulfilled' ? parseInt(aRes.value.rows[0]?.c || '0', 10) : 2,
        };
      } catch {
        this.isConnected = false;
      }
    }

    return {
      isConnected: this.isConnected,
      provider: 'Railway PostgreSQL',
      activeStore: this.isConnected ? 'production_railway' : 'disconnected',
      host: config ? config.host : 'unconfigured',
      port: config ? config.port : 5432,
      database: config ? config.database : 'railway',
      latencyMs: this.lastLatencyMs,
      tableCounts,
      diagnostics: this.diagnostics,
      lastChecked: new Date().toISOString(),
    };
  }
}

// Global server-side instance
export const railwayDb = new RailwayDatabaseManager();

// 3. Client-Side Service (Browser / Frontend Safe)
export const railwayClient = {
  /**
   * Fetches the live connection status of the Railway production database
   */
  async getStatus(): Promise<RailwayDatabaseStatus> {
    try {
      const response = await fetch('/api/railway/status');
      if (response.ok) {
        return (response.headers.get('content-type')?.includes('application/json') ? await response.json() : {}) as any;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (err: any) {
      return {
        isConnected: false,
        provider: 'Railway PostgreSQL',
        activeStore: 'disconnected',
        host: 'unreachable',
        port: 5432,
        database: 'railway',
        latencyMs: null,
        tableCounts: { hospitals: 0, listings: 0, bookings: 0, auditLogs: 0 },
        diagnostics: `Frontend status query failed: ${err.message}`,
        lastChecked: new Date().toISOString(),
      };
    }
  },

  /**
   * Triggers a live reconnection test from the frontend
   */
  async reconnect(): Promise<RailwayDatabaseStatus> {
    try {
      const response = await fetch('/api/railway/reconnect', { method: 'POST' });
      if (response.ok) {
        return (response.headers.get('content-type')?.includes('application/json') ? await response.json() : {}) as any;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch {
      return this.getStatus();
    }
  },
};
