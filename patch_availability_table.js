import { db } from './server/db.js';

async function patch() {
  console.log('Applying availability table patch...');
  try {
    await db.query(`
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
    `);
    console.log('Patch applied successfully.');
  } catch (error) {
    console.error('Patch failed:', error);
  }
  process.exit(0);
}

patch();
