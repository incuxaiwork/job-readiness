# Question Bank Library

Maintainable, versioned MCQ banks that live in the repo as JSON — one file per
section. A loader script ingests them into PostgreSQL (`questions` table).

## Layout

```
backend/data/questions/
  README.md          <- this file (schema + topic taxonomy)
  aptitude.json
  reasoning.json
  technical.json
  verbal.json
  coding.json        <- coding challenges (test cases / starter templates)
```

## Schema (single-choice sections)

```jsonc
{
  "section": "Aptitude",     // canonical section name
  "version": 1,              // bump on structural change
  "questions": [
    {
      "id": "apt-0001",       // <prefix>-<4-digit>, unique across the bank
      "section": "Aptitude",  // must equal the file's "section"
      "topic": "Percentages", // MUST be one of the section's topics (see below)
      "difficulty": "Easy",   // Easy | Medium | Hard
      "type": "Single Choice",
      "question": "…",
      "options": ["…", "…", "…", "…"],   // exactly 4, order defines A/B/C/D
      "correctAnswer": "C",              // "A"|"B"|"C"|"D" — index into options
      "explanation": "…",                // short, why the answer is correct
      "marks": 1,
      "timeLimitSec": 60,
      "tags": ["percentage"]             // free-form lowercase tags
    }
  ]
}
```

IDs: `apt-####`, `rea-####`, `tec-####`, `ver-####`, `cod-####`.
`correctAnswer` uses letters because the backend grades with
`correct_answer.charCodeAt(0) - 65` (see `backend/src/services/evaluationService.js`).

## Topic taxonomy (used for per-topic weakness analysis)

**Aptitude** — Percentages · Profit & Loss · Ratio & Proportion · Averages ·
Time, Speed & Distance · Time & Work · Simple & Compound Interest · Number
System · Permutation, Combination & Probability · Mensuration · Mixtures &
Alligation · Pipes & Cisterns · Boats & Streams · Ages · Data Interpretation

**Reasoning** — Number Series · Letter & Symbol Series · Analogy ·
Classification (Odd One Out) · Coding & Decoding · Blood Relations · Direction
Sense · Order & Ranking · Seating Arrangement · Syllogism · Statement,
Assumption & Conclusion · Logical Deduction · Venn Diagrams · Puzzles ·
Calendar & Clock

**Technical** — Programming Fundamentals · Data Structures · Algorithms ·
DBMS & SQL · Operating Systems · Computer Networks · Object-Oriented
Programming · Software Engineering · Web Technologies · Security Basics ·
Cloud & DevOps · Git & Version Control · Complexity Analysis · Compilers &
Languages · System Design Basics

**Verbal** — Synonyms · Antonyms · One Word Substitution · Idioms & Phrases ·
Spelling · Fill in the Blanks · Sentence Correction · Reading Comprehension ·
Para Jumbles · Active & Passive Voice · Direct & Indirect Speech ·
Prepositions · Articles · Subject–Verb Agreement · Cloze Test

## Loading into the DB

```bash
npm run seed:questions            # upsert every section from backend/data/questions
npm run seed:questions -- aptitude
```

See `backend/scripts/seed_from_json.js`. It is idempotent (`ON CONFLICT (id) DO
UPDATE`) and never deletes existing rows.

## Validating the library

```bash
npm run questions:validate        # schema + id/topic/difficulty + answer-key checks
```

`backend/scripts/validate_questions_json.js` fails the build on missing ids,
unknown topics, malformed options, empty explanations, or bad coding test cases.

## Rebalancing answer keys

```bash
node backend/scripts/rebalance_question_answers.js
```

Reorders each question's options (keeping the correct option's text) so the
correct answer letters are spread evenly instead of clustering on one option.
The shuffle is seeded by question id, so it is deterministic and safe to re-run.
