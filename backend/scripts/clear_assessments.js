import { pool } from '../src/db/pool.js';

async function clearAssessments() {
  console.log('🧹 Clearing dummy assessments and related database tables...');
  try {
    const attempts = await pool.query('DELETE FROM test_attempts RETURNING id');
    console.log(`- Deleted ${attempts.rowCount} rows from test_attempts`);

    const answers = await pool.query('DELETE FROM candidate_answers RETURNING id');
    console.log(`- Deleted ${answers.rowCount} rows from candidate_answers`);

    const perf = await pool.query('DELETE FROM performance_analysis RETURNING id');
    console.log(`- Deleted ${perf.rowCount} rows from performance_analysis`);

    const skillPerf = await pool.query('DELETE FROM skill_performance RETURNING id');
    console.log(`- Deleted ${skillPerf.rowCount} rows from skill_performance`);

    const aq = await pool.query('DELETE FROM assessment_questions RETURNING id');
    console.log(`- Deleted ${aq.rowCount} rows from assessment_questions`);

    const sec = await pool.query('DELETE FROM assessment_sections RETURNING id');
    console.log(`- Deleted ${sec.rowCount} rows from assessment_sections`);

    const sub = await pool.query('DELETE FROM submissions RETURNING id');
    console.log(`- Deleted ${sub.rowCount} rows from submissions`);

    const asm = await pool.query('DELETE FROM assessments RETURNING id');
    console.log(`- Deleted ${asm.rowCount} rows from assessments`);

    console.log('✅ All dummy assessments and related records cleared from PostgreSQL successfully.');
  } catch (err) {
    console.error('❌ Error clearing assessments:', err.message);
  } finally {
    await pool.end();
  }
}

clearAssessments();
