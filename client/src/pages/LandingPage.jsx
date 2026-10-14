import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Target, ShieldCheck, Award, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

export const LandingPage = () => {
  const features = [
    {
      title: 'Course & Learning Engine',
      description: 'Comprehensive modular learning paths, interactive lessons, and real-time progress tracking.',
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: 'Skill Gap Analysis',
      description: 'Map employee proficiencies against organizational job roles and uncover upskilling paths.',
      icon: <Target className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: 'Compliance & Audits',
      description: 'Track mandatory compliance training, automated expiration alerts, and audit-ready reports.',
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: 'Certifications & Badges',
      description: 'Issue cryptographic-grade verifiable certificates with auto-renewal scheduling.',
      icon: <Award className="w-6 h-6 text-indigo-600" />,
    },
  ];

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            Enterprise Learning & Compliance Management
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Elevate Workforce Talent with Intelligent Skill Tracking
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The all-in-one learning management system uniting course authoring, assessment engines, role skill requirements, and compliance automation.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Platform
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered for Modern Enterprise Teams
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Everything your team needs to upskill, assess, and comply.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                {feat.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
