import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award,
  Target,
  Sparkles,
  Search,
  Filter,
  Briefcase,
  ShieldCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';

// Skills components
import SkillCard from '../components/skills/SkillCard';
import JobRoleCard from '../components/skills/JobRoleCard';
import SkillGapSummary from '../components/skills/SkillGapSummary';
import SkillGapCard from '../components/skills/SkillGapCard';
import RecommendedCourseCard from '../components/skills/RecommendedCourseCard';

// Services
import skillService from '../services/skillService';

export const SkillsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'my-skills';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // 1. My Skills State
  const [mySkills, setMySkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState(null);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // 2. Job Roles State
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRole, setSelectedJobRole] = useState(null);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState(null);

  // 3. Skill Gap Analysis State
  const [gapData, setGapData] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mandatoryOnlyFilter, setMandatoryOnlyFilter] = useState(false);

  // 4. Course Recommendations State
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);
  const [recMinScore, setRecMinScore] = useState(0);
  const [recMandatoryOnly, setRecMandatoryOnly] = useState(false);

  // Fetch My Skills
  const fetchMySkills = useCallback(async () => {
    try {
      setSkillsLoading(true);
      setSkillsError(null);
      const res = await skillService.getMySkills();
      setMySkills(res.employeeSkills || []);
    } catch {
      setSkillsError('Failed to load your skills inventory. Please try again.');
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  // Fetch Job Roles
  const fetchJobRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      setRolesError(null);
      const roles = await skillService.getJobRoles();
      setJobRoles(roles || []);
      if (roles && roles.length > 0) {
        const assignedRoleId = user?.employee?.jobRole?._id || user?.employee?.jobRole?.id || user?.employee?.jobRole;
        const assignedRoleName = user?.employee?.jobRole?.name || user?.employee?.designation;
        const employeeDeptId = user?.employee?.department?._id || user?.employee?.department?.id || user?.employee?.department;
        const employeeDeptName = user?.employee?.department?.name;

        const matched = roles.find((r) =>
          (assignedRoleId && (r._id === assignedRoleId || r.id === assignedRoleId)) ||
          (assignedRoleName && (
            r.name.toLowerCase() === assignedRoleName.toLowerCase() ||
            assignedRoleName.toLowerCase().includes(r.name.toLowerCase()) ||
            r.name.toLowerCase().includes(assignedRoleName.toLowerCase())
          )) ||
          (employeeDeptId && (
            (r.department && (r.department === employeeDeptId || r.department?._id === employeeDeptId)) ||
            (r.departments && r.departments.some(d => (d === employeeDeptId || d?._id === employeeDeptId)))
          )) ||
          (employeeDeptName && (
            r.name.toLowerCase().includes(employeeDeptName.toLowerCase()) ||
            employeeDeptName.toLowerCase().includes(r.name.toLowerCase())
          ))
        );
        setSelectedJobRole((prev) => prev || matched || roles[0]);
      }
    } catch {
      setRolesError('Failed to load benchmark job roles.');
    } finally {
      setRolesLoading(false);
    }
  }, [user]);

  // Fetch Skill Gap for Selected Role
  const fetchSkillGap = useCallback(async (jobRoleId, status, mandatoryOnly) => {
    if (!jobRoleId) return;
    try {
      setGapLoading(true);
      setGapError(null);
      const query = {};
      if (status && status !== 'ALL') {
        query.status = status;
      }
      if (mandatoryOnly) {
        query.mandatory = 'true';
      }
      const data = await skillService.getMySkillGap(jobRoleId, query);
      setGapData(data);
    } catch {
      setGapError('Failed to generate skill gap analysis for this role.');
    } finally {
      setGapLoading(false);
    }
  }, []);

  // Fetch Recommendations for Selected Role
  const fetchRecommendations = useCallback(async (jobRoleId, minScore, mandatoryOnly) => {
    if (!jobRoleId) return;
    try {
      setRecLoading(true);
      setRecError(null);
      const query = {};
      if (minScore > 0) {
        query.minScore = minScore;
      }
      if (mandatoryOnly) {
        query.mandatoryOnly = 'true';
      }
      const data = await skillService.getMyRecommendations(jobRoleId, query);
      setRecommendationsData(data);
    } catch {
      setRecError('Failed to load course recommendations.');
    } finally {
      setRecLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchMySkills();
    fetchJobRoles();
  }, [fetchMySkills, fetchJobRoles]);

  // Trigger Gap and Recommendation when selectedJobRole or relevant filters change
  useEffect(() => {
    if (selectedJobRole?._id) {
      fetchSkillGap(selectedJobRole._id, statusFilter, mandatoryOnlyFilter);
    }
  }, [selectedJobRole, statusFilter, mandatoryOnlyFilter, fetchSkillGap]);

  useEffect(() => {
    if (selectedJobRole?._id) {
      fetchRecommendations(selectedJobRole._id, recMinScore, recMandatoryOnly);
    }
  }, [selectedJobRole, recMinScore, recMandatoryOnly, fetchRecommendations]);

  // Categories list for My Skills
  const categories = useMemo(() => {
    const set = new Set();
    mySkills.forEach((item) => {
      if (item.skill?.category) set.add(item.skill.category);
    });
    return Array.from(set).sort();
  }, [mySkills]);

  // Filtered My Skills
  const filteredSkills = useMemo(() => {
    return mySkills.filter((item) => {
      const name = item.skill?.name || '';
      const cat = item.skill?.category || '';
      const matchesSearch = name.toLowerCase().includes(skillSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || cat === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [mySkills, skillSearchQuery, selectedCategory]);

  return (
    <div className="space-y-8" data-testid="skills-page">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-semibold backdrop-blur-sm mb-3">
            <Award className="w-3.5 h-3.5" />
            <span>Talent Development & Benchmarking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Skills & Competency Hub
          </h1>
          <p className="text-sm text-teal-100/90 leading-relaxed">
            Review your verified organizational proficiencies, benchmark competencies against key job roles,
            and discover targeted courses designed to close critical skill gaps.
          </p>
        </div>
      </div>

      {/* 2. Top Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          data-testid="tab-my-skills"
          onClick={() => handleTabChange('my-skills')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'my-skills'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Skills Inventory</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {mySkills.length}
          </span>
        </button>

        <button
          type="button"
          data-testid="tab-gap-analysis"
          onClick={() => handleTabChange('gap-analysis')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'gap-analysis'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Role Benchmark & Gap Analysis</span>
        </button>

        <button
          type="button"
          data-testid="tab-recommendations"
          onClick={() => handleTabChange('recommendations')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'recommendations'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Course Recommendations</span>
          {recommendationsData?.recommendations?.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold">
              {recommendationsData.recommendations.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: MY SKILLS INVENTORY */}
      {activeTab === 'my-skills' && (
        <div className="space-y-6" data-testid="my-skills-section">
          {/* Admin Verification Notice */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-slate-700 text-xs">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
            <p className="flex-1 leading-relaxed">
              <span className="font-semibold text-[#102A2A]">Verified Competencies: </span>
              Your employee skill profile is maintained and verified by platform administrators based on formal evaluations, course completions, and role requirements.
            </p>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                data-testid="skill-search-input"
                placeholder="Search skills by name..."
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                data-testid="skill-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-medium text-slate-700 py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 bg-white"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {skillsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="w-20 h-5 rounded-full" />
                    <Skeleton className="w-16 h-5 rounded-full" />
                  </div>
                  <Skeleton className="w-3/4 h-6" />
                  <Skeleton className="w-full h-10" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!skillsLoading && skillsError && (
            <ErrorState
              title="Unable to load skills"
              message={skillsError}
              onRetry={fetchMySkills}
            />
          )}

          {/* Empty State */}
          {!skillsLoading && !skillsError && filteredSkills.length === 0 && (
            <EmptyState
              icon={<Award className="w-7 h-7" />}
              title={mySkills.length === 0 ? "No verified skills recorded yet" : "No matching skills found"}
              description={
                mySkills.length === 0
                  ? "As you complete learning pathways and assessments, administrators will verify and log your competencies."
                  : "Try clearing your search query or choosing a different category filter."
              }
              action={
                mySkills.length > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSkillSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                  >
                    Reset Filters
                  </Button>
                ) : null
              }
            />
          )}

          {/* Skills Grid */}
          {!skillsLoading && !skillsError && filteredSkills.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSkills.map((employeeSkill) => (
                <SkillCard
                  key={employeeSkill._id || employeeSkill.skill?._id}
                  employeeSkill={employeeSkill}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLE BENCHMARK & GAP ANALYSIS */}
      {activeTab === 'gap-analysis' && (
        <div className="space-y-8" data-testid="gap-analysis-section">
          {/* Target Role Selector */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#102A2A]">
                  Target Job Role Benchmark
                </h2>
                <p className="text-xs text-slate-500">
                  Select a job role to evaluate required proficiencies against your current competencies.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchJobRoles}
                className="gap-1.5 text-xs text-slate-600"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Roles</span>
              </Button>
            </div>

            {rolesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            )}

            {!rolesLoading && rolesError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {rolesError}
              </div>
            )}

            {!rolesLoading && !rolesError && jobRoles.length === 0 && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No active job roles available for benchmarking.
              </div>
            )}

            {!rolesLoading && !rolesError && jobRoles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobRoles.map((role) => (
                  <JobRoleCard
                    key={role._id}
                    jobRole={role}
                    isSelected={selectedJobRole?._id === role._id}
                    onSelect={(r) => setSelectedJobRole(r)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Selected Role Gap Report */}
          {selectedJobRole && (
            <div className="space-y-6 pt-4 border-t border-slate-200">
              {/* Gap Summary Metrics Component */}
              {gapLoading && (
                <div className="p-8 rounded-3xl border border-slate-200 bg-white space-y-6">
                  <div className="flex justify-between">
                    <Skeleton className="w-64 h-6" />
                    <Skeleton className="w-32 h-8 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-24 col-span-2 rounded-2xl" />
                  </div>
                </div>
              )}

              {!gapLoading && gapError && (
                <ErrorState
                  title="Skill gap analysis failed"
                  message={gapError}
                  onRetry={() =>
                    fetchSkillGap(selectedJobRole._id, statusFilter, mandatoryOnlyFilter)
                  }
                />
              )}

              {!gapLoading && !gapError && gapData?.summary && (
                <>
                  <SkillGapSummary
                    summary={gapData.summary}
                    jobRoleTitle={selectedJobRole.name}
                    onViewRecommendations={() => handleTabChange('recommendations')}
                  />

                  {/* Filter Toolbar for Gap Items */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { key: 'ALL', label: 'All Criteria' },
                        { key: 'MISSING', label: 'Missing' },
                        { key: 'BELOW_REQUIRED', label: 'Below Required' },
                        { key: 'MEETS_REQUIRED', label: 'Meets Required' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          data-testid={`gap-filter-${item.key.toLowerCase()}`}
                          onClick={() => setStatusFilter(item.key)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition whitespace-nowrap ${
                            statusFilter === item.key
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        data-testid="gap-mandatory-toggle"
                        checked={mandatoryOnlyFilter}
                        onChange={(e) => setMandatoryOnlyFilter(e.target.checked)}
                        className="rounded border-slate-300 text-teal-700 focus:ring-teal-600 w-4 h-4"
                      />
                      <span>Mandatory Requirements Only</span>
                    </label>
                  </div>

                  {/* Gap Cards List */}
                  {gapData.gaps?.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No skill criteria match the selected status filters.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {gapData.gaps.map((gap) => (
                        <SkillGapCard key={gap.requirementId || gap.skill?._id} gap={gap} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COURSE RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6" data-testid="recommendations-section">
          {/* Header Context & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                <span>Target Benchmark Role</span>
              </div>
              <h3 className="text-base font-bold text-[#102A2A]">
                {selectedJobRole?.name || 'Select a Job Role'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                data-testid="rec-minscore-filter"
                value={recMinScore}
                onChange={(e) => setRecMinScore(Number(e.target.value))}
                className="text-xs font-medium text-slate-700 py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600/20 bg-white"
              >
                <option value={0}>All Recommendation Scores</option>
                <option value={50}>Match &gt;= 50%</option>
                <option value={75}>Match &gt;= 75%</option>
                <option value={85}>Match &gt;= 85%</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none bg-white py-2 px-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  data-testid="rec-mandatory-toggle"
                  checked={recMandatoryOnly}
                  onChange={(e) => setRecMandatoryOnly(e.target.checked)}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600 w-4 h-4"
                />
                <span>Mandatory Gaps Only</span>
              </label>
            </div>
          </div>

          {/* Loading Skeletons */}
          {recLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="w-20 h-5 rounded-full" />
                    <Skeleton className="w-24 h-5 rounded-full" />
                  </div>
                  <Skeleton className="w-3/4 h-6" />
                  <Skeleton className="w-full h-12" />
                  <Skeleton className="w-full h-10 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!recLoading && recError && (
            <ErrorState
              title="Failed to load recommendations"
              message={recError}
              onRetry={() =>
                selectedJobRole?._id &&
                fetchRecommendations(selectedJobRole._id, recMinScore, recMandatoryOnly)
              }
            />
          )}

          {/* Empty State */}
          {!recLoading &&
            !recError &&
            (!recommendationsData?.recommendations ||
              recommendationsData.recommendations.length === 0) && (
              <EmptyState
                icon={<Sparkles className="w-7 h-7" />}
                title="No recommended courses found"
                description={
                  gapData?.summary?.meetsRequiredSkills === gapData?.summary?.totalRequirements &&
                  gapData?.summary?.totalRequirements > 0
                    ? "Congratulations! You have satisfied 100% of the required competencies for this job role."
                    : "No published courses currently match your active competency gaps under the selected filters."
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRecMinScore(0);
                      setRecMandatoryOnly(false);
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            )}

          {/* Recommendations Grid */}
          {!recLoading &&
            !recError &&
            recommendationsData?.recommendations?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendationsData.recommendations.map((rec) => (
                  <RecommendedCourseCard
                    key={rec.course?._id}
                    recommendation={rec}
                  />
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SkillsPage;
