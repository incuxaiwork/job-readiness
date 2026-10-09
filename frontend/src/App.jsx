import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/Toast';

// Candidate Pages
import { SignupPage } from './pages/candidate/SignupPage';
import { LoginPage } from './pages/candidate/LoginPage';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { AssessmentsListPage } from './pages/candidate/AssessmentsListPage';
import { AssessmentPage } from './pages/candidate/AssessmentPage';
import { AIMockInterviewPage } from './pages/candidate/AIMockInterviewPage';
import CandidateAnalyticsPage from './pages/candidate/CandidateAnalyticsPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminCandidatesPage } from './pages/admin/AdminCandidatesPage';
import { AdminQuestionBankPage } from './pages/admin/AdminQuestionBankPage';
import { AdminAssessmentsPage } from './pages/admin/AdminAssessmentsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminInterviewsPage } from './pages/admin/AdminInterviewsPage';

import { JobReadinessHero } from './pages/JobReadinessHero';
import { ShieldAlert, Lock } from 'lucide-react';
import { isInterviewLocked } from './utils/interviewLock';

// ── Route Guards ────────────────────────────────────────────────────────────

function RequireCandidate({ children }) {
  const { role } = useApp();
  const location = useLocation();
  const savedRole = typeof window !== 'undefined' ? localStorage.getItem('rsj_role') : null;
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('rsj_user') : null;
  const isCandidate = role === 'candidate' || role === 'admin' || savedRole === 'candidate' || savedRole === 'admin' || !!savedUser;

  if (!isCandidate) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { role } = useApp();
  const location = useLocation();
  const savedRole = typeof window !== 'undefined' ? localStorage.getItem('rsj_role') : null;
  const savedAdmin = typeof window !== 'undefined' ? localStorage.getItem('rsj_admin_user') : null;
  const isAdmin = role === 'admin' || savedRole === 'admin' || !!savedAdmin;

  if (!isAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }
  return children;
}

function AccessDenied({ message = 'You do not have permission to view this area.', requiredRole = 'admin' }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Restricted</h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-6 leading-relaxed">{message}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          Return to Student Dashboard
        </button>
        {requiredRole === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── NavigateTo bridge ───────────────────────────────────────────────────────
// Keeps the AppContext navigateTo function wired to react-router navigate
// so existing code that calls navigateTo() works transparently.
function RouterBridge({ children }) {
  const navigate = useNavigate();
  const { setRouterNavigate } = useApp();

  useEffect(() => {
    if (setRouterNavigate) setRouterNavigate(navigate);
  }, [navigate, setRouterNavigate]);

  return children;
}

function AssessmentRunner() {
  const { activeAssessment, assessments, isAssessmentCompleted, role } = useApp();

  if (role !== 'admin' && assessments && assessments.length > 0) {
    const allDone = assessments.every(a => isAssessmentCompleted(a));
    if (allDone && !activeAssessment) {
      return <Navigate to="/results" replace />;
    }
  }

  return (
    <>
      <AssessmentPage />
      <ToastContainer />
    </>
  );
}

// ── Distraction-free Fullscreen Interview runner (no Header, no Sidebar) ──
function InterviewRunner() {
  return (
    <div className="h-screen max-h-screen w-full bg-[#F8FAFC] text-slate-800 flex flex-col overflow-hidden selection:bg-brand-500 selection:text-white">
      <AIMockInterviewPage />
      <ToastContainer />
    </div>
  );
}

// ── Shell layout (Header + Sidebar + main) ─────────────────────────────────
function ShellLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans w-full">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}

// ── Interview route: locked state uses the normal shell, live interview is full-screen ──
function InterviewRoute() {
  const { role, adminUser, assessments, candidateSubmissions, isAssessmentCompleted } = useApp();
  const locked = isInterviewLocked({ role, adminUser, assessments, candidateSubmissions, isAssessmentCompleted });

  if (locked) {
    return (
      <ShellLayout>
        <AIMockInterviewPage />
      </ShellLayout>
    );
  }
  return <InterviewRunner />;
}

// ── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <RouterBridge>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<><JobReadinessHero /><ToastContainer /></>} />
        <Route path="/login" element={<><LoginPage /><ToastContainer /></>} />
        <Route path="/signup" element={<><SignupPage /><ToastContainer /></>} />
        <Route path="/terms" element={<><TermsPage /><ToastContainer /></>} />
        <Route path="/privacy" element={<><PrivacyPage /><ToastContainer /></>} />
        <Route path="/admin" element={<><AdminLoginPage /><ToastContainer /></>} />
        <Route path="/admin-login" element={<Navigate to="/admin" replace />} />

        {/* AI Mock Interview — full-screen when unlocked; normal shell while locked */}
        <Route
          path="/interview"
          element={
            <InterviewRoute />
          }
        />
        <Route path="/ai-mock-interview" element={<Navigate to="/interview" replace />} />

        {/* Candidate-protected routes */}
        <Route
          path="/dashboard"
          element={
            <RequireCandidate>
              <ShellLayout>
                <CandidateDashboard />
              </ShellLayout>
            </RequireCandidate>
          }
        />
        <Route
          path="/assessments"
          element={
            <RequireCandidate>
              <ShellLayout>
                <AssessmentsListPage />
              </ShellLayout>
            </RequireCandidate>
          }
        />
        <Route
          path="/take-assessment"
          element={
            <RequireCandidate>
              <AssessmentRunner />
            </RequireCandidate>
          }
        />
        <Route
          path="/results"
          element={
            <RequireCandidate>
              <ShellLayout>
                <CandidateAnalyticsPage />
              </ShellLayout>
            </RequireCandidate>
          }
        />
        <Route path="/candidate-analytics" element={<Navigate to="/results" replace />} />

        {/* Admin-protected routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <ShellLayout>
                <AdminCandidatesPage />
              </ShellLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/candidates"
          element={
            <RequireAdmin>
              <ShellLayout>
                <AdminCandidatesPage />
              </ShellLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <RequireAdmin>
              <ShellLayout>
                <AdminQuestionBankPage />
              </ShellLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/assessments"
          element={
            <RequireAdmin>
              <ShellLayout>
                <AdminAssessmentsPage />
              </ShellLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/interviews"
          element={
            <RequireAdmin>
              <ShellLayout>
                <AdminInterviewsPage />
              </ShellLayout>
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RequireAdmin>
              <ShellLayout>
                <AdminAnalyticsPage />
              </ShellLayout>
            </RequireAdmin>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouterBridge>
  );
}
