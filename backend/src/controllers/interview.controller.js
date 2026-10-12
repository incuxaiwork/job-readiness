import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../db/prisma.js';
import {
  createStreamingToken,
  getAvatarConfig,
  releaseStreamingSession
} from '../services/heygenService.js';

// Default curated interview questions spanning key categories (3 Questions: Intro, Project Challenges, and Solution Approach)
const DEFAULT_QUESTIONS = [
  {
    questionNumber: 1,
    category: 'INTRODUCTION & PROFILE',
    questionText: 'Tell me about yourself.'
  },
  {
    questionNumber: 2,
    category: 'PROJECT EXPERIENCE & CHALLENGES',
    questionText: 'Can you explain one of the projects you have worked on, and what major challenges or difficult situations did you face while developing it?'
  },
  {
    questionNumber: 3,
    category: 'PROBLEM SOLVING & RESOLUTION',
    questionText: 'How did you overcome those challenges, and what approach did you take to solve the situation?'
  }
];

// Helper to sanitize numeric decimals to 2 decimal places
const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

// Resilient in-memory fallback store when PostgreSQL / cloud network is offline
const memorySessions = new Map();
const memoryAnswers = new Map();
const memoryTelemetry = new Map();
const memoryAnalysis = new Map();
const latestSessionByUser = new Map();
let lastCreatedSessionId = null;

/**
 * POST /api/interview/session
 * Create a new mock interview session with associated questions in a Prisma transaction.
 */
export const createSession = async (req, res) => {
  const { targetRole = 'Software Engineer', questions: customQuestions } = req.body;
  const userId = req.user?.id || req.body.userId || null;
  const sessionId = `isess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const settings = loadSettingsFromDisk();
  const qLimit = Math.max(1, Number(settings?.questionCount) || 1);

  const questionsToSeed = Array.isArray(customQuestions) && customQuestions.length > 0
    ? customQuestions.slice(0, qLimit).map((q, idx) => ({
        id: `iq-${Date.now()}-${idx}-${crypto.randomBytes(3).toString('hex')}`,
        questionNumber: idx + 1,
        category: q.category || 'INTRODUCTION & PROFILE',
        questionText: q.questionText || q.question || 'Tell me about yourself',
        answers: []
      }))
    : DEFAULT_QUESTIONS.slice(0, qLimit).map((q) => ({
        id: `iq-${Date.now()}-${q.questionNumber}-${crypto.randomBytes(3).toString('hex')}`,
        questionNumber: q.questionNumber,
        category: q.category,
        questionText: q.questionText,
        answers: []
      }));

  const fallbackSession = {
    id: sessionId,
    userId,
    status: 'IN_PROGRESS',
    targetRole,
    startedAt: new Date(),
    questions: questionsToSeed
  };

  // Always update memory store
  memorySessions.set(sessionId, fallbackSession);
  latestSessionByUser.set(userId || 'guest', fallbackSession);
  lastCreatedSessionId = sessionId;

  try {
    // Prisma Transaction: create session + questions
    const session = await prisma.$transaction(async (tx) => {
      return await tx.interviewSession.create({
        data: {
          id: sessionId,
          userId,
          status: 'IN_PROGRESS',
          targetRole,
          startedAt: new Date(),
          questions: {
            create: questionsToSeed.map((q) => ({
              id: q.id,
              questionNumber: q.questionNumber,
              category: q.category,
              questionText: q.questionText,
              askedAt: new Date()
            }))
          }
        },
        include: {
          questions: {
            orderBy: { questionNumber: 'asc' }
          }
        }
      });
    });

    memorySessions.set(sessionId, session);
    latestSessionByUser.set(userId || 'guest', session);

    return res.status(201).json({
      success: true,
      message: 'Interview session created successfully.',
      session
    });
  } catch (error) {
    console.warn('Prisma createSession warning (using in-memory fallback):', error.message);
    return res.status(201).json({
      success: true,
      message: 'Interview session initialized successfully.',
      session: fallbackSession
    });
  }
};

/**
 * GET /api/interview/session/:id
 * Retrieve a specific interview session with questions, answers, and analysis.
 */
export const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    let session = null;
    try {
      session = await prisma.interviewSession.findUnique({
        where: { id },
        include: {
          questions: {
            orderBy: { questionNumber: 'asc' },
            include: {
              answers: {
                orderBy: { startedAt: 'asc' }
              }
            }
          },
          analysis: true
        }
      });
    } catch (dbErr) {
      console.warn('Prisma getSession notice:', dbErr.message);
    }

    if (!session) {
      session = memorySessions.get(id);
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Interview session not found.' });
    }

    const analysis = session.analysis || memoryAnalysis.get(id) || null;
    return res.json({ success: true, session, analysis });
  } catch (error) {
    console.error('Error fetching interview session:', error);
    const session = memorySessions.get(req.params.id);
    if (session) {
      const analysis = session.analysis || memoryAnalysis.get(session.id) || null;
      return res.json({ success: true, session, analysis });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/interview/session/latest/user
 * Get candidate's latest session.
 */
export const getLatestSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const whereClause = userId ? { userId } : {};

    let session = null;
    try {
      session = await prisma.interviewSession.findFirst({
        where: whereClause,
        orderBy: { startedAt: 'desc' },
        include: {
          questions: {
            orderBy: { questionNumber: 'asc' },
            include: { answers: true }
          },
          analysis: true
        }
      });
    } catch (dbErr) {
      console.warn('Prisma getLatestSession notice:', dbErr.message);
    }

    if (!session) {
      session = latestSessionByUser.get(userId || 'guest') ||
        (lastCreatedSessionId ? memorySessions.get(lastCreatedSessionId) : null) ||
        Array.from(memorySessions.values()).reverse()[0];
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'No interview session found.' });
    }

    const analysis = session.analysis || memoryAnalysis.get(session.id) || null;
    return res.json({ success: true, session, analysis });
  } catch (error) {
    console.error('Error fetching latest interview session:', error);
    const session = latestSessionByUser.get(req.user?.id || 'guest') ||
      (lastCreatedSessionId ? memorySessions.get(lastCreatedSessionId) : null) ||
      Array.from(memorySessions.values()).reverse()[0];
    if (session) {
      const analysis = session.analysis || memoryAnalysis.get(session.id) || null;
      return res.json({ success: true, session, analysis });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/interview/session/:id/questions
 * Get all questions for a specific session.
 */
export const getSessionQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    let questions = null;
    try {
      questions = await prisma.interviewQuestion.findMany({
        where: { sessionId: id },
        orderBy: { questionNumber: 'asc' },
        include: {
          answers: true
        }
      });
    } catch (dbErr) {
      console.warn('Prisma getSessionQuestions notice:', dbErr.message);
    }

    if (!questions || questions.length === 0) {
      const session = memorySessions.get(id);
      questions = session?.questions || [];
    }

    return res.json({ success: true, questions });
  } catch (error) {
    console.error('Error fetching session questions:', error);
    const session = memorySessions.get(req.params.id);
    return res.json({ success: true, questions: session?.questions || [] });
  }
};

/**
 * POST /api/interview/session/:id/telemetry
 * Real-time telemetry batch persistence.
 * Batches incoming telemetry samples into PostgreSQL using Prisma or in-memory fallback.
 */
export const saveTelemetryBatch = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { samples, questionId } = req.body;

    // Support single sample or array of samples
    const sampleList = Array.isArray(samples) ? samples : (req.body.sample ? [req.body.sample] : [req.body]);

    if (!sampleList || sampleList.length === 0) {
      return res.status(400).json({ success: false, error: 'No telemetry samples provided.' });
    }

    // Always buffer telemetry in in-memory session store
    const memSession = memorySessions.get(sessionId);
    if (memSession) {
      if (!memSession.telemetry) memSession.telemetry = [];
      memSession.telemetry.push(...sampleList);
    }

    // Format records for batch insert
    const records = sampleList.map((s) => ({
      id: `telem-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      sessionId,
      questionId: s.questionId || questionId || null,
      timestamp: s.timestamp ? new Date(s.timestamp) : new Date(),
      faceDetected: s.faceDetected !== false,
      eyeContact: round2(s.eyeContact ?? s.eye_contact ?? 0),
      gazeDirection: s.gazeDirection || s.headPose || null,
      blinkRate: s.blinkRate ? round2(s.blinkRate) : null,
      emotion: s.emotion || 'Neutral',
      emotionConfidence: s.emotionConfidence ? round2(s.emotionConfidence) : null,
      attention: round2(s.attention ?? s.attention_score ?? 0),
      confidence: round2(s.confidence ?? s.confidence_score ?? 0),
      pitch: s.pitch ? round2(s.pitch) : null,
      yaw: s.yaw ? round2(s.yaw) : null,
      roll: s.roll ? round2(s.roll) : null,
      speechRate: s.speechRate ? round2(s.speechRate) : null,
      lipSync: s.lipSync ? round2(s.lipSync) : null,
      expressionStability: s.expressionStability ? round2(s.expressionStability) : null
    }));

    try {
      const result = await prisma.interviewTelemetry.createMany({
        data: records
      });

      return res.status(201).json({
        success: true,
        insertedCount: result.count
      });
    } catch (dbErr) {
      console.warn('Prisma saveTelemetryBatch notice (buffered in memory):', dbErr.message);
      return res.status(201).json({
        success: true,
        insertedCount: sampleList.length,
        offline: true
      });
    }
  } catch (error) {
    console.error('Error saving telemetry batch:', error);
    return res.status(200).json({ success: true, message: 'Telemetry logged' });
  }
};

/**
 * POST /api/interview/question/:id/answer
 * Record and evaluate a candidate's answer for a question.
 */
export const saveQuestionAnswer = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    const {
      transcript = '',
      duration = 0,
      startedAt,
      completedAt,
      telemetry = {}
    } = req.body;

    let question = null;
    try {
      question = await prisma.interviewQuestion.findUnique({
        where: { id: questionId },
        include: { session: true }
      });
    } catch (dbErr) {
      console.warn('Prisma question lookup notice in saveQuestionAnswer:', dbErr.message);
    }

    if (!question) {
      for (const s of memorySessions.values()) {
        const found = (s.questions || []).find((item) => item.id === questionId);
        if (found) {
          question = found;
          break;
        }
      }
    }

    if (!question) {
      question = {
        id: questionId,
        questionNumber: 1,
        category: 'TECHNICAL',
        questionText: 'Interview Question'
      };
    }

    // Evaluate answer content based on transcript length, vocabulary & structure
    const trimmedTranscript = (transcript || '').trim();
    const words = trimmedTranscript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const isAnswerEmpty =
      wordCount < 2 ||
      trimmedTranscript.toLowerCase().includes('candidate provided verbal answer') ||
      trimmedTranscript.toLowerCase().includes('no verbal or typed answer') ||
      trimmedTranscript.toLowerCase().includes('no response') ||
      trimmedTranscript.toLowerCase().includes('skipped') ||
      trimmedTranscript.toLowerCase().includes('remained silent');

    let commScore = 0;
    let techScore = 0;
    let overallQScore = 0;
    let relevanceScore = 0;
    let answerQuality = 'No Response';
    let aiFeedback = 'Candidate did not provide a verbal or typed response to this question. Score: 0/100.';
    let speechRateVal = 0;
    let matchedKeywords = [];
    const durationMinutes = Math.max(duration / 60, 0.2);

    const eyeContactVal = isAnswerEmpty ? 0 : round2(telemetry.eyeContact ?? 85);
    const attentionVal = isAnswerEmpty ? 0 : round2(telemetry.attention ?? 88);
    const confidenceVal = isAnswerEmpty ? 0 : round2(telemetry.confidence ?? 84);
    const dominantEmotion = isAnswerEmpty ? 'Neutral' : (telemetry.emotion || 'Neutral');

    if (!isAnswerEmpty) {
      speechRateVal = Math.min(220, Math.max(60, Math.round(wordCount / durationMinutes)));

      // Communication score derived from length and pacing
      commScore = 45;
      if (wordCount >= 8) commScore += 15;
      if (wordCount >= 20) commScore += 15;
      if (wordCount >= 50) commScore += 15;
      if (speechRateVal >= 100 && speechRateVal <= 170) commScore += 10;
      commScore = Math.min(98, Math.max(45, commScore));

      // Technical score derived from keyword relevance to question category
      techScore = 50;
      const lowerTranscript = trimmedTranscript.toLowerCase();
      const technicalKeywords = [
        'architecture', 'scalable', 'database', 'system', 'api', 'component', 'performance',
        'trade-off', 'optimization', 'query', 'testing', 'debugging', 'concurrency', 'state',
        'algorithm', 'cache', 'security', 'framework', 'service', 'pipeline', 'deployment',
        'model', 'python', 'sql', 'data', 'pandas', 'features', 'classification', 'metric',
        'regression', 'neural', 'react', 'node', 'express', 'git', 'docker', 'machine learning',
        'deep learning', 'transformer', 'loss', 'training', 'validation', 'accuracy', 'overfitting'
      ];
      matchedKeywords = technicalKeywords.filter((kw) => lowerTranscript.includes(kw));
      techScore += Math.min(45, matchedKeywords.length * 7 + Math.min(20, wordCount * 0.8));
      techScore = Math.min(98, Math.max(50, techScore));
      relevanceScore = Math.min(95, 60 + matchedKeywords.length * 7);

      overallQScore = round2(
        techScore * 0.45 + commScore * 0.35 + confidenceVal * 0.10 + eyeContactVal * 0.10
      );

      if (overallQScore >= 80) answerQuality = 'Excellent';
      else if (overallQScore >= 65) answerQuality = 'Proficient';
      else answerQuality = 'Needs Improvement';

      aiFeedback = `Candidate spoke ${wordCount} words at ~${speechRateVal} WPM with ${dominantEmotion.toLowerCase()} delivery. ${
        matchedKeywords.length > 0
          ? `Incorporated relevant domain concepts (${matchedKeywords.slice(0, 4).join(', ')}).`
          : 'Answer was recorded and analyzed.'
      }`;
    }

    const answerId = `ans-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const answer = {
      id: answerId,
      questionId,
      transcript: isAnswerEmpty ? '' : trimmedTranscript,
      startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - duration * 1000),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      duration: Number(duration) || 0,
      overallScore: isAnswerEmpty ? 0 : overallQScore,
      communicationScore: isAnswerEmpty ? 0 : commScore,
      technicalScore: isAnswerEmpty ? 0 : techScore,
      confidenceScore: isAnswerEmpty ? 0 : confidenceVal,
      eyeContactScore: isAnswerEmpty ? 0 : eyeContactVal,
      attentionScore: isAnswerEmpty ? 0 : attentionVal,
      relevanceScore: isAnswerEmpty ? 0 : relevanceScore,
      dominantEmotion,
      speechRate: speechRateVal,
      answerQuality,
      aiFeedback
    };

    // Store in memory
    memoryAnswers.set(questionId, answer);
    for (const s of memorySessions.values()) {
      const q = (s.questions || []).find((item) => item.id === questionId);
      if (q) {
        if (!q.answers) q.answers = [];
        const existingIdx = q.answers.findIndex((a) => a.id === answerId || a.questionId === questionId);
        if (existingIdx >= 0) {
          q.answers[existingIdx] = answer;
        } else {
          q.answers.push(answer);
        }
      }
    }

    try {
      await prisma.interviewAnswer.create({
        data: {
          id: answerId,
          questionId,
          transcript: isAnswerEmpty ? '' : trimmedTranscript,
          startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - duration * 1000),
          completedAt: completedAt ? new Date(completedAt) : new Date(),
          duration: Number(duration) || 0,
          overallScore: isAnswerEmpty ? 0 : overallQScore,
          communicationScore: isAnswerEmpty ? 0 : commScore,
          technicalScore: isAnswerEmpty ? 0 : techScore,
          confidenceScore: isAnswerEmpty ? 0 : confidenceVal,
          eyeContactScore: isAnswerEmpty ? 0 : eyeContactVal,
          attentionScore: isAnswerEmpty ? 0 : attentionVal,
          relevanceScore: isAnswerEmpty ? 0 : relevanceScore,
          dominantEmotion,
          speechRate: speechRateVal,
          answerQuality,
          aiFeedback
        }
      });

      // Mark question completed
      await prisma.interviewQuestion.update({
        where: { id: questionId },
        data: { completedAt: new Date() }
      });
    } catch (dbErr) {
      console.warn('Prisma saveQuestionAnswer notice (saved to memory):', dbErr.message);
    }

    return res.status(201).json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('Error saving question answer:', error);
    return res.status(200).json({ success: true, message: 'Answer logged' });
  }
};

/**
 * POST /api/interview/session/:id/complete
 * Completes the interview session, aggregates all real telemetry and answer evaluations,
 * and saves InterviewAnalysis in a safe Prisma transaction.
 */
export const completeInterview = async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    let session = null;
    try {
      session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          questions: {
            include: { answers: true }
          },
          telemetry: true
        }
      });
    } catch (dbErr) {
      console.warn('Prisma lookup notice in completeInterview:', dbErr.message);
    }

    if (!session) {
      session = memorySessions.get(sessionId);
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'Interview session not found.' });
    }

    const telemetry = session.telemetry || [];
    const questions = session.questions || [];
    const answers = questions.flatMap((q) => q.answers || []);

    // 1. Calculate Real Telemetry Averages
    let avgEyeContact = 85;
    let avgAttention = 85;
    let avgConfidence = 80;
    const emotionCounts = {};

    if (telemetry.length > 0) {
      const sumEye = telemetry.reduce((acc, t) => acc + Number(t.eyeContact || 0), 0);
      const sumAtt = telemetry.reduce((acc, t) => acc + Number(t.attention || 0), 0);
      const sumConf = telemetry.reduce((acc, t) => acc + Number(t.confidence || 0), 0);

      avgEyeContact = round2(sumEye / telemetry.length);
      avgAttention = round2(sumAtt / telemetry.length);
      avgConfidence = round2(sumConf / telemetry.length);

      telemetry.forEach((t) => {
        const em = t.emotion || 'Neutral';
        emotionCounts[em] = (emotionCounts[em] || 0) + 1;
      });
    }

    // Dominant emotion
    let dominantEmotion = 'Confident';
    let maxEmotionCount = 0;
    Object.entries(emotionCounts).forEach(([em, count]) => {
      if (count > maxEmotionCount) {
        maxEmotionCount = count;
        dominantEmotion = em;
      }
    });

    // Emotion stability (% of frames matching dominant emotion)
    const emotionStability = telemetry.length > 0
      ? round2((maxEmotionCount / telemetry.length) * 100)
      : 82;

    // 2. Calculate Answer Averages (Strict 0 when candidate was silent / gave no answers)
    let avgTechnical = 0;
    let avgComm = 0;
    let avgSpeechRate = 0;
    let validAnswersCount = 0;

    if (answers.length > 0) {
      const validAnswers = answers.filter(a => {
        const text = (a.transcript || '').trim().toLowerCase();
        return (
          Number(a.overallScore || 0) > 0 ||
          (text.length >= 2 &&
            !text.includes('candidate provided verbal answer') &&
            !text.includes('no response') &&
            !text.includes('skipped') &&
            !text.includes('remained silent'))
        );
      });
      validAnswersCount = validAnswers.length;

      if (validAnswersCount > 0) {
        const sumTech = validAnswers.reduce((acc, a) => acc + Number(a.technicalScore || 0), 0);
        const sumComm = validAnswers.reduce((acc, a) => acc + Number(a.communicationScore || 0), 0);
        const sumRate = validAnswers.reduce((acc, a) => acc + Number(a.speechRate || 0), 0);

        avgTechnical = round2(sumTech / validAnswersCount);
        avgComm = round2(sumComm / validAnswersCount);
        avgSpeechRate = round2(sumRate / validAnswersCount);
      }
    }

    // 3. Consolidated Overall Score (0% if no verbal or typed answers were provided!)
    const overallScore = validAnswersCount > 0
      ? round2(
          avgTechnical * 0.45 +
          avgComm * 0.35 +
          avgConfidence * 0.10 +
          avgEyeContact * 0.10
        )
      : 0;

    const expressionScore = round2((avgAttention + avgConfidence) / 2);
    const speechScore = round2(avgComm);
    const totalDuration = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000);

    // 4. Question Breakdown (Strict 0 when answer is missing)
    const questionBreakdown = questions.map((q) => {
      const ans = q.answers?.[0];
      const text = (ans?.transcript || '').trim();
      const hasAnswer = Boolean(
        ans &&
        (Number(ans.overallScore || 0) > 0 ||
          (text.length >= 2 &&
            !text.toLowerCase().includes('candidate provided verbal answer') &&
            !text.toLowerCase().includes('no verbal or typed answer') &&
            !text.toLowerCase().includes('no response') &&
            !text.toLowerCase().includes('skipped') &&
            !text.toLowerCase().includes('remained silent')))
      );
      return {
        questionNumber: q.questionNumber,
        category: q.category,
        questionText: q.questionText,
        transcript: hasAnswer ? ans.transcript : '',
        isSkipped: !hasAnswer,
        overallScore: hasAnswer ? Number(ans.overallScore || 0) : 0,
        technicalScore: hasAnswer ? Number(ans.technicalScore || 0) : 0,
        communicationScore: hasAnswer ? Number(ans.communicationScore || 0) : 0,
        confidenceScore: Number(ans?.confidenceScore || (hasAnswer ? avgConfidence : 0)),
        eyeContactScore: Number(ans?.eyeContactScore || (hasAnswer ? avgEyeContact : 0)),
        dominantEmotion: ans?.dominantEmotion || (hasAnswer ? dominantEmotion : 'Neutral'),
        aiFeedback: hasAnswer
          ? (ans.aiFeedback || 'Answer recorded and analyzed.')
          : 'Candidate skipped this question. No analysis generated.'
      };
    });

    // 5. Dynamic Strengths, Weaknesses & Recommendations
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    if (avgEyeContact >= 80) strengths.push('Maintained steady eye contact with the camera throughout responses.');
    else weaknesses.push('Gaze wandered away from center camera frequently during technical explanations.');

    if (avgConfidence >= 80) strengths.push('Exhibited composed, confident facial expressions and poised body posture.');
    else weaknesses.push('Facial stability indicated occasional nervousness or hesitation.');

    if (avgTechnical >= 75) strengths.push('Articulated core engineering fundamentals and architectural trade-offs clearly.');
    else weaknesses.push('Responses lacked specific architectural terminology and measurable metrics.');

    if (avgSpeechRate >= 110 && avgSpeechRate <= 165) strengths.push(`Optimal vocal pacing measured at ${avgSpeechRate} words per minute.`);
    else weaknesses.push(`Pacing was ${avgSpeechRate < 110 ? 'too slow with hesitation' : 'overly rapid'} during explanations.`);

    // Fallbacks if lists are sparse
    if (strengths.length === 0) strengths.push('Successfully completed all structured interview questions.');
    if (weaknesses.length === 0) weaknesses.push('Could expand on scalability bottlenecks and distributed caching.');

    recommendations.push('Structure complex answers using the STAR method (Situation, Task, Action, Result).');
    recommendations.push('Maintain direct camera eye-contact during introductory thesis sentences.');
    recommendations.push('Elaborate on production failure modes, rollback mechanisms, and monitoring dashboards.');

    const aiFeedback = `Candidate completed comprehensive mock interview for ${session.targetRole || 'Software Engineer'}. Demonstrates overall readiness score of ${overallScore}% with ${dominantEmotion.toLowerCase()} demeanour and ${avgTechnical}% technical depth.`;

    const analysisId = `ianal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const fallbackAnalysis = {
      id: analysisId,
      sessionId,
      overallScore,
      communicationScore: avgComm,
      confidenceScore: avgConfidence,
      eyeContactScore: avgEyeContact,
      attentionScore: avgAttention,
      expressionScore,
      technicalScore: avgTechnical,
      speechScore,
      dominantEmotion,
      emotionStability,
      strengths,
      weaknesses,
      recommendations,
      aiFeedback,
      questionBreakdown
    };

    const isTerminated = req.body?.status === 'TERMINATED_VIOLATION';
    const finalStatus = isTerminated ? 'TERMINATED_VIOLATION' : 'COMPLETED';
    const finalWarningCount = Number(req.body?.warningCount) || (isTerminated ? 3 : 0);

    const updatedMemorySession = {
      ...session,
      status: finalStatus,
      warningCount: finalWarningCount,
      completedAt: new Date(),
      duration: totalDuration,
      overallScore,
      interviewScore: overallScore,
      communicationScore: avgComm,
      confidenceScore: avgConfidence,
      eyeContactScore: avgEyeContact,
      attentionScore: avgAttention,
      technicalScore: avgTechnical,
      expressionScore,
      speechScore,
      analysis: fallbackAnalysis
    };

    memorySessions.set(sessionId, updatedMemorySession);
    memoryAnalysis.set(sessionId, fallbackAnalysis);

    // 6. Prisma Transaction to safely complete session and upsert analysis if DB is online
    try {
      const result = await prisma.$transaction(async (tx) => {
        const updatedSession = await tx.interviewSession.update({
          where: { id: sessionId },
          data: {
            status: finalStatus,
            completedAt: new Date(),
            duration: totalDuration,
            overallScore,
            interviewScore: overallScore,
            communicationScore: avgComm,
            confidenceScore: avgConfidence,
            eyeContactScore: avgEyeContact,
            attentionScore: avgAttention,
            technicalScore: avgTechnical,
            expressionScore,
            speechScore
          }
        });

        const analysis = await tx.interviewAnalysis.upsert({
          where: { sessionId },
          create: {
            id: analysisId,
            sessionId,
            overallScore,
            communicationScore: avgComm,
            confidenceScore: avgConfidence,
            eyeContactScore: avgEyeContact,
            attentionScore: avgAttention,
            expressionScore,
            technicalScore: avgTechnical,
            speechScore,
            dominantEmotion,
            emotionStability,
            strengths,
            weaknesses,
            recommendations,
            aiFeedback,
            questionBreakdown
          },
          update: {
            overallScore,
            communicationScore: avgComm,
            confidenceScore: avgConfidence,
            eyeContactScore: avgEyeContact,
            attentionScore: avgAttention,
            expressionScore,
            technicalScore: avgTechnical,
            speechScore,
            dominantEmotion,
            emotionStability,
            strengths,
            weaknesses,
            recommendations,
            aiFeedback,
            questionBreakdown,
            updatedAt: new Date()
          }
        });

        memorySessions.set(sessionId, updatedSession);
        memoryAnalysis.set(sessionId, analysis);

        return { session: updatedSession, analysis };
      });

      return res.json({
        success: true,
        message: 'Interview completed and analyzed successfully.',
        session: result.session,
        analysis: result.analysis
      });
    } catch (txErr) {
      console.warn('Prisma transaction notice (returning memory store):', txErr.message);
      return res.json({
        success: true,
        message: 'Interview completed and analyzed successfully (offline store).',
        session: updatedMemorySession,
        analysis: fallbackAnalysis
      });
    }
  } catch (error) {
    console.warn('Prisma completeInterview notice (offline resilient):', error.message);
    const session = memorySessions.get(sessionId) || { id: sessionId, targetRole: 'Software Engineer', questions: [] };
    const questions = session.questions || [];
    const answers = questions.flatMap((q) => q.answers || []);

    const validAnswers = answers.filter((a) => {
      const text = (a.transcript || '').trim().toLowerCase();
      return (
        Number(a.overallScore || 0) > 0 ||
        (text.length >= 2 &&
          !text.includes('candidate provided verbal answer') &&
          !text.includes('no response') &&
          !text.includes('skipped') &&
          !text.includes('remained silent'))
      );
    });
    const hasSpoken = validAnswers.length > 0;
    const avgScore = hasSpoken ? Math.round(validAnswers.reduce((acc, a) => acc + (a.overallScore || 0), 0) / validAnswers.length) : 0;
    const avgTech = hasSpoken ? Math.round(validAnswers.reduce((acc, a) => acc + (a.technicalScore || 0), 0) / validAnswers.length) : 0;
    const avgComm = hasSpoken ? Math.round(validAnswers.reduce((acc, a) => acc + (a.communicationScore || 0), 0) / validAnswers.length) : 0;

    const fallbackAnalysis = {
      id: `ana-${Date.now()}`,
      sessionId,
      overallScore: avgScore,
      communicationScore: avgComm,
      confidenceScore: hasSpoken ? 84 : 0,
      eyeContactScore: hasSpoken ? 88 : 0,
      attentionScore: hasSpoken ? 88 : 0,
      expressionScore: hasSpoken ? 80 : 0,
      technicalScore: avgTech,
      speechScore: hasSpoken ? 82 : 0,
      dominantEmotion: hasSpoken ? 'Confident' : 'Neutral',
      emotionStability: 85,
      strengths: ['Clear articulate communication', 'Good conceptual structure'],
      weaknesses: ['Add concrete edge-case metrics'],
      recommendations: ['Practice timed mock answers'],
      aiFeedback: hasSpoken ? 'Solid performance across key competencies.' : 'No verbal answers detected.',
      questionBreakdown: questions.map((q, idx) => {
        const ans = (q.answers || [])[0];
        const text = (ans?.transcript || '').trim();
        const hasAnswer = Boolean(
          ans &&
          (Number(ans.overallScore || 0) > 0 ||
            (text.length >= 2 &&
              !text.toLowerCase().includes('candidate provided verbal answer') &&
              !text.toLowerCase().includes('no response') &&
              !text.toLowerCase().includes('skipped') &&
              !text.toLowerCase().includes('remained silent')))
        );
        return {
          questionNumber: q.questionNumber || idx + 1,
          category: q.category || 'TECHNICAL',
          questionText: q.questionText || 'Interview question',
          transcript: hasAnswer ? ans.transcript : '',
          isSkipped: !hasAnswer,
          overallScore: hasAnswer ? (ans?.overallScore || 0) : 0,
          technicalScore: hasAnswer ? (ans?.technicalScore || 0) : 0,
          communicationScore: hasAnswer ? (ans?.communicationScore || 0) : 0,
          confidenceScore: hasAnswer ? (ans?.confidenceScore || 80) : 0,
          eyeContactScore: hasAnswer ? (ans?.eyeContactScore || 85) : 0,
          dominantEmotion: hasAnswer ? (ans?.dominantEmotion || 'Confident') : 'Neutral',
          aiFeedback: hasAnswer
            ? (ans?.aiFeedback || 'Answer evaluated.')
            : 'Candidate skipped this question. No analysis generated.'
        };
      })
    };

    session.status = 'COMPLETED';
    session.completedAt = new Date();
    session.analysis = fallbackAnalysis;
    memorySessions.set(sessionId, session);
    memoryAnalysis.set(sessionId, fallbackAnalysis);

    return res.json({
      success: true,
      message: 'Interview completed and analyzed successfully (offline store).',
      session,
      analysis: fallbackAnalysis
    });
  }
};

/**
 * GET /api/interview/session/:id/analysis
 * Returns the final calculated metrics stored in PostgreSQL.
 */
export const getSessionAnalysis = async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    let analysis = null;
    try {
      analysis = await prisma.interviewAnalysis.findUnique({
        where: { sessionId },
        include: {
          session: {
            include: {
              questions: {
                include: { answers: true },
                orderBy: { questionNumber: 'asc' }
              }
            }
          }
        }
      });
    } catch (dbErr) {
      console.warn('Prisma getSessionAnalysis notice:', dbErr.message);
    }

    if (!analysis) {
      analysis = memoryAnalysis.get(sessionId);
      if (analysis) {
        const session = memorySessions.get(sessionId) || analysis.session || { id: sessionId };
        return res.json({
          success: true,
          analysis,
          session
        });
      }
    }

    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Interview session analysis not found.' });
    }

    return res.json({
      success: true,
      analysis,
      session: analysis.session
    });
  } catch (error) {
    console.error('Error fetching interview analysis:', error);
    const analysis = memoryAnalysis.get(req.params.id);
    if (analysis) {
      return res.json({
        success: true,
        analysis,
        session: memorySessions.get(req.params.id) || analysis.session || null
      });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/interview/analyze-frame
 * Returns face/attention heuristics for a candidate video frame.
 * Real proctoring runs client-side via MediaPipe; this is a stateless fallback.
 */
export const analyzeFrame = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image data required.' });
    }

    return res.json({
      success: true,
      faceDetected: true,
      eyeContact: 92,
      emotion: 'Focused',
      attention: 90,
      confidence: 88,
      phoneDetected: false
    });
  } catch (error) {
    console.error('Frame analysis error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Retrieve all candidate AI mock interview sessions with telemetry & scores
 */
export const getAdminSessions = async (req, res) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        questions: {
          include: {
            answers: true
          }
        },
        telemetry: {
          take: 5,
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 50
    });

    const formatted = sessions.map((s) => {
      const qCount = s.questions.length;
      const answeredCount = s.questions.filter((q) => q.answers.length > 0).length;
      return {
        id: s.id,
        candidateName: s.user?.name || 'Candidate',
        candidateEmail: s.user?.email || 'guest@candidate.edu',
        targetRole: s.targetRole || 'Software Engineer',
        status: s.status,
        overallScore: Number(s.overallScore || 0),
        technicalScore: Number(s.technicalScore || 0),
        communicationScore: Number(s.communicationScore || 0),
        eyeContactScore: Number(s.eyeContactScore || 0),
        confidenceScore: Number(s.confidenceScore || 0),
        duration: s.duration || 0,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        questionsCount: qCount,
        answeredCount: answeredCount,
        warningCount: s.status === 'TERMINATED_VIOLATION' ? 3 : 0
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      sessions: formatted
    });
  } catch (err) {
    console.warn('Prisma getAdminSessions warning, falling back to memory sessions:', err.message);
    const sessions = Array.from(memorySessions.values()).reverse();
    const formatted = sessions.map((s) => {
      const qCount = (s.questions || []).length;
      const answeredCount = (s.questions || []).filter((q) => (q.answers || []).length > 0).length;
      return {
        id: s.id,
        userId: s.userId || s.user?.id || null,
        candidateName: s.user?.name || s.candidateName || 'Candidate',
        candidateEmail: s.user?.email || s.candidateEmail || 'candidate@readysetjob.edu',
        targetRole: s.targetRole || 'Data Scientist',
        status: s.status,
        overallScore: Number(s.overallScore || s.analysis?.overallScore || 0),
        technicalScore: Number(s.technicalScore || s.analysis?.technicalScore || 0),
        communicationScore: Number(s.communicationScore || s.analysis?.communicationScore || 0),
        eyeContactScore: Number(s.eyeContactScore || s.analysis?.eyeContactScore || 85),
        confidenceScore: Number(s.confidenceScore || s.analysis?.confidenceScore || 80),
        dominantEmotion: s.analysis?.dominantEmotion || s.dominantEmotion || 'Neutral',
        duration: s.duration || 0,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        questionsCount: qCount,
        answeredCount: answeredCount,
        warningCount: s.status === 'TERMINATED_VIOLATION' ? 3 : 0
      };
    });
    return res.json({
      success: true,
      count: formatted.length,
      sessions: formatted
    });
  }
};

/**
 * Interview Settings Persistence
 */
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'config', 'interview_settings.json');

const loadSettingsFromDisk = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading interview settings file:', err);
  }
  return {
    isLocked: false,
    lockReason: 'AI Mock Interview sessions are currently locked by the recruitment administrator.',
    questionCount: 3,
    difficulty: 'Moderate',
    maxWarnings: 3,
    strictProctoring: true,
    cameraRequired: true,
    multiFaceDetection: true,
    defaultRole: 'Data Scientist',
    updatedAt: new Date().toISOString()
  };
};

export const getInterviewSettings = async (req, res) => {
  try {
    const settings = loadSettingsFromDisk();
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('Error getting interview settings:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve settings' });
  }
};

export const updateInterviewSettings = async (req, res) => {
  try {
    const current = loadSettingsFromDisk();
    const updated = {
      ...current,
      ...req.body,
      questionCount: req.body.questionCount ? Math.min(15, Math.max(1, Number(req.body.questionCount))) : current.questionCount,
      maxWarnings: req.body.maxWarnings ? Math.min(10, Math.max(1, Number(req.body.maxWarnings))) : current.maxWarnings,
      isLocked: typeof req.body.isLocked === 'boolean' ? req.body.isLocked : current.isLocked,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf8');
    console.log('✅ Updated interview settings:', updated);
    return res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Error updating interview settings:', err);
    return res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};

/**
 * POST /api/interview/avatar/token
 * Generate a short-lived HeyGen session token securely on backend.
 * Never exposes the permanent HeyGen API key to the client.
 */
export const createAvatarToken = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'guest';
    const { sessionId, allowMock = false } = req.body;

    // Optional validation: check if session exists
    if (sessionId) {
      const existing = memorySessions.get(sessionId);
      if (existing && existing.userId && existing.userId !== userId && req.user?.role !== 'admin') {
        // Ownership safety check (if authenticated and different user)
        if (req.user && req.user.id !== existing.userId) {
          return res.status(403).json({ success: false, error: 'Unauthorized to access this interview session.' });
        }
      }
    }

    const result = await createStreamingToken({
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      allowMock
    });

    return res.json(result);
  } catch (error) {
    console.error('Error creating avatar token:', error);
    return res.status(500).json({
      success: false,
      fallbackMode: true,
      error: 'Failed to create streaming avatar token. The interview will proceed in animated avatar mode.'
    });
  }
};

/**
 * GET /api/interview/avatar/config
 * Retrieve public avatar configurations and curated interviewer presets.
 */
export const getAvatarSettings = async (_req, res) => {
  try {
    const config = getAvatarConfig();
    return res.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching avatar config:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/interview/avatar/release
 * Inform backend that an avatar streaming session has ended to free tracking resources.
 */
export const releaseAvatarSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      releaseStreamingSession(sessionId);
    }
    return res.json({ success: true, message: 'Streaming session released.' });
  } catch (error) {
    return res.json({ success: true });
  }
};
