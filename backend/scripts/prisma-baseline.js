import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import pkg from 'pg';
import { databaseUrl } from '../src/config/urls.js';

dotenv.config();

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../prisma/migrations');

const connectionString = databaseUrl();
const dryRun = process.argv.includes('--dry-run');

const baseMigration = fs.existsSync(migrationsDir)
  ? fs
      .readdirSync(migrationsDir)
      .filter((name) => /^\d+_/.test(name) && fs.statSync(path.join(migrationsDir, name)).isDirectory())
      .sort()[0]
  : undefined;

const toRegclass = async (pool, name) =>
  (await pool.query('SELECT to_regclass($1) AS t', [`public.${name}`])).rows[0].t;

const main = async () => {
  if (!baseMigration) {
    console.log('[prisma-baseline] No migrations found — nothing to baseline.');
    return;
  }
  if (!connectionString) {
    throw new Error('DATABASE_URL / DATABASE_PUBLIC_URL is not set.');
  }

  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const coreExists = await toRegclass(pool, 'users');
    if (!coreExists) {
      console.log('[prisma-baseline] Database is empty — run "npm run db:migrate" to create the schema from scratch.');
      return;
    }

    const ledgerExists = await toRegclass(pool, '_prisma_migrations');
    let alreadyRecorded = false;
    if (ledgerExists) {
      const res = await pool.query(
        'SELECT 1 FROM _prisma_migrations WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL',
        [baseMigration]
      );
      alreadyRecorded = res.rowCount > 0;
    }

    if (alreadyRecorded) {
      console.log(`[prisma-baseline] Baseline "${baseMigration}" already recorded — schema left untouched.`);
      return;
    }

    console.log(`[prisma-baseline] Existing schema detected. Marking baseline "${baseMigration}" as applied (no data is modified).`);
    if (dryRun) {
      console.log('[prisma-baseline] --dry-run: skipping "prisma migrate resolve".');
      return;
    }
    execFileSync('npx', ['prisma', 'migrate', 'resolve', '--applied', baseMigration], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
    console.log('[prisma-baseline] Done. "prisma migrate deploy" will now only apply migrations added after this baseline.');
  } finally {
    await pool.end();
  }
};

main().catch((err) => {
  console.error('[prisma-baseline] Failed:', err.message);
  process.exit(1);
});
