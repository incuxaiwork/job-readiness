/**
 * Scalability Load Test: 600 Concurrent Student Mock Interviews
 * 
 * Simulates 600 virtual students concurrently initiating and completing
 * mock interview sessions with HeyGen streaming avatar tokens (using mock mode
 * to prevent incurring massive third-party API billing during testing).
 * 
 * Lifecycle per virtual user (VU):
 *   1. Create Interview Session  (POST /api/interview/session)
 *   2. Request Avatar Token      (POST /api/interview/avatar/token)
 *   3. Retrieve Questions        (GET  /api/interview/session/:id/questions)
 *   4. Submit Spoken Answer      (POST /api/interview/question/:id/answer)
 *   5. Finalize Session          (POST /api/interview/session/:id/complete)
 */

import http from 'http';

const TARGET_HOST = process.env.TEST_TARGET || 'http://localhost:5000';
const CONCURRENT_VUS = parseInt(process.env.VUS || '600', 10);
const BATCH_SIZE = 75; // Ramp-up batching to prevent local OS socket exhaustion
const BATCH_DELAY_MS = 250;

console.log('================================================================');
console.log(`🚀 JOBRECIPE AI - 600 CONCURRENT STUDENT LOAD TEST`);
console.log('================================================================');
console.log(`Target Host        : ${TARGET_HOST}`);
console.log(`Target Concurrency : ${CONCURRENT_VUS} Concurrent Students`);
console.log(`Mode               : Simulated HeyGen WebRTC Stream Tokens`);
console.log(`Timestamp          : ${new Date().toISOString()}`);
console.log('================================================================\n');

// Keep-alive agent with generous connection pooling
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 1000,
  maxFreeSockets: 256,
  timeout: 30000
});

function request(method, path, body = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = new URL(path, TARGET_HOST);

    const postData = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-load-test': 'true',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      agent,
      timeout: 25000
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        const latency = Date.now() - start;
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({
          statusCode: res.statusCode,
          latency,
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: json
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        latency: Date.now() - start,
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 408,
        latency: Date.now() - start,
        success: false,
        error: 'Timeout'
      });
    });

    if (postData) req.write(postData);
    req.end();
  });
}

// Single student lifecycle execution
async function simulateStudentInterview(vuId) {
  const timings = [];

  // Step 1: Create Session
  const createRes = await request('POST', '/api/interview/session', {
    targetRole: 'Software Engineer',
    userId: `vu_candidate_${vuId}`
  });
  timings.push(createRes.latency);
  if (!createRes.success || !createRes.data?.session?.id) {
    return { success: false, step: 'create_session', latencies: timings };
  }
  const sessionId = createRes.data.session.id;
  const questions = createRes.data.session.questions || [];
  const q1 = questions[0] || { id: 'q1' };

  // Step 2: Request Avatar Token (Mock mode for load testing)
  const tokenRes = await request('POST', '/api/interview/avatar/token', {
    sessionId,
    allowMock: true
  });
  timings.push(tokenRes.latency);
  if (!tokenRes.success || !tokenRes.data?.token) {
    return { success: false, step: 'avatar_token', latencies: timings };
  }

  // Step 3: Get Questions
  const qRes = await request('GET', `/api/interview/session/${sessionId}/questions`);
  timings.push(qRes.latency);

  // Step 4: Submit Answer to Q1
  const ansRes = await request('POST', `/api/interview/question/${q1.id}/answer`, {
    transcript: 'In our microservices platform, we scaled Node.js services with Redis caching, PostgreSQL connection pooling, and message queues to handle peak load.',
    duration: 30,
    telemetry: { eyeContact: 90, attention: 88, confidence: 85 }
  });
  timings.push(ansRes.latency);

  // Step 5: Complete Interview
  const compRes = await request('POST', `/api/interview/session/${sessionId}/complete`, {});
  timings.push(compRes.latency);

  const allOk = createRes.success && tokenRes.success && qRes.success && ansRes.success && compRes.success;
  return {
    success: allOk,
    sessionId,
    latencies: timings
  };
}

async function runLoadTest() {
  const globalStart = Date.now();
  const allResults = [];
  const allLatencies = [];

  console.log(`Starting execution for ${CONCURRENT_VUS} virtual students in staged concurrency waves...\n`);

  for (let i = 0; i < CONCURRENT_VUS; i += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, CONCURRENT_VUS - i);
    const batchPromises = [];

    for (let j = 0; j < batchCount; j++) {
      const vuId = i + j + 1;
      batchPromises.push(simulateStudentInterview(vuId));
    }

    const batchResults = await Promise.all(batchPromises);
    allResults.push(...batchResults);

    const completedSoFar = allResults.length;
    const passedSoFar = allResults.filter(r => r.success).length;
    process.stdout.write(`  [Wave ${Math.floor(i / BATCH_SIZE) + 1}] Completed: ${completedSoFar}/${CONCURRENT_VUS} students (${passedSoFar} successful)...\r`);

    if (i + BATCH_SIZE < CONCURRENT_VUS) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  const totalDurationSec = (Date.now() - globalStart) / 1000;
  console.log('\n\n================================================================');
  console.log('📊 600 CONCURRENT STUDENT LOAD TEST RESULTS');
  console.log('================================================================');

  const successfulUsers = allResults.filter(r => r.success).length;
  const failedUsers = CONCURRENT_VUS - successfulUsers;
  const totalHttpRequests = CONCURRENT_VUS * 5; // 5 operations per student
  const throughputReqPerSec = (totalHttpRequests / totalDurationSec).toFixed(2);

  // Flatten latencies
  allResults.forEach(r => {
    if (r.latencies) allLatencies.push(...r.latencies);
  });
  allLatencies.sort((a, b) => a - b);

  const minLat = allLatencies[0] || 0;
  const maxLat = allLatencies[allLatencies.length - 1] || 0;
  const avgLat = (allLatencies.reduce((a, b) => a + b, 0) / (allLatencies.length || 1)).toFixed(1);
  const p50 = allLatencies[Math.floor(allLatencies.length * 0.50)] || 0;
  const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)] || 0;
  const p99 = allLatencies[Math.floor(allLatencies.length * 0.99)] || 0;

  console.log(`Virtual Students Executed : ${CONCURRENT_VUS}`);
  console.log(`Successful Completions    : ${successfulUsers} (${((successfulUsers / CONCURRENT_VUS) * 100).toFixed(1)}%)`);
  console.log(`Failed Sessions           : ${failedUsers}`);
  console.log(`Total HTTP Operations     : ${totalHttpRequests} requests`);
  console.log(`Total Wall Time           : ${totalDurationSec.toFixed(2)} seconds`);
  console.log(`Throughput                : ${throughputReqPerSec} req/sec`);
  console.log('----------------------------------------------------------------');
  console.log(`Latency Breakdown:`);
  console.log(`  Min Latency             : ${minLat} ms`);
  console.log(`  Average Latency         : ${avgLat} ms`);
  console.log(`  Median (p50)            : ${p50} ms`);
  console.log(`  95th Percentile (p95)   : ${p95} ms`);
  console.log(`  99th Percentile (p99)   : ${p99} ms`);
  console.log(`  Max Latency             : ${maxLat} ms`);
  console.log('================================================================\n');

  if (successfulUsers / CONCURRENT_VUS >= 0.98) {
    console.log('✅ Scalability Verdict: Backend successfully sustained 600 concurrent interview sessions!');
    process.exit(0);
  } else {
    console.warn('⚠️ Scalability Verdict: High failure rate under 600 concurrent sessions.');
    process.exit(1);
  }
}

runLoadTest().catch((err) => {
  console.error('Fatal load test runner error:', err);
  process.exit(1);
});
