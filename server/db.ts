import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { railwayDb } from '../src/services/railway.js';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool: pg.Pool | null = null;
let pgConnected = false;
let lastConnectionError: string | null = null;

// Initialize Postgres pool only with real connection string
if (process.env.DATABASE_URL) {
  try {
    const rawDbUrl = process.env.DATABASE_URL;
    const connectionString = rawDbUrl.startsWith('postgresql+asyncpg://')
      ? rawDbUrl.replace('postgresql+asyncpg://', 'postgresql://')
      : rawDbUrl;

    const isRemoteDb = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

    pool = new pg.Pool({
      connectionString,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 20,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Database pool background error:', err.message);
      pgConnected = false;
      lastConnectionError = err.message;
    });

    // Test connection asynchronously
    pool
      .query('SELECT NOW() as current_time')
      .then((res) => {
        pgConnected = true;
        lastConnectionError = null;
      })
      .catch((err) => {
        pgConnected = false;
        lastConnectionError = err.message;
        console.error(`[PostgreSQL] ❌ Database connection failed: ${err.message}`);
      });
  } catch (err: any) {
    console.error('[PostgreSQL] Database pool initialization error:', err.message);
    lastConnectionError = err.message;
    pool = null;
  }
}

export const db = {
  /**
   * Executes a query against the live PostgreSQL database.
   * STRICT: No in-memory fallback. Throws error if database is unavailable.
   */
  query: async (text: string, params?: any[]): Promise<any> => {
    // 1. Primary: Railway Database Manager
    if (railwayDb.isReady()) {
      return await railwayDb.query(text, params);
    }

    // 2. Direct PostgreSQL Pool
    if (pool) {
      let retries = 3;
      while (retries > 0) {
        try {
          const result = params && params.length > 0
            ? await pool.query(text, params)
            : await pool.query(text);
          pgConnected = true;
          lastConnectionError = null;

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
            console.warn(`[PostgreSQL] Connection lost (${err.message}). Retrying (${retries} retries left)...`);
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
          console.error('[PostgreSQL] Query execution error:', err.message);
          throw err;
        }
      }
    }

    const errorMsg =
      lastConnectionError ||
      'No active PostgreSQL database connection. Verify DATABASE_URL in environment variables.';
    console.error(`[PostgreSQL] ${errorMsg}`);
    throw new Error(`Database Error: ${errorMsg}`);
  },

  /**
   * Initializes the database schema using server/schema.sql on the live PostgreSQL instance.
   */
  initDb: async () => {
    try {
      // 1. Try Railway initialization
      const railwayOk = await railwayDb.initialize();
      if (railwayOk) {
        // Ensure extensions exist
        await railwayDb.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
        await railwayDb.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);

        // Ensure reset password & verification columns exist
        await railwayDb.query(`
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE,
          ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_nurse_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_host_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30),
          ADD COLUMN IF NOT EXISTS clinical_license_number VARCHAR(100),
          ADD COLUMN IF NOT EXISTS clinical_state_board VARCHAR(100),
          ADD COLUMN IF NOT EXISTS profession_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS specialty VARCHAR(150),
          ADD COLUMN IF NOT EXISTS profession_specialty VARCHAR(150),
          ADD COLUMN IF NOT EXISTS clinical_document_url TEXT,
          ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified',
          ADD COLUMN IF NOT EXISTS primary_source_name VARCHAR(150),
          ADD COLUMN IF NOT EXISTS stripe_connected_account_id VARCHAR(100),
          ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS document_purged BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS document_purged_at TIMESTAMPTZ;
        `);

        // Set default value for security_deposit_amount
        await railwayDb.query(`ALTER TABLE listings ALTER COLUMN security_deposit_amount SET DEFAULT 0;`);
        await railwayDb.query(`ALTER TABLE listings ADD COLUMN IF NOT EXISTS extra_options JSONB DEFAULT '[]'::jsonb;`);

        // Sanitize existing listings records to enforce security_deposit defaults
        await railwayDb.query(`UPDATE listings SET security_deposit_amount = 0 WHERE security_deposit_amount IS NULL;`);

        // Ensure favorites table and indexes exist
        await railwayDb.query(`
          CREATE TABLE IF NOT EXISTS favorites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255) NOT NULL,
            listing_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT uq_favorites_user_listing UNIQUE (user_id, listing_id)
          );
          CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);

          ALTER TABLE bookings
          ADD COLUMN IF NOT EXISTS start_date DATE,
          ADD COLUMN IF NOT EXISTS end_date DATE,
          ADD COLUMN IF NOT EXISTS room_id UUID,
          ADD COLUMN IF NOT EXISTS traveler_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS traveler_user_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS pet_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS parking_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS extra_options_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS deposit_hold_amount NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS gross_booking_value NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS host_platform_fee_amount NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS host_payout_amount NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS cancellation_policy_agreed VARCHAR(50) DEFAULT 'flexible',
          ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'uncaptured',
          ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS stripe_transfer_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS deposit_hold_payment_intent_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS traveler_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS listing_title VARCHAR(255),
          ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
        `);
        return;
      }

      // 2. Direct pool migration
      if (pool) {
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          await pool.query(schema);
          console.log('[PostgreSQL] Database schema initialized successfully from schema.sql');
        }

        await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);

        await pool.query(`
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE,
          ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_nurse_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_host_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30),
          ADD COLUMN IF NOT EXISTS clinical_license_number VARCHAR(100),
          ADD COLUMN IF NOT EXISTS clinical_state_board VARCHAR(100),
          ADD COLUMN IF NOT EXISTS profession_type VARCHAR(100),
          ADD COLUMN IF NOT EXISTS specialty VARCHAR(150),
          ADD COLUMN IF NOT EXISTS profession_specialty VARCHAR(150),
          ADD COLUMN IF NOT EXISTS clinical_document_url TEXT,
          ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified',
          ADD COLUMN IF NOT EXISTS primary_source_name VARCHAR(150),
          ADD COLUMN IF NOT EXISTS stripe_connected_account_id VARCHAR(100),
          ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS document_purged BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS document_purged_at TIMESTAMPTZ;
        `);

        // Set default value for security_deposit_amount
        await pool.query(`ALTER TABLE listings ALTER COLUMN security_deposit_amount SET DEFAULT 0;`);
        await pool.query(`ALTER TABLE listings ADD COLUMN IF NOT EXISTS extra_options JSONB DEFAULT '[]'::jsonb;`);

        // Sanitize existing listings records to enforce security_deposit defaults
        await pool.query(`UPDATE listings SET security_deposit_amount = 0 WHERE security_deposit_amount IS NULL;`);

        // Ensure favorites table and indexes exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS favorites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR(255) NOT NULL,
            listing_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT uq_favorites_user_listing UNIQUE (user_id, listing_id)
          );
          CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);

          ALTER TABLE bookings
          ADD COLUMN IF NOT EXISTS start_date DATE,
          ADD COLUMN IF NOT EXISTS end_date DATE,
          ADD COLUMN IF NOT EXISTS room_id UUID,
          ADD COLUMN IF NOT EXISTS traveler_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS traveler_user_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS pet_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS parking_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS extra_options_fee NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS deposit_hold_amount NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS gross_booking_value NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS host_platform_fee_amount NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS host_payout_amount NUMERIC DEFAULT 0,
          ADD COLUMN IF NOT EXISTS cancellation_policy_agreed VARCHAR(50) DEFAULT 'flexible',
          ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'uncaptured',
          ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS stripe_transfer_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS deposit_hold_payment_intent_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS traveler_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS listing_title VARCHAR(255),
          ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
        `);
      } else {
        console.warn(`[PostgreSQL] Live database not yet connected: ${lastConnectionError || 'DATABASE_URL pending'}`);
      }
    } catch (error: any) {
      console.warn('[PostgreSQL] Schema initialization warning:', error.message);
    }
  },

  getStatus: async () => {
    return railwayDb.getStatus();
  },

  isConnected: () => pgConnected || railwayDb.isReady(),
  getLastError: () => lastConnectionError,
};
