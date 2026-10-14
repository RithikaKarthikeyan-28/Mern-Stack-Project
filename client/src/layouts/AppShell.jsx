import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
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
  const [collapsed, setCollapsed] = useState(false);
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
          { name: 'Analytics & Reports', path: '/admin/analytics', icon: BarChart3 },
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeVariant = {
    admin: 'danger',
    trainer: 'warning',
    employee: 'primary',
  }[role] || 'default';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out lg:static ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Logo & Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/50">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-base tracking-tight text-white">
                  Skill<span className="text-indigo-400">Track</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Enterprise LMS
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`
                }
                title={collapsed && !mobileOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}
                {item.path === '/notifications' && unreadCount > 0 && (!collapsed || mobileOpen) && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Summary / Sidebar Footer */}
        <div className="p-3 border-t border-slate-800">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 ${
              collapsed && !mobileOpen ? 'justify-center' : ''
            }`}
          >
            <Avatar
              name={user?.name || 'User'}
              size="sm"
              status="online"
              className="shrink-0"
            />
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Authenticated User'}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {user?.role || 'Employee'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-end px-3 py-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full flex items-center justify-center"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar width"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
          {/* Left: Mobile hamburger & search */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar Placeholder */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search courses, skills, resources..."
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100/80 border border-transparent rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          {/* Right: Notifications & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            <div className="h-6 w-px bg-slate-200 mx-1" />

            {/* User Dropdown with rich profile header */}
            <Dropdown
              align="right"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="User profile menu"
                >
                  <Avatar name={user?.name || 'User'} size="sm" />
                  <span className="hidden sm:inline-block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              }
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.name || 'Authenticated User'}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
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
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
