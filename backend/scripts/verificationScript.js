const TARGET_URL = process.env.TEST_TARGET || 'http://127.0.0.1:5000';

async function makeRequest(method, path, body = null, headers = {}) {
  const startTime = Date.now();
  const url = `${TARGET_URL}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const latency = Date.now() - startTime;
    const data = await res.json().catch(() => null);

    return {
      status: res.status,
      latency,
      success: res.status >= 200 && res.status < 300,
      data,
    };
  } catch (err) {
    const latency = Date.now() - startTime;
    return {
      status: 0,
      latency,
      success: false,
      error: err.message,
    };
  }
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { p50, p95, p99 };
}

async function runVerification() {
  console.log('===============================================================');
  console.log('🧪 ReadySetJob Scalability & Optimization Acceptance Test Suite');
  console.log('===============================================================');
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Time  : ${new Date().toISOString()}\n`);

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  // 0. Health Check
  console.log('── Step 0: Server Health & DB Connectivity ───────────────────');
  const healthRes = await makeRequest('GET', '/api/health');
  assert(healthRes.status === 200 && healthRes.data?.status === 'online', 'Health endpoint returns 200 online', `Status: ${healthRes.status}`);
  assert(healthRes.data?.database?.includes('connected'), 'Database connection is active and healthy');

  // 1. Candidate Registration & Duplicate Rejection
  console.log('\n── Step 1: Candidate Registration & Conflict Protection ────────');
  const timestamp = Date.now();
  const testCandidate = {
    name: 'Performance Test Candidate',
    email: `perf_${timestamp}@example.com`,
    mobile: '9876543210',
    college: 'BITS Pilani',
    degree: 'B.Tech',
    branch: 'Computer Science',
    specialization: 'Cloud Computing',
    state: 'Telangana',
    city: 'Hyderabad',
    password: 'TestPassword123!'
  };

  const regRes = await makeRequest('POST', '/api/auth/register', testCandidate);
  assert(regRes.status === 201 && regRes.data?.success === true, 'Candidate registered successfully (201 Created)', `Status: ${regRes.status}`);
  assert(Boolean(regRes.data?.token), 'Registration response contains JWT token');
  const candidateId = regRes.data?.candidate?.id;
  const candidateToken = regRes.data?.token;

  // Duplicate registration
  const dupRes = await makeRequest('POST', '/api/auth/register', testCandidate);
  assert(dupRes.status === 409, 'Duplicate registration returns HTTP 409 Conflict', `Status: ${dupRes.status}`);
  assert(dupRes.data?.success === false, 'Duplicate response indicates success: false');

  // 2. Authentication & Generic Non-Enumerating Security
  console.log('\n── Step 2: Authentication & Security Error Non-Enumeration ────');
  const validLoginRes = await makeRequest('POST', '/api/auth/login', {
    email: testCandidate.email,
    password: testCandidate.password
  });
  assert(validLoginRes.status === 200 && validLoginRes.data?.success === true, 'Login with correct credentials succeeds (200 OK)');

  // Wrong password
  const wrongPassRes = await makeRequest('POST', '/api/auth/login', {
    email: testCandidate.email,
    password: 'WrongPassword999!'
  });
  assert(wrongPassRes.status === 401, 'Login with incorrect password returns 401 Unauthorized');
  assert(wrongPassRes.data?.error === 'Invalid email or password.', 'Generic error message on bad password');

  // Nonexistent user
  const nonExistRes = await makeRequest('POST', '/api/auth/login', {
    email: `nonexistent_${timestamp}@example.com`,
    password: 'SomePassword123!'
  });
  assert(nonExistRes.status === 401, 'Login with nonexistent email returns 401 Unauthorized');
  assert(nonExistRes.data?.error === 'Invalid email or password.', 'Generic error message on bad email prevents enumeration');

  // 3. Question Bank Retrieval
  console.log('\n── Step 3: Question Bank Retrieval & Field Optimization ───────');
  const questionsRes = await makeRequest('GET', '/api/questions', null, {
    Authorization: `Bearer ${candidateToken}`
  });
  assert(questionsRes.status === 200 && Array.isArray(questionsRes.data?.data), 'Questions retrieved successfully from DB');
  const questions = questionsRes.data?.data || [];
  assert(questions.length > 0, `Question bank has records (Count: ${questions.length})`);

  // 4. Authoritative Backend Scoring
  console.log('\n── Step 4: Authoritative Backend Scoring & Calculation ─────────');
  // Pick first 4 questions from DB
  const testSet = questions.slice(0, 4);
  const answers = {};
  // Answer 2 correctly and 2 incorrectly
  if (testSet.length >= 2) {
    // 1st correct
    answers[testSet[0].id] = testSet[0].correct_answer;
    // 2nd correct
    answers[testSet[1].id] = testSet[1].correct_answer;
    // Remaining incorrect
    for (let i = 2; i < testSet.length; i++) {
      const actual = testSet[i].correct_answer;
      answers[testSet[i].id] = actual === 'A' ? 'B' : 'A';
    }
  }

  // Submit assessment with SPOOFED client score of 100
  const assessmentId = `asm-test-${timestamp}`;
  const submissionPayload = {
    assessmentId,
    assessmentTitle: 'Performance Scalability Test',
    candidateId,
    candidateName: testCandidate.name,
    candidateEmail: testCandidate.email,
    // Spoofed values from client:
    score: 100,
    accuracy: 100,
    correctCount: 4,
    incorrectCount: 0,
    totalQuestions: testSet.length,
    answers,
  };

  const subRes = await makeRequest(
    'POST',
    '/api/submissions',
    submissionPayload,
    { Authorization: `Bearer ${candidateToken}` }
  );

  assert(subRes.status === 201 && subRes.data?.success === true, 'Assessment submitted successfully (201 Created)');
  
  // Backend authoritative calculation: 2 correct out of 4 total = 50%
  const expectedScore = Math.round((2 / testSet.length) * 100);
  const recordedScore = subRes.data?.data?.score;
  const recordedCorrect = subRes.data?.data?.correct_count;
  
  assert(recordedScore === expectedScore, `Authoritative backend score calculated: ${recordedScore}% (Expected: ${expectedScore}%, Client spoofed 100% was ignored)`, `Recorded: ${recordedScore}`);
  assert(recordedCorrect === 2, `Authoritative correct count: ${recordedCorrect} (Expected: 2)`);

  // 5. Duplicate Submission Prevention (Idempotency)
  console.log('\n── Step 5: Duplicate Submission Prevention (Idempotency) ─────');
  const duplicateSubRes = await makeRequest(
    'POST',
    '/api/submissions',
    submissionPayload,
    { Authorization: `Bearer ${candidateToken}` }
  );
  assert(duplicateSubRes.status === 409, 'Duplicate assessment submission returns HTTP 409 Conflict', `Status: ${duplicateSubRes.status}`);
  assert(duplicateSubRes.data?.success === false, 'Duplicate submission response has success: false');

  // 6. High-Concurrency Burst & Rate Limiting Stability
  console.log('\n── Step 6: High-Concurrency Burst & Rate Limiting ─────────────');
  const CONCURRENT_REQUESTS = 50;
  console.log(`Firing ${CONCURRENT_REQUESTS} concurrent requests to /api/auth/login...`);

  const burstPromises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    burstPromises.push(
      makeRequest('POST', '/api/auth/login', {
        email: testCandidate.email,
        password: testCandidate.password,
      })
    );
  }

  const burstResults = await Promise.all(burstPromises);
  const latencies = burstResults.map(r => r.latency);
  const statusCodes = {};
  burstResults.forEach(r => {
    statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
  });

  const { p50, p95, p99 } = calculatePercentiles(latencies);
  console.log(`  Latency Percentiles: P50=${p50}ms, P95=${p95}ms, P99=${p99}ms`);
  console.log(`  Status Breakdown   : ${JSON.stringify(statusCodes)}`);

  // Assert no server crashes or socket timeouts
  const serverErrors = burstResults.filter(r => r.status >= 500).length;
  assert(serverErrors === 0, `Zero 5xx server errors under burst (${serverErrors} found)`);

  const successfulOrRateLimited = burstResults.every(r => r.status === 200 || r.status === 429);
  assert(successfulOrRateLimited, 'All concurrent responses are either 200 OK or 429 Too Many Requests');

  console.log('\n===============================================================');
  console.log(`📊 Test Summary: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 All acceptance criteria verified successfully!');
    process.exit(0);
  } else {
    console.error('⚠️ Some acceptance criteria failed.');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
