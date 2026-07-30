import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../providers/AuthProvider';
import Logo from '../common/Logo';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck,
  FileText,
  Receipt,
  HelpCircle,
  User,
  Users,
  ClipboardList,
  TestTube,
  CheckSquare,
  PackageCheck,
  Package,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, activeBranch, setActiveBranch } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const role = user?.role || 'PATIENT';

  // Navigation Items defined per role
  const patientNavItems = [
    { title: 'Dashboard', path: '/portal/dashboard', icon: LayoutDashboard, exact: true },
    { title: 'Book Appointment', path: '/portal/appointments/book', icon: CalendarPlus, exact: true },
    { title: 'My Appointments', path: '/portal/appointments', icon: CalendarCheck, exact: true },
    { title: 'Test Catalog', path: '/portal/tests', icon: TestTube, exact: true },
    { title: 'My Reports', path: '/portal/reports', icon: FileText, exact: true },
    { title: 'Invoices & Bills', path: '/portal/invoices', icon: Receipt, exact: true },
    { title: 'Support & Help', path: '/portal/support', icon: HelpCircle, exact: true },
    { title: 'My Profile', path: '/portal/profile', icon: User, exact: true },
  ];

  const operationsNavItems = [
    {
      title: 'Operations Dashboard',
      path: '/operations/dashboard',
      icon: LayoutDashboard,
      roles: ['RECEPTIONIST', 'LAB_TECHNICIAN', 'PATHOLOGIST', 'BRANCH_MANAGER', 'ADMIN', 'OWNER'],
    },
    {
      title: 'Patients & Registration',
      path: '/operations/patients',
      icon: Users,
      roles: ['RECEPTIONIST', 'BRANCH_MANAGER', 'ADMIN', 'OWNER', 'LAB_TECHNICIAN'],
    },
    {
      title: 'Lab Visits & Billing',
      path: '/operations/visits',
      icon: ClipboardList,
      roles: ['RECEPTIONIST', 'BRANCH_MANAGER', 'ADMIN', 'OWNER', 'LAB_TECHNICIAN'],
    },
    {
      title: 'Sample Collection',
      path: '/operations/samples',
      icon: TestTube,
      roles: ['LAB_TECHNICIAN', 'RECEPTIONIST', 'BRANCH_MANAGER', 'ADMIN', 'OWNER'],
    },
    {
      title: 'Result Entry & Tracking',
      path: '/operations/results',
      icon: CheckSquare,
      roles: ['LAB_TECHNICIAN', 'PATHOLOGIST', 'BRANCH_MANAGER', 'ADMIN', 'OWNER'],
    },
    {
      title: 'Report Approval',
      path: '/operations/approvals',
      icon: PackageCheck,
      roles: ['PATHOLOGIST', 'ADMIN', 'OWNER'],
      badge: 'Pathologist',
    },
    {
      title: 'Branch Operations',
      path: '/operations/branches',
      icon: Building2,
      roles: ['BRANCH_MANAGER', 'ADMIN', 'OWNER'],
    },
    {
      title: 'Branch Inventory',
      path: '/operations/inventory',
      icon: Package,
      roles: ['BRANCH_MANAGER', 'ADMIN', 'OWNER'],
    },
    {
      title: 'Financial Analytics',
      path: '/operations/analytics',
      icon: BarChart3,
      roles: ['BRANCH_MANAGER', 'ADMIN', 'OWNER'],
    },
    {
      title: 'Employee Work Analysis',
      path: '/operations/employee-analysis',
      icon: Users,
      roles: ['BRANCH_MANAGER', 'ADMIN', 'OWNER', 'PATHOLOGIST'],
    },
    {
      title: 'Security Audit Trail',
      path: '/operations/audit-logs',
      icon: ShieldAlert,
      roles: ['ADMIN', 'OWNER', 'BRANCH_MANAGER'],
    },
  ];

  // Filter menu items by current user role
  const navItems = role === 'PATIENT'
    ? patientNavItems
    : operationsNavItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper for role pill badge styling
  const getRoleBadgeStyle = (userRole) => {
    switch (userRole) {
      case 'PATIENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'RECEPTIONIST':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'LAB_TECHNICIAN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'PATHOLOGIST':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'BRANCH_MANAGER':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'ADMIN':
      case 'OWNER':
        return 'bg-emerald-400 text-slate-950 font-bold border-emerald-300';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <Logo showText={!isCollapsed} textVariant="light" className="w-8 h-8" />

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white items-center justify-center transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Branch Scope Selector (Operations Users) */}
        {!isCollapsed && role !== 'PATIENT' && (
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Active Branch Scope
              </span>
            </div>
            <select
              value={activeBranch}
              onChange={(e) => setActiveBranch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Main Branch - Hyderabad">Main Branch - Hyderabad</option>
              <option value="Banjara Hills Branch">Banjara Hills Branch</option>
              <option value="Hitec City Collection Centre">Hitec City Centre</option>
              <option value="Global Operations - All Branches">Global Scope (All Branches)</option>
            </select>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '•••' : role === 'PATIENT' ? 'Patient Self-Service' : 'Operations Modules'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.path}
                whileHover={{ x: 3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <NavLink
                  to={item.path}
                  end={item.exact ?? true}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                  title={isCollapsed ? item.title : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.title}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded border border-purple-400/30 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            {!isCollapsed ? (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Active User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold tracking-wide ${getRoleBadgeStyle(role)}`}>
                    {role}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-xs" title={user?.full_name}>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Sign Out</h3>
            <p className="text-xs text-slate-600 mt-1 mb-6">
              Are you sure you want to log out of Life Line Diagnostics LIMS? Any unsaved edits will be discarded.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-semibold text-white shadow-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
