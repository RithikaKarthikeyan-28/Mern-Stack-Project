import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Award,
  Target,
  BookOpen,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage = () => {
  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from successful registration, prefill the registered email; password remains strictly empty.
  const [email, setEmail] = useState(() => location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});

  // Ensure fields remain strictly empty on initial render when accessed directly,
  // preventing browsers from silently force-injecting previously saved demo credentials.
  useEffect(() => {
    if (!location.state?.email) {
      setEmail('');
      setPassword('');

      const timer = setTimeout(() => {
        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        if (emailInput && (!location.state?.email || emailInput.value === 'employee@skilltrack.demo')) {
          if (emailInput.value === 'employee@skilltrack.demo') {
            emailInput.value = '';
            setEmail('');
          }
        }
        if (passInput && passInput.value) {
          passInput.value = '';
          setPassword('');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.state?.email]);

  const validate = () => {
    const newErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      success('Welcome back to SkillTrack!');

      const userRole = res.user?.role || 'employee';
      const requestedPath = location.state?.from?.pathname;

      let destination = '/dashboard';
      if (requestedPath) {
        destination = requestedPath;
      } else if (userRole === 'admin') {
        destination = '/admin/dashboard';
      } else if (userRole === 'trainer') {
        destination = '/trainer/dashboard';
      }

      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.normalizedMessage || err.message || 'Invalid email or password.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-10 sm:py-14 overflow-hidden bg-gradient-to-b from-white via-[#F7FAFC] to-[#ECFDF5]/30">
      {/* Decorative Atmosphere & Floating Pale-Green Icons (aria-hidden and non-interactive) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
        aria-hidden="true"
      >
        {/* Subtle pale-mint corner glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D1FAE5]/45 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-96 h-96 bg-[#A7DCCB]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-teal-100/25 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Pale-Green Icons */}
        {/* 1. BookOpen (Top Left) — Learning & Courses */}
        <div className="hidden sm:flex absolute top-12 left-6 md:left-12 lg:left-24 xl:left-32 animate-float-slow motion-reduce:animate-none">
          <div className="w-14 h-14 rounded-full bg-[#D1FAE5]/80 border border-[#A7DCCB]/70 shadow-sm flex items-center justify-center text-[#0F766E] backdrop-blur-[1px]">
            <BookOpen className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* 2. Target (Lower Left) — Skill Development */}
        <div className="hidden sm:flex absolute bottom-20 left-8 md:left-14 lg:left-24 xl:left-36 animate-float-medium motion-reduce:animate-none">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5]/90 border border-[#A7DCCB]/60 shadow-xs flex items-center justify-center text-[#0F766E] backdrop-blur-[1px]">
            <Target className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* 3. Award (Top Right) — Achievements & Certifications */}
        <div className="hidden sm:flex absolute top-16 right-6 md:right-12 lg:right-24 xl:right-32 animate-float-gentle motion-reduce:animate-none">
          <div className="w-14 h-14 rounded-full bg-[#D1FAE5]/80 border border-[#A7DCCB]/70 shadow-sm flex items-center justify-center text-[#0F766E] backdrop-blur-[1px]">
            <Award className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* 4. ChartNoAxesColumnIncreasing (Middle Right) — Progress Tracking */}
        <div className="hidden md:flex absolute top-1/2 -translate-y-8 right-4 md:right-8 lg:right-14 xl:right-20 animate-float-slow motion-reduce:animate-none">
          <div className="w-11 h-11 rounded-full bg-[#ECFDF5]/90 border border-[#A7DCCB]/50 shadow-xs flex items-center justify-center text-[#0F766E] backdrop-blur-[1px]">
            <ChartNoAxesColumnIncreasing className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* 5. ShieldCheck (Lower Right) — Compliance & Security */}
        <div className="hidden sm:flex absolute bottom-20 right-8 md:right-14 lg:right-24 xl:right-36 animate-float-medium motion-reduce:animate-none">
          <div className="w-13 h-13 rounded-full bg-[#D1FAE5]/70 border border-[#A7DCCB]/60 shadow-xs flex items-center justify-center text-[#0F766E] backdrop-blur-[1px]">
            <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* Subtle curved decorative lines */}
        <svg
          className="absolute left-12 top-1/3 w-28 h-44 text-[#A7DCCB]/40 hidden lg:block"
          fill="none"
          viewBox="0 0 100 160"
        >
          <path
            d="M10 10 C 60 60, 70 100, 20 150"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        <svg
          className="absolute right-14 bottom-1/3 w-28 h-44 text-[#A7DCCB]/40 hidden lg:block"
          fill="none"
          viewBox="0 0 100 160"
        >
          <path
            d="M90 10 C 40 60, 30 100, 80 150"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Small subtle mint accent dots */}
        <div className="absolute top-32 left-36 w-2.5 h-2.5 rounded-full bg-[#A7DCCB]/60 hidden xl:block" />
        <div className="absolute bottom-40 left-20 w-2 h-2 rounded-full bg-[#D1FAE5] border border-[#A7DCCB]/60 hidden lg:block" />
        <div className="absolute top-40 right-44 w-2.5 h-2.5 rounded-full bg-[#A7DCCB]/50 hidden xl:block" />
        <div className="absolute bottom-36 right-24 w-2 h-2 rounded-full bg-[#D1FAE5] border border-[#A7DCCB]/60 hidden lg:block" />
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[540px] sm:max-w-[560px] relative z-10 flex flex-col items-center">
        {/* SkillTrack Logo positioned above the login card, horizontally centred */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 rounded-2xl p-1"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-700/25 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-[#102A2A]">
              Skill<span className="text-teal-700">Track</span>
            </span>
          </Link>
        </div>

        {/* Centered Login Card */}
        <Card className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-7 sm:p-10">
          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102A2A] tracking-tight">
              Welcome back!
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Sign in to continue your learning journey.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="font-medium leading-snug">
                <div>{errorMsg}</div>
                {(errorMsg.toLowerCase().includes('account not found') ||
                  errorMsg.toLowerCase().includes('create an account')) && (
                  <div className="mt-2 pt-2 border-t border-rose-200/70">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-950 underline transition-colors"
                    >
                      Click here to create an account &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-4">
            {/* Decoy hidden inputs to absorb aggressive browser password-manager auto-fillers */}
            <input
              type="text"
              name="fake_username_trap"
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
            />
            <input
              type="password"
              name="fake_password_trap"
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
            />

            <Input
              label="Email Address"
              id="auth-email"
              name="skilltrack_account_email"
              type="email"
              required
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="name@organization.com"
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              autoComplete="off"
            />

            <Input
              label="Password"
              id="auth-password"
              name="skilltrack_account_password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              autoComplete="new-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-teal-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full text-base py-3 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl font-semibold shadow-sm transition-all focus:ring-4 focus:ring-teal-700/20"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-7 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-teal-700 hover:text-teal-800 transition-colors hover:underline focus:outline-none focus:underline"
            >
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
