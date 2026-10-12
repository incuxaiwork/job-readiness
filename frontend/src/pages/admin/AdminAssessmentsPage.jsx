import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { SectionsEditorModal } from '../../components/admin/SectionsEditorModal';
import { parseQuestionsFromExcel, downloadExcelQuestionTemplate } from '../../utils/excelParser';
import {
  Layers,
  Plus,
  Play,
  Edit2,
  Eye,
  Archive,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Sparkles,
  BookOpen,
  Filter,
  Upload,
  Download,
  Trash2,
  Code2,
  Terminal,
  Calculator,
  Brain,
  Cpu,
  Check,
  ShieldCheck,
  AlertTriangle,
  Tag,
  Laptop,
  Zap,
  CheckSquare
} from 'lucide-react';

// Helper to authoritatively determine if a question is an interactive coding challenge
export const isCodingQuestion = (q) => {
  if (!q) return false;
  const cat = String(q.category || '').trim().toLowerCase();
  const type = String(q.type || '').trim().toLowerCase();
  const id = String(q.id || '').trim().toLowerCase();
  const topic = String(q.topic || '').trim().toLowerCase();

  const hasTestCases = (Array.isArray(q.testCases) && q.testCases.length > 0) ||
    (Array.isArray(q.test_cases) && q.test_cases.length > 0) ||
    (typeof q.test_cases === 'string' && q.test_cases.trim() !== '' && q.test_cases !== '[]' && q.test_cases !== 'null') ||
    (typeof q.testCases === 'string' && q.testCases.trim() !== '' && q.testCases !== '[]' && q.testCases !== 'null');

  const hasTemplates = !!(
    (q.starter_templates && typeof q.starter_templates === 'object' && Object.keys(q.starter_templates).length > 0) ||
    (q.starterTemplates && typeof q.starterTemplates === 'object' && Object.keys(q.starterTemplates).length > 0)
  );

  return type === 'coding' ||
    cat === 'coding' ||
    id.startsWith('code-') ||
    topic === 'coding' ||
    hasTestCases ||
    hasTemplates;
};

export const AdminAssessmentsPage = () => {
  const {
    assessments,
    addAssessment,
    updateAssessment,
    deleteAssessment,
    questionBank,
    addQuestion,
    addQuestionsBatch,
    addToast,
    startAssessment
  } = useApp();

  const [activeCatalogFilter, setActiveCatalogFilter] = useState('All');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [previewAsm, setPreviewAsm] = useState(null);
  const [sectionsAsm, setSectionsAsm] = useState(null);
  const [editingAsmId, setEditingAsmId] = useState(null);
  const [step2CategoryFilter, setStep2CategoryFilter] = useState('all');

  // Wizard state — a single unified assessment may mix coding + MCQ questions
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    category: 'Full',
    description: '',
    difficulty: 'Medium',
    durationMinutes: 60,
    passingScore: 60,
    selectedQuestionIds: [],
    totalQuestions: 10,
    tags: ['Coding', 'MCQ', 'Full Assessment']
  });

  const steps = [
    { num: 1, name: 'Track & Details' },
    { num: 2, name: 'Question Bank' },
    { num: 3, name: 'Engine Config' },
    { num: 4, name: 'Duration' },
    { num: 5, name: 'Passing Score' },
    { num: 6, name: 'Preview' },
    { num: 7, name: 'Publish' }
  ];

  // Determine current wizard track
  const isCodingTrack = (newAssessment.category || '').toLowerCase() === 'coding';
  const isAllMixTrack = ['all', 'all mix', 'full length', 'all mix (combined)'].includes((newAssessment.category || '').toLowerCase());
  const isFullTrack = (newAssessment.category || '').toLowerCase() === 'full';
  const isSectionalTrack = !isCodingTrack && !isAllMixTrack && !isFullTrack;

  // Filter assessments for catalog
  const filteredAssessments = useMemo(() => {
    if (activeCatalogFilter === 'All') return assessments;
    if (activeCatalogFilter === 'Coding') {
      return assessments.filter(a => (a.category || '').toLowerCase() === 'coding');
    }
    if (activeCatalogFilter === 'All Mix') {
      return assessments.filter(a => ['all mix', 'all', 'full length'].includes((a.category || '').toLowerCase()));
    }
    return assessments.filter(a => (a.category || '').toLowerCase() === activeCatalogFilter.toLowerCase());
  }, [assessments, activeCatalogFilter]);

  // Track counts in catalog
  const catalogCounts = useMemo(() => {
    return {
      all: assessments.length,
      coding: assessments.filter(a => (a.category || '').toLowerCase() === 'coding').length,
      aptitude: assessments.filter(a => (a.category || '').toLowerCase() === 'aptitude').length,
      reasoning: assessments.filter(a => (a.category || '').toLowerCase() === 'reasoning').length,
      technical: assessments.filter(a => (a.category || '').toLowerCase() === 'technical').length,
      verbal: assessments.filter(a => (a.category || '').toLowerCase() === 'verbal').length,
      allMix: assessments.filter(a => ['all mix', 'all', 'full length'].includes((a.category || '').toLowerCase())).length,
      full: assessments.filter(a => (a.category || '').toLowerCase() === 'full').length
    };
  }, [assessments]);

  // Open the single unified wizard — one assessment may contain coding + MCQ
  const handleOpenUnifiedWizard = () => {
    setEditingAsmId(null);
    const codingQs = questionBank.filter(isCodingQuestion);
    const mcqQs = questionBank.filter(q => !isCodingQuestion(q));
    const codingPick = Math.min(codingQs.length, 3);
    const initialIds = [
      ...codingQs.slice(0, codingPick).map(q => q.id),
      ...mcqQs.slice(0, Math.max(0, 10 - codingPick)).map(q => q.id)
    ];
    setNewAssessment({
      title: 'Comprehensive Job Readiness Assessment',
      category: 'Full',
      description: 'Full-length assessment mixing hands-on coding challenges with objective MCQs across Aptitude, Reasoning, Technical, and Verbal.',
      difficulty: 'Medium',
      durationMinutes: 60,
      passingScore: 60,
      selectedQuestionIds: initialIds,
      totalQuestions: initialIds.length || 10,
      tags: ['Coding', 'MCQ', 'Full Assessment']
    });
    setStep2CategoryFilter('all');
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleWizardExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const parsedList = await parseQuestionsFromExcel(
        file,
        newAssessment.category || 'Technical',
        'Assessment Questions'
      );

      // In Sectional Track, strictly ignore any questions that are coding questions
      const validQuestions = isSectionalTrack
        ? parsedList.filter(q => !isCodingQuestion(q))
        : isCodingTrack
        ? parsedList.filter(q => isCodingQuestion(q))
        : parsedList;

      if (validQuestions.length === 0) {
        addToast(isSectionalTrack ? 'No valid objective MCQ questions found in file (coding questions are not allowed in Sectional MCQs).' : 'No valid questions found in file', 'error');
        return;
      }

      addQuestionsBatch(validQuestions);

      const existingNumIds = questionBank
        .map(item => parseInt(item.id.replace('q-', ''), 10))
        .filter(n => !isNaN(n));
      let currentMax = existingNumIds.length > 0 ? Math.max(...existingNumIds) : 100;

      const importedIds = validQuestions.map(q => {
        if (q.id && q.id !== 'q-101') return q.id;
        currentMax += 1;
        return `q-${currentMax}`;
      });

      setNewAssessment(prev => ({
        ...prev,
        selectedQuestionIds: Array.from(new Set([...prev.selectedQuestionIds, ...importedIds]))
      }));
      addToast(`Imported & selected ${importedIds.length} questions from Excel!`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to parse Excel file', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleAutoSelectRandomQuestions = () => {
    const category = (newAssessment.category || 'Technical').trim();
    const targetCount = Number(newAssessment.totalQuestions) || 10;

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
    const cleanBank = Array.from(uniquePoolMap.values());

    const shuffle = (arr) => {
      const p = [...arr];
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      return p;
    };

    // Unified Full track: blend coding challenges with objective MCQs
    if (category.toLowerCase() === 'full' || isFullTrack) {
      const codingPool = cleanBank.filter(isCodingQuestion);
      const mcqPool = cleanBank.filter(q => !isCodingQuestion(q));
      const codingPick = Math.min(codingPool.length, Math.max(1, Math.round(targetCount * 0.3)));
      const mcqPick = Math.max(0, targetCount - codingPick);
      const picked = [
        ...shuffle(codingPool).slice(0, codingPick),
        ...shuffle(mcqPool).slice(0, mcqPick)
      ];
      if (picked.length < targetCount) {
        const remaining = cleanBank.filter(q => !picked.some(p => p.id === q.id));
        picked.push(...shuffle(remaining).slice(0, targetCount - picked.length));
      }
      const fullIds = Array.from(new Set(picked.map(q => q.id)));

      if (fullIds.length === 0) {
        addToast('No questions available in the bank. Add or upload questions first.', 'error');
        return;
      }

      setNewAssessment(prev => ({ ...prev, selectedQuestionIds: fullIds }));
      addToast(`Auto-selected ${fullIds.length} mixed questions (coding + MCQ) from the bank!`, 'success');
      return;
    }

    const isMix = ['All', 'Full Length', 'All Mix', 'All Mix (Combined)'].some(m => m.toLowerCase() === category.toLowerCase());

    let available = [];
    if (category.toLowerCase() === 'coding') {
      available = cleanBank.filter(isCodingQuestion);
    } else if (isMix) {
      // All Mix: strictly non-coding objective MCQs across all 4 pillars
      available = cleanBank.filter(q => !isCodingQuestion(q));
    } else {
      // Sectional MCQs: Strictly only questions of this category AND NOT coding questions
      available = cleanBank.filter(q =>
        (q.category && q.category.trim().toLowerCase() === category.toLowerCase()) &&
        !isCodingQuestion(q)
      );
    }

    if (available.length === 0) {
      addToast(`No questions available in database for category "${category}". Please upload or add ${category} questions to the bank first.`, 'error');
      return;
    }

    let selectedIds = [];

    if (isMix) {
      // Balanced mix across 4 objective MCQ categories (Aptitude, Reasoning, Technical, Verbal)
      const categories = ['Aptitude', 'Reasoning', 'Technical', 'Verbal'];
      const perCat = Math.max(1, Math.floor(targetCount / categories.length));
      const mixPool = [];

      categories.forEach(c => {
        const catQList = cleanBank.filter(q => (q.category || '').trim().toLowerCase() === c.toLowerCase() && !isCodingQuestion(q));
        const shuffledCat = [...catQList].sort(() => 0.5 - Math.random());
        mixPool.push(...shuffledCat.slice(0, perCat));
      });

      if (mixPool.length < targetCount) {
        const remaining = cleanBank.filter(q => !mixPool.some(m => m.id === q.id) && !isCodingQuestion(q));
        const shuffledRem = [...remaining].sort(() => 0.5 - Math.random());
        mixPool.push(...shuffledRem.slice(0, targetCount - mixPool.length));
      }

      selectedIds = Array.from(new Set(mixPool.map(q => q.id)));
    } else {
      // Single category Fisher-Yates shuffle
      const pool = [...available];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const numToPick = Math.min(targetCount, pool.length);
      selectedIds = Array.from(new Set(pool.slice(0, numToPick).map(q => q.id)));
    }

    setNewAssessment(prev => ({
      ...prev,
      selectedQuestionIds: selectedIds
    }));

    addToast(`Auto-selected ${selectedIds.length} ${category === 'Coding' ? 'coding challenges' : `${category} MCQ questions`} from database!`, 'success');
  };

  const handleToggleQuestionSelection = (id) => {
    const targetQ = questionBank.find(q => q.id === id);
    if (!isFullTrack) {
      if (!isCodingTrack && targetQ && isCodingQuestion(targetQ)) {
        addToast('Coding challenges cannot be added to an MCQ Assessment. They belong exclusively in Coding Assessments.', 'warning');
        return;
      }
      if (isCodingTrack && targetQ && !isCodingQuestion(targetQ)) {
        addToast('Only interactive coding challenges can be added to a Coding Assessment.', 'warning');
        return;
      }
    }

    if (newAssessment.selectedQuestionIds.includes(id)) {
      setNewAssessment(prev => ({
        ...prev,
        selectedQuestionIds: prev.selectedQuestionIds.filter(qId => qId !== id)
      }));
    } else {
      setNewAssessment(prev => ({
        ...prev,
        selectedQuestionIds: [...prev.selectedQuestionIds, id]
      }));
    }
  };

  const handleEditAssessment = (asm) => {
    setEditingAsmId(asm.id);
    const isEditingCoding = (asm.category || '').toLowerCase() === 'coding';
    const isEditingFull = (asm.category || '').toLowerCase() === 'full';

    // Strictly sanitize selectedQuestionIds for single-track assessments only.
    // Full (unified) assessments legitimately mix coding + MCQ, so keep both.
    let sanitizedIds = asm.selectedQuestionIds || [];
    if (!isEditingCoding && !isEditingFull) {
      sanitizedIds = sanitizedIds.filter(id => {
        const q = questionBank.find(item => item.id === id);
        return q && !isCodingQuestion(q);
      });
    }

    setNewAssessment({
      title: asm.title || '',
      category: asm.category || 'Technical',
      description: asm.description || '',
      difficulty: asm.difficulty || 'Medium',
      durationMinutes: Number(asm.durationMinutes) || 30,
      passingScore: Number(asm.passingScore) || 65,
      selectedQuestionIds: sanitizedIds,
      totalQuestions: Number(asm.totalQuestions) || sanitizedIds.length || 15,
      tags: asm.tags || ['DSA', 'Algorithms']
    });
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleFinishPublish = () => {
    if (!newAssessment.title.trim()) {
      addToast('Please enter an assessment title', 'error');
      setWizardStep(1);
      return;
    }

    // Sanitize selectedQuestionIds before saving. Full (unified) keeps coding + MCQ.
    let finalSelectedQuestionIds = [...newAssessment.selectedQuestionIds];
    if (isFullTrack) {
      finalSelectedQuestionIds = finalSelectedQuestionIds.filter(id => {
        const q = questionBank.find(item => item.id === id);
        return !!q;
      });
    } else if (isCodingTrack) {
      finalSelectedQuestionIds = finalSelectedQuestionIds.filter(id => {
        const q = questionBank.find(item => item.id === id);
        return q && isCodingQuestion(q);
      });
    } else {
      // Sectional and All Mix strictly purge coding questions
      finalSelectedQuestionIds = finalSelectedQuestionIds.filter(id => {
        const q = questionBank.find(item => item.id === id);
        return q && !isCodingQuestion(q);
      });
    }

    const actualTotalQuestions = (finalSelectedQuestionIds && finalSelectedQuestionIds.length > 0)
      ? finalSelectedQuestionIds.length
      : (Number(newAssessment.totalQuestions) || 5);

    if (editingAsmId) {
      updateAssessment({
        ...newAssessment,
        id: editingAsmId,
        selectedQuestionIds: finalSelectedQuestionIds,
        totalQuestions: actualTotalQuestions,
        estimatedTimeMin: newAssessment.durationMinutes
      });
    } else {
      addAssessment({
        ...newAssessment,
        selectedQuestionIds: finalSelectedQuestionIds,
        totalQuestions: actualTotalQuestions,
        estimatedTimeMin: newAssessment.durationMinutes
      });
    }

    setIsWizardOpen(false);
    setEditingAsmId(null);
    setWizardStep(1);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* HEADER WITH SINGLE UNIFIED CREATION BUTTON */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
              Admin Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Assessments Authoring & Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Build one unified assessment that mixes <strong>Hands-on Coding Challenges</strong> with <strong>Sectional MCQs</strong> across Aptitude, Reasoning, Technical, and Verbal — pick freely from every category.
          </p>
        </div>

        {/* Single Unified Creation Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenUnifiedWizard}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-700 hover:to-brand-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 border border-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* CATALOG CATEGORY FILTER BAR */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 flex-nowrap">
          {[
            { id: 'All', label: 'All Assessments', count: catalogCounts.all, icon: Layers },
            { id: 'Coding', label: 'Coding (Sandbox)', count: catalogCounts.coding, icon: Code2, color: 'text-indigo-600' },
            { id: 'Aptitude', label: 'Aptitude', count: catalogCounts.aptitude, icon: Calculator, color: 'text-emerald-600' },
            { id: 'Reasoning', label: 'Reasoning', count: catalogCounts.reasoning, icon: Brain, color: 'text-amber-600' },
            { id: 'Technical', label: 'Technical', count: catalogCounts.technical, icon: Cpu, color: 'text-cyan-600' },
            { id: 'Verbal', label: 'Verbal', count: catalogCounts.verbal, icon: BookOpen, color: 'text-blue-600' },
            { id: 'All Mix', label: 'Hybrid All-Mix', count: catalogCounts.allMix, icon: Sparkles, color: 'text-purple-600' },
            { id: 'Full', label: 'Full (Coding + MCQ)', count: catalogCounts.full, icon: Layers, color: 'text-emerald-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCatalogFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCatalogFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color || 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ASSESSMENT CATALOG CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map((asm) => {
          const isCoding = (asm.category || '').toLowerCase() === 'coding';
          const isMix = ['all mix', 'all', 'full length'].includes((asm.category || '').toLowerCase());
          const isFull = (asm.category || '').toLowerCase() === 'full';

          return (
            <div
              key={asm.id}
              className={`bg-white rounded-2xl border shadow-card p-6 flex flex-col justify-between space-y-4 transition-all hover:shadow-lg ${
                isCoding
                  ? 'border-t-4 border-t-indigo-500 border-slate-200 hover:border-indigo-400 bg-gradient-to-b from-indigo-50/15 to-white'
                  : isFull
                  ? 'border-t-4 border-t-emerald-500 border-slate-200 hover:border-emerald-400 bg-gradient-to-b from-emerald-50/15 to-white'
                  : isMix
                  ? 'border-t-4 border-t-purple-500 border-slate-200 hover:border-purple-400 bg-gradient-to-b from-purple-50/15 to-white'
                  : 'border-t-4 border-t-brand-500 border-slate-200 hover:border-brand-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1.5 ${
                    isCoding
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : isFull
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isMix
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-brand-50 text-brand-800 border border-brand-200'
                  }`}>
                    {isCoding ? <Code2 className="w-3 h-3 text-indigo-600" /> : isFull ? <Layers className="w-3 h-3 text-emerald-600" /> : isMix ? <Sparkles className="w-3 h-3 text-purple-600" /> : <BookOpen className="w-3 h-3 text-brand-600" />}
                    <span>{isCoding ? 'CODING SANDBOX' : isFull ? 'FULL · CODING + MCQ' : isMix ? 'HYBRID ALL-MIX' : `${asm.category} MCQ`}</span>
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {asm.status || 'Available'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{asm.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {asm.description}
                </p>

                {/* Features Pill Row */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {isCoding ? (
                    <>
                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded">
                        Monaco IDE
                      </span>
                      <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded">
                        Python • JS • Java • C++
                      </span>
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded">
                        Automated Grader
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                        Objective MCQs
                      </span>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                        Option Shuffling
                      </span>
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded">
                        Deterministic Grading
                      </span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-xl text-center text-xs border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Questions</span>
                    <strong className="text-slate-800">{asm.totalQuestions} Qs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                    <strong className="text-slate-800">{asm.durationMinutes} min</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Passing</span>
                    <strong className="text-slate-800">{asm.passingScore}%</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewAsm(asm)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Preview assessment details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSectionsAsm(asm)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                    title="Manage sections"
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditAssessment(asm)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 transition-colors"
                    title="Edit assessment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAssessment(asm.id)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
                    title="Delete assessment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => startAssessment(asm.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border shadow-2xs ${
                    isCoding
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'bg-brand-50 hover:bg-brand-100 text-brand-700 border-brand-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Live</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-STEP CREATE / EDIT ASSESSMENT WIZARD MODAL */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setEditingAsmId(null);
        }}
        title={editingAsmId ? 'Edit Assessment Specification' : 'Assessment Authoring Wizard'}
        subtitle={`Step ${wizardStep} of 7: ${steps[wizardStep - 1].name}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6 text-xs">
          
          {/* Wizard Step Progress Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 overflow-x-auto gap-2">
            {steps.map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  wizardStep === s.num
                    ? 'text-brand-600 font-bold'
                    : wizardStep > s.num
                    ? 'text-emerald-600 font-medium'
                    : 'text-slate-400'
                }`}
                onClick={() => setWizardStep(s.num)}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  wizardStep === s.num
                    ? 'bg-brand-600 text-white'
                    : wizardStep > s.num
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {wizardStep > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline text-[11px]">{s.name}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: TRACK & BASIC DETAILS */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              
              {/* UNIFIED ASSESSMENT BANNER */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-brand-50 border border-brand-200 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-brand-600 text-white flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Unified Assessment — Coding + MCQ</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    This assessment can mix hands-on coding challenges with objective MCQs from any pillar (Aptitude, Reasoning, Technical, Verbal). Pick questions freely in the next step — candidates will be routed per question type automatically.
                  </p>
                </div>
              </div>

              {/* TITLE & DESCRIPTION */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
                  <input
                    type="text"
                    value={newAssessment.title}
                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                    placeholder="e.g. Software Engineering Coding Assessment"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-brand-500 outline-none font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Questions Count *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newAssessment.totalQuestions}
                      onChange={(e) => setNewAssessment({ ...newAssessment, totalQuestions: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isCodingTrack ? 'Recommended: 2 to 4 coding challenges' : 'Recommended: 15 to 30 questions'}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Difficulty</label>
                    <select
                      value={newAssessment.difficulty}
                      onChange={(e) => setNewAssessment({ ...newAssessment, difficulty: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-800"
                    >
                      <option value="Easy">Easy (Foundation)</option>
                      <option value="Medium">Medium (Industry Standard)</option>
                      <option value="Hard">Hard (Competitive / Senior)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newAssessment.description}
                    onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                    placeholder="Provide instructions and overview for test-takers."
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: QUESTIONS ASSIGNMENT */}
          {wizardStep === 2 && (() => {
            const activeCategory = newAssessment.category || 'Technical';
            const catQuestionsInDb = isCodingTrack
              ? questionBank.filter(isCodingQuestion)
              : isFullTrack
              ? questionBank
              : isAllMixTrack
              ? questionBank.filter(q => !isCodingQuestion(q))
              : questionBank.filter(q => (q.category || '').trim().toLowerCase() === activeCategory.toLowerCase() && !isCodingQuestion(q));

            const filteredBank = questionBank.filter(q => {
              if (isCodingTrack) return isCodingQuestion(q);

              if (isFullTrack) {
                if (step2CategoryFilter === 'all') return true;
                if (step2CategoryFilter === 'coding') return isCodingQuestion(q);
                if (isCodingQuestion(q)) return false;
                return (q.category || '').trim().toLowerCase() === step2CategoryFilter.toLowerCase();
              }

              // Sectional and All-Mix tracks strictly exclude all coding questions
              if (isCodingQuestion(q)) return false;

              if (isSectionalTrack) {
                return (q.category || '').trim().toLowerCase() === activeCategory.toLowerCase();
              }
              // All Mix: optional sub-filter across the 4 objective MCQ pillars
              if (step2CategoryFilter !== 'all') {
                return (q.category || '').trim().toLowerCase() === step2CategoryFilter.toLowerCase();
              }
              return true;
            });

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    2. Question Assignment & Problem Selection
                  </h3>
                  <span className={`font-bold text-xs px-2.5 py-1 rounded-md border ${
                    isCodingTrack
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-brand-50 text-brand-600 border-brand-200'
                  }`}>
                    {newAssessment.selectedQuestionIds.length} Questions Selected
                  </span>
                </div>

                {/* DIFFERENTIATED TRACK BANNER */}
                {isFullTrack ? (
                  <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-brand-50/80 border border-brand-200 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-700" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Full Assessment — Coding + MCQ Repository
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-200 text-brand-800">
                              {catQuestionsInDb.length} Available in DB
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600">
                            Pick any mix of coding challenges and objective MCQs across all pillars
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAutoSelectRandomQuestions}
                        className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-700 hover:to-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Auto-Pick {newAssessment.totalQuestions} Mixed Questions</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 pt-1 border-t border-brand-200/60 overflow-x-auto">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'coding', label: 'Coding' },
                        { id: 'aptitude', label: 'Aptitude' },
                        { id: 'reasoning', label: 'Reasoning' },
                        { id: 'technical', label: 'Technical' },
                        { id: 'verbal', label: 'Verbal' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setStep2CategoryFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                            step2CategoryFilter === f.id
                              ? 'bg-slate-900 text-white'
                              : 'bg-white/80 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {f.id}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : isCodingTrack ? (
                  <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                            Interactive Coding Challenges Repository
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                            {catQuestionsInDb.length} Available in DB
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-700/90 mt-0.5 max-w-xl">
                          Only interactive coding challenges with compiler test runner configurations (Python, JS, C++, Java) are shown.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoSelectRandomQuestions}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Pick {newAssessment.totalQuestions} Challenges</span>
                    </button>
                  </div>
                ) : isSectionalTrack ? (
                  <div className="p-4 bg-brand-50/80 border border-brand-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-brand-950 uppercase tracking-wider">
                            {activeCategory} Objective Question Bank
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-200 text-brand-800">
                            {catQuestionsInDb.length} Available in DB
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-700/90 mt-0.5 max-w-xl">
                          Displaying multiple choice questions exclusively from the <strong>{activeCategory}</strong> skill pillar.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoSelectRandomQuestions}
                      className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Pick {newAssessment.totalQuestions} Questions</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-700" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                            Multi-Pillar All-Mix Assessment Questions
                          </h4>
                          <span className="text-[11px] text-emerald-700">
                            Blended objective MCQs across Aptitude, Reasoning, Technical, and Verbal
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAutoSelectRandomQuestions}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Auto-Pick Balanced MCQ Mix</span>
                      </button>
                    </div>

                    {/* All Mix Sub-Filter Tabs: Strictly non-coding MCQ pillars */}
                    <div className="flex items-center gap-1 pt-1 border-t border-emerald-200/60 overflow-x-auto">
                      {['all', 'aptitude', 'reasoning', 'technical', 'verbal'].map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setStep2CategoryFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                            step2CategoryFilter === f
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white/80 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          {f === 'all' ? 'All MCQs' : f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXCEL UPLOAD BANNER */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                    <Upload className="w-4 h-4 text-brand-600" />
                    <span>Upload Questions from Excel (.xlsx) / CSV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadExcelQuestionTemplate}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3 text-brand-600" />
                      <span>Download .xlsx Template</span>
                    </button>
                    <label className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs">
                      <Upload className="w-3 h-3" />
                      <span>Upload Excel File</span>
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleWizardExcelUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* QUESTIONS LIST */}
                <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
                  {filteredBank.map((q) => {
                    const isSelected = newAssessment.selectedQuestionIds.includes(q.id);
                    const isQCode = isCodingQuestion(q);
                    let testCasesCount = 0;
                    if (q.testCases?.length) testCasesCount = q.testCases.length;
                    else if (q.test_cases) {
                      try {
                        const parsed = typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases;
                        testCasesCount = parsed.length || 0;
                      } catch (e) {}
                    }

                    return (
                      <div
                        key={q.id}
                        onClick={() => handleToggleQuestionSelection(q.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? isQCode
                              ? 'bg-indigo-50/80 border-indigo-400 shadow-2xs'
                              : 'bg-brand-50/80 border-brand-400 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="space-y-1 max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 line-clamp-1 text-xs">{q.question}</span>
                            {isQCode ? (
                              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-extrabold text-[9px] flex items-center gap-1 shrink-0 border border-indigo-200">
                                <Code2 className="w-3 h-3" />
                                Coding
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[9px] shrink-0">
                                MCQ
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-bold text-slate-700">{q.category}</span>
                            <span>•</span>
                            <span>{q.topic || 'General'}</span>
                            <span>•</span>
                            <span className={`font-semibold ${
                              q.difficulty === 'Easy' ? 'text-emerald-600' : q.difficulty === 'Hard' ? 'text-rose-600' : 'text-amber-600'
                            }`}>{q.difficulty}</span>

                            {isQCode ? (
                              <>
                                <span>•</span>
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  {testCasesCount > 0 ? `${testCasesCount} Test Cases` : 'Standard Test Runner'}
                                </span>
                                <span>•</span>
                                <span className="text-slate-400">Python, JS, C++, Java</span>
                              </>
                            ) : (
                              <>
                                <span>•</span>
                                <span className="font-medium text-slate-600">
                                  {Array.isArray(q.options) ? `${q.options.length} Options` : '4 Options'}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-emerald-700">
                                  Key: {q.correctAnswer || q.correct_answer || 'A'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? isQCode ? 'bg-indigo-600 text-white' : 'bg-brand-600 text-white'
                            : 'border border-slate-300 bg-white'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* STEP 3: ENGINE CONFIGURATION */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                3. Execution & Testing Engine Configuration
              </h3>

              {(isCodingTrack || isFullTrack) && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Live Coding Studio & Sandboxed Runner Settings
                    </h4>
                  </div>
                  <div className="space-y-2.5 pt-1 divide-y divide-indigo-100">
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">Monaco Code Studio with Syntax Highlighting</strong>
                        <span className="text-slate-500 text-[11px]">Dark/Light themes with full LeetCode-style problem viewer</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">Multi-Language Compilers Enabled</strong>
                        <span className="text-slate-500 text-[11px]">Python 3.14, Node.js 24, GCC C++ 14.2, and OpenJDK Java 22</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">Confidential Hidden Test Case Evaluation</strong>
                        <span className="text-slate-500 text-[11px]">Authoritatively evaluates private test suites to prevent hardcoding</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">4.0-Second Sandbox Timeout Termination</strong>
                        <span className="text-slate-500 text-[11px]">Safely interrupts infinite loops with Time Limit Exceeded (TLE)</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                    </div>
                  </div>
                </div>
              )}

              {!isCodingTrack && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Objective Question Evaluation Rules
                    </h4>
                  </div>
                  <div className="space-y-2.5 pt-1 divide-y divide-slate-200">
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">Shuffle Question Sequence Randomly</strong>
                        <span className="text-slate-500 text-[11px]">Each candidate receives a randomized question order</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-600" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">Shuffle Option Choices (A, B, C, D)</strong>
                        <span className="text-slate-500 text-[11px]">Prevents neighbor-glancing and peer collaboration</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-600" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">Mark for Review & Navigation Palette</strong>
                        <span className="text-slate-500 text-[11px]">Candidates can revisit flagged questions before final submit</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-600" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <strong className="block text-slate-900">Negative Marking Penalty (-0.25)</strong>
                        <span className="text-slate-500 text-[11px]">Deduct 25% of marks for incorrect attempts</span>
                      </div>
                      <input type="checkbox" className="w-4 h-4 rounded text-brand-600" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SET DURATION */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">4. Set Assessment Duration</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Limit (Minutes) *</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={newAssessment.durationMinutes}
                    onChange={(e) => setNewAssessment({ ...newAssessment, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 outline-none font-bold text-slate-900"
                  />
                </div>

                <div className={`p-3 rounded-xl border text-[11px] ${
                  isCodingTrack ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : isFullTrack ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-brand-50 border-brand-200 text-brand-800'
                }`}>
                  {isCodingTrack ? (
                    <span>💡 <strong>Coding Assessment Recommendation</strong>: Algorithmic problems typically require 15 to 20 minutes each. For {newAssessment.totalQuestions} questions, 45 to 60 minutes provides an optimal testing window.</span>
                  ) : isFullTrack ? (
                    <span>💡 <strong>Full Assessment Recommendation</strong>: This assessment mixes coding challenges (~15-20 min each) with objective MCQs (~1 min each). For {newAssessment.totalQuestions} questions, 60 to 90 minutes is a realistic window.</span>
                  ) : (
                    <span>💡 <strong>MCQ Assessment Recommendation</strong>: Objective questions typically require 1 to 1.5 minutes per question. For {newAssessment.totalQuestions} questions, 25 to 35 minutes is standard.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SET PASSING SCORE */}
          {wizardStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">5. Set Passing Score & Readiness Benchmark</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Passing Benchmark Percentage (%) *</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newAssessment.passingScore}
                    onChange={(e) => setNewAssessment({ ...newAssessment, passingScore: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 outline-none font-bold text-slate-900"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Target Readiness Status:</span>
                    <strong className="text-emerald-700">"Job Ready" (Score ≥ {newAssessment.passingScore}%)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Below Threshold:</span>
                    <strong className="text-amber-700">"Needs Improvement" (Score &lt; {newAssessment.passingScore}%)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PREVIEW */}
          {wizardStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">6. Review Assessment Specification</h3>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-slate-500">Assessment Track:</span>
                  <span className={`px-2.5 py-0.5 rounded-md font-extrabold uppercase text-[10px] border flex items-center gap-1.5 ${
                    isCodingTrack
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      : isFullTrack
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : isAllMixTrack
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-brand-100 text-brand-800 border-brand-200'
                  }`}>
                    {isCodingTrack ? <Code2 className="w-3.5 h-3.5" /> : isFullTrack ? <Layers className="w-3.5 h-3.5" /> : isAllMixTrack ? <Sparkles className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                    <span>{isCodingTrack ? 'Coding Assessment' : isFullTrack ? 'Full · Coding + MCQ' : isAllMixTrack ? 'Hybrid All-Mix' : `${newAssessment.category} MCQ`}</span>
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Title:</span>
                  <strong className="text-slate-900">{newAssessment.title || 'Untitled Assessment'}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Category / Pillar:</span>
                  <strong className="text-slate-900">{newAssessment.category}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Questions Assigned:</span>
                  <strong className={isCodingTrack || isFullTrack ? 'text-indigo-600' : 'text-brand-600'}>
                    {(isCodingTrack || isFullTrack)
                      ? newAssessment.selectedQuestionIds.length
                      : newAssessment.selectedQuestionIds.filter(id => {
                          const q = questionBank.find(item => item.id === id);
                          return q && !isCodingQuestion(q);
                        }).length} Questions
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <strong className="text-slate-900">{newAssessment.durationMinutes} Minutes</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Passing Benchmark:</span>
                  <strong className="text-slate-900">{newAssessment.passingScore}%</strong>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  {isCodingTrack ? (
                    <span className="text-indigo-700 font-semibold">✓ Interactive Monaco IDE, multi-language sandbox, and confidential testcase grader enabled.</span>
                  ) : isFullTrack ? (
                    <span className="text-emerald-700 font-semibold">✓ Mixed engine: coding questions open the Monaco sandbox; MCQ questions get randomization, review palette, and instant scoring.</span>
                  ) : (
                    <span className="text-brand-700 font-semibold">✓ Objective MCQ question randomization, review palette, and instant scoring enabled.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PUBLISH */}
          {wizardStep === 7 && (
            <div className="space-y-4 text-center py-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
                isCodingTrack ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {isCodingTrack ? <Code2 className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Ready to Publish Assessment!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Clicking <strong>Publish Assessment</strong> will immediately save this {isCodingTrack ? 'Coding Assessment' : `${newAssessment.category} Assessment`} to PostgreSQL and make it live for all candidates in their dashboard.
              </p>
            </div>
          )}

          {/* NAVIGATION CONTROLS */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep(prev => prev - 1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-30 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {wizardStep < 7 ? (
              <button
                type="button"
                onClick={() => setWizardStep(prev => prev + 1)}
                className={`px-5 py-2 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs ${
                  isCodingTrack ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishPublish}
                className={`px-6 py-2 text-white rounded-xl font-bold shadow-md ${
                  isCodingTrack
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {editingAsmId ? 'Save Changes' : 'Publish Assessment'}
              </button>
            )}
          </div>

        </div>
      </Modal>

      {/* PREVIEW ASSESSMENT MODAL */}
      {previewAsm && (
        <Modal
          isOpen={!!previewAsm}
          onClose={() => setPreviewAsm(null)}
          title={`Assessment Preview: ${previewAsm.title}`}
          subtitle={`${previewAsm.category} • ${previewAsm.difficulty} • ${previewAsm.durationMinutes} min`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">{previewAsm.description}</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Questions</span>
                <strong className="text-slate-900 text-sm">{previewAsm.totalQuestions}</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Time Limit</span>
                <strong className="text-slate-900 text-sm">{previewAsm.durationMinutes} min</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Passing Score</span>
                <strong className="text-slate-900 text-sm">{previewAsm.passingScore}%</strong>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewAsm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewAsm(null);
                  startAssessment(previewAsm.id);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xs"
              >
                Launch Live Simulation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {sectionsAsm && (
        <SectionsEditorModal
          isOpen={!!sectionsAsm}
          onClose={() => setSectionsAsm(null)}
          assessment={sectionsAsm}
          addToast={addToast}
        />
      )}

    </div>
  );
};
