import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, GraduationCap, ShieldCheck, Award, Target } from 'lucide-react';
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});

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
      setErrorMsg(err.normalizedMessage || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left Branding Column (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight">
                Skill<span className="text-indigo-400">Track</span>
              </span>
              <span className="block text-xs text-indigo-300 font-medium tracking-wider uppercase">
                Enterprise LMS & Compliance
              </span>
            </div>
          </div>

          <div className="mt-16 max-w-lg">
            <h1 className="text-3xl font-extrabold tracking-tight leading-snug">
              Architecting Workforce Excellence Through Continuous Learning
            </h1>
            <p className="mt-4 text-indigo-200 text-sm leading-relaxed">
              Connect skills, curricula, assessments, and regulatory compliance into a unified organizational ecosystem.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-4 my-8 max-w-md">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Automated Compliance Management</p>
              <p className="text-[11px] text-slate-300">Track expirations, auto-assign courses, and generate audit logs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Target className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Skill Gap Analysis & Recommendations</p>
              <p className="text-[11px] text-slate-300">Benchmark proficiencies against job roles and upskill intelligently.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Award className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Verifiable Certifications</p>
              <p className="text-[11px] text-slate-300">Cryptographically verifiable credentials with automated renewal.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          Protected by enterprise-grade RBAC, rate-limiting, and encrypted sessions.
        </div>
      </div>

      {/* Right Login Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Header Branding */}
          <div className="text-center lg:text-left mb-8">
            <div className="inline-flex lg:hidden items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white mb-4 shadow-md shadow-indigo-600/30">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Enter your corporate credentials to access your dashboard
            </p>
          </div>

          <Card className="shadow-xl shadow-slate-200/50 border-slate-200/80 p-6 sm:p-8">
            {errorMsg && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm animate-in fade-in"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <span className="font-medium leading-snug">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Email Address"
                id="login-email"
                type="email"
                required
                value={email}
                error={errors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="name@organization.com"
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />

              <Input
                label="Password"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                error={errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-indigo-600 transition-colors"
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
                  className="w-full text-base py-2.5"
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Create account
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
