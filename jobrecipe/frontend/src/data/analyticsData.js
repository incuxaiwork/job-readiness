export const COLORS = {
  aptitude: '#3B82F6',
  reasoning: '#10B981',
  technical: '#F59E0B',
  english: '#8B5CF6',
  verbal: '#8B5CF6',
  coding: '#6366F1',
};

export const COLORS_LIGHT = {
  aptitude: '#93C5FD',
  reasoning: '#6EE7B7',
  technical: '#FCD34D',
  english: '#C4B5FD',
  verbal: '#C4B5FD',
  coding: '#C7D2FE',
};

export const mockStudent = {
  id: 'STU-2024-001',
  name: 'Candidate Student',
  email: 'candidate@university.edu',
  overallScore: 78.5,
  percentile: 88,
  rank: 35,
  totalStudents: 280,
  examAttempts: [
    {
      id: 'ATT-001',
      date: '2026-06-15',
      totalScore: 58,
      categories: {
        aptitude: {
          score: 16,
          maxScore: 25,
          topics: [
            { name: 'Number Systems', score: 5, maxScore: 5 },
            { name: 'Percentage', score: 4, maxScore: 5 },
            { name: 'Profit & Loss', score: 3, maxScore: 5 },
            { name: 'Time & Work', score: 2, maxScore: 5 },
            { name: 'Probability', score: 2, maxScore: 5 },
          ],
        },
        reasoning: {
          score: 14,
          maxScore: 25,
          topics: [
            { name: 'Coding-Decoding', score: 4, maxScore: 5 },
            { name: 'Syllogism', score: 3, maxScore: 5 },
            { name: 'Blood Relations', score: 3, maxScore: 5 },
            { name: 'Direction Sense', score: 2, maxScore: 5 },
            { name: 'Puzzles', score: 2, maxScore: 5 },
          ],
        },
        technical: {
          score: 15,
          maxScore: 25,
          topics: [
            { name: 'Data Structures', score: 4, maxScore: 5 },
            { name: 'Algorithms', score: 3, maxScore: 5 },
            { name: 'OOP Concepts', score: 3, maxScore: 5 },
            { name: 'DBMS', score: 3, maxScore: 5 },
            { name: 'OS Concepts', score: 2, maxScore: 5 },
          ],
        },
        english: {
          score: 13,
          maxScore: 25,
          topics: [
            { name: 'Reading Comprehension', score: 3, maxScore: 5 },
            { name: 'Error Detection', score: 3, maxScore: 5 },
            { name: 'Sentence Improvement', score: 3, maxScore: 5 },
            { name: 'Vocabulary', score: 2, maxScore: 5 },
            { name: 'Para Jumbles', score: 2, maxScore: 5 },
          ],
        },
        coding: {
          score: 14,
          maxScore: 25,
          topics: [
            { name: 'Array Operations', score: 3, maxScore: 5 },
            { name: 'String Processing', score: 3, maxScore: 5 },
            { name: 'Dynamic Programming', score: 2, maxScore: 5 },
            { name: 'Sorting & Searching', score: 3, maxScore: 5 },
            { name: 'Recursion & Backtracking', score: 3, maxScore: 5 },
          ],
        },
      },
    },
    {
      id: 'ATT-002',
      date: '2026-07-20',
      totalScore: 68,
      categories: {
        aptitude: {
          score: 19,
          maxScore: 25,
          topics: [
            { name: 'Number Systems', score: 5, maxScore: 5 },
            { name: 'Percentage', score: 4, maxScore: 5 },
            { name: 'Profit & Loss', score: 4, maxScore: 5 },
            { name: 'Time & Work', score: 3, maxScore: 5 },
            { name: 'Probability', score: 3, maxScore: 5 },
          ],
        },
        reasoning: {
          score: 16,
          maxScore: 25,
          topics: [
            { name: 'Coding-Decoding', score: 5, maxScore: 5 },
            { name: 'Syllogism', score: 3, maxScore: 5 },
            { name: 'Blood Relations', score: 4, maxScore: 5 },
            { name: 'Direction Sense', score: 2, maxScore: 5 },
            { name: 'Puzzles', score: 2, maxScore: 5 },
          ],
        },
        technical: {
          score: 18,
          maxScore: 25,
          topics: [
            { name: 'Data Structures', score: 5, maxScore: 5 },
            { name: 'Algorithms', score: 4, maxScore: 5 },
            { name: 'OOP Concepts', score: 4, maxScore: 5 },
            { name: 'DBMS', score: 3, maxScore: 5 },
            { name: 'OS Concepts', score: 2, maxScore: 5 },
          ],
        },
        english: {
          score: 15,
          maxScore: 25,
          topics: [
            { name: 'Reading Comprehension', score: 4, maxScore: 5 },
            { name: 'Error Detection', score: 3, maxScore: 5 },
            { name: 'Sentence Improvement', score: 3, maxScore: 5 },
            { name: 'Vocabulary', score: 3, maxScore: 5 },
            { name: 'Para Jumbles', score: 2, maxScore: 5 },
          ],
        },
        coding: {
          score: 17,
          maxScore: 25,
          topics: [
            { name: 'Array Operations', score: 4, maxScore: 5 },
            { name: 'String Processing', score: 4, maxScore: 5 },
            { name: 'Dynamic Programming', score: 3, maxScore: 5 },
            { name: 'Sorting & Searching', score: 3, maxScore: 5 },
            { name: 'Recursion & Backtracking', score: 3, maxScore: 5 },
          ],
        },
      },
    },
    {
      id: 'ATT-003',
      date: '2026-08-25',
      totalScore: 78,
      categories: {
        aptitude: {
          score: 21,
          maxScore: 25,
          topics: [
            { name: 'Number Systems', score: 5, maxScore: 5 },
            { name: 'Percentage', score: 5, maxScore: 5 },
            { name: 'Profit & Loss', score: 4, maxScore: 5 },
            { name: 'Time & Work', score: 4, maxScore: 5 },
            { name: 'Probability', score: 3, maxScore: 5 },
          ],
        },
        reasoning: {
          score: 18,
          maxScore: 25,
          topics: [
            { name: 'Coding-Decoding', score: 5, maxScore: 5 },
            { name: 'Syllogism', score: 4, maxScore: 5 },
            { name: 'Blood Relations', score: 4, maxScore: 5 },
            { name: 'Direction Sense', score: 3, maxScore: 5 },
            { name: 'Puzzles', score: 2, maxScore: 5 },
          ],
        },
        technical: {
          score: 21,
          maxScore: 25,
          topics: [
            { name: 'Data Structures', score: 5, maxScore: 5 },
            { name: 'Algorithms', score: 5, maxScore: 5 },
            { name: 'OOP Concepts', score: 4, maxScore: 5 },
            { name: 'DBMS', score: 4, maxScore: 5 },
            { name: 'OS Concepts', score: 3, maxScore: 5 },
          ],
        },
        english: {
          score: 18,
          maxScore: 25,
          topics: [
            { name: 'Reading Comprehension', score: 5, maxScore: 5 },
            { name: 'Error Detection', score: 4, maxScore: 5 },
            { name: 'Sentence Improvement', score: 4, maxScore: 5 },
            { name: 'Vocabulary', score: 3, maxScore: 5 },
            { name: 'Para Jumbles', score: 2, maxScore: 5 },
          ],
        },
        coding: {
          score: 20,
          maxScore: 25,
          topics: [
            { name: 'Array Operations', score: 5, maxScore: 5 },
            { name: 'String Processing', score: 4, maxScore: 5 },
            { name: 'Dynamic Programming', score: 4, maxScore: 5 },
            { name: 'Sorting & Searching', score: 4, maxScore: 5 },
            { name: 'Recursion & Backtracking', score: 3, maxScore: 5 },
          ],
        },
      },
    },
  ],
};

export const standardCompanyEligibilityCriteria = [
  {
    id: 'cec_1',
    company: 'TCS',
    role: 'Ninja',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 55,
    coding_cutoff: 50,
    overall_readiness_cutoff: 60,
    package: '₹3.6 - ₹4.0 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_2',
    company: 'TCS',
    role: 'Digital',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 70,
    reasoning_cutoff: 70,
    verbal_cutoff: 65,
    technical_cutoff: 70,
    coding_cutoff: 70,
    overall_readiness_cutoff: 70,
    package: '₹7.0 - ₹7.5 LPA',
    tier: 'dream'
  },
  {
    id: 'cec_3',
    company: 'TCS',
    role: 'Prime',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 75,
    reasoning_cutoff: 75,
    verbal_cutoff: 70,
    technical_cutoff: 80,
    coding_cutoff: 80,
    overall_readiness_cutoff: 75,
    package: '₹9.0 - ₹11.5 LPA',
    tier: 'super_dream'
  },
  {
    id: 'cec_4',
    company: 'Infosys',
    role: 'SE',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 60,
    coding_cutoff: 60,
    overall_readiness_cutoff: 60,
    package: '₹3.6 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_5',
    company: 'Infosys',
    role: 'DSE',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 65,
    reasoning_cutoff: 65,
    verbal_cutoff: 60,
    technical_cutoff: 70,
    coding_cutoff: 70,
    overall_readiness_cutoff: 68,
    package: '₹6.5 LPA',
    tier: 'dream'
  },
  {
    id: 'cec_6',
    company: 'Infosys',
    role: 'Specialist Programmer',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 70,
    reasoning_cutoff: 70,
    verbal_cutoff: 60,
    technical_cutoff: 75,
    coding_cutoff: 80,
    overall_readiness_cutoff: 75,
    package: '₹9.5 LPA',
    tier: 'super_dream'
  },
  {
    id: 'cec_7',
    company: 'Capgemini',
    role: 'Analyst',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 60,
    coding_cutoff: 55,
    overall_readiness_cutoff: 60,
    package: '₹4.25 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_8',
    company: 'Capgemini',
    role: 'Software Engineer',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 65,
    reasoning_cutoff: 65,
    verbal_cutoff: 60,
    technical_cutoff: 65,
    coding_cutoff: 65,
    overall_readiness_cutoff: 65,
    package: '₹5.75 - ₹7.5 LPA',
    tier: 'dream'
  },
  {
    id: 'cec_9',
    company: 'Accenture',
    role: 'ASE',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 65,
    coding_cutoff: 60,
    overall_readiness_cutoff: 65,
    package: '₹4.5 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_10',
    company: 'Accenture',
    role: 'Advanced ASE',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 65,
    reasoning_cutoff: 65,
    verbal_cutoff: 60,
    technical_cutoff: 70,
    coding_cutoff: 70,
    overall_readiness_cutoff: 68,
    package: '₹6.5 LPA',
    tier: 'dream'
  },
  {
    id: 'cec_11',
    company: 'Wipro',
    role: 'Project Engineer',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 60,
    coding_cutoff: 55,
    overall_readiness_cutoff: 60,
    package: '₹3.5 - ₹4.0 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_12',
    company: 'Wipro',
    role: 'Turbo',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 65,
    reasoning_cutoff: 65,
    verbal_cutoff: 60,
    technical_cutoff: 70,
    coding_cutoff: 70,
    overall_readiness_cutoff: 68,
    package: '₹6.5 LPA',
    tier: 'dream'
  },
  {
    id: 'cec_13',
    company: 'Cognizant',
    role: 'GenC',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 60,
    coding_cutoff: 60,
    overall_readiness_cutoff: 60,
    package: '₹4.0 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_14',
    company: 'Cognizant',
    role: 'GenC Pro',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 65,
    reasoning_cutoff: 65,
    verbal_cutoff: 60,
    technical_cutoff: 70,
    coding_cutoff: 70,
    overall_readiness_cutoff: 68,
    package: '₹6.75 LPA',
    tier: 'dream'
  },
  {
    id: 'cec_15',
    company: 'Cognizant',
    role: 'GenC Next',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 70,
    reasoning_cutoff: 70,
    verbal_cutoff: 65,
    technical_cutoff: 75,
    coding_cutoff: 75,
    overall_readiness_cutoff: 72,
    package: '₹9.0 LPA',
    tier: 'super_dream'
  },
  {
    id: 'cec_16',
    company: 'HCLTech',
    role: 'Graduate Engineer',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 65,
    coding_cutoff: 60,
    overall_readiness_cutoff: 62,
    package: '₹4.25 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_17',
    company: 'Tech Mahindra',
    role: 'Entry Level',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 60,
    coding_cutoff: 55,
    overall_readiness_cutoff: 60,
    package: '₹3.6 - ₹4.5 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_18',
    company: 'LTIMindtree',
    role: 'Entry Level',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 60,
    reasoning_cutoff: 60,
    verbal_cutoff: 60,
    technical_cutoff: 65,
    coding_cutoff: 60,
    overall_readiness_cutoff: 62,
    package: '₹4.0 - ₹5.0 LPA',
    tier: 'regular'
  },
  {
    id: 'cec_19',
    company: 'IBM',
    role: 'Associate Developer',
    tenth_percentage: 65.00,
    twelfth_diploma_percentage: 65.00,
    graduation_percentage: 65.00,
    max_backlogs: 0,
    aptitude_cutoff: 65,
    reasoning_cutoff: 65,
    verbal_cutoff: 65,
    technical_cutoff: 70,
    coding_cutoff: 65,
    overall_readiness_cutoff: 68,
    package: '₹7.5 - ₹11.0 LPA',
    tier: 'dream'
  },
  {
    id: 'cec_20',
    company: 'Deloitte',
    role: 'Analyst',
    tenth_percentage: 60.00,
    twelfth_diploma_percentage: 60.00,
    graduation_percentage: 60.00,
    max_backlogs: 0,
    aptitude_cutoff: 65,
    reasoning_cutoff: 65,
    verbal_cutoff: 65,
    technical_cutoff: 65,
    coding_cutoff: 60,
    overall_readiness_cutoff: 65,
    package: '₹7.6 LPA',
    tier: 'dream'
  }
];

export const mockCompanies = standardCompanyEligibilityCriteria.map(c => ({
  id: c.id,
  name: c.company,
  role: c.role,
  cutoffScore: c.overall_readiness_cutoff,
  categories: {
    aptitude: c.aptitude_cutoff,
    reasoning: c.reasoning_cutoff,
    technical: c.technical_cutoff,
    verbal: c.verbal_cutoff,
    english: c.verbal_cutoff
  },
  academics: {
    tenth: c.tenth_percentage,
    twelfth: c.twelfth_diploma_percentage,
    graduation: c.graduation_percentage,
    maxBacklogs: c.max_backlogs
  },
  package: c.package,
  tier: c.tier
}));

export const mockPeerComparison = [
  { category: 'Aptitude', studentScore: 84, classAverage: 62, topperScore: 96, classMedian: 60 },
  { category: 'Reasoning', studentScore: 72, classAverage: 58, topperScore: 92, classMedian: 56 },
  { category: 'Technical', studentScore: 84, classAverage: 55, topperScore: 96, classMedian: 52 },
  { category: 'Verbal', studentScore: 72, classAverage: 60, topperScore: 88, classMedian: 58 },
];

/**
 * Deterministically computes candidate eligibility by matching candidate_profiles data
 * (10th, 12th/diploma, current graduation percentage, backlogs) + assessment cutoffs
 * against authoritative company_eligibility_criteria rows.
 */
export function computeEligibility(student, criteriaList = standardCompanyEligibilityCriteria) {
  const list = (Array.isArray(criteriaList) && criteriaList.length > 0)
    ? criteriaList
    : standardCompanyEligibilityCriteria;

  // Extract candidate profile marks
  const candTenth = parseFloat(student?.tenthMarks ?? student?.tenth_marks ?? 0);
  const candTwelfth = parseFloat(student?.twelfthDiplomaMarks ?? student?.twelfth_diploma_marks ?? 0);
  const candGrad = parseFloat(student?.graduationPercentage ?? student?.graduation_percentage ?? 0);
  const candBacklogs = Number(student?.backlogs ?? 0);

  // Extract candidate section & overall exam scores
  const catPercents = getCategoryPercents(student?.examAttempts?.[student.examAttempts.length - 1]);
  const candApt = Number(student?.categoryScores?.aptitude ?? student?.aptitudeScore ?? catPercents.aptitude ?? 0);
  const candReason = Number(student?.categoryScores?.reasoning ?? student?.reasoningScore ?? catPercents.reasoning ?? 0);
  const candTech = Number(student?.categoryScores?.technical ?? student?.technicalScore ?? catPercents.technical ?? 0);
  const candVerb = Number(student?.categoryScores?.verbal ?? student?.verbalScore ?? catPercents.verbal ?? 0);
  const candCode = Number(student?.categoryScores?.coding ?? candTech);
  const candOverall = Number(student?.overallScore ?? student?.jobReadinessScore ?? 0);

  return list.map((item) => {
    const compName = item.company || item.name || 'Company';
    const roleName = item.role || 'Software Engineer';
    const tier = item.tier || (Number(item.overall_readiness_cutoff || item.cutoffScore || 60) >= 75 ? 'super_dream' : Number(item.overall_readiness_cutoff || item.cutoffScore || 60) >= 65 ? 'dream' : 'regular');
    const pkg = item.package || '₹4.5 - ₹6.5 LPA';

    // Criteria thresholds
    const reqTenth = parseFloat(item.tenth_percentage ?? item.academics?.tenth ?? 60);
    const reqTwelfth = parseFloat(item.twelfth_diploma_percentage ?? item.academics?.twelfth ?? 60);
    const reqGrad = parseFloat(item.graduation_percentage ?? item.academics?.graduation ?? 60);
    const maxBacklogs = Number(item.max_backlogs ?? item.academics?.maxBacklogs ?? 0);

    const reqApt = Number(item.aptitude_cutoff ?? item.categories?.aptitude ?? 60);
    const reqReason = Number(item.reasoning_cutoff ?? item.categories?.reasoning ?? 60);
    const reqVerb = Number(item.verbal_cutoff ?? item.categories?.verbal ?? item.categories?.english ?? 60);
    const reqTech = Number(item.technical_cutoff ?? item.categories?.technical ?? 60);
    const reqCode = Number(item.coding_cutoff ?? item.technical_cutoff ?? 50);
    const reqOverall = Number(item.overall_readiness_cutoff ?? item.cutoffScore ?? 60);

    // 1. Academic Eligibility Check
    const tenthPassed = candTenth >= reqTenth;
    const twelfthPassed = candTwelfth >= reqTwelfth;
    const gradPassed = candGrad >= reqGrad;
    const backlogsPassed = candBacklogs <= maxBacklogs;
    const academicsPassed = tenthPassed && twelfthPassed && gradPassed && backlogsPassed;

    // 2. Section Cutoff Checks
    const aptPassed = candApt >= reqApt;
    const reasonPassed = candReason >= reqReason;
    const verbPassed = candVerb >= reqVerb;
    const techPassed = candTech >= reqTech;
    const codePassed = candCode >= reqCode;
    const overallPassed = candOverall >= reqOverall;

    // 3. Compile Gaps
    const gaps = [];

    if (!tenthPassed && candTenth > 0) {
      gaps.push({ category: '10th Standard', required: reqTenth, current: candTenth, deficit: +(reqTenth - candTenth).toFixed(1), isAcademic: true });
    } else if (candTenth === 0) {
      gaps.push({ category: '10th Standard', required: reqTenth, current: 0, deficit: reqTenth, isAcademic: true, note: 'Marks Pending' });
    }

    if (!twelfthPassed && candTwelfth > 0) {
      gaps.push({ category: '12th / Diploma', required: reqTwelfth, current: candTwelfth, deficit: +(reqTwelfth - candTwelfth).toFixed(1), isAcademic: true });
    } else if (candTwelfth === 0) {
      gaps.push({ category: '12th / Diploma', required: reqTwelfth, current: 0, deficit: reqTwelfth, isAcademic: true, note: 'Marks Pending' });
    }

    if (!gradPassed && candGrad > 0) {
      gaps.push({ category: 'Graduation', required: reqGrad, current: candGrad, deficit: +(reqGrad - candGrad).toFixed(1), isAcademic: true });
    } else if (candGrad === 0) {
      gaps.push({ category: 'Graduation', required: reqGrad, current: 0, deficit: reqGrad, isAcademic: true, note: 'Marks Pending' });
    }

    if (!backlogsPassed) {
      gaps.push({ category: 'Backlogs', required: maxBacklogs, current: candBacklogs, deficit: candBacklogs - maxBacklogs, isAcademic: true });
    }

    if (!aptPassed) {
      gaps.push({ category: 'Aptitude', required: reqApt, current: candApt, deficit: reqApt - candApt, isAcademic: false });
    }
    if (!reasonPassed) {
      gaps.push({ category: 'Reasoning', required: reqReason, current: candReason, deficit: reqReason - candReason, isAcademic: false });
    }
    if (!verbPassed) {
      gaps.push({ category: 'Verbal', required: reqVerb, current: candVerb, deficit: reqVerb - candVerb, isAcademic: false });
    }
    if (!techPassed) {
      gaps.push({ category: 'Technical', required: reqTech, current: candTech, deficit: reqTech - candTech, isAcademic: false });
    }
    if (!codePassed && candCode < reqCode) {
      gaps.push({ category: 'Coding', required: reqCode, current: candCode, deficit: reqCode - candCode, isAcademic: false });
    }
    if (!overallPassed) {
      gaps.push({ category: 'Overall Readiness', required: reqOverall, current: candOverall, deficit: reqOverall - candOverall, isAcademic: false });
    }

    // 4. Accurate Match Percentage Calculation
    const calcRatio = (curr, req) => Math.min(1.2, Math.max(0, (curr || 0) / (req || 1)));

    const acadRatios = [
      calcRatio(candTenth, reqTenth),
      calcRatio(candTwelfth, reqTwelfth),
      calcRatio(candGrad, reqGrad),
    ];
    const avgAcadRatio = acadRatios.reduce((s, r) => s + r, 0) / acadRatios.length;

    const examRatios = [
      calcRatio(candApt, reqApt),
      calcRatio(candReason, reqReason),
      calcRatio(candVerb, reqVerb),
      calcRatio(candTech, reqTech),
      calcRatio(candOverall, reqOverall),
    ];
    const avgExamRatio = examRatios.reduce((s, r) => s + r, 0) / examRatios.length;

    // 30% Academics fulfillment + 70% Assessment readiness fulfillment
    let matchPercent = Math.min(100, Math.max(5, Math.round((avgAcadRatio * 30) + (avgExamRatio * 70))));

    // 5. Eligibility Classification
    const examGaps = gaps.filter(g => !g.isAcademic);
    const academicGaps = gaps.filter(g => g.isAcademic);

    const isFullyEligible = academicsPassed && gaps.length === 0;
    const isBorderline = academicsPassed && !isFullyEligible && (
      (candOverall >= reqOverall - 5 && examGaps.length <= 2 && examGaps.every(g => g.deficit <= 10)) ||
      (examGaps.length === 1 && examGaps[0].deficit <= 8)
    );

    if (isFullyEligible) {
      matchPercent = Math.max(matchPercent, 95);
    }

    return {
      company: {
        id: item.id,
        name: compName,
        role: roleName,
        tier,
        package: pkg,
        cutoffScore: reqOverall,
        academics: {
          tenth: reqTenth,
          twelfth: reqTwelfth,
          graduation: reqGrad,
          maxBacklogs
        },
        cutoffs: {
          aptitude: reqApt,
          reasoning: reqReason,
          verbal: reqVerb,
          technical: reqTech,
          coding: reqCode,
          overall: reqOverall
        }
      },
      matchPercent,
      eligible: isFullyEligible,
      borderline: isBorderline,
      gaps,
      academicStatus: {
        tenthPassed,
        twelfthPassed,
        gradPassed,
        backlogsPassed,
        allPassed: academicsPassed
      },
      assessmentStatus: {
        aptPassed,
        reasonPassed,
        verbPassed,
        techPassed,
        codePassed,
        overallPassed,
        allPassed: examGaps.length === 0
      },
      candidateValues: {
        tenth: candTenth,
        twelfth: candTwelfth,
        graduation: candGrad,
        backlogs: candBacklogs,
        aptitude: candApt,
        reasoning: candReason,
        verbal: candVerb,
        technical: candTech,
        coding: candCode,
        overall: candOverall
      }
    };
  });
}

export function computeImprovements(student) {
  const latestAttempt = student.examAttempts[student.examAttempts.length - 1];
  if (!latestAttempt) return [];

  const areas = [];
  const categoryKeys = ['aptitude', 'reasoning', 'technical', 'verbal', 'english'];

  categoryKeys.forEach((key) => {
    const cat = latestAttempt.categories?.[key];
    if (!cat || !Array.isArray(cat.topics)) return;
    cat.topics.forEach((topic) => {
      const maxScore = Number(topic.maxScore) > 0 ? Number(topic.maxScore) : 1;
      const percent = (Number(topic.score || 0) / maxScore) * 100;
      let priority = 'low';
      let estimatedHours = 2;

      if (percent < 50) {
        priority = 'high';
        estimatedHours = 8;
      } else if (percent < 70) {
        priority = 'medium';
        estimatedHours = 4;
      }

      areas.push({
        category: key.charAt(0).toUpperCase() + key.slice(1),
        topic: topic.name,
        currentScore: topic.score,
        maxScore: topic.maxScore,
        priority,
        estimatedHours,
      });
    });
  });

  return areas.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export function getCategoryPercents(attempt) {
  if (!attempt || !attempt.categories) {
    return { aptitude: 84, reasoning: 72, technical: 84, english: 72, verbal: 72, coding: 80 };
  }
  const engCat = attempt.categories.verbal || attempt.categories.english || { score: 0, maxScore: 25 };
  const engPct = engCat.maxScore > 0 ? Math.round((engCat.score / engCat.maxScore) * 100) : 0;
  const codingCat = attempt.categories.coding || { score: 0, maxScore: 25 };
  const codingPct = codingCat.maxScore > 0 ? Math.round((codingCat.score / codingCat.maxScore) * 100) : (attempt.categories.coding?.score ?? 0);

  return {
    aptitude: attempt.categories.aptitude?.maxScore > 0 ? Math.round((attempt.categories.aptitude.score / attempt.categories.aptitude.maxScore) * 100) : 0,
    reasoning: attempt.categories.reasoning?.maxScore > 0 ? Math.round((attempt.categories.reasoning.score / attempt.categories.reasoning.maxScore) * 100) : 0,
    technical: attempt.categories.technical?.maxScore > 0 ? Math.round((attempt.categories.technical.score / attempt.categories.technical.maxScore) * 100) : 0,
    english: engPct,
    verbal: engPct,
    coding: codingPct,
  };
}
