import { pool, getDbStatus } from '../db/pool.js';
import crypto from 'crypto';
import { fallbackQuestions } from '../mockFallback.js';

let questionsCacheAdmin = null;
let lastAdminFetch = 0;
let questionsCacheCandidate = null;
let lastCandidateFetch = 0;
const CACHE_TTL_MS = 3000;

export const clearQuestionsCache = () => {
  questionsCacheAdmin = null;
  lastAdminFetch = 0;
  questionsCacheCandidate = null;
  lastCandidateFetch = 0;
};

// GET /api/questions
export const getAllQuestions = async (req, res) => {
  try {
    if (!pool || !getDbStatus()) {
      let filtered = [...fallbackQuestions];
      const { category, difficulty, topic } = req.query;
      if (category) filtered = filtered.filter(q => String(q.category).toLowerCase() === category.toLowerCase());
      if (difficulty) filtered = filtered.filter(q => String(q.difficulty).toLowerCase() === difficulty.toLowerCase());
      if (topic) filtered = filtered.filter(q => String(q.topic).toLowerCase().includes(topic.toLowerCase()));
      return res.json({ success: true, data: filtered, total: filtered.length });
    }

    const { category, difficulty, topic } = req.query;
    const isFiltered = category || difficulty || topic;
    const isAdmin = req.user?.role === 'admin';

    const now = Date.now();
    if (!isFiltered) {
      if (isAdmin && questionsCacheAdmin && (now - lastAdminFetch < CACHE_TTL_MS)) {
        return res.json(questionsCacheAdmin);
      }
      if (!isAdmin && questionsCacheCandidate && (now - lastCandidateFetch < CACHE_TTL_MS)) {
        return res.json(questionsCacheCandidate);
      }
    }

    // Exam Integrity Protection: Omit answer key & explanation from candidate queries
    let sql = `
      SELECT id, category, topic, difficulty, type, question,
             code_snippet, language, marks, time_limit_sec,
             status, source, options, test_cases, starter_templates, constraints,
             ${isAdmin ? 'correct_answer, explanation,' : ''}
             tags, created_at, updated_at
      FROM questions
      WHERE 1=1
    `;
    const params = [];
    if (category) { params.push(category); sql += ` AND category=$${params.length}`; }
    if (difficulty) { params.push(difficulty); sql += ` AND difficulty=$${params.length}`; }
    if (topic) { params.push(`%${topic}%`); sql += ` AND topic ILIKE $${params.length}`; }
    sql += ' ORDER BY created_at DESC';

    const result = await pool.query(sql, params);
    const responsePayload = { success: true, data: result.rows, total: result.rowCount };

    if (!isFiltered) {
      if (isAdmin) {
        questionsCacheAdmin = responsePayload;
        lastAdminFetch = now;
      } else {
        questionsCacheCandidate = responsePayload;
        lastCandidateFetch = now;
      }
    }

    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/questions  (admin only)
export const createQuestion = async (req, res) => {
  const {
    id: customId,
    category,
    topic,
    difficulty,
    type,
    question,
    codeSnippet,
    language,
    options,
    correctAnswer,
    explanation,
    marks,
    timeLimitSec,
    tags,
    testCases,
    test_cases,
    starterTemplates,
    starter_templates,
    constraints
  } = req.body;

  const id = customId || `q-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const resolvedTestCases = testCases || test_cases || null;
  const resolvedStarterTemplates = starterTemplates || starter_templates || null;

  try {
    clearQuestionsCache();
    const result = await pool.query(
      `INSERT INTO questions (id, category, topic, difficulty, type, question, code_snippet, language, options, correct_answer, explanation, marks, time_limit_sec, tags, test_cases, starter_templates, constraints)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO UPDATE SET
         category = EXCLUDED.category,
         topic = EXCLUDED.topic,
         difficulty = EXCLUDED.difficulty,
         type = EXCLUDED.type,
         question = EXCLUDED.question,
         code_snippet = EXCLUDED.code_snippet,
         language = EXCLUDED.language,
         options = EXCLUDED.options,
         correct_answer = EXCLUDED.correct_answer,
         explanation = EXCLUDED.explanation,
         marks = EXCLUDED.marks,
         time_limit_sec = EXCLUDED.time_limit_sec,
         tags = EXCLUDED.tags,
         test_cases = EXCLUDED.test_cases,
         starter_templates = EXCLUDED.starter_templates,
         constraints = EXCLUDED.constraints,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        id,
        category || 'Technical',
        topic || 'General',
        difficulty || 'Medium',
        type || 'Single Choice',
        question,
        codeSnippet || null,
        language || null,
        JSON.stringify(options || []),
        correctAnswer || 'A',
        explanation || null,
        marks || 4,
        timeLimitSec || 60,
        tags || [],
        resolvedTestCases ? JSON.stringify(resolvedTestCases) : null,
        resolvedStarterTemplates ? JSON.stringify(resolvedStarterTemplates) : null,
        constraints || null
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/questions/:id
export const updateQuestion = async (req, res) => {
  const {
    category,
    topic,
    difficulty,
    type,
    question,
    options,
    correctAnswer,
    explanation,
    marks,
    testCases,
    test_cases,
    starterTemplates,
    starter_templates,
    constraints
  } = req.body;

  const resolvedTestCases = testCases || test_cases || null;
  const resolvedStarterTemplates = starterTemplates || starter_templates || null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    clearQuestionsCache();

    const result = await client.query(
      `UPDATE questions SET 
         category=COALESCE($1, category), 
         topic=COALESCE($2, topic), 
         difficulty=COALESCE($3, difficulty), 
         type=COALESCE($4, type), 
         question=COALESCE($5, question),
         options=CASE WHEN $6::text IS NOT NULL THEN $6::jsonb ELSE options END, 
         correct_answer=COALESCE($7, correct_answer), 
         explanation=COALESCE($8, explanation),
         marks=COALESCE($9, marks),
         test_cases=CASE WHEN $10::text IS NOT NULL THEN $10::jsonb ELSE test_cases END,
         starter_templates=CASE WHEN $11::text IS NOT NULL THEN $11::jsonb ELSE starter_templates END,
         constraints=COALESCE($12, constraints),
         updated_at=CURRENT_TIMESTAMP 
       WHERE id=$13 RETURNING *`,
      [
        category,
        topic,
        difficulty,
        type,
        question,
        options ? JSON.stringify(options) : null,
        correctAnswer,
        explanation,
        marks,
        resolvedTestCases ? JSON.stringify(resolvedTestCases) : null,
        resolvedStarterTemplates ? JSON.stringify(resolvedStarterTemplates) : null,
        constraints,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Question not found.' });
    }

    const updatedQ = result.rows[0];

    // Cascade update to assessment_questions table
    await client.query(
      `UPDATE assessment_questions SET
         category = $1,
         topic = $2,
         difficulty = $3,
         question = $4,
         options = $5,
         correct_answer = $6,
         marks = $7,
         test_cases = $8,
         starter_templates = $9,
         constraints = $10
       WHERE question_id = $11`,
      [
        updatedQ.category,
        updatedQ.topic,
        updatedQ.difficulty,
        updatedQ.question,
        JSON.stringify(updatedQ.options),
        updatedQ.correct_answer,
        updatedQ.marks,
        updatedQ.test_cases ? JSON.stringify(updatedQ.test_cases) : null,
        updatedQ.starter_templates ? JSON.stringify(updatedQ.starter_templates) : null,
        updatedQ.constraints || null,
        req.params.id
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, data: updatedQ });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// DELETE /api/questions/:id
export const deleteQuestion = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    clearQuestionsCache();

    // Delete question from assessment_questions first (and foreign key CASCADE handles it too)
    await client.query('DELETE FROM assessment_questions WHERE question_id=$1', [req.params.id]);
    await client.query('DELETE FROM questions WHERE id=$1', [req.params.id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Question and all assessment links deleted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
