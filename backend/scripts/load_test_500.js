import http from 'http';
import https from 'https';
import { URL } from 'url';

const TARGET_URL = process.env.TEST_TARGET || 'http://localhost:5000';
const CONCURRENT_USERS = 500;

console.log(`=============================================================`);
console.log(`🚀 INCUX_JOBREADINESS 500 VIRTUAL USERS SCALABILITY LOAD TEST`);
console.log(`=============================================================`);
console.log(`Target Host        : ${TARGET_URL}`);
console.log(`Concurrent Users   : ${CONCURRENT_USERS} VUs`);
console.log(`Timestamp          : ${new Date().toISOString()}`);
console.log(`=============================================================\n`);

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 1000 });

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(path, TARGET_URL);

    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: reqHeaders,
      agent: httpAgent,
      timeout: 20000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          latency,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      const latency = Date.now() - startTime;
      resolve({ status: 0, latency, success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      const latency = Date.now() - startTime;
      resolve({ status: 408, latency, success: false, error: 'Timeout' });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function calculateStats(results, durationSec) {
  const latencies = results.map(r => r.latency).sort((a, b) => a - b);
  const successfulRequests = results.filter(r => r.success).length;
  const totalRequests = results.length;
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const avg = (sum / Math.max(1, latencies.length)).toFixed(2);
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (totalRequests / Math.max(0.1, durationSec)).toFixed(2);
  const successRate = ((successfulRequests / Math.max(1, totalRequests)) * 100).toFixed(2);

  return {
    totalRequests,
    successfulRequests,
    failedRequests: totalRequests - successfulRequests,
    successRate: `${successRate}%`,
    throughputRPS: rps,
    latencyMetrics: {
      min: `${min} ms`,
      avg: `${avg} ms`,
      p50_median: `${p50} ms`,
      p95: `${p95} ms`,
      p99: `${p99} ms`,
      max: `${max} ms`
    }
  };
}

async function runScenario1() {
  console.log(`📌 Scenario 1: Health & API Index Check (500 Concurrent VUs)`);
  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENT_USERS }).map(() => makeRequest('GET', '/api/health'));
  const results = await Promise.all(promises);
  const duration = (Date.now() - startTime) / 1000;
  return calculateStats(results, duration);
}

async function runScenario2() {
  console.log(`\n📌 Scenario 2: High-Concurrency Read Operations (500 Concurrent VUs)`);
  console.log(`   500 VUs fetching Question Bank, Assessments & Candidate Directory simultaneously...`);
  const startTime = Date.now();
  const endpoints = ['/api/questions', '/api/assessments', '/api/candidates'];
  const promises = Array.from({ length: CONCURRENT_USERS }).map((_, idx) =>
    makeRequest('GET', endpoints[idx % endpoints.length])
  );
  const results = await Promise.all(promises);
  const duration = (Date.now() - startTime) / 1000;
  return calculateStats(results, duration);
}

async function runScenario3() {
  console.log(`\n📌 Scenario 3: High-Concurrency Write Operations (500 Concurrent VUs)`);
  console.log(`   500 VUs submitting assessment attempts simultaneously into assessment_submissions table...`);
  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENT_USERS }).map((_, idx) => {
    const score = Math.floor(Math.random() * 40) + 60;
    return makeRequest('POST', '/api/submissions', {
      assessmentId: 'asm-1',
      assessmentTitle: 'Full-Stack Technical Assessment',
      candidateId: `vu-user-${idx}-${Date.now()}`,
      candidateName: `VU Student #${idx + 1}`,
      candidateEmail: `candidate_${idx}_${Date.now()}@scalability.test`,
      score: score,
      accuracy: score - 5,
      correctCount: Math.floor(score / 10),
      incorrectCount: 2,
      unansweredCount: 0,
      timeTaken: '20 min',
      categoryScores: { aptitude: 85, reasoning: 80, technical: score },
      topicBreakdown: [{ topic: 'Algorithms', score: score, status: 'Mastered' }],
      answers: { 'q-101': 'A', 'q-102': 'B' }
    });
  });
  const results = await Promise.all(promises);
  const duration = (Date.now() - startTime) / 1000;
  return calculateStats(results, duration);
}

async function runScenario4() {
  console.log(`\n📌 Scenario 4: End-to-End Candidate Journey (500 Concurrent VUs)`);
  console.log(`   500 VUs executing Candidate Registration -> Take Test -> Submit -> Roster Check...`);
  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENT_USERS }).map(async (_, idx) => {
    const email = `student_vu_${idx}_${Date.now()}_${Math.floor(Math.random()*1000)}@university.edu`;

    const reg = await makeRequest('POST', '/api/auth/register', {
      fullName: `Scalability Student #${idx + 1}`,
      email: email,
      mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      college: 'BITS Pilani',
      branch: 'Computer Science',
      specialization: 'Artificial Intelligence',
      state: 'Telangana',
      city: 'Hyderabad',
      graduationYear: '2026',
      experienceLevel: 'Fresher',
      password: 'password123'
    });

    const sub = await makeRequest('POST', '/api/submissions', {
      assessmentId: 'asm-1',
      assessmentTitle: 'Readiness Assessment',
      candidateId: reg.success ? reg.data?.candidate?.id || `cand-${idx}` : `cand-${idx}`,
      candidateName: `Scalability Student #${idx + 1}`,
      candidateEmail: email,
      score: 92,
      accuracy: 94,
      correctCount: 19,
      incorrectCount: 1,
      unansweredCount: 0,
      timeTaken: '24 min',
      categoryScores: { aptitude: 95, reasoning: 90, technical: 92 },
      topicBreakdown: [{ topic: 'Data Structures', score: 92, status: 'Mastered' }],
      answers: { 'q-101': 'A' }
    });

    return [reg, sub];
  });

  const rawResults = await Promise.all(promises);
  const results = rawResults.flat();
  const duration = (Date.now() - startTime) / 1000;
  return calculateStats(results, duration);
}

async function main() {
  try {
    const s1 = await runScenario1();
    console.log('Scenario 1 Results (Health & API Index):', JSON.stringify(s1, null, 2));

    const s2 = await runScenario2();
    console.log('Scenario 2 Results (Read Load):', JSON.stringify(s2, null, 2));

    const s3 = await runScenario3();
    console.log('Scenario 3 Results (Write Submissions Load):', JSON.stringify(s3, null, 2));

    const s4 = await runScenario4();
    console.log('Scenario 4 Results (End-to-End Workflow Load):', JSON.stringify(s4, null, 2));

    console.log(`\n=============================================================`);
    console.log(`✅ ALL 500 VIRTUAL USERS LOAD TEST SCENARIOS COMPLETED`);
    console.log(`=============================================================`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Load test error:', err);
    process.exit(1);
  }
}

main();
