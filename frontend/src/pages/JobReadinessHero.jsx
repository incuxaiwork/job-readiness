import React from 'react';
import { useApp } from '../context/AppContext';
import incuxaiHeroPoster from '../assets/incuxai_hero_poster.jpg';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Linkedin,
  Twitter,
  Instagram,
  Mic,
  Zap,
  Target,
  BookOpen,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: 'Skill Diagnostics',
    description: 'Aptitude, reasoning, and technical assessments mapped to real hiring benchmarks.',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    border: 'border-brand-100',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Radar charts, peer comparisons, topic breakdowns, and 7-day prescriptive roadmaps.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Reports',
    description: 'Official digital credentials with unique Report IDs and printable PDF exports.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
];

const TRUST_POINTS = [
  'Free skill audit — no card required',
  'Results in minutes, not weeks',
  'Reports verified before recruiters see them',
];

export const JobReadinessHero = () => {
  const { navigateTo } = useApp();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Brand */}
            <button
              onClick={() => navigateTo('hero')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <img
                src={incuxaiHeroPoster}
                alt="IncuxAI Logo"
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                    IncuxAI
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded tracking-wider uppercase bg-brand-50 text-brand-700 border border-brand-200">
                    Job Readiness
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  AI-Powered Assessment Platform
                </span>
              </div>
            </button>

            {/* Nav Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('login')}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>

              <button
                onClick={() => navigateTo('signup')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <main className="flex flex-col items-center justify-center px-4 pt-16 pb-8 sm:pt-20 sm:pb-12 text-center">

        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-2 pr-4 py-1.5 mb-6 shadow-subtle hover:-translate-y-0.5 transition-transform cursor-default">
          <img
            src={incuxaiHeroPoster}
            alt="IncuxAI"
            className="w-7 h-7 rounded-full object-cover border-2 border-brand-600"
          />
          <span className="text-sm font-bold text-slate-800">IncuxAI Job Readiness Engine</span>
          <Sparkles className="w-4 h-4 text-brand-500" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mb-5"
          style={{ fontFamily: "'Inter', sans-serif" }}>
          Know exactly what stands between you and your{' '}
          <span className="text-brand-600">next job.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
          <span className="font-bold text-slate-900">IncuxAI</span> evaluates candidate job readiness through standardized Aptitude, Reasoning, and Technical modules with real-time AI performance analysis and skill gap diagnostics.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={() => navigateTo('signup')}
            className="flex items-center gap-2.5 px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold shadow-sm transition-all shadow-brand-500/20 hover:shadow-md cursor-pointer"
          >
            <span>Get started free</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigateTo('login')}
            className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-sm font-bold shadow-subtle transition-all cursor-pointer"
          >
            <span>Sign In to Assessments</span>
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-slate-500 mb-6">
          {TRUST_POINTS.map((point) => (
            <div key={point} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="font-medium">{point}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── INTERACTIVE RESUME ATS SCANNER & JOB ROLE SELECTOR ─────────────── */}
      

      {/* ── FEATURE GRID ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Section Label */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">Platform Capabilities</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Everything you need to land the offer
          </h2>
          <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
            Diagnostic assessments, deep performance analytics, and verified credentials — all in one place.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 text-slate-900 transition-all hover:-translate-y-1 hover:shadow-card"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feat.bg} border ${feat.border}`}>
                  <Icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <h3 className="text-sm font-bold mb-1.5 text-slate-900">
                  {feat.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Supplemental stats row */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '10,000+', label: 'Students assessed', icon: Target },
            { value: '95%', label: 'Report accuracy rate', icon: ShieldCheck },
            { value: '5 min', label: 'Average test time', icon: Zap },
            { value: '50+', label: 'Partner companies', icon: BookOpen },
          ].map(({ value, label, icon: StatIcon }) => (
            <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center shadow-subtle">
              <StatIcon className="w-5 h-5 text-brand-500 mb-2" />
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © 2026 IncuxAI. All rights reserved.
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={() => navigateTo('login')} className="hover:text-slate-800 transition-colors font-medium">Student Login</button>
            <span className="text-slate-300">·</span>
            <button onClick={() => navigateTo('signup')} className="hover:text-slate-800 transition-colors font-medium">Register</button>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <a
              href="https://linkedin.com/company/incuxai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-brand-600 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com/incuxai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-brand-600 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/incuxai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-brand-600 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
