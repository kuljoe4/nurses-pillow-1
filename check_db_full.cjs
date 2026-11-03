const { Pool } = require('pg');
const url = process.env.DATABASE_URL;

console.log('--- ENV CHECK ---');
console.log('URL exists:', !!url);
console.log('URL (full):', url);

async function testConnection() {
  if (!url) return;
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('--- CONNECTION SUCCESS ---');
    console.log('Time:', res.rows[0].now);
  } catch (err) {
    console.error('--- CONNECTION FAILURE ---');
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
