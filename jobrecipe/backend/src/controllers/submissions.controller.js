import { pool, getDbStatus } from '../db/pool.js';
import crypto from 'crypto';
import { evaluateSubmission } from '../services/evaluationService.js';
import {
  fallbackSubmissions,
  getMySubmissionsFallback,
  saveSubmissionFallback,
  saveProctoringEventFallback,
  getProctoringEventsFallback
} from '../mockFallback.js';

// POST /api/submissions
export const submitAssessment = async (req, res) => {
  const {
    assessmentId,
    assessmentTitle,
    candidateId: bodyCandId,
    candidateName,
    candidateEmail,
    score: clientScore,
    accuracy: clientAccuracy,
    correctCount: clientCorrectCount,
    incorrectCount: clientIncorrectCount,
    unansweredCount: clientUnansweredCount,
    totalQuestions: clientTotalQuestions,
    timeTaken,
    categoryScores: clientCategoryScores,
    topicBreakdown: clientTopicBreakdown,
    questionIds,
    answers,
    proctoringViolations,
    autoSubmitted,
    autoSubmitReason
  } = req.body;

  // Resolve candidate identity from authenticated token or request body
  const candidateId = (req.user && req.user.role !== 'admin' && req.user.id)
    ? req.user.id
    : (bodyCandId || req.user?.id || 'cand-user');
  const email = (req.user && req.user.role !== 'admin' && req.user.email)
    ? req.user.email
    : (candidateEmail || req.user?.email || null);
  const name = (req.user && req.user.role !== 'admin' && req.user.name)
    ? req.user.name
    : (candidateName || req.user?.name || 'Candidate Student');
  const asmId = assessmentId || 'asm-1';
  const id = `sub-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  if (!pool || !getDbStatus()) {
    // Single Attempt Policy: Disallow retakes
    if (process.env.ALLOW_ASSESSMENT_RETAKE !== 'true' && req.user?.role !== 'admin') {
      const existing = getMySubmissionsFallback(candidateId, email).find(
        s => String(s.assessment_id || s.assessmentId || '').toLowerCase() === String(asmId).toLowerCase()
      );
      if (existing) {
        return res.status(403).json({
          success: false,
          alreadySubmitted: true,
          submission: existing,
          error: 'Single-Attempt Policy Active: You have already completed this assessment. Retakes are not allowed.'
        });
      }
    }

    const evaluation = await evaluateSubmission({
      assessmentId: asmId,
      answers: answers || {},
      questionIds: questionIds || [],
      totalQuestions: clientTotalQuestions,
      dbClient: null,
    });

    const finalObtainedMarks = (typeof evaluation.obtainedMarks === 'number' && evaluation.obtainedMarks > 0)
      ? evaluation.obtainedMarks
      : (Number(req.body.obtainedMarks ?? req.body.obtained_marks) > 0 ? Number(req.body.obtainedMarks ?? req.body.obtained_marks) : (evaluation.obtainedMarks || 0));

    const finalTotalMarks = (typeof evaluation.totalMarks === 'number' && evaluation.totalMarks > 0)
      ? evaluation.totalMarks
      : (Number(req.body.totalMarks ?? req.body.total_marks) > 0 ? Number(req.body.totalMarks ?? req.body.total_marks) : 40);

    const finalScore = finalTotalMarks > 0
      ? Math.round((finalObtainedMarks / finalTotalMarks) * 100)
      : (typeof clientScore === 'number' ? clientScore : evaluation.score);

    const finalAccuracy = (evaluation.correctCount + evaluation.incorrectCount) > 0
      ? evaluation.accuracy
      : (typeof clientAccuracy === 'number' ? clientAccuracy : finalScore);

    const submission = {
      id,
      assessment_id: asmId,
      assessmentId: asmId,
      assessment_title: assessmentTitle || 'Technical Readiness Assessment',
      assessmentTitle: assessmentTitle || 'Technical Readiness Assessment',
      candidate_id: candidateId,
      candidateId,
      candidate_name: name,
      candidateName: name,
      candidate_email: email,
      candidateEmail: email,
      score: finalScore,
      accuracy: finalAccuracy,
      obtained_marks: finalObtainedMarks,
      obtainedMarks: finalObtainedMarks,
      total_marks: finalTotalMarks,
      totalMarks: finalTotalMarks,
      correct_count: evaluation.correctCount ?? Number(clientCorrectCount || 0),
      incorrect_count: evaluation.incorrectCount ?? Number(clientIncorrectCount || 0),
      unanswered_count: evaluation.unansweredCount ?? Number(clientUnansweredCount || 0),
      total_questions: evaluation.totalQuestions ?? Number(clientTotalQuestions || 10),
      time_taken: timeTaken || '15 min',
      category_scores: (evaluation.categoryScores && Object.keys(evaluation.categoryScores).length > 0) ? evaluation.categoryScores : (clientCategoryScores || { technical: finalScore }),
      topic_breakdown: (evaluation.topicBreakdown && evaluation.topicBreakdown.length > 0) ? evaluation.topicBreakdown : (clientTopicBreakdown || []),
      answers: answers || {},
      created_at: new Date().toISOString()
    };
    saveSubmissionFallback(submission);
    return res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully.',
      submissionId: id,
      score: finalScore,
      accuracy: finalAccuracy,
      obtained_marks: finalObtainedMarks,
      obtainedMarks: finalObtainedMarks,
      total_marks: finalTotalMarks,
      totalMarks: finalTotalMarks,
      data: submission
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Authoritative Backend Scoring
    // Calculate deterministic scores using stored answer keys in PostgreSQL
    const evaluation = await evaluateSubmission({
      assessmentId: asmId,
      answers: answers || {},
      questionIds: questionIds || [],
      totalQuestions: clientTotalQuestions,
      dbClient: client,
    });

    const finalScore = evaluation.score;
    const finalAccuracy = evaluation.accuracy;
    const finalCorrectCount = evaluation.correctCount;
    const finalIncorrectCount = evaluation.incorrectCount;
    const finalUnansweredCount = evaluation.unansweredCount;
    const finalObtainedMarks = evaluation.obtainedMarks;
    const finalTotalMarks = evaluation.totalMarks;
    const finalCategoryScores = (evaluation.categoryScores && Object.keys(evaluation.categoryScores).length > 0)
      ? evaluation.categoryScores
      : (clientCategoryScores || {});
    const finalTopicBreakdown = (evaluation.topicBreakdown && evaluation.topicBreakdown.length > 0)
      ? evaluation.topicBreakdown
      : (clientTopicBreakdown || []);

    const catScores = finalCategoryScores || {};
    const finalAptitudeScore = Number(catScores.aptitude ?? catScores.Aptitude ?? 0);
    const finalReasoningScore = Number(catScores.reasoning ?? catScores.Reasoning ?? 0);
    const finalTechnicalScore = Number(catScores.technical ?? catScores.Technical ?? 0);
    const finalVerbalScore = Number(catScores.verbal ?? catScores.Verbal ?? catScores.english ?? 0);
    const finalCodingScore = Number(catScores.coding ?? catScores.Coding ?? 0);

    // 2. Check for existing submission by candidate for this assessment (Single Attempt Policy)
    const existingSubmission = await client.query(
      `SELECT id, score, accuracy, created_at FROM assessment_submissions 
       WHERE (candidate_id = $1 OR (candidate_email IS NOT NULL AND LOWER(candidate_email) = LOWER($2))) AND assessment_id = $3 
       ORDER BY created_at DESC LIMIT 1`,
      [candidateId, email || '', asmId]
    );

    if (existingSubmission.rows.length > 0) {
      await client.query('ROLLBACK').catch(() => {});
      return res.status(403).json({
        success: false,
        error: 'Single-Attempt Policy Active: You have already completed this assessment. Retakes are locked. Please contact your portal administrator to unlock your exam attempt.'
      });
    }

    let savedSubmissionRecord = null;
    // 3. Insert into assessment_submissions table
    const result = await client.query(
      `INSERT INTO assessment_submissions 
       (id, candidate_id, candidate_name, candidate_email, assessment_id, assessment_title, score, accuracy, correct_count, incorrect_count, unanswered_count, time_taken, category_scores, topic_breakdown, answers, proctoring_violations, auto_submitted, auto_submit_reason, status, obtained_marks, total_marks, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'Completed',$19,$20,NOW())
       RETURNING *`,
      [
        id,
        candidateId,
        name,
        email,
        asmId,
        assessmentTitle || 'Technical Assessment',
        finalScore,
        finalAccuracy,
        finalCorrectCount,
        finalIncorrectCount,
        finalUnansweredCount,
        timeTaken || '28 min',
        JSON.stringify(finalCategoryScores),
        JSON.stringify(finalTopicBreakdown),
        JSON.stringify(answers || {}),
        Number(proctoringViolations || 0),
        Boolean(autoSubmitted),
        autoSubmitReason || null,
        finalObtainedMarks,
        finalTotalMarks
      ]
    );
    savedSubmissionRecord = result.rows[0];

    // 4. Also insert into legacy submissions table for backwards compatibility
    await client.query(
      `INSERT INTO submissions (id, candidate_id, assessment_id, score, accuracy, correct_count, incorrect_count, unanswered_count, time_taken, category_scores, topic_breakdown, answers, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        id, candidateId, asmId, finalScore, finalAccuracy,
        finalCorrectCount, finalIncorrectCount, finalUnansweredCount,
        timeTaken || '28 min', JSON.stringify(finalCategoryScores), JSON.stringify(finalTopicBreakdown),
        JSON.stringify(answers || {})
      ]
    );

    // 5. Update or insert candidate readiness status and scores in candidates table
    await client.query(
      `INSERT INTO candidates (id, job_readiness_score, aptitude_score, reasoning_score, technical_score, verbal_score, coding_score, readiness_status, assessments_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completed', 1)
       ON CONFLICT (id) DO UPDATE SET
         job_readiness_score = EXCLUDED.job_readiness_score,
         aptitude_score = EXCLUDED.aptitude_score,
         reasoning_score = EXCLUDED.reasoning_score,
         technical_score = EXCLUDED.technical_score,
         verbal_score = EXCLUDED.verbal_score,
         coding_score = EXCLUDED.coding_score,
         readiness_status = 'Completed',
         assessments_completed = COALESCE(candidates.assessments_completed, 0) + 1`,
      [candidateId, finalScore, finalAptitudeScore, finalReasoningScore, finalTechnicalScore, finalVerbalScore, finalCodingScore]
    );

    // 6. If candidate profile exists, update timestamp
    if (email || candidateId) {
      await client.query(
        `UPDATE candidate_profiles SET updated_at = NOW() WHERE id = $1 OR user_id = $1 OR (email IS NOT NULL AND LOWER(email) = LOWER($2))`,
        [candidateId, email || '']
      ).catch(() => {});
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully and recorded in database.',
      data: {
        ...savedSubmissionRecord,
        obtained_marks: finalObtainedMarks,
        obtainedMarks: finalObtainedMarks,
        total_marks: finalTotalMarks,
        totalMarks: finalTotalMarks,
        score: finalScore,
        accuracy: finalAccuracy
      }
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Assessment has already been submitted by this candidate.',
        message: 'Assessment has already been submitted by this candidate.',
      });
    }
    console.error('Submission controller error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
};

// GET /api/submissions  (admin view of all submissions)
export const getAllSubmissions = async (req, res) => {
  try {
    if (!pool || !getDbStatus()) {
      return res.json({ success: true, data: fallbackSubmissions });
    }
    const result = await pool.query(
      `SELECT s.*, 
              COALESCE(cp.name, s.candidate_name, 'Candidate') as candidate_name, 
              COALESCE(cp.email, s.candidate_email) as candidate_email, 
              cp.college
       FROM assessment_submissions s
       LEFT JOIN candidate_profiles cp ON s.candidate_id = cp.id OR s.candidate_id = cp.user_id OR LOWER(s.candidate_email) = LOWER(cp.email)
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.json({ success: true, data: fallbackSubmissions });
  }
};

// GET /api/submissions/my  (candidate's own submissions)
export const getMySubmissions = async (req, res) => {
  const candId = req.user?.id || '';
  const candEmail = req.user?.email || '';
  try {
    if (!pool || !getDbStatus()) {
      return res.json({ success: true, data: getMySubmissionsFallback(candId, candEmail) });
    }
    const result = await pool.query(
      `SELECT s.*, a.title as assessment_title, a.category
       FROM assessment_submissions s
       LEFT JOIN assessments a ON s.assessment_id = a.id
       WHERE s.candidate_id = $1 OR LOWER(s.candidate_email) = LOWER($2)
       ORDER BY s.created_at DESC`,
      [candId, candEmail]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.json({ success: true, data: getMySubmissionsFallback(candId, candEmail) });
  }
};

// POST /api/submissions/proctoring-event
export const logProctoringEvent = async (req, res) => {
  try {
    if (!pool || !getDbStatus()) {
      saveProctoringEventFallback(req.body);
      return res.status(200).json({ success: true, message: 'Proctoring event logged (fallback)' });
    }
    const {
      attemptId,
      candidateId: bodyCandId,
      assessmentId,
      type, // 'NO_FACE' | 'LOOKING_AWAY' | 'MULTIPLE_FACES'
      timestamp,
      details
    } = req.body;

    if (!attemptId || !type) {
      return res.status(400).json({ success: false, error: 'attemptId and type are required' });
    }

    const candidateId = req.user?.id || bodyCandId || null;
    const asmId = assessmentId || null;
    const eventId = `pe-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    const insertResult = await pool.query(
      `INSERT INTO proctoring_events (id, attempt_id, candidate_id, assessment_id, type, timestamp, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        eventId,
        String(attemptId),
        candidateId,
        asmId,
        String(type).toUpperCase(),
        eventTime,
        details ? JSON.stringify(details) : null
      ]
    );

    return res.status(201).json({
      success: true,
      data: insertResult.rows[0]
    });
  } catch (err) {
    console.error('Error logging proctoring event:', err);
    return res.status(500).json({ success: false, error: 'Failed to record proctoring event' });
  }
};

// GET /api/submissions/proctoring-events/:attemptId
export const getProctoringEvents = async (req, res) => {
  try {
    if (!pool) {
      return res.json({ success: true, data: getProctoringEventsFallback(req.params.attemptId) });
    }
    const { attemptId } = req.params;
    if (!attemptId) {
      return res.status(400).json({ success: false, error: 'attemptId is required' });
    }

    const result = await pool.query(
      `SELECT id, attempt_id, candidate_id, assessment_id, type, timestamp, details
       FROM proctoring_events
       WHERE attempt_id = $1 OR candidate_id = $1
       ORDER BY timestamp ASC`,
      [attemptId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching proctoring events:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch proctoring events' });
  }
};

