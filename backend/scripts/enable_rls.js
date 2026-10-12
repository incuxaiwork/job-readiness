/**
 * Defense-in-depth: enable Row Level Security (RLS) on all public tables.
 *
 * Context: this app is NOT Supabase — the backend connects with a single, privileged
 * PostgreSQL role and mediates all access. Table owners bypass RLS, so enabling RLS
 * here does NOT change the application's own queries. It DOES deny every OTHER role by
 * default, so a leaked non-owner credential cannot read or write application data.
 *
 * Usage:
 *   node scripts/enable_rls.js            # enable RLS (default-deny for non-owners)
 *   node scripts/enable_rls.js --force    # also FORCE RLS (owner no longer exempt — advanced)
 *   node scripts/enable_rls.js --dry-run  # print the statements without executing
 */
import { pool } from '../src/db/pool.js';

const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

const run = async () => {
  if (!pool) {
    console.error('No DATABASE_URL configured.');
    process.exit(1);
  }

  const { rows } = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  if (rows.length === 0) {
    console.log('No public tables found.');
    await pool.end();
    return;
  }

  for (const { tablename } of rows) {
    const stmt = `ALTER TABLE public.${tablename} ENABLE ROW LEVEL SECURITY;` +
      (force ? `\nALTER TABLE public.${tablename} FORCE ROW LEVEL SECURITY;` : '');
    if (dryRun) {
      console.log(stmt);
    } else {
      await pool.query(stmt);
      console.log(`✅ RLS enabled on public.${tablename}${force ? ' (FORCE)' : ''}`);
    }
  }

  if (!dryRun && force) {
    console.warn('⚠️  FORCE ROW LEVEL SECURITY is on: the application role must now be granted explicit policies or it will lose access.');
  }

  await pool.end();
};

run().catch((err) => {
  console.error('Failed to enable RLS:', err.message);
  process.exit(1);
});
