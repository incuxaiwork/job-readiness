// College portal smoke test — run against a live backend:
//   npm run test:portals            (auto-selects the college with the most submissions)
//   npm run test:portals -- col-xxxx
// Creates a temporary college-admin, runs the checks, then removes it.
import { pool } from '../src/db/pool.js';

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5000/api';
const SUPER_EMAIL = process.env.SMOKE_SUPER_EMAIL || 'admin@readysetjob.com';
const SUPER_PW = process.env.SMOKE_SUPER_PW || 'Admin@2026';
const COLLEGE_ARG = process.argv[2] || null;

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  → ' + extra : ''}`);
  cond ? pass++ : fail++;
};

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

let createdAdminId = null;

const main = async () => {
  console.log('=== SUPER-ADMIN PORTAL ===');
  let r = await call('POST', '/auth/admin/login', { body: { email: SUPER_EMAIL, password: SUPER_PW } });
  const superToken = r.data?.token;
  check('super-admin login (correct)', r.status === 200 && r.data?.admin?.role === 'admin', `status=${r.status} role=${r.data?.admin?.role}`);

  r = await call('POST', '/auth/admin/login', { body: { email: SUPER_EMAIL, password: 'wrong-pass' } });
  check('super-admin login (wrong pw → 401)', r.status === 401, `status=${r.status}`);

  const superStats = await call('GET', '/admin/stats', { token: superToken });
  const allCandidates = superStats.data?.stats?.totalCandidates ?? superStats.data?.totalCandidates;
  check('super-admin /admin/stats', superStats.status === 200, `candidates=${allCandidates}`);

  const colleges = await call('GET', '/admin/colleges', { token: superToken });
  const list = colleges.data?.data || [];
  check('super-admin /admin/colleges', colleges.status === 200 && Array.isArray(list), `count=${list.length}`);

  const target = COLLEGE_ARG
    ? list.find((c) => c.id === COLLEGE_ARG)
    : list.slice().sort((a, b) => (b.submission_count || 0) - (a.submission_count || 0))[0];
  check('target college resolved', !!target, target ? `${target.name} (${target.code}) students=${target.student_count} subs=${target.submission_count}` : 'none');
  if (!target) return fail;

  const DEMO_EMAIL = `smoke.admin+${target.code}@demo.local`;
  const DEMO_PW = 'College@2026';

  console.log('\n=== ONBOARD COLLEGE-ADMIN (super-admin action) ===');
  await pool.query('DELETE FROM users WHERE email = $1', [DEMO_EMAIL]);
  r = await call('POST', `/admin/colleges/${target.id}/admins`, { token: superToken, body: { name: 'Smoke Demo Admin', email: DEMO_EMAIL, password: DEMO_PW } });
  createdAdminId = r.data?.data?.id || null;
  check('create college-admin credential', r.status === 201 && r.data?.data?.role === 'college_admin', `status=${r.status} role=${r.data?.data?.role}`);

  console.log('\n=== COLLEGE-ADMIN PORTAL ===');
  r = await call('POST', '/auth/admin/login', { body: { email: DEMO_EMAIL, password: DEMO_PW } });
  const collegeToken = r.data?.token;
  check('college-admin login (correct)', r.status === 200 && r.data?.admin?.role === 'college_admin', `status=${r.status} role=${r.data?.admin?.role}`);
  check('college-admin login carries college', r.data?.admin?.college_id === target.id && !!r.data?.admin?.college_name, `college=${r.data?.admin?.college_name}`);

  r = await call('POST', '/auth/admin/login', { body: { email: DEMO_EMAIL, password: 'wrong-pass' } });
  check('college-admin login (wrong pw → 401)', r.status === 401, `status=${r.status}`);

  r = await call('POST', '/auth/admin/login', { body: { email: DEMO_EMAIL, password: SUPER_PW } });
  check('college-admin + master password (→ 401)', r.status === 401, `status=${r.status}`);

  console.log('\n=== TENANT SCOPING (college-admin) ===');
  const collegeStats = await call('GET', '/admin/stats', { token: collegeToken });
  const scopedCandidates = collegeStats.data?.stats?.totalCandidates ?? collegeStats.data?.totalCandidates;
  const scopedSubs = collegeStats.data?.stats?.totalSubmissions;
  check('college-admin /admin/stats OK', collegeStats.status === 200, `candidates=${scopedCandidates} subs=${scopedSubs}`);
  check('college-admin stats scoped < super', Number(scopedCandidates) > 0 && Number(scopedCandidates) < Number(allCandidates), `college=${scopedCandidates} < super=${allCandidates}`);

  const roster = await call('GET', '/candidates', { token: collegeToken });
  const rosterRows = roster.data?.data || roster.data?.candidates || [];
  check('college-admin /candidates scoped', roster.status === 200 && rosterRows.length === Number(scopedCandidates), `rows=${rosterRows.length}`);

  const analytics = await call('GET', '/admin/analytics', { token: collegeToken });
  const fo = analytics.data?.data?.filterOptions || analytics.data?.filterOptions;
  check('college-admin analytics locked to own college', analytics.status === 200 && Array.isArray(fo?.colleges) && fo.colleges.length === 1, `filterOptions.colleges=${JSON.stringify(fo?.colleges)}`);

  console.log('\n=== SUPER-ADMIN-ONLY GUARDS ===');
  r = await call('GET', '/admin/colleges', { token: collegeToken });
  check('college-admin /admin/colleges → 403', r.status === 403, `status=${r.status}`);

  const targetId = (rosterRows[0]?.id || rosterRows[0]?.user_id);
  if (targetId) {
    r = await call('DELETE', `/candidates/${targetId}`, { token: collegeToken });
    check('college-admin DELETE candidate → 403', r.status === 403, `status=${r.status} target=${targetId}`);
    r = await call('GET', `/candidates/${targetId}`, { token: collegeToken });
    check('college-admin GET same-college candidate → 200', r.status === 200, `status=${r.status}`);
  } else {
    check('college-admin read-only delete test', false, 'no candidate id found');
  }

  console.log('\n=== EXPORT (scoped) ===');
  const exp = await fetch(`${BASE}/admin/reports/export`, { headers: { Authorization: `Bearer ${collegeToken}` } });
  const csv = await exp.text();
  const rows = csv.trim().split('\r\n');
  check('college-admin export CSV scoped', exp.status === 200 && rows.length - 1 === Number(scopedSubs), `status=${exp.status} rows=${rows.length - 1} subs=${scopedSubs}`);
  const distinctColleges = [...new Set(rows.slice(1).map((l) => l.split(',')[2]))];
  check('export contains only own college', distinctColleges.length === 1, `colleges=${JSON.stringify(distinctColleges)}`);

  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  return fail;
};

main()
  .then((failed) => { process.exitCode = failed ? 1 : 0; })
  .catch((err) => { console.error('SMOKE TEST ERROR:', err); process.exitCode = 1; })
  .finally(async () => {
    if (createdAdminId) await pool.query('DELETE FROM users WHERE id = $1', [createdAdminId]).catch(() => {});
    await pool.end();
  });
