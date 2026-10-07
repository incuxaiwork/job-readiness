/**
 * Shared question classification utilities for assessing and authoring questions
 */

export const isCodingQuestion = (q) => {
  if (!q) return false;
  const cat = String(q.category || '').trim().toLowerCase();
  const type = String(q.type || '').trim().toLowerCase();
  const id = String(q.id || '').trim().toLowerCase();
  const topic = String(q.topic || '').trim().toLowerCase();

  const hasTestCases = (Array.isArray(q.testCases) && q.testCases.length > 0) ||
    (Array.isArray(q.test_cases) && q.test_cases.length > 0) ||
    (typeof q.test_cases === 'string' && q.test_cases.trim() !== '' && q.test_cases !== '[]' && q.test_cases !== 'null') ||
    (typeof q.testCases === 'string' && q.testCases.trim() !== '' && q.testCases !== '[]' && q.testCases !== 'null');

  const hasTemplates = !!(
    (q.starter_templates && typeof q.starter_templates === 'object' && Object.keys(q.starter_templates).length > 0) ||
    (q.starterTemplates && typeof q.starterTemplates === 'object' && Object.keys(q.starterTemplates).length > 0)
  );

  return type === 'coding' ||
    cat === 'coding' ||
    id.startsWith('code-') ||
    topic === 'coding' ||
    hasTestCases ||
    hasTemplates;
};
