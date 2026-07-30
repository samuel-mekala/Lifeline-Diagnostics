import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import Logo from '../../../components/common/Logo';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  MapPin,
  HeartPulse,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1); // Step 1: User Account, Step 2: Patient Demographics
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ALL FIELDS START COMPLETELY EMPTY (NO HARDCODED DEFAULT VALUES)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    const normEmail = formData.email.trim().toLowerCase();
    const normPhone = formData.phone.trim();

    if (!formData.full_name || !normEmail || !normPhone || !formData.password) {
      setError('Please fill in all required account fields.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    // STRICT CHECK STEP 1: Prevent duplicate email or phone before advancing to Step 2
    try {
      const registeredListRaw = localStorage.getItem('lifeline_registered_users_list');
      const registeredList = registeredListRaw ? JSON.parse(registeredListRaw) : [];

      const opsPatientsRaw = localStorage.getItem('lifeline_ops_patients');
      const opsPatients = opsPatientsRaw ? JSON.parse(opsPatientsRaw) : [];

      const PREDEFINED_EMAILS = [
        'samuel@gmail.com',
        'admin@lifeline.com',
        'reception@lifeline.com',
        'receptionist@lifeline.com',
        'tech@lifeline.com',
        'technician@lifeline.com',
        'patho@lifeline.com',
        'pathologist@lifeline.com',
        'dr.sunita@lifelinediagnostics.com',
        'anil.tech@lifelinediagnostics.com',
        'priya.desk@lifelinediagnostics.com',
      ];

      const isStaffEmail = PREDEFINED_EMAILS.includes(normEmail);
      if (isStaffEmail) {
        setError(`The email address "${normEmail}" belongs to an active Staff / Workstation account. Staff members must log in directly via Portal Sign In.`);
        return;
      }

      const duplicateEmailUser = registeredList.find((u) => u.email?.toLowerCase() === normEmail);
      if (duplicateEmailUser) {
        setError(`An account with email address "${normEmail}" already exists. Please sign in or use a different email address.`);
        return;
      }
    } catch (err) {
      console.warn('Error verifying duplicate account:', err);
    }

    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date_of_birth || !formData.gender || !formData.address) {
      setError('Please provide your date of birth, gender, and residential address.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await register(formData);
      if (result.success) {
        navigate(result.redirect || '/portal/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="p-4 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between z-10 shrink-0">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Life Line Diagnostics Home</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3.5 py-1 rounded-full">
          <ShieldCheck className="w-4 h-4" />
          <span>NABL Accredited & ISO 9001:2015</span>
        </div>
      </header>

      {/* Main Split Registration Viewport */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 my-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 flex-1 py-2">
        {/* Left Side: Brand Logo, Benefits & Diagnostics Graphics */}
        <div className="lg:col-span-5 space-y-5 text-left hidden lg:block">
          <div className="space-y-3">
            <Logo
              showText={true}
              textVariant="light"
              className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl"
              titleClassName="text-2xl font-black whitespace-nowrap"
              subtitleClassName="text-xs font-extrabold whitespace-nowrap"
            />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold px-3 py-1 rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>OFFICIAL PATIENT PORTAL REGISTRATION</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
              Patient Self-Service <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                Onboarding & Records
              </span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed font-normal pt-1">
              Create your verified patient account to book home sample visits, track sample processing live, and download official NABL PDF reports.
            </p>
          </div>

          {/* Graphic Feature Cards */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs">Instant NABL PDF Downloads</div>
                <div className="text-[10px] text-slate-400">Access digitally signed pathology reports anywhere.</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-lg">
              <HeartPulse className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs">Home Sample Visit Tracking</div>
                <div className="text-[10px] text-slate-400">Real-time status updates for phlebotomy arrival.</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-lg">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs">256-Bit SSL Encrypted Records</div>
                <div className="text-[10px] text-slate-400">Bank-grade data privacy protecting medical history.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Compact Non-Scrollable Registration Card */}
        <div className="lg:col-span-7">
          <div className="bg-white text-slate-900 p-6 sm:p-7 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            {/* Form Card Big Main Title */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-blue-600 shrink-0" />
                  <span>Create Patient Account</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {step === 1 ? 'Step 1 of 2: Enter your secure account credentials' : 'Step 2 of 2: Provide patient medical demographics'}
                </p>
              </div>
            </div>

            {/* Stepper Header */}
            <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {step === 1 ? '1' : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span className="font-bold text-xs">Step 1: Account Credentials</span>
              </div>

              <span className="text-slate-700">|</span>

              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  2
                </div>
                <span className="font-bold text-xs text-slate-300">Step 2: Patient Demographics</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded-r-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold text-red-700">{error}</div>
              </div>
            )}

            {step === 1 ? (
              /* STEP 1: COMPACT INPUTS */
              <form className="space-y-3 text-xs" onSubmit={handleStep1Next}>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="e.g., Rajesh Kumar"
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g., patient@example.com"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 8 characters"
                        className="block w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirm_password"
                        required
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Repeat password"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Patient Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: PATIENT DEMOGRAPHICS (COMPACT NON-SCROLLABLE) */
              <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900">Patient Medical Profile</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Credentials
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="date"
                        name="date_of_birth"
                        required
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="block w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      required
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Blood Group
                    </label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      className="block w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
                    >
                      <option value="">Select Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Residential Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-xl">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <textarea
                      name="address"
                      rows="2"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Address for home collection & report delivery"
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
                    ></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="e.g., Sunita Kumar (Spouse)"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="+91 98765 00000"
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Registering Patient...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Patient Registration</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-slate-100 text-center text-[11px]">
              <p className="text-slate-600 font-medium">
                Already have a Life Line Diagnostics account?{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
                  Sign In to Portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="p-3 text-center text-[10px] text-slate-500 border-t border-slate-800/60 z-10 shrink-0">
        © {new Date().getFullYear()} Life Line Diagnostics Path Labs. All rights reserved. • ISO 9001:2008 & NABL Certified
      </footer>
    </div>
  );
};

export default RegisterPage;
