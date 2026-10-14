import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, AlertCircle, Eye, EyeOff, GraduationCap, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterPage = () => {
  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      newErrors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Full name must be at least 2 characters long.';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Full name cannot exceed 100 characters.';
    }

    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      // Backend automatically sets role to 'employee'
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      success('Account created successfully! Please sign in with your credentials.');
      navigate('/login');
    } catch (err) {
      setErrorMsg(err.normalizedMessage || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength helper
  const hasMinLength = formData.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*]/.test(formData.password);

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left Branding Column (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-12 text-white flex-col justify-between relative overflow-hidden">
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
              Begin Your Professional Upskilling Journey Today
            </h1>
            <p className="mt-4 text-indigo-200 text-sm leading-relaxed">
              Create your corporate learner profile to access assigned modules, earn recognized certificates, and close skill gaps.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-4 my-8 max-w-md">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Adaptive Learning Paths</p>
              <p className="text-[11px] text-slate-300">Targeted courses calibrated to your team and career goals.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Continuous Competency Tracking</p>
              <p className="text-[11px] text-slate-300">Interactive quizzes and lesson evaluations with instant scoring.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Role-Enforced Compliance</p>
              <p className="text-[11px] text-slate-300">Stay compliant with mandatory certifications and renewal alerts.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          Newly registered accounts are provisioned with standard employee access.
        </div>
      </div>

      {/* Right Registration Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-8">
            <div className="inline-flex lg:hidden items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white mb-4 shadow-md shadow-indigo-600/30">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Enter your details to create an employee account
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
                label="Full Name"
                id="register-name"
                name="name"
                type="text"
                required
                value={formData.name}
                error={errors.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                leftIcon={<User className="w-4 h-4" />}
                autoComplete="name"
              />

              <Input
                label="Email Address"
                id="register-email"
                name="email"
                type="email"
                required
                value={formData.email}
                error={errors.email}
                onChange={handleChange}
                placeholder="jane@organization.com"
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />

              <Input
                label="Password"
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                error={errors.password}
                onChange={handleChange}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
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

              {/* Password strength hints */}
              {formData.password && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasMinLength ? 'text-emerald-700 font-medium' : ''}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasLetter ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasLetter ? 'text-emerald-700 font-medium' : ''}>Contains letters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasNumberOrSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasNumberOrSpecial ? 'text-emerald-700 font-medium' : ''}>Contains numbers or symbols</span>
                  </div>
                </div>
              )}

              <Input
                label="Confirm Password"
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                error={errors.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-indigo-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Create Account
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
