import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Target,
  Sparkles,
  GraduationCap,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '../../services/api';

export default function CompanyEligibilitySection({
  currentUser,
  sectionScores = {},
  displayResultMetrics = {},
  studentData = {}
}) {
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Fallback criteria data matching PostgreSQL seed data in case network is delayed
  const defaultCriteria = useMemo(() => [
    { id: 'cec_1', company: 'TCS', role: 'Ninja', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 55, coding_cutoff: 50, overall_readiness_cutoff: 60 },
    { id: 'cec_2', company: 'TCS', role: 'Digital', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 70, reasoning_cutoff: 70, verbal_cutoff: 65, technical_cutoff: 70, coding_cutoff: 70, overall_readiness_cutoff: 70 },
    { id: 'cec_3', company: 'TCS', role: 'Prime', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 75, reasoning_cutoff: 75, verbal_cutoff: 70, technical_cutoff: 80, coding_cutoff: 80, overall_readiness_cutoff: 75 },
    { id: 'cec_4', company: 'Infosys', role: 'SE', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 60, coding_cutoff: 60, overall_readiness_cutoff: 60 },
    { id: 'cec_5', company: 'Infosys', role: 'DSE', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 65, reasoning_cutoff: 65, verbal_cutoff: 60, technical_cutoff: 70, coding_cutoff: 70, overall_readiness_cutoff: 68 },
    { id: 'cec_6', company: 'Infosys', role: 'Specialist Programmer', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 70, reasoning_cutoff: 70, verbal_cutoff: 60, technical_cutoff: 75, coding_cutoff: 80, overall_readiness_cutoff: 75 },
    { id: 'cec_7', company: 'Capgemini', role: 'Analyst', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 60, coding_cutoff: 55, overall_readiness_cutoff: 60 },
    { id: 'cec_8', company: 'Capgemini', role: 'Software Engineer', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 65, reasoning_cutoff: 65, verbal_cutoff: 60, technical_cutoff: 65, coding_cutoff: 65, overall_readiness_cutoff: 65 },
    { id: 'cec_9', company: 'Accenture', role: 'ASE', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 65, coding_cutoff: 60, overall_readiness_cutoff: 65 },
    { id: 'cec_10', company: 'Accenture', role: 'Advanced ASE', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 65, reasoning_cutoff: 65, verbal_cutoff: 60, technical_cutoff: 70, coding_cutoff: 70, overall_readiness_cutoff: 68 },
    { id: 'cec_11', company: 'Wipro', role: 'Project Engineer', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 60, coding_cutoff: 55, overall_readiness_cutoff: 60 },
    { id: 'cec_12', company: 'Wipro', role: 'Turbo', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 65, reasoning_cutoff: 65, verbal_cutoff: 60, technical_cutoff: 70, coding_cutoff: 70, overall_readiness_cutoff: 68 },
    { id: 'cec_13', company: 'Cognizant', role: 'GenC', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 60, coding_cutoff: 60, overall_readiness_cutoff: 60 },
    { id: 'cec_14', company: 'Cognizant', role: 'GenC Pro', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 65, reasoning_cutoff: 65, verbal_cutoff: 60, technical_cutoff: 70, coding_cutoff: 70, overall_readiness_cutoff: 68 },
    { id: 'cec_15', company: 'Cognizant', role: 'GenC Next', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 70, reasoning_cutoff: 70, verbal_cutoff: 65, technical_cutoff: 75, coding_cutoff: 75, overall_readiness_cutoff: 72 },
    { id: 'cec_16', company: 'HCLTech', role: 'Graduate Engineer', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 65, coding_cutoff: 60, overall_readiness_cutoff: 62 },
    { id: 'cec_17', company: 'Tech Mahindra', role: 'Entry Level', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 60, coding_cutoff: 55, overall_readiness_cutoff: 60 },
    { id: 'cec_18', company: 'LTIMindtree', role: 'Entry Level', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 60, reasoning_cutoff: 60, verbal_cutoff: 60, technical_cutoff: 65, coding_cutoff: 60, overall_readiness_cutoff: 62 },
    { id: 'cec_19', company: 'IBM', role: 'Associate Developer', tenth_percentage: 65, twelfth_diploma_percentage: 65, graduation_percentage: 65, max_backlogs: 0, aptitude_cutoff: 65, reasoning_cutoff: 65, verbal_cutoff: 65, technical_cutoff: 70, coding_cutoff: 65, overall_readiness_cutoff: 68 },
    { id: 'cec_20', company: 'Deloitte', role: 'Analyst', tenth_percentage: 60, twelfth_diploma_percentage: 60, graduation_percentage: 60, max_backlogs: 0, aptitude_cutoff: 65, reasoning_cutoff: 65, verbal_cutoff: 65, technical_cutoff: 65, coding_cutoff: 60, overall_readiness_cutoff: 65 }
  ], []);

  // Fetch real-time company eligibility criteria from backend
  useEffect(() => {
    let mounted = true;
    async function loadCriteria() {
      try {
        setLoading(true);
        const res = await api.candidates.getCompanyEligibilityCriteria();
        if (mounted) {
          const list = Array.isArray(res?.data) && res.data.length > 0 ? res.data : defaultCriteria;
          setCriteriaList(list);
          if (list.length > 0) {
            setSelectedCompany(list[0].company);
            setSelectedRole(list[0].role);
          }
        }
      } catch (err) {
        console.error('Failed to load company eligibility criteria from API:', err);
        if (mounted) {
          setCriteriaList(defaultCriteria);
          setSelectedCompany(defaultCriteria[0].company);
          setSelectedRole(defaultCriteria[0].role);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCriteria();
    return () => { mounted = false; };
  }, [defaultCriteria]);

  // Distinct company names sorted
  const companies = useMemo(() => {
    const set = new Set();
    criteriaList.forEach(c => {
      if (c.company) set.add(c.company);
    });
    return Array.from(set).sort();
  }, [criteriaList]);

  // Roles available for currently selected company
  const rolesForCompany = useMemo(() => {
    return criteriaList
      .filter(c => c.company === selectedCompany)
      .map(c => c.role);
  }, [criteriaList, selectedCompany]);

  // Auto-select first role when company changes
  const handleCompanyChange = (comp) => {
    setSelectedCompany(comp);
    const available = criteriaList.filter(c => c.company === comp).map(c => c.role);
    if (available.length > 0) {
      setSelectedRole(available[0]);
    }
  };

  // Currently active criteria rule
  const currentCriteria = useMemo(() => {
    return criteriaList.find(c => c.company === selectedCompany && c.role === selectedRole) || criteriaList[0] || null;
  }, [criteriaList, selectedCompany, selectedRole]);

  // Student's REAL assessment marks and profile metrics
  const studentMetrics = useMemo(() => {
    const rawTenth = parseFloat(currentUser?.tenthMarks ?? currentUser?.tenth_marks ?? studentData?.tenthMarks ?? 0);
    const rawTwelfth = parseFloat(currentUser?.twelfthDiplomaMarks ?? currentUser?.twelfth_diploma_marks ?? studentData?.twelfthDiplomaMarks ?? 0);
    const rawGrad = parseFloat(currentUser?.graduationPercentage ?? currentUser?.graduation_percentage ?? studentData?.graduationPercentage ?? 0);
    // If graduation marks were saved on a 10.0 scale (e.g. 6.00 CGPA), normalize to 100-base %
    const gradNormalized = rawGrad > 0 && rawGrad <= 10 ? +(rawGrad * 10).toFixed(1) : rawGrad;
    const backlogs = parseInt(currentUser?.backlogs ?? studentData?.backlogs ?? 0, 10);

    const aptPct = Number(sectionScores?.aptitude?.pct ?? studentData?.categoryScores?.aptitude ?? currentUser?.aptitudeScore ?? 0);
    const reasonPct = Number(sectionScores?.reasoning?.pct ?? studentData?.categoryScores?.reasoning ?? currentUser?.reasoningScore ?? 0);
    const techPct = Number(sectionScores?.technical?.pct ?? studentData?.categoryScores?.technical ?? currentUser?.technicalScore ?? 0);
    const verbPct = Number(sectionScores?.verbal?.pct ?? studentData?.categoryScores?.verbal ?? currentUser?.verbalScore ?? 0);
    const codePct = Number(sectionScores?.coding?.pct ?? studentData?.categoryScores?.coding ?? currentUser?.codingScore ?? 0);
    const overallPct = Number(displayResultMetrics?.score ?? studentData?.overallScore ?? currentUser?.jobReadinessScore ?? 0);

    return {
      tenth: rawTenth,
      twelfth: rawTwelfth,
      graduation: gradNormalized,
      backlogs,
      aptitude: aptPct,
      reasoning: reasonPct,
      technical: techPct,
      verbal: verbPct,
      coding: codePct,
      overall: overallPct,
      // Real raw marks obtained / total
      aptMarks: sectionScores?.aptitude?.total > 0 ? `${sectionScores.aptitude.obtained}/${sectionScores.aptitude.total}` : null,
      reasonMarks: sectionScores?.reasoning?.total > 0 ? `${sectionScores.reasoning.obtained}/${sectionScores.reasoning.total}` : null,
      techMarks: sectionScores?.technical?.total > 0 ? `${sectionScores.technical.obtained}/${sectionScores.technical.total}` : null,
      verbMarks: sectionScores?.verbal?.total > 0 ? `${sectionScores.verbal.obtained}/${sectionScores.verbal.total}` : null,
      codeMarks: sectionScores?.coding?.total > 0 ? `${sectionScores.coding.obtained}/${sectionScores.coding.total}` : null,
    };
  }, [currentUser, sectionScores, displayResultMetrics, studentData]);

  // Detailed Analysis: Metrics Got vs Required Cutoffs
  const detailedAnalysis = useMemo(() => {
    if (!currentCriteria) return [];

    const items = [
      {
        id: 'aptitude',
        label: 'Quantitative Aptitude',
        category: 'Assessment Track',
        got: studentMetrics.aptitude,
        required: Number(currentCriteria.aptitude_cutoff ?? 60),
        unit: '%',
        marksDetail: studentMetrics.aptMarks,
        isAssessment: true
      },
      {
        id: 'reasoning',
        label: 'Logical Reasoning',
        category: 'Assessment Track',
        got: studentMetrics.reasoning,
        required: Number(currentCriteria.reasoning_cutoff ?? 60),
        unit: '%',
        marksDetail: studentMetrics.reasonMarks,
        isAssessment: true
      },
      {
        id: 'technical',
        label: 'Technical Knowledge',
        category: 'Assessment Track',
        got: studentMetrics.technical,
        required: Number(currentCriteria.technical_cutoff ?? 60),
        unit: '%',
        marksDetail: studentMetrics.techMarks,
        isAssessment: true
      },
      {
        id: 'verbal',
        label: 'Verbal Ability',
        category: 'Assessment Track',
        got: studentMetrics.verbal,
        required: Number(currentCriteria.verbal_cutoff ?? 60),
        unit: '%',
        marksDetail: studentMetrics.verbMarks,
        isAssessment: true
      },
      {
        id: 'coding',
        label: 'Coding & Algorithms',
        category: 'Assessment Track',
        got: studentMetrics.coding,
        required: Number(currentCriteria.coding_cutoff ?? 50),
        unit: '%',
        marksDetail: studentMetrics.codeMarks,
        isAssessment: true
      },
      {
        id: 'overall',
        label: 'Overall Job Readiness',
        category: 'Assessment Track',
        got: studentMetrics.overall,
        required: Number(currentCriteria.overall_readiness_cutoff ?? 60),
        unit: '%',
        marksDetail: displayResultMetrics.totalMarks > 0 ? `${displayResultMetrics.obtainedMarks}/${displayResultMetrics.totalMarks}` : null,
        isAssessment: true
      },
      {
        id: 'tenth',
        label: '10th Standard Marks',
        category: 'Academic Baseline',
        got: studentMetrics.tenth,
        required: Number(currentCriteria.tenth_percentage ?? 60),
        unit: '%',
        isAssessment: false
      },
      {
        id: 'twelfth',
        label: '12th / Diploma Marks',
        category: 'Academic Baseline',
        got: studentMetrics.twelfth,
        required: Number(currentCriteria.twelfth_diploma_percentage ?? 60),
        unit: '%',
        isAssessment: false
      },
      {
        id: 'graduation',
        label: 'Graduation Degree',
        category: 'Academic Baseline',
        got: studentMetrics.graduation,
        required: Number(currentCriteria.graduation_percentage ?? 60),
        unit: '%',
        isAssessment: false
      },
      {
        id: 'backlogs',
        label: 'Active Backlogs',
        category: 'Academic Baseline',
        got: studentMetrics.backlogs,
        required: Number(currentCriteria.max_backlogs ?? 0),
        unit: ' Backlogs',
        isInverse: true, // Lower or equal is better
        isAssessment: false
      }
    ];

    return items.map(item => {
      const isPassed = item.isInverse
        ? item.got <= item.required
        : item.got >= item.required;

      const diff = item.isInverse
        ? item.required - item.got
        : +(item.got - item.required).toFixed(1);

      return {
        ...item,
        isPassed,
        diff
      };
    });
  }, [currentCriteria, studentMetrics, displayResultMetrics]);

  // Overall Eligibility Summary
  const passedCount = detailedAnalysis.filter(d => d.isPassed).length;
  const totalCount = detailedAnalysis.length;
  const assessmentPassed = detailedAnalysis.filter(d => d.isAssessment && d.isPassed).length;
  const assessmentTotal = detailedAnalysis.filter(d => d.isAssessment).length;
  const academicPassed = detailedAnalysis.filter(d => !d.isAssessment && d.isPassed).length;
  const academicTotal = detailedAnalysis.filter(d => !d.isAssessment).length;

  const isFullyEligible = passedCount === totalCount;
  const isBorderline = !isFullyEligible && passedCount >= totalCount - 2;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
      
      {/* Section Header */}
      <div className="p-6 sm:p-8 bg-white border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Target Company Placement Diagnostics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Company Eligibility Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Select an enterprise recruiter and designated role to compare your real assessment scores and academic baseline against official recruitment cutoff criteria.
          </p>
        </div>

        {/* Dropdown Selection Panel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/90 shrink-0">
          
          {/* Company Dropdown */}
          <div className="relative min-w-[160px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2 mb-1">
              Recruiter / Company
            </label>
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full appearance-none bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs py-2.5 pl-9 pr-8 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-2xs"
              >
                {companies.map(c => (
                  <option key={c} value={c} className="bg-white text-slate-900 py-1">
                    {c}
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-brand-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="relative min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2 mb-1">
              Designation / Role
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full appearance-none bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs py-2.5 pl-9 pr-8 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-2xs"
              >
                {rolesForCompany.map(r => (
                  <option key={r} value={r} className="bg-white text-slate-900 py-1">
                    {r}
                  </option>
                ))}
              </select>
              <Briefcase className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 sm:p-8 space-y-8">
        
        {/* KPI Status Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Verdict Banner Card */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
            isFullyEligible
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : isBorderline
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isFullyEligible
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : isBorderline
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
            }`}>
              {isFullyEligible ? <CheckCircle2 className="w-6 h-6" /> : isBorderline ? <AlertTriangle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                Eligibility Verdict
              </span>
              <h4 className="text-sm font-black leading-tight">
                {isFullyEligible ? 'Eligible for Hiring Drives' : isBorderline ? 'Borderline Target' : 'Prerequisites Not Met'}
              </h4>
              <span className="text-[11px] font-semibold block mt-0.5 opacity-90">
                {selectedCompany} • {selectedRole}
              </span>
            </div>
          </div>

          {/* Criteria Passed Scorecard */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Criteria Met
              </span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {passedCount} <span className="text-xs font-bold text-slate-400">/ {totalCount}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500">
                {totalCount - passedCount === 0 ? 'All parameters cleared' : `${totalCount - passedCount} deficits identified`}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Award className="w-5 h-5" />
            </div>
          </div>

          {/* Assessment Cutoffs Met */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Assessment Tests
              </span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {assessmentPassed} <span className="text-xs font-bold text-slate-400">/ {assessmentTotal}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500">
                {assessmentPassed === assessmentTotal ? 'All test tracks cleared' : `${assessmentTotal - assessmentPassed} test cutoffs unmet`}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <Target className="w-5 h-5" />
            </div>
          </div>

          {/* Academic Criteria Met */}
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Academic Baseline
              </span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {academicPassed} <span className="text-xs font-bold text-slate-400">/ {academicTotal}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500">
                {academicPassed === academicTotal ? 'Academic criteria met' : 'Academic threshold deficit'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Detailed Comparison Matrix Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>Detailed Marks Got vs Required Cutoff for {selectedCompany} ({selectedRole})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Direct comparative analysis between your real marks and the recruitment benchmark.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Met Criteria
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                <XCircle className="w-3 h-3 text-rose-600" /> Deficit Shortfall
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Evaluation Parameter</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Your Marks Got</th>
                  <th className="py-3 px-3 text-center">Required Cutoff</th>
                  <th className="py-3 px-4 text-center min-w-[140px]">Visual Comparison</th>
                  <th className="py-3 px-3 text-center">Margin / Delta</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {detailedAnalysis.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Parameter Label */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span>{row.label}</span>
                      {row.marksDetail && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Database Score: {row.marksDetail} Marks
                        </span>
                      )}
                    </td>

                    {/* Category Track */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                        row.isAssessment
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {row.category}
                      </span>
                    </td>

                    {/* Marks Got */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-black text-slate-900">
                        {row.got}{row.unit}
                      </span>
                    </td>

                    {/* Required Cutoff */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs font-bold text-slate-600">
                        {row.isInverse ? `≤ ${row.required}${row.unit}` : `≥ ${row.required}${row.unit}`}
                      </span>
                    </td>

                    {/* Dual Visual Comparison Bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              row.isPassed ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, row.isInverse ? (row.got === 0 ? 100 : 0) : row.got))}%`
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>Got: {row.got}</span>
                          <span>Cutoff: {row.required}</span>
                        </div>
                      </div>
                    </td>

                    {/* Margin / Delta */}
                    <td className="py-3 px-3 text-center font-mono text-[11px] font-bold">
                      {row.isPassed ? (
                        <span className="text-emerald-600 inline-flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          {row.diff >= 0 ? `+${row.diff}%` : `${row.diff}`}
                        </span>
                      ) : (
                        <span className="text-rose-600 inline-flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          {row.diff}% Short
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                        row.isPassed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {row.isPassed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Cleared</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Deficit</span>
                          </>
                        )}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Prescriptive Summary */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Target Role Preparation Strategy for {selectedCompany}</span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {isFullyEligible
                ? `You meet all assessment and academic prerequisites for ${selectedCompany} - ${selectedRole}. We recommend polishing your live interview responses and practicing standard campus coding patterns.`
                : `To qualify for ${selectedCompany} - ${selectedRole}, prioritize improving ${
                    detailedAnalysis.filter(d => !d.isPassed).map(d => d.label).join(', ')
                  }. Retaking focused assessment practice modules will help clear these specific benchmark cutoffs.`}
            </p>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs">
              <span>Recruitment Cutoff: {currentCriteria?.overall_readiness_cutoff ?? 60}%</span>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
