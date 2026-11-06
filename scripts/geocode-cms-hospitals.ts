import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
const limit = Math.max(1, Math.min(Number(process.env.GEOCODE_LIMIT || 100), 500));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const rows = await pool.query(
    `SELECT cms_ccn, name, address_line1, city, state, postal_code
     FROM healthcare_facilities
     WHERE data_source = 'CMS_HOSPITAL_GENERAL_INFORMATION'
       AND (latitude IS NULL OR longitude IS NULL)
     ORDER BY state, city, name
     LIMIT $1`,
    [limit]
  );

  let geocoded = 0;
  let skipped = 0;
  let failed = 0;
  try {
    for (const facility of rows.rows) {
      const query = [facility.name, facility.address_line1, facility.city, facility.state, facility.postal_code, 'USA']
        .filter(Boolean).join(', ');
      try {
        const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
        url.searchParams.set('address', query);
        url.searchParams.set('benchmark', 'Public_AR_Current');
        url.searchParams.set('format', 'json');
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`US Census Geocoder returned HTTP ${response.status}`);
        const payload: any = await response.json();
        const match = payload.result?.addressMatches?.[0];
        const longitude = Number(match?.coordinates?.x);
        const latitude = Number(match?.coordinates?.y);
        if (!match || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          skipped += 1;
          continue;
        }
        await pool.query(
          `UPDATE healthcare_facilities
           SET latitude = $2, longitude = $3,
               data_quality_status = 'geocoded', last_verified_at = NOW(), updated_at = NOW()
           WHERE cms_ccn = $1`,
          [facility.cms_ccn, latitude, longitude]
        );
        geocoded += 1;
      } catch (error) {
        failed += 1;
        console.error(`Could not geocode ${facility.cms_ccn}:`, error);
      }
      await sleep(350);
    }
    console.log(JSON.stringify({ examined: rows.rowCount, geocoded, skipped, failed }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('CMS facility geocoding failed:', error);
  process.exitCode = 1;
});
