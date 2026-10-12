import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data/questions');
const LETTERS = ['A', 'B', 'C', 'D'];

const SECTIONS = [
  {
    key: 'aptitude', file: 'aptitude.json', section: 'Aptitude', prefix: 'apt', kind: 'mcq',
    topics: [
      'Percentages', 'Profit & Loss', 'Ratio & Proportion', 'Averages',
      'Time, Speed & Distance', 'Time & Work', 'Simple & Compound Interest',
      'Number System', 'Permutation, Combination & Probability', 'Mensuration',
      'Mixtures & Alligation', 'Pipes & Cisterns', 'Boats & Streams', 'Ages',
      'Data Interpretation'
    ]
  },
  {
    key: 'reasoning', file: 'reasoning.json', section: 'Reasoning', prefix: 'rea', kind: 'mcq',
    topics: [
      'Number Series', 'Letter & Symbol Series', 'Analogy',
      'Classification (Odd One Out)', 'Coding & Decoding', 'Blood Relations',
      'Direction Sense', 'Order & Ranking', 'Seating Arrangement', 'Syllogism',
      'Statement, Assumption & Conclusion', 'Logical Deduction', 'Venn Diagrams',
      'Puzzles', 'Calendar & Clock'
    ]
  },
  {
    key: 'technical', file: 'technical.json', section: 'Technical', prefix: 'tec', kind: 'mcq',
    topics: [
      'Programming Fundamentals', 'Data Structures', 'Algorithms', 'DBMS & SQL',
      'Operating Systems', 'Computer Networks', 'Object-Oriented Programming',
      'Software Engineering', 'Web Technologies', 'Security Basics',
      'Cloud & DevOps', 'Git & Version Control', 'Complexity Analysis',
      'Compilers & Languages', 'System Design Basics'
    ]
  },
  {
    key: 'verbal', file: 'verbal.json', section: 'Verbal', prefix: 'ver', kind: 'mcq',
    topics: [
      'Synonyms', 'Antonyms', 'One Word Substitution', 'Idioms & Phrases',
      'Spelling', 'Fill in the Blanks', 'Sentence Correction',
      'Reading Comprehension', 'Para Jumbles', 'Active & Passive Voice',
      'Direct & Indirect Speech', 'Prepositions', 'Articles',
      'Subject–Verb Agreement', 'Cloze Test'
    ]
  },
  {
    key: 'coding', file: 'coding.json', section: 'Coding', prefix: 'cod', kind: 'coding',
    topics: ['Arrays & Algorithms', 'String Manipulation', 'Numbers & Math', 'Recursion & Math']
  }
];

const errors = [];
const warnings = [];
const seenIds = new Set();
const seenContent = new Set();

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const normalize = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

function validateMcq(cfg, q, where) {
  if (q.section !== cfg.section) errors.push(`${where} section != ${cfg.section}`);
  if (!cfg.topics.includes(q.topic)) errors.push(`${where} unknown topic: "${q.topic}"`);
  if (!['Easy', 'Medium', 'Hard'].includes(q.difficulty)) errors.push(`${where} bad difficulty: ${q.difficulty}`);
  if (q.type !== 'Single Choice') errors.push(`${where} bad type: ${q.type}`);
  if (!isNonEmptyString(q.question)) errors.push(`${where} empty question`);
  if (!isNonEmptyString(q.explanation)) errors.push(`${where} empty explanation`);
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`${where} options must have exactly 4 entries`);
  } else {
    q.options.forEach((o) => {
      if (!isNonEmptyString(o)) errors.push(`${where} empty option`);
    });
    const uniq = new Set(q.options.map((o) => String(o).trim().toLowerCase()));
    if (uniq.size !== 4) warnings.push(`${where} duplicate options`);
  }
  if (!LETTERS.includes(String(q.correctAnswer).toUpperCase())) {
    errors.push(`${where} bad correctAnswer: ${q.correctAnswer}`);
  }
}

function validateCoding(cfg, q, where) {
  if (q.type !== 'Coding') errors.push(`${where} type != Coding`);
  if (!isNonEmptyString(q.question)) errors.push(`${where} empty question`);
  if (!isNonEmptyString(q.constraints)) errors.push(`${where} empty constraints`);
  if (!q.starterTemplates || typeof q.starterTemplates !== 'object') {
    errors.push(`${where} missing starterTemplates`);
  } else {
    for (const lang of ['python', 'javascript', 'cpp', 'java']) {
      if (!isNonEmptyString(q.starterTemplates[lang])) errors.push(`${where} starterTemplates missing ${lang}`);
    }
  }
  if (!Array.isArray(q.testCases) || q.testCases.length === 0) {
    errors.push(`${where} testCases must be a non-empty array`);
  } else {
    q.testCases.forEach((tc, ti) => {
      const tw = `${where}.testCase[${ti}]`;
      if (!isNonEmptyString(tc.input)) errors.push(`${tw} missing input`);
      if (!isNonEmptyString(tc.expectedOutput)) errors.push(`${tw} missing expectedOutput`);
      if (typeof tc.isHidden !== 'boolean') warnings.push(`${tw} isHidden not boolean`);
    });
  }
}

function validateSection(cfg) {
  const filePath = path.join(DATA_DIR, cfg.file);
  if (!fs.existsSync(filePath)) {
    errors.push(`[${cfg.key}] file missing: ${cfg.file}`);
    return 0;
  }

  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    errors.push(`[${cfg.key}] invalid JSON: ${e.message}`);
    return 0;
  }

  if (doc.section !== cfg.section) errors.push(`[${cfg.key}] doc.section != "${cfg.section}"`);
  if (!Array.isArray(doc.questions)) {
    errors.push(`[${cfg.key}] questions is not an array`);
    return 0;
  }

  const perTopic = {};
  const perDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  const perAnswer = { A: 0, B: 0, C: 0, D: 0 };

  doc.questions.forEach((q, i) => {
    const where = `[${cfg.file}#${i + 1}]`;

    if (!new RegExp(`^${cfg.prefix}-\\d{4}`).test(`${q.id}`) && !/^code-q-/.test(`${q.id}`)) {
      errors.push(`${where} bad id: ${q.id}`);
    }
    if (seenIds.has(q.id)) errors.push(`${where} duplicate id: ${q.id}`);
    seenIds.add(q.id);

    if (cfg.kind === 'coding') {
      validateCoding(cfg, q, where);
    } else {
      validateMcq(cfg, q, where);
    }

    if (q.topic !== undefined && !cfg.topics.includes(q.topic)) {
      errors.push(`${where} unknown topic: "${q.topic}"`);
    }
    if (q.difficulty !== undefined && !(q.difficulty in perDifficulty)) {
      errors.push(`${where} bad difficulty: ${q.difficulty}`);
    }

    const contentKey = [
      cfg.section,
      String(q.question || '').trim().toLowerCase().replace(/\s+/g, ' '),
      JSON.stringify(q.options || [])
    ].join('|');
    if (seenContent.has(contentKey)) warnings.push(`${where} duplicate question/options`);
    seenContent.add(contentKey);

    if (q.topic) perTopic[q.topic] = (perTopic[q.topic] || 0) + 1;
    if (q.difficulty) perDifficulty[q.difficulty] = (perDifficulty[q.difficulty] || 0) + 1;
    const ans = String(q.correctAnswer || '').toUpperCase();
    if (ans in perAnswer) perAnswer[ans]++;
  });

  console.log(`\n=== ${cfg.section} (${cfg.file}) ===`);
  console.log(`total: ${doc.questions.length}`);
  console.log(`by topic:`, perTopic);
  console.log(`by difficulty:`, perDifficulty);
  if (cfg.kind === 'mcq') console.log(`by answer:`, perAnswer);

  return doc.questions.length;
}

let grandTotal = 0;
for (const cfg of SECTIONS) grandTotal += validateSection(cfg);

console.log(`\nGRAND TOTAL: ${grandTotal}`);

if (warnings.length) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  warnings.slice(0, 30).forEach((w) => console.log(' -', w));
}
if (errors.length) {
  console.log(`\nERRORS (${errors.length}):`);
  errors.slice(0, 60).forEach((e) => console.log(' -', e));
  process.exitCode = 1;
} else {
  console.log('\nAll checks passed.');
}
