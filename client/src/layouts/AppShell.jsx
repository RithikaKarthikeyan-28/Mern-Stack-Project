import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  FileCheck,
  Award,
  Target,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
  Users,
  Building2,
  ShieldCheck,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Dropdown from '../components/ui/Dropdown';

export const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadUnread = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        if (isMounted) setUnreadCount(count);
      } catch {
        // Non-fatal
      }
    };
    loadUnread();
    return () => {
      isMounted = false;
    };
  }, []);

  const role = user?.role || 'employee';

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Employees', path: '/admin/employees', icon: Users },
          { name: 'Departments', path: '/admin/departments', icon: Building2 },
          { name: 'Courses', path: '/admin/courses', icon: BookOpen },
          { name: 'Assessments', path: '/admin/assessments', icon: FileCheck },
          { name: 'Compliance', path: '/admin/compliance', icon: ShieldCheck },
          { name: 'Certificates', path: '/admin/certificates', icon: Award },
          { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
          { name: 'Notifications', path: '/notifications', icon: Bell },
        ];
      case 'trainer':
        return [
          { name: 'Dashboard', path: '/trainer/dashboard', icon: LayoutDashboard },
          { name: 'Courses', path: '/trainer/courses', icon: BookOpen },
          { name: 'Assessments', path: '/trainer/assessments', icon: FileCheck },
          { name: 'Learner Progress', path: '/trainer/learners', icon: Users },
          { name: 'Notifications', path: '/notifications', icon: Bell },
        ];
      case 'employee':
      default:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Learning', path: '/my-learning', icon: BookOpen },
          { name: 'Browse Courses', path: '/courses', icon: Compass },
          { name: 'Assessments', path: '/assessments', icon: FileCheck },
          { name: 'Certificates', path: '/certificates', icon: Award },
          { name: 'Skills & Gaps', path: '/skills', icon: Target },
          { name: 'Compliance', path: '/compliance', icon: ShieldCheck },
          { name: 'Notifications', path: '/notifications', icon: Bell },
        ];
    }
  };

  const navItems = getNavItems();
  // Filter out notifications from horizontal bar because of dedicated header bell icon
  const horizontalNavItems = navItems.filter((item) => item.path !== '/notifications');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeVariant = {
    admin: 'danger',
    trainer: 'warning',
    employee: 'primary',
  }[role] || 'default';

  const roleHomePath =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'trainer'
      ? '/trainer/dashboard'
      : '/dashboard';

  const roleTitle =
    role === 'admin'
      ? 'Admin Console'
      : role === 'trainer'
      ? 'Trainer Hub'
      : 'Learning Hub';

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col text-[#102A2A]">
      {/* =========================================================================
          1. STICKY TOP NAVIGATION BAR
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="min-h-16 py-2 flex items-center justify-between gap-3 flex-wrap lg:flex-nowrap">
            {/* Left: Brand Identity & Portal Pill */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Mobile hamburger menu toggle */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link
                to={roleHomePath}
                className="flex items-center gap-2.5 group focus:outline-none shrink-0"
                aria-label="SkillTrack Home"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-sm tracking-tight text-[#102A2A]">
                    Skill<span className="text-teal-700">Track</span>
                  </span>
                  <span className="text-[9px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
                    {roleTitle}
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Modern Horizontal Desktop Navigation Tabs */}
            <nav
              className="hidden lg:flex items-center gap-1.5 min-w-0 flex-1 justify-center flex-wrap px-1"
              aria-label="Primary Navigation"
            >
              {horizontalNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-1 ${
                        isActive
                          ? 'bg-[#0F766E] text-white border border-[#0F766E] shadow-xs hover:bg-[#115E59]'
                          : 'bg-[#ECFDF5] text-[#0F766E] border border-teal-200/90 hover:bg-teal-100/80 hover:border-teal-300 hover:text-[#115E59] shadow-2xs'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-white' : 'text-[#0F766E]'
                          }`}
                        />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Search, Notifications & User Profile */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Desktop Compact Search Input */}
              <div className="relative hidden xl:block w-36 2xl:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-100/80 border border-slate-200/70 rounded-lg text-[#102A2A] placeholder-slate-400 focus:bg-white focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 transition-all"
                />
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
                    data-testid="unread-notifications-badge"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              {/* User Dropdown */}
              <Dropdown
                align="right"
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-700"
                    aria-label="User profile menu"
                  >
                    <Avatar name={user?.name || 'User'} size="sm" />
                    <span className="hidden md:inline-block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                      {user?.name || 'User'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                  </button>
                }
              >
                <div className="px-4 py-3 border-b border-slate-100 min-w-[200px]">
                  <p className="text-xs font-bold text-[#102A2A] truncate">
                    {user?.name || 'Authenticated User'}
                  </p>
                  <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                    {user?.email || 'user@organization.com'}
                  </p>
                  <div className="mt-2">
                    <Badge variant={roleBadgeVariant} size="sm" dot>
                      {role.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </Dropdown>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MOBILE SLIDE-OVER NAVIGATION DRAWER
         ========================================================================= */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {mobileOpen && (
        <aside
          className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-white text-[#102A2A] flex flex-col shadow-2xl lg:hidden transition-transform duration-300 ease-in-out border-r border-slate-200 translate-x-0"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm tracking-tight text-[#102A2A]">
                  Skill<span className="text-teal-700">Track</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-600 uppercase">
                  {roleTitle}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Nav Items */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                      isActive
                        ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                        : 'bg-[#ECFDF5] text-[#0F766E] border-teal-200/90 hover:bg-teal-100/80 hover:border-teal-300 hover:text-[#115E59]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#0F766E]'
                        }`}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.path === '/notifications' && unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 p-2 rounded-xl">
              <Avatar name={user?.name || 'User'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#102A2A] truncate">
                  {user?.name || 'Authenticated User'}
                </p>
                <p className="text-[11px] text-[#64748B] capitalize truncate">
                  {role}
                </p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* =========================================================================
          3. MAIN CANVAS AREA
         ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* =========================================================================
          4. ENTERPRISE FOOTER
         ========================================================================= */}
      <footer className="w-full border-t border-slate-200/80 bg-white/60 py-4 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} SkillTrack Enterprise. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <Link to="/courses" className="hover:text-teal-700 transition-colors">Courses</Link>
            <Link to="/compliance" className="hover:text-teal-700 transition-colors">Compliance</Link>
            <Link to="/verify-certificate" className="hover:text-teal-700 transition-colors">Verify Credential</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
