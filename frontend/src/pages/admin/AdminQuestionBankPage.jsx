import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { parseQuestionsFromExcel, downloadExcelQuestionTemplate } from '../../utils/excelParser';
import {
  Database,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Copy,
  Edit2,
  Code2,
  CheckCircle2,
  Tag,
  Clock,
  Award,
  Folder,
  FolderOpen,
  BookOpen,
  Brain,
  Calculator,
  Code,
  Layers,
  Sparkles,
  ChevronRight,
  Download,
  Upload
} from 'lucide-react';

const FOLDERS = [
  {
    id: 'Coding',
    name: 'Coding Folder',
    category: 'Coding',
    description: 'Algorithmic challenges, code execution sandboxes, test suites (Python, JS, C++, Java)',
    icon: Code2,
    color: 'indigo',
    cardBg: 'bg-indigo-50/50 border-indigo-200/80 hover:border-indigo-400',
    activeCard: 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-500 shadow-md',
    iconBg: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-800'
  },
  {
    id: 'Aptitude',
    name: 'Aptitude Folder',
    category: 'Aptitude',
    description: 'Quantitative aptitude, arithmetic, ratios, probability & data interpretation',
    icon: Calculator,
    color: 'emerald',
    cardBg: 'bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-400',
    activeCard: 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-500 shadow-md',
    iconBg: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  {
    id: 'Reasoning',
    name: 'Reasoning Folder',
    category: 'Reasoning',
    description: 'Logical deduction, pattern recognition, syllogisms & analytical reasoning',
    icon: Brain,
    color: 'amber',
    cardBg: 'bg-amber-50/50 border-amber-200/80 hover:border-amber-400',
    activeCard: 'ring-2 ring-amber-500 bg-amber-50 border-amber-500 shadow-md',
    iconBg: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-100 text-amber-800'
  },
  {
    id: 'Technical',
    name: 'Technical Folder',
    category: 'Technical',
    description: 'Data structures, algorithms, OOP, SQL, web development & system design',
    icon: Code,
    color: 'brand',
    cardBg: 'bg-brand-50/50 border-brand-200/80 hover:border-brand-400',
    activeCard: 'ring-2 ring-brand-500 bg-brand-50 border-brand-500 shadow-md',
    iconBg: 'bg-brand-100 text-brand-700',
    badge: 'bg-brand-100 text-brand-800'
  },
  {
    id: 'Verbal',
    name: 'Verbal Folder',
    category: 'Verbal',
    description: 'Reading comprehension, grammar, vocabulary, synonyms & sentence correction',
    icon: BookOpen,
    color: 'purple',
    cardBg: 'bg-purple-50/50 border-purple-200/80 hover:border-purple-400',
    activeCard: 'ring-2 ring-purple-500 bg-purple-50 border-purple-500 shadow-md',
    iconBg: 'bg-purple-100 text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  }
];

export const AdminQuestionBankPage = () => {
  const { questionBank, addQuestion, addQuestionsBatch, updateQuestion, deleteQuestion, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    category: 'Coding',
    topic: 'Algorithms & Problem Solving',
    difficulty: 'Medium',
    type: 'Coding',
    question: '',
    codeSnippet: '',
    language: 'javascript',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    marks: 10,
    timeLimitSec: 300,
    tags: 'Algorithms, Data Structures',
    constraints: '1 <= N <= 10^5\nTime Limit: 4.0s\nMemory Limit: 256MB',
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '15', explanation: 'Sum of 5 numbers', isHidden: false },
      { input: '3\n10 20 30', expectedOutput: '60', explanation: 'Hidden test case', isHidden: true }
    ],
    starterTemplates: {
      python: '# Read from standard input and write to standard output\ndef solve():\n    import sys\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # Your logic here\n\nif __name__ == "__main__":\n    solve()',
      javascript: '// Read from standard input and write to standard output\nconst fs = require("fs");\n\nfunction main() {\n  const input = fs.readFileSync(0, "utf-8").trim();\n  if (!input) return;\n  // Your logic here\n}\n\nmain();',
      cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Your logic here\n    return 0;\n}',
      java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your logic here\n    }\n}'
    }
  });

  // Calculate stats & sub-topics per category folder
  const folderStats = useMemo(() => {
    const stats = {};
    FOLDERS.forEach(f => {
      const qInCat = questionBank.filter(q => q.category === f.category);
      const uniqueTopics = Array.from(new Set(qInCat.map(q => q.topic).filter(Boolean)));
      stats[f.category] = {
        count: qInCat.length,
        topics: uniqueTopics
      };
    });
    return stats;
  }, [questionBank]);

  // Extract available sub-topics based on selected folder/category
  const availableTopics = useMemo(() => {
    if (selectedCategory === 'All') {
      return Array.from(new Set(questionBank.map(q => q.topic).filter(Boolean)));
    }
    return Array.from(new Set(questionBank.filter(q => q.category === selectedCategory).map(q => q.topic).filter(Boolean)));
  }, [questionBank, selectedCategory]);

  const filteredQuestions = useMemo(() => {
    return questionBank.filter(q => {
      const matchSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'All' || q.category === selectedCategory;
      const matchTopic = selectedTopic === 'All' || q.topic === selectedTopic;
      const matchDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
      const matchType = selectedType === 'All' || q.type === selectedType;

      return matchSearch && matchCategory && matchTopic && matchDifficulty && matchType;
    });
  }, [questionBank, searchQuery, selectedCategory, selectedTopic, selectedDifficulty, selectedType]);

  const handleOpenAddModal = (catChoice = null) => {
    const cat = catChoice || (selectedCategory !== 'All' ? selectedCategory : 'Coding');
    const isCoding = cat === 'Coding';
    setFormData(prev => ({
      ...prev,
      category: cat,
      type: isCoding ? 'Coding' : 'Single Choice',
      topic: cat === 'Aptitude' ? 'Quantitative Aptitude'
           : cat === 'Reasoning' ? 'Logical Deduction'
           : cat === 'Verbal' ? 'Vocabulary & Antonyms'
           : cat === 'Coding' ? 'Algorithms & Problem Solving'
           : 'Data Structures',
      marks: isCoding ? 10 : 4,
      timeLimitSec: isCoding ? 300 : 60,
      tags: isCoding ? 'Algorithms, Coding, Data Structures' : prev.tags
    }));
    setIsAddModalOpen(true);
  };

  const handleCreateQuestion = (e) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      addToast('Please enter a question description', 'error');
      return;
    }

    const isCoding = formData.type === 'Coding' || formData.category === 'Coding';

    const options = isCoding ? [] : (formData.type === 'True/False' ? [
      { id: 'A', text: 'True' },
      { id: 'B', text: 'False' }
    ] : [
      { id: 'A', text: formData.optionA || 'Option A' },
      { id: 'B', text: formData.optionB || 'Option B' },
      { id: 'C', text: formData.optionC || 'Option C' },
      { id: 'D', text: formData.optionD || 'Option D' }
    ]);

    const newQ = {
      category: formData.category,
      topic: formData.topic,
      difficulty: formData.difficulty,
      type: isCoding ? 'Coding' : formData.type,
      question: formData.question,
      codeSnippet: isCoding ? null : (formData.codeSnippet || null),
      language: isCoding ? 'all' : formData.language,
      options: options,
      correctAnswer: isCoding ? 'TESTCASES' : formData.correctAnswer,
      explanation: formData.explanation || (isCoding ? 'Passes all visible and hidden automated test suites.' : 'Standard conceptual explanation.'),
      marks: Number(formData.marks) || (isCoding ? 10 : 4),
      timeLimitSec: Number(formData.timeLimitSec) || (isCoding ? 300 : 60),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      testCases: isCoding ? formData.testCases : undefined,
      test_cases: isCoding ? formData.testCases : undefined,
      starterTemplates: isCoding ? formData.starterTemplates : undefined,
      starter_templates: isCoding ? formData.starterTemplates : undefined,
      constraints: isCoding ? formData.constraints : undefined
    };

    addQuestion(newQ);
    setIsAddModalOpen(false);
    setFormData({
      category: 'Coding',
      topic: 'Algorithms & Problem Solving',
      difficulty: 'Medium',
      type: 'Coding',
      question: '',
      codeSnippet: '',
      language: 'javascript',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      marks: 10,
      timeLimitSec: 300,
      tags: 'Algorithms, Data Structures',
      constraints: '1 <= N <= 10^5\nTime Limit: 4.0s\nMemory Limit: 256MB',
      testCases: [
        { input: '5\n1 2 3 4 5', expectedOutput: '15', explanation: 'Sum of 5 numbers', isHidden: false },
        { input: '3\n10 20 30', expectedOutput: '60', explanation: 'Hidden test case', isHidden: true }
      ],
      starterTemplates: {
        python: '# Read from standard input and write to standard output\ndef solve():\n    import sys\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # Your logic here\n\nif __name__ == "__main__":\n    solve()',
        javascript: '// Read from standard input and write to standard output\nconst fs = require("fs");\n\nfunction main() {\n  const input = fs.readFileSync(0, "utf-8").trim();\n  if (!input) return;\n  // Your logic here\n}\n\nmain();',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Your logic here\n    return 0;\n}',
        java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your logic here\n    }\n}'
      }
    });
  };

  // Calculate next auto-generated unique ID
  const nextUniqueId = useMemo(() => {
    const existingNumIds = questionBank
      .map(q => parseInt(q.id.replace('q-', ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNumIds.length > 0 ? Math.max(...existingNumIds) + 1 : 101;
    return `q-${nextNum}`;
  }, [questionBank]);

  const handleDownloadTemplate = () => {
    const activeCat = selectedCategory !== 'All' ? selectedCategory : 'Aptitude';
    downloadExcelQuestionTemplate(activeCat);
    addToast(`Sample ${activeCat} Excel (.xlsx) template downloaded!`, 'success');
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const parsedList = await parseQuestionsFromExcel(file, selectedCategory !== 'All' ? selectedCategory : 'Technical', selectedTopic !== 'All' ? selectedTopic : 'General');
      if (parsedList.length === 0) {
        addToast('No valid questions found in file', 'error');
        return;
      }

      addQuestionsBatch(parsedList);
    } catch (err) {
      addToast(err.message || 'Failed to parse Excel file', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleDuplicate = (q) => {
    const duplicated = {
      ...q,
      id: null,
      question: `[Copy] ${q.question}`
    };
    addQuestion(duplicated);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. BREADCRUMB HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={() => { setSelectedCategory('All'); setSelectedTopic('All'); }}
              className="hover:text-brand-600 font-semibold flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Question Bank</span>
            </button>
            {selectedCategory !== 'All' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => setSelectedTopic('All')}
                  className={`font-semibold ${selectedTopic === 'All' ? 'text-slate-900 font-bold' : 'hover:text-brand-600'}`}
                >
                  {selectedCategory} Folder
                </button>
              </>
            )}
            {selectedTopic !== 'All' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900">{selectedTopic}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {selectedCategory === 'All'
              ? 'Subject Folders'
              : selectedTopic === 'All'
              ? `${selectedCategory} Topics`
              : `${selectedTopic} Questions`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {selectedCategory === 'All'
              ? 'Select a subject folder to view its topic folders and questions.'
              : selectedTopic === 'All'
              ? `Select a topic folder in ${selectedCategory} to view and manage its questions.`
              : `Managing questions for topic "${selectedTopic}" in ${selectedCategory}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCategory !== 'All' && (
            <button
              onClick={() => {
                if (selectedTopic !== 'All') setSelectedTopic('All');
                else setSelectedCategory('All');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              ⬅ Back
            </button>
          )}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Download sample Excel template for questions"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Download Excel Template (.xlsx)</span>
          </button>
          <label className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel (.xlsx) / CSV</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="hidden" />
          </label>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* 2. LEVEL 1: MAIN SUBJECT FOLDERS VIEW */}
      {selectedCategory === 'All' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            const stats = folderStats[f.category] || { count: 0, topics: [] };

            return (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedCategory(f.category);
                  setSelectedTopic('All');
                }}
                className={`p-6 rounded-3xl border transition-all cursor-pointer group flex flex-col justify-between ${f.cardBg} bg-white shadow-card hover:shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${f.iconBg} font-bold shadow-xs group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${f.badge}`}>
                      {stats.count} {stats.count === 1 ? 'Question' : 'Questions'}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-brand-700 transition-colors flex items-center justify-between">
                    <span>{f.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/70">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Topics ({stats.topics.length})</span>
                    <span className="font-bold text-brand-600 group-hover:underline">Open Folder &rarr;</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {stats.topics.length > 0 ? (
                      stats.topics.map((t, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-white/90 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                          📁 {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No topics added yet</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. QUESTIONS SECTION (DIRECTLY DISPLAYED FOR SELECTED FOLDER) */}
      <div className="space-y-4">
        
        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-4 space-y-3">
          
          {/* Active Folder Indicator & Topic Pills */}
          {selectedCategory !== 'All' && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Active Folder:</span>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-brand-600 text-white uppercase tracking-wider">
                  {selectedCategory} Folder
                </span>
                <span className="text-xs font-bold text-slate-400">({filteredQuestions.length} Questions)</span>
              </div>

              {/* Topic Filter Pills */}
              {availableTopics.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 text-[11px] font-bold">Filter Topic:</span>
                  <button
                    onClick={() => setSelectedTopic('All')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedTopic === 'All'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Topics
                  </button>
                  {availableTopics.map(top => (
                    <button
                      key={top}
                      onClick={() => setSelectedTopic(top)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedTopic === top
                          ? 'bg-brand-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {top}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search question text, topic, ID..."
                className="w-full pl-10 pr-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 outline-none text-slate-700"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Question Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 outline-none text-slate-700 font-semibold"
            >
              <option value="All">All Question Types</option>
              <option value="Coding">Coding Challenge</option>
              <option value="Single Choice">Single Choice</option>
              <option value="Code Snippet">Code Snippet</option>
              <option value="True/False">True/False</option>
            </select>

          </div>
        </div>

        {/* QUESTIONS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Questions Found</h4>
                <p className="text-xs text-slate-500">No questions exist in this topic folder yet.</p>
                <button
                  onClick={() => handleOpenAddModal(selectedCategory)}
                  className="mt-2 px-3.5 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Add Question Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Question & Options</th>
                      <th className="py-3.5 px-4">Topic</th>
                      <th className="py-3.5 px-4">Difficulty</th>
                      <th className="py-3.5 px-4">Correct Ans</th>
                      <th className="py-3.5 px-4">Marks / Time</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredQuestions.map((q) => {
                      const isCodingQ = q.type === 'Coding' || q.category === 'Coding';
                      const testCasesCount = (q.testCases || q.test_cases || []).length;

                      return (
                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 font-bold">
                            {q.id}
                          </td>
                          <td className="py-3.5 px-4 space-y-1.5">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              {isCodingQ && <Code2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                              <span>{q.question}</span>
                            </div>
                            
                            {/* Render Options or Coding summary */}
                            {isCodingQ ? (
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center gap-1">
                                  <Code2 className="w-3 h-3" />
                                  Coding Challenge
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                  {testCasesCount > 0 ? `${testCasesCount} Test Cases` : 'Interactive Test Suite'}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                                  Python • JS • C++ • Java
                                </span>
                              </div>
                            ) : q.options && q.options.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-[11px]">
                                {q.options.map((opt) => {
                                  const isCorrect = opt.id === q.correctAnswer;
                                  return (
                                    <div
                                      key={opt.id}
                                      className={`px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1.5 ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                          : 'bg-slate-50 border-slate-200 text-slate-600'
                                      }`}
                                    >
                                      <span className={`w-4 h-4 rounded-md text-[10px] flex items-center justify-center font-bold ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                      }`}>
                                        {opt.id}
                                      </span>
                                      <span className="truncate">{opt.text}</span>
                                      {isCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-auto flex-shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {q.topic}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : q.difficulty === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isCodingQ ? (
                              <span className="font-extrabold text-[11px] px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-1 w-fit">
                                <Code2 className="w-3 h-3" />
                                Automated Tests
                              </span>
                            ) : (
                              <span className="font-extrabold text-xs px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Option {q.correctAnswer}
                              </span>
                            )}
                          </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          <div><strong>{q.marks || 4}</strong> Marks</div>
                          <div className="text-slate-400">{q.timeLimitSec || 60} sec</div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewQuestion(q)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 transition-colors"
                              title="Preview full question details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(q)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                              title="Duplicate question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteQuestion(q.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* ADD QUESTION MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Question to Bank"
        subtitle="Create structured multiple-choice, coding, or true/false assessment questions"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
          
          {/* Unique Question ID Badge */}
          <div className="p-3 bg-brand-50/80 border border-brand-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Assigned Unique ID:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-brand-300 text-brand-700 shadow-2xs font-extrabold text-xs">
                {nextUniqueId}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Auto-assigned upon creation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const isCoding = cat === 'Coding';
                  setFormData(prev => ({
                    ...prev,
                    category: cat,
                    type: isCoding ? 'Coding' : (prev.type === 'Coding' ? 'Single Choice' : prev.type),
                    topic: isCoding ? 'Algorithms & Problem Solving' : prev.topic,
                    marks: isCoding ? 10 : 4,
                    timeLimitSec: isCoding ? 300 : 60
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold"
              >
                <option value="Coding">Coding</option>
                <option value="Technical">Technical</option>
                <option value="Aptitude">Aptitude</option>
                <option value="Reasoning">Reasoning</option>
                <option value="Verbal">Verbal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Question Type *</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const t = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    type: t,
                    category: t === 'Coding' ? 'Coding' : (prev.category === 'Coding' ? 'Technical' : prev.category),
                    marks: t === 'Coding' ? 10 : 4,
                    timeLimitSec: t === 'Coding' ? 300 : 60
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-slate-800"
              >
                <option value="Coding">Coding Challenge</option>
                <option value="Single Choice">Single Choice (MCQ)</option>
                <option value="Code Snippet">Code Snippet (MCQ)</option>
                <option value="True/False">True/False</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g. Binary Search Trees"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Difficulty *</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Question Statement / Problem Description *</label>
            <textarea
              rows={formData.type === 'Coding' ? 3 : 2}
              required
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder={formData.type === 'Coding' ? "Describe problem: Given an array of integers, return the sum of all elements..." : "e.g. Which algorithmic paradigm does Dijkstra's algorithm use?"}
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-brand-500 outline-none"
            />
          </div>

          {/* Coding Challenge Specifications */}
          {formData.type === 'Coding' ? (
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  <span>Coding Challenge Specifications</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Supports Python, JavaScript, C++, Java</span>
              </div>

              {/* Constraints */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Constraints</label>
                <textarea
                  rows={2}
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  placeholder="e.g. 1 <= N <= 10^5&#10;Time Limit: 4.0s&#10;Memory Limit: 256MB"
                  className="w-full p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] outline-none"
                />
              </div>

              {/* Test Cases Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Test Cases ({formData.testCases?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        testCases: [
                          ...(prev.testCases || []),
                          { input: '', expectedOutput: '', explanation: '', isHidden: false }
                        ]
                      }));
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Test Case</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {(formData.testCases || []).map((tc, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 text-xs">Test Case #{idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tc.isHidden ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {tc.isHidden ? 'Hidden (Grading)' : 'Visible (Sample)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 font-medium">
                            <input
                              type="checkbox"
                              checked={!!tc.isHidden}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  testCases: prev.testCases.map((c, i) => i === idx ? { ...c, isHidden: checked } : c)
                                }));
                              }}
                              className="rounded text-indigo-600"
                            />
                            <span>Hidden for scoring</span>
                          </label>

                          {(formData.testCases || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  testCases: prev.testCases.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Delete test case"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Input (stdin)</span>
                          <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                testCases: prev.testCases.map((c, i) => i === idx ? { ...c, input: val } : c)
                              }));
                            }}
                            placeholder="e.g. 5&#10;1 2 3 4 5"
                            className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Expected Output (stdout)</span>
                          <textarea
                            rows={2}
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                testCases: prev.testCases.map((c, i) => i === idx ? { ...c, expectedOutput: val } : c)
                              }));
                            }}
                            placeholder="e.g. 15"
                            className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Technical Code Snippet */}
              {formData.type === 'Code Snippet' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Code Snippet</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px]"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.codeSnippet}
                    onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                    placeholder="// Enter code snippet here"
                    className="w-full p-3 bg-slate-900 text-emerald-400 font-mono rounded-xl border border-slate-700 outline-none"
                  />
                </div>
              )}

              {/* Options */}
              {formData.type !== 'True/False' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option A</label>
                    <input
                      type="text"
                      value={formData.optionA}
                      onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                      placeholder="Option A description"
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option B</label>
                    <input
                      type="text"
                      value={formData.optionB}
                      onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                      placeholder="Option B description"
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option C</label>
                    <input
                      type="text"
                      value={formData.optionC}
                      onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                      placeholder="Option C description"
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option D</label>
                    <input
                      type="text"
                      value={formData.optionD}
                      onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                      placeholder="Option D description"
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                  Options will be automatically set to: <strong>A. True</strong> and <strong>B. False</strong>
                </div>
              )}
            </>
          )}

          {/* Correct Answer & Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {formData.type === 'Coding' ? 'Evaluation Method' : 'Correct Answer'}
              </label>
              {formData.type === 'Coding' ? (
                <div className="w-full px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Automated Sandbox</span>
                </div>
              ) : (
                <select
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  {formData.type !== 'True/False' && (
                    <>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </>
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Marks</label>
              <input
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Time Limit (Sec)</label>
              <input
                type="number"
                value={formData.timeLimitSec}
                onChange={(e) => setFormData({ ...formData, timeLimitSec: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xs"
            >
              Save Question
            </button>
          </div>
        </form>
      </Modal>

      {/* PREVIEW QUESTION MODAL */}
      {previewQuestion && (
        <Modal
          isOpen={!!previewQuestion}
          onClose={() => setPreviewQuestion(null)}
          title={`Question Preview: ${previewQuestion.id}`}
          subtitle={`${previewQuestion.category} • ${previewQuestion.topic} • ${previewQuestion.difficulty}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                {(previewQuestion.type === 'Coding' || previewQuestion.category === 'Coding') && (
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    Coding Challenge
                  </span>
                )}
                <span className="text-[11px] text-slate-500 font-semibold">{previewQuestion.marks || 4} Marks • {previewQuestion.timeLimitSec || 60}s</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-relaxed">{previewQuestion.question}</h3>
              {previewQuestion.codeSnippet && (
                <pre className="mt-3 p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto font-mono text-[11px]">
                  <code>{previewQuestion.codeSnippet}</code>
                </pre>
              )}
            </div>

            {/* Coding Challenge Details */}
            {(previewQuestion.type === 'Coding' || previewQuestion.category === 'Coding') ? (
              <div className="space-y-3">
                {previewQuestion.constraints && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                    <span className="font-bold block text-[10px] uppercase mb-1">Constraints:</span>
                    <pre className="font-mono text-[11px] whitespace-pre-wrap">{previewQuestion.constraints}</pre>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">
                    Test Cases ({(previewQuestion.testCases || previewQuestion.test_cases || []).length})
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(previewQuestion.testCases || previewQuestion.test_cases || []).map((tc, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-700">Test Case #{idx + 1}</span>
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            tc.isHidden ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {tc.isHidden ? 'Hidden (Scoring)' : 'Sample (Visible)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                          <div className="p-1.5 bg-white rounded border border-slate-200">
                            <span className="text-[9px] uppercase text-slate-400 font-bold block">Input:</span>
                            <span>{tc.input || '(empty)'}</span>
                          </div>
                          <div className="p-1.5 bg-white rounded border border-slate-200">
                            <span className="text-[9px] uppercase text-slate-400 font-bold block">Expected:</span>
                            <span>{tc.expectedOutput || tc.expected_output || '(empty)'}</span>
                          </div>
                        </div>
                        {tc.explanation && (
                          <div className="text-[10px] text-slate-500 italic">{tc.explanation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Options</span>
                {previewQuestion.options?.map(opt => (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      opt.id === previewQuestion.correctAnswer
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-xs font-bold">
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                    {opt.id === previewQuestion.correctAnswer && (
                      <span className="ml-auto text-[10px] uppercase font-bold text-emerald-600">Correct Answer</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {previewQuestion.explanation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                <span className="font-bold block text-[10px] uppercase mb-1">Explanation:</span>
                <p>{previewQuestion.explanation}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
