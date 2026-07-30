import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { CATALOG_PACKAGES } from '../services/portalData';
import portalAPI from '../../../services/portalAPI';
import {
  Calendar,
  FileText,
  CreditCard,
  PlusCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  ChevronRight,
  Building2,
  Phone,
  Tag,
  Activity,
  UserCheck,
} from 'lucide-react';

export const PatientDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Django REST API
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [apts, invs, reps] = await Promise.all([
          portalAPI.getAppointments(),
          portalAPI.getInvoices(),
          portalAPI.getReports(),
        ]);
        setAppointments(Array.isArray(apts) ? apts : []);
        setInvoices(Array.isArray(invs) ? invs : []);
        setReports(Array.isArray(reps) ? reps : []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAll();
  }, [user]);

  // Compute live KPI metrics
  const upcomingAppointments = appointments.filter(
    (a) => ['PENDING', 'ACCEPTED', 'BOOKED', 'VISITED'].includes(a.status)
  );
  const nextAppointment = upcomingAppointments[0] || null;

  const readyReports = reports.filter((r) => r.status === 'APPROVED');
  const pendingReports = reports.filter((r) => r.status !== 'APPROVED');

  const unpaidInvoices = invoices.filter((i) => i.status === 'UNPAID' || i.balance_due > 0);
  const totalOutstandingBalance = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);

  // Quick Package Selection Handler
  const handleSelectPackage = (pkg) => {
    navigate('/portal/appointments/book', { state: { preselectedPackage: pkg } });
  };

  return (
    <div className="space-y-6">
      {/* 1. Patient Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Patient Self-Service Portal
              </span>
              <span className="text-xs text-blue-200">Ref: {user?.patient_id || 'PAT-009842'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user?.full_name || 'Rahul Sharma'}
            </h1>
            <p className="text-sm text-blue-100 mt-1.5 max-w-xl leading-relaxed">
              Welcome to Life Line Diagnostics. Easily track your laboratory test results, manage home collection visits, and book diagnostic health checkups.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              to="/portal/appointments/book"
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Diagnostic Test</span>
            </Link>
            <Link
              to="/portal/reports"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>View Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Live KPI Widgets Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* KPI 1: Upcoming Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming Appointments
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {upcomingAppointments.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Active Slots</span>
          </div>
          {nextAppointment ? (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
              <p className="font-bold text-slate-800 truncate">{nextAppointment.items_summary}</p>
              <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{nextAppointment.scheduled_date} at {nextAppointment.scheduled_time}</span>
              </p>
            </div>
          ) : (
            <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
              No active bookings scheduled.
            </p>
          )}
        </div>

        {/* KPI 2: Reports Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Diagnostic Reports
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {readyReports.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600">Ready for Download</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500">Blocked / Pending Payment:</span>
            <span className={`font-bold ${pendingReports.length > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {pendingReports.length} {pendingReports.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
        </div>

        {/* KPI 3: Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              ₹{totalOutstandingBalance.toLocaleString()}
            </span>
            <span className={`text-xs font-semibold ${totalOutstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {totalOutstandingBalance > 0 ? 'Payment Due' : 'All Settled'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500">Unpaid Invoices:</span>
            <span className="font-bold text-slate-800">{unpaidInvoices.length}</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Shortcuts Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Quick Patient Actions</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/portal/appointments/book"
            className="group p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Book Appointment</p>
            <p className="text-[11px] text-slate-500 mt-1">Lab visit or home sample collection</p>
          </Link>

          <Link
            to="/portal/reports"
            className="group p-4 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">My Test Reports</p>
            <p className="text-[11px] text-slate-500 mt-1">Download signed PDF medical reports</p>
          </Link>

          <Link
            to="/portal/invoices"
            className="group p-4 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Pay Invoices</p>
            <p className="text-[11px] text-slate-500 mt-1">Instant online checkout via UPI or Card</p>
          </Link>

          <Link
            to="/portal/support"
            className="group p-4 bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 rounded-xl transition-all flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Customer Support</p>
            <p className="text-[11px] text-slate-500 mt-1">Raise support ticket or message phlebotomist</p>
          </Link>
        </div>
      </div>

      {/* 4. Featured Health Package Shortcuts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recommended Preventive Health Checkups</h2>
            <p className="text-xs text-slate-500">Curated comprehensive packages with up to 58% package discounts.</p>
          </div>
          <Link to="/portal/tests" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Browse All Tests <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CATALOG_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                pkg.popular
                  ? 'border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {pkg.included_test_count} Tests Included
                  </span>
                  {pkg.popular && (
                    <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" /> Most Popular
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{pkg.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-slate-900">₹{pkg.price}</span>
                    <span className="text-xs text-slate-400 line-through">₹{pkg.original_price}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">Save {pkg.discount_percentage}% OFF</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Book Package
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent Activity Feed (Connected to Appointments & Reports) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>My Recent Appointments</span>
            </h3>
            <Link to="/portal/appointments" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.slice(0, 3).map((apt) => (
              <div key={apt.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {apt.status}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">{apt.collection_type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{apt.items_summary}</p>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" /> {apt.branch_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 block">₹{apt.total_amount}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">{apt.scheduled_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Recent Diagnostic Reports</span>
            </h3>
            <Link to="/portal/reports" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 3).map((rep) => (
              <div key={rep.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{rep.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Approved by: {rep.pathologist_name}</p>
                  <span className="text-[10px] text-slate-400">{new Date(rep.generated_at).toLocaleDateString()}</span>
                </div>

                {rep.payment_status === 'PAID' ? (
                  <Link
                    to="/portal/reports"
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    View Report
                  </Link>
                ) : (
                  <Link
                    to="/portal/invoices"
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Pay to Release
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
