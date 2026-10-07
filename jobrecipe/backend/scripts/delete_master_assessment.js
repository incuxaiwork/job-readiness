import { pool } from '../src/db/pool.js';
import { clearAssessmentsCache } from '../src/controllers/assessments.controller.js';

async function main() {
  const aqRes = await pool.query('DELETE FROM assessment_questions WHERE assessment_id = $1', ['asm-all-2026']);
  console.log(`Deleted ${aqRes.rowCount} linked questions for asm-all-2026`);

  const asmRes = await pool.query('DELETE FROM assessments WHERE id = $1 RETURNING id, title', ['asm-all-2026']);
  console.log('Deleted assessment:', asmRes.rows);

  clearAssessmentsCache();

  const remaining = await pool.query('SELECT id, title, category, total_questions FROM assessments ORDER BY id');
  console.log('\nRemaining Assessments in Database:');
  for (const r of remaining.rows) {
    console.log(` - [${r.category}] ${r.id}: ${r.title} (${r.total_questions} questions)`);
  }

  await pool.end();
}

main().catch(console.error);
