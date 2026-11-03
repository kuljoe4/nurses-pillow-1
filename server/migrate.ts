import { db } from './db';

async function migrate() {
  console.log('Starting migration...');
  try {
    await db.initDb();
    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
