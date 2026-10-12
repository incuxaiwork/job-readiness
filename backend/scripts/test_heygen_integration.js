/**
 * Automated Test Suite for HeyGen Avatar & Interview Lifecycle Integration
 * 
 * Tests:
 * 1. Avatar config endpoint (presets, defaults)
 * 2. Avatar token endpoint (mock & fallback security)
 * 3. Session creation & question seeding
 * 4. Candidate answer evaluation & server scoring
 * 5. Telemetry batch logging
 * 6. Session completion & analysis generation
 * 7. Avatar session release
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 RUNNING HEYGEN AVATAR & INTERVIEW INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  };

  try {
    // 1. GET /api/interview/avatar/config
    console.log('Test 1: Avatar Configuration Endpoint...');
    const configRes = await fetch(`${BASE_URL}/interview/avatar/config`);
    const configData = await configRes.json();
    assert(configRes.ok && configData.success === true, 'GET /avatar/config returns HTTP 200 with success: true');
    assert(Array.isArray(configData.config?.presets) && configData.config.presets.length >= 3, 'Returns at least 3 curated interviewer personas');
    assert(typeof configData.config?.defaultAvatarId === 'string', 'Returns valid defaultAvatarId');

    // 2. POST /api/interview/avatar/token without key -> should fallback gracefully
    console.log('\nTest 2: Token Endpoint Unset Key Security & Fallback...');
    const unauthRes = await fetch(`${BASE_URL}/interview/avatar/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test_sec_session' })
    });
    const unauthData = await unauthRes.json();
    assert(unauthData.fallbackMode === true, 'Returns fallbackMode: true when key is unset (prevents crash)');

    // 3. POST /api/interview/avatar/token with allowMock -> simulated token
    console.log('\nTest 3: Token Endpoint Mock Mode (Testing & Load-Test Ready)...');
    const mockRes = await fetch(`${BASE_URL}/interview/avatar/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test_mock_session', allowMock: true })
    });
    const mockData = await mockRes.json();
    assert(mockData.success === true && Boolean(mockData.token), 'Returns session token in mock mode');
    assert(mockData.isMock === true, 'Flags token as isMock: true for safety');

    // 4. POST /api/interview/session -> Create interview session
    console.log('\nTest 4: Interview Session Creation Lifecycle...');
    const createRes = await fetch(`${BASE_URL}/interview/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole: 'Machine Learning Engineer',
        userId: 'candidate_test_aditya'
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success === true, 'Interview session created (HTTP 201)');
    const testSession = createData.session;
    assert(Boolean(testSession?.id), `Session ID assigned: ${testSession?.id}`);
    assert(Array.isArray(testSession?.questions) && testSession.questions.length > 0, `Questions seeded: ${testSession?.questions?.length}`);

    const q1 = testSession.questions[0];

    // 5. POST /api/interview/question/:id/answer -> Candidate spoken answer evaluation
    console.log('\nTest 5: Server-Authoritative Spoken Answer Evaluation...');
    const sampleAnswer = 'We designed an end-to-end machine learning pipeline using Python, PyTorch, and Docker. The primary challenge was high inference latency and memory constraints during deployment, which we resolved using model quantization and Redis caching.';
    const ansRes = await fetch(`${BASE_URL}/interview/question/${q1.id}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: sampleAnswer,
        duration: 25,
        telemetry: {
          eyeContact: 92,
          attention: 90,
          confidence: 88,
          emotion: 'Confident'
        }
      })
    });
    const ansData = await ansRes.json();
    assert(ansRes.status === 201 && ansData.success === true, 'Answer saved and evaluated (HTTP 201)');
    assert(ansData.answer?.overallScore >= 70, `Server-evaluated score: ${ansData.answer?.overallScore}/100`);
    assert(ansData.answer?.technicalScore >= 70, `Technical score based on domain concepts: ${ansData.answer?.technicalScore}/100`);

    // 6. POST /api/interview/session/:id/telemetry -> Telemetry batch logging
    console.log('\nTest 6: Real-time Telemetry Batch Persistence...');
    const telemRes = await fetch(`${BASE_URL}/interview/session/${testSession.id}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        samples: [
          { eyeContact: 95, attention: 92, confidence: 89, emotion: 'Focused' },
          { eyeContact: 93, attention: 90, confidence: 87, emotion: 'Confident' }
        ]
      })
    });
    const telemData = await telemRes.json();
    assert(telemRes.status === 201 && telemData.success === true, 'Telemetry batch accepted (HTTP 201)');

    // 7. POST /api/interview/session/:id/complete -> Session Finalization & Analysis
    console.log('\nTest 7: Interview Completion & Final Report Generation...');
    const compRes = await fetch(`${BASE_URL}/interview/session/${testSession.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const compData = await compRes.json();
    assert(compRes.ok && compData.success === true, 'Interview completed and finalized (HTTP 200)');
    assert(Boolean(compData.analysis), 'Comprehensive analysis generated');
    assert(Number(compData.analysis?.overallScore) > 0, `Overall final score: ${compData.analysis?.overallScore}/100`);

    // 8. POST /api/interview/avatar/release -> Release avatar session
    console.log('\nTest 8: Avatar Session Resource Release...');
    const relRes = await fetch(`${BASE_URL}/interview/avatar/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: testSession.id })
    });
    const relData = await relRes.json();
    assert(relRes.ok && relData.success === true, 'Avatar session tracking released');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
};

runTests();
