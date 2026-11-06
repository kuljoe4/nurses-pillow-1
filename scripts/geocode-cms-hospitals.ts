import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is required for Places geocoding.');

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
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress',
          },
          body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
        });
        if (!response.ok) throw new Error(`Google Places returned HTTP ${response.status}`);
        const payload: any = await response.json();
        const candidates = Array.isArray(payload.places) ? payload.places : [];
        const expected = String(facility.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = candidates.find((place: any) => {
          const actual = String(place.displayName?.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return actual && (actual.includes(expected) || expected.includes(actual));
        });
        if (!match?.location || !match.id) {
          skipped += 1;
          continue;
        }
        await pool.query(
          `UPDATE healthcare_facilities
           SET latitude = $2, longitude = $3, place_id = $4,
               data_quality_status = 'geocoded', last_verified_at = NOW(), updated_at = NOW()
           WHERE cms_ccn = $1`,
          [facility.cms_ccn, match.location.latitude, match.location.longitude, match.id]
        );
        geocoded += 1;
      } catch (error) {
        failed += 1;
        console.error(`Could not geocode ${facility.cms_ccn}:`, error);
      }
      await sleep(250);
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
