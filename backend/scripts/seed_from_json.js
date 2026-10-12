import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data/questions');

const SECTIONS = [
  { key: 'aptitude', file: 'aptitude.json', section: 'Aptitude', prefix: 'apt', kind: 'mcq' },
  { key: 'reasoning', file: 'reasoning.json', section: 'Reasoning', prefix: 'rea', kind: 'mcq' },
  { key: 'technical', file: 'technical.json', section: 'Technical', prefix: 'tec', kind: 'mcq' },
  { key: 'verbal', file: 'verbal.json', section: 'Verbal', prefix: 'ver', kind: 'mcq' },
  { key: 'coding', file: 'coding.json', section: 'Coding', prefix: 'cod', kind: 'coding' }
];

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const requested = process.argv[2] || 'all';
const selected = SECTIONS.filter((s) => requested === 'all' || s.key === requested);

if (selected.length === 0) {
  console.error(`Unknown section "${requested}". Use one of: ${SECTIONS.map((s) => s.key).join(', ')}, all`);
  process.exit(1);
}

const results = [];

for (const cfg of selected) {
  const filePath = path.join(DATA_DIR, cfg.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`skip ${cfg.file} (not found)`);
    continue;
  }

  const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(doc.questions)) {
    console.warn(`skip ${cfg.file} (no questions array)`);
    continue;
  }

  const client = await pool.connect();
  let count = 0;
  try {
    await client.query('BEGIN');

    for (const q of doc.questions) {
      const topicId = `top-${cfg.prefix}-${slug(q.topic)}`;

      await client.query(
        `INSERT INTO topics (id, name, category, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, status = EXCLUDED.status`,
        [topicId, q.topic, cfg.section]
      );

      if (cfg.kind === 'coding') {
        await client.query(
          `INSERT INTO questions (id, topic_id, topic, category, difficulty, type, question,
              options, correct_answer, explanation, marks, time_limit_sec, status, source, tags,
              constraints, starter_templates, test_cases)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'[]'::jsonb,NULL,$8,$9,$10,'Active','JSON',$11,$12,$13,$14)
           ON CONFLICT (id) DO UPDATE SET
             topic_id=EXCLUDED.topic_id, topic=EXCLUDED.topic, category=EXCLUDED.category,
             difficulty=EXCLUDED.difficulty, type=EXCLUDED.type, question=EXCLUDED.question,
             explanation=EXCLUDED.explanation, marks=EXCLUDED.marks, time_limit_sec=EXCLUDED.time_limit_sec,
             status=EXCLUDED.status, source=EXCLUDED.source, tags=EXCLUDED.tags,
             constraints=EXCLUDED.constraints, starter_templates=EXCLUDED.starter_templates,
             test_cases=EXCLUDED.test_cases, updated_at=CURRENT_TIMESTAMP`,
          [
            q.id, topicId, q.topic, cfg.section, q.difficulty, q.type || 'Coding', q.question,
            q.explanation || '', q.marks ?? 1, q.timeLimitSec ?? 60, q.tags ?? [],
            q.constraints != null ? JSON.stringify(q.constraints) : null,
            JSON.stringify(q.starterTemplates ?? {}),
            JSON.stringify(q.testCases ?? [])
          ]
        );
      } else {
        await client.query(
          `INSERT INTO questions (id, topic_id, topic, category, difficulty, type, question,
              options, correct_answer, explanation, marks, time_limit_sec, status, source, tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,'Active','JSON',$13)
           ON CONFLICT (id) DO UPDATE SET
             topic_id=EXCLUDED.topic_id, topic=EXCLUDED.topic, category=EXCLUDED.category,
             difficulty=EXCLUDED.difficulty, type=EXCLUDED.type, question=EXCLUDED.question,
             options=EXCLUDED.options, correct_answer=EXCLUDED.correct_answer,
             explanation=EXCLUDED.explanation, marks=EXCLUDED.marks, time_limit_sec=EXCLUDED.time_limit_sec,
             status=EXCLUDED.status, source=EXCLUDED.source, tags=EXCLUDED.tags, updated_at=CURRENT_TIMESTAMP`,
          [
            q.id, topicId, q.topic, cfg.section, q.difficulty, q.type || 'Single Choice', q.question,
            JSON.stringify(q.options ?? []), q.correctAnswer ?? null, q.explanation ?? '',
            q.marks ?? 1, q.timeLimitSec ?? 60, q.tags ?? []
          ]
        );
      }
      count++;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  results.push({ section: cfg.section, file: cfg.file, count });
  console.log(`loaded ${cfg.file}: ${count} questions`);
}

const grand = results.reduce((s, r) => s + r.count, 0);
console.log(`\nTotal loaded this run: ${grand}`);

const dbTotals = await pool.query(
  `SELECT category, COUNT(*)::int AS n FROM questions WHERE source = 'JSON' GROUP BY category ORDER BY category`
);
console.log('\nquestions with source=JSON in DB:');
console.table(dbTotals.rows);

await pool.end();
