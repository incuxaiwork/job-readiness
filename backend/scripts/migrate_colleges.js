/**
 * Phase 1 tenancy migration: create colleges from legacy free-text college
 * values and link existing candidates + submissions to them.
 *
 * Idempotent and re-runnable. Use --dry-run to preview without writing.
 *
 *   node scripts/migrate_colleges.js --dry-run
 *   node scripts/migrate_colleges.js
 */
import { pool } from '../src/db/pool.js';
import { initSchema } from '../src/db/schema.js';

const DRY_RUN = process.argv.includes('--dry-run');

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28) || 'college';

const run = async () => {
  await initSchema();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const namesRes = await client.query(`
      SELECT DISTINCT ON (LOWER(TRIM(college)))
             TRIM(college) AS name
      FROM candidate_profiles
      WHERE college IS NOT NULL AND TRIM(college) <> ''
      ORDER BY LOWER(TRIM(college)), college
    `);

    const existingRes = await client.query('SELECT id, name, code FROM colleges');
    const byName = new Map(existingRes.rows.map((r) => [r.name.toLowerCase(), r]));
    const usedCodes = new Set(existingRes.rows.map((r) => r.code).filter(Boolean));

    const uniqueCode = (base) => {
      let candidate = base;
      let n = 2;
      while (usedCodes.has(candidate)) candidate = `${base.slice(0, 26)}-${n++}`;
      usedCodes.add(candidate);
      return candidate;
    };

    const mapping = [];
    let created = 0;
    let profilesLinked = 0;

    for (const { name } of namesRes.rows) {
      const key = name.toLowerCase();
      let college = byName.get(key);

      if (!college) {
        const code = uniqueCode(slugify(name));
        const id = `col-${code}`;
        await client.query(
          `INSERT INTO colleges (id, name, code, status)
           VALUES ($1, $2, $3, 'active')
           ON CONFLICT (code) DO NOTHING`,
          [id, name, code]
        );
        const inserted = await client.query('SELECT id, name, code FROM colleges WHERE code = $1', [code]);
        college = inserted.rows[0];
        byName.set(key, college);
        created++;
      }

      const upd = await client.query(
        `UPDATE candidate_profiles
         SET college_id = $1, college = $2
         WHERE college_id IS NULL AND LOWER(TRIM(college)) = LOWER($3)`,
        [college.id, name, name]
      );
      profilesLinked += upd.rowCount;

      mapping.push({ name, code: college.code, id: college.id, profiles: upd.rowCount });
    }

    const subs = await client.query(`
      UPDATE assessment_submissions s
      SET college_id = cp.college_id
      FROM candidate_profiles cp
      WHERE s.college_id IS NULL AND cp.college_id IS NOT NULL
        AND (
          s.candidate_id = cp.id
          OR s.candidate_id = cp.user_id
          OR LOWER(s.candidate_email) = LOWER(cp.email)
        )
    `);

    const users = await client.query(`
      UPDATE users u
      SET college_id = cp.college_id
      FROM candidate_profiles cp
      WHERE u.college_id IS NULL AND cp.college_id IS NOT NULL AND u.role = 'candidate'
        AND (
          cp.user_id = u.id
          OR cp.id = u.id
          OR LOWER(cp.email) = LOWER(u.email)
        )
    `);

    if (DRY_RUN) {
      await client.query('ROLLBACK');
    } else {
      await client.query('COMMIT');
    }

    console.log(`\n${DRY_RUN ? 'DRY RUN (rolled back)' : 'MIGRATION APPLIED'}\n`);
    console.log(`colleges created:        ${created}`);
    console.log(`candidate_profiles linked: ${profilesLinked}`);
    console.log(`submissions backfilled:  ${subs.rowCount}`);
    console.log(`users linked:            ${users.rowCount}`);
    console.log('\ncollege mapping:');
    if (mapping.length) console.table(mapping);
    else console.log('  (no legacy college values found)');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((err) => {
  console.error('❌ College migration failed:', err.message);
  process.exit(1);
});
