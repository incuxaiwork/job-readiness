import { pool } from '../src/db/pool.js';

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('--- DATABASE TABLES IN POSTGRESQL ---');
    res.rows.forEach((r, i) => console.log(`${i + 1}. ${r.table_name}`));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching tables:', err.message);
    process.exit(1);
  }
}

listTables();
