// Security Verification Test Script (Uses native fetch in Node 18+)

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING SECURITY REMEDIATION VERIFICATION TESTS ===\n');

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

  // 1. Authenticate Candidate 1
  console.log('1. Authenticating Candidate 1 (testlogin@gmail.com)...');
  const candLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testlogin@gmail.com', password: 'Password@123' })
  });
  const candLoginData = await candLoginRes.json();
  const candToken = candLoginData.token;
  const cand1 = candLoginData.candidate;
  assert(candLoginRes.ok && !!candToken, `Candidate login successful (ID: ${cand1?.id})`);

  // Check rate limit headers
  const rateLimitHeader = candLoginRes.headers.get('ratelimit-limit') || candLoginRes.headers.get('x-ratelimit-limit');
  assert(!!rateLimitHeader, `Rate limiting headers present on /auth/login (Limit: ${rateLimitHeader})`);

  // 2. Authenticate Admin
  console.log('\n2. Authenticating Admin (admin@readysetjob.com)...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@readysetjob.com', password: 'Admin@2026' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;
  assert(adminLoginRes.ok && !!adminToken, 'Admin login successful');

  // Candidate 2 ID for IDOR tests
  const cand2Id = 'cand-1788851031862-2e9d53a7';

  // 3. Test Question Leakage - Candidate View
  console.log('\n3. Testing Question Leakage: Candidate GET /api/questions...');
  const candQuestionsRes = await fetch(`${API_BASE}/questions`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  const candQuestionsData = await candQuestionsRes.json();
  const candQuestions = candQuestionsData.data || [];
  const candidateHasAnyAnswers = candQuestions.some(q => q.correct_answer !== undefined || q.explanation !== undefined);
  assert(candQuestions.length > 0, `Candidate retrieved ${candQuestions.length} questions`);
  assert(!candidateHasAnyAnswers, 'Candidate CANNOT view correct_answer or explanation in /api/questions');

  // 4. Test Question Leakage - Admin View
  console.log('\n4. Testing Question Answer Availability: Admin GET /api/questions...');
  const adminQuestionsRes = await fetch(`${API_BASE}/questions`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminQuestionsData = await adminQuestionsRes.json();
  const adminQuestions = adminQuestionsData.data || [];
  const adminHasAnswers = adminQuestions.some(q => q.correct_answer !== undefined);
  assert(adminQuestions.length > 0, `Admin retrieved ${adminQuestions.length} questions`);
  assert(adminHasAnswers, 'Admin CAN view correct_answer in /api/questions for management');

  // 5. Test Assessment Questions Leakage - Candidate View
  console.log('\n5. Testing Assessment Questions: Candidate GET /api/assessments/asm-1/questions...');
  const asmQRes = await fetch(`${API_BASE}/assessments/asm-1/questions`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  const asmQData = await asmQRes.json();
  const asmQuestions = asmQData.data || [];
  const asmHasAnswers = asmQuestions.some(q => q.correct_answer !== undefined);
  assert(!asmHasAnswers, 'Candidate CANNOT view correct_answer in /api/assessments/:id/questions');

  // 6. Test IDOR - Candidate accessing own profile
  console.log('\n6. Testing IDOR: Candidate 1 GET /api/candidates/:cand1Id (Self Access)...');
  const selfRes = await fetch(`${API_BASE}/candidates/${cand1.id}`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  assert(selfRes.status === 200, `Candidate 1 successfully accessed own profile (HTTP ${selfRes.status})`);

  // 7. Test IDOR - Candidate accessing Candidate 2's profile
  console.log('\n7. Testing IDOR: Candidate 1 GET /api/candidates/:cand2Id (Cross-Account Access)...');
  const idorGetRes = await fetch(`${API_BASE}/candidates/${cand2Id}`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  assert(idorGetRes.status === 403, `IDOR prevented: Cross-account GET profile blocked with HTTP ${idorGetRes.status}`);

  // 8. Test IDOR - Candidate updating Candidate 2's academic marks
  console.log('\n8. Testing IDOR: Candidate 1 PUT /api/candidates/:cand2Id/academic-marks...');
  const idorPutMarksRes = await fetch(`${API_BASE}/candidates/${cand2Id}/academic-marks`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${candToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cgpa: 9.9, tenthMarks: 99, activeBacklogs: 0 })
  });
  assert(idorPutMarksRes.status === 403, `IDOR prevented: Cross-account academic marks modification blocked with HTTP ${idorPutMarksRes.status}`);

  // 9. Test IDOR - Candidate updating Candidate 2's profile details
  console.log('\n9. Testing IDOR: Candidate 1 PUT /api/candidates/:cand2Id (Profile Overwrite)...');
  const idorPutProfileRes = await fetch(`${API_BASE}/candidates/${cand2Id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${candToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fullName: 'Hacked Name' })
  });
  assert(idorPutProfileRes.status === 403, `IDOR prevented: Cross-account profile edit blocked with HTTP ${idorPutProfileRes.status}`);

  // 10. Test Submission Identity Spoofing
  console.log('\n10. Testing Submission Identity Spoofing: Candidate 1 submitting for Candidate 2...');
  const spoofSubRes = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${candToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assessmentId: 'asm-1',
      candidateId: cand2Id, // Spoofed ID
      answers: { 'q-1': 'A' }
    })
  });
  assert(spoofSubRes.status === 403, `Identity spoofing prevented: Submission blocked with HTTP ${spoofSubRes.status}`);

  // 11. Test Legitimate Assessment Submission with Authoritative Scoring
  console.log('\n11. Testing Legitimate Submission with Authoritative Server Evaluation...');
  const validSubRes = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${candToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assessmentId: 'asm-1',
      candidateId: cand1.id,
      answers: {
        'q-1': 'A',
        'q-2': 'B',
        'q-3': 'C'
      },
      timeTaken: '15 min'
    })
  });
  // 12. Test Correct Assessment Scoring (Authoritative Evaluation calculates accurate positive score)
  console.log('\n12. Testing Authoritative Evaluation with Correct Answers...');
  const sampleQ = adminQuestions[0];
  if (sampleQ && sampleQ.id && sampleQ.correct_answer) {
    const scoredSubRes = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${candToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assessmentId: 'asm-1',
        candidateId: cand1.id,
        questionIds: [sampleQ.id],
        answers: {
          [sampleQ.id]: sampleQ.correct_answer
        },
        timeTaken: '10 min'
      })
    });
    const scoredSubData = await scoredSubRes.json();
    assert(scoredSubRes.ok, `Submission with correct answer succeeded (HTTP ${scoredSubRes.status})`);
    assert(scoredSubData.data?.correct_count >= 1, `Backend correctly identified correct answer (correct_count: ${scoredSubData.data?.correct_count})`);
    assert(scoredSubData.data?.score === 100, `Score accurately evaluated as 100% by backend (score: ${scoredSubData.data?.score})`);
    assert(scoredSubData.data?.accuracy === 100, `Accuracy accurately evaluated as 100% (accuracy: ${scoredSubData.data?.accuracy})`);
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
