import { pool, getDbStatus } from '../db/pool.js';
import crypto from 'crypto';
import { fallbackAssessments, fallbackQuestions, getMySubmissionsFallback } from '../mockFallback.js';

let assessmentsCache = null;
let lastAssessmentsFetch = 0;
const CACHE_TTL_MS = 3000;

export const clearAssessmentsCache = () => {
  assessmentsCache = null;
  lastAssessmentsFetch = 0;
};

// GET /api/assessments
export const getAllAssessments = async (req, res) => {
  try {
    if (!pool || !getDbStatus()) {
      return res.json({ success: true, data: [] });
    }

    const now = Date.now();
    if (assessmentsCache && (now - lastAssessmentsFetch < CACHE_TTL_MS)) {
      return res.json(assessmentsCache);
    }

    const result = await pool.query(`
      SELECT 
        a.*,
        COALESCE(
          (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id AND aq.assessment_id IS NOT NULL),
          a.total_questions,
          0
        )::int as total_questions,
        COALESCE(
          (SELECT json_agg(aq.question_id) FROM assessment_questions aq WHERE aq.assessment_id = a.id),
          '[]'::json
        ) as selected_question_ids
      FROM assessments a
      ORDER BY a.created_at DESC
    `);
    const rows = result.rows.map(r => ({
      ...r,
      status: (!r.status || r.status === 'Draft') ? 'Available' : r.status,
      durationMinutes: Number(r.duration_minutes) || 10,
      totalQuestions: Number(r.total_questions) || 0,
      passingScore: Number(r.passing_score) || 70,
      totalMarks: Number(r.total_marks) || 100,
    }));
    const responsePayload = { success: true, data: rows };

    assessmentsCache = responsePayload;
    lastAssessmentsFetch = now;

    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/assessments/:id
export const getAssessmentById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        COALESCE(
          (SELECT COUNT(*) FROM assessment_questions aq WHERE aq.assessment_id = a.id AND aq.assessment_id IS NOT NULL),
          a.total_questions,
          0
        )::int as total_questions,
        COALESCE(
          (SELECT json_agg(aq.question_id) FROM assessment_questions aq WHERE aq.assessment_id = a.id),
          '[]'::json
        ) as selected_question_ids
      FROM assessments a
      WHERE a.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assessment not found.' });
    const formatted = {
      ...result.rows[0],
      durationMinutes: Number(result.rows[0].duration_minutes) || 10,
      totalQuestions: Number(result.rows[0].total_questions) || 0,
      passingScore: Number(result.rows[0].passing_score) || 70,
      totalMarks: Number(result.rows[0].total_marks) || 100,
    };
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to sync questions for an assessment in assessment_questions table
export const syncAssessmentQuestions = async (client, assessmentId, selectedQuestionIds = [], fallbackCategory = 'Technical', targetCount = 10) => {
  let idsToLink = Array.isArray(selectedQuestionIds) ? selectedQuestionIds.filter(Boolean) : [];

  // If no explicit question IDs provided, auto-select matching questions from questions table
  if (idsToLink.length === 0) {
    const isAllMix = ['All', 'Full Length', 'All Mix (Combined)', 'All Mix'].some(
      m => m.toLowerCase() === (fallbackCategory || '').toLowerCase()
    );

    let qPoolRes;
    if (isAllMix) {
      qPoolRes = await client.query('SELECT id FROM questions ORDER BY created_at DESC LIMIT $1', [targetCount || 10]);
    } else {
      qPoolRes = await client.query('SELECT id FROM questions WHERE category ILIKE $1 ORDER BY created_at DESC LIMIT $2', [fallbackCategory, targetCount || 10]);
      if (qPoolRes.rows.length === 0) {
        qPoolRes = await client.query('SELECT id FROM questions ORDER BY created_at DESC LIMIT $1', [targetCount || 10]);
      }
    }
    idsToLink = qPoolRes.rows.map(r => r.id);
  }

  if (idsToLink.length > 0) {
    // 1. Remove any questions currently in assessment_questions that are not in the new idsToLink
    await client.query(
      'DELETE FROM assessment_questions WHERE assessment_id = $1 AND NOT (question_id = ANY($2::varchar[]))',
      [assessmentId, idsToLink]
    );

    // 2. Fetch question details from questions table
    const qDetailsRes = await client.query(
      `SELECT id, category, topic, question, difficulty, options, correct_answer, marks,
              test_cases, starter_templates, constraints
       FROM questions
       WHERE id = ANY($1::varchar[])`,
      [idsToLink]
    );

    // 2b. Auto-seed missing question IDs from fallbackQuestions into questions table if needed
    const foundIds = new Set(qDetailsRes.rows.map(r => r.id));
    const missingIds = idsToLink.filter(id => !foundIds.has(id));

    if (missingIds.length > 0 && Array.isArray(fallbackQuestions)) {
      for (const mId of missingIds) {
        const fallbackQ = fallbackQuestions.find(fq => fq.id === mId || String(fq.id).toLowerCase() === String(mId).toLowerCase());
        if (fallbackQ) {
          const isCoding = fallbackQ.type === 'Coding' || fallbackQ.category === 'Coding';
          try {
            const insQ = await client.query(
              `INSERT INTO questions (id, category, topic, difficulty, type, question, options, correct_answer, marks, test_cases, starter_templates, constraints)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (id) DO UPDATE SET
                 category = EXCLUDED.category,
                 question = EXCLUDED.question
               RETURNING id, category, topic, question, difficulty, options, correct_answer, marks, test_cases, starter_templates, constraints`,
              [
                fallbackQ.id,
                fallbackQ.category || fallbackCategory || 'Technical',
                fallbackQ.topic || 'General',
                fallbackQ.difficulty || 'Medium',
                fallbackQ.type || (isCoding ? 'Coding' : 'Single Choice'),
                fallbackQ.question,
                JSON.stringify(fallbackQ.options || []),
                fallbackQ.correctAnswer || fallbackQ.correct_answer || 'A',
                fallbackQ.marks || (isCoding ? 10 : 4),
                fallbackQ.test_cases ? JSON.stringify(fallbackQ.test_cases) : null,
                fallbackQ.starter_templates ? JSON.stringify(fallbackQ.starter_templates) : null,
                fallbackQ.constraints || null
              ]
            );
            if (insQ.rows.length > 0) {
              qDetailsRes.rows.push(insQ.rows[0]);
            }
          } catch (e) {}
        }
      }
    }

    // 3. Upsert questions into assessment_questions
    for (const q of qDetailsRes.rows) {
      const aqId = `aq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      await client.query(
        `INSERT INTO assessment_questions (id, assessment_id, question_id, category, topic, question, difficulty, options, correct_answer, marks, test_cases, starter_templates, constraints)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (assessment_id, question_id) DO UPDATE SET
           category = EXCLUDED.category,
           topic = EXCLUDED.topic,
           question = EXCLUDED.question,
           difficulty = EXCLUDED.difficulty,
           options = EXCLUDED.options,
           correct_answer = EXCLUDED.correct_answer,
           marks = EXCLUDED.marks,
           test_cases = EXCLUDED.test_cases,
           starter_templates = EXCLUDED.starter_templates,
           constraints = EXCLUDED.constraints`,
        [
          aqId,
          assessmentId,
          q.id,
          q.category,
          q.topic,
          q.question,
          q.difficulty,
          JSON.stringify(q.options || []),
          q.correct_answer,
          q.marks || 1,
          q.test_cases ? JSON.stringify(q.test_cases) : null,
          q.starter_templates ? JSON.stringify(q.starter_templates) : null,
          q.constraints || null
        ]
      );
    }
  } else {
    // If no questions, clear any existing assessment_questions for this assessment
    await client.query('DELETE FROM assessment_questions WHERE assessment_id = $1', [assessmentId]);
  }
};

// POST /api/assessments  (admin only)
export const createAssessment = async (req, res) => {
  const { id: customId, title, category, description, difficulty, durationMinutes, totalQuestions, passingScore, selectedQuestionIds } = req.body;
  const id = customId || `asm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const client = await pool.connect();

  const finalTotalQuestions = (Array.isArray(selectedQuestionIds) && selectedQuestionIds.length > 0)
    ? selectedQuestionIds.length
    : (Number(totalQuestions) > 0 ? Number(totalQuestions) : 10);

  try {
    await client.query('BEGIN');
    clearAssessmentsCache();

    let createdBy = req.user?.id || null;
    if (createdBy) {
      const uCheck = await client.query('SELECT id FROM users WHERE id = $1', [createdBy]);
      if (uCheck.rows.length === 0) {
        createdBy = null;
      }
    }

    const totalMarksVal = Number(req.body.totalMarks) || 100;
    const statusVal = req.body.status || 'Available';
    const result = await client.query(
      `INSERT INTO assessments (id, title, category, description, difficulty, duration_minutes, total_questions, total_marks, passing_score, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         description = EXCLUDED.description,
         difficulty = EXCLUDED.difficulty,
         duration_minutes = EXCLUDED.duration_minutes,
         total_questions = EXCLUDED.total_questions,
         total_marks = EXCLUDED.total_marks,
         passing_score = EXCLUDED.passing_score,
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, title, category || 'Technical', description || null, difficulty || 'Medium', Number(durationMinutes) || 30, finalTotalQuestions, totalMarksVal, Number(passingScore) || 65, statusVal, createdBy]
    );

    // Sync questions into assessment_questions table
    await syncAssessmentQuestions(client, id, selectedQuestionIds, category || 'Technical', finalTotalQuestions);

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createAssessment error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// PUT /api/assessments/:id
export const updateAssessment = async (req, res) => {
  const { title, category, description, difficulty, durationMinutes, totalQuestions, passingScore, status, selectedQuestionIds } = req.body;
  const client = await pool.connect();

  const finalTotalQuestions = (Array.isArray(selectedQuestionIds) && selectedQuestionIds.length > 0)
    ? selectedQuestionIds.length
    : (totalQuestions != null ? Number(totalQuestions) : null);

  try {
    await client.query('BEGIN');
    clearAssessmentsCache();

    const result = await client.query(
      `UPDATE assessments SET 
         title = COALESCE($1, title), 
         category = COALESCE($2, category), 
         description = COALESCE($3, description), 
         difficulty = COALESCE($4, difficulty),
         duration_minutes = COALESCE($5, duration_minutes), 
         total_questions = COALESCE($6, total_questions), 
         passing_score = COALESCE($7, passing_score), 
         status = COALESCE($8, status), 
         updated_at = CURRENT_TIMESTAMP 
       WHERE id=$9 RETURNING *`,
      [
        title ?? null,
        category ?? null,
        description ?? null,
        difficulty ?? null,
        durationMinutes != null ? Number(durationMinutes) : null,
        finalTotalQuestions,
        passingScore != null ? Number(passingScore) : null,
        status ?? null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const updatedAsm = result.rows[0];

    // If selectedQuestionIds are provided in the update, sync them
    if (selectedQuestionIds !== undefined) {
      await syncAssessmentQuestions(client, req.params.id, selectedQuestionIds, updatedAsm.category, Number(updatedAsm.total_questions) || 10);
    }

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// DELETE /api/assessments/:id
export const deleteAssessment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    clearAssessmentsCache();

    // Explicitly delete linked questions from assessment_questions table
    await client.query('DELETE FROM assessment_questions WHERE assessment_id=$1', [req.params.id]);

    // Delete the assessment itself
    const delRes = await client.query('DELETE FROM assessments WHERE id=$1 RETURNING id', [req.params.id]);
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Assessment and all associated questions deleted.', data: delRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET /api/assessments/:id/questions
export const getAssessmentQuestions = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const candidateId = req.user?.id;
    const candidateEmail = req.user?.email;

    const allowRetake = req.query?.retake === 'true' || 
                        req.headers?.['x-allow-retake'] === 'true' || 
                        process.env.ALLOW_ASSESSMENT_RETAKE === 'true' || 
                        isAdmin;

    // Single Attempt Policy: If already completed and retakes are not allowed, block attempt
    if (!allowRetake && (candidateId || candidateEmail)) {
      if (!pool || !getDbStatus()) {
        const pastSub = getMySubmissionsFallback(candidateId, candidateEmail).find(
          s => String(s.assessment_id || s.assessmentId || '').toLowerCase() === String(req.params.id).toLowerCase()
        );
        if (pastSub) {
          return res.status(403).json({
            success: false,
            alreadyCompleted: true,
            submission: pastSub,
            error: 'Single-Attempt Policy Active: You have already completed this assessment. Retakes are not allowed.'
          });
        }
      } else {
        const existingCheck = await pool.query(
          `SELECT id, score, accuracy FROM assessment_submissions 
           WHERE (candidate_id = $1 OR (candidate_email IS NOT NULL AND LOWER(candidate_email) = LOWER($2))) AND assessment_id = $3 
           LIMIT 1`,
          [candidateId, candidateEmail || '', req.params.id]
        );
        if (existingCheck.rows.length > 0) {
          return res.status(403).json({
            success: false,
            alreadyCompleted: true,
            submission: existingCheck.rows[0],
            error: 'Single-Attempt Policy Active: You have already completed this assessment. Retakes are not allowed.'
          });
        }
      }
    }

    if (!pool || !getDbStatus()) {
      const asm = fallbackAssessments.find(a => String(a.id).toLowerCase() === String(req.params.id).toLowerCase());
      const cat = asm?.category || 'Technical';
      const isAll = ['All', 'Full Length', 'All Mix'].some(m => m.toLowerCase() === cat.toLowerCase());
      const matchingQuestions = isAll
        ? fallbackQuestions
        : fallbackQuestions.filter(q => String(q.category).toLowerCase() === cat.toLowerCase());
      return res.json({ success: true, data: matchingQuestions, total: matchingQuestions.length });
    }

    let questionsList = result.rows;
    if (questionsList.length === 0) {
      const asmCheck = await pool.query('SELECT category, total_questions FROM assessments WHERE id = $1', [req.params.id]);
      if (asmCheck.rows.length > 0) {
        const asmCat = asmCheck.rows[0].category || 'Technical';
        const asmCount = Number(asmCheck.rows[0].total_questions) || 10;
        const autoQRes = await pool.query(
          `SELECT q.id, q.id as question_id, q.category, q.topic, q.question, q.difficulty, q.options,
                  COALESCE(q.type, 'Single Choice') as type,
                  q.test_cases, q.starter_templates, q.constraints,
                  ${isAdmin ? 'q.correct_answer,' : ''}
                  q.marks, q.created_at
           FROM questions q
           WHERE q.category ILIKE $1 OR $1 = 'All'
           ORDER BY q.created_at DESC LIMIT $2`,
          [asmCat, asmCount]
        );
        questionsList = autoQRes.rows;
      }
    }
    res.json({ success: true, data: questionsList, total: questionsList.length });
  } catch (err) {
    if (!pool || !getDbStatus()) {
      const asm = fallbackAssessments.find(a => String(a.id).toLowerCase() === String(req.params.id).toLowerCase());
      const cat = asm?.category || 'Technical';
      const isAll = ['All', 'Full Length', 'All Mix'].some(m => m.toLowerCase() === cat.toLowerCase());
      const matchingQuestions = isAll
        ? fallbackQuestions
        : fallbackQuestions.filter(q => String(q.category).toLowerCase() === cat.toLowerCase());
      return res.json({ success: true, data: matchingQuestions, total: matchingQuestions.length });
    }
    res.status(500).json({ error: err.message });
  }
};

// POST /api/assessments/:id/questions
export const addQuestionsToAssessment = async (req, res) => {
  const assessmentId = req.params.id;
  const { questionIds, questions: inputQuestions } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify assessment exists
    const asmCheck = await client.query('SELECT id FROM assessments WHERE id = $1', [assessmentId]);
    if (asmCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    const insertedRows = [];

    // Case A: questionIds array provided
    if (Array.isArray(questionIds) && questionIds.length > 0) {
      const qRes = await client.query(
        `SELECT id, category, topic, question, difficulty, options, correct_answer, marks
         FROM questions
         WHERE id = ANY($1::varchar[])`,
        [questionIds]
      );

      for (const q of qRes.rows) {
        const aqId = `aq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const insRes = await client.query(
          `INSERT INTO assessment_questions (id, assessment_id, question_id, category, topic, question, difficulty, options, correct_answer, marks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (assessment_id, question_id) DO UPDATE SET
             category = EXCLUDED.category,
             topic = EXCLUDED.topic,
             question = EXCLUDED.question,
             difficulty = EXCLUDED.difficulty,
             options = EXCLUDED.options,
             correct_answer = EXCLUDED.correct_answer,
             marks = EXCLUDED.marks
           RETURNING *`,
          [aqId, assessmentId, q.id, q.category, q.topic, q.question, q.difficulty, JSON.stringify(q.options), q.correct_answer, q.marks || 1]
        );
        insertedRows.push(insRes.rows[0]);
      }
    }

    // Case B: full questions objects provided
    if (Array.isArray(inputQuestions) && inputQuestions.length > 0) {
      for (const q of inputQuestions) {
        if (!q.id && !q.question_id) continue;
        const qId = q.question_id || q.id;
        const aqId = `aq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const insRes = await client.query(
          `INSERT INTO assessment_questions (id, assessment_id, question_id, category, topic, question, difficulty, options, correct_answer, marks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (assessment_id, question_id) DO UPDATE SET
             category = EXCLUDED.category,
             topic = EXCLUDED.topic,
             question = EXCLUDED.question,
             difficulty = EXCLUDED.difficulty,
             options = EXCLUDED.options,
             correct_answer = EXCLUDED.correct_answer,
             marks = EXCLUDED.marks
           RETURNING *`,
          [aqId, assessmentId, qId, q.category, q.topic, q.question, q.difficulty, JSON.stringify(q.options), q.correct_answer || q.correctAnswer, q.marks || 1]
        );
        insertedRows.push(insRes.rows[0]);
      }
    }

    await client.query('COMMIT');
    clearAssessmentsCache();
    res.status(201).json({ success: true, message: `Linked ${insertedRows.length} questions to assessment.`, data: insertedRows });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// DELETE /api/assessments/:id/questions/:questionId
export const removeQuestionFromAssessment = async (req, res) => {
  const { id: assessmentId, questionId } = req.params;
  try {
    await pool.query(
      'DELETE FROM assessment_questions WHERE assessment_id = $1 AND (question_id = $2 OR id = $2)',
      [assessmentId, questionId]
    );
    clearAssessmentsCache();
    res.json({ success: true, message: 'Question removed from assessment.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

