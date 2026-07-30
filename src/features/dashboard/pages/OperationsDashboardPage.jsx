import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  Users,
  TestTube,
  FileCheck,
  CheckCircle2,
  IndianRupee,
  Activity,
  ArrowUpRight,
  Search,
  Filter,
  UserPlus,
  Microscope,
  Building2,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
  Globe,
  MapPin,
  FileText,
} from 'lucide-react';

const capitalizeName = (str) => {
  if (!str) return 'Patient';
  return str
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const formatDate = (isoStr) => {
  if (!isoStr) return 'Today';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch (e) {
    return isoStr;
  }
};

export default function OperationsDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await portalAPI.getStaffAppointments().catch(() => []);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed loading dashboard appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Counters
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const visitedCount = appointments.filter((a) => a.status === 'VISITED' || a.status === 'ACCEPTED').length;
  const sampleCount = appointments.filter((a) => a.status === 'SAMPLE_COLLECTED' || a.status === 'TESTED').length;
  const reviewCount = appointments.filter((a) => a.status === 'UNDER_REVIEW').length;
  const approvedCount = appointments.filter((a) => a.status === 'APPROVED').length;
  const totalRevenue = appointments.reduce((sum, a) => sum + (a.total_amount || 450), 0);

  const filteredAppointments = appointments.filter((a) => {
    const matchesFilter = queueFilter === 'ALL' || a.status === queueFilter;
    const matchesSearch =
      (a.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              ROLE: {user?.role || 'RECEPTIONIST'}
            </span>
            <span className="bg-white/10 text-slate-300 text-xs font-medium px-3 py-1 rounded-full border border-white/10">
              Life Line Diagnostics — Vijayawada Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Operations & Patient Workflow Command Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Live real-time monitoring of online bookings, walk-in visits, phlebotomy sample tracking, analyzer status, and pathologist sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => navigate('/operations/walkin-registration')}
            className="flex-1 lg:flex-none px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Walk-In Registration</span>
          </button>

          <button
            onClick={() => navigate('/operations/online-bookings')}
            className="flex-1 lg:flex-none px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>Online Bookings ({appointments.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Acceptance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{pendingCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">Awaiting technician assignment</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Patient Arrived / Visited</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{visitedCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">Ready for phlebotomy sample</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Sample Drawn & Testing</span>
            <TestTube className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{sampleCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">In central analyzer queue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Approved Reports</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{approvedCount}</span>
          <span className="text-[10px] text-slate-500 font-medium">Published to patient portal</span>
        </div>
      </div>

      {/* Live Operational Matrix & Real-time Audit Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Operational Matrix */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" /> Live Patient Workflow Stage Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking of all registered diagnostic visits</p>
            </div>

            <select
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Stages ({appointments.length})</option>
              <option value="PENDING">1. Pending ({pendingCount})</option>
              <option value="VISITED">2. Visited ({visitedCount})</option>
              <option value="SAMPLE_COLLECTED">3. Sample Drawn ({sampleCount})</option>
              <option value="UNDER_REVIEW">4. Under Review ({reviewCount})</option>
              <option value="APPROVED">5. Approved ({approvedCount})</option>
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading live workflow matrix...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Microscope className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No active visits matching selected filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAppointments.map((apt) => {
                const status = apt.status || 'PENDING';
                const isHome = apt.collection_type === 'HOME';

                return (
                  <div key={apt.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{apt.invoice_id || `INV-${apt.id.slice(0, 6)}`}</span>
                        <span className="font-extrabold text-slate-900">{capitalizeName(apt.patient_name || 'Joel')}</span>
                        {isHome ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">🏠 Home</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[9px] font-bold rounded">🏢 Lab Desk</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5 truncate font-medium">
                        {apt.address || 'Vijayawada Central Diagnostic Hub'}
                      </span>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-extrabold block w-fit ml-auto">
                        {status}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">₹{apt.total_amount || 450} • {apt.payment_status || 'PAID'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Real-time Patient Audit Stream */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> Real-time Patient Workflow Audit Stream
            </h3>
            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">Live Feed</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No patient workflow logs yet.</p>
            ) : (
              appointments.map((a, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-700">{a.invoice_id || `INV-${a.id.slice(0, 6)}`}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{formatDate(a.scheduled_for)}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 block">{capitalizeName(a.patient_name || 'Joel')}</span>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight">
                    {a.status === 'APPROVED'
                      ? 'NABL Pathology Report digitally signed & published to Patient Portal.'
                      : a.status === 'UNDER_REVIEW'
                      ? 'Analyzer parameter values submitted. Awaiting Pathologist sign-off.'
                      : a.status === 'SAMPLE_COLLECTED'
                      ? 'Specimen barcode generated & placed in Central Analyzer Node #1.'
                      : a.status === 'VISITED'
                      ? 'Patient marked ARRIVED at Vijayawada Diagnostic Hub.'
                      : `Appointment created via ${a.collection_type === 'HOME' ? 'Home Collection Request' : 'Online Lab Booking'}.`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
