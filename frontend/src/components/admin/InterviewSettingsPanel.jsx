import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Unlock,
  Sliders,
  Save
} from 'lucide-react';

export const InterviewSettingsPanel = () => {
  const { addToast } = useApp();

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
    requireAssessmentFirst: false,
    defaultRole: 'Data Scientist'
  });

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/interview/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
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
          setSettings((prev) => ({ ...prev, ...data.settings }));
          if (addToast) {
            addToast(
              `Interview settings saved. Status: ${data.settings.isLocked ? 'LOCKED' : 'UNLOCKED'}, ${data.settings.questionCount} questions.`,
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
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        if (addToast) {
          addToast(
            nextLocked
              ? 'AI Mock Interview sessions are now locked.'
              : 'AI Mock Interview sessions are now unlocked.',
            nextLocked ? 'warning' : 'success'
          );
        }
      }
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  if (loadingSettings) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        Loading interview configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
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
                Locking the interview immediately prevents new interview sessions from starting.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                {settings.isLocked ? 'Locked' : 'Open'}
              </span>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  settings.isLocked ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.isLocked ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Assessment First Requirement */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Require Assessment Completion to Unlock Interview
              </span>
              <span className="text-[11px] text-slate-500 block">
                When enabled, candidates must complete and submit their assessments before their interview session unlocks.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, requireAssessmentFirst: !prev.requireAssessmentFirst }))}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                settings.requireAssessmentFirst ? 'bg-cyan-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
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
                onChange={(e) => setSettings((prev) => ({ ...prev, lockReason: e.target.value }))}
                placeholder="e.g. AI Mock Interview sessions are currently locked by the administrator."
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>
          )}
        </div>

        {/* SECTION 2: QUESTION VOLUME & DIFFICULTY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Questions Per Session
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 3, 5, 7, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, questionCount: count }))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.questionCount === count
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">Custom:</span>
              <input
                type="number"
                min="1"
                max="15"
                value={settings.questionCount}
                onChange={(e) => setSettings((prev) => ({ ...prev, questionCount: Number(e.target.value) || 1 }))}
                className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 text-center"
              />
              <span className="text-[11px] text-slate-400">(max 15)</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Basic', 'Moderate', 'Advanced'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, difficulty: diff }))}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.difficulty === diff
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              {settings.difficulty === 'Basic'
                ? 'Foundational conceptual questions suitable for entry-level candidates.'
                : settings.difficulty === 'Moderate'
                ? 'Balanced mix of practical domain problems, architectural trade-offs, and behavioral scenarios.'
                : 'Deep architectural queries, edge-case debugging, scalability, and system design.'}
            </p>
          </div>
        </div>

        {/* SECTION 3: PROCTORING & DEFAULT ROLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Proctoring Warning Strikes
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 5].map((warnings) => (
                <button
                  key={warnings}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, maxWarnings: warnings }))}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.maxWarnings === warnings
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {warnings} {warnings === 3 ? '(Default)' : ''}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Session terminates automatically after <strong>{settings.maxWarnings} warnings</strong> (camera closed / multi-face).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Default Target Role Preset
            </label>
            <input
              type="text"
              value={settings.defaultRole}
              onChange={(e) => setSettings((prev) => ({ ...prev, defaultRole: e.target.value }))}
              placeholder="e.g. Data Scientist, Software Engineer"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Initial pre-fill role when candidates launch the mock interview studio.
            </p>
          </div>
        </div>

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
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default InterviewSettingsPanel;
