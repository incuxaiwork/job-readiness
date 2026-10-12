import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data/questions');
const FILES = ['aptitude.json', 'reasoning.json', 'technical.json', 'verbal.json'];
const LETTERS = ['A', 'B', 'C', 'D'];

const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

let moved = 0;
let skipped = 0;

for (const file of FILES) {
  const filePath = path.join(DATA_DIR, file);
  const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const q of doc.questions) {
    if (!Array.isArray(q.options) || q.options.length !== 4) { skipped++; continue; }
    const current = LETTERS.indexOf(String(q.correctAnswer).toUpperCase());
    if (current < 0) { skipped++; continue; }

    const target = hash(String(q.id)) % 4;
    if (target === current) { skipped++; continue; }

    const correctText = q.options[current];
    const others = q.options.filter((_, i) => i !== current);
    others.splice(target, 0, correctText);
    q.options = others;
    q.correctAnswer = LETTERS[target];
    moved++;
  }

  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + '\n');
  console.log(`rebalanced ${file}`);
}

console.log(`\nmoved: ${moved}, already-ok/skipped: ${skipped}`);
