#!/usr/bin/env node
/**
 * Assessment load test — 200 concurrent candidates through the core exam path.
 *
 *   node scripts/loadtest-assessment.mjs create     # seed N throwaway candidates
 *   node scripts/loadtest-assessment.mjs run        # fire N users at TARGET
 *   node scripts/loadtest-assessment.mjs cleanup    # remove accounts + all traces
 *   node scripts/loadtest-assessment.mjs all        # create -> run -> cleanup
 *
 * Each simulated candidate does exactly what the browser does at submission time:
 *   login -> load questions -> start attempt -> autosave a few answers -> final submit.
 *
 * Config via env:
 *   TEST_TARGET      backend base URL (default: the Railway production API)
 *   USERS            number of candidates (default 200)
 *   ASSESSMENT_ID    assessment to target (default: the live one)
 *   CONCURRENCY      max in-flight users (default = USERS, i.e. all at once)
 *   LOADTEST_PASSWORD / LOADTEST_PREFIX
 */
import 'dotenv/config';
import http from 'node:http';
import https from 'node:https';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db/prisma.js';

const TARGET = (process.env.TEST_TARGET || 'https://amiable-recreation-production-0a03.up.railway.app').replace(/\/+$/, '');
const COUNT = parseInt(process.env.USERS || '200', 10);
const ASSESSMENT_ID = process.env.ASSESSMENT_ID || 'asm-1791858848361';
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || String(COUNT), 10));
const PASSWORD = process.env.LOADTEST_PASSWORD || 'LoadTest@2026';
const PREFIX = process.env.LOADTEST_PREFIX || 'loadtest';

const pad = (n) => String(n).padStart(3, '0');
const idFor = (i) => `lt-cand-${pad(i)}`;
const emailFor = (i) => `${PREFIX}+${pad(i)}@readysetjob.test`;
const nameFor = (i) => `Load Test ${pad(i)}`;
const EMAIL_LIKE = `${PREFIX}+%@readysetjob.test`;
const ID_PREFIX = `lt-cand-`;

// ── HTTP helpers ─────────────────────────────────────────────────────────────
// Node's global fetch (undici) aborts TLS connects at 10s, which a cold burst of
// 200 new sockets from one host blows through (UND_ERR_CONNECT_TIMEOUT). A
// keep-alive https.Agent with a 30s cap establishes and reuses them reliably.
const PROTO = new URL(TARGET).protocol === 'http:' ? http : https;
const agent = new PROTO.Agent({
  keepAlive: true,
  maxSockets: Math.max(CONCURRENCY, 50) + 20,
  maxFreeSockets: 256,
  timeout: 30000,
});

const rawFetch = (method, path, { body, token } = {}) =>
  new Promise((resolve) => {
    const started = Date.now();
    const u = new URL(`${TARGET}${path}`);
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = PROTO.request(
      { hostname: u.hostname, port: u.port || (u.protocol === 'http:' ? 80 : 443), path: u.pathname + u.search, method, headers, agent, timeout: 30000 },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let json = null;
          try { json = raw ? JSON.parse(raw) : null; } catch { /* non-JSON */ }
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, ms: Date.now() - started, json, text: raw });
        });
      }
    );
    req.on('error', (e) => resolve({ ok: false, status: 0, ms: Date.now() - started, json: null, text: '', error: e.code || e.message }));
    req.on('timeout', () => req.destroy(new Error('ETIMEDOUT')));
    if (payload) req.write(payload);
    req.end();
  });

// A reused keep-alive socket the server already closed surfaces as ECONNRESET
// (status 0) even though the request never reached the app. Retry a couple of
// times on a fresh socket; only network-level failures (status 0) are retried,
// never a real HTTP status.
const timedFetch = async (method, path, opts = {}) => {
  const retries = opts.retries ?? (method === 'GET' ? 2 : 0);
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    last = await rawFetch(method, path, opts);
    if (last.status !== 0) return last;
  }
  return last;
};

// Opens/reuses the socket pool so TLS handshakes don't dominate the measured run.
async function warmup() {
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, COUNT) }, () => timedFetch('GET', '/health')));
}

// ── Seed ─────────────────────────────────────────────────────────────────────
async function create() {
  console.log(`Seeding ${COUNT} throwaway candidates (${PREFIX}+001..${pad(COUNT)}@readysetjob.test) ...`);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const users = [], profiles = [], cands = [];
  for (let i = 1; i <= COUNT; i++) {
    const id = idFor(i), email = emailFor(i), name = nameFor(i);
    users.push(`(${q(id)},${q(email)},${q(passwordHash)},'candidate',${q(name)},'active')`);
    profiles.push(`(${q(id)},${q(id)},${q(name)},${q(email)},'9000000000','Load Test College','B.Tech','Computer Science','Full-Stack Web Development','India','Telangana','Hyderabad',2026,'Fresher')`);
    cands.push(`(${q(id)},'Fresher','In Progress')`);
  }
  // Bulk upsert (idempotent). One statement per table instead of N round-trips.
  await prisma.$executeRawUnsafe(
    `INSERT INTO users (id,email,password_hash,role,name,status) VALUES ${users.join(',')}
     ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, name=EXCLUDED.name, status=EXCLUDED.status`);
  await prisma.$executeRawUnsafe(
    `INSERT INTO candidate_profiles (id,user_id,name,email,mobile,college,degree,branch,specialization,country,state,city,graduation_year,experience_level) VALUES ${profiles.join(',')}
     ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, name=EXCLUDED.name, email=EXCLUDED.email`);
  await prisma.$executeRawUnsafe(
    `INSERT INTO candidates (id,experience_level,readiness_status) VALUES ${cands.join(',')}
     ON CONFLICT (id) DO NOTHING`);
  console.log(`Seeded ${COUNT} candidates. Password: ${PASSWORD}`);
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function runOne(i) {
  const email = emailFor(i);
  const steps = {};
  const record = (step, r) => { steps[step] = { ok: r.ok, status: r.status, ms: r.ms, error: r.error || (r.ok ? null : r.json?.error || r.text?.slice(0, 120)) }; };

  const login = await timedFetch('POST', '/api/auth/login', { body: { email, password: PASSWORD }, retries: 3 });
  record('login', login);
  if (!login.ok || !login.json?.token) return { email, steps, fatal: 'login' };
  const token = login.json.token;

  const q = await timedFetch('GET', `/api/assessments/${ASSESSMENT_ID}/questions`, { token });
  record('questions', q);
  const questionIds = (q.json?.data || []).map((x) => x.question_id).filter(Boolean);

  const start = await timedFetch('POST', `/api/assessments/${ASSESSMENT_ID}/attempt/start`, { token, body: {} });
  record('attempt_start', start);
  const attemptId = start.json?.data?.attemptId;

  if (attemptId) {
    const sample = questionIds.slice(0, Math.min(5, questionIds.length));
    for (const qid of sample) {
      const a = await timedFetch('POST', `/api/attempts/${attemptId}/answers`, {
        token, body: { questionId: qid, selectedOption: 'A', timeTakenSeconds: 3 },
      });
      record('save_answer', a);
    }
  }

  const answers = {};
  for (const qid of questionIds) answers[qid] = 'A';
  const submit = await timedFetch('POST', '/api/submissions', {
    token,
    body: {
      assessmentId: ASSESSMENT_ID,
      assessmentTitle: 'Comprehensive Job Readiness Assessment',
      questionIds,
      answers,
      totalQuestions: questionIds.length,
      timeTaken: '28 min',
      categoryScores: {},
      topicBreakdown: [],
      proctoringViolations: 0,
      autoSubmitted: false,
    },
  });
  record('submit', submit);
  return { email, steps, score: submit.json?.data?.score ?? submit.json?.score ?? null };
}

const pct = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0);

async function run() {
  console.log('='.repeat(70));
  console.log(`ASSESSMENT LOAD TEST — ${COUNT} candidates (concurrency ${CONCURRENCY})`);
  console.log(`Target      : ${TARGET}`);
  console.log(`Assessment  : ${ASSESSMENT_ID}`);
  console.log(`Started     : ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const started = Date.now();
  const results = [];
  await warmup();
  const warmMs = Date.now() - started;
  let next = 1;
  const worker = async () => {
    while (true) {
      const i = next++;
      if (i > COUNT) return;
      results.push(await runOne(i));
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, COUNT) }, worker));
  const wallMs = Date.now() - started;

  // Aggregate per step
  const stepNames = ['login', 'questions', 'attempt_start', 'save_answer', 'submit'];
  const summary = {};
  for (const s of stepNames) summary[s] = { ok: 0, fail: 0, statuses: {}, lat: [], errors: [] };
  for (const r of results) {
    for (const s of stepNames) {
      const st = r.steps[s];
      if (!st) continue;
      const agg = summary[s];
      if (st.ok) agg.ok++; else { agg.fail++; agg.statuses[st.status] = (agg.statuses[st.status] || 0) + 1; if (st.error && agg.errors.length < 5) agg.errors.push(`${st.status} ${st.error}`); }
      agg.lat.push(st.ms);
    }
  }

  console.log(`\nWall clock      : ${(wallMs / 1000).toFixed(2)}s for ${COUNT} candidates (${(COUNT / (wallMs / 1000)).toFixed(1)} users/s) [incl. ${(warmMs / 1000).toFixed(2)}s warmup]`);
  console.log(`Fatal logins    : ${results.filter(r => r.fatal).length}`);
  console.log(`\n${'step'.padEnd(15)} ${'ok'.padStart(5)} ${'fail'.padStart(5)}  ${'p50'.padStart(6)} ${'p95'.padStart(6)} ${'p99'.padStart(6)} ${'max'.padStart(6)}`);
  for (const s of stepNames) {
    const a = summary[s];
    const lat = a.lat.sort((x, y) => x - y);
    console.log(`${s.padEnd(15)} ${String(a.ok).padStart(5)} ${String(a.fail).padStart(5)}  ${String(pct(lat, 50)).padStart(6)} ${String(pct(lat, 95)).padStart(6)} ${String(pct(lat, 99)).padStart(6)} ${String(lat[lat.length - 1] || 0).padStart(6)}`);
    if (Object.keys(a.statuses).length) console.log(`   statuses: ${JSON.stringify(a.statuses)}`);
    for (const e of a.errors) console.log(`   e.g. ${e}`);
  }

  const scored = results.filter(r => typeof r.score === 'number');
  const scores = scored.map(r => r.score).sort((a, b) => a - b);
  console.log(`\nSubmissions scored: ${scored.length}/${COUNT}${scored.length ? ` (score p50=${pct(scores, 50)}, min=${scores[0]}, max=${scores[scores.length - 1]})` : ''}`);
  process.exitCode = results.some(r => r.fatal) || summary.submit.fail > 0 ? 1 : 0;
}

// ── Cleanup ──────────────────────────────────────────────────────────────────
async function cleanup() {
  console.log('Cleaning up load-test accounts and all traces ...');
  const ids = Array.from({ length: COUNT }, (_, k) => idFor(k + 1));
  const del = async (label, sql) => { const n = await prisma.$executeRawUnsafe(sql); console.log(`  ${label}: ${n}`); };
  // Delete dependents first (no interactive transaction — it times out over the public proxy).
  await del('assessment_submissions', `DELETE FROM assessment_submissions WHERE candidate_id = ANY(ARRAY[${ids.map(i => `'${i}'`).join(',')}]) OR candidate_email LIKE '${EMAIL_LIKE}'`);
  await del('submissions', `DELETE FROM submissions WHERE candidate_id = ANY(ARRAY[${ids.map(i => `'${i}'`).join(',')}])`);
  await del('candidate_answers', `DELETE FROM candidate_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%')`);
  await del('performance_analysis', `DELETE FROM performance_analysis WHERE attempt_id IN (SELECT id FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%')`);
  await del('section_attempts', `DELETE FROM section_attempts WHERE attempt_id IN (SELECT id FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%')`);
  await del('test_attempts', `DELETE FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%'`);
  await del('candidate_profiles', `DELETE FROM candidate_profiles WHERE email LIKE '${EMAIL_LIKE}' OR user_id LIKE '${ID_PREFIX}%'`);
  await del('candidates', `DELETE FROM candidates WHERE id LIKE '${ID_PREFIX}%'`);
  await del('users', `DELETE FROM users WHERE email LIKE '${EMAIL_LIKE}' OR id LIKE '${ID_PREFIX}%'`);
  console.log('Cleanup complete.');
}

// Wipe attempts/submissions for the test accounts but keep the accounts, so a
// run can be repeated past the single-attempt policy.
async function reset() {
  console.log(`Resetting attempts/submissions for ${COUNT} test candidates (accounts kept) ...`);
  const ids = Array.from({ length: COUNT }, (_, k) => idFor(k + 1));
  const list = ids.map(i => `'${i}'`).join(',');
  const del = async (label, sql) => { const n = await prisma.$executeRawUnsafe(sql); console.log(`  ${label}: ${n}`); };
  await del('assessment_submissions', `DELETE FROM assessment_submissions WHERE candidate_id = ANY(ARRAY[${list}]) OR candidate_email LIKE '${EMAIL_LIKE}'`);
  await del('submissions', `DELETE FROM submissions WHERE candidate_id = ANY(ARRAY[${list}])`);
  await del('candidate_answers', `DELETE FROM candidate_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%')`);
  await del('performance_analysis', `DELETE FROM performance_analysis WHERE attempt_id IN (SELECT id FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%')`);
  await del('section_attempts', `DELETE FROM section_attempts WHERE attempt_id IN (SELECT id FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%')`);
  await del('test_attempts', `DELETE FROM test_attempts WHERE candidate_id LIKE '${ID_PREFIX}%'`);
  console.log('Reset complete.');
}

const cmd = process.argv[2] || 'all';
const main = async () => {
  if (cmd === 'create') return create();
  if (cmd === 'run') return run();
  if (cmd === 'reset') return reset();
  if (cmd === 'cleanup') return cleanup();
  if (cmd === 'all') { await create(); await run(); await cleanup(); return; }
  console.error(`Unknown command: ${cmd}. Use create | run | reset | cleanup | all.`);
  process.exit(1);
};

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
