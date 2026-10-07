import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  GraduationCap,
  Globe,
  MapPin,
  Compass,
  Briefcase,
  Loader2,
  Award,
  BookOpen,
  FileCheck,
  Hash,
  Calendar,
  Sparkles
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_REGEX = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Maharashtra', 'Tamil Nadu',
  'Delhi NCR', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Kerala',
  'Punjab', 'Rajasthan', 'Madhya Pradesh', 'Haryana', 'Odisha', 'Other State'
];

const POPULAR_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Computer Science & Business Systems (CSBS)',
  'Others'
];

const SPECIALIZATIONS = [
  'Artificial Intelligence & Machine Learning (AI/ML)',
  'Data Science & Analytics',
  'Full-Stack Web Development',
  'Cyber Security & Cryptography',
  'Cloud Computing & DevOps',
  'Mobile App Development (Android/iOS)',
  'Internet of Things (IoT) & Embedded Systems',
  'Core Computer Science & Algorithms',
  'Others'
];

const POPULAR_DEGREES = [
  'B.Tech',
  'B.E.',
  'BCA',
  'MCA',
  'B.Sc Computer Science / IT',
  'M.Tech',
  'Diploma / Polytechnic',
  'Other Degree'
];

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const SignupPage = () => {
  const { registerCandidate, navigateTo, addToast } = useApp();

  // 3-Step Wizard Navigation State
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Step 1: Personal & College Info
    name: '',
    email: '',
    phoneNo: '',
    collegeName: '',
    branch: '',
    specialization: '',
    country: 'India',
    state: '',
    city: '',
    // Step 2: Academic Details
    tenthSchool: '',
    tenthMarks: '',
    twelfthCollege: '',
    twelfthDiplomaMarks: '',
    degree: 'B.Tech',
    graduationYear: 2026,
    cgpa: '',
    backlogs: '0',
    // Step 3: Password & Terms
    password: '',
    confirmPassword: '',
    agreeTerms: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time field validation
  const validateField = (field, value) => {
    let errorMsg = '';
    
    // Step 1 Validations
    if (field === 'name') {
      if (!value.trim()) errorMsg = 'Full name is required';
      else if (value.trim().length < 2) errorMsg = 'Name must be at least 2 characters';
    }
    if (field === 'email') {
      if (!value.trim()) errorMsg = 'Email address is required';
      else if (!EMAIL_REGEX.test(value.trim())) errorMsg = 'Enter a valid email address (e.g. candidate@university.edu)';
    }
    if (field === 'phoneNo') {
      const clean = value.replace(/[\s\-]/g, '');
      if (!value.trim()) errorMsg = 'Indian mobile number is required';
      else if (!INDIAN_MOBILE_REGEX.test(clean)) errorMsg = 'Enter a valid 10-digit Indian mobile (starts with 6,7,8,9)';
    }
    if (field === 'collegeName') {
      if (!value.trim()) errorMsg = 'College name is required';
    }
    if (field === 'branch') {
      if (!value.trim()) errorMsg = 'Branch / stream is required';
    }
    if (field === 'specialization') {
      if (!value.trim()) errorMsg = 'Specialization is required';
    }
    if (field === 'state') {
      if (!value.trim()) errorMsg = 'State is required';
    }
    if (field === 'city') {
      if (!value.trim()) errorMsg = 'City is required';
    }

    // Step 2 Validations
    if (field === 'tenthSchool') {
      if (!value.trim()) errorMsg = 'Class 10th School / Board name is required';
    }
    if (field === 'tenthMarks') {
      const num = parseFloat(value);
      if (value === '' || isNaN(num)) errorMsg = '10th percentage is required';
      else if (num < 0 || num > 100) errorMsg = 'Must be between 0 and 100%';
    }
    if (field === 'twelfthCollege') {
      if (!value.trim()) errorMsg = 'Class 12th / Diploma college name is required';
    }
    if (field === 'twelfthDiplomaMarks') {
      const num = parseFloat(value);
      if (value === '' || isNaN(num)) errorMsg = '12th / Diploma percentage is required';
      else if (num < 0 || num > 100) errorMsg = 'Must be between 0 and 100%';
    }
    if (field === 'cgpa') {
      const num = parseFloat(value);
      if (value === '' || isNaN(num)) errorMsg = 'Current CGPA / SGPA is required';
      else if (num < 0 || num > 100) errorMsg = 'Valid score between 0 and 10 (CGPA) or 0-100 (%)';
    }
    if (field === 'backlogs') {
      const num = parseInt(value, 10);
      if (value === '' || isNaN(num) || num < 0) errorMsg = 'Enter 0 or valid backlogs count';
    }

    // Step 3 Validations
    if (field === 'password') {
      if (!value) errorMsg = 'Password is required';
      else if (value.length < 8) errorMsg = 'Password must be at least 8 characters long';
    }
    if (field === 'confirmPassword') {
      if (value !== formData.password) errorMsg = 'Passwords do not match';
    }

    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    validateField(name, val);
  };

  // Validate Step 1 before advancing
  const handleProceedToStep2 = (e) => {
    e?.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Valid email is required (e.g. candidate@university.edu)';
    }
    const cleanMobile = formData.phoneNo.replace(/[\s\-]/g, '');
    if (!formData.phoneNo.trim() || !INDIAN_MOBILE_REGEX.test(cleanMobile)) {
      newErrors.phoneNo = 'Valid 10-digit Indian mobile starting with 6,7,8,9 required';
    }
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College name is required';
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (addToast) addToast('Please fill all mandatory personal & college details.', 'error');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validate Step 2 before advancing
  const handleProceedToStep3 = (e) => {
    e?.preventDefault();
    const newErrors = {};
    if (!formData.tenthSchool.trim()) newErrors.tenthSchool = 'Class 10th School / Board is required';
    const t = parseFloat(formData.tenthMarks);
    if (formData.tenthMarks === '' || isNaN(t) || t < 0 || t > 100) {
      newErrors.tenthMarks = 'Enter valid 10th percentage (0-100)';
    }
    if (!formData.twelfthCollege.trim()) newErrors.twelfthCollege = 'Class 12th / Diploma College is required';
    const tw = parseFloat(formData.twelfthDiplomaMarks);
    if (formData.twelfthDiplomaMarks === '' || isNaN(tw) || tw < 0 || tw > 100) {
      newErrors.twelfthDiplomaMarks = 'Enter valid 12th percentage (0-100)';
    }
    const c = parseFloat(formData.cgpa);
    if (formData.cgpa === '' || isNaN(c) || c < 0 || c > 100) {
      newErrors.cgpa = 'Enter valid CGPA / SGPA (e.g. 8.5 or 85%)';
    }
    const b = parseInt(formData.backlogs, 10);
    if (formData.backlogs === '' || isNaN(b) || b < 0) {
      newErrors.backlogs = 'Enter 0 or valid backlogs count';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (addToast) addToast('Please verify all academic qualifications and marks.', 'error');
      return;
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submission on Step 3
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (addToast) addToast('Please resolve the highlighted security fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    const cleanMobile = formData.phoneNo.replace(/[\s\-]/g, '');

    try {
      const success = await registerCandidate({
        name: formData.name.trim(),
        fullName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: cleanMobile,
        phoneNo: cleanMobile,
        college: formData.collegeName.trim(),
        collegeName: formData.collegeName.trim(),
        branch: formData.branch,
        specialization: formData.specialization,
        country: formData.country || 'India',
        state: formData.state,
        city: formData.city.trim(),
        degree: formData.degree || 'B.Tech',
        graduationYear: parseInt(formData.graduationYear, 10) || 2026,
        graduation_year: parseInt(formData.graduationYear, 10) || 2026,
        experienceLevel: 'Fresher',
        tenthSchool: formData.tenthSchool.trim(),
        tenth_school: formData.tenthSchool.trim(),
        tenthMarks: parseFloat(formData.tenthMarks) || null,
        tenth_marks: parseFloat(formData.tenthMarks) || null,
        twelfthCollege: formData.twelfthCollege.trim(),
        twelfth_college: formData.twelfthCollege.trim(),
        twelfthDiplomaMarks: parseFloat(formData.twelfthDiplomaMarks) || null,
        twelfth_diploma_marks: parseFloat(formData.twelfthDiplomaMarks) || null,
        cgpa: parseFloat(formData.cgpa) || null,
        sgpa: parseFloat(formData.cgpa) || null,
        graduationPercentage: parseFloat(formData.cgpa) || null,
        backlogs: parseInt(formData.backlogs, 10) || 0,
        password: formData.password
      });

      if (success) {
        if (addToast) addToast('Account created successfully! Please sign in with your credentials to start your exam.', 'success');
        navigateTo('login');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      if (addToast) addToast('Registration could not be completed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Strength Calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 4) return { score: 66, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">

      {/* Subtle Ambient Background Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10">

        {/* Top Header Logo */}
        <div className="text-center mb-6">
          <div
            onClick={() => navigateTo('hero')}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-xl shadow-brand-500/20 mb-3 ring-4 ring-slate-100 cursor-pointer group transition-all"
          >
            <BrainCircuit className="w-8 h-8 group-hover:scale-105 transition-transform" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Candidate <span className="text-brand-600">Registration</span>
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-lg mx-auto">
            3-Step Enrollment: Personal Details, Academic Qualifications & Account Security for AI-Powered Readiness Assessments.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 relative">

          {/* 3-STEP PROGRESS STEPPER */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto relative">
              {/* Connector Progress Line */}
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 -z-0">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-300"
                  style={{
                    width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%'
                  }}
                />
              </div>

              {/* Step 1 Pin */}
              <button
                type="button"
                onClick={() => currentStep > 1 && setCurrentStep(1)}
                className={`relative z-10 flex flex-col items-center gap-1.5 group ${currentStep >= 1 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                  currentStep === 1
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-brand-500/30 scale-105'
                    : currentStep > 1
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                </div>
                <span className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${currentStep === 1 ? 'text-brand-600' : currentStep > 1 ? 'text-slate-800' : 'text-slate-400'}`}>
                  1. Personal Info
                </span>
              </button>

              {/* Step 2 Pin */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 3) setCurrentStep(2);
                  else if (currentStep === 1) handleProceedToStep2();
                }}
                className={`relative z-10 flex flex-col items-center gap-1.5 group ${currentStep >= 2 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                  currentStep === 2
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-brand-500/30 scale-105'
                    : currentStep > 2
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
                </div>
                <span className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${currentStep === 2 ? 'text-brand-600' : currentStep > 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                  2. Academics
                </span>
              </button>

              {/* Step 3 Pin */}
              <button
                type="button"
                className="relative z-10 flex flex-col items-center gap-1.5 cursor-default"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                  currentStep === 3
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-brand-500/30 scale-105'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  3
                </div>
                <span className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${currentStep === 3 ? 'text-brand-600' : 'text-slate-400'}`}>
                  3. Security & Finish
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* STEP 1: PERSONAL & COLLEGE DETAILS (Screenshot Items 1-9)   */}
          {/* ========================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-600" />
                    Step 1: Personal & College Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Please provide your verified profile and institution details.</p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Step 1 of 3
                </span>
              </div>

              {/* Row 1: Full Name & Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter Full Name"
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none transition-all ${
                        errors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>

                {/* 2. Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter Email Address"
                      className={`w-full pl-10 pr-9 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none font-mono transition-all ${
                        errors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : formData.email && EMAIL_REGEX.test(formData.email) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    {formData.email && EMAIL_REGEX.test(formData.email) && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {errors.email ? (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Format: username@domain.com</p>
                  )}
                </div>
              </div>

              {/* Row 2: Phone No & College Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3. Phone No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. Phone No <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-slate-600 select-none flex items-center gap-1">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      name="phoneNo"
                      value={formData.phoneNo}
                      onChange={handleChange}
                      maxLength={13}
                      placeholder="9876543210"
                      className={`w-full pl-16 pr-9 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none font-mono transition-all ${
                        errors.phoneNo ? 'border-rose-500 ring-2 ring-rose-500/20' : formData.phoneNo && INDIAN_MOBILE_REGEX.test(formData.phoneNo.replace(/[\s\-]/g, '')) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    {formData.phoneNo && INDIAN_MOBILE_REGEX.test(formData.phoneNo.replace(/[\s\-]/g, '')) && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {errors.phoneNo ? (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phoneNo}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">10-digit Indian mobile number starting with 6,7,8,9</p>
                  )}
                </div>

                {/* 4. College Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    4. College Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="collegeName"
                      value={formData.collegeName}
                      onChange={handleChange}
                      placeholder="Enter College Name"
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none transition-all ${
                        errors.collegeName ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                  </div>
                  {errors.collegeName && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.collegeName}</p>}
                </div>
              </div>

              {/* Row 3: Branch / Stream & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 5. Branch / Stream */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    5. Branch / Stream <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border text-sm text-slate-900 rounded-xl outline-none transition-all appearance-none cursor-pointer ${
                        errors.branch ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    >
                      <option value="">Select Branch / Stream</option>
                      {POPULAR_BRANCHES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {errors.branch && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.branch}</p>}
                </div>

                {/* 6. Specialization */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    6. Specialization <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border text-sm text-slate-900 rounded-xl outline-none transition-all appearance-none cursor-pointer ${
                        errors.specialization ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    >
                      <option value="">Select Specialization</option>
                      {SPECIALIZATIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {errors.specialization && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.specialization}</p>}
                </div>
              </div>

              {/* Row 4: Country, State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 7. Country */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    7. Country <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Enter Country"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 text-sm text-slate-900 rounded-xl outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* 8. State */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    8. State <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border text-sm text-slate-900 rounded-xl outline-none transition-all appearance-none cursor-pointer ${
                        errors.state ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  {errors.state && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.state}</p>}
                </div>

                {/* 9. City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    9. City <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter City"
                      className={`w-full pl-10 pr-4 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none transition-all ${
                        errors.city ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                  </div>
                  {errors.city && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.city}</p>}
                </div>
              </div>

              {/* Action Button: Proceed to Step 2 (Password completely removed from Step 1) */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Continue to Step 2: Academic Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 2: ACADEMIC DETAILS (10th, 12th, Degree, CGPA, Backlogs)*/}
          {/* ========================================================== */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand-600" />
                    Step 2: Academic Qualifications & Scores
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Please provide your school, pre-university, and degree grades.</p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Step 2 of 3
                </span>
              </div>

              {/* Class 10th Row */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Award className="w-4 h-4 text-brand-600" />
                  <span>Class 10th / Secondary School Record</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      10. Class 10th School / Board Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tenthSchool"
                      value={formData.tenthSchool}
                      onChange={handleChange}
                      placeholder="e.g. Delhi Public School / CBSE"
                      className={`w-full px-3.5 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none transition-all ${
                        errors.tenthSchool ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    {errors.tenthSchool && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.tenthSchool}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      11. 10th Marks / % <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="tenthMarks"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.tenthMarks}
                        onChange={handleChange}
                        placeholder="e.g. 88.5"
                        className={`w-full pl-3.5 pr-8 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none font-mono transition-all ${
                          errors.tenthMarks ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    {errors.tenthMarks && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.tenthMarks}</p>}
                  </div>
                </div>
              </div>

              {/* Class 12th / Diploma Row */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  <span>Class 12th / Pre-University / Diploma Record</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      12. 12th / Diploma College Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="twelfthCollege"
                      value={formData.twelfthCollege}
                      onChange={handleChange}
                      placeholder="e.g. Narayana Junior College / State Board"
                      className={`w-full px-3.5 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none transition-all ${
                        errors.twelfthCollege ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    {errors.twelfthCollege && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.twelfthCollege}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      13. 12th Marks / % <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="twelfthDiplomaMarks"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.twelfthDiplomaMarks}
                        onChange={handleChange}
                        placeholder="e.g. 85.0"
                        className={`w-full pl-3.5 pr-8 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none font-mono transition-all ${
                          errors.twelfthDiplomaMarks ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                    {errors.twelfthDiplomaMarks && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.twelfthDiplomaMarks}</p>}
                  </div>
                </div>
              </div>

              {/* Degree, Year, CGPA / SGPA & Backlogs */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FileCheck className="w-4 h-4 text-brand-600" />
                  <span>Graduation Degree, Year, CGPA / SGPA & Backlogs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Degree */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      14. Degree / Course <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="degree"
                      value={formData.degree}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 text-sm text-slate-900 rounded-xl outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                    >
                      {POPULAR_DEGREES.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Graduation Year */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      15. Passing Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 text-sm text-slate-900 rounded-xl outline-none font-mono focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                    >
                      {GRADUATION_YEARS.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  {/* CGPA / SGPA */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      16. Current CGPA / % <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="cgpa"
                      value={formData.cgpa}
                      onChange={handleChange}
                      placeholder="e.g. 8.4 or 84"
                      className={`w-full px-3.5 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none font-mono transition-all ${
                        errors.cgpa ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    {errors.cgpa && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cgpa}</p>}
                  </div>

                  {/* Backlogs */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      17. Total Backlogs <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="backlogs"
                      value={formData.backlogs}
                      onChange={handleChange}
                      placeholder="0"
                      className={`w-full px-3.5 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none font-mono transition-all ${
                        errors.backlogs ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    {errors.backlogs ? (
                      <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.backlogs}</p>
                    ) : (
                      <p className="mt-1 text-[10px] text-slate-400">Enter 0 if no backlogs</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons: Back and Proceed to Step 3 */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToStep3}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Continue to Step 3: Password & Security</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* STEP 3: SECURITY, REVIEW & ACCOUNT SUBMISSION              */}
          {/* ========================================================== */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200" noValidate>
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-600" />
                    Step 3: Account Password & Final Review
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Set a secure password for your student dashboard.</p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Step 3 of 3
                </span>
              </div>

              {/* Quick Profile Summary Badge Card */}
              <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    Registration Summary
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] text-brand-600 hover:underline font-semibold"
                  >
                    Edit Info
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Candidate</span>
                    <strong className="text-slate-800 text-[11px] truncate block">{formData.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Institution</span>
                    <strong className="text-slate-800 text-[11px] truncate block">{formData.collegeName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">10th / 12th %</span>
                    <strong className="text-slate-800 text-[11px] font-mono">{formData.tenthMarks}% / {formData.twelfthDiplomaMarks}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">CGPA / Backlogs</span>
                    <strong className="text-slate-800 text-[11px] font-mono">{formData.cgpa} ({formData.backlogs} Backlogs)</strong>
                  </div>
                </div>
              </div>

              {/* Row: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none transition-all ${
                        errors.password ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Strength:</span>
                        <span className="font-bold text-slate-700">{pwdStrength.label}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: `${pwdStrength.score}%` }} />
                      </div>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-type password"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white border text-sm text-slate-900 placeholder-slate-400 rounded-xl outline-none transition-all ${
                        errors.confirmPassword ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  I confirm that all entered academic and personal credentials are true. I agree to the <span className="text-brand-600 hover:underline font-semibold">Terms of Service</span> and <span className="text-brand-600 hover:underline font-semibold">Privacy Policy</span>.
                </label>
              </div>
              {errors.agreeTerms && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.agreeTerms}</p>}

              {/* Action Buttons: Back and Submit */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 2</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account & Registering...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration & Register for Exams</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-600">
              Already have an account?{' '}
              <button
                onClick={() => navigateTo('login')}
                className="font-bold text-brand-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Sign In
              </button>
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secure SSL 256-Bit Candidate Enrollment</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
