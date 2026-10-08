import { pool } from '../src/db/pool.js';
import { clearAssessmentsCache } from '../src/controllers/assessments.controller.js';

async function main() {
  if (!pool) {
    console.log('No pool configured, skipping db update');
    return;
  }
  try {
    await pool.query('UPDATE assessments SET duration_minutes = 10, updated_at = CURRENT_TIMESTAMP');
    console.log('✅ Updated all assessments to duration_minutes = 10');

    clearAssessmentsCache();

    const res = await pool.query('SELECT id, title, category, duration_minutes, total_questions FROM assessments ORDER BY id');
    console.log('\nUpdated Assessments in PostgreSQL:');
    for (const a of res.rows) {
      console.log(` - [${a.category}] ${a.title}: ${a.total_questions} questions, ${a.duration_minutes} minutes`);
    }
  } catch (err) {
    console.error('Error updating assessments:', err.message);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
