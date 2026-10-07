import { pool } from '../src/db/pool.js';

async function clearQuestions() {
  try {
    console.log('🔄 Clearing all questions from database...');

    // Clear questions from questions table
    const result = await pool.query('DELETE FROM questions RETURNING id');
    console.log(`✅ Successfully deleted ${result.rowCount} questions from PostgreSQL database.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing questions:', err);
    process.exit(1);
  }
}

clearQuestions();
