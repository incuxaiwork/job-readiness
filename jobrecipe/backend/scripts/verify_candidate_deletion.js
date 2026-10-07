// Candidate Deletion Multi-Table Verification Script

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('=== RUNNING CANDIDATE MULTI-TABLE DELETION VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`\x1b[32m[PASS]\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`\x1b[31m[FAIL]\x1b[0m ${message}`);
      failed++;
    }
  }

  // 1. Authenticate Admin
  console.log('1. Authenticating Admin...');
  const adminRes = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@readysetjob.com', password: 'Admin@2026' })
  });
  const adminData = await adminRes.json();
  const adminToken = adminData.token;
  assert(adminRes.ok && !!adminToken, 'Admin authenticated successfully');

  // 2. Register a new test candidate
  const testEmail = `testdel_${Date.now()}@university.edu`;
  console.log(`\n2. Registering temporary candidate (${testEmail})...`);
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Deletable Candidate',
      email: testEmail,
      mobile: '9876543210',
      college: 'Test Institute of Technology',
      degree: 'B.Tech',
      branch: 'Computer Science',
      specialization: 'Artificial Intelligence',
      state: 'Telangana',
      city: 'Hyderabad',
      password: 'Password@123'
    })
  });
  const regData = await regRes.json();
  const candId = regData.candidate?.id;
  const candToken = regData.token;
  assert(regRes.ok && !!candId, `Test candidate registered with ID: ${candId}`);

  // 3. Candidate submits an assessment attempt
  console.log('\n3. Candidate submitting assessment attempt...');
  const subRes = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${candToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assessmentId: 'asm-1',
      candidateId: candId,
      timeTaken: '12 min',
      answers: { 'q-1': 'A' }
    })
  });
  assert(subRes.ok, `Assessment submitted by candidate (HTTP ${subRes.status})`);

  // 4. Verify candidate exists in all database tables
  const { pool } = await import('../src/db/pool.js');
  const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [candId]);
  const profileCheck = await pool.query('SELECT id, email FROM candidate_profiles WHERE id = $1 OR user_id = $1', [candId]);
  const candidateCheck = await pool.query('SELECT id FROM candidates WHERE id = $1', [candId]);
  const asmSubCheck = await pool.query('SELECT id FROM assessment_submissions WHERE candidate_id = $1', [candId]);
  const subCheck = await pool.query('SELECT id FROM submissions WHERE candidate_id = $1', [candId]);

  assert(userCheck.rows.length > 0, 'Candidate exists in `users` table');
  assert(profileCheck.rows.length > 0, 'Candidate exists in `candidate_profiles` table');
  assert(candidateCheck.rows.length > 0, 'Candidate exists in `candidates` table');
  assert(asmSubCheck.rows.length > 0, 'Submission exists in `assessment_submissions` table');
  assert(subCheck.rows.length > 0, 'Submission exists in `submissions` table');

  // 5. Delete candidate via Admin API
  console.log(`\n4. Admin executing DELETE /api/candidates/${candId}...`);
  const delRes = await fetch(`${API_BASE}/candidates/${candId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });
  const delData = await delRes.json();
  assert(delRes.ok && delData.success, `Candidate deletion API returned HTTP ${delRes.status} (success: true)`);

  // 6. Verify candidate has been removed from ALL respective database tables
  console.log('\n5. Verifying database state across all tables...');
  const postUserCheck = await pool.query('SELECT id FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)', [candId, testEmail]);
  const postProfileCheck = await pool.query('SELECT id FROM candidate_profiles WHERE id = $1 OR user_id = $1 OR LOWER(email) = LOWER($2)', [candId, testEmail]);
  const postCandidateCheck = await pool.query('SELECT id FROM candidates WHERE id = $1', [candId]);
  const postAsmSubCheck = await pool.query('SELECT id FROM assessment_submissions WHERE candidate_id = $1 OR LOWER(candidate_email) = LOWER($2)', [candId, testEmail]);
  const postSubCheck = await pool.query('SELECT id FROM submissions WHERE candidate_id = $1', [candId]);

  assert(postUserCheck.rows.length === 0, 'Candidate successfully DELETED from `users` table');
  assert(postProfileCheck.rows.length === 0, 'Candidate successfully DELETED from `candidate_profiles` table');
  assert(postCandidateCheck.rows.length === 0, 'Candidate successfully DELETED from `candidates` table');
  assert(postAsmSubCheck.rows.length === 0, 'Submissions successfully DELETED from `assessment_submissions` table');
  assert(postSubCheck.rows.length === 0, 'Submissions successfully DELETED from `submissions` table');

  // 7. Verify login is rejected
  console.log('\n6. Verifying deleted candidate cannot authenticate...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Password@123' })
  });
  assert(loginRes.status === 401, `Deleted candidate login rejected with HTTP ${loginRes.status}`);

  // 8. Verify admin candidate roster does not include deleted candidate
  console.log('\n7. Verifying candidate roster via GET /api/candidates...');
  const rosterRes = await fetch(`${API_BASE}/candidates`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const rosterData = await rosterRes.json();
  const foundInRoster = (rosterData.data || []).some(c => c.id === candId || c.email === testEmail);
  assert(!foundInRoster, 'Candidate no longer appears in Admin Candidates roster');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
