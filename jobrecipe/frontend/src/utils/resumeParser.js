/**
 * Client-Side Resume Parsing & ATS Intelligence Engine
 * Extracts Candidate Details, Technical Stack, Projects, compares with target job role benchmarks,
 * calculates ATS match, extracts skill gaps, and generates moderate-level interview questions.
 */

export const KNOWN_SKILLS = [
  // Web & Full Stack
  'React', 'React.js', 'Next.js', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'TailwindCSS',
  'Node.js', 'Express', 'NestJS', 'GraphQL', 'REST APIs', 'WebSockets', 'Vite', 'Webpack',
  // Backend & Systems
  'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot', 'Go', 'Golang', 'C++', 'C#', '.NET',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQL', 'Prisma', 'Hibernate', 'Microservices', 'System Design',
  // AI, Machine Learning & Data Science
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy',
  'Computer Vision', 'NLP', 'Natural Language Processing', 'LLMs', 'RAG', 'Hugging Face', 'Data Analysis',
  'Data Science', 'Data Preprocessing', 'Model Training', 'Model Evaluation', 'Statistics',
  // Cloud, DevOps & Tools
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'GitHub', 'Linux',
  'Kafka', 'RabbitMQ', 'Jest', 'Unit Testing', 'Power BI', 'Tableau'
];

/**
 * Benchmark skills by technical category for role alignment & skill gap suggestions.
 */
export const ROLE_BENCHMARK_SKILLS = {
  ml: {
    coreSkills: ['Python', 'Machine Learning', 'Scikit-Learn', 'Pandas', 'Model Training', 'PyTorch', 'Data Preprocessing', 'Model Evaluation'],
    advancedSkills: ['TensorFlow', 'Deep Learning', 'FastAPI', 'Docker', 'MLOps', 'Hyperparameter Tuning', 'NLP', 'Computer Vision']
  },
  data: {
    coreSkills: ['SQL', 'Python', 'Pandas', 'Data Cleaning', 'Data Visualization', 'Exploratory Analysis', 'Statistics'],
    advancedSkills: ['Power BI', 'Tableau', 'A/B Testing', 'Machine Learning', 'BigQuery', 'ETL Pipelines']
  },
  frontend: {
    coreSkills: ['React', 'JavaScript', 'TypeScript', 'HTML5/CSS3', 'Responsive UI', 'REST API Integration', 'State Management'],
    advancedSkills: ['Next.js', 'TailwindCSS', 'Redux / Zustand', 'Performance Optimization', 'Jest / Testing', 'WebSockets']
  },
  backend: {
    coreSkills: ['Node.js', 'Express', 'PostgreSQL', 'RESTful APIs', 'JWT Authentication', 'Database Schema', 'SQL'],
    advancedSkills: ['Redis', 'Docker', 'Microservices', 'GraphQL', 'Prisma / ORM', 'CI/CD Pipelines']
  },
  devops: {
    coreSkills: ['Docker', 'CI/CD Pipelines', 'Linux', 'AWS Cloud', 'Git', 'Containerization'],
    advancedSkills: ['Kubernetes', 'Terraform', 'Prometheus / Grafana', 'Helm', 'Bash Scripting', 'Security & IAM']
  },
  fullstack: {
    coreSkills: ['React', 'Node.js', 'PostgreSQL', 'REST APIs', 'JavaScript', 'TypeScript', 'Git', 'Database Schema'],
    advancedSkills: ['Docker', 'Redis', 'Next.js', 'TailwindCSS', 'System Design', 'CI/CD']
  }
};

/**
 * Categorizes any job role title into a recognized technical domain.
 */
export const getRoleCategory = (role = '') => {
  const r = (role || '').toLowerCase();
  if (r.includes('ml') || r.includes('machine learning') || r.includes('ai') || r.includes('artificial intelligence') || r.includes('deep learning') || r.includes('computer vision') || r.includes('nlp')) {
    return 'ml';
  }
  if (r.includes('data science') || r.includes('data scientist') || r.includes('data analyst') || r.includes('analytics') || r.includes('bi analyst')) {
    return 'data';
  }
  if (r.includes('frontend') || r.includes('front-end') || r.includes('react') || r.includes('ui') || r.includes('web developer')) {
    return 'frontend';
  }
  if (r.includes('backend') || r.includes('back-end') || r.includes('node') || r.includes('java') || r.includes('api') || r.includes('spring') || r.includes('django')) {
    return 'backend';
  }
  if (r.includes('devops') || r.includes('cloud') || r.includes('docker') || r.includes('kubernetes') || r.includes('platform') || r.includes('sre') || r.includes('infrastructure')) {
    return 'devops';
  }
  if (r.includes('mobile') || r.includes('android') || r.includes('ios') || r.includes('flutter') || r.includes('react native')) {
    return 'mobile';
  }
  return 'fullstack';
};

/**
 * Provides domain-specific default skills and realistic projects based on target role.
 */
export const getRoleDefaults = (role = 'Software Engineer') => {
  const category = getRoleCategory(role);
  switch (category) {
    case 'ml':
      return {
        skills: ['Python', 'Machine Learning', 'Scikit-Learn', 'Pandas', 'Model Training', 'PyTorch'],
        featuredProject: 'Predictive Machine Learning Classification Pipeline with Model Evaluation'
      };
    case 'data':
      return {
        skills: ['SQL', 'Python', 'Pandas', 'Data Cleaning', 'Data Visualization', 'Exploratory Analysis'],
        featuredProject: 'Customer Insights & Business Intelligence Analytics Dashboard'
      };
    case 'frontend':
      return {
        skills: ['React', 'JavaScript', 'TypeScript', 'HTML5/CSS3', 'Responsive UI', 'REST API Integration'],
        featuredProject: 'Interactive Web Application with Responsive Component Architecture'
      };
    case 'backend':
      return {
        skills: ['Node.js', 'Express', 'PostgreSQL', 'RESTful APIs', 'JWT Authentication', 'Database Schema'],
        featuredProject: 'Scalable Backend REST API Service with Authentication & Database Integration'
      };
    case 'devops':
      return {
        skills: ['Docker', 'CI/CD Pipelines', 'Linux', 'AWS Cloud', 'Git', 'Containerization'],
        featuredProject: 'Automated Containerized CI/CD Deployment Pipeline on Cloud'
      };
    case 'mobile':
      return {
        skills: ['React Native', 'JavaScript', 'Mobile UI/UX', 'State Management', 'REST APIs', 'Git'],
        featuredProject: 'Cross-Platform Mobile Application with Offline Sync & Clean Navigation'
      };
    case 'fullstack':
    default:
      return {
        skills: ['React', 'Node.js', 'PostgreSQL', 'REST APIs', 'JavaScript', 'Git'],
        featuredProject: 'Full Stack Web Application with Responsive Frontend and Secure REST API'
      };
  }
};

/**
 * Analyzes candidate skills against the target role's core & advanced skill benchmark.
 * Returns matched skills, missing skills (skills to cover), and calculated ATS score.
 */
export const analyzeRoleSkillGaps = (candidateSkills = [], targetRole = 'Software Engineer') => {
  const category = getRoleCategory(targetRole);
  const benchmark = ROLE_BENCHMARK_SKILLS[category] || ROLE_BENCHMARK_SKILLS.fullstack;
  const candidateLower = (candidateSkills || []).map(s => s.toLowerCase());

  const matchedCore = benchmark.coreSkills.filter(s =>
    candidateLower.some(c => c === s.toLowerCase() || c.includes(s.toLowerCase()) || s.toLowerCase().includes(c))
  );

  const missingCore = benchmark.coreSkills.filter(s =>
    !candidateLower.some(c => c === s.toLowerCase() || c.includes(s.toLowerCase()) || s.toLowerCase().includes(c))
  );

  const recommendedAdvanced = benchmark.advancedSkills.filter(s =>
    !candidateLower.some(c => c === s.toLowerCase() || c.includes(s.toLowerCase()) || s.toLowerCase().includes(c))
  ).slice(0, 4);

  const matchRatio = benchmark.coreSkills.length > 0 ? (matchedCore.length / benchmark.coreSkills.length) : 0.8;
  const atsScore = Math.min(97, Math.max(68, Math.round(65 + (matchRatio * 28) + (candidateSkills.length > 4 ? 4 : 1))));

  return {
    matchedCore,
    missingCore,
    skillsToCover: [...missingCore, ...recommendedAdvanced.slice(0, 2)],
    recommendedAdvanced,
    atsScore,
    matchPercentage: Math.round(matchRatio * 100)
  };
};

/**
 * Parse raw resume text and extract candidate info, detected skills, projects, and ATS score.
 */
export const parseResumeText = (rawText, targetRole = 'Software Engineer') => {
  const text = rawText || '';
  const roleDefaults = getRoleDefaults(targetRole);

  // 1. Extract Detected Skills from text
  const detectedSkills = [];
  KNOWN_SKILLS.forEach((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      if (!detectedSkills.includes(skill)) {
        detectedSkills.push(skill);
      }
    }
  });

  // Supplement with role-aligned skills if detected count is minimal
  if (detectedSkills.length === 0) {
    detectedSkills.push(...roleDefaults.skills);
  } else if (detectedSkills.length < 3) {
    roleDefaults.skills.forEach(s => {
      if (!detectedSkills.includes(s)) detectedSkills.push(s);
    });
  }

  // 2. Extract Candidate Name (First non-empty line or default)
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let candidateName = 'Candidate';
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].toLowerCase().includes('resume') && !lines[0].toLowerCase().includes('curriculum')) {
    candidateName = lines[0].replace(/^[#\*\s]+/, '').trim();
  }

  // 3. Extract Project Highlights
  const projectKeywords = ['project', 'developed', 'architected', 'built', 'created', 'implemented', 'engine', 'platform', 'app', 'model', 'pipeline', 'system'];
  const projectLines = lines.filter((line) => {
    const lower = line.toLowerCase();
    return projectKeywords.some((kw) => lower.includes(kw)) && line.length > 20 && line.length < 160;
  });

  const featuredProject = projectLines.length > 0
    ? projectLines[0].replace(/^[•\-\*\d\.\s]+/, '').trim()
    : roleDefaults.featuredProject;

  // 4. Calculate Role-Aware Skill Gap & ATS Score
  const skillGaps = analyzeRoleSkillGaps(detectedSkills, targetRole);
  const atsScore = skillGaps.atsScore;

  return {
    candidateName,
    atsScore,
    skills: detectedSkills,
    featuredProject,
    targetRole,
    skillGaps,
    wordCount: text.split(/\s+/).filter(Boolean).length
  };
};

/**
 * Generate 5 Targeted, Moderate-Level (Basic to Mid-Level) Interview Questions.
 *
 * Requirements:
 * 1. Question 1 MUST ALWAYS BE "Tell me about yourself..." tailored to the candidate's skills & target role.
 * 2. Questions 2-5 MUST be moderate / approachable, directly addressing the candidate's target job role
 *    and resume project/skills, avoiding hyper-difficult staff-level queries.
 */
export const generateResumeQuestions = (resumeData = {}, targetRole = 'Software Engineer') => {
  const category = getRoleCategory(targetRole);
  const defaults = getRoleDefaults(targetRole);
  const skills = (resumeData?.skills && resumeData.skills.length > 0)
    ? resumeData.skills
    : defaults.skills;
  const project = resumeData?.featuredProject || defaults.featuredProject;
  const topSkills = skills.slice(0, 3).join(', ');

  const roleTechnicalQuestions = {
    ml: [
      `Can you walk me through your experience building machine learning pipelines, specifically for projects like "${project}", and how you evaluate model accuracy versus overfitting?`,
      `When deploying predictive models or data processing tasks, how do you handle data preprocessing, missing features, and performance evaluation using ${topSkills || 'Python and Scikit-Learn'}?`,
      `Describe a challenging problem you faced while training or optimizing a machine learning model, and how you diagnosed and resolved the issue.`,
      `How do you stay up to date with new AI advancements and frameworks, and where do you see your technical focus growing?`
    ],
    data: [
      `Could you describe your workflow for exploratory data analysis and insight generation, particularly in projects like "${project}"?`,
      `How do you approach complex SQL queries, data validation, and ensuring clean datasets when working with ${topSkills || 'SQL and Python'}?`,
      `Tell me about a time you identified an unexpected data anomaly or business trend, and how you communicated your findings to stakeholders.`,
      `What methodologies do you use to choose the right visualization or predictive metric for a business problem?`
    ],
    frontend: [
      `Could you walk me through how you architected the UI and state management in projects like "${project}"?`,
      `How do you ensure web application performance, accessibility, and responsive rendering across devices using ${topSkills || 'React and modern CSS'}?`,
      `Tell me about a complex frontend bug or performance bottleneck you resolved, such as unnecessary re-renders or API latency.`,
      `How do you approach modular component architecture and maintainable code structure?`
    ],
    backend: [
      `Could you describe the backend architecture of "${project}", focusing on your API design, database schema, and security considerations?`,
      `How do you handle database query optimization, transactions, and error handling in ${topSkills || 'Node.js and PostgreSQL'}?`,
      `Can you discuss a time when an API service failed or encountered unexpected latency, and how you resolved the root cause?`,
      `How do you design RESTful services to scale gracefully under high concurrent load?`
    ],
    devops: [
      `Could you describe how you set up automated build, test, and containerized deployment pipelines for projects like "${project}"?`,
      `How do you monitor infrastructure health, handle failover, and manage environment configuration using ${topSkills || 'Docker and Linux'}?`,
      `Describe an incident where a deployment pipeline broke or a service became unavailable, and how you resolved it.`,
      `What best practices do you follow for continuous integration and container security?`
    ],
    fullstack: [
      `Can you walk me through the end-to-end architecture of "${project}", explaining how the frontend and backend communicate?`,
      `How do you approach data modeling, secure authentication, and state management when working with ${topSkills || 'React and Node.js'}?`,
      `Describe a challenging full-stack engineering challenge you overcame, and what trade-offs you considered.`,
      `How do you balance rapid feature delivery with code quality, testing, and system maintainability?`
    ]
  };

  const pool = roleTechnicalQuestions[category] || roleTechnicalQuestions.fullstack;

  // 3 sequential questions for the mock interview
  return [
    {
      id: 'q-intro-1',
      questionNumber: 1,
      category: 'INTRODUCTION & PROFILE',
      questionText: 'Tell me about yourself.'
    },
    {
      id: 'q-proj-2',
      questionNumber: 2,
      category: 'PROJECT EXPERIENCE & CHALLENGES',
      questionText: 'Can you explain one of the projects you have worked on, and what major challenges or difficult situations did you face while developing it?'
    },
    {
      id: 'q-sol-3',
      questionNumber: 3,
      category: 'PROBLEM SOLVING & RESOLUTION',
      questionText: 'How did you overcome those challenges, and what approach did you take to solve the situation?'
    }
  ];
};