export function getActiveAssessments(assessments) {
  return assessments && assessments.length > 0 ? assessments : [
    { id: 'asm-code-2026', title: 'Full-Stack Algorithmic Coding Challenge', category: 'Coding', totalQuestions: 4, durationMinutes: 10 },
    { id: 'asm-reas-2026', title: 'Logical Reasoning & Critical Thinking Exam', category: 'Reasoning', totalQuestions: 10, durationMinutes: 10 },
    { id: 'asm-apt-2026', title: 'Quantitative Aptitude Benchmark Test', category: 'Aptitude', totalQuestions: 10, durationMinutes: 10 },
    { id: 'asm-tech-2026', title: 'Core Technical & CS Fundamentals Assessment', category: 'Technical', totalQuestions: 10, durationMinutes: 10 }
  ];
}

export function checkAssessmentCompleted(asm, { isAssessmentCompleted, candidateSubmissions } = {}) {
  if (!asm) return false;
  if (typeof isAssessmentCompleted === 'function' && isAssessmentCompleted(asm)) return true;

  const targetId = String(asm.id || '').trim().toLowerCase();
  const targetCat = String(asm.category || '').trim().toLowerCase();
  const targetTitle = String(asm.title || '').trim().toLowerCase();

  return (candidateSubmissions || []).some((s) => {
    const subAsmId = String(s.assessment_id || s.assessmentId || '').trim().toLowerCase();
    if (targetId && subAsmId === targetId) return true;
    const subCat = String(s.category || '').trim().toLowerCase();
    if (targetCat && subCat && subCat === targetCat) return true;
    const subTitle = String(s.assessment_title || s.assessmentName || '').trim().toLowerCase();
    if (targetTitle && subTitle && subTitle === targetTitle) return true;
    return false;
  });
}

export function isInterviewLocked({ role, adminUser, assessments, candidateSubmissions, isAssessmentCompleted } = {}) {
  const isAdmin = role === 'admin' || Boolean(adminUser) ||
    (typeof window !== 'undefined' && localStorage.getItem('rsj_role') === 'admin');
  if (isAdmin) return false;

  const list = getActiveAssessments(assessments);
  const completed = list.filter((asm) => checkAssessmentCompleted(asm, { isAssessmentCompleted, candidateSubmissions })).length;
  return !(list.length > 0 && completed === list.length);
}
