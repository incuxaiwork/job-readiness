import { pool } from '../src/db/pool.js';

async function fixTable() {
  try {
    await pool.query('DROP TABLE IF EXISTS assessment_submissions CASCADE;');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assessment_submissions (
        id VARCHAR(64) PRIMARY KEY,
        candidate_id VARCHAR(64),
        candidate_name VARCHAR(255),
        candidate_email VARCHAR(255),
        assessment_id VARCHAR(64),
        assessment_title VARCHAR(255),
        score INT NOT NULL DEFAULT 0,
        accuracy INT NOT NULL DEFAULT 0,
        correct_count INT NOT NULL DEFAULT 0,
        incorrect_count INT NOT NULL DEFAULT 0,
        unanswered_count INT NOT NULL DEFAULT 0,
        time_taken VARCHAR(64),
        category_scores JSONB,
        topic_breakdown JSONB,
        answers JSONB,
        status VARCHAR(32) DEFAULT 'Completed',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS unanswered_count INT DEFAULT 0;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS time_taken VARCHAR(64);
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS category_scores JSONB;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS topic_breakdown JSONB;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS answers JSONB;
    `);

    console.log('✅ Recreated assessment_submissions and patched submissions table successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing tables:', err.message);
    process.exit(1);
  }
}

fixTable();
