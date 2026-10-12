import { pool, getDbStatus } from '../db/pool.js';
import crypto from 'crypto';
import { clearAssessmentsCache } from './assessments.controller.js';
import { fallbackAssessments, fallbackQuestions } from '../mockFallback.js';

const newId = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

const parseJsonField = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
};

const mapQuestionRow = (q, includeAnswer) => ({
  id: q.id,
  question_id: q.question_id,
  section_id: q.section_id,
  category: q.category,
  topic: q.topic,
  question: q.question,
  difficulty: q.difficulty,
  options: parseJsonField(q.options),
  correct_answer: includeAnswer ? q.correct_answer : undefined,
  marks: q.marks,
  test_cases: parseJsonField(q.test_cases),
  starter_templates: parseJsonField(q.starter_templates),
  constraints: parseJsonField(q.constraints),
  type: q.type || (q.category === 'Coding' ? 'Coding' : 'Single Choice'),
});

const QUESTION_SELECT = `
  aq.id, aq.question_id, aq.section_id, aq.category, aq.topic, aq.question, aq.difficulty, aq.options,
  aq.correct_answer, aq.marks, aq.test_cases, aq.starter_templates, aq.constraints,
  COALESCE(q.type, CASE WHEN aq.category = 'Coding' THEN 'Coding' ELSE 'Single Choice' END) as type
`;

const fetchSectionQuestions = async (assessmentId, sectionId, includeAnswer) => {
  // sectionId present → scope by section; null/undefined → whole assessment (implicit section)
  const params = [sectionId || assessmentId];
  const where = sectionId ? 'aq.section_id = $1' : 'aq.assessment_id = $1';
  const res = await pool.query(
    `SELECT ${QUESTION_SELECT}
     FROM assessment_questions aq
     JOIN questions q ON q.id = aq.question_id
     WHERE ${where}
     ORDER BY aq.created_at ASC, aq.id ASC`,
    params
  );
  return res.rows.map(r => mapQuestionRow(r, includeAnswer));
};

const orderedSectionsOf = async (assessmentId) => {
  const res = await pool.query(
    `SELECT id, name, description, question_count, marks_per_question, duration_minutes, display_order
     FROM assessment_sections
     WHERE assessment_id = $1
     ORDER BY display_order ASC, created_at ASC`,
    [assessmentId]
  );
  return res.rows;
};

const timeRemainingFor = (startedAt, limitSeconds) => {
  if (!startedAt || !limitSeconds) return Number(limitSeconds) || 0;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, Number(limitSeconds) - elapsed);
};

// GET /api/assessments/:id/sections
// Admin gets full question payloads (incl. correct answers) for the sections editor;
// candidates only need names/counts/durations for the pre-start rules screen.
export const getAssessmentSections = async (req, res) => {
  try {
    if (!pool || !getDbStatus()) {
      return res.json({ success: true, data: [] });
    }

    const isAdmin = req.user?.role === 'admin';
    const sections = await orderedSectionsOf(req.params.id);
    const data = [];

    for (const sec of sections) {
      const questions = await fetchSectionQuestions(req.params.id, sec.id, isAdmin);
      data.push({
        id: sec.id,
        name: sec.name,
        description: sec.description,
        questionCount: Number(sec.question_count) || questions.length,
        marksPerQuestion: Number(sec.marks_per_question) || 1,
        durationMinutes: Number(sec.duration_minutes) || 30,
        displayOrder: sec.display_order,
        questionIds: questions.map(q => q.id),
        questions: isAdmin ? questions : undefined,
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/assessments/:id/sections  (admin) — replace-all upsert
// body: { sections: [{ id?, name, description, durationMinutes, marksPerQuestion, questionIds: [] }] }
export const replaceAssessmentSections = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id: assessmentId } = req.params;
    const incoming = Array.isArray(req.body?.sections) ? req.body.sections : null;
    if (!incoming) return res.status(400).json({ error: 'sections array is required.' });

    await client.query('BEGIN');

    const asmCheck = await client.query('SELECT id FROM assessments WHERE id = $1', [assessmentId]);
    if (asmCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const existing = await client.query(
      'SELECT id FROM assessment_sections WHERE assessment_id = $1',
      [assessmentId]
    );
    const incomingIds = incoming.map(s => s.id).filter(Boolean);
    const staleIds = existing.rows.map(r => r.id).filter(id => !incomingIds.includes(id));
    if (staleIds.length > 0) {
      // Questions pointing at removed sections are released (FK ON DELETE SET NULL)
      await client.query('DELETE FROM assessment_sections WHERE id = ANY($1::varchar[])', [staleIds]);
    }

    const savedSections = [];
    for (let i = 0; i < incoming.length; i++) {
      const s = incoming[i];
      const name = String(s.name || '').trim();
      if (!name) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Section ${i + 1} needs a name.` });
      }
      const sectionId = s.id || newId('sec');
      if (s.id) {
        await client.query(
          `UPDATE assessment_sections
           SET name = $1, description = $2, duration_minutes = $3, marks_per_question = $4, display_order = $5
           WHERE id = $6 AND assessment_id = $7`,
          [name, s.description || null, Math.max(1, Number(s.durationMinutes) || 30),
           Math.max(1, Number(s.marksPerQuestion) || 1), i + 1, sectionId, assessmentId]
        );
      } else {
        await client.query(
          `INSERT INTO assessment_sections (id, assessment_id, name, description, question_count, marks_per_question, duration_minutes, display_order)
           VALUES ($1, $2, $3, $4, 0, $5, $6, $7)`,
          [sectionId, assessmentId, name, s.description || null,
           Math.max(1, Number(s.marksPerQuestion) || 1), Math.max(1, Number(s.durationMinutes) || 30), i + 1]
        );
      }
      savedSections.push({ id: sectionId, questionIds: Array.isArray(s.questionIds) ? s.questionIds : [] });
    }

    // Reassign questions: clear first, then assign each section's list
    await client.query(
      'UPDATE assessment_questions SET section_id = NULL WHERE assessment_id = $1',
      [assessmentId]
    );
    for (const sec of savedSections) {
      if (sec.questionIds.length > 0) {
        await client.query(
          `UPDATE assessment_questions SET section_id = $1
           WHERE assessment_id = $2 AND (id = ANY($3::varchar[]) OR question_id = ANY($3::varchar[]))`,
          [sec.id, assessmentId, sec.questionIds]
        );
      }
      await client.query(
        `UPDATE assessment_sections SET question_count =
           (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = $1 AND section_id = $2)
         WHERE id = $2`,
        [assessmentId, sec.id]
      );
    }

    await client.query('COMMIT');
    clearAssessmentsCache();

    const saved = await orderedSectionsOf(assessmentId);
    const data = [];
    for (const sec of saved) {
      const qRes = await client.query(
        'SELECT id FROM assessment_questions WHERE section_id = $1',
        [sec.id]
      );
      data.push({
        id: sec.id,
        name: sec.name,
        description: sec.description,
        questionCount: Number(sec.question_count) || 0,
        marksPerQuestion: Number(sec.marks_per_question) || 1,
        durationMinutes: Number(sec.duration_minutes) || 30,
        displayOrder: sec.display_order,
        questionIds: qRes.rows.map(r => r.id),
      });
    }
    res.json({ success: true, data });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const buildStartPayload = async (client, attempt, assessment, includeAnswer, answersMap) => {
  // Section rows for this attempt (frozen at start time)
  const saRes = await client.query(
    `SELECT sa.id, sa.section_id, sa.status, sa.started_at, sa.time_limit_seconds,
            s.name, s.description, s.marks_per_question, s.display_order
     FROM section_attempts sa
     LEFT JOIN assessment_sections s ON s.id = sa.section_id
     WHERE sa.attempt_id = $1
     ORDER BY COALESCE(s.display_order, 0) ASC, sa.created_at ASC`,
    [attempt.id]
  );
  const sectionRows = saRes.rows;

  const currentIdx = Math.max(0, sectionRows.findIndex(s => s.status !== 'Completed'));

  const sections = [];
  for (let i = 0; i < sectionRows.length; i++) {
    const row = sectionRows[i];
    sections.push({
      attemptSectionId: row.id,
      id: row.section_id,
      name: row.name || 'All Questions',
      description: row.description || null,
      marksPerQuestion: Number(row.marks_per_question) || 1,
      displayOrder: Number(row.display_order) || i + 1,
      status: row.status,
      durationMinutes: Math.round((Number(row.time_limit_seconds) || 1800) / 60),
      timeLimitSeconds: Number(row.time_limit_seconds) || 1800,
    });
  }

  const current = sectionRows[currentIdx];
  if (current && current.status === 'Pending') {
    await client.query(
      `UPDATE section_attempts SET status = 'InProgress', started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
       WHERE id = $1`,
      [current.id]
    );
    current.status = 'InProgress';
    current.started_at = current.started_at || new Date();
  }

  const questions = await fetchSectionQuestions(assessment.id, current?.section_id || null, includeAnswer);
  const timeRemaining = current
    ? (current.status === 'InProgress'
        ? timeRemainingFor(current.started_at, current.time_limit_seconds)
        : Number(current.time_limit_seconds) || 1800)
    : 0;

  return {
    attemptId: attempt.id,
    resumed: attempt.resumed === true,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      category: assessment.category,
      passingScore: Number(assessment.passing_score) || 70,
      totalMarks: Number(assessment.total_marks) || 100,
      durationMinutes: Number(assessment.duration_minutes) || 30,
    },
    sections: sections.map((s, i) => ({ ...s, sectionIndex: i })),
    currentSection: {
      ...sections[currentIdx],
      sectionIndex: currentIdx,
      timeLimitSeconds: current ? Number(current.time_limit_seconds) || 1800 : (Number(assessment.duration_minutes) || 30) * 60,
      timeRemainingSeconds: timeRemaining,
      questions,
    },
    sectionIndex: currentIdx,
    totalSections: sections.length,
    answers: answersMap || {},
  };
};

// POST /api/assessments/:id/attempt/start
export const startAssessmentAttempt = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id: assessmentId } = req.params;
    const candidateId = req.user?.id;
    if (!candidateId) return res.status(401).json({ error: 'Authentication required.' });

    if (!pool || !getDbStatus()) {
      return res.status(503).json({ error: 'Database unavailable. Please retry.' });
    }

    const includeAnswer = req.user?.role === 'admin';
    await client.query('BEGIN');

    const asmRes = await client.query(
      `SELECT id, title, category, duration_minutes, passing_score, total_marks
       FROM assessments WHERE id = $1`,
      [assessmentId]
    );
    if (asmRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assessment not found.' });
    }
    const assessment = asmRes.rows[0];

    const existingRes = await client.query(
      `SELECT id, status FROM test_attempts
       WHERE candidate_id = $1 AND assessment_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [candidateId, assessmentId]
    );

    // Completed attempt → single-attempt policy blocks re-entry
    if (existingRes.rows.length > 0 && existingRes.rows[0].status === 'Completed') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        alreadyCompleted: true,
        error: 'Single-Attempt Policy Active: You have already completed this assessment.',
      });
    }

    let attempt;
    let resumed = false;

    if (existingRes.rows.length > 0) {
      // Resume an InProgress attempt (e.g. page refresh)
      attempt = existingRes.rows[0];
      resumed = true;
    } else {
      const attemptId = newId('att');
      const ins = await client.query(
        `INSERT INTO test_attempts (id, candidate_id, assessment_id, attempt_number, status, started_at)
         VALUES ($1, $2, $3, 1, 'InProgress', CURRENT_TIMESTAMP)
         RETURNING id, status`,
        [attemptId, candidateId, assessmentId]
      );
      attempt = ins.rows[0];

      const sections = await orderedSectionsOf(assessmentId);

      if (sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const sec = sections[i];
          await client.query(
            `INSERT INTO section_attempts (id, attempt_id, section_id, status, started_at, time_limit_seconds)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [newId('sa'), attempt.id, sec.id, i === 0 ? 'InProgress' : 'Pending',
             i === 0 ? new Date() : null, Math.max(60, (Number(sec.duration_minutes) || 30) * 60)]
          );
        }
      } else {
        // Implicit single section covering the whole test
        const limit = Math.max(60, (Number(assessment.duration_minutes) || 30) * 60);
        await client.query(
          `INSERT INTO section_attempts (id, attempt_id, section_id, status, started_at, time_limit_seconds)
           VALUES ($1, $2, NULL, 'InProgress', CURRENT_TIMESTAMP, $3)`,
          [newId('sa'), attempt.id, limit]
        );
      }
    }

    // Saved answers for resume
    const ansRes = await client.query(
      'SELECT question_id, selected_option FROM candidate_answers WHERE attempt_id = $1',
      [attempt.id]
    );
    const answersMap = {};
    for (const a of ansRes.rows) {
      if (a.selected_option !== null && a.selected_option !== undefined) {
        answersMap[a.question_id] = a.selected_option;
      }
    }

    attempt.resumed = resumed;
    const payload = await buildStartPayload(client, attempt, assessment, includeAnswer, answersMap);

    await client.query('COMMIT');
    res.status(resumed ? 200 : 201).json({ success: true, data: payload });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const loadOwnedAttempt = async (attemptId, candidateId) => {
  const res = await pool.query(
    `SELECT ta.*, a.title, a.category, a.passing_score, a.duration_minutes
     FROM test_attempts ta
     JOIN assessments a ON a.id = ta.assessment_id
     WHERE ta.id = $1 AND ta.candidate_id = $2`,
    [attemptId, candidateId]
  );
  return res.rows[0] || null;
};

// POST /api/attempts/:attemptId/answers — debounced save-as-you-go
export const saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const candidateId = req.user?.id;
    if (!candidateId) return res.status(401).json({ error: 'Authentication required.' });
    if (!pool || !getDbStatus()) return res.json({ success: true, saved: false });

    const attempt = await loadOwnedAttempt(attemptId, candidateId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
    if (attempt.status !== 'InProgress') {
      return res.status(409).json({ error: 'Attempt already submitted.' });
    }

    const { questionId, selectedOption, codeAnswer, timeTakenSeconds } = req.body || {};
    if (!questionId) return res.status(400).json({ error: 'questionId is required.' });

    // selected_option is VARCHAR(8): MCQ keys (A-D / numeric). Coding code blobs are
    // persisted at final submit through the submissions pipeline instead.
    let value = selectedOption !== undefined && selectedOption !== null ? selectedOption : codeAnswer;
    if (value !== null && value !== undefined && typeof value === 'object') value = null;
    if (value !== null && value !== undefined) value = String(value).slice(0, 8);

    await pool.query(
      `INSERT INTO candidate_answers (id, attempt_id, question_id, selected_option, time_taken_seconds, answered_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET
         selected_option = EXCLUDED.selected_option,
         time_taken_seconds = EXCLUDED.time_taken_seconds,
         answered_at = CURRENT_TIMESTAMP`,
      [newId('ans'), attemptId, questionId, value, Math.max(0, Number(timeTakenSeconds) || 0)]
    );

    res.json({ success: true, saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/attempts/:attemptId/section/complete — finish current section, get next
export const completeSection = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const candidateId = req.user?.id;
    if (!candidateId) return res.status(401).json({ error: 'Authentication required.' });
    if (!pool || !getDbStatus()) return res.status(503).json({ error: 'Database unavailable.' });

    const attempt = await loadOwnedAttempt(attemptId, candidateId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
    if (attempt.status !== 'InProgress') return res.status(409).json({ error: 'Attempt already submitted.' });

    const { sectionId } = req.body || {};

    const saRes = await pool.query(
      `SELECT sa.id, sa.section_id, sa.status, sa.started_at, sa.time_limit_seconds,
              s.name, s.description, s.marks_per_question, s.display_order
       FROM section_attempts sa
       LEFT JOIN assessment_sections s ON s.id = sa.section_id
       WHERE sa.attempt_id = $1
       ORDER BY COALESCE(s.display_order, 0) ASC, sa.created_at ASC`,
      [attemptId]
    );
    const rows = saRes.rows;
    const currentIdx = Math.max(0, rows.findIndex(s => s.status !== 'Completed'));
    const current = rows[currentIdx];
    if (!current) return res.status(409).json({ error: 'No active section.' });

    const matches = (sectionId === undefined || sectionId === null)
      ? current.section_id === null || current.section_id === undefined
      : String(current.section_id) === String(sectionId);
    if (!matches) return res.status(409).json({ error: 'Section mismatch. Refresh and try again.' });

    // Persist the section's answers as part of completion (idempotent upsert) so
    // section progress is durable even if a debounced auto-save never landed.
    const sectionAnswers = (req.body && req.body.answers) || {};
    for (const [questionId, answer] of Object.entries(sectionAnswers)) {
      let value = answer;
      if (value === undefined) continue;
      if (value !== null && typeof value === 'object') value = null;
      if (value !== null) value = String(value).slice(0, 8);

      await pool.query(
        `INSERT INTO candidate_answers (id, attempt_id, question_id, selected_option, answered_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (attempt_id, question_id) DO UPDATE SET
           selected_option = EXCLUDED.selected_option,
           answered_at = CURRENT_TIMESTAMP`,
        [newId('ans'), attemptId, questionId, value]
      );
    }

    await pool.query(
      `UPDATE section_attempts SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [current.id]
    );

    const next = rows[currentIdx + 1];
    if (!next) {
      return res.json({ success: true, data: { isLastSection: true, sectionIndex: currentIdx } });
    }

    await pool.query(
      `UPDATE section_attempts SET status = 'InProgress', started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
       WHERE id = $1`,
      [next.id]
    );

    const questions = await fetchSectionQuestions(attempt.assessment_id, next.section_id || null, req.user?.role === 'admin');

    res.json({
      success: true,
      data: {
        isLastSection: false,
        sectionIndex: currentIdx + 1,
        currentSection: {
          attemptSectionId: next.id,
          id: next.section_id,
          name: next.name || 'All Questions',
          description: next.description || null,
          marksPerQuestion: Number(next.marks_per_question) || 1,
          status: 'InProgress',
          timeLimitSeconds: Number(next.time_limit_seconds) || 1800,
          timeRemainingSeconds: timeRemainingFor(new Date(), next.time_limit_seconds),
          questions,
          sectionIndex: currentIdx + 1,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const normalizeAnswer = (v) => String(v ?? '').trim().toUpperCase();

// POST /api/attempts/:attemptId/submit — close the attempt and compute stats
export const submitAssessmentAttempt = async (req, res) => {
  const client = await pool.connect();
  try {
    const { attemptId } = req.params;
    const candidateId = req.user?.id;
    if (!candidateId) return res.status(401).json({ error: 'Authentication required.' });
    if (!pool || !getDbStatus()) return res.status(503).json({ error: 'Database unavailable.' });

    const attempt = await loadOwnedAttempt(attemptId, candidateId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

    const finalAnswers = (req.body && req.body.finalAnswers) || {};

    await client.query('BEGIN');

    // Persist any final answers not yet saved (MCQ values only; coding answers
    // travel through the submissions pipeline as the answers map)
    for (const [questionId, answer] of Object.entries(finalAnswers)) {
      let value = answer;
      if (value !== null && typeof value === 'object') value = null;
      if (value !== null && value !== undefined) value = String(value).slice(0, 8);
      if (value === undefined) value = null;

      await client.query(
        `INSERT INTO candidate_answers (id, attempt_id, question_id, selected_option, answered_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (attempt_id, question_id) DO UPDATE SET
           selected_option = EXCLUDED.selected_option,
           answered_at = CURRENT_TIMESTAMP`,
        [newId('ans'), attemptId, questionId, value]
      );
    }

    // Section scope: if the attempt has admin-defined sections, only those questions count
    const secRes = await client.query(
      'SELECT section_id FROM section_attempts WHERE attempt_id = $1 AND section_id IS NOT NULL',
      [attemptId]
    );
    const sectionIds = secRes.rows.map(r => r.section_id);

    const qRes = await client.query(
      `SELECT aq.question_id, aq.correct_answer, aq.marks, aq.category, aq.topic, aq.section_id,
              COALESCE(q.type, CASE WHEN aq.category = 'Coding' THEN 'Coding' ELSE 'Single Choice' END) AS type,
              ca.selected_option
       FROM assessment_questions aq
       JOIN test_attempts ta ON ta.assessment_id = aq.assessment_id AND ta.id = $1
       JOIN questions q ON q.id = aq.question_id
       LEFT JOIN candidate_answers ca ON ca.attempt_id = ta.id AND ca.question_id = aq.question_id
       WHERE ta.id = $1
         AND ($2::varchar[] IS NULL OR aq.section_id = ANY($2::varchar[]))
       ORDER BY aq.created_at ASC, aq.id ASC`,
      [attemptId, sectionIds.length > 0 ? sectionIds : null]
    );

    let totalPossible = 0;
    let totalObtained = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const categoryStats = {};
    const topicStats = {};

    const bump = (map, key, cat) => {
      if (!map[key]) {
        map[key] = { topic: key, category: cat, totalMarks: 0, obtainedMarks: 0, totalQuestions: 0, correctCount: 0, incorrectCount: 0, unansweredCount: 0 };
      }
      return map[key];
    };

    for (const row of qRes.rows) {
      const marks = Number(row.marks) || 1;
      const cat = (row.category || 'Technical').trim();
      const topic = (row.topic || 'General').trim();
      const isCoding = row.type === 'Coding';

      totalPossible += marks;

      const cStat = categoryStats[cat] || (categoryStats[cat] = { totalMarks: 0, obtainedMarks: 0, totalQuestions: 0, correctCount: 0 });
      cStat.totalMarks += marks;
      cStat.totalQuestions += 1;

      const tStat = bump(topicStats, topic, cat);
      tStat.totalMarks += marks;
      tStat.totalQuestions += 1;

      const userRaw = row.selected_option;
      const hasAnswered = userRaw !== null && userRaw !== undefined && String(userRaw).trim() !== '';

      if (!hasAnswered) {
        unanswered += 1;
        tStat.unansweredCount += 1;
        continue;
      }

      let earned = 0;
      let isCorrect = false;

      if (isCoding) {
        // Coding grading happens in the submissions pipeline; use the client's
        // evaluated score attached at final submit when available.
        const ans = finalAnswers[row.question_id];
        const scorePct = Number(ans?.score ?? (ans?.passedTests && ans?.totalTests ? (ans.passedTests / ans.totalTests) * 100 : NaN));
        if (!Number.isNaN(scorePct)) {
          earned = Math.round((Math.min(100, Math.max(0, scorePct)) / 100) * marks);
          isCorrect = scorePct >= 60;
        }
      } else {
        const correctVal = row.correct_answer;
        if (correctVal && normalizeAnswer(userRaw) === normalizeAnswer(correctVal)) {
          isCorrect = true;
          earned = marks;
        }
      }

      totalObtained += earned;
      tStat.obtainedMarks += earned;
      cStat.obtainedMarks += earned;

      if (isCorrect) {
        correct += 1;
        cStat.correctCount += 1;
        tStat.correctCount += 1;
      } else {
        incorrect += 1;
        tStat.incorrectCount += 1;
      }
    }

    const scorePct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;
    const passed = scorePct >= (Number(attempt.passing_score) || 70);

    await client.query(
      `UPDATE test_attempts
       SET status = 'Completed',
           submitted_at = CURRENT_TIMESTAMP,
           time_taken_seconds = COALESCE(time_taken_seconds, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::int)
       WHERE id = $1`,
      [attemptId]
    );
    await client.query(
      `UPDATE section_attempts
       SET status = 'Completed',
           completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
           started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
       WHERE attempt_id = $1`,
      [attemptId]
    );

    const attemptedCount = correct + incorrect;
    const accuracy = attemptedCount > 0 ? Math.round((correct / attemptedCount) * 100) : 0;

    await client.query(
      `INSERT INTO performance_analysis (id, attempt_id, overall_score, accuracy, speed_score, aptitude_score, reasoning_score, technical_score, strengths, weaknesses, ai_summary, recommendations)
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (attempt_id) DO UPDATE SET
         overall_score = EXCLUDED.overall_score,
         accuracy = EXCLUDED.accuracy,
         aptitude_score = EXCLUDED.aptitude_score,
         reasoning_score = EXCLUDED.reasoning_score,
         technical_score = EXCLUDED.technical_score,
         strengths = EXCLUDED.strengths,
         weaknesses = EXCLUDED.weaknesses,
         ai_summary = EXCLUDED.ai_summary,
         recommendations = EXCLUDED.recommendations`,
      [
        newId('perf'), attemptId, scorePct, accuracy,
        categoryStats['Aptitude']?.obtainedMarks || 0,
        categoryStats['Reasoning']?.obtainedMarks || 0,
        (categoryStats['Technical']?.obtainedMarks || 0) + (categoryStats['Coding']?.obtainedMarks || 0),
        JSON.stringify(Object.keys(categoryStats).filter(k => categoryStats[k].totalMarks > 0 && categoryStats[k].obtainedMarks / categoryStats[k].totalMarks > 0.7)),
        JSON.stringify(Object.keys(categoryStats).filter(k => categoryStats[k].totalMarks > 0 && categoryStats[k].obtainedMarks / categoryStats[k].totalMarks < 0.4)),
        'Assessment completed and evaluated.',
        JSON.stringify(['Review weak areas', 'Practice more questions']),
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        attemptId,
        alreadySubmitted: attempt.status === 'Completed',
        score: scorePct,
        passed,
        accuracy,
        totalPossibleMarks: totalPossible,
        totalObtainedMarks: totalObtained,
        correct,
        incorrect,
        unanswered,
        totalQuestions: qRes.rows.length,
        categoryStats,
        topicStats,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET /api/attempts/:attemptId/status
export const getAttemptStatus = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const candidateId = req.user?.id;
    if (!candidateId) return res.status(401).json({ error: 'Authentication required.' });
    if (!pool || !getDbStatus()) return res.status(503).json({ error: 'Database unavailable.' });

    const attempt = await loadOwnedAttempt(attemptId, candidateId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

    const saRes = await pool.query(
      `SELECT sa.id, sa.section_id, sa.status, sa.started_at, sa.time_limit_seconds, s.name, s.display_order
       FROM section_attempts sa
       LEFT JOIN assessment_sections s ON s.id = sa.section_id
       WHERE sa.attempt_id = $1
       ORDER BY COALESCE(s.display_order, 0) ASC, sa.created_at ASC`,
      [attemptId]
    );
    const rows = saRes.rows;
    const currentIdx = Math.max(0, rows.findIndex(s => s.status !== 'Completed'));
    const current = rows[currentIdx];

    res.json({
      success: true,
      data: {
        attemptId,
        status: attempt.status,
        sectionIndex: currentIdx,
        totalSections: rows.length,
        currentSection: current
          ? {
              id: current.section_id,
              name: current.name || 'All Questions',
              status: current.status,
              timeLimitSeconds: Number(current.time_limit_seconds) || 1800,
              timeRemainingSeconds: current.status === 'InProgress'
                ? timeRemainingFor(current.started_at, current.time_limit_seconds)
                : Number(current.time_limit_seconds) || 1800,
            }
          : null,
        sections: rows.map((r, i) => ({
          id: r.section_id,
          name: r.name || 'All Questions',
          status: r.status,
          sectionIndex: i,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
