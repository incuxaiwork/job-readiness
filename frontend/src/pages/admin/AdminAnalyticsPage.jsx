import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Award,
  Filter,
  Calendar,
  AlertTriangle,
  ChevronDown,
  Download,
  RefreshCw,
  Building,
  Layers,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AdminAnalyticsPage = () => {
  const { addToast } = useApp();

  const [dateFilter, setDateFilter] = useState('All Time');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [assessmentFilter, setAssessmentFilter] = useState('All');

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch live analytics from database API
  const fetchAnalytics = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      setError(null);

      const params = {};
      if (dateFilter && dateFilter !== 'All Time') params.dateRange = dateFilter;
      if (collegeFilter && collegeFilter !== 'All') params.college = collegeFilter;
      if (assessmentFilter && assessmentFilter !== 'All') params.assessmentId = assessmentFilter;

      const res = await api.admin.analytics(params);

      if (res && res.ok && res.data && res.data.success) {
        setAnalyticsData(res.data);
        if (showToast) {
          addToast('Analytics refreshed from database.', 'success');
        }
      } else {
        const errMsg = res?.error || 'Failed to load analytics from database.';
        setError(errMsg);
        if (showToast) addToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('Error loading admin analytics:', err);
      const errMsg = err.message || 'Error communicating with analytics service.';
      setError(errMsg);
      if (showToast) addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFilter, collegeFilter, assessmentFilter, addToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Extract KPIs safely
  const kpis = useMemo(() => {
    return analyticsData?.kpis || {
      candidatesTested: 0,
      totalSubmissions: 0,
      avgScore: 0,
      avgAccuracy: 0,
      passRate: 0,
      jobReadinessRate: 0,
      maxScore: 0,
      minScore: 0
    };
  }, [analyticsData]);

  // Chart 1: Live Score Distribution
  const distributionData = useMemo(() => {
    const defaultLabels = ['< 50% (Needs Training)', '50-65% (Developing)', '66-80% (Job Ready)', '80%+ (High Achiever)'];
    const dist = analyticsData?.scoreDistribution || [];

    return {
      labels: dist.length > 0 ? dist.map(d => d.label) : defaultLabels,
      datasets: [
        {
          label: 'Candidates Count',
          data: dist.length > 0 ? dist.map(d => d.count) : [0, 0, 0, 0],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(14, 140, 230, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ],
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    };
  }, [analyticsData]);

  // Chart 2: Live Category Performance
  const categoryData = useMemo(() => {
    const defaultLabels = ['Quantitative Aptitude', 'Logical Reasoning', 'Technical Engineering'];
    const cats = analyticsData?.categoryAverages || [];

    return {
      labels: cats.length > 0 ? cats.map(c => c.category) : defaultLabels,
      datasets: [
        {
          label: 'Average Score (%)',
          data: cats.length > 0 ? cats.map(c => c.avgScore) : [0, 0, 0],
          backgroundColor: ['#0e8ce6', '#8b5cf6', '#10b981'],
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    };
  }, [analyticsData]);

  // Chart 3: Live Performance Trend
  const trendData = useMemo(() => {
    const trend = analyticsData?.trend || [];
    const labels = trend.length > 0 ? trend.map(t => t.label) : ['Recent'];
    const data = trend.length > 0 ? trend.map(t => t.avgScore) : [kpis.avgScore];

    return {
      labels,
      datasets: [
        {
          label: 'Average Score (%)',
          data,
          borderColor: '#0e8ce6',
          backgroundColor: 'rgba(14, 140, 230, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#0e8ce6',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }, [analyticsData, kpis.avgScore]);

  // Trend Progression Delta Calculation
  const trendGrowth = useMemo(() => {
    const trend = analyticsData?.trend || [];
    if (trend.length < 2) return null;
    const first = trend[0].avgScore;
    const last = trend[trend.length - 1].avgScore;
    const diff = Math.round((last - first) * 10) / 10;
    return diff;
  }, [analyticsData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        titleFont: { weight: 'bold' }
      }
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } },
        beginAtZero: true
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  // CSV Export of current filtered analytics
  const handleExportCSV = () => {
    if (!analyticsData) {
      addToast('No analytics data available to export.', 'warning');
      return;
    }

    const rows = [
      ['ReadySetJob Admin Analytics Report'],
      ['Generated At', new Date().toLocaleString()],
      ['Filter Date Range', dateFilter],
      ['Filter College', collegeFilter],
      ['Filter Assessment', assessmentFilter],
      [''],
      ['--- KEY PERFORMANCE INDICATORS ---'],
      ['Metric', 'Value'],
      ['Candidates Tested', kpis.candidatesTested],
      ['Total Assessments Submitted', kpis.totalSubmissions],
      ['Average Score (%)', `${kpis.avgScore}%`],
      ['Average Accuracy (%)', `${kpis.avgAccuracy}%`],
      ['Pass Rate (Score >= 65%)', `${kpis.passRate}%`],
      ['Job Readiness Rate (Score >= 70%)', `${kpis.jobReadinessRate}%`],
      ['Highest Score', `${kpis.maxScore}%`],
      ['Lowest Score', `${kpis.minScore}%`],
      [''],
      ['--- SCORE DISTRIBUTION ---'],
      ['Tier / Range', 'Candidates Count', 'Percentage'],
      ...(analyticsData.scoreDistribution || []).map(d => [d.label, d.count, `${d.percentage}%`]),
      [''],
      ['--- CATEGORY MASTERY ---'],
      ['Module Track', 'Average Score (%)'],
      ...(analyticsData.categoryAverages || []).map(c => [c.category, `${c.avgScore}%`]),
      [''],
      ['--- WEAKEST TOPICS ---'],
      ['Topic', 'Average Score', 'Failure Rate', 'Attempts Tested'],
      ...(analyticsData.weakestTopics || []).map(t => [t.topic, t.avgScore, t.failureRate, t.count])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ReadySetJob_Analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Analytics report exported as CSV.', 'success');
  };

  // Dynamic filter lists from backend
  const availableColleges = analyticsData?.filterOptions?.colleges || [];
  const availableAssessments = analyticsData?.filterOptions?.assessments || [];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header & Multi-Dimensional Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Database Feed
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {kpis.totalSubmissions.toLocaleString()} Total Records Analyzed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Assessment & Readiness Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time score distribution, module averages, candidate benchmarks, and weakest topics.
          </p>
        </div>

        {/* Global Multi-Dimensional Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Current Semester">Current Semester (90d)</option>
            </select>
          </div>

          {/* College Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="All">All Universities</option>
              {availableColleges.map((col, idx) => (
                <option key={idx} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Assessment Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={assessmentFilter}
              onChange={(e) => setAssessmentFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="All">All Assessments</option>
              {availableAssessments.map((asm, idx) => (
                <option key={idx} value={asm.title || asm.id}>{asm.title}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center justify-center"
            title="Refresh analytics from database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Failed to sync with database: {error}</span>
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton Indicator */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card h-24 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TOP 4 LIVE KPIS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4 hover:border-brand-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidates Tested</span>
              <span className="text-2xl font-black text-slate-900">{kpis.candidatesTested.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Across {kpis.totalSubmissions.toLocaleString()} attempts
              </span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Score</span>
              <span className="text-2xl font-black text-slate-900">{kpis.avgScore}%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Avg Accuracy: {kpis.avgAccuracy}%
              </span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4 hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assessment Pass Rate</span>
              <span className="text-2xl font-black text-emerald-600">{kpis.passRate}%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Passing Benchmark ≥ 65%
              </span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-4 hover:border-purple-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Readiness Rate</span>
              <span className="text-2xl font-black text-purple-600">{kpis.jobReadinessRate}%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Readiness Threshold ≥ 70%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS: SCORE DISTRIBUTION & CATEGORY PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Score Distribution */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cohort Spread</span>
              <h3 className="text-base font-bold text-slate-900">Score Distribution Across All Candidates</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {kpis.totalSubmissions.toLocaleString()} Submissions
            </span>
          </div>

          <div className="h-64 w-full">
            <Bar data={distributionData} options={chartOptions} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {(analyticsData?.scoreDistribution || []).map((d, i) => (
              <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block truncate">{d.label.split(' ')[0]}</span>
                <span className="text-xs font-extrabold text-slate-800">{d.count} ({d.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category Mastery</span>
              <h3 className="text-base font-bold text-slate-900">Average Score By Module</h3>
            </div>
            <span className="text-xs font-bold text-brand-600">3 Core Tracks</span>
          </div>

          <div className="h-64 w-full">
            <Bar data={categoryData} options={chartOptions} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            {(analyticsData?.categoryAverages || []).map((c, i) => (
              <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block truncate">{c.category.split(' ')[0]}</span>
                <span className="text-xs font-extrabold text-slate-800">{c.avgScore}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* WEAKEST TOPICS ANALYSIS & TREND OVER TIME */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weakest Topics Matrix */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Platform-Wide Weakest Topics</h3>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              High Failure Rate
            </span>
          </div>

          <div className="space-y-3">
            {(analyticsData?.weakestTopics || []).map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/60 transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.topic}</h4>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Avg Candidate Score: {item.avgScore}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-rose-600">{item.failureRate}</span>
                  <span className="text-[10px] text-slate-400 block">Failure Rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Candidate Performance Trend */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Progression</span>
              <h3 className="text-base font-bold text-slate-900">Average Platform Score Growth</h3>
            </div>
            {trendGrowth !== null ? (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                trendGrowth >= 0 ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-rose-800 bg-rose-50 border border-rose-200'
              }`}>
                {trendGrowth >= 0 ? `+${trendGrowth}% Growth` : `${trendGrowth}% Growth`}
              </span>
            ) : (
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                Timeline Progression
              </span>
            )}
          </div>

          <div className="h-56 w-full">
            <Line data={trendData} options={chartOptions} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Historical assessment attempts progression</span>
            <span className="font-semibold text-slate-700">
              {analyticsData?.trend?.length || 0} Data Periods
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
