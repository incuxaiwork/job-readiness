# College Portal & Multi-Tenancy — Design Plan

Status: **Draft for review** · Owner: platform team · Scope agreed: college-admin
login + scoped analytics, super-admin onboarding of colleges, results export.

---

## 1. Why

Today the platform is single-tenant. There is exactly one admin role and one shared
admin dashboard that sees **all** candidates from all colleges. `college` is only a
free-text string on `candidate_profiles` (and is guessed from the email domain in
analytics).

To run day-by-day drives for colleges we need:

1. **Super-admin onboarding** — we create a college and issue credentials for its
   college admin.
2. **College-admin login** — each college's staff log in and see **only their own**
   students' performance (strict tenant isolation).
3. **Results export** — download per-college result sheets (CSV / PDF).

Deferred (designed-for, not built now): assigning specific exams to a college on a
date, cohorts/batches, student CSV roster import.

---

## 2. Current state (grounded in the code)

| Concern | Where | Today |
|---|---|---|
| Roles | `backend/src/db/schema.js:6-15` | `users.role` ∈ {`candidate`, `admin`} only |
| Single admin | `schema.js:467-473` | seeded `admin@readysetjob.com` / `Admin@2026` |
| Admin auth | `backend/src/controllers/auth.controller.js:504-560` | matches `role='admin'`; accepts emergency master passwords (`:537`) |
| RBAC | `backend/src/middleware/rbac.js` | `requireRole('admin')` |
| Object auth | `backend/src/middleware/ownership.js` | `requireSelfOrAdmin` treats `admin` as global |
| Admin routes | `backend/src/routes/admin.routes.js` | `/api/admin/{stats,analytics,reports}` all `requireRole('admin')` |
| Analytics | `backend/src/controllers/admin.controller.js:43-333` | KPIs, distribution, category mastery, trend, weak topics; filters by `dateRange`, **`college` (free text)**, `assessmentId` |
| Candidates | `backend/src/controllers/candidates.controller.js`, `routes/candidates.routes.js:25-27` | admin-only roster / delete / reset-attempt |
| College data | `schema.js:24` | `candidate_profiles.college VARCHAR(255)`, no entity, no FK |
| Submissions | `schema.js:126-142` | `assessment_submissions` has no `college_id` |
| Frontend guard | `frontend/src/App.jsx:51-57` | `RequireAdmin` (`role==='admin'`) |
| Frontend session | `frontend/src/context/AppContext.jsx:342-357, 943-957` | `rsj_role`, `rsj_admin_user`, `rsj_user` in localStorage |
| Admin nav | `frontend/src/components/common/Sidebar.jsx:38-42` | Candidates, Question Bank, Assessments, Interviews, Analytics |
| Export libs | `frontend/package.json` | `xlsx`, `jspdf`, `html2canvas` already present |
| Existing exports | `AdminAnalyticsPage.jsx:217-261`, `AdminCandidatesPage.jsx:201` | client-side CSVs exist |

---

## 3. Roles & permission matrix

Keep the existing `admin` value as the **super-admin** (no data migration needed to
rename it); add `college_admin`.

| Capability | candidate | `college_admin` | super-admin (`admin`) |
|---|---|---|---|
| Take assessments | ✅ | — | — |
| Analytics (own college) | — | ✅ scoped | ✅ all / filterable |
| Candidate roster | own record | ✅ own college (read-only) | ✅ all |
| Candidate PII / detail | own | ✅ own college (full PII) | ✅ all |
| Delete candidate / reset attempt | — | ❌ read-only | ✅ all |
| Results export (CSV) | own | ✅ own college | ✅ all |
| Question Bank authoring | — | ❌ | ✅ |
| Assessment creation | — | ❌ | ✅ |
| AI Mock Interviews admin | — | ❌ | ✅ |
| Onboard colleges / issue credentials | — | ❌ | ✅ |

> **Decided:** college admins are **read-only** across candidate records (view
> analytics, roster, full PII and export; no reset/delete). Delete and reset-attempt
> remain super-admin only.

---

## 4. Data model changes

### 4.1 New table

```sql
CREATE TABLE IF NOT EXISTS colleges (
  id            VARCHAR(64) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(32) UNIQUE,          -- short slug, e.g. "rvce"
  domain        VARCHAR(128),                -- e.g. "rvce.edu.in" → auto-assign at signup
  city          VARCHAR(128),
  state         VARCHAR(128),
  contact_name  VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(32),
  status        VARCHAR(32) DEFAULT 'active', -- active | suspended
  created_by    VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Columns to add

```sql
ALTER TABLE users                    ADD COLUMN IF NOT EXISTS college_id VARCHAR(64) REFERENCES colleges(id) ON DELETE SET NULL;
ALTER TABLE candidate_profiles       ADD COLUMN IF NOT EXISTS college_id VARCHAR(64) REFERENCES colleges(id) ON DELETE SET NULL;
ALTER TABLE assessment_submissions   ADD COLUMN IF NOT EXISTS college_id VARCHAR(64) REFERENCES colleges(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_college            ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_college ON candidate_profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_submissions_college      ON assessment_submissions(college_id);
```

- `candidate_profiles.college_id` is the source of truth for a student's college.
- `assessment_submissions.college_id` is **denormalized at submit time** so analytics
  and exports stay fast and correct even if a profile later changes.
- Keep the legacy `candidate_profiles.college` text for display; it is backfilled.

### 4.3 Backfill / migration (`backend/scripts/migrate_colleges.js`)

1. `INSERT ... SELECT DISTINCT college` from `candidate_profiles` (trimmed, non-empty)
   into `colleges` (generate `id`, `code` from a slug of the name).
2. Set `candidate_profiles.college_id` by matching `LOWER(TRIM(college))`.
3. Backfill `assessment_submissions.college_id` by joining on `candidate_id`.
4. Idempotent (`ON CONFLICT DO NOTHING`); re-runnable.

> Existing data is messy free text ("Engineering Institute", etc.). We should review
> the distinct list and merge near-duplicates before/after backfill. Provide a
> `--dry-run` that prints the mapping.

### 4.4 Candidate → college linking (signup by college code)

**Decided: students link to a college by entering the college `code` at signup.**

- `colleges.code` is the join key (short, unique, e.g. `rvce`). The super-admin
  shares it with the college.
- Extend the candidate signup payload (`auth.controller.js` register/onboard) with an
  optional `collegeCode`:
  - if provided: look up `colleges WHERE LOWER(code)=LOWER($1) AND status='active'`;
    on match set `users.college_id` and `candidate_profiles.college_id`, and keep the
    legacy `candidate_profiles.college` text synced to `colleges.name`;
    on no match → return a validation error (reject, don't silently drop).
  - if blank: allow an **unlinked** student (super-admin can fix later). Decide
    whether to require it for the college-drive flow.
- Frontend `SignupPage.jsx`: add a "College code" field (with inline validation).
- `email domain` on `colleges` is retained only as an optional convenience for the
  super-admin (e.g. suggested match when creating colleges), **not** for auto-linking.

---

## 5. Authentication

### 5.1 Login

Extend the admin login flow (`auth.controller.js`) to accept both `admin` and
`college_admin`:

- Match `WHERE LOWER(email)=$1 AND role IN ('admin','college_admin')`.
- Load the college (`colleges` row) when `role='college_admin'`; reject if
  `college.status <> 'active'`.
- JWT payload becomes:
  ```json
  { "id": "...", "email": "...", "name": "...", "role": "college_admin",
    "college_id": "col-...", "college_name": "RVCE" }
  ```
- Response adds a `college` object so the frontend can label/scope the UI.

**Security fix required:** the emergency master password branch
(`auth.controller.js:537`) must apply to `role='admin'` **only** — a college admin
must never be able to log in with `Admin@2026`.

### 5.2 Issuing / rotating credentials (super-admin only)

New endpoints (see §7). Credentials are created with bcrypt-hashed passwords.
Password delivery: no mailer exists in the codebase, so v1 shows a **one-time
temporary password** in the UI for the operator to relay, and forces a change on
first login (or at minimum flags it).

---

## 6. Tenant scoping (server-side, enforced)

**Principle: never trust a client-supplied `collegeId` for a college admin.**

New helper `backend/src/middleware/collegeScope.js`:

```js
export const resolveCollegeScope = (req) => {
  const user = req.user || {};
  if (user.role === 'college_admin') {
    return { collegeId: user.college_id, enforced: true };   // locked to own college
  }
  // super-admin may optionally narrow to one college
  const q = req.query.collegeId || req.body?.collegeId || null;
  return { collegeId: q || null, enforced: false };
};
```

Apply to every read of student data:

- `admin.controller.js` `getStats`, `getAnalytics`, `getPlacementReport`: when
  `enforced`, add `AND <table>.college_id = $n` and **ignore** any client `college`
  filter. (Keep the free-text `college` filter working for super-admin.)
- `candidates.controller.js` `getAllCandidates`: scope to `college_id`.
- `ownership.js` `requireSelfOrAdmin`: a `college_admin` may access a candidate only
  when `candidate.college_id === req.user.college_id`; otherwise 403.
- `candidates.controller.js` `resetCandidateAttempt` / `deleteCandidate`: gate by the
  same check.

Guard routes with `requireRole('admin','college_admin')` where a college admin is
allowed, and `requireRole('admin')` for super-admin-only routes (colleges, question
bank, assessments, interviews).

---

## 7. API surface

### 7.1 Super-admin only (`requireRole('admin')`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/colleges` | list colleges (+ student/admin counts) |
| POST | `/api/admin/colleges` | create a college |
| PATCH | `/api/admin/colleges/:id` | edit / suspend |
| GET | `/api/admin/colleges/:id/admins` | list college admins |
| POST | `/api/admin/colleges/:id/admins` | create credential → returns one-time password |
| PATCH | `/api/admin/colleges/:id/admins/:userId` | reset password / activate / deactivate |

### 7.2 Staff (`requireRole('admin','college_admin')`, scoped per §6)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/stats` | scoped KPIs |
| GET | `/api/admin/analytics` | scoped analytics |
| GET | `/api/admin/reports` | scoped placement report |
| GET | `/api/admin/candidates` | scoped roster |
| GET | `/api/admin/reports/export?format=csv&collegeId=&assessmentId=&dateRange=` | result sheet |

Exports: **CSV generated server-side** (no new dependency, consistent columns,
respects scope). **Decided: CSV only at launch** — PDF is deferred (the existing
`jspdf` dependency can be used later if needed).

Proposed CSV columns: `candidate_name, email, college, assessment_title, score,
accuracy, obtained_marks, total_marks, aptitude, reasoning, technical, verbal,
coding, status, submitted_at`.

---

## 8. Frontend surface

| Area | Change |
|---|---|
| `App.jsx` `RequireAdmin` (`:51-57`) | rename/extend to `RequireStaff` — allow `admin` **and** `college_admin`; add a super-admin-only guard for `/admin/colleges`, `/admin/questions`, `/admin/assessments`, `/admin/interviews` |
| `AdminLoginPage.jsx` | after login, route by role: `admin → /admin/dashboard`, `college_admin → /admin/analytics` |
| `AppContext.jsx` (`:943-957`) | persist `rsj_admin_user` including `{ role, college_id, college_name }`; expose `isCollegeAdmin` |
| `Sidebar.jsx` (`:38-42`) | college-admin nav = **Analytics, Candidates, Results/Export**; hide Question Bank / Assessments / Interviews; add **Colleges** for super-admin |
| New `pages/admin/AdminCollegesPage.jsx` | list + create colleges; manage college-admin credentials (one-time password modal) |
| `AdminAnalyticsPage.jsx` | for college admin: hide the college dropdown, show a locked "College: X" label; add **Export CSV** button |
| `AdminCandidatesPage.jsx` | scoped by role; **Export CSV** button |
| `SignupPage.jsx` | add a **College code** field (validates against `colleges.code`) |

---

## 9. Security considerations

- **Tenant isolation is server-side**; the client never dictates a college admin's scope.
- **Master password** must be `admin`-only (§5.1).
- **IDOR**: `college_admin` accessing `/api/candidates/:id` or `/submissions` must be
  checked against `college_id`, not just "is staff".
- **Suspended colleges** cannot log in and are excluded from cross-college views.
- **Audit trail**: `colleges.created_by`, plus log who issued which credential.
- **Rate limiting**: admin/college login should share the existing login limiter.
- Consider hiding candidate contact PII from college admins (open question §11).

---

## 10. Phased delivery

| Phase | Deliverable | Key files |
|---|---|---|
| 0 | **This doc approved** | — |
| 1 | Schema + `colleges` + FKs + migration/backfill script | `db/schema.js`, `scripts/migrate_colleges.js` |
| 2 | Roles + college-admin login + JWT + guards (incl. master-pw fix) | `controllers/auth.controller.js`, `middleware/rbac.js` |
| 3 | Scoping helper applied to stats/analytics/reports/candidates/ownership | `middleware/collegeScope.js`, `controllers/admin.controller.js`, `controllers/candidates.controller.js`, `middleware/ownership.js` |
| 4 | Super-admin onboarding API + `AdminCollegesPage` | new `controllers/colleges.controller.js`, `routes/admin.routes.js`, frontend page |
| 5 | College-admin portal wiring (routing, nav, scoped views) | `App.jsx`, `Sidebar.jsx`, `AppContext.jsx`, admin pages |
| 6 | Results export (CSV server + PDF client) | `controllers/admin.controller.js`, admin pages |
| 7 | Hardening + seed/demo college + tests | scripts, tests |

---

## 11. Decisions & remaining questions

**Decided:**

1. **Linking** — students link by **college code at signup** (§4.4).
2. **College-admin powers** — **read-only** (no reset/delete).
3. **PII** — college admins see **full PII** (names, email, phone, scores).
4. **Export** — **CSV only** at launch.

**Still open:**

5. **How many college admins per college?** (v1 supports one or more; one is simpler.)
6. **Credential delivery** — is there any email/SMS infra, or do we hand the
   one-time password to the operator? (None found in the repo.)
7. **Is the college code required at signup** for the drive flow, or may a student
   skip it and be unlinked?
8. **Existing colleges in data** — review/merge the distinct free-text list before
   backfill.

---

## 12. Explicitly out of scope (future phases)

- Assigning a specific assessment to a college/cohort on a scheduled date
  (`assessment_assignments` table + windows + attempt policy).
- Cohorts/batches and student CSV roster import.
- Per-college branding / sub-domains / SSO.
- Cross-college benchmarking reports.
