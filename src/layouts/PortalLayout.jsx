import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import portalAPI from '../services/portalAPI';
import Sidebar from '../components/navigation/Sidebar';
import { Logo } from '../components/common/Logo';
import InteractiveSearchBar from '../components/common/InteractiveSearchBar';
import { AIChatbotModal } from '../components/common/AIChatbotModal';
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
  Bot,
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
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Auto-dismiss the floating speech bubble after 6 seconds for cleaner UX
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);






  // Notifications list with real-time workflow sync
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const syncWorkflowNotifications = async () => {
      try {
        let aptList = [];
        if (user.role === 'PATIENT') {
          aptList = await portalAPI.getAppointments().catch(() => []);
        } else {
          aptList = await portalAPI.getStaffAppointments().catch(() => []);
        }

        if (!Array.isArray(aptList)) return;

        const generated = [];

        aptList.forEach((apt) => {
          const status = apt.status;
          const isHome = apt.collection_type === 'HOME' || apt.location?.toLowerCase().includes('home');
          const patName = apt.patient_name || 'Patient';
          const invId = apt.invoice_id || apt.visit_id || `INV-${apt.id.slice(0, 6)}`;
          const barcode = apt.sample_id || apt.barcode_id || 'Not Drawn Yet';

          if (user.role === 'PATIENT') {
            if (status === 'PENDING' || status === 'ACCEPTED') {
              generated.push({
                id: `pat-pending-${apt.id}`,
                type: 'info',
                title: 'Appointment Scheduled & Waiting',
                message: `Your appointment (${invId}) is confirmed. Phlebotomist will arrive for sample pickup.`,
                time: 'Waiting for Phlebotomist',
                unread: true,
              });
            } else if (status === 'VISITED') {
              generated.push({
                id: `pat-visited-${apt.id}`,
                type: 'info',
                title: 'Phlebotomist Arrived',
                message: `Phlebotomist has arrived for sample pickup (${invId}). Specimen collection in progress.`,
                time: 'In Progress',
                unread: true,
              });
            } else if (status === 'SAMPLE_COLLECTED') {
              generated.push({
                id: `pat-sample-${apt.id}`,
                type: 'info',
                title: 'Sample Collected & Barcoded',
                message: `Your sample tube (${barcode}) has been collected and dispatched to laboratory automated analyzer.`,
                time: 'Sample Barcoded',
                unread: true,
              });
            } else if (status === 'TESTED' || status === 'UNDER_REVIEW') {
              generated.push({
                id: `pat-review-${apt.id}`,
                type: 'info',
                title: 'Test Completed — Under Review',
                message: `Laboratory testing complete for ${invId}. Currently undergoing Pathologist clinical verification.`,
                time: 'Awaiting Sign-off',
                unread: true,
              });
            } else if (status === 'APPROVED' || status === 'COMPLETED') {
              generated.push({
                id: `pat-approved-${apt.id}`,
                type: 'success',
                title: '🎉 Diagnostic Report Ready!',
                message: `Your signed NABL report (${invId}) has been approved by Dr. Mallika Boyapati (MD) and published. Download PDF now!`,
                time: 'Completed',
                unread: true,
              });
            } else if (status === 'REJECTED') {
              generated.push({
                id: `pat-rejected-${apt.id}`,
                type: 'warning',
                title: 'Report Under Re-examination',
                message: `Your report (${invId}) is undergoing parameter re-verification by laboratory technicians.`,
                time: 'Under Re-examination',
                unread: true,
              });
            }
          } else if (user.role === 'LAB_TECHNICIAN' || user.role === 'PHLEBOTOMIST') {
            if (status === 'ACCEPTED' && isHome) {
              generated.push({
                id: `tech-acc-${apt.id}`,
                type: 'info',
                title: 'Action Waiting: Home Visit Pickup',
                message: `Home pickup for ${patName} (${invId}) is waiting for phlebotomist visit confirmation.`,
                time: 'Waiting for Visit',
                unread: true,
              });
            } else if (status === 'VISITED' || (status === 'ACCEPTED' && !isHome)) {
              generated.push({
                id: `tech-vis-${apt.id}`,
                type: 'info',
                title: 'Action Waiting: Collect Sample Tube',
                message: `Patient ${patName} (${invId}) ready for Sample Collection & Barcode generation.`,
                time: 'Ready for Collection',
                unread: true,
              });
            } else if (status === 'SAMPLE_COLLECTED') {
              generated.push({
                id: `tech-smp-${apt.id}`,
                type: 'info',
                title: 'Action Waiting: Run Analyzer',
                message: `Sample ${barcode} for ${patName} ready to run on automated analyzer.`,
                time: 'Ready for Analyzer',
                unread: true,
              });
            } else if (status === 'TESTED') {
              generated.push({
                id: `tech-tst-${apt.id}`,
                type: 'info',
                title: 'Action Waiting: Input Parameter Values',
                message: `Analyzer run finished for ${patName}. Please input report parameter values & submit for approval.`,
                time: 'Pending Input',
                unread: true,
              });
            } else if (status === 'REJECTED') {
              generated.push({
                id: `tech-rej-${apt.id}`,
                type: 'warning',
                title: '⚠️ Action Required: Re-entry Requested!',
                message: `Pathologist returned report for ${patName}. Notes: "${apt.pathologist_notes || apt.remarks || 'Re-check parameters.'}"`,
                time: 'Urgent Re-entry',
                unread: true,
              });
            } else if (status === 'APPROVED' || status === 'COMPLETED') {
              generated.push({
                id: `tech-app-${apt.id}`,
                type: 'success',
                title: 'Task Completed: Report Approved',
                message: `Report for ${patName} (${invId}) approved by Pathologist & published to Patient Portal.`,
                time: 'Task Completed',
                unread: false,
              });
            }
          } else if (user.role === 'PATHOLOGIST') {
            if (status === 'UNDER_REVIEW' || status === 'TESTED') {
              generated.push({
                id: `path-rev-${apt.id}`,
                type: 'info',
                title: '🩺 Action Waiting: Clinical Verification',
                message: `Test results for ${patName} (${invId}) awaiting your clinical inspection & digital sign-off.`,
                time: 'Awaiting Sign-off',
                unread: true,
              });
            } else if (status === 'APPROVED' || status === 'COMPLETED') {
              generated.push({
                id: `path-app-${apt.id}`,
                type: 'success',
                title: 'Task Completed: Report Verified & Signed',
                message: `You approved and signed NABL report for ${patName} (${invId}).`,
                time: 'Task Completed',
                unread: false,
              });
            }
          } else {
            if (status === 'APPROVED' || status === 'COMPLETED') {
              generated.push({
                id: `admin-app-${apt.id}`,
                type: 'success',
                title: 'Task Completed: Report Published',
                message: `Visit ${invId} for ${patName} completed & published.`,
                time: 'Completed',
                unread: false,
              });
            } else {
              generated.push({
                id: `admin-wait-${apt.id}`,
                type: 'info',
                title: `Task Status: ${status}`,
                message: `Patient ${patName} (${invId}) is currently in stage ${status}.`,
                time: 'In Pipeline',
                unread: true,
              });
            }
          }
        });

        setNotifications(generated);
      } catch (e) {
        console.error('Notification sync error:', e);
      }
    };

    syncWorkflowNotifications();
    const interval = setInterval(syncWorkflowNotifications, 6000);
    return () => clearInterval(interval);
  }, [user]);

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

            {/* Global Interactive Search Bar with Recommendations */}
            <div className="max-w-md w-full relative hidden sm:block">
              <InteractiveSearchBar
                value={globalSearchQuery}
                onChange={setGlobalSearchQuery}
                placeholder={
                  user?.role === 'PATIENT'
                    ? 'Search tests, packages, reports or invoices...'
                    : 'Global search: Patient ID, Sample Barcode, Visit ID...'
                }
                suggestions={[
                  { label: 'Complete Blood Count (CBC)', category: 'Hematology', tag: 'Popular' },
                  { label: 'Thyroid Profile (T3, T4, TSH)', category: 'Immunology', tag: 'Hormones' },
                  { label: 'Ayush-2 Full Body Checkup', category: 'Health Package', tag: 'Full Body' },
                  { label: 'HbA1c Glycated Hemoglobin', category: 'Biochemistry', tag: 'Diabetes' },
                  { label: 'Liver Function Test (LFT)', category: 'Biochemistry', tag: 'Hepatic' },
                  { label: 'Kidney Function Test (KFT)', category: 'Biochemistry', tag: 'Renal' },
                  { label: 'Lipid Profile (Cholesterol)', category: 'Biochemistry', tag: 'Heart' },
                  { label: 'Sample Barcode (LLD-B-XXXXXX)', category: 'Laboratory', tag: 'Specimen' },
                ]}
              />
            </div>
          </div>

          {/* Right Action Icons & Profile Menu */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Branch Scope Badge (Operations Staff) */}
            {user?.role !== 'PATIENT' && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50/90 border border-blue-300/90 rounded-xl text-xs sm:text-sm font-extrabold text-blue-900 shadow-xs">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="whitespace-nowrap">{activeBranch}</span>
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
                  {user?.email === 'tech@lifeline.com' || user?.full_name?.includes('Anil') ? 'S' : (user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {user?.email === 'tech@lifeline.com' || user?.full_name?.includes('Anil') ? 'Sunny' : (user?.full_name || 'User')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">{user?.role || 'Patient'}</p>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">
                      {user?.email === 'tech@lifeline.com' || user?.full_name?.includes('Anil') ? 'Sunny' : (user?.full_name || 'User')}
                    </p>
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

      {/* Floating AI Assistant Speech Bubble & Launcher Button */}
      {!isChatbotOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {/* Small Pop-up Speech Bubble */}
          {showTooltip && (
            <div
              onClick={() => {
                setIsChatbotOpen(true);
                setShowTooltip(false);
              }}
              className="bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 max-w-xs flex items-center gap-2.5 cursor-pointer hover:bg-slate-800 transition-all border-l-4 border-l-blue-500 animate-fade-in"
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="font-bold text-[11px] text-slate-100">👋 How can I help you book a test today?</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-700/60"
                title="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Icon Button */}
          <button
            onClick={() => {
              setIsChatbotOpen(true);
              setShowTooltip(false);
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 border-2 border-white/20 group cursor-pointer"
            title="Open LifeLong AI Health Assistant"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
            </div>
            <span className="text-xs font-black pr-1 hidden sm:inline tracking-wide">Ask LifeLong AI</span>
          </button>
        </div>
      )}


      {/* AI Chatbot Modal */}
      <AIChatbotModal isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  );
};


export default PortalLayout;
