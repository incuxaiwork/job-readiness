import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  INITIAL_CANDIDATE,
  INITIAL_ASSESSMENTS,
  INITIAL_QUESTION_BANK,
  INITIAL_CANDIDATES_LIST,
  INITIAL_ADMIN_KPIS,
  INITIAL_RECOMMENDATIONS
} from '../data/mockData';
import { isCodingQuestion } from '../utils/questionUtils';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // react-router navigate ref — injected by RouterBridge in App.jsx
  const routerNavigateRef = React.useRef(null);
  const setRouterNavigate = (fn) => { routerNavigateRef.current = fn; };
  // Authentication & Role: 'candidate' | 'admin' | 'guest'
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rsj_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rsj_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    try {
      const savedRole = localStorage.getItem('rsj_role');
      const user = localStorage.getItem('rsj_user');
      const admin = localStorage.getItem('rsj_admin_user');
      if (admin) return 'admin';
      if (user) return 'candidate';
      return savedRole || 'guest';
    } catch (e) {
      return 'guest';
    }
  });

  // Persist & restore view state across page reloads based on authentication role & URL paths (/login, /admin, /)
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('rsj_current_view');
    const user = localStorage.getItem('rsj_user');
    const admin = localStorage.getItem('rsj_admin_user');
    const savedRole = localStorage.getItem('rsj_role');
    const activeRole = admin ? 'admin' : (user ? 'candidate' : (savedRole || 'guest'));
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const viewParam = searchParams ? searchParams.get('view') : null;

    if (viewParam === 'ai-mock-interview' || viewParam === 'interview' || path === '/interview' || path === '/ai-mock-interview') {
      return 'ai-mock-interview';
    }

    // Root URL or Landing Path always loads JobReadinessHero landing page
    if (path === '/' || path === '/hero' || path === '/landing') {
      if (savedView === 'ai-mock-interview') return 'ai-mock-interview';
      return 'hero';
    }
    if (activeRole === 'admin') {
      if (savedView && savedView.startsWith('admin-')) {
        return savedView;
      }
      return 'admin-candidates';
    }

    // 2. Authenticated Candidate Session
    if (activeRole === 'candidate') {
      if (savedView === 'results') return 'candidate-analytics';
      if (savedView && ['assessments', 'take-assessment', 'candidate-analytics', 'dashboard', 'ai-mock-interview'].includes(savedView)) {
        return savedView;
      }
      return 'dashboard';
    }

    // 3. Guest / Unauthenticated Session
    if (path === '/login') return 'login';
    if (path === '/admin' || path === '/admin-login') return 'admin';
    if (path === '/signup') return 'signup';
    if (savedView && ['login', 'admin', 'signup', 'hero', 'ai-mock-interview'].includes(savedView)) {
      return savedView;
    }
    return 'hero';
  });

  // Sync browser back/forward buttons with URL paths
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '/hero' || path === '/landing') setCurrentView('hero');
      else if (path === '/interview' || path === '/ai-mock-interview') setCurrentView('ai-mock-interview');
      else if (path === '/login') setCurrentView('login');
      else if (path === '/admin' || path === '/admin-login') setCurrentView('admin');
      else if (path === '/signup') setCurrentView('signup');
      else if (path === '/dashboard') setCurrentView('dashboard');
      else if (path === '/assessments') setCurrentView('assessments');
      else if (path === '/candidate-analytics' || path === '/results') setCurrentView('candidate-analytics');
      else if (path === '/admin/interviews') setCurrentView('admin-interviews');
    else if (path.startsWith('/admin-')) setCurrentView(path.substring(1));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // State entities - Purge legacy mock assessment IDs from cached localStorage
  const DUMMY_ASM_IDS = [
    'asm-all-2026',
    'asm-res-1', 'asm-full-1', 'asm-001', 'asm-002', 'asm-003', 'asm-004'
  ];

  const [assessments, setAssessments] = useState(() => {
    const saved = localStorage.getItem('rsj_assessments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const seen = new Set();
        const filtered = (Array.isArray(parsed) ? parsed : [])
          .filter(a => {
            if (!a?.id || DUMMY_ASM_IDS.includes(a.id) || a.id.startsWith('asm-demo-')) return false;
            const key = (a.title || a.id).trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map(a => ({
            ...a,
            totalQuestions: Number(a.totalQuestions ?? a.total_questions) || (a.category === 'Coding' ? 4 : 10),
            total_questions: Number(a.totalQuestions ?? a.total_questions) || (a.category === 'Coding' ? 4 : 10),
            durationMinutes: 10,
            duration_minutes: 10,
            topics: Array.isArray(a.topics) ? a.topics : []
          }));
        if (filtered.length >= 4) {
          localStorage.setItem('rsj_assessments', JSON.stringify(filtered));
          return filtered;
        }
      } catch (e) {
        localStorage.removeItem('rsj_assessments');
      }
    }
    localStorage.setItem('rsj_assessments', JSON.stringify(INITIAL_ASSESSMENTS));
    return INITIAL_ASSESSMENTS;
  });

  const DUMMY_Q_IDS = ['q-101', 'q-102', 'q-103', 'q-104', 'q-105', 'q-106', 'q-107', 'q-108', 'q-109', 'q-110'];

  const [questionBank, setQuestionBank] = useState(() => {
    const saved = localStorage.getItem('rsj_question_bank');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const filtered = (Array.isArray(parsed) ? parsed : []).filter(q => !DUMMY_Q_IDS.includes(q.id));
        if (filtered.length >= 30) {
          localStorage.setItem('rsj_question_bank', JSON.stringify(filtered));
          return filtered;
        }
      } catch (e) {
        localStorage.removeItem('rsj_question_bank');
      }
    }
    localStorage.setItem('rsj_question_bank', JSON.stringify(INITIAL_QUESTION_BANK));
    return INITIAL_QUESTION_BANK;
  });

  const DUMMY_CAND_IDS = ['cand-101', 'cand-102', 'cand-103', 'cand-104', 'cand-105', 'cand-001', 'cand-002'];

  const [candidatesList, setCandidatesList] = useState(() => {
    const saved = localStorage.getItem('rsj_candidates_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.data) ? parsed.data : []);
        const filtered = list.filter(c => !DUMMY_CAND_IDS.includes(c?.id));
        localStorage.setItem('rsj_candidates_list', JSON.stringify(filtered));
        return filtered;
      } catch (e) {
        localStorage.removeItem('rsj_candidates_list');
      }
    }
    return [];
  });

  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);

  // Active Assessment Session & Media Hardware
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(18 * 60 + 42);

  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  };
  const [latestResult, setLatestResult] = useState(() => {
    try {
      const saved = localStorage.getItem('rsj_latest_result');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      score: 78,
      totalMarks: 100,
      accuracy: 82,
      correctCount: 16,
      incorrectCount: 4,
      unansweredCount: 0,
      timeTaken: '28 min',
      completedAt: 'Aug 30, 2026',
      assessmentName: 'Technical Assessment',
      categoryScores: {
        aptitude: 82,
        reasoning: 74,
        technical: 78
      },
      topicBreakdown: [
        { topic: 'Arrays & Strings', score: 90, status: 'Mastered' },
        { topic: 'Object-Oriented Programming (OOP)', score: 80, status: 'Strong' },
        { topic: 'Binary Trees & Graph Traversals', score: 72, status: 'Average' },
        { topic: 'DBMS & Transaction Management', score: 65, status: 'Needs Review' },
        { topic: 'SQL Joins & Window Functions', score: 58, status: 'Weak' }
      ],
      strengths: ['Logical reasoning', 'Programming fundamentals', 'Problem solving'],
      weaknesses: ['SQL joins & window queries', 'Quantitative aptitude (Probability)', 'Data structures (Advanced)'],
      recommendedTopics: ['SQL Window Functions', 'Probability & Combinatorics', 'Graph Search Algorithms']
    };
  });

  // Global Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [candidateSubmissions, setCandidateSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('rsj_candidate_submissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const isAssessmentCompleted = (param) => {
    if (!param) return false;
    const isObj = typeof param === 'object' && param !== null;
    const targetId = (isObj ? String(param.id || '') : String(param)).trim().toLowerCase();
    const targetCat = isObj && param.category ? String(param.category).trim().toLowerCase() : '';
    const targetTitle = (isObj && param.title ? String(param.title) : String(param)).trim().toLowerCase();

    // 1. Direct status check on object
    if (isObj && (param.status === 'Completed' || (typeof param.progress === 'number' && param.progress >= 100))) {
      return true;
    }

    // 2. Check assessments array state
    const foundInAsms = assessments?.find(a => 
      (targetId && String(a.id || '').trim().toLowerCase() === targetId) ||
      (targetTitle && String(a.title || '').trim().toLowerCase() === targetTitle)
    );
    if (foundInAsms && (foundInAsms.status === 'Completed' || (typeof foundInAsms.progress === 'number' && foundInAsms.progress >= 100))) {
      return true;
    }

    // 3. Check candidateSubmissions
    return (candidateSubmissions || []).some(
      s => {
        const subAsmId = String(s.assessment_id || s.assessmentId || '').trim().toLowerCase();
        if (targetId && subAsmId === targetId) return true;
        const subTitle = String(s.assessment_title || s.assessmentName || '').trim().toLowerCase();
        if (targetTitle && subTitle && subTitle === targetTitle) return true;
        const subCat = String(s.category || '').trim().toLowerCase();
        if (targetCat && subCat && subCat === targetCat) return true;
        return false;
      }
    );
  };

  const areAllAssessmentsCompleted = () => {
    if (role === 'admin') return true;
    if (!assessments || assessments.length === 0) return false;
    return assessments.every(asm => isAssessmentCompleted(asm));
  };

  const isInterviewUnlocked = role === 'admin' || areAllAssessmentsCompleted();

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rsj_candidate_submissions', JSON.stringify(candidateSubmissions));
    } catch (e) {}
  }, [candidateSubmissions]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rsj_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('rsj_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('rsj_admin_user', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('rsj_admin_user');
    }
  }, [adminUser]);

  useEffect(() => {
    localStorage.setItem('rsj_role', role);
  }, [role]);

  useEffect(() => {
    if (currentView) {
      localStorage.setItem('rsj_current_view', currentView);
    }
  }, [currentView]);

  // Validate stored JWT session on startup
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('rsj_token');
      if (!token) return;
      try {
        const res = await api.auth.me();
        if (res.ok && res.data) {
          if (res.data.role === 'candidate' && res.data.candidate) {
            setCurrentUser(res.data.candidate);
            setRole('candidate');
            // Synchronize candidate submissions from DB
            try {
              const subRes = await api.submissions.my();
              const subList = Array.isArray(subRes?.data?.data)
                ? subRes.data.data
                : (Array.isArray(subRes?.data) ? subRes.data : []);
              if (subRes.ok && Array.isArray(subList)) {
                setCandidateSubmissions(subList);
                if (subList.length > 0) {
                  const latest = subList[0];
                  const mappedResult = {
                    score: Number(latest.score ?? 0),
                    totalMarks: Number(latest.total_marks ?? 100),
                    obtainedMarks: Number(latest.obtained_marks ?? latest.score ?? 0),
                    accuracy: Number(latest.accuracy ?? latest.score ?? 0),
                    correctCount: Number(latest.correct_count ?? 0),
                    incorrectCount: Number(latest.incorrect_count ?? 0),
                    unansweredCount: Number(latest.unanswered_count ?? 0),
                    timeTaken: latest.time_taken || '28 min',
                    completedAt: new Date(latest.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    assessmentName: latest.assessment_title || 'Technical Assessment',
                    assessmentId: latest.assessment_id,
                    categoryScores: typeof latest.category_scores === 'string' ? JSON.parse(latest.category_scores) : (latest.category_scores || {}),
                    topicBreakdown: typeof latest.topic_breakdown === 'string' ? JSON.parse(latest.topic_breakdown) : (latest.topic_breakdown || []),
                  };
                  setLatestResult(mappedResult);
                }
              }
            } catch (subErr) {
              console.warn('Could not sync latest candidate submission:', subErr.message);
            }
          } else if (res.data.role === 'admin' && res.data.user) {
            setAdminUser(res.data.user);
            setRole('admin');
          }
        } else {
          // Token is expired or invalid
          api.clearToken();
          setCurrentUser(null);
          setAdminUser(null);
          setRole('guest');
        }
      } catch (err) {
        console.warn('Session auto-validation failed:', err.message);
      }
    };
    validateSession();
  }, []);

  // Continuously ensure candidate submissions are synced with PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    const syncSubmissions = async () => {
      const token = localStorage.getItem('rsj_token');
      if (token && currentUser && role === 'candidate') {
        try {
          const subRes = await api.submissions.my();
          const subList = Array.isArray(subRes?.data?.data)
            ? subRes.data.data
            : (Array.isArray(subRes?.data) ? subRes.data : []);
          if (isMounted && subRes.ok && Array.isArray(subList)) {
            setCandidateSubmissions(subList);
          }
        } catch (e) {}
      }
    };
    syncSubmissions();
    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?.email, role]);

  useEffect(() => {
    localStorage.setItem('rsj_assessments', JSON.stringify(assessments));
  }, [assessments]);

  // Sync assessments from backend API on mount and authentication changes
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await api.assessments.getAll();
        const rawList = Array.isArray(res?.data?.data)
          ? res.data.data
          : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));

        if (rawList.length > 0) {
          const seen = new Set();
          const unique = [];
          for (const rawAsm of rawList) {
            if (!rawAsm?.id || DUMMY_ASM_IDS.includes(rawAsm.id) || rawAsm.id.startsWith('asm-demo-')) continue;
            const asm = {
              ...rawAsm,
              totalQuestions: Number(rawAsm.totalQuestions ?? rawAsm.total_questions) || (rawAsm.category === 'Coding' ? 4 : 10),
              total_questions: Number(rawAsm.totalQuestions ?? rawAsm.total_questions) || (rawAsm.category === 'Coding' ? 4 : 10),
              durationMinutes: 10,
              duration_minutes: 10,
              topics: Array.isArray(rawAsm.topics) ? rawAsm.topics : []
            };
            const key = (asm.title || asm.id).trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(asm);
            }
          }
          if (unique.length > 0) {
            setAssessments(unique);
            localStorage.setItem('rsj_assessments', JSON.stringify(unique));
            return;
          }
        }
      } catch (err) {
        console.warn('Backend assessments sync warning:', err.message);
      }
      setAssessments(prev => (prev && prev.length >= 4 ? prev : INITIAL_ASSESSMENTS));
    };
    fetchAssessments();
  }, [currentUser?.id, role]);

  useEffect(() => {
    localStorage.setItem('rsj_question_bank', JSON.stringify(questionBank));
  }, [questionBank]);

  useEffect(() => {
    localStorage.setItem('rsj_candidates_list', JSON.stringify(candidatesList));
  }, [candidatesList]);

  useEffect(() => {
    if (latestResult) {
      localStorage.setItem('rsj_latest_result', JSON.stringify(latestResult));
    }
  }, [latestResult]);

  // ==========================================
  // RBAC PERMISSION & VIEW GUARD ENGINE
  // ==========================================
  const ADMIN_ONLY_VIEWS = [
    'admin-candidates',
    'admin-questions',
    'admin-assessments',
    'admin-interviews',
    'admin-analytics'
  ];

  const CANDIDATE_PROTECTED_VIEWS = [
    'dashboard',
    'assessments',
    'take-assessment',
    'candidate-analytics',
    'ai-mock-interview'
  ];

  const PUBLIC_VIEWS = ['hero', 'landing', 'signup', 'login', 'admin', 'admin-login', '/', '/hero', '/signup', '/login', '/admin', '/admin-login'];

  // ── Guarded Navigation Helper (react-router-dom aware) ──────────────────
  const VIEW_TO_PATH = {
    'hero': '/',
    'landing': '/',
    '/': '/',
    '/hero': '/',
    'login': '/login',
    '/login': '/login',
    'signup': '/signup',
    '/signup': '/signup',
    'admin': '/admin',
    'admin-login': '/admin',
    '/admin': '/admin',
    '/admin-login': '/admin',
    'dashboard': '/dashboard',
    '/dashboard': '/dashboard',
    'assessments': '/assessments',
    '/assessments': '/assessments',
    'take-assessment': '/take-assessment',
    'ai-mock-interview': '/interview',
    '/ai-mock-interview': '/interview',
    'interview': '/interview',
    '/interview': '/interview',
    'results': '/results',
    '/results': '/results',
    'candidate-analytics': '/results',
    '/candidate-analytics': '/results',
    'admin-candidates': '/admin/candidates',
    'admin-questions': '/admin/questions',
    'admin-assessments': '/admin/assessments',
    'admin-interviews': '/admin/interviews',
    'admin-analytics': '/admin/analytics',
  };

  const navigateTo = (view, payload = null) => {
    const normalizedView = view?.replace(/^\//, '') || 'hero';
    const effectiveRole = role !== 'guest' ? role : (
      typeof window !== 'undefined'
        ? (localStorage.getItem('rsj_role') || (localStorage.getItem('rsj_admin_user') ? 'admin' : (localStorage.getItem('rsj_user') ? 'candidate' : 'guest')))
        : role
    );

    // 1. Guard Admin-Only Views
    if (ADMIN_ONLY_VIEWS.includes(normalizedView)) {
      if (effectiveRole !== 'admin') {
        addToast('Access Denied: Admin privileges required to access this portal.', 'error');
        const dest = effectiveRole === 'candidate' ? '/dashboard' : '/admin';
        if (routerNavigateRef.current) routerNavigateRef.current(dest);
        else try { window.history.pushState(null, '', dest); } catch (e) {}
        return;
      }
    }

    // 2. Guard Candidate-Protected Views
    if (CANDIDATE_PROTECTED_VIEWS.includes(normalizedView)) {
      if (effectiveRole !== 'candidate' && effectiveRole !== 'admin') {
        addToast('Please login or register to access student assessments.', 'info');
        if (routerNavigateRef.current) routerNavigateRef.current('/signup');
        else try { window.history.pushState(null, '', '/signup'); } catch (e) {}
        return;
      }
    }

    // 3. Assessment launch (still sets view state for AssessmentPage)
    if ((normalizedView === 'take-assessment') && payload) {
      startAssessment(payload);
      if (routerNavigateRef.current) routerNavigateRef.current('/take-assessment');
      else try { window.history.pushState(null, '', '/take-assessment'); } catch (e) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. Navigate via react-router or fallback to pushState
    const path = VIEW_TO_PATH[view] || VIEW_TO_PATH[normalizedView] || `/${normalizedView}`;
    setCurrentView(normalizedView);
    if (routerNavigateRef.current) {
      routerNavigateRef.current(path);
    } else {
      try {
        if (window.location.pathname !== path) window.history.pushState(null, '', path);
      } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Candidate Authentication Actions
  const registerCandidate = async (formData) => {
    try {
      const res = await api.auth.register({
        name: formData.fullName || formData.name,
        fullName: formData.fullName || formData.name,
        email: formData.email,
        mobile: formData.mobile || formData.phoneNo,
        phoneNo: formData.mobile || formData.phoneNo,
        college: formData.college || formData.collegeName,
        collegeName: formData.college || formData.collegeName,
        degree: formData.degree || 'B.Tech',
        branch: formData.branch,
        specialization: formData.specialization,
        country: formData.country || 'India',
        state: formData.state,
        city: formData.city,
        graduationYear: formData.graduationYear || 2026,
        graduation_year: formData.graduationYear || 2026,
        experienceLevel: formData.experienceLevel || 'Fresher',
        tenthSchool: formData.tenthSchool,
        tenth_school: formData.tenthSchool,
        tenthMarks: formData.tenthMarks,
        tenth_marks: formData.tenthMarks,
        twelfthCollege: formData.twelfthCollege,
        twelfth_college: formData.twelfthCollege,
        twelfthDiplomaMarks: formData.twelfthDiplomaMarks,
        twelfth_diploma_marks: formData.twelfthDiplomaMarks,
        cgpa: formData.cgpa,
        sgpa: formData.cgpa,
        graduationPercentage: formData.cgpa,
        graduation_percentage: formData.cgpa,
        backlogs: formData.backlogs || 0,
        password: formData.password
      });

      if (!res.ok) {
        addToast(res.error || 'Failed to register account in database.', 'error');
        return false;
      }

      if (res.data?.token) {
        api.saveToken(res.data.token);
      }

      const registeredCand = res.data?.candidate || {
        id: `cand-${Date.now()}`,
        name: formData.fullName || formData.name,
        email: formData.email,
        mobile: formData.mobile || formData.phoneNo,
        college: formData.college || formData.collegeName,
        degree: formData.degree || 'B.Tech',
        branch: formData.branch,
        specialization: formData.specialization,
        country: formData.country || 'India',
        state: formData.state,
        city: formData.city,
        graduationYear: formData.graduationYear || 2026,
        graduation_year: formData.graduationYear || 2026,
        experienceLevel: formData.experienceLevel || 'Fresher',
        tenthSchool: formData.tenthSchool,
        tenth_school: formData.tenthSchool,
        tenthMarks: formData.tenthMarks,
        tenth_marks: formData.tenthMarks,
        twelfthCollege: formData.twelfthCollege,
        twelfth_college: formData.twelfthCollege,
        twelfthDiplomaMarks: formData.twelfthDiplomaMarks,
        twelfth_diploma_marks: formData.twelfthDiplomaMarks,
        graduationPercentage: formData.cgpa,
        graduation_percentage: formData.cgpa,
        cgpa: formData.cgpa,
        sgpa: formData.cgpa,
        backlogs: formData.backlogs || 0,
      };

      setCandidatesList(prev => [registeredCand, ...prev.filter(c => c.id !== registeredCand.id)]);
      try {
        localStorage.setItem('rsj_registered_email', formData.email || '');
      } catch (e) {}
      addToast(`Account created successfully! Please sign in to enter your assessment exam.`, 'success');
      setCurrentView('login');
      navigateTo('login');
      return true;
    } catch (err) {
      console.error('Registration API error:', err);
      addToast(err.message || 'Registration failed', 'error');
      return false;
    }
  };

  const loginCandidate = async (email, password) => {
    try {
      const res = await api.auth.login({ email, password });
      if (!res.ok) {
        const errMsg = res.error || 'Invalid email or password.';
        addToast(errMsg, 'error');
        return { success: false, error: errMsg };
      }

      if (res.data?.token) {
        api.saveToken(res.data.token);
      }

      const cand = res.data?.candidate || { email, name: email.split('@')[0] };
      try {
        localStorage.setItem('rsj_user', JSON.stringify(cand));
        localStorage.setItem('rsj_role', 'candidate');
      } catch (e) {}

      setCurrentUser(cand);
      setRole('candidate');
      try {
        const subRes = await api.submissions.my();
        const subList = Array.isArray(subRes?.data?.data)
          ? subRes.data.data
          : (Array.isArray(subRes?.data) ? subRes.data : []);
        if (subRes.ok && Array.isArray(subList)) {
          setCandidateSubmissions(subList);
          if (subList.length > 0) {
            const latest = subList[0];
            const mappedResult = {
              score: Number(latest.score ?? 0),
              totalMarks: Number(latest.total_marks ?? 100),
              obtainedMarks: Number(latest.obtained_marks ?? latest.score ?? 0),
              accuracy: Number(latest.accuracy ?? latest.score ?? 0),
              correctCount: Number(latest.correct_count ?? 0),
              incorrectCount: Number(latest.incorrect_count ?? 0),
              unansweredCount: Number(latest.unanswered_count ?? 0),
              timeTaken: latest.time_taken || '28 min',
              completedAt: new Date(latest.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              assessmentName: latest.assessment_title || 'Technical Assessment',
              assessmentId: latest.assessment_id,
              categoryScores: typeof latest.category_scores === 'string' ? JSON.parse(latest.category_scores) : (latest.category_scores || {}),
              topicBreakdown: typeof latest.topic_breakdown === 'string' ? JSON.parse(latest.topic_breakdown) : (latest.topic_breakdown || []),
            };
            setLatestResult(mappedResult);
          }
        }
      } catch (e) {}
      addToast(`Welcome back, ${cand.name || 'Candidate'}! Directing to your exam assessments.`, 'success');
      setCurrentView('assessments');
      navigateTo('assessments');
      return { success: true };
    } catch (err) {
      console.error('Candidate login error:', err);
      const msg = err.message || 'Login failed.';
      addToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const logoutCandidate = () => {
    api.clearToken();
    setCurrentUser(null);
    setRole('guest');
    setCandidateSubmissions([]);
    try {
      localStorage.removeItem('rsj_candidate_submissions');
      localStorage.removeItem('rsj_current_view');
      localStorage.removeItem('rsj_user');
      localStorage.removeItem('rsj_role');
    } catch (e) {}
    navigateTo('login');
    addToast('Signed out of Student Portal', 'info');
  };

  // Admin Authentication Actions
  const loginAdmin = async (email, password) => {
    try {
      const res = await api.auth.adminLogin({ email, password });
      if (!res.ok) {
        const errMsg = res.error || 'Invalid admin credentials.';
        addToast(errMsg, 'error');
        return { success: false, error: errMsg };
      }

      if (res.data?.token) {
        api.saveToken(res.data.token);
      }

      const admin = res.data?.admin || { email, role: 'admin' };
      try {
        localStorage.setItem('rsj_admin_user', JSON.stringify(admin));
        localStorage.setItem('rsj_role', 'admin');
      } catch (e) {}

      setAdminUser(admin);
      setRole('admin');
      addToast(`Welcome, Admin! Access granted to Recruiter Console.`, 'success');
      setCurrentView('admin-candidates');
      navigateTo('admin-candidates');
      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      const msg = err.message || 'Admin login failed.';
      addToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const logoutAdmin = () => {
    api.clearToken();
    setAdminUser(null);
    setRole('guest');
    try {
      localStorage.removeItem('rsj_current_view');
    } catch (e) {}
    navigateTo('admin');
    addToast('Signed out of Recruiter Console', 'info');
  };

  const logout = () => {
    if (role === 'admin') {
      logoutAdmin();
    } else {
      logoutCandidate();
    }
  };

  // Start / Submit Assessment
  const startAssessment = async (assessmentId) => {
    const asm = assessments.find(a => a.id === assessmentId) || assessments[0];
    if (!asm) return;

    // Single Attempt Policy: Block retakes if candidate already completed this assessment
    if (role !== 'admin' && isAssessmentCompleted(asm)) {
      addToast('Single-Attempt Policy Active: You have already completed this assessment. Retakes are not allowed.', 'warning');
      navigateTo('candidate-analytics');
      return;
    }

    let finalUniqueQuestions = [];

    // 1. Fetch official questions from PostgreSQL backend API
    try {
      const qRes = await api.assessments.getQuestions(asm.id);
      if (!qRes.ok && (qRes.status === 403 || qRes.data?.alreadyCompleted)) {
        addToast(qRes.error || 'You have already completed this assessment. Retakes are not allowed.', 'warning');
        navigateTo('candidate-analytics');
        return;
      }
      const list = Array.isArray(qRes?.data?.data)
        ? qRes.data.data
        : (Array.isArray(qRes?.data) ? qRes.data : (Array.isArray(qRes) ? qRes : []));
      if (list.length > 0) {
        finalUniqueQuestions = list.map(q => {
          const qId = q.question_id || q.id;
          const bankMatch = questionBank.find(bq => bq.id === qId) ||
                            INITIAL_QUESTION_BANK.find(bq => bq.id === qId) ||
                            questionBank.find(bq => bq.question?.trim().toLowerCase() === q.question?.trim().toLowerCase()) ||
                            INITIAL_QUESTION_BANK.find(bq => bq.question?.trim().toLowerCase() === q.question?.trim().toLowerCase());

          const isCoding = q.type === 'Coding' || q.category === 'Coding' || bankMatch?.category === 'Coding';
          const defaultMarks = isCoding ? 10 : 4;
          const resolvedMarks = Number(q.marks) > 0 ? Number(q.marks) : (Number(bankMatch?.marks) > 0 ? Number(bankMatch.marks) : defaultMarks);
          const resolvedAnswer = q.correct_answer || q.correctAnswer || bankMatch?.correctAnswer || bankMatch?.correct_answer || '';

          return {
            ...q,
            id: qId,
            questionId: qId,
            question: q.question,
            type: q.type || (isCoding ? 'Coding' : 'Single Choice'),
            category: q.category || bankMatch?.category || asm.category,
            topic: q.topic || bankMatch?.topic || 'General',
            difficulty: q.difficulty || bankMatch?.difficulty || asm.difficulty || 'Medium',
            marks: resolvedMarks,
            correctAnswer: resolvedAnswer,
            correct_answer: resolvedAnswer,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || bankMatch?.options || []),
            test_cases: typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : (q.test_cases || bankMatch?.test_cases || []),
            starter_templates: typeof q.starter_templates === 'string' ? JSON.parse(q.starter_templates) : (q.starter_templates || bankMatch?.starter_templates || null),
            constraints: q.constraints || bankMatch?.constraints || null
          };
        });
      }
    } catch (err) {
      console.warn('[startAssessment] Could not load questions via API:', err.message);
    }

    // 2. Fallback to questionBank if API returned no questions
    if (finalUniqueQuestions.length === 0) {
      // Deduplicate question bank by ID and statement
      const uniquePoolMap = new Map();
      questionBank.forEach(q => {
        if (q && q.id && q.question) {
          const key = `${q.id}-${q.question.trim().toLowerCase()}`;
          if (!uniquePoolMap.has(key)) {
            uniquePoolMap.set(key, q);
          }
        }
      });
      const cleanQuestionBank = Array.from(uniquePoolMap.values());

      // Get questions matching assessment category
      const cat = (asm.category || 'Technical').trim();
      const isAllMix = ['All', 'Full Length', 'All Mix (Combined)', 'All Mix'].some(m => m.toLowerCase() === cat.toLowerCase());
      const isCodingCat = cat.toLowerCase() === 'coding';

      let availableQuestions = [];
      if (isCodingCat) {
        availableQuestions = cleanQuestionBank.filter(isCodingQuestion);
      } else if (isAllMix) {
        availableQuestions = cleanQuestionBank.filter(q => !isCodingQuestion(q));
      } else {
        availableQuestions = cleanQuestionBank.filter(q => q.category && q.category.trim().toLowerCase() === cat.toLowerCase() && !isCodingQuestion(q));
      }

      if (availableQuestions.length === 0) {
        availableQuestions = isCodingCat
          ? cleanQuestionBank.filter(isCodingQuestion)
          : cleanQuestionBank.filter(q => !isCodingQuestion(q));
      }

      let selectedQList = [];
      const qIds = asm.selected_question_ids || asm.selectedQuestionIds;
      if (Array.isArray(qIds) && qIds.length > 0) {
        const idSet = new Set(qIds);
        selectedQList = cleanQuestionBank.filter(q => idSet.has(q.id));
      }

      if (selectedQList.length === 0 && availableQuestions.length > 0) {
        const targetCount = Math.min(
          Number(asm.totalQuestions || asm.total_questions) || 5,
          availableQuestions.length
        );
        selectedQList = availableQuestions.slice(0, targetCount);
      }

      const seenIds = new Set();
      selectedQList.forEach(q => {
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          finalUniqueQuestions.push(q);
        }
      });

      if (finalUniqueQuestions.length === 0 && cleanQuestionBank.length > 0) {
        cleanQuestionBank.slice(0, 5).forEach(q => finalUniqueQuestions.push(q));
      }
    }

    const durationMin = Number(asm.durationMinutes || asm.duration_minutes) || 10;
    const activeObj = {
      ...asm,
      durationMinutes: durationMin,
      questions: finalUniqueQuestions,
      totalQuestions: finalUniqueQuestions.length
    };

    setActiveAssessment(activeObj);
    setAssessmentAnswers({});
    setMarkedForReview([]);
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(durationMin * 60);
    setCurrentView('take-assessment');
    navigateTo('take-assessment');
  };

  const matchOptionAnswer = (userAns, correctAns, options) => {
    if (userAns === undefined || userAns === null) return false;
    const cleanUser = String(userAns).trim().toUpperCase();
    const cleanCorrect = String(correctAns || '').trim().toUpperCase();
    if (cleanUser && cleanUser === cleanCorrect) return true;

    if (Array.isArray(options) && options.length > 0) {
      let correctIdx = -1;
      if (['A', 'B', 'C', 'D'].includes(cleanCorrect)) {
        correctIdx = cleanCorrect.charCodeAt(0) - 65;
      } else if (!isNaN(Number(cleanCorrect))) {
        correctIdx = Number(cleanCorrect);
      } else {
        correctIdx = options.findIndex(opt => {
          const text = typeof opt === 'object' && opt !== null ? (opt.text || opt.label || '') : String(opt);
          return text.trim().toUpperCase() === cleanCorrect;
        });
      }

      let userIdx = -1;
      if (['A', 'B', 'C', 'D'].includes(cleanUser)) {
        userIdx = cleanUser.charCodeAt(0) - 65;
      } else if (!isNaN(Number(cleanUser))) {
        userIdx = Number(cleanUser);
      } else {
        userIdx = options.findIndex(opt => {
          const text = typeof opt === 'object' && opt !== null ? (opt.text || opt.label || '') : String(opt);
          return text.trim().toUpperCase() === cleanUser;
        });
      }

      if (correctIdx !== -1 && userIdx !== -1 && correctIdx === userIdx) return true;
      if (correctIdx >= 0 && correctIdx < options.length) {
        const correctOpt = options[correctIdx];
        const correctText = typeof correctOpt === 'object' && correctOpt !== null ? (correctOpt.text || correctOpt.label || '') : String(correctOpt);
        if (cleanUser === correctText.trim().toUpperCase()) return true;
      }
    }
    return false;
  };

  const submitAssessment = async (answers, timeSpentMin = 28, metadata = {}) => {
    // Generate calculated score for the active assessment's exact questions
    const asmQuestions = (activeAssessment?.questions && activeAssessment.questions.length > 0)
      ? activeAssessment.questions
      : questionBank;
    const totalQuestions = asmQuestions.length || 1;

    let totalPossibleMarks = 0;
    let totalObtainedMarks = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const categoryStats = {};
    const topicStats = {};

    asmQuestions.forEach((q) => {
      const isCoding = q.type === 'Coding' || q.category === 'Coding';
      const qMarks = Number(q.marks) > 0 ? Number(q.marks) : (isCoding ? 10 : 4);
      const cat = (q.category || 'Technical').trim();
      const top = (q.topic || 'General').trim();

      let correctAns = (q.correctAnswer || q.correct_answer || '').trim();
      if (!correctAns) {
        const bankMatch = questionBank.find(bq => bq.id === q.id) ||
                          INITIAL_QUESTION_BANK.find(bq => bq.id === q.id) ||
                          questionBank.find(bq => bq.question?.trim().toLowerCase() === q.question?.trim().toLowerCase()) ||
                          INITIAL_QUESTION_BANK.find(bq => bq.question?.trim().toLowerCase() === q.question?.trim().toLowerCase());
        correctAns = (bankMatch?.correctAnswer || bankMatch?.correct_answer || '').trim();
      }

      totalPossibleMarks += qMarks;

      if (!categoryStats[cat]) {
        categoryStats[cat] = { totalMarks: 0, obtainedMarks: 0, totalQuestions: 0, correctCount: 0 };
      }
      categoryStats[cat].totalMarks += qMarks;
      categoryStats[cat].totalQuestions += 1;

      if (!topicStats[top]) {
        topicStats[top] = {
          topic: top,
          category: cat,
          totalMarks: 0,
          obtainedMarks: 0,
          totalQuestions: 0,
          correctCount: 0,
          incorrectCount: 0,
          unansweredCount: 0
        };
      }
      topicStats[top].totalMarks += qMarks;
      topicStats[top].totalQuestions += 1;

      const userAns = answers[q.id];
      const isCodingAnswer = isCoding || (typeof userAns === 'object' && userAns !== null);
      const hasAnswered = isCodingAnswer || (userAns !== undefined && userAns !== null && String(userAns).trim() !== '');

      if (hasAnswered) {
        if (isCodingAnswer) {
          const scorePct = Number(userAns?.score ?? (userAns?.passedTests && userAns?.totalTests ? (userAns.passedTests / userAns.totalTests) * 100 : (userAns?.code ? 100 : 0)));
          const earned = Math.round((scorePct / 100) * qMarks);
          totalObtainedMarks += earned;
          categoryStats[cat].obtainedMarks += earned;
          topicStats[top].obtainedMarks += earned;

          if (scorePct >= 60) {
            correct += 1;
            categoryStats[cat].correctCount += 1;
            topicStats[top].correctCount += 1;
          } else {
            incorrect += 1;
            topicStats[top].incorrectCount += 1;
          }
        } else {
          const isCorrect = matchOptionAnswer(userAns, correctAns, q.options);
          if (isCorrect) {
            correct += 1;
            totalObtainedMarks += qMarks;

            categoryStats[cat].correctCount += 1;
            categoryStats[cat].obtainedMarks += qMarks;

            topicStats[top].correctCount += 1;
            topicStats[top].obtainedMarks += qMarks;
          } else {
            incorrect += 1;
            topicStats[top].incorrectCount += 1;
          }
        }
      } else {
        unanswered += 1;
        topicStats[top].unansweredCount += 1;
      }
    });

    if (totalPossibleMarks === 0) totalPossibleMarks = 40;
    const attemptedCount = correct + incorrect;
    let calculatedScore = Math.min(100, Math.max(0, Math.round((totalObtainedMarks / totalPossibleMarks) * 100)));
    let accuracy = attemptedCount > 0 ? Math.round((correct / attemptedCount) * 100) : 0;

    // Helper function to normalize category to one of the standard sections
    const normalizeSection = (rawCat) => {
      const c = (rawCat || '').toLowerCase().trim();
      if (c.includes('code') || c.includes('prog')) return 'coding';
      if (c.includes('apt') || c.includes('quant') || c.includes('math')) return 'aptitude';
      if (c.includes('reason') || c.includes('logic')) return 'reasoning';
      if (c.includes('verbal') || c.includes('eng')) return 'verbal';
      if (c.includes('tech')) return 'technical';
      return c || 'technical';
    };

    // Build dynamic category scores based on marks with section normalization
    const categoryScores = {
      aptitude: 0,
      reasoning: 0,
      technical: 0,
      verbal: 0,
      coding: 0,
    };

    const normalizedCategoryStats = {
      aptitude: { totalMarks: 0, obtainedMarks: 0 },
      reasoning: { totalMarks: 0, obtainedMarks: 0 },
      technical: { totalMarks: 0, obtainedMarks: 0 },
      verbal: { totalMarks: 0, obtainedMarks: 0 },
      coding: { totalMarks: 0, obtainedMarks: 0 },
    };

    Object.keys(categoryStats).forEach(cat => {
      const stat = categoryStats[cat];
      const normalizedKey = normalizeSection(cat);
      if (!normalizedCategoryStats[normalizedKey]) {
        normalizedCategoryStats[normalizedKey] = { totalMarks: 0, obtainedMarks: 0 };
      }
      normalizedCategoryStats[normalizedKey].totalMarks += stat.totalMarks;
      normalizedCategoryStats[normalizedKey].obtainedMarks += stat.obtainedMarks;
    });

    Object.keys(normalizedCategoryStats).forEach(sec => {
      const stat = normalizedCategoryStats[sec];
      if (stat.totalMarks > 0) {
        categoryScores[sec] = Math.round((stat.obtainedMarks / stat.totalMarks) * 100);
      } else {
        categoryScores[sec] = 0;
      }
    });

    // Build dynamic topic breakdown with marks and accuracy
    let topicBreakdown = Object.keys(topicStats).map(topic => {
      const stat = topicStats[topic];
      const topicScore = stat.totalMarks > 0
        ? Math.round((stat.obtainedMarks / stat.totalMarks) * 100)
        : 0;
      let status = 'Needs Review';
      if (topicScore >= 85) status = 'Mastered';
      else if (topicScore >= 70) status = 'Strong';
      else if (topicScore >= 50) status = 'Average';
      else status = 'Weak';

      return {
        topic: stat.topic,
        category: stat.category,
        score: topicScore,
        obtainedMarks: stat.obtainedMarks,
        totalMarks: stat.totalMarks,
        correctCount: stat.correctCount,
        incorrectCount: stat.incorrectCount,
        unansweredCount: stat.unansweredCount,
        totalQuestions: stat.totalQuestions,
        status
      };
    });

    if (topicBreakdown.length === 0) {
      topicBreakdown = [
        {
          topic: 'Core Technical Concepts',
          category: 'Technical',
          score: calculatedScore,
          obtainedMarks: totalObtainedMarks,
          totalMarks: totalPossibleMarks || 10,
          correctCount: correct,
          incorrectCount: incorrect,
          unansweredCount: unanswered,
          totalQuestions,
          status: calculatedScore >= 70 ? 'Strong' : 'Average'
        }
      ];
    }

    // 1. Send submission data to backend API -> calculated authoritatively on PostgreSQL backend!
    const submissionRes = await api.submissions.submit({
      assessmentId: activeAssessment?.id || 'asm-1',
      assessmentTitle: activeAssessment?.title || 'Technical Assessment',
      candidateId: currentUser?.id || 'cand-user',
      candidateName: currentUser?.name || currentUser?.fullName || 'Test Candidate',
      candidateEmail: currentUser?.email || 'student@university.edu',
      score: calculatedScore,
      accuracy: accuracy,
      correctCount: correct,
      incorrectCount: incorrect,
      unansweredCount: unanswered,
      totalQuestions,
      obtainedMarks: totalObtainedMarks,
      totalMarks: totalPossibleMarks,
      timeTaken: `${timeSpentMin} min`,
      categoryScores,
      topicBreakdown,
      questionIds: asmQuestions.map(q => q.id),
      answers: answers,
      proctoringViolations: Number(metadata.proctoringViolations || 0),
      autoSubmitted: Boolean(metadata.autoSubmitted),
      autoSubmitReason: metadata.autoSubmitReason || null
    });

    // Check if backend rejected because already submitted
    if (!submissionRes.ok && (submissionRes.status === 403 || submissionRes.data?.alreadySubmitted)) {
      const targetAsmId = activeAssessment?.id || 'asm-1';
      const existingSub = {
        assessment_id: targetAsmId,
        assessmentId: targetAsmId,
        status: 'Completed',
        score: submissionRes.data?.submission?.score ?? calculatedScore ?? 0,
        obtained_marks: submissionRes.data?.submission?.obtained_marks ?? submissionRes.data?.submission?.obtainedMarks ?? totalObtainedMarks,
        obtainedMarks: submissionRes.data?.submission?.obtained_marks ?? submissionRes.data?.submission?.obtainedMarks ?? totalObtainedMarks,
        total_marks: submissionRes.data?.submission?.total_marks ?? submissionRes.data?.submission?.totalMarks ?? totalPossibleMarks,
        totalMarks: submissionRes.data?.submission?.total_marks ?? submissionRes.data?.submission?.totalMarks ?? totalPossibleMarks,
        created_at: new Date().toISOString()
      };
      setCandidateSubmissions(prev => [
        existingSub,
        ...prev.filter(s => String(s.assessment_id || s.assessmentId || '').trim().toLowerCase() !== String(targetAsmId).trim().toLowerCase())
      ]);
      setActiveAssessment(null);
      setAssessmentAnswers({});
      setCurrentQuestionIndex(0);
      setMarkedForReview([]);
      stopMediaStream();
      addToast(submissionRes.error || 'This assessment has already been submitted and recorded.', 'info');
      navigateTo('candidate-analytics');
      return;
    }

    // If backend returned authoritative evaluation, synchronize frontend state with DB
    const dbData = submissionRes?.data?.data || submissionRes?.data;
    if (submissionRes?.ok && dbData && typeof dbData === 'object') {
      const dbAsmId = dbData.assessment_id || dbData.assessmentId || activeAssessment?.id || 'asm-1';
      if (typeof dbData.score === 'number') calculatedScore = dbData.score;
      if (typeof dbData.accuracy === 'number') accuracy = dbData.accuracy;
      if (typeof dbData.correct_count === 'number') correct = dbData.correct_count;
      if (typeof dbData.incorrect_count === 'number') incorrect = dbData.incorrect_count;
      if (typeof dbData.unanswered_count === 'number') unanswered = dbData.unanswered_count;

      const dbObtained = typeof dbData.obtained_marks === 'number' ? dbData.obtained_marks : (typeof dbData.obtainedMarks === 'number' ? dbData.obtainedMarks : null);
      const dbTotal = typeof dbData.total_marks === 'number' ? dbData.total_marks : (typeof dbData.totalMarks === 'number' ? dbData.totalMarks : null);

      if (dbObtained !== null && dbObtained > 0) totalObtainedMarks = dbObtained;
      if (dbTotal !== null && dbTotal > 0) totalPossibleMarks = dbTotal;
      if (totalPossibleMarks > 0) {
        calculatedScore = Math.min(100, Math.max(0, Math.round((totalObtainedMarks / totalPossibleMarks) * 100)));
      }

      setCandidateSubmissions(prev => [
        {
          ...dbData,
          assessment_id: dbAsmId,
          assessmentId: dbAsmId,
          score: calculatedScore,
          accuracy: accuracy,
          obtained_marks: totalObtainedMarks,
          obtainedMarks: totalObtainedMarks,
          total_marks: totalPossibleMarks,
          totalMarks: totalPossibleMarks,
          correct_count: correct,
          incorrect_count: incorrect,
          unanswered_count: unanswered,
          total_questions: totalQuestions,
          status: 'Completed',
          created_at: new Date().toISOString()
        },
        ...prev.filter(s => s.id !== dbData.id && String(s.assessment_id || s.assessmentId || '').trim().toLowerCase() !== String(dbAsmId).trim().toLowerCase())
      ]);

      if (dbData.topic_breakdown) {
        try {
          topicBreakdown = typeof dbData.topic_breakdown === 'string'
            ? JSON.parse(dbData.topic_breakdown)
            : dbData.topic_breakdown;
        } catch (e) {}
      }
      if (dbData.category_scores) {
        try {
          const dbCat = typeof dbData.category_scores === 'string'
            ? JSON.parse(dbData.category_scores)
            : dbData.category_scores;
          Object.assign(categoryScores, dbCat);
        } catch (e) {}
      }
    }

    const strongTopics = (topicBreakdown || []).filter(t => (t.score ?? 0) >= 70).map(t => `${t.topic} (${t.score}% - ${t.obtainedMarks ?? t.correctCount ?? 0}/${t.totalMarks ?? t.totalQuestions ?? 0} marks)`);
    const weakTopics = (topicBreakdown || []).filter(t => (t.score ?? 0) < 70).map(t => `${t.topic} (${t.score}% - ${t.obtainedMarks ?? t.correctCount ?? 0}/${t.totalMarks ?? t.totalQuestions ?? 0} marks)`);

    const dynamicStrengths = strongTopics.length > 0 ? strongTopics : ['Question attempt consistency', 'Basic problem understanding'];
    const dynamicWeaknesses = weakTopics.length > 0 ? weakTopics : ['Speed & time management under exam pressure'];
    const dynamicRecommendations = weakTopics.length > 0
      ? (topicBreakdown || []).filter(t => (t.score ?? 0) < 70).map(t => `Practice topic questions in ${t.topic} (currently scored ${t.obtainedMarks ?? t.correctCount ?? 0}/${t.totalMarks ?? t.totalQuestions ?? 0} marks)`)
      : ['Continue practicing mock exams to maintain 100% mastery'];

    const result = {
      score: calculatedScore,
      totalMarks: totalPossibleMarks,
      obtainedMarks: totalObtainedMarks,
      accuracy: accuracy,
      correctCount: correct,
      incorrectCount: incorrect,
      unansweredCount: unanswered,
      totalQuestions,
      timeTaken: `${timeSpentMin} min`,
      completedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      assessmentId: activeAssessment?.id || 'asm-1',
      assessmentName: activeAssessment?.title || 'Technical Assessment',
      categoryScores,
      topicBreakdown,
      strengths: dynamicStrengths,
      weaknesses: dynamicWeaknesses,
      recommendedTopics: dynamicRecommendations
    };

    setLatestResult(result);
    try {
      localStorage.setItem('rsj_latest_result', JSON.stringify(result));
    } catch (e) {}

    // 2. Update candidate score in currentUser state
    setCurrentUser(prev => {
      if (!prev) return null;
      const updatedUser = {
        ...prev,
        overallScore: calculatedScore,
        jobReadinessScore: calculatedScore,
        aptitudeScore: categoryScores.aptitude ?? prev.aptitudeScore ?? 0,
        reasoningScore: categoryScores.reasoning ?? prev.reasoningScore ?? 0,
        technicalScore: categoryScores.technical ?? prev.technicalScore ?? calculatedScore,
        verbalScore: categoryScores.verbal ?? prev.verbalScore ?? 0,
        codingScore: categoryScores.coding ?? prev.codingScore ?? 0,
        assessmentStatus: 'Completed',
        assessmentsCompleted: (prev.assessmentsCompleted || 0) + 1
      };
      try {
        localStorage.setItem('rsj_user', JSON.stringify(updatedUser));
      } catch (e) {}
      return updatedUser;
    });

    // 3. Update candidate entry in candidatesList so candidate score is immediately shown on Candidate Roster page!
    setCandidatesList(prev => {
      const activeEmail = currentUser?.email?.toLowerCase();
      const activeId = currentUser?.id;

      let found = false;
      const updatedList = prev.map(c => {
        if ((activeId && c.id === activeId) || (activeEmail && c.email?.toLowerCase() === activeEmail)) {
          found = true;
          return {
            ...c,
            overallScore: calculatedScore,
            jobReadinessScore: calculatedScore,
            assessmentStatus: 'Completed',
            status: 'Completed',
            assessmentsCompleted: (c.assessmentsCompleted || 0) + 1
          };
        }
        return c;
      });

      if (!found && currentUser) {
        const newCand = {
          id: currentUser.id || `cand-${Date.now()}`,
          name: currentUser.name || currentUser.fullName || 'Candidate Student',
          email: currentUser.email || 'student@university.edu',
          mobile: currentUser.mobile || currentUser.phoneNo || currentUser.phone || '+91 9876543210',
          college: currentUser.college || currentUser.collegeName || 'BITS Pilani',
          branch: currentUser.branch || 'CSE',
          specialization: currentUser.specialization || 'Full-Stack Development',
          country: currentUser.country || 'India',
          state: currentUser.state || 'Telangana',
          city: currentUser.city || 'Hyderabad',
          graduationYear: currentUser.graduationYear || 2026,
          experienceLevel: currentUser.experienceLevel || 'Fresher',
          overallScore: calculatedScore,
          jobReadinessScore: calculatedScore,
          assessmentStatus: 'Completed',
          status: 'Active',
          assessmentsCompleted: 1
        };
        updatedList.unshift(newCand);
      }

      localStorage.setItem('rsj_candidates_list', JSON.stringify(updatedList));
      return updatedList;
    });

    // Mark assessment completed
    const currentAsmId = activeAssessment?.id || 'asm-1';
    if (activeAssessment) {
      setAssessments(prev => {
        const updated = prev.map(a => a.id === activeAssessment.id ? {
          ...a,
          status: 'Completed',
          progress: 100,
          completedQuestions: a.totalQuestions,
          lastScore: calculatedScore
        } : a);
        localStorage.setItem('rsj_assessments', JSON.stringify(updated));
        return updated;
      });
    }

    // Ensure candidateSubmissions has this assessment marked Completed
    setCandidateSubmissions(prev => {
      const exists = prev.some(s => 
        String(s.assessment_id || s.assessmentId || '').trim().toLowerCase() === String(currentAsmId).trim().toLowerCase() ||
        (activeAssessment?.title && String(s.assessment_title || s.assessmentName || '').trim().toLowerCase() === String(activeAssessment.title).trim().toLowerCase())
      );
      let updated;
      if (!exists) {
        updated = [
          {
            assessment_id: currentAsmId,
            assessmentId: currentAsmId,
            assessment_title: activeAssessment?.title || 'Technical Readiness Assessment',
            assessmentName: activeAssessment?.title || 'Technical Readiness Assessment',
            category: activeAssessment?.category || 'Technical',
            status: 'Completed',
            score: calculatedScore,
            accuracy: accuracy,
            created_at: new Date().toISOString()
          },
          ...prev
        ];
      } else {
        updated = prev.map(s => {
          const matchId = String(s.assessment_id || s.assessmentId || '').trim().toLowerCase() === String(currentAsmId).trim().toLowerCase();
          const matchTitle = activeAssessment?.title && String(s.assessment_title || s.assessmentName || '').trim().toLowerCase() === String(activeAssessment.title).trim().toLowerCase();
          return (matchId || matchTitle) ? {
            ...s,
            assessment_title: s.assessment_title || activeAssessment?.title,
            category: s.category || activeAssessment?.category,
            status: 'Completed',
            score: calculatedScore,
            accuracy: accuracy
          } : s;
        });
      }
      try {
        localStorage.setItem('rsj_candidate_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (typeof document !== 'undefined' && (document.fullscreenElement || document.webkitFullscreenElement)) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } catch (e) {}
    }

    // CLOSE EXAM SESSION COMPLETELY
    setActiveAssessment(null);
    setAssessmentAnswers({});
    setCurrentQuestionIndex(0);
    setMarkedForReview([]);
    stopMediaStream();

    addToast('Assessment submitted successfully! Score calculated.', 'success');
    setCurrentView('candidate-analytics');
    try {
      window.history.pushState(null, '', '/candidate-analytics');
    } catch (e) {}
    return submissionRes;
  };

  // Fetch questions from PostgreSQL database on load and merge with local state
  useEffect(() => {
    const fetchQuestions = async () => {
      const res = await api.questions.getAll();
      const rawList = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      if (res.ok && rawList.length > 0) {
        const dbList = rawList.map(q => ({
          id: q.id,
          category: q.category,
          topic: q.topic,
          difficulty: q.difficulty,
          type: q.type || 'Single Choice',
          question: q.question,
          codeSnippet: q.code_snippet,
          language: q.language,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []),
          test_cases: typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : (q.test_cases || []),
          starter_templates: typeof q.starter_templates === 'string' ? JSON.parse(q.starter_templates) : (q.starter_templates || null),
          constraints: q.constraints,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
          timeLimitSec: Number(q.time_limit_sec) || 60,
          tags: q.tags || []
        }));

        setQuestionBank(prev => {
          // Map DB items + prev local items to prevent loss on refresh
          const map = new Map();
          dbList.forEach(item => map.set(item.id, item));
          prev.forEach(item => {
            if (!map.has(item.id)) map.set(item.id, item);
          });
          const merged = Array.from(map.values());
          localStorage.setItem('rsj_question_bank', JSON.stringify(merged));
          return merged;
        });
      }
    };
    fetchQuestions();
  }, []);

  // Question Bank CRUD
  const addQuestionsBatch = (questionsArray) => {
    if (!Array.isArray(questionsArray) || questionsArray.length === 0) return;

    setQuestionBank(prev => {
      const existingNumIds = prev
        .map(q => parseInt(q.id.replace('q-', ''), 10))
        .filter(n => !isNaN(n));
      let currentMax = existingNumIds.length > 0 ? Math.max(...existingNumIds) : 100;

      const preparedBatch = questionsArray.map(q => {
        let qId = q.id;
        if (!qId || qId === 'q-101') {
          currentMax += 1;
          qId = `q-${currentMax}`;
        }
        return {
          ...q,
          id: qId
        };
      });

      const map = new Map();
      prev.forEach(item => map.set(item.id, item));
      preparedBatch.forEach(item => map.set(item.id, item));

      const updated = Array.from(map.values());
      localStorage.setItem('rsj_question_bank', JSON.stringify(updated));

      // Asynchronously save all questions to PostgreSQL database
      preparedBatch.forEach(item => {
        api.questions.create({
          id: item.id,
          category: item.category,
          topic: item.topic,
          difficulty: item.difficulty,
          type: item.type || 'Single Choice',
          question: item.question,
          codeSnippet: item.codeSnippet,
          language: item.language,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          marks: item.marks,
          timeLimitSec: item.timeLimitSec,
          tags: item.tags,
          testCases: item.testCases || item.test_cases,
          starterTemplates: item.starterTemplates || item.starter_templates,
          constraints: item.constraints
        });
      });

      return updated;
    });

    if (questionsArray.length === 1) {
      addToast('Question saved to database!', 'success');
    } else {
      addToast(`Successfully saved ${questionsArray.length} questions to database!`, 'success');
    }
  };

  const addQuestion = (newQ) => {
    addQuestionsBatch([newQ]);
  };

  const updateQuestion = (updatedQ) => {
    setQuestionBank(prev => {
      const updated = prev.map(q => q.id === updatedQ.id ? updatedQ : q);
      localStorage.setItem('rsj_question_bank', JSON.stringify(updated));
      return updated;
    });
    api.questions.update(updatedQ.id, updatedQ);
    addToast('Question updated in database', 'success');
  };

  const deleteQuestion = (id) => {
    setQuestionBank(prev => {
      const updated = prev.filter(q => q.id !== id);
      localStorage.setItem('rsj_question_bank', JSON.stringify(updated));
      return updated;
    });
    api.questions.delete(id);
    addToast('Question deleted from database', 'info');
  };

  // Fetch candidates from database on load
  useEffect(() => {
    const fetchCandidates = async () => {
      const res = await api.candidates.getAll();
      if (res.ok && res.data?.data) {
        const dbCandidates = res.data.data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          mobile: c.mobile || c.phone,
          college: c.college,
          degree: c.degree || 'B.Tech',
          branch: c.branch,
          specialization: c.specialization,
          country: c.country || 'India',
          state: c.state,
          city: c.city,
          graduationYear: c.graduation_year || 2026,
          experienceLevel: c.experience_level || 'Fresher',
          status: c.status || 'Active',
          assessmentStatus: c.assessment_status || c.readiness_status || 'Active',
          registeredAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-08-28',
          overallScore: Number(c.overall_score ?? c.job_readiness_score ?? 0),
          jobReadinessScore: Number(c.overall_score ?? c.job_readiness_score ?? 0),
          aptitudeScore: Number(c.aptitude_score ?? 0),
          reasoningScore: Number(c.reasoning_score ?? 0),
          technicalScore: Number(c.technical_score ?? 0),
          verbalScore: Number(c.verbal_score ?? 0),
          codingScore: Number(c.coding_score ?? 0),
          assessmentsCompleted: Number(c.assessments_completed ?? 0)
        }));

        setCandidatesList(dbCandidates);
        localStorage.setItem('rsj_candidates_list', JSON.stringify(dbCandidates));
      }
    };
    fetchCandidates();
  }, []);

  // Assessment CRUD
  const addAssessment = (newAsm) => {
    const generatedId = newAsm.id || `asm-${Date.now()}`;
    const created = {
      ...newAsm,
      id: generatedId,
      status: 'Available',
      progress: 0,
      completedQuestions: 0,
      lastScore: null
    };

    setAssessments(prev => {
      const updated = [created, ...prev.filter(a => a.id !== generatedId)];
      localStorage.setItem('rsj_assessments', JSON.stringify(updated));
      return updated;
    });

    // Save directly to PostgreSQL database
    api.assessments.create({
      id: generatedId,
      title: created.title,
      category: created.category,
      description: created.description,
      difficulty: created.difficulty,
      durationMinutes: created.durationMinutes,
      totalQuestions: created.totalQuestions,
      passingScore: created.passingScore,
      selectedQuestionIds: created.selectedQuestionIds || []
    });

    addToast(`Assessment "${newAsm.title}" published & saved to database!`, 'success');
  };

  const updateAssessment = (updatedAsm) => {
    setAssessments(prev => {
      const updated = prev.map(a => a.id === updatedAsm.id ? { ...a, ...updatedAsm } : a);
      localStorage.setItem('rsj_assessments', JSON.stringify(updated));
      return updated;
    });

    // Update in PostgreSQL database via API
    api.assessments.update(updatedAsm.id, {
      title: updatedAsm.title,
      category: updatedAsm.category,
      description: updatedAsm.description,
      difficulty: updatedAsm.difficulty,
      durationMinutes: updatedAsm.durationMinutes,
      totalQuestions: updatedAsm.totalQuestions,
      passingScore: updatedAsm.passingScore,
      status: updatedAsm.status || 'Available',
      selectedQuestionIds: updatedAsm.selectedQuestionIds || []
    });

    addToast(`Assessment "${updatedAsm.title}" updated successfully!`, 'success');
  };

  const deleteAssessment = (id) => {
    setAssessments(prev => {
      const updated = prev.filter(a => a.id !== id);
      localStorage.setItem('rsj_assessments', JSON.stringify(updated));
      return updated;
    });

    // Delete from PostgreSQL database
    api.assessments.delete(id);
    addToast('Assessment deleted from database', 'info');
  };

  // Candidate CRUD
  const addCandidate = (candData) => {
    const newCand = {
      ...INITIAL_CANDIDATE,
      id: `cand-${Date.now()}`,
      ...candData,
      registeredAt: new Date().toISOString().split('T')[0]
    };
    setCandidatesList(prev => [newCand, ...prev]);
    addToast(`Candidate ${candData.name} added successfully`, 'success');
  };

  const deleteCandidate = async (id) => {
    try {
      const res = await api.candidates.delete(id);
      if (res && res.ok) {
        setCandidatesList(prev => {
          const updated = prev.filter(c => c.id !== id);
          try {
            localStorage.setItem('rsj_candidates_list', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        addToast('Candidate deleted successfully from database', 'success');
      } else {
        addToast(res?.error || 'Failed to delete candidate from database', 'error');
      }
    } catch (err) {
      console.error('Error deleting candidate:', err);
      addToast('Failed to delete candidate from database', 'error');
    }
  };

  const resetCandidateAttempt = async (id, assessmentId = null) => {
    try {
      const res = await api.candidates.resetAttempt(id, assessmentId);
      if (res && res.ok) {
        // Refresh candidates list from DB if possible
        try {
          const candRes = await api.candidates.getAll();
          const rawList = Array.isArray(candRes?.data?.data)
            ? candRes.data.data
            : (Array.isArray(candRes?.data) ? candRes.data : []);
          if (candRes && candRes.ok && Array.isArray(rawList)) {
            const dbCandidates = rawList.map(c => ({
              id: c.id,
              name: c.name,
              email: c.email,
              mobile: c.mobile || c.phone,
              college: c.college,
              degree: c.degree || 'B.Tech',
              branch: c.branch,
              specialization: c.specialization,
              country: c.country || 'India',
              state: c.state,
              city: c.city,
              graduationYear: c.graduation_year || 2026,
              experienceLevel: c.experience_level || 'Fresher',
              status: c.status || 'Active',
              assessmentStatus: c.assessment_status || c.readiness_status || 'Active',
              registeredAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-08-28',
              overallScore: Number(c.overall_score ?? c.job_readiness_score ?? 0),
              jobReadinessScore: Number(c.overall_score ?? c.job_readiness_score ?? 0),
              aptitudeScore: Number(c.aptitude_score ?? 0),
              reasoningScore: Number(c.reasoning_score ?? 0),
              technicalScore: Number(c.technical_score ?? 0),
              verbalScore: Number(c.verbal_score ?? 0),
              codingScore: Number(c.coding_score ?? 0),
              assessmentsCompleted: Number(c.assessments_completed ?? 0)
            }));
            setCandidatesList(dbCandidates);
            try {
              localStorage.setItem('rsj_candidates_list', JSON.stringify(dbCandidates));
            } catch (e) {}
          }
        } catch (e) {
          console.warn('Failed to refresh candidate list after attempt reset:', e.message);
        }

        // If the reset candidate is the currently logged-in candidate, refresh their submissions and status
        if (currentUser && (currentUser.id === id || currentUser.email === id)) {
          try {
            const subRes = await api.submissions.my();
            const subList = Array.isArray(subRes?.data?.data)
              ? subRes.data.data
              : (Array.isArray(subRes?.data) ? subRes.data : []);
            if (subRes && subRes.ok && Array.isArray(subList)) {
              setCandidateSubmissions(subList);
              if (subList.length === 0) {
                setLatestResult(null);
              }
            }
          } catch (e) {}
        }

        addToast(res.message || 'Assessment attempt reset successfully. The candidate can now retake the assessment.', 'success');
        return { success: true, data: res };
      } else {
        const errorMsg = res?.error || 'Failed to reset assessment attempt';
        addToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error('Error resetting candidate attempt:', err);
      const errorMsg = err.message || 'Failed to reset assessment attempt';
      addToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        role,
        setRole,
        currentView,
        setCurrentView,
        navigateTo,
        assessments,
        questionBank,
        candidatesList,
        recommendations,
        activeAssessment,
        setActiveAssessment,
        mediaStream,
        setMediaStream,
        stopMediaStream,
        assessmentAnswers,
        setAssessmentAnswers,
        markedForReview,
        setMarkedForReview,
        currentQuestionIndex,
        setCurrentQuestionIndex,
        timeRemainingSeconds,
        setTimeRemainingSeconds,
        latestResult,
        toasts,
        addToast,
        removeToast,
        registerCandidate,
        loginCandidate,
        loginAdmin,
        logout,
        startAssessment,
        submitAssessment,
        addQuestion,
        addQuestionsBatch,
        updateQuestion,
        deleteQuestion,
        addAssessment,
        updateAssessment,
        deleteAssessment,
        addCandidate,
        deleteCandidate,
        resetCandidateAttempt,
        candidateSubmissions,
        setCandidateSubmissions,
        isAssessmentCompleted,
        areAllAssessmentsCompleted,
        isInterviewUnlocked,
        kpis: INITIAL_ADMIN_KPIS,
        setRouterNavigate
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
