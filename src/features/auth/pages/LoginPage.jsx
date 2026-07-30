import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import Logo from '../../../components/common/Logo';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  ChevronLeft,
  FileCheck,
  LockKeyhole,
} from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await login(email, password);
      if (result.success) {
        // Automatically redirects to the specific workstation / dashboard based on user role
        navigate(result.redirect);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Life Line Diagnostics Home</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3.5 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4" />
          <span>NABL Accredited & ISO 9001:2015</span>
        </div>
      </header>

      {/* Main Split Portal Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 my-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10">
        {/* Left Side: Brand Logo & Diagnostic Excellence Showcase */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Official Emblem Logo & Title */}
          <div className="space-y-4">
            <Logo
              showText={true}
              textVariant="light"
              className="w-18 h-18 sm:w-22 sm:h-22 drop-shadow-2xl"
              titleClassName="text-2xl sm:text-3xl font-black whitespace-nowrap"
              subtitleClassName="text-xs sm:text-sm font-extrabold whitespace-nowrap"
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Advanced Pathology Information System
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Secure digital access for registered patients and laboratory staff. Access diagnostic appointments, automated sample tracking, and NABL certified PDF reports.
            </p>
          </div>

          {/* Clean Diagnostic Trust Highlights */}
          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-3.5 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">NABL & ISO 9001:2015 Accredited</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Strict diagnostic quality controls & verified pathologist sign-offs.</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <FileCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">Instant Digital Report Access</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Download official PDF pathology receipts and verified test results.</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <LockKeyhole className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">256-Bit Encrypted Data Privacy</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Bank-grade security protecting patient medical history and reports.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Authentication Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200 space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Portal Sign In</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Sign in with your registered account email and password.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email address..."
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert(`Password reset request sent for ${email || 'your email'}`)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="block w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Authenticating Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs space-y-2">
              <p className="text-slate-600 font-medium">
                New patient at Life Line Diagnostics?{' '}
                <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                  Register Patient Account <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-500 border-t border-slate-800/60 z-10">
        © {new Date().getFullYear()} Life Line Diagnostics Path Labs. All rights reserved. • ISO 9001:2008 & NABL Certified
      </footer>
    </div>
  );
};

export default LoginPage;
