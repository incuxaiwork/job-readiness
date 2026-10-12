// Verification script for Single Attempt Policy enforcement

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING SINGLE ATTEMPT POLICY VERIFICATION TESTS ===\n');

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

  // 1. Register a fresh test candidate
  const testEmail = `singleattempt_${Date.now()}@university.edu`;
  console.log(`1. Registering candidate (${testEmail})...`);
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Single Attempt Tester',
      email: testEmail,
      mobile: '9876543210',
      college: 'Institute of Technology',
      degree: 'B.Tech',
      branch: 'Computer Science',
      specialization: 'Artificial Intelligence',
      state: 'Telangana',
      city: 'Hyderabad',
      password: 'Password@123'
    })
  });
  const regData = await regRes.json();
  const candToken = regData.token;
  const candId = regData.candidate?.id;
  assert(regRes.ok && !!candToken, `Candidate registered successfully (ID: ${candId})`);

  // 2. First Attempt: Candidate submits assessment
  console.log('\n2. Candidate writing assessment asm-1 for the first time...');
  const firstSubRes = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${candToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assessmentId: 'asm-1',
      candidateId: candId,
      timeTaken: '14 min',
      answers: { 'q-1': 'A' }
    })
  });
  const firstSubData = await firstSubRes.json();
  assert(firstSubRes.ok, `First exam attempt succeeded with HTTP ${firstSubRes.status}`);

  // 3. Second Attempt: Candidate tries to submit the same assessment again
  console.log('\n3. Candidate attempting to re-submit assessment asm-1 (Attempt 2)...');
  // Wait 2.5 seconds to pass idempotent duplicate window
  await new Promise(resolve => setTimeout(resolve, 2500));

  const secondSubRes = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${candToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assessmentId: 'asm-1',
      candidateId: candId,
      timeTaken: '15 min',
      answers: { 'q-1': 'B' }
    })
  });
  const secondSubData = await secondSubRes.json();
  assert(
    secondSubRes.status === 403 && secondSubData.alreadySubmitted,
    `Second attempt blocked with HTTP 403 Forbidden (alreadySubmitted: true)`
  );
  assert(
    secondSubData.error?.includes('already completed'),
    `Error message correctly informs candidate that re-attempts are prohibited`
  );

  // 4. Test question fetching block for completed candidate
  console.log('\n4. Candidate attempting to fetch questions for completed assessment asm-1...');
  const candQuestionsRes = await fetch(`${API_BASE}/assessments/asm-1/questions`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  const candQuestionsData = await candQuestionsRes.json();
  assert(
    candQuestionsRes.status === 403 && candQuestionsData.alreadyCompleted,
    `Question retrieval for completed assessment blocked with HTTP 403 (alreadyCompleted: true)`
  );

  // 5. Test admin can still fetch questions
  console.log('\n5. Admin fetching questions for asm-1...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@readysetjob.com', password: 'Admin@2026' })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;

  const adminQuestionsRes = await fetch(`${API_BASE}/assessments/asm-1/questions`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminQuestionsRes.ok, `Admin can successfully view assessment questions (HTTP ${adminQuestionsRes.status})`);

  // Clean up test candidate
  console.log('\n6. Cleaning up test candidate...');
  await fetch(`${API_BASE}/candidates/${candId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
