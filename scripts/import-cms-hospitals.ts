import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required to import the CMS hospital directory.');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

const DATASET_ID = 'xubh-q36u';
const PAGE_SIZE = 2000;
const API_URL = `https://data.cms.gov/provider-data/api/1/datastore/query/${DATASET_ID}/0`;

function value(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const found = row[key];
    if (found !== undefined && found !== null && String(found).trim() !== '') return String(found).trim();
  }
  return '';
}

async function fetchPage(offset: number) {
  const url = new URL(API_URL);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`CMS API returned HTTP ${response.status}`);
  const payload: any = await response.json();
  const rows = payload.data || payload.results || payload.rows || [];
  if (!Array.isArray(rows)) throw new Error('Unexpected CMS API response: expected a data array.');
  return rows as Record<string, unknown>[];
}

async function main() {
  await pool.query(`
    ALTER TABLE healthcare_facilities
      ALTER COLUMN latitude DROP NOT NULL,
      ALTER COLUMN longitude DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS cms_ccn VARCHAR(20),
      ADD COLUMN IF NOT EXISTS npi VARCHAR(20),
      ADD COLUMN IF NOT EXISTS facility_type VARCHAR(120),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
      ADD COLUMN IF NOT EXISTS county VARCHAR(100),
      ADD COLUMN IF NOT EXISTS data_source VARCHAR(80) DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS data_quality_status VARCHAR(30) DEFAULT 'needs_geocoding';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_healthcare_facilities_cms_ccn
      ON healthcare_facilities(cms_ccn);
  `);

  const run = await pool.query(
    `INSERT INTO healthcare_directory_imports (source, status) VALUES ('CMS_HOSPITAL_GENERAL_INFORMATION', 'running') RETURNING id`
  );
  const importId = run.rows[0].id;
  let seen = 0;
  let inserted = 0;
  let updated = 0;
  let rejected = 0;

  try {
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const rows = await fetchPage(offset);
      if (rows.length === 0) break;

      for (const row of rows) {
        seen += 1;
        const ccn = value(row, 'facility_id', 'Facility ID');
        const name = value(row, 'facility_name', 'Facility Name');
        const address = value(row, 'address', 'Address');
        const city = value(row, 'citytown', 'City/Town');
        const state = value(row, 'state', 'State').toUpperCase();
        const zip = value(row, 'zip_code', 'ZIP Code');
        if (!ccn || !name || !address || !city || !/^[A-Z]{2}$/.test(state) || !zip) {
          rejected += 1;
          continue;
        }

        const values = [
          ccn, name, address, city, state, zip,
          value(row, 'hospital_type', 'Hospital Type') || null,
          value(row, 'telephone_number', 'Telephone Number') || null,
          value(row, 'countyparish', 'County/Parish') || null,
        ];
        // Attach the CMS identifier to an existing matching seeded/manual record first,
        // preserving its known coordinates and preventing duplicate facility cards.
        const matched = await pool.query(
          `UPDATE healthcare_facilities SET
             cms_ccn = $1, name = $2, address_line1 = $3, city = $4, state = $5, postal_code = $6,
             facility_type = $7, phone = $8, county = $9,
             data_source = 'CMS_HOSPITAL_GENERAL_INFORMATION', last_seen_at = NOW(),
             is_active = TRUE, updated_at = NOW()
           WHERE cms_ccn = $1
              OR (cms_ccn IS NULL AND LOWER(name) = LOWER($2) AND UPPER(state) = $5 AND postal_code = $6)`,
          values
        );
        if (matched.rowCount) {
          updated += 1;
        } else {
          await pool.query(
            `INSERT INTO healthcare_facilities
              (id, name, address_line1, city, state, postal_code, cms_ccn, facility_type, phone, county,
               data_source, last_seen_at, data_quality_status, is_active)
             VALUES
              ('cms_' || $1, $2, $3, $4, $5, $6, $1, $7, $8, $9,
               'CMS_HOSPITAL_GENERAL_INFORMATION', NOW(), 'needs_geocoding', TRUE)
             ON CONFLICT (cms_ccn) DO UPDATE SET
               name = EXCLUDED.name, address_line1 = EXCLUDED.address_line1,
               city = EXCLUDED.city, state = EXCLUDED.state, postal_code = EXCLUDED.postal_code,
               facility_type = EXCLUDED.facility_type, phone = EXCLUDED.phone, county = EXCLUDED.county,
               data_source = EXCLUDED.data_source, last_seen_at = NOW(), is_active = TRUE, updated_at = NOW()`,
            values
          );
          inserted += 1;
        }
      }

      console.log(`CMS import: processed ${seen} records...`);
      if (rows.length < PAGE_SIZE) break;
    }

    await pool.query(
      `UPDATE healthcare_directory_imports
       SET records_seen = $2, records_inserted = $3, records_updated = $4,
           records_rejected = $5, status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [importId, seen, inserted, updated, rejected]
    );
    console.log(JSON.stringify({ importId, seen, inserted, updated, rejected }, null, 2));
  } catch (error: any) {
    await pool.query(
      `UPDATE healthcare_directory_imports
       SET records_seen = $2, records_inserted = $3, records_updated = $4,
           records_rejected = $5, status = 'failed', completed_at = NOW(), error_message = $6
       WHERE id = $1`,
      [importId, seen, inserted, updated, rejected, String(error?.message || error)]
    );
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('CMS hospital import failed:', error);
  process.exitCode = 1;
});
