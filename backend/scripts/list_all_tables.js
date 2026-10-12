import { pool } from '../src/db/pool.js';

async function listAllTables() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`📋 Total Tables Found: ${tablesRes.rowCount}\n`);

    const tableDetails = [];

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const countRes = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const columnsRes = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      tableDetails.push({
        table: tableName,
        rowCount: parseInt(countRes.rows[0].count, 10),
        columns: columnsRes.rows.map(c => `${c.column_name} (${c.data_type})`)
      });
    }

    console.log(JSON.stringify(tableDetails, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error querying tables:', err);
    process.exit(1);
  }
}

listAllTables();
