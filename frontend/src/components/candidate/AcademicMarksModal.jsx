import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Award,
  BookOpen,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Percent,
  Loader2,
  FileText
} from 'lucide-react';

export const AcademicMarksModal = ({
  isOpen,
  onClose,
  onProceed,
  assessmentTitle = 'Assessment'
}) => {
  const { currentUser, setCurrentUser, addToast } = useApp();

  const [tenthMarks, setTenthMarks] = useState('');
  const [twelfthMarks, setTwelfthMarks] = useState('');
  const [graduationMarks, setGraduationMarks] = useState('');
  const [backlogs, setBacklogs] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate with existing marks if present in currentUser
  useEffect(() => {
    if (isOpen && currentUser) {
      const existingTenth = currentUser.tenth_marks ?? currentUser.tenthMarks ?? '';
      const existingTwelfth = currentUser.twelfth_diploma_marks ?? currentUser.twelfthDiplomaMarks ?? '';
      const existingGraduation = currentUser.graduation_percentage ?? currentUser.graduationPercentage ?? '';
      const existingBacklogs = currentUser.backlogs ?? 0;
      setTenthMarks(existingTenth !== '' && existingTenth !== null ? String(existingTenth) : '');
      setTwelfthMarks(existingTwelfth !== '' && existingTwelfth !== null ? String(existingTwelfth) : '');
      setGraduationMarks(existingGraduation !== '' && existingGraduation !== null ? String(existingGraduation) : '');
      setBacklogs(existingBacklogs !== '' && existingBacklogs !== null ? String(existingBacklogs) : '0');
      setError('');
    }
  }, [isOpen, currentUser]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const t = parseFloat(tenthMarks);
    const tw = parseFloat(twelfthMarks);
    const g = parseFloat(graduationMarks);
    const b = parseInt(backlogs, 10);

    if (tenthMarks === '' || isNaN(t)) {
      setError('Please enter your 10th standard percentage / marks.');
      return;
    }
    if (t < 0 || t > 100) {
      setError('10th marks must be a valid percentage between 0 and 100.');
      return;
    }

    if (twelfthMarks === '' || isNaN(tw)) {
      setError('Please enter your 12th / Diploma percentage / marks.');
      return;
    }
    if (tw < 0 || tw > 100) {
      setError('12th / Diploma marks must be a valid percentage between 0 and 100.');
      return;
    }

    if (graduationMarks === '' || isNaN(g)) {
      setError('Please enter your current Graduation percentage.');
      return;
    }
    if (g < 0 || g > 100) {
      setError('Graduation percentage must be a valid percentage between 0 and 100.');
      return;
    }

    if (backlogs === '' || isNaN(b) || b < 0) {
      setError('Please enter valid active backlogs count (0 or more).');
      return;
    }

    setLoading(true);
    try {
      const candidateId = currentUser?.id;
      if (candidateId) {
        await api.candidates.updateAcademicMarks(candidateId, {
          tenthMarks: t,
          twelfthDiplomaMarks: tw,
          graduationPercentage: g,
          backlogs: b
        });
      }

      // Update in-memory user profile
      setCurrentUser(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          tenth_marks: t,
          tenthMarks: t,
          twelfth_diploma_marks: tw,
          twelfthDiplomaMarks: tw,
          graduation_percentage: g,
          graduationPercentage: g,
          backlogs: b
        };
        localStorage.setItem('rsj_user', JSON.stringify(updated));
        return updated;
      });

      addToast?.('Academic details & backlogs saved successfully to your candidate profile!', 'success');
      onClose();
      if (onProceed) {
        onProceed();
      }
    } catch (err) {
      console.error('Failed to save academic marks:', err);
      setError(err.message || 'Failed to save marks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title="Academic Verification"
      subtitle={`Required before attempting ${assessmentTitle}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3.5 bg-brand-50/70 border border-brand-100 rounded-xl text-xs text-brand-900 leading-relaxed">
          <GraduationCap className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-brand-950">Enter Your Academic Marks & Backlogs</p>
            <p className="text-brand-700/90 text-[11px] mt-0.5">
              Please provide your 10th, 12th / Diploma, current Graduation percentage, and active backlogs. These are saved to your profile and used for company eligibility.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-4">
          
          {/* 10th Marks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-brand-600" />
                <span>10th Standard Marks / Percentage</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">0 - 100%</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="e.g. 85.50"
                value={tenthMarks}
                onChange={(e) => setTenthMarks(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* 12th / Diploma Marks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                <span>12th Standard / Diploma Percentage</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">0 - 100%</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="e.g. 82.00"
                value={twelfthMarks}
                onChange={(e) => setTwelfthMarks(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Current Graduation Percentage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Graduation Percentage</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">0 - 100%</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="e.g. 78.50"
                value={graduationMarks}
                onChange={(e) => setGraduationMarks(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Active Backlogs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Active Backlogs</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">0 if none</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                max="50"
                required
                placeholder="0"
                value={backlogs}
                onChange={(e) => setBacklogs(e.target.value)}
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                count
              </span>
            </div>
          </div>

        </div>

        {/* Security & Verification Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Recorded in your candidate profile and synced across recruiters.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Marks...</span>
              </>
            ) : (
              <>
                <span>Save & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
};
