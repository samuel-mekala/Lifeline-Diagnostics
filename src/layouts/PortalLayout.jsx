import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import Sidebar from '../components/navigation/Sidebar';
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Shield,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const PortalLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, activeBranch, setActiveBranch } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mock Notifications for LIMS workflow updates
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Report Approved & Published',
      message: 'Complete Blood Picture (CBC) report for Rahul Sharma is now published.',
      time: '10 mins ago',
      type: 'success',
      unread: true,
    },
    {
      id: 2,
      title: 'New Sample Collected',
      message: 'Sample SAM-88402 collected for Home Visit #204.',
      time: '45 mins ago',
      type: 'info',
      unread: true,
    },
    {
      id: 3,
      title: 'Low Reagent Alert',
      message: 'HbA1c Testing Reagent Kit stock is below reorder threshold.',
      time: '2 hours ago',
      type: 'warning',
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // Generate dynamic breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return [{ label: 'Home', path: '/' }];

    return parts.map((part, idx) => {
      const path = '/' + parts.slice(0, idx + 1).join('/');
      let label = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
      if (part === 'portal') label = 'Patient Portal';
      if (part === 'operations') label = 'Operations Management';
      return { label, path };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    // Route to appropriate search page
    if (user?.role === 'PATIENT') {
      navigate(`/portal/tests?query=${encodeURIComponent(globalSearchQuery)}`);
    } else {
      navigate(`/operations/patients?search=${encodeURIComponent(globalSearchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearch} className="max-w-md w-full relative hidden sm:block">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder={
                    user?.role === 'PATIENT'
                      ? 'Search tests, packages, reports or invoices...'
                      : 'Global search: Patient ID, Sample Barcode, Visit ID...'
                  }
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </form>
          </div>

          {/* Right Action Icons & Profile Menu */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Branch Scope Badge (Operations Staff) */}
            {user?.role !== 'PATIENT' && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-semibold text-blue-800">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[140px]">{activeBranch}</span>
              </div>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar my-2">
                    {notifications.map((n) => (
                      <div key={n.id} className={`py-3 px-2 rounded-lg transition-colors ${n.unread ? 'bg-blue-50/50' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                          {n.type === 'info' && <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5 leading-normal">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <Link
                      to={user?.role === 'PATIENT' ? '/portal/notifications' : '/operations/dashboard'}
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View All Activity Notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user?.full_name || 'User'}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{user?.role || 'Patient'}</p>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Role: {user?.role}
                    </span>
                  </div>

                  <Link
                    to={user?.role === 'PATIENT' ? '/portal/profile' : '/operations/dashboard'}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>View Profile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sub-Header Breadcrumb Bar */}
        <div className="bg-slate-100/60 border-b border-slate-200/60 px-4 sm:px-6 py-2 flex items-center justify-between text-xs shrink-0">
          <nav className="flex items-center gap-1.5 text-slate-500 overflow-x-auto custom-scrollbar">
            <Link to={user?.role === 'PATIENT' ? '/portal/dashboard' : '/operations/dashboard'} className="hover:text-blue-600 font-medium">
              LIMS Home
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className={idx === breadcrumbs.length - 1 ? 'font-bold text-slate-900' : 'hover:text-blue-600'}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Phase 1-3 Lock System Active</span>
          </div>
        </div>

        {/* Main Workspace Render Outlet */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
