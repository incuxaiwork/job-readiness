import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  Search,
  Filter,
  Eye,
  Award,
  ShieldAlert,
  BrainCircuit,
  Volume2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  ExternalLink,
  User,
  Lock,
  Unlock,
  Sliders,
  Save,
  HelpCircle,
  Settings,
  ShieldCheck,
  Zap,
  ListFilter
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import InterviewAnalysisSection from '../../components/analytics/InterviewAnalysisSection';

export const AdminInterviewsPage = () => {
  const { addToast, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'settings'

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [inspectSessionId, setInspectSessionId] = useState(null);

  // Settings state
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState({
    isLocked: false,
    lockReason: 'AI Mock Interview sessions are currently locked by the recruitment administrator. Please check back later.',
    questionCount: 1,
    difficulty: 'Moderate',
    maxWarnings: 3,
    strictProctoring: true,
    cameraRequired: true,
    multiFaceDetection: true,
    defaultRole: 'Data Scientist'
  });

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/interview/admin/sessions', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions || []);
        }
      }
    } catch (err) {
      console.error('Failed to load admin interview sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/interview/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingSettings(true);
      const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/interview/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
          if (addToast) {
            addToast(
              `AI Interview Settings Saved! Status: ${data.settings.isLocked ? 'LOCKED' : 'UNLOCKED'}, ${data.settings.questionCount} Questions.`,
              'success'
            );
          }
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      if (addToast) addToast('Error saving interview configuration.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleLock = async () => {
    const nextLocked = !settings.isLocked;
    const updated = { ...settings, isLocked: nextLocked };
    setSettings(updated);

    try {
      const token = localStorage.getItem('rsj_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/interview/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ isLocked: nextLocked })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && addToast) {
          addToast(
            nextLocked
              ? '🔒 AI Mock Interviews are now LOCKED for candidates.'
              : '🔓 AI Mock Interviews are now UNLOCKED & active.',
            nextLocked ? 'warning' : 'success'
          );
        }
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const rolesList = useMemo(() => {
    const set = new Set(sessions.map((s) => s.targetRole).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        (s.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.targetRole || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.id || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = selectedRole === 'All' || s.targetRole === selectedRole;
      const matchStatus =
        selectedStatus === 'All' ||
        (selectedStatus === 'Terminated' && s.status === 'TERMINATED_VIOLATION') ||
        (selectedStatus === 'Completed' && s.status === 'COMPLETED');

      return matchSearch && matchRole && matchStatus;
    });
  }, [sessions, searchQuery, selectedRole, selectedStatus]);

  // Statistics
  const totalSessions = sessions.length;
  const avgOverall = totalSessions
    ? Math.round(sessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / totalSessions)
    : 0;
  const avgTech = totalSessions
    ? Math.round(sessions.reduce((acc, s) => acc + (s.technicalScore || 0), 0) / totalSessions)
    : 0;
  const flaggedCount = sessions.filter(
    (s) => s.status === 'TERMINATED_VIOLATION' || s.warningCount > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Quick Lock Status */}
      {/* Quick Testing Action Banner for Lock/Unlock */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
        settings.isLocked
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
            settings.isLocked ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {settings.isLocked ? <Lock className="w-6 h-6 animate-pulse" /> : <Unlock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                settings.isLocked ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
              }`}>
                Session Status: {settings.isLocked ? 'LOCKED' : 'UNLOCKED & ACTIVE'}
              </span>
            </div>
            <h3 className="text-base font-black tracking-tight mt-0.5">
              {settings.isLocked
                ? 'AI Mock Interview Submissions are Currently LOCKED'
                : 'AI Mock Interview Submissions are Open & Available'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {settings.isLocked
                ? 'Candidates are currently shown the locked screen. Click "Unlock Interview Now" below for testing.'
                : 'Candidates can freely enter, test vocal responses, and complete mock interview evaluations.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleLock}
          className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 ${
            settings.isLocked
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-105'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
          }`}
        >
          {settings.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{settings.isLocked ? '🔓 Unlock Interview Now' : '🔒 Lock Interview Session'}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-cyan-600" />
              <span>AI Proctoring & Mock Interviews Admin Control</span>
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono flex items-center gap-1 border ${
              settings.isLocked
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {settings.isLocked ? <Lock className="w-3 h-3 text-rose-600" /> : <Unlock className="w-3 h-3 text-emerald-600" />}
              <span>{settings.isLocked ? 'LOCKED' : 'UNLOCKED (Open)'}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            AI Mock Interview Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full administrative control to lock/unlock sessions, configure question volume, tune proctoring rules, and monitor telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Lock / Unlock Toggle Button */}
          <button
            type="button"
            onClick={handleToggleLock}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs cursor-pointer ${
              settings.isLocked
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
            }`}
          >
            {settings.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{settings.isLocked ? 'Unlock AI Interview Session' : 'Lock AI Interview Session'}</span>
          </button>

          <button
            onClick={() => navigateTo('ai-mock-interview')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-cyan-300 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-cyan-500/30"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch Candidate View</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Recorded Candidate Sessions ({totalSessions})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Global Session Controls & Question Tuning</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RECORDED CANDIDATE SESSIONS */}
      {/* ============================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Recorded</span>
              <div className="text-2xl font-black text-slate-900">{totalSessions}</div>
              <span className="text-[10px] text-cyan-600 font-semibold block mt-1">PostgreSQL Verified</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Avg Overall Score</span>
              <div className="text-2xl font-black text-slate-900">{avgOverall}%</div>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">Consolidated Rating</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Configured Questions</span>
              <div className="text-2xl font-black text-indigo-600">{settings.questionCount} Questions</div>
              <span className="text-[10px] text-indigo-500 font-semibold block mt-1">Per Session Setting</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Proctoring Flagged</span>
              <div className="text-2xl font-black text-rose-600">{flaggedCount}</div>
              <span className="text-[10px] text-rose-500 font-semibold block mt-1">Camera / Multi-Face Flags</span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate, role, or session..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
              >
                {rolesList.map((r) => (
                  <option key={r} value={r}>Role: {r}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Terminated">Terminated (Violations)</option>
              </select>

              <button
                onClick={fetchSessions}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Refresh table"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Target Role</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Technical</th>
                    <th className="py-3 px-4">Communication</th>
                    <th className="py-3 px-4">Proctoring Status</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingSessions ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-cyan-600" />
                        <span>Loading interview sessions...</span>
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No mock interview sessions found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-cyan-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {s.candidateName ? s.candidateName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{s.candidateName}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">{s.candidateEmail}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{s.targetRole}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                            s.overallScore >= 75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : s.overallScore > 0
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {s.overallScore}%
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">{s.technicalScore}%</td>
                        <td className="py-3 px-4 font-mono">{s.communicationScore}%</td>

                        <td className="py-3 px-4">
                          {s.status === 'TERMINATED_VIOLATION' || s.warningCount >= 3 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Terminated (3 Violations)</span>
                            </span>
                          ) : s.warningCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>{s.warningCount} Warnings</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Verified Clean</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {s.startedAt ? new Date(s.startedAt).toLocaleDateString() : 'Recent'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setInspectSessionId(s.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GLOBAL SESSION CONTROLS & MANUAL QUESTION CONFIGURATION */}
      {/* ============================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Main Control Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-600" />
                  <span>AI Mock Interview Configuration Engine</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Changes made here take effect immediately for all candidates across every session.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving Changes...' : 'Save Configuration'}</span>
              </button>
            </div>

            {/* SECTION 1: LOCK / UNLOCK TOGGLE */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {settings.isLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
                    <span>Interview Module Access Status</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Locking the interview immediately prevents candidates from initiating new sessions.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold ${settings.isLocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {settings.isLocked ? 'LOCKED (Submissions Disabled)' : 'UNLOCKED (Open for Candidates)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, isLocked: !prev.isLocked }))}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      settings.isLocked ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.isLocked ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Assessment First Requirement Setting */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Require Assessment Completion to Unlock Interview
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    When enabled, candidates must complete and submit their assessment & test on the Student Portal before their interview session unlocks.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, requireAssessmentFirst: !prev.requireAssessmentFirst }))}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                    settings.requireAssessmentFirst ? 'bg-cyan-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.requireAssessmentFirst ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {settings.isLocked && (
                <div className="pt-3 border-t border-slate-200/80">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Locked Notice Message:
                  </label>
                  <input
                    type="text"
                    value={settings.lockReason}
                    onChange={(e) => setSettings(prev => ({ ...prev, lockReason: e.target.value }))}
                    placeholder="e.g. AI Mock Interview sessions are currently locked by the administrator."
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-medium"
                  />
                </div>
              )}
            </div>

            {/* SECTION 2: MANUAL QUESTION COUNT & DIFFICULTY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Question Count Setting */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Number of Questions to Ask
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {settings.questionCount} {settings.questionCount === 1 ? 'Question' : 'Questions'} Selected
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 3, 5, 7, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, questionCount: count }))}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                        settings.questionCount === count
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {count} {count === 1 ? 'Q' : 'Qs'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-slate-500">Custom Count:</span>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={settings.questionCount}
                    onChange={(e) => setSettings(prev => ({ ...prev, questionCount: Number(e.target.value) || 5 }))}
                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 text-center"
                  />
                  <span className="text-[11px] text-slate-400">(Max 15 questions per session)</span>
                </div>
              </div>

              {/* Difficulty Level Setting */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Question Difficulty Level
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {['Basic', 'Moderate', 'Advanced'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, difficulty: diff }))}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        settings.difficulty === diff
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  <strong>{settings.difficulty} Mode: </strong>
                  {settings.difficulty === 'Basic'
                    ? 'Foundational conceptual questions suitable for entry-level candidates.'
                    : settings.difficulty === 'Moderate'
                    ? 'Balanced mix of practical domain problems, architectural trade-offs, and behavioral scenarios.'
                    : 'Deep architectural queries, edge-case debugging, scalability, and system design.'}
                </p>
              </div>
            </div>

            {/* SECTION 3: PROCTORING & WARNING THRESHOLDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Proctoring Warnings */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Proctoring Warning Strikes (Auto-Termination)
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 5].map((warnings) => (
                    <button
                      key={warnings}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, maxWarnings: warnings }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        settings.maxWarnings === warnings
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {warnings} Warnings {warnings === 3 ? '(Default)' : ''}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Candidate session will terminate automatically upon reaching <strong>{settings.maxWarnings} warnings</strong> (Camera Closed / Multi-Face).
                </p>
              </div>

              {/* Default Role Preset */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Default Target Role Preset
                </label>

                <input
                  type="text"
                  value={settings.defaultRole}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultRole: e.target.value }))}
                  placeholder="e.g. Data Scientist, Software Engineer"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-cyan-500"
                />

                <p className="text-[11px] text-slate-400">
                  Initial pre-fill role when candidates launch the mock interview studio.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Last modified: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Just now'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchSettings}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Inspect Session Modal */}
      {inspectSessionId && (
        <Modal
          isOpen={!!inspectSessionId}
          onClose={() => setInspectSessionId(null)}
          title="Interview Session Deep Analysis & Telemetry"
          size="2xl"
        >
          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <InterviewAnalysisSection sessionId={inspectSessionId} />
          </div>
        </Modal>
      )}
    </div>
  );
};
