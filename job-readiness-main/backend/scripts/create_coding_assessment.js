import { pool } from '../src/db/pool.js';

async function main() {
  const asmId = 'asm-coding-mastery';
  await pool.query(
    `INSERT INTO assessments (id, title, category, description, difficulty, duration_minutes, total_questions, total_marks, passing_score, status)
     VALUES ($1, 'Software Engineering Coding Assessment', 'Coding', 'Hands-on practical coding challenges in Java, Python, C++, and JavaScript with real-time test case evaluation.', 'Medium', 60, 3, 30, 60, 'Active')
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       category = 'Coding',
       total_questions = 3,
       total_marks = 30,
       status = 'Active'`,
    [asmId]
  );

  const codingQIds = ['code-q-array-sum-01', 'code-q-palindrome-02', 'code-q-factorial-03'];
  for (const qId of codingQIds) {
    const qRes = await pool.query('SELECT * FROM questions WHERE id = $1', [qId]);
    if (qRes.rows.length > 0) {
      const q = qRes.rows[0];
      await pool.query(
        `INSERT INTO assessment_questions (id, assessment_id, question_id, category, topic, question, difficulty, marks, test_cases, starter_templates, constraints)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           test_cases = EXCLUDED.test_cases,
           starter_templates = EXCLUDED.starter_templates,
           constraints = EXCLUDED.constraints`,
        [
          `aq-${asmId}-${q.id}`,
          asmId,
          q.id,
          q.category,
          q.topic,
          q.question,
          q.difficulty,
          q.marks || 10,
          JSON.stringify(q.test_cases),
          JSON.stringify(q.starter_templates),
          q.constraints
        ]
      );
    }
  }
  console.log('✅ Created Software Engineering Coding Assessment (asm-coding-mastery) with 3 coding challenges');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
