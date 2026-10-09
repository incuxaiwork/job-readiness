import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BrainCircuit,
  Search,
  Bell,
  User,
  Users,
  Shield,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  BarChart2,
  FileText,
  Layers,
  HelpCircle,
  Lock,
  LogIn,
  Mic
} from 'lucide-react';

export const Header = ({ onToggleSidebar }) => {
  const {
    currentUser,
    role,
    currentView,
    navigateTo,
    logout,
    addToast,
    isInterviewUnlocked
  } = useApp();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const candidateNotifications = [
    {
      id: 1,
      title: "AI Diagnostic Ready",
      desc: "Your Technical Assessment has been evaluated with personalized recommendations.",
      time: "10m ago",
      read: false,
      view: "ai-analysis"
    },
    {
      id: 2,
      title: "New Mock Exam Available",
      desc: "Full-Stack Mock Exam is now active for 2026 batch.",
      time: "2h ago",
      read: true,
      view: "assessments"
    }
  ];

  const adminNotifications = [
    {
      id: 101,
      title: "New Batch Submissions",
      desc: "38 new students from ABC University completed Technical Assessment.",
      time: "15m ago",
      read: false,
      view: "admin-candidates"
    },
    {
      id: 102,
      title: "Assessment Report Ready",
      desc: "Weekly placement readiness export generated.",
      time: "1h ago",
      read: true,
      view: "admin-reports"
    }
  ];

  const notifications = role === 'admin' ? adminNotifications : candidateNotifications;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();

    if (role === 'admin') {
      if (q.includes('cand') || q.includes('john') || q.includes('sarah') || q.includes('stud')) {
        navigateTo('admin-candidates');
      } else if (q.includes('quest') || q.includes('sql') || q.includes('code') || q.includes('bank')) {
        navigateTo('admin-questions');

      } else if (q.includes('test') || q.includes('asm')) {
        navigateTo('admin-assessments');
      } else {
        navigateTo('admin-candidates');
      }
    } else {
      if (q.includes('test') || q.includes('tech') || q.includes('apt') || q.includes('reason')) {
        navigateTo('assessments');

      } else if (q.includes('report') || q.includes('score') || q.includes('result') || q.includes('analytics')) {
        navigateTo('candidate-analytics');
      } else {
        navigateTo('dashboard');
      }
    }
    setSearchQuery('');
    addToast(`Searching: "${searchQuery}"`, 'info');
  };

  const isGuest = role === 'guest' || (!currentUser && role !== 'admin');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile Menu Toggle & Portal Logo */}
          <div className="flex items-center gap-3">
            {!isGuest && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div 
              onClick={() => navigateTo('hero')}
              className="flex items-center gap-2.5 cursor-pointer group select-none font-sans"
            >

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                    ReadySet<span className="text-brand-600">Job</span>
                  </span>
                  {/* <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded tracking-wider uppercase border ${
                    role === 'admin'
                      ? 'bg-slate-900 text-brand-300 border-slate-700'
                      : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}>
                    {role === 'admin' ? 'Admin Portal' : 'Student Portal'}
                  </span> */}
                </div>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  {role === 'admin' ? 'Recruiter & University Management' : 'AI-Powered Assessment & Readiness'}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Bar (Admin portal only) */}
          {!isGuest && role === 'admin' && (
            <div className="flex-1 max-w-md hidden sm:block">
              <form onSubmit={handleSearch} className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidates, tests, questions..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                />
              </form>
            </div>
          )}

          {/* Right Section: Role Profile, Notifications & Auth Actions */}
          <div className="flex items-center gap-3">
            
            {/* AI Mock Interview CTA */}
            {role !== 'admin' && (
              <button
                onClick={() => {
                  if (!isInterviewUnlocked) {
                    addToast('Please complete your required assessment to unlock your AI Mock Interview session.', 'warning');
                    navigateTo('assessments');
                    return;
                  }
                  navigateTo('ai-mock-interview');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all border ${
                  isInterviewUnlocked
                    ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700/60'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                }`}
                title={isInterviewUnlocked ? 'AI Mock Interview' : 'Complete assessment to unlock'}
              >
                {isInterviewUnlocked ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">AI Mock Interview</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">AI Interview</span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-800 px-1.5 py-0.5 rounded font-black">Locked</span>
                  </>
                )}
              </button>
            )}

            {isGuest ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('login')}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Student Login
                </button>
                <button
                  onClick={() => navigateTo('signup')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Create Account
                </button>
              </div>
            ) : (
              <>
                {/* Notification Popover (Admin portal only) */}
                {role === 'admin' && (
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/60 transition-colors"
                      aria-label="View notifications"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white animate-pulse" />
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Admin Alerts
                          </span>
                          <span className="text-[11px] font-semibold text-brand-600 cursor-pointer hover:underline">Mark all read</span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                navigateTo(n.view);
                                setNotifOpen(false);
                              }}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${!n.read ? 'bg-brand-50/30' : ''}`}
                            >
                              <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                                  <span className="text-[10px] text-slate-400">{n.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Badge & Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/60 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden text-white ${
                      role === 'admin' ? 'bg-slate-900' : 'bg-brand-600'
                    }`}>
                      {role === 'admin' ? (
                        <Shield className="w-4 h-4 text-brand-400" />
                      ) : (
                        <span>{currentUser?.name ? currentUser.name.charAt(0) : 'S'}</span>
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                        {role === 'admin' ? 'HR Admin' : currentUser?.name || 'Student'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium capitalize">
                        {role === 'admin' ? 'Portal Administrator' : `Class of ${currentUser?.graduationYear || '2026'}`}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">
                          {role === 'admin' ? 'Administrator' : currentUser?.name || 'Student'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {role === 'admin' ? 'admin@readysetjob.com' : currentUser?.email || 'student@university.edu'}
                        </p>
                      </div>

                      <div className="py-1 text-xs">
                        {role === 'candidate' ? (
                          <>
                            <button
                              onClick={() => { navigateTo('assessments'); setProfileOpen(false); }}
                              className="w-full text-left px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                            >
                              <BarChart2 className="w-4 h-4 text-slate-400" /> Assessments & Tests
                            </button>

                            <button
                              onClick={() => {
                                if (!isInterviewUnlocked) {
                                  addToast('Please complete your required assessment to unlock your AI Mock Interview session.', 'warning');
                                  navigateTo('assessments');
                                } else {
                                  navigateTo('ai-mock-interview');
                                }
                                setProfileOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                {isInterviewUnlocked ? (
                                  <Mic className="w-4 h-4 text-cyan-600" />
                                ) : (
                                  <Lock className="w-4 h-4 text-amber-600" />
                                )}
                                <span>AI Mock Interview</span>
                              </div>
                              {!isInterviewUnlocked && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                                  Locked
                                </span>
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { navigateTo('admin-candidates'); setProfileOpen(false); }}
                              className="w-full text-left px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                            >
                              <Users className="w-4 h-4 text-slate-400" /> Candidates Roster
                            </button>

                            <button
                              onClick={() => { navigateTo('admin-questions'); setProfileOpen(false); }}
                              className="w-full text-left px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                            >
                              <HelpCircle className="w-4 h-4 text-slate-400" /> Question Bank
                            </button>

                            <button
                              onClick={() => { navigateTo('admin-assessments'); setProfileOpen(false); }}
                  >
                    Assessments
                  </button>
                  <button
                    onClick={() => { navigateTo('admin-interviews'); setProfileOpen(false); }}
                              className="w-full text-left px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                            >
                              <Layers className="w-4 h-4 text-slate-400" /> Assessments
                            </button>

                            <button
                              onClick={() => { navigateTo('admin-analytics'); setProfileOpen(false); }}
                              className="w-full text-left px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                            >
                              <BarChart2 className="w-4 h-4 text-slate-400" /> Analytics & Reports
                            </button>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={() => {
                            logout();
                            setProfileOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
