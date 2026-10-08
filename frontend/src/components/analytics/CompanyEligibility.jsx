import React, { useMemo, useState, useEffect } from 'react';
import { computeEligibility, standardCompanyEligibilityCriteria } from '../../data/analyticsData';
import api from '../../services/api';
import { CheckCircle2, XCircle, AlertTriangle, Building2, GraduationCap, Award, HelpCircle } from 'lucide-react';

export default function CompanyEligibility({ student }) {
  const [criteriaList, setCriteriaList] = useState(standardCompanyEligibilityCriteria);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadCriteria() {
      try {
        setLoading(true);
        const res = await api.candidates.getCompanyEligibilityCriteria();
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : null);
        if (mounted && res.ok && list && list.length > 0) {
          setCriteriaList(list);
        }
      } catch (err) {
        console.warn('Using standard fallback criteria:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCriteria();
    return () => { mounted = false; };
  }, []);

  const eligibility = useMemo(
    () => computeEligibility(student, criteriaList),
    [student, criteriaList]
  );

  const eligible = eligibility.filter((e) => e.eligible);
  const borderline = eligibility.filter((e) => e.borderline);
  const notEligible = eligibility.filter((e) => !e.eligible && !e.borderline);

  const tierColors = {
    dream: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
    super_dream: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    regular: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' },
  };

  const tierLabels = { dream: 'Dream Company', super_dream: 'Super Dream', regular: 'Regular' };

  return (
    <section id="companies" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            Company Eligibility Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Matched against 10th, 12th/Diploma, current Graduation percentage, backlogs, and standardized assessment test cutoffs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Eligible ({eligible.length})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Borderline ({borderline.length})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Needs Improvement ({notEligible.length})
          </span>
        </div>
      </div>

      {/* Candidate Academic Baseline Profile Summary Bar */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-slate-600" />
          <span className="font-bold text-slate-700">Candidate Academic Profile:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div>
            <span className="text-slate-400">10th Std: </span>
            <span className="font-bold text-slate-800">{student?.tenthMarks ? `${student.tenthMarks}%` : 'Not Provided'}</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400">12th / Diploma: </span>
            <span className="font-bold text-slate-800">{student?.twelfthDiplomaMarks ? `${student.twelfthDiplomaMarks}%` : 'Not Provided'}</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400">Graduation %: </span>
            <span className="font-bold text-slate-800">{student?.graduationPercentage ? `${student.graduationPercentage}%` : 'Not Provided'}</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400">Active Backlogs: </span>
            <span className="font-bold text-slate-800">{student?.backlogs ?? 0}</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400">Readiness Score: </span>
            <span className="font-bold text-brand-600">{student?.overallScore ?? student?.jobReadinessScore ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* Eligible Companies */}
      {eligible.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Eligible Companies ({eligible.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligible.map((e) => (
              <CompanyCard key={e.company.id} eligibility={e} tierColors={tierColors} tierLabels={tierLabels} status="eligible" />
            ))}
          </div>
        </div>
      )}

      {/* Borderline Companies */}
      {borderline.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Borderline — Small Target Deficit ({borderline.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {borderline.map((e) => (
              <CompanyCard key={e.company.id} eligibility={e} tierColors={tierColors} tierLabels={tierLabels} status="borderline" />
            ))}
          </div>
        </div>
      )}

      {/* Not Eligible */}
      {notEligible.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-500" />
            Needs Preparation / Criteria Not Met ({notEligible.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notEligible.map((e) => (
              <CompanyCard key={e.company.id} eligibility={e} tierColors={tierColors} tierLabels={tierLabels} status="not_eligible" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CompanyCard({ eligibility, tierColors, tierLabels, status }) {
  const { company, matchPercent, gaps, academicStatus, candidateValues } = eligibility;
  const tc = tierColors[company.tier] || tierColors.regular;

  const statusColors = {
    eligible: 'border-emerald-300 ring-emerald-400 bg-white',
    borderline: 'border-amber-300 ring-amber-400 bg-white',
    not_eligible: 'border-slate-200/90 bg-white hover:border-slate-300',
  };

  const matchColors = {
    eligible: 'text-emerald-600',
    borderline: 'text-amber-600',
    not_eligible: 'text-rose-500',
  };

  return (
    <div className={`rounded-2xl p-5 border ${statusColors[status]} shadow-subtle hover:shadow-card transition-all flex flex-col justify-between`}>
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">{company.name}</h4>
            <p className="text-xs text-slate-500 font-medium">{company.role}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tc.badge}`}>
            {tierLabels[company.tier] || 'Regular'}
          </span>
        </div>

        {/* Match Percentage Progress */}
        <div className="flex items-center gap-3 mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400">Match</p>
            <p className={`text-base font-black ${matchColors[status]}`}>{matchPercent}%</p>
          </div>
          <div className="flex-1">
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === 'eligible' ? 'bg-emerald-500' : status === 'borderline' ? 'bg-amber-500' : 'bg-rose-400'
                }`}
                style={{ width: `${matchPercent}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase font-bold text-slate-400">Package</p>
            <p className="text-xs font-bold text-slate-800">{company.package}</p>
          </div>
        </div>

        {/* Academic Requirements vs Candidate Status */}
        <div className="mb-3 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Academic Requirements</div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className={`p-1.5 rounded-lg border text-[10px] ${
              academicStatus?.tenthPassed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'
            }`}>
              <div className="font-semibold text-slate-500">10th (≥{company.academics?.tenth}%)</div>
              <div className="font-bold flex items-center justify-center gap-1 mt-0.5">
                {academicStatus?.tenthPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-500" />}
                <span>{candidateValues?.tenth ? `${candidateValues.tenth}%` : 'N/A'}</span>
              </div>
            </div>

            <div className={`p-1.5 rounded-lg border text-[10px] ${
              academicStatus?.twelfthPassed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'
            }`}>
              <div className="font-semibold text-slate-500">12th (≥{company.academics?.twelfth}%)</div>
              <div className="font-bold flex items-center justify-center gap-1 mt-0.5">
                {academicStatus?.twelfthPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-500" />}
                <span>{candidateValues?.twelfth ? `${candidateValues.twelfth}%` : 'N/A'}</span>
              </div>
            </div>

            <div className={`p-1.5 rounded-lg border text-[10px] ${
              academicStatus?.gradPassed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'
            }`}>
              <div className="font-semibold text-slate-500">Grad (≥{company.academics?.graduation}%)</div>
              <div className="font-bold flex items-center justify-center gap-1 mt-0.5">
                {academicStatus?.gradPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-500" />}
                <span>{candidateValues?.graduation ? `${candidateValues.graduation}%` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Assessment Cutoffs */}
        <div className="mb-3 space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assessment Cutoffs</div>
          <div className="grid grid-cols-4 gap-1 text-[10px] text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block">Aptitude</span>
              <span className="font-bold text-slate-700">{company.cutoffs?.aptitude}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Reasoning</span>
              <span className="font-bold text-slate-700">{company.cutoffs?.reasoning}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Technical</span>
              <span className="font-bold text-slate-700">{company.cutoffs?.technical}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Verbal</span>
              <span className="font-bold text-slate-700">{company.cutoffs?.verbal}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gaps / Deficits section */}
      {gaps.length > 0 ? (
        <div className="bg-rose-50/50 rounded-xl p-2.5 border border-rose-100 mt-2">
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            Requirement Gaps:
          </p>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {gaps.map((gap, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-700 font-medium">{gap.category}</span>
                {gap.note ? (
                  <span className="text-rose-600 font-bold">{gap.note}</span>
                ) : (
                  <span className="text-rose-600 font-bold">
                    Need +{gap.deficit}% ({gap.current}% → {gap.required}%)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/60 rounded-xl p-2 border border-emerald-100 text-center mt-2">
          <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            All Academic & Assessment Criteria Met
          </span>
        </div>
      )}
    </div>
  );
}
