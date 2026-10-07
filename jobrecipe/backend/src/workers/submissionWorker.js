import { pool } from '../db/pool.js';
import { evaluateCodeAgainstTestCases } from '../services/codeExecutionService.js';

/**
 * Authoritative processing of a single code submission job.
 * Evaluates source code against database test cases (with client fallback),
 * reports progress via callback, and returns normalized assessment evaluation.
 *
 * @param {Object} jobData - Submission details (questionId, language, sourceCode, testCases)
 * @param {Function} updateProgress - Callback to report live progress { step, progress, completedTests, totalTests }
 * @returns {Promise<Object>} Normalized evaluation result payload
 */
export const processSubmission = async (jobData, updateProgress = async () => {}) => {
  const {
    questionId,
    question_id,
    assessmentQuestionId,
    language,
    sourceCode,
    testCases: clientTestCases
  } = jobData;

  const primaryId = questionId || question_id || assessmentQuestionId;
  const secondaryId = question_id || questionId || assessmentQuestionId;

  if (!primaryId || !language || typeof sourceCode !== 'string') {
    throw new Error('questionId, language, and sourceCode are required.');
  }

  // 1. Fetch authoritative test cases from questions table
  let qRes = await pool.query(
    `SELECT id, type, question, options, test_cases, marks, time_limit_sec
     FROM questions
     WHERE id = $1 OR id = $2`,
    [primaryId, secondaryId]
  );

  let question = qRes.rows[0];

  // 2. If not found directly, check assessment_questions table
  if (!question) {
    const aqRes = await pool.query(
      `SELECT aq.id, aq.question_id, q.type, q.question, aq.options,
              COALESCE(aq.test_cases, q.test_cases) as test_cases,
              aq.marks, q.time_limit_sec
       FROM assessment_questions aq
       LEFT JOIN questions q ON aq.question_id = q.id
       WHERE aq.id = $1 OR aq.question_id = $1 OR aq.id = $2 OR aq.question_id = $2`,
      [primaryId, secondaryId]
    );
    if (aqRes.rows.length > 0) {
      question = aqRes.rows[0];
    }
  }

  let testCases = [];
  let marksPerQuestion = 10;

  if (question) {
    marksPerQuestion = Number(question.marks) > 0 ? Number(question.marks) : 10;
    if (Array.isArray(question.test_cases)) {
      testCases = question.test_cases;
    } else if (typeof question.test_cases === 'string') {
      try { testCases = JSON.parse(question.test_cases); } catch (e) {}
    } else if (Array.isArray(question.options) && question.type === 'Coding') {
      testCases = question.options;
    }
  }

  // 3. Fallback to client-provided test cases if database query yielded no test cases
  if ((!testCases || testCases.length === 0) && Array.isArray(clientTestCases) && clientTestCases.length > 0) {
    testCases = clientTestCases;
  }

  if (!testCases || testCases.length === 0) {
    throw new Error('No test cases configured for this coding challenge.');
  }

  // Report initial progress: Test cases loaded, beginning evaluation
  await updateProgress({
    step: 'evaluating',
    progress: 15,
    totalTests: testCases.length,
    completedTests: 0,
    message: `Executing against ${testCases.length} test cases...`
  });

  // Execute solution code against all test cases in remote sandbox (Stage 1 parallel execution + Stage 2 caching)
  const evaluation = await evaluateCodeAgainstTestCases({
    language,
    sourceCode,
    testCases,
    includeHiddenDetails: false,
    timeoutMs: 8000
  });

  // Report final progress: Evaluation complete
  await updateProgress({
    step: 'completed',
    progress: 100,
    totalTests: testCases.length,
    completedTests: evaluation.passedTests,
    message: 'Evaluation completed successfully.'
  });

  const marks = marksPerQuestion;
  const earnedMarks = Math.round((evaluation.score / 100) * marks);

  const sampleTests = evaluation.testResults.filter(t => !t.isHidden);
  const hiddenTests = evaluation.testResults.filter(t => t.isHidden);
  const samplePassed = sampleTests.filter(t => t.passed).length;
  const hiddenPassed = hiddenTests.filter(t => t.passed).length;

  return {
    success: true,
    questionId: primaryId,
    language,
    earnedMarks,
    maxMarks: marks,
    summary: {
      totalTests: testCases.length,
      passedTests: evaluation.passedTests,
      sampleTotal: sampleTests.length,
      samplePassed,
      hiddenTotal: hiddenTests.length,
      hiddenPassed,
      allHiddenPassed: hiddenTests.length === 0 || hiddenPassed === hiddenTests.length
    },
    evaluation
  };
};
