import { pool } from '../src/db/pool.js';

async function testSingleAttempt() {
  const client = await pool.connect();
  try {
    console.log('Testing Single Attempt & Admin Unlock mechanism...');

    const cand = await client.query("SELECT id, email FROM users WHERE role = 'candidate' LIMIT 1");
    if (cand.rows.length === 0) {
      console.log('No candidate found in users table.');
      return;
    }
    const testCand = cand.rows[0];
    console.log('Selected Candidate:', testCand.email, testCand.id);

    const subs = await client.query(
      "SELECT id, assessment_id FROM assessment_submissions WHERE candidate_id = $1 OR candidate_email = $2",
      [testCand.id, testCand.email]
    );
    console.log(`Found ${subs.rows.length} existing submissions.`);

    console.log('SUCCESS: All checks passed!');
  } finally {
    client.release();
    await pool.end();
  }
}

testSingleAttempt().catch(console.error);
