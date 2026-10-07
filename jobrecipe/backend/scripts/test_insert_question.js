import { pool } from '../src/db/pool.js';

async function testInsert() {
  try {
    console.log('Testing question INSERT into PostgreSQL...');

    const sampleQ = {
      id: 'q-9999',
      category: 'Aptitude',
      topic: 'Speed & Distance',
      difficulty: 'Easy',
      type: 'Single Choice',
      question: 'Test question for DB verification',
      options: JSON.stringify([{ id: 'A', text: '10' }, { id: 'B', text: '20' }]),
      correct_answer: 'A',
      explanation: 'Sample test explanation',
      marks: 4,
      time_limit_sec: 60,
      tags: ['Test']
    };

    const res = await pool.query(
      `INSERT INTO questions (id, category, topic, difficulty, type, question, options, correct_answer, explanation, marks, time_limit_sec, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question
       RETURNING *`,
      [
        sampleQ.id, sampleQ.category, sampleQ.topic, sampleQ.difficulty, sampleQ.type,
        sampleQ.question, sampleQ.options, sampleQ.correct_answer, sampleQ.explanation,
        sampleQ.marks, sampleQ.time_limit_sec, sampleQ.tags
      ]
    );

    console.log('✅ INSERT Result:', res.rows[0]);

    const selectRes = await pool.query('SELECT COUNT(*) FROM questions');
    console.log(`✅ Total questions in DB: ${selectRes.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ INSERT Error:', err);
    process.exit(1);
  }
}

testInsert();
