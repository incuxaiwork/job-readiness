import { pool } from '../src/db/pool.js';

async function clearCandidates() {
  console.log('🧹 Clearing all candidate records from PostgreSQL database...');
  try {
    const answers = await pool.query('DELETE FROM candidate_answers RETURNING id');
    console.log(`- Deleted ${answers.rowCount} rows from candidate_answers`);

    const attempts = await pool.query('DELETE FROM test_attempts RETURNING id');
    console.log(`- Deleted ${attempts.rowCount} rows from test_attempts`);

    const perf = await pool.query('DELETE FROM performance_analysis RETURNING id');
    console.log(`- Deleted ${perf.rowCount} rows from performance_analysis`);

    const skillPerf = await pool.query('DELETE FROM skill_performance RETURNING id');
    console.log(`- Deleted ${skillPerf.rowCount} rows from skill_performance`);

    const compRead = await pool.query('DELETE FROM company_readiness RETURNING id');
    console.log(`- Deleted ${compRead.rowCount} rows from company_readiness`);

    const rep = await pool.query('DELETE FROM reports RETURNING id');
    console.log(`- Deleted ${rep.rowCount} rows from reports`);

    const sub = await pool.query('DELETE FROM submissions RETURNING id');
    console.log(`- Deleted ${sub.rowCount} rows from submissions`);

    const cp = await pool.query('DELETE FROM candidate_profiles RETURNING id');
    console.log(`- Deleted ${cp.rowCount} rows from candidate_profiles`);

    const c = await pool.query('DELETE FROM candidates RETURNING id');
    console.log(`- Deleted ${c.rowCount} rows from candidates`);

    const u = await pool.query("DELETE FROM users WHERE role = 'candidate' RETURNING id");
    console.log(`- Deleted ${u.rowCount} rows from users (candidate accounts)`);

    console.log('✅ All candidate records successfully deleted from PostgreSQL database.');
  } catch (err) {
    console.error('❌ Error clearing candidates:', err.message);
  } finally {
    await pool.end();
  }
}

clearCandidates();
