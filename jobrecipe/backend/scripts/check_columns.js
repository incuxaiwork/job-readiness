import { pool } from '../src/db/pool.js';

async function main() {
  const c = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='questions' ORDER BY ordinal_position"
  );
  console.log(c.rows);
  await pool.end();
}

main().catch(console.error);
