import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Award,
  ShieldCheck,
  FileCheck,
  LogIn,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import heroIllustration from '../assets/hero-illustration.jpg';

export const LandingPage = () => {
  const imageSrc = heroIllustration || '/hero-illustration.jpg';

  const floatingBadges = [
    {
      label: 'Learn New Skills',
      icon: Sparkles,
      position: 'top-6 left-6 sm:top-10 sm:left-10',
      delay: 'animate-float-slow',
    },
    {
      label: 'Track Progress',
      icon: TrendingUp,
      position: 'top-10 right-6 sm:top-14 sm:right-12',
      delay: 'animate-float-delayed',
    },
    {
      label: 'Get Certified',
      icon: Award,
      position: 'bottom-16 left-8 sm:bottom-20 sm:left-12',
      delay: 'animate-float-delayed',
    },
    {
      label: 'Stay Compliant',
      icon: ShieldCheck,
      position: 'bottom-12 right-6 sm:bottom-16 sm:right-10',
      delay: 'animate-float-slow',
    },
  ];

  const features = [
    { name: 'Learn', icon: BookOpen },
    { name: 'Assess', icon: FileCheck },
    { name: 'Certify', icon: Award },
    { name: 'Stay Compliant', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7FAFC] text-[#102A2A] overflow-x-hidden selection:bg-teal-100 selection:text-teal-900">
      {/* =========================================================================
          LEFT SECTION — Cartoon 3D Illustration & Floating Badges (~52-55% width)
         ========================================================================= */}
      <section className="relative w-full lg:w-[52%] xl:w-[55%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-gradient-to-br from-[#E6F4F1] via-[#F0FDF8] to-[#E2E8F0] overflow-hidden min-h-[480px] lg:min-h-screen">
        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Interactive Badge Cards */}
        {floatingBadges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className={`absolute ${badge.position} z-20 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg shadow-teal-950/5 hover:scale-105 transition-transform duration-200 cursor-default`}
            >
              <div className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#0F766E]" />
              </div>
              <span className="text-xs font-bold text-[#102A2A] tracking-tight whitespace-nowrap">
                {badge.label}
              </span>
            </div>
          );
        })}

        {/* Central 3D Illustration Frame */}
        <div className="relative z-10 max-w-lg lg:max-w-xl w-full flex items-center justify-center">
          <div className="relative group">
            {/* Soft decorative shadow border around character frame */}
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
            <img
              src={imageSrc}
              alt="Youthful learner studying on laptop with modern curriculum"
              className="relative w-full h-auto max-h-[540px] xl:max-h-[620px] object-contain rounded-3xl drop-shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
              loading="eager"
            />
          </div>
        </div>

        {/* Organic Curved Wave Divider (Desktop Only) */}
        <div className="hidden lg:block absolute -right-1 top-0 bottom-0 w-16 xl:w-20 z-20 pointer-events-none">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full fill-white"
          >
            <path d="M0,0 C65,30 65,70 100,100 L100,0 Z" />
          </svg>
        </div>
      </section>

      {/* =========================================================================
          RIGHT SECTION — SkillTrack Branding, Value Proposition & Actions (~45-48%)
         ========================================================================= */}
      <section className="relative w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-12 lg:p-14 xl:p-16 bg-white z-20">
        {/* Subtle background ambient tint */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-50/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top/Main Branding & Action Block */}
        <div className="relative z-10 my-auto space-y-8 max-w-xl">
          {/* 1. SkillTrack Prominent Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] flex items-center justify-center text-white shadow-md shadow-teal-900/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-[#102A2A] leading-none">
                Skill<span className="text-[#0F766E]">Track</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#0F766E] uppercase mt-1">
                Enterprise LMS &amp; Compliance
              </span>
            </div>
          </div>

          {/* 2. Product Description Title */}
          <div className="space-y-3.5">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-extrabold text-[#102A2A] tracking-tight leading-[1.2]">
              Employee Learning, Skill Development and Compliance Management Platform
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed font-normal">
              Build skills. Track progress. Achieve more. All in one place.
            </p>
          </div>

          {/* 3. Action Buttons (Sign In & Create Account) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            {/* Primary Filled Teal Sign In Button */}
            <Link to="/login" className="flex-1 sm:flex-initial">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] active:bg-[#0F766E] shadow-md shadow-teal-900/20 hover:shadow-lg hover:shadow-teal-900/25 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </Link>

            {/* White Button with Teal Outline Create Account */}
            <Link to="/register" className="flex-1 sm:flex-initial">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-[#0F766E] bg-white hover:bg-[#ECFDF5] active:bg-teal-100/70 border-2 border-[#0F766E] shadow-xs hover:border-[#115E59] hover:text-[#115E59] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </Link>
          </div>

          {/* 4. Small Feature Badges */}
          <div className="pt-6 border-t border-slate-100 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Integrated Capabilities
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <span
                    key={feat.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ECFDF5] text-[#0F766E] border border-teal-200/80 shadow-2xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>{feat.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 pt-6 mt-6 border-t border-slate-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} SkillTrack Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-600">
            <Link to="/verify-certificate" className="hover:text-teal-700 transition-colors">
              Verify Credential
            </Link>
            <Link to="/login" className="hover:text-teal-700 transition-colors">
              Portal Access
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
