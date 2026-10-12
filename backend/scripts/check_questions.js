import { pool } from '../src/db/pool.js';

async function main() {
  const qRes = await pool.query('SELECT id, category, topic, question FROM questions ORDER BY category, id');
  console.log(`Total questions in questions table: ${qRes.rows.length}`);
  for (const q of qRes.rows) {
    console.log(`- [${q.category}] ${q.id}: ${q.question.substring(0, 60)}...`);
  }

  const asmRes = await pool.query('SELECT id, title, category, total_questions FROM assessments ORDER BY id');
  console.log(`\nTotal assessments: ${asmRes.rows.length}`);
  for (const a of asmRes.rows) {
    const linked = await pool.query('SELECT count(*) FROM assessment_questions WHERE assessment_id = $1', [a.id]);
    console.log(`- [${a.category}] ${a.id}: ${a.title} (total_questions field: ${a.total_questions}, linked in assessment_questions: ${linked.rows[0].count})`);
  }

  await pool.end();
}

main().catch(console.error);
