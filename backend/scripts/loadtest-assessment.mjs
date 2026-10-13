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
const timedFetch = async (method, path, { body, token } = {}) => {
  const started = Date.now();
  try {
    const res = await fetch(`${TARGET}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
    return { ok: res.ok, status: res.status, ms: Date.now() - started, json, text };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - started, json: null, text: '', error: err.message };
  }
};

// ── Seed ─────────────────────────────────────────────────────────────────────
async function create() {
  console.log(`Seeding ${COUNT} throwaway candidates (${PREFIX}+001..${pad(COUNT)}@readysetjob.test) ...`);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  let made = 0;
  for (let i = 1; i <= COUNT; i++) {
    const email = emailFor(i);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: 'candidate', name: nameFor(i), status: 'active' },
      create: { id: idFor(i), email, passwordHash, role: 'candidate', name: nameFor(i), status: 'active' },
    });
    const uid = user.id;
    await prisma.candidateProfile.upsert({
      where: { id: uid },
      update: { userId: uid, name: nameFor(i), email },
      create: {
        id: uid, userId: uid, name: nameFor(i), email,
        mobile: '9000000000', college: 'Load Test College', degree: 'B.Tech',
        branch: 'Computer Science', specialization: 'Full-Stack Web Development',
        country: 'India', state: 'Telangana', city: 'Hyderabad',
        graduationYear: 2026, experienceLevel: 'Fresher',
      },
    });
    await prisma.candidate.upsert({
      where: { id: uid },
      update: {},
      create: { id: uid, experienceLevel: 'Fresher', readinessStatus: 'In Progress' },
    });
    made++;
  }
  console.log(`Seeded ${made} candidates. Password: ${PASSWORD}`);
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function runOne(i) {
  const email = emailFor(i);
  const steps = {};
  const record = (step, r) => { steps[step] = { ok: r.ok, status: r.status, ms: r.ms, error: r.error || (r.ok ? null : r.json?.error || r.text?.slice(0, 120)) }; };

  const login = await timedFetch('POST', '/api/auth/login', { body: { email, password: PASSWORD } });
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

  console.log(`\nWall clock      : ${(wallMs / 1000).toFixed(2)}s for ${COUNT} candidates (${(COUNT / (wallMs / 1000)).toFixed(1)} users/s)`);
  console.log(`Fatal logins    : ${results.filter(r => r.fatal).length}`);
  console.log(`\n${'step'.padEnd(15)} ${'ok'.padStart(5)} ${'fail'.padStart(5)}  ${'p50'.padStart(6)} ${'p95'.padStart(6)} ${'p99'.padStart(6)} ${'max'.padStart(6)}`);
  for (const s of stepNames) {
    const a = summary[s];
    const lat = a.lat.sort((x, y) => x - y);
    console.log(`${s.padEnd(15)} ${String(a.ok).padStart(5)} ${String(a.fail).padStart(5)}  ${String(pct(lat, 50)).padStart(6)} ${String(pct(lat, 95)).padStart(6)} ${String(pct(lat, 99)).padStart(6)} ${String(lat[lat.length - 1] || 0).padStart(6)}`);
    if (Object.keys(a.statuses).length) console.log(`   statuses: ${JSON.stringify(a.statuses)}`);
    for (const e of a.errors) console.log(`   e.g. ${e}`);
  }

  const scored = results.filter(r => r.score !== null);
  console.log(`\nSubmissions scored: ${scored.length}/${COUNT}`);
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

const cmd = process.argv[2] || 'all';
const main = async () => {
  if (cmd === 'create') return create();
  if (cmd === 'run') return run();
  if (cmd === 'cleanup') return cleanup();
  if (cmd === 'all') { await create(); await run(); await cleanup(); return; }
  console.error(`Unknown command: ${cmd}. Use create | run | cleanup | all.`);
  process.exit(1);
};

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
