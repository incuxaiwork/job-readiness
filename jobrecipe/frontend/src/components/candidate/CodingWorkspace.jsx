import React, { useState, useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  Code2,
  Copy,
  Check,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  FileText,
  Lightbulb,
  History,
  Send,
  Plus,
  CheckCheck,
  Cpu,
  Lock,
  Shield
} from 'lucide-react';
import { api } from '../../services/api';

const DEFAULT_STARTER_CODES = {
  python: `# Python 3
import sys

def solve():
    # Read input from standard input (stdin)
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Write your solution logic here
    

if __name__ == '__main__':
    solve()
`,
  javascript: `// JavaScript (Node.js 24)
const fs = require('fs');

function solve() {
    // Read input from standard input (stdin)
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;

    // Write your solution logic here

}

solve();
`,
  cpp: `// C++ (GCC 14.2)
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    // Optimize standard I/O operations
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input and write your solution logic here
    

    return 0;
}
`,
  java: `// Java (OpenJDK 22)
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Read input and write your solution logic here
        

        scanner.close();
    }
}
`,
  c: `// C (GCC)
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Read input and write your solution logic here

    return 0;
}
`,
  typescript: `// TypeScript
import * as fs from 'fs';

function solve(): void {
    const input: string = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;

    // Write your solution logic here

}

solve();
`
};

export const CodingWorkspace = ({
  question,
  savedAnswer,
  onSaveAnswer,
  onSubmitAssessment,
  addToast
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(
    savedAnswer?.language || question?.language || 'python'
  );
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(13);
  const [leftTab, setLeftTab] = useState('description'); // 'description' | 'editorial' | 'submissions'
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState('testcases'); // 'testcases' | 'results'
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [customTestCases, setCustomTestCases] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(null);
  const [runResults, setRunResults] = useState(null);
  const [showPostSubmitModal, setShowPostSubmitModal] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState(() => {
    if (savedAnswer?.score !== undefined && savedAnswer?.code) {
      return [{
        id: 'initial-sub',
        verdict: savedAnswer.verdict || (savedAnswer.score === 100 ? 'Accepted' : 'Evaluated'),
        passed: savedAnswer.score === 100,
        score: savedAnswer.score,
        passedTests: savedAnswer.passedTests ?? 0,
        totalTests: savedAnswer.totalTests ?? 0,
        samplePassed: savedAnswer.samplePassed ?? 0,
        sampleTotal: savedAnswer.sampleTotal ?? 0,
        hiddenPassed: savedAnswer.hiddenPassed ?? 0,
        hiddenTotal: savedAnswer.hiddenTotal ?? 0,
        allHiddenPassed: (savedAnswer.hiddenTotal ?? 0) === 0 || (savedAnswer.hiddenPassed === savedAnswer.hiddenTotal),
        timeMs: 45,
        language: savedAnswer.language || 'python',
        timestamp: 'Saved Submission',
        codeSnippet: (savedAnswer.code || '').slice(0, 120) + '...'
      }];
    }
    return [];
  });
  const [copiedInputIdx, setCopiedInputIdx] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSavePulse, setAutoSavePulse] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Fetch supported languages dynamically from backend remote executor
  useEffect(() => {
    api.code.getLanguages()
      .then(res => {
        if (res && res.languages && Array.isArray(res.languages)) {
          setAvailableLanguages(res.languages);
        }
      })
      .catch(() => {});
  }, []);

  const languagesList = useMemo(() => {
    if (availableLanguages.length > 0) return availableLanguages;
    return [
      { id: 'python', name: 'Python 3', version: '3.12' },
      { id: 'javascript', name: 'JavaScript', version: 'Node.js 20' },
      { id: 'cpp', name: 'C++', version: 'GCC 14.1' },
      { id: 'java', name: 'Java', version: 'OpenJDK 17' },
      { id: 'c', name: 'C', version: 'GCC 14.1' },
      { id: 'typescript', name: 'TypeScript', version: '5.6' }
    ];
  }, [availableLanguages]);

  // Extract starter templates
  const starterTemplates = useMemo(() => {
    let t = {};
    if (question?.starter_templates) {
      t = typeof question.starter_templates === 'string'
        ? JSON.parse(question.starter_templates)
        : question.starter_templates;
    }
    return {
      python: t.python || DEFAULT_STARTER_CODES.python,
      javascript: t.javascript || DEFAULT_STARTER_CODES.javascript,
      cpp: t.cpp || DEFAULT_STARTER_CODES.cpp,
      java: t.java || DEFAULT_STARTER_CODES.java,
      c: t.c || DEFAULT_STARTER_CODES.c,
      typescript: t.typescript || DEFAULT_STARTER_CODES.typescript
    };
  }, [question]);

  // Code state map: stores candidate code per language for this question
  const [codeMap, setCodeMap] = useState(() => {
    const initial = { ...starterTemplates };
    if (savedAnswer?.language && savedAnswer?.code) {
      initial[savedAnswer.language] = savedAnswer.code;
    }
    return initial;
  });

  const currentCode = codeMap[selectedLanguage] || starterTemplates[selectedLanguage] || '';
  const prevQuestionIdRef = useRef(question?.id);

  // Synchronize when question changes
  useEffect(() => {
    // Only clear execution results if the candidate navigated to a different question
    if (prevQuestionIdRef.current !== question?.id) {
      prevQuestionIdRef.current = question?.id;
      setRunResults(null);
    }

    if (savedAnswer?.language && savedAnswer?.code) {
      setSelectedLanguage(savedAnswer.language);
      setCodeMap(prev => ({
        ...prev,
        [savedAnswer.language]: savedAnswer.code
      }));
    } else {
      setCodeMap(prev => ({
        ...prev,
        python: prev.python || starterTemplates.python,
        javascript: prev.javascript || starterTemplates.javascript,
        cpp: prev.cpp || starterTemplates.cpp,
        java: prev.java || starterTemplates.java,
        c: prev.c || starterTemplates.c,
        typescript: prev.typescript || starterTemplates.typescript
      }));
    }
  }, [question?.id, savedAnswer?.language, savedAnswer?.code]);

  // Parse test cases from question
  const baseTestCases = useMemo(() => {
    let cases = [];
    if (Array.isArray(question?.test_cases)) cases = question.test_cases;
    else if (typeof question?.test_cases === 'string') {
      try { cases = JSON.parse(question.test_cases); } catch (e) {}
    } else if (Array.isArray(question?.options) && question?.type === 'Coding') {
      cases = question.options;
    }

    if (!cases || cases.length === 0) {
      cases = [
        { id: 1, input: '5\n1 2 3 4 5', expectedOutput: '15', explanation: 'Sample sum testcase', isHidden: false }
      ];
    }
    return cases;
  }, [question]);

  // Visible test cases for the runner
  const visibleTestCases = useMemo(() => {
    const fromBase = baseTestCases.filter(t => !(t.isHidden || t.is_hidden));
    return [...fromBase, ...customTestCases];
  }, [baseTestCases, customTestCases]);

  const activeTestCase = visibleTestCases[selectedTestCaseIndex] || visibleTestCases[0];

  const handleCodeChange = (newCode) => {
    setCodeMap(prev => ({
      ...prev,
      [selectedLanguage]: newCode
    }));

    setAutoSavePulse(true);
    setTimeout(() => setAutoSavePulse(false), 800);

    // Auto-save answer to parent while preserving all submission test metrics
    if (onSaveAnswer) {
      onSaveAnswer({
        language: selectedLanguage,
        code: newCode,
        score: runResults?.evaluation?.score ?? savedAnswer?.score ?? 0,
        passedTests: runResults?.evaluation?.passedTests ?? savedAnswer?.passedTests ?? 0,
        totalTests: baseTestCases.length,
        samplePassed: runResults?.summary?.samplePassed ?? savedAnswer?.samplePassed ?? 0,
        sampleTotal: runResults?.summary?.sampleTotal ?? savedAnswer?.sampleTotal ?? 0,
        hiddenPassed: runResults?.summary?.hiddenPassed ?? savedAnswer?.hiddenPassed ?? 0,
        hiddenTotal: runResults?.summary?.hiddenTotal ?? savedAnswer?.hiddenTotal ?? 0,
        verdict: runResults?.evaluation?.verdict ?? savedAnswer?.verdict
      });
    }
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to initial boilerplate template? Any changes in this language will be lost.')) {
      const template = starterTemplates[selectedLanguage] || DEFAULT_STARTER_CODES[selectedLanguage];
      handleCodeChange(template);
      if (addToast) addToast('Code reset to default template.', 'info');
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedInputIdx(idx);
    setTimeout(() => setCopiedInputIdx(null), 1800);
  };

  // Add custom testcase (LeetCode style)
  const handleAddCustomTestCase = () => {
    const newCase = {
      id: `custom-${Date.now()}`,
      input: '',
      expectedOutput: '',
      explanation: 'Custom Test Case',
      isCustom: true
    };
    setCustomTestCases(prev => [...prev, newCase]);
    setSelectedTestCaseIndex(visibleTestCases.length);
  };

  // Remove custom testcase
  const handleRemoveCustomTestCase = (indexToRemove) => {
    const baseCount = baseTestCases.filter(t => !(t.isHidden || t.is_hidden)).length;
    const customIdx = indexToRemove - baseCount;
    if (customIdx >= 0) {
      setCustomTestCases(prev => prev.filter((_, i) => i !== customIdx));
      setSelectedTestCaseIndex(Math.max(0, indexToRemove - 1));
    }
  };

  // 1. RUN CODE: executes sample/visible test cases in sandbox
  const handleRunCode = async () => {
    if (isRunning || isSubmitting) return;
    try {
      setIsRunning(true);
      setIsConsoleOpen(true);
      setConsoleTab('results');

      const payload = {
        language: selectedLanguage,
        sourceCode: currentCode,
        testCases: visibleTestCases
      };

      const res = await api.code.run(payload);

      if (res.status === 429 || res.data?.status === 'Rate Limited' || res.data?.status === 'Busy') {
        if (addToast) addToast(res.error || res.data?.error || 'Execution in progress or cooling down. Please wait a moment.', 'warning');
        return;
      }

      if (res.success && res.evaluation) {
        const evalRes = res.evaluation;
        setRunResults({
          ...res,
          isOfficialSubmission: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });

        if (evalRes.passed) {
          if (addToast) addToast(`Accepted! Passed ${evalRes.totalTests}/${evalRes.totalTests} sample testcases.`, 'success');
        } else if (evalRes.verdict === 'Compilation Error') {
          if (addToast) addToast('Compile Error. Check terminal output.', 'error');
        } else if (evalRes.verdict === 'Service Unavailable') {
          if (addToast) addToast('Code execution service is temporarily unavailable — you can still write and submit your code, it will be evaluated shortly.', 'error');
        } else {
          if (addToast) addToast(`${evalRes.verdict}: ${evalRes.passedTests}/${evalRes.totalTests} passed.`, 'warning');
        }
      } else {
        const errMsg = res.error || 'Code execution service is temporarily unavailable — you can still write and submit your code, it will be evaluated shortly.';
        if (addToast) addToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('Error running code:', err);
      const errMsg = err.status === 429
        ? (err.error || err.message || 'Please wait a moment before running code again.')
        : 'Code execution service is temporarily unavailable — you can still write and submit your code, it will be evaluated shortly.';
      if (addToast) addToast(errMsg, err.status === 429 ? 'warning' : 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // 2. SUBMIT CODE: executes against authoritative question test cases (including hidden)
  const handleSubmitCode = async () => {
    if (isRunning || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setIsConsoleOpen(true);
      setConsoleTab('results');

      const payload = {
        questionId: question?.id,
        question_id: question?.question_id,
        assessmentQuestionId: question?.id,
        language: selectedLanguage,
        sourceCode: currentCode,
        testCases: baseTestCases
      };

      setSubmissionProgress({ step: 'queued', progress: 10, message: 'Submission queued for evaluation...' });

      const res = await api.code.submit(payload, (prog) => {
        setSubmissionProgress(prog);
      });

      if (res.status === 429) {
        if (addToast) addToast(res.error || 'A submission or execution is already in progress. Please wait a moment.', 'warning');
        return;
      }

      if (res.success && res.evaluation) {
        const evalRes = res.evaluation;
        const summary = res.summary || {
          totalTests: evalRes.totalTests,
          passedTests: evalRes.passedTests,
          sampleTotal: evalRes.testResults?.filter(t => !t.isHidden).length || 0,
          samplePassed: evalRes.testResults?.filter(t => !t.isHidden && t.passed).length || 0,
          hiddenTotal: evalRes.testResults?.filter(t => t.isHidden).length || 0,
          hiddenPassed: evalRes.testResults?.filter(t => t.isHidden && t.passed).length || 0
        };

        const submissionEntry = {
          id: Date.now(),
          verdict: evalRes.verdict,
          passed: evalRes.passed,
          score: evalRes.score,
          earnedMarks: res.earnedMarks,
          maxMarks: res.maxMarks,
          passedTests: evalRes.passedTests,
          totalTests: evalRes.totalTests,
          samplePassed: summary.samplePassed,
          sampleTotal: summary.sampleTotal,
          hiddenPassed: summary.hiddenPassed,
          hiddenTotal: summary.hiddenTotal,
          allHiddenPassed: summary.hiddenTotal === 0 || summary.hiddenPassed === summary.hiddenTotal,
          timeMs: evalRes.testResults?.[0]?.timeMs || 45,
          language: selectedLanguage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          codeSnippet: currentCode.slice(0, 120) + '...'
        };

        setRunResults({
          ...res,
          isOfficialSubmission: true,
          submissionEntry,
          summary,
          timestamp: submissionEntry.timestamp
        });

        setSubmissionHistory(prev => [submissionEntry, ...prev]);

        if (evalRes.passed) {
          if (addToast) addToast(`🎉 Accepted! All ${evalRes.totalTests} testcases passed (including all hidden tests)! Score: ${evalRes.score}%`, 'success');
        } else if (summary.hiddenTotal > 0 && summary.samplePassed === summary.sampleTotal && summary.hiddenPassed < summary.hiddenTotal) {
          if (addToast) addToast(`⚠️ Passed sample test cases, but failed ${summary.hiddenTotal - summary.hiddenPassed} hidden testcase(s). Check edge cases!`, 'warning');
        } else {
          if (addToast) addToast(`${evalRes.verdict}: ${evalRes.passedTests}/${evalRes.totalTests} testcases passed.`, 'warning');
        }

        // Save officially evaluated answer to parent assessment
        if (onSaveAnswer) {
          onSaveAnswer({
            language: selectedLanguage,
            code: currentCode,
            score: evalRes.score,
            passedTests: evalRes.passedTests,
            totalTests: evalRes.totalTests,
            samplePassed: summary.samplePassed,
            sampleTotal: summary.sampleTotal,
            hiddenPassed: summary.hiddenPassed,
            hiddenTotal: summary.hiddenTotal,
            verdict: evalRes.verdict
          });
        }

        setShowPostSubmitModal(true);
      } else {
        const errMsg = res.error || 'Code execution service is temporarily unavailable — you can still write and submit your code, it will be evaluated shortly.';
        if (addToast) addToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('Error submitting code:', err);
      const errMsg = err.status === 429
        ? (err.error || 'A submission or execution is already in progress. Please wait a moment.')
        : 'Code execution service is temporarily unavailable — you can still write and submit your code, it will be evaluated shortly.';
      if (addToast) addToast(errMsg, err.status === 429 ? 'warning' : 'error');
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress(null);
    }
  };

  // Keyboard shortcut listener: Ctrl + ' (Run), Ctrl + Enter (Submit)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        handleRunCode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCode, selectedLanguage, visibleTestCases, isRunning, isSubmitting]);

  // Monaco Language Mapping
  const monacoLanguage = useMemo(() => {
    if (selectedLanguage === 'cpp') return 'cpp';
    if (selectedLanguage === 'c') return 'c';
    if (selectedLanguage === 'javascript') return 'javascript';
    if (selectedLanguage === 'typescript') return 'typescript';
    if (selectedLanguage === 'java') return 'java';
    return 'python';
  }, [selectedLanguage]);

  // LeetCode Difficulty Badge
  const difficulty = (question?.difficulty || 'Medium').toLowerCase();
  const difficultyBadge = {
    easy: 'text-[#00b8a3] bg-[#00b8a3]/10 border-[#00b8a3]/20',
    medium: 'text-[#ffc01e] bg-[#ffc01e]/10 border-[#ffc01e]/20',
    hard: 'text-[#ff375f] bg-[#ff375f]/10 border-[#ff375f]/20'
  }[difficulty] || 'text-[#ffc01e] bg-[#ffc01e]/10 border-[#ffc01e]/20';

  const isDark = editorTheme === 'vs-dark';

  return (
    <div className={`flex flex-col transition-all duration-200 ${
      isFullscreen
        ? 'fixed inset-0 z-50 bg-[#1a1a1a] text-zinc-100 p-3 h-screen overflow-hidden'
        : 'w-full rounded-2xl overflow-hidden border border-zinc-700/80 bg-[#1a1a1a] text-zinc-100 shadow-xl'
    }`}>
      
      {/* 1. LEETCODE TOP HEADER BAR */}
      <header className="px-4 py-2.5 bg-[#262626] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Problem Title & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-zinc-200 text-sm tracking-tight flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>{question?.question ? question.question.split('\n')[0].slice(0, 48) : 'Coding Challenge'}</span>
            </span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${difficultyBadge}`}>
            {question?.difficulty || 'Medium'}
          </span>

          <span className="text-zinc-400 font-medium text-[11px] hidden sm:inline">
            {question?.marks || 10} Marks
          </span>
        </div>

        {/* Right: Quick Tools (Theme, Font, Reset, Fullscreen) */}
        <div className="flex items-center gap-2">
          {autoSavePulse && (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> Auto-saved
            </span>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Toggle Editor Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            className="px-2.5 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg font-medium flex items-center gap-1 transition-colors"
            title="Reset code to boilerplate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Fullscreen IDE Mode */}
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen IDE' : 'Expand Fullscreen IDE'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Finish & Submit Assessment Button (Always accessible, especially in Fullscreen) */}
          {onSubmitAssessment && (
            <button
              onClick={onSubmitAssessment}
              className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all text-xs shadow-md shadow-emerald-900/40 cursor-pointer"
              title="Finish and submit the entire assessment"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finish Exam</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN SPLIT SCREEN: LEFT PROBLEM DESCRIPTION, RIGHT MONACO STUDIO */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden ${
        isFullscreen ? 'flex-1 h-[calc(100vh-100px)]' : 'min-h-[580px]'
      }`}>
        
        {/* LEFT PANE (5 cols): Description / Editorial / Submissions */}
        <div className="lg:col-span-5 bg-[#1e1e1e] border-r border-zinc-800 flex flex-col overflow-hidden">
          
          {/* Left Navigation Tabs */}
          <div className="px-3 pt-2 bg-[#262626] border-b border-zinc-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setLeftTab('description')}
              className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-1.5 transition-all border-b-2 ${
                leftTab === 'description'
                  ? 'border-emerald-500 text-zinc-100 bg-[#1e1e1e]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Description</span>
            </button>

            <button
              onClick={() => setLeftTab('editorial')}
              className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-1.5 transition-all border-b-2 ${
                leftTab === 'editorial'
                  ? 'border-emerald-500 text-zinc-100 bg-[#1e1e1e]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Editorial & Hints</span>
            </button>

            <button
              onClick={() => setLeftTab('submissions')}
              className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-1.5 transition-all border-b-2 ${
                leftTab === 'submissions'
                  ? 'border-emerald-500 text-zinc-100 bg-[#1e1e1e]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submissions</span>
              {submissionHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-zinc-800 text-emerald-400">
                  {submissionHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Description Panel */}
          {leftTab === 'description' && (
            <div className="p-5 overflow-y-auto flex-1 space-y-6 text-sm text-zinc-300 leading-relaxed">
              
              {/* Problem Title & Meta Header */}
              <div className="space-y-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-zinc-100 tracking-tight">
                  {question?.question ? question.question.split('\n')[0] : 'Coding Challenge'}
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${difficultyBadge}`}>
                    {question?.difficulty || 'Medium'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                    {question?.category || 'Coding'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                    {question?.topic || 'Algorithms'}
                  </span>
                </div>
              </div>

              {/* Problem Statement Details */}
              <div className="space-y-3 whitespace-pre-line text-zinc-200 leading-relaxed font-sans">
                {question?.question}
              </div>

              {/* LeetCode Formatted Examples */}
              <div className="space-y-4">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                  <span>Examples & Test Cases</span>
                </h3>

                {visibleTestCases.map((tc, idx) => (
                  <div key={idx} className="bg-[#262626] rounded-xl border border-zinc-800 p-4 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-zinc-400 font-sans font-bold text-[11px]">
                      <span>Example {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(tc.input, idx)}
                        className="hover:text-zinc-100 flex items-center gap-1 transition-colors font-mono"
                        title="Copy input"
                      >
                        {copiedInputIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedInputIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div>
                        <strong className="text-zinc-400 font-sans">Input: </strong>
                        <span className="text-emerald-300 bg-zinc-900/80 px-2 py-0.5 rounded">{tc.input || '(empty)'}</span>
                      </div>
                      <div>
                        <strong className="text-zinc-400 font-sans">Output: </strong>
                        <span className="text-zinc-100 bg-zinc-900/80 px-2 py-0.5 rounded">{tc.expectedOutput || tc.expected_output}</span>
                      </div>
                      {tc.explanation && (
                        <div className="text-zinc-400 pt-1 font-sans text-xs">
                          <strong className="text-zinc-300">Explanation: </strong>
                          <span>{tc.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Constraints Section */}
              {question?.constraints && (
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-zinc-100 text-sm">Constraints:</h3>
                  <div className="p-3.5 bg-[#262626] border border-zinc-800 rounded-xl space-y-1">
                    <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {question.constraints}
                    </pre>
                  </div>
                </div>
              )}

              {/* Standard I/O Instructions */}
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs space-y-1 text-indigo-200">
                <span className="font-bold block text-indigo-300 uppercase tracking-wider text-[10px]">
                  Standard Input / Output
                </span>
                <p className="leading-relaxed">
                  Read from standard input (<code className="bg-indigo-900/60 px-1 py-0.5 rounded text-indigo-100">sys.stdin</code>, <code className="bg-indigo-900/60 px-1 py-0.5 rounded text-indigo-100">cin</code>, <code className="bg-indigo-900/60 px-1 py-0.5 rounded text-indigo-100">Scanner</code>, or <code className="bg-indigo-900/60 px-1 py-0.5 rounded text-indigo-100">fs.readFileSync(0)</code>) and print solution to standard output.
                </p>
              </div>

            </div>
          )}

          {/* Tab 2: Editorial & Hints */}
          {leftTab === 'editorial' && (
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-4 bg-[#262626] border border-zinc-800 rounded-xl space-y-2">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5 text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>Algorithmic Hints & Strategy</span>
                </h3>
                <p className="text-zinc-300">
                  Analyze constraints carefully to select an optimal time and space complexity:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-400 pl-1">
                  <li><strong className="text-zinc-200">O(N) Target:</strong> Avoid nested loops if $N \ge 10^5$. Use hash maps, two pointers, or prefix sums.</li>
                  <li><strong className="text-zinc-200">Edge Cases:</strong> Check empty inputs, single element arrays, negative numbers, and boundary values.</li>
                  <li><strong className="text-zinc-200">Precision & Overflow:</strong> In C++ and Java, use 64-bit integers (<code className="text-amber-300">long long</code> / <code className="text-amber-300">long</code>) to prevent 32-bit overflow.</li>
                </ul>
              </div>

              <div className="p-4 bg-[#262626] border border-zinc-800 rounded-xl space-y-2">
                <h4 className="font-bold text-zinc-200">Execution Environment Limits</h4>
                <div className="grid grid-cols-2 gap-2 text-zinc-400 font-mono text-[11px]">
                  <div className="p-2 bg-zinc-900 rounded border border-zinc-800">Time Limit: 4.0s</div>
                  <div className="p-2 bg-zinc-900 rounded border border-zinc-800">Memory: 256 MB</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Submissions History */}
          {leftTab === 'submissions' && (
            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400">
                <span className="font-bold text-zinc-200">Your Submission History</span>
                <span>{submissionHistory.length} total</span>
              </div>

              {submissionHistory.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <History className="w-8 h-8 mx-auto text-zinc-600" />
                  <p>No submissions recorded yet for this challenge.</p>
                  <p className="text-[11px] text-zinc-600">Click "Submit" to evaluate your solution against all testcases.</p>
                </div>
              ) : (
                submissionHistory.map((sub) => (
                  <div key={sub.id} className="p-3 bg-[#262626] border border-zinc-800 rounded-xl space-y-1.5 hover:border-zinc-700 transition-all">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                        sub.passed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      }`}>
                        {sub.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {sub.verdict}
                      </span>
                      <span className="text-zinc-400 font-mono text-[11px]">{sub.timestamp}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-zinc-400 text-[11px]">
                      <span>
                        Passed {sub.passedTests}/{sub.totalTests} tests ({sub.score}%)
                        {sub.hiddenTotal > 0 && (
                          <span className="text-zinc-500 ml-1">
                            ({sub.samplePassed}/{sub.sampleTotal} sample, {sub.hiddenPassed}/{sub.hiddenTotal} hidden)
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-zinc-300 uppercase">{sub.language}</span>
                      <span>{sub.timeMs} ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* RIGHT PANE (7 cols): Language Bar, Monaco Editor & Testcase Console */}
        <div className="lg:col-span-7 bg-[#1a1a1a] flex flex-col overflow-hidden">
          
          {/* Editor Language & Settings Topbar */}
          <div className="px-4 py-2 bg-[#262626] border-b border-zinc-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSelectedLanguage(newLang);
                  handleCodeChange(codeMap[newLang] || starterTemplates[newLang]);
                }}
                className="bg-[#333333] hover:bg-[#3e3e3e] text-zinc-100 font-bold text-xs px-3 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
              >
                {languagesList.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} {lang.version ? `(${lang.version})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Font size select */}
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-[11px] hidden sm:inline">Font:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-[#333333] text-zinc-200 text-xs px-2 py-1 rounded border border-zinc-700 outline-none"
              >
                <option value={12}>12px</option>
                <option value={13}>13px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
              </select>
            </div>
          </div>

          {/* Monaco Editor Component */}
          <div className="flex-1 relative bg-[#1e1e1e]">
            <Editor
              height={isConsoleOpen ? (isFullscreen ? 'calc(100vh - 380px)' : '380px') : (isFullscreen ? 'calc(100vh - 160px)' : '540px')}
              language={monacoLanguage}
              theme={editorTheme}
              value={currentCode}
              onChange={handleCodeChange}
              options={{
                fontSize: fontSize,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 4,
                renderLineHighlight: 'all',
                fontFamily: 'Fira Code, Menlo, Monaco, Consolas, Courier New, monospace'
              }}
            />
          </div>

          {/* 3. LEETCODE BOTTOM TESTCASE / RESULT CONSOLE DRAWER */}
          {isConsoleOpen && (
            <div className="bg-[#202020] border-t border-zinc-800 flex flex-col h-[230px] overflow-hidden">
              
              {/* Console Tabs */}
              <div className="px-3 pt-1.5 bg-[#262626] border-b border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setConsoleTab('testcases')}
                    className={`px-3 py-1.5 rounded-t-lg font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                      consoleTab === 'testcases'
                        ? 'border-emerald-500 text-zinc-100 bg-[#202020]'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Testcase</span>
                  </button>

                  <button
                    onClick={() => setConsoleTab('results')}
                    className={`px-3 py-1.5 rounded-t-lg font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                      consoleTab === 'results'
                        ? 'border-emerald-500 text-zinc-100 bg-[#202020]'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Test Result</span>
                    {runResults && (
                      <span className={`w-2 h-2 rounded-full ${runResults.evaluation?.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    )}
                  </button>
                </div>

                {/* Close Console Toggle Button */}
                <button
                  onClick={() => setIsConsoleOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Minimize Console"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Console Tab 1: Testcases */}
              {consoleTab === 'testcases' && (
                <div className="p-3.5 overflow-y-auto flex-1 space-y-3 text-xs">
                  {/* Case selector pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleTestCases.map((tc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestCaseIndex(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          selectedTestCaseIndex === idx
                            ? 'bg-zinc-700 border-zinc-600 text-zinc-100 shadow-xs'
                            : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <span>Case {idx + 1}</span>
                        {tc.isCustom && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCustomTestCase(idx);
                            }}
                            className="text-zinc-500 hover:text-rose-400 ml-0.5"
                          >
                            ×
                          </span>
                        )}
                      </button>
                    ))}

                    <button
                      onClick={handleAddCustomTestCase}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 flex items-center gap-1 transition-all"
                      title="Add custom testcase"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Case</span>
                    </button>
                  </div>

                  {/* Active Case Details */}
                  {activeTestCase && (
                    <div className="space-y-2">
                      <div className="bg-[#181818] p-2.5 rounded-xl border border-zinc-800/90 font-mono text-xs">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                          Input:
                        </span>
                        {activeTestCase.isCustom ? (
                          <textarea
                            rows={2}
                            value={activeTestCase.input}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomTestCases(prev => prev.map(c => c.id === activeTestCase.id ? { ...c, input: val } : c));
                            }}
                            placeholder="Enter custom standard input..."
                            className="w-full bg-zinc-900 p-2 text-zinc-100 rounded border border-zinc-700 outline-none text-xs"
                          />
                        ) : (
                          <pre className="text-zinc-200 whitespace-pre-wrap">{activeTestCase.input}</pre>
                        )}
                      </div>

                      {activeTestCase.expectedOutput && !activeTestCase.isCustom && (
                        <div className="bg-[#181818] p-2.5 rounded-xl border border-zinc-800/90 font-mono text-xs">
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                            Expected Output:
                          </span>
                          <pre className="text-zinc-200 whitespace-pre-wrap">{activeTestCase.expectedOutput || activeTestCase.expected_output}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Console Tab 2: Test Result */}
              {consoleTab === 'results' && (
                <div className="p-3.5 overflow-y-auto flex-1 space-y-3 text-xs">
                  {(isRunning || isSubmitting) && (
                    <div className="py-8 text-center text-zinc-400 space-y-3">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="font-medium text-zinc-300">
                        {isSubmitting
                          ? (submissionProgress?.message || 'Evaluating against authoritative test suite...')
                          : 'Running solution on sandboxed compiler...'}
                      </p>
                      {isSubmitting && submissionProgress && (
                        <div className="max-w-xs mx-auto space-y-1.5">
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(10, Math.min(100, submissionProgress.progress || 10))}%` }}
                            />
                          </div>
                          {submissionProgress.totalTests > 0 && (
                            <p className="text-[11px] text-zinc-500">
                              Completed {submissionProgress.completedTests || 0} of {submissionProgress.totalTests} tests
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!isRunning && !isSubmitting && !runResults && savedAnswer?.code && (
                    <div className="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-zinc-200">Previously Submitted Solution</span>
                          <span className="text-zinc-500 font-mono text-[11px]">({savedAnswer.language || selectedLanguage})</span>
                        </div>
                        {savedAnswer.verdict && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            savedAnswer.verdict === 'Accepted'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800'
                          }`}>
                            {savedAnswer.verdict} ({savedAnswer.score ?? 0}%)
                          </span>
                        )}
                      </div>

                      {/* Saved Answer Metrics Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5 flex items-center gap-1">
                              <Terminal className="w-3 h-3 text-indigo-400" /> Visible Sample Tests
                            </span>
                            <p className="text-[11px] text-zinc-500">Public debugging testcases</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-zinc-100">
                              {savedAnswer.samplePassed ?? '-'} / {savedAnswer.sampleTotal ?? '-'} Passed
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-800/40 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-amber-400 uppercase font-bold block mb-0.5 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" /> Hidden Test Cases
                            </span>
                            <p className="text-[11px] text-amber-300/70">Authoritative evaluation</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-extrabold ${(savedAnswer.hiddenPassed ?? 0) === (savedAnswer.hiddenTotal ?? 0) && (savedAnswer.hiddenTotal ?? 0) > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {savedAnswer.hiddenPassed ?? '-'} / {savedAnswer.hiddenTotal ?? '-'} Passed
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-zinc-500">Your solution is saved. Click below to re-evaluate or edit code above.</p>
                        <button
                          onClick={handleSubmitCode}
                          disabled={isSubmitting || isRunning}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Re-evaluate</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!isRunning && !isSubmitting && !runResults && !savedAnswer?.code && (
                    <div className="py-8 text-center text-zinc-500 space-y-1">
                      <Terminal className="w-6 h-6 mx-auto text-zinc-600" />
                      <p>Run your code to see compilation and sample test outputs.</p>
                      <p className="text-[11px] text-zinc-600">Press Ctrl + ' to Run, or Ctrl + Enter to Submit.</p>
                    </div>
                  )}

                  {!isRunning && !isSubmitting && runResults?.evaluation && (
                    <div className="space-y-3">
                      {/* LeetCode Result Banner */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-base font-extrabold flex items-center gap-1.5 ${
                            runResults.evaluation.passed ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {runResults.evaluation.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            {runResults.evaluation.verdict}
                          </span>
                          <span className="text-zinc-400 font-medium">
                            ({runResults.evaluation.passedTests} / {runResults.evaluation.totalTests} testcases passed)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                          <span>Runtime: <strong className="text-zinc-200">{runResults.evaluation.testResults?.[0]?.timeMs || 52} ms</strong></span>
                          {runResults.isOfficialSubmission && (
                            <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                              Score: {runResults.evaluation.score}% ({runResults.earnedMarks}/{runResults.maxMarks} Marks)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PROMINENT SAMPLE VS HIDDEN TEST CASES SUMMARY PANEL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800/90">
                        {/* Visible / Sample Test Cases */}
                        <div className="flex items-center justify-between p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Sample Test Cases</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">Visible debugging cases</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-zinc-100">
                              <span className={(runResults.summary?.samplePassed ?? 0) === (runResults.summary?.sampleTotal ?? 0) && (runResults.summary?.sampleTotal ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {runResults.summary?.samplePassed ?? runResults.evaluation.testResults?.filter(t => !t.isHidden && t.passed).length ?? 0}
                              </span>
                              <span className="text-zinc-500 font-normal"> / {runResults.summary?.sampleTotal ?? runResults.evaluation.testResults?.filter(t => !t.isHidden).length ?? 0}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                              (runResults.summary?.samplePassed ?? 0) === (runResults.summary?.sampleTotal ?? 0) && (runResults.summary?.sampleTotal ?? 0) > 0
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                            }`}>
                              {(runResults.summary?.samplePassed ?? 0) === (runResults.summary?.sampleTotal ?? 0) && (runResults.summary?.sampleTotal ?? 0) > 0
                                ? 'All Sample Passed'
                                : 'Sample Failing'}
                            </span>
                          </div>
                        </div>

                        {/* Hidden / Confidential Test Cases */}
                        <div className="flex items-center justify-between p-3 bg-amber-950/20 rounded-xl border border-amber-800/40">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Hidden Test Cases</span>
                            </div>
                            <p className="text-[11px] text-amber-300/70 mt-0.5">
                              {runResults.isOfficialSubmission ? 'Evaluated on submission' : 'Evaluated on Submit'}
                            </p>
                          </div>
                          <div className="text-right">
                            {runResults.isOfficialSubmission ? (
                              <>
                                <div className="text-sm font-extrabold text-zinc-100">
                                  <span className={(runResults.summary?.hiddenPassed ?? 0) === (runResults.summary?.hiddenTotal ?? 0) ? 'text-emerald-400' : 'text-amber-400'}>
                                    {runResults.summary?.hiddenPassed ?? 0}
                                  </span>
                                  <span className="text-zinc-500 font-normal"> / {runResults.summary?.hiddenTotal ?? 0} Passed</span>
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                                  (runResults.summary?.hiddenTotal ?? 0) === 0 || (runResults.summary?.hiddenPassed ?? 0) === (runResults.summary?.hiddenTotal ?? 0)
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                                    : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                                }`}>
                                  {(runResults.summary?.hiddenTotal ?? 0) === 0 || (runResults.summary?.hiddenPassed ?? 0) === (runResults.summary?.hiddenTotal ?? 0)
                                    ? 'All Hidden Passed'
                                    : `${(runResults.summary?.hiddenTotal ?? 0) - (runResults.summary?.hiddenPassed ?? 0)} Hidden Failed`}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-amber-400/80 font-semibold italic">Evaluated on Submit</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Test case verdict tabs */}
                      <div className="flex flex-wrap items-center gap-2">
                        {runResults.evaluation.testResults?.map((tr, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedTestCaseIndex(idx)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              selectedTestCaseIndex === idx
                                ? 'bg-zinc-700 border-zinc-500 text-zinc-100 shadow-xs'
                                : 'bg-zinc-800 border-zinc-700/80 text-zinc-400'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${tr.passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <span>Case {idx + 1}</span>
                            {tr.isHidden && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-950/70 px-1 py-0.5 rounded border border-amber-800/40">
                                <Lock className="w-2.5 h-2.5" /> Hidden
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Detailed diff comparison for selected testcase */}
                      {runResults.evaluation.testResults?.[selectedTestCaseIndex] && (() => {
                        const tr = runResults.evaluation.testResults[selectedTestCaseIndex];
                        return (
                          <div className="space-y-2 font-mono text-xs">
                            {tr.stderr && (
                              <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-xl overflow-x-auto">
                                <span className="text-[10px] font-sans font-bold uppercase block text-rose-400 mb-1">Standard Error</span>
                                <pre className="whitespace-pre-wrap">{tr.stderr}</pre>
                              </div>
                            )}

                            {tr.isHidden ? (
                              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3 font-sans">
                                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                                    <Lock className="w-4 h-4" />
                                    <span>Hidden Test Case #{selectedTestCaseIndex + 1}</span>
                                    <span className="text-zinc-500 font-normal">({tr.timeMs || 45} ms)</span>
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold border ${
                                    tr.passed
                                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                      : 'bg-rose-950/80 text-rose-400 border-rose-800'
                                  }`}>
                                    {tr.status || (tr.passed ? 'Passed' : 'Wrong Answer')}
                                  </span>
                                </div>

                                <div className="text-zinc-300 text-xs space-y-2">
                                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                                    <strong className="text-zinc-300">Exam Integrity Protection:</strong> Test inputs, expected outputs, and exact diffs are concealed to safeguard assessment fairness and prevent hardcoding.
                                  </p>
                                  {tr.passed ? (
                                    <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 rounded-lg flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                      <span>Your solution executed within the time limit and produced the correct answer for this hidden test case!</span>
                                    </div>
                                  ) : (
                                    <div className="p-2.5 bg-rose-950/30 border border-rose-800/50 text-rose-300 rounded-lg space-y-1">
                                      <div className="flex items-center gap-2 font-bold text-rose-400">
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        <span>Hidden test case failed: {tr.status || 'Wrong Answer'}</span>
                                      </div>
                                      <p className="text-[11px] text-rose-300/80 pl-6">
                                        Recommendation: Re-check boundary conditions (e.g. 0, negatives, maximum constraints, single element vs large array, or potential integer overflows).
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="p-2.5 bg-[#181818] border border-zinc-800 rounded-xl">
                                  <span className="text-[10px] font-sans font-bold uppercase text-zinc-500 block mb-1">Expected Output</span>
                                  <pre className="text-zinc-200 whitespace-pre-wrap">{tr.expectedOutput}</pre>
                                </div>
                                <div className={`p-2.5 rounded-xl border ${
                                  tr.passed ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                                }`}>
                                  <span className="text-[10px] font-sans font-bold uppercase block mb-1">Your Output</span>
                                  <pre className="whitespace-pre-wrap font-bold">{tr.actualOutput || '(Empty Output)'}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* 4. LEETCODE BOTTOM ACTION BAR */}
          <footer className="px-4 py-2.5 bg-[#262626] border-t border-zinc-800 flex items-center justify-between text-xs">
            {/* Left: Console Toggle Button */}
            <button
              onClick={() => setIsConsoleOpen(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 font-bold flex items-center gap-1.5 transition-colors border border-zinc-700"
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Console</span>
              {isConsoleOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {/* Right: Run Code (Gray), Submit Code (Indigo/Emerald) and Finish Assessment (Emerald) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 hidden md:inline pr-2">
                Ctrl + ' to Run • Ctrl + Enter to Submit Code
              </span>

              {/* Run Code Button */}
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="px-3.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 active:scale-[0.98] text-zinc-100 rounded-lg font-bold flex items-center gap-1.5 transition-all border border-zinc-600 disabled:opacity-50 cursor-pointer"
                title="Run sample test cases"
              >
                {isRunning ? (
                  <div className="w-3 h-3 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-zinc-100" />
                )}
                <span>Run Code</span>
              </button>

              {/* Submit Code Button (Grades against sample + hidden tests) */}
              <button
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                title="Evaluate against all visible and hidden test cases"
              >
                {isSubmitting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>Submit Code</span>
              </button>

              {/* Finish & Submit Assessment Button */}
              {onSubmitAssessment && (
                <button
                  onClick={onSubmitAssessment}
                  disabled={isRunning || isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
                  title="Finish exam and view candidate AI scorecard"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finish Assessment</span>
                </button>
              )}
            </div>
          </footer>

        </div>

      </div>

      {/* POST-EVALUATION CONFIRMATION POPUP */}
      {showPostSubmitModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#222222] border border-zinc-700 text-zinc-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Code Evaluated &amp; Saved!</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Score: <strong className="text-emerald-400">{runResults?.evaluation?.score ?? savedAnswer?.score ?? 0}%</strong> ({runResults?.evaluation?.passedTests ?? savedAnswer?.passedTests ?? 0}/{runResults?.evaluation?.totalTests ?? savedAnswer?.totalTests ?? 0} Testcases Passed)
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Your solution for this question has been graded and recorded. Would you like to finish and submit the assessment now, or continue reviewing and testing?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPostSubmitModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Review Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPostSubmitModal(false);
                  if (onSubmitAssessment) onSubmitAssessment();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish &amp; Submit Exam</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
