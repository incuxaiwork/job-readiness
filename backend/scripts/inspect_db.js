import { pool } from '../src/db/pool.js';

async function inspect() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📦 Total Tables:', tablesRes.rows.length);

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const countRes = await pool.query(`SELECT count(*) FROM ${tableName}`);
      const colsRes = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      console.log(`\n==================================================`);
      console.log(`📊 TABLE: ${tableName.toUpperCase()} (Total Rows: ${countRes.rows[0].count})`);
      console.log(`==================================================`);
      console.table(colsRes.rows);

      const sampleRes = await pool.query(`SELECT * FROM ${tableName} LIMIT 2`);
      if (sampleRes.rows.length > 0) {
        console.log(`🔍 Sample Data (${tableName}):`);
        console.log(JSON.stringify(sampleRes.rows, null, 2));
      }
    }
  } catch (err) {
    console.error('Error inspecting DB:', err.message);
  } finally {
    await pool.end();
  }
}

inspect();
