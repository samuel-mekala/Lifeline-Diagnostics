import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import OperationsDataStore from '../../operations/services/operationsData';
import { BRANCHES } from '../../portal/services/portalData';
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
  FileSpreadsheet,
  Building2,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function OperationsDashboardPage() {
  const navigate = useNavigate();
  const { user, activeBranch, setActiveBranch } = useAuth();

  const [visits, setVisits] = useState([]);
  const [samples, setSamples] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedQueueFilter, setSelectedQueueFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load operational state
  const loadData = () => {
    const vList = OperationsDataStore.getVisits();
    const sList = OperationsDataStore.getSamples();
    const lList = OperationsDataStore.getActivityLogs();
    setVisits(vList);
    setSamples(sList);
    setLogs(lList);
  };

  useEffect(() => {
    loadData();
    // Refresh periodically
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter visits by active branch (or show all if ALL)
  const filteredVisitsByBranch = visits.filter(
    (v) => activeBranch === 'ALL' || v.branch_name.includes(activeBranch) || v.branch_code === activeBranch
  );

  // Live KPI Calculations
  const walkInsCount = filteredVisitsByBranch.filter((v) => v.visit_type === 'WALK_IN').length;
  const pendingSamplesCount = samples.filter((s) => s.status === 'REGISTERED' || s.status === 'COLLECTED').length;
  const awaitingApprovalCount = filteredVisitsByBranch.filter((v) => v.status === 'RESULTS_ENTERED').length;
  const reportsPublishedCount = filteredVisitsByBranch.filter((v) => v.status === 'PUBLISHED' || v.status === 'APPROVED').length;
  const todayRevenue = filteredVisitsByBranch.reduce((sum, v) => sum + (v.amount_paid || 0), 0);

  // Queue Counters
  const registeredQueue = filteredVisitsByBranch.filter((v) => v.status === 'REGISTERED').length;
  const samplesCollectedQueue = filteredVisitsByBranch.filter((v) => v.status === 'SAMPLES_COLLECTED').length;
  const inLabQueue = filteredVisitsByBranch.filter((v) => v.status === 'IN_LAB').length;
  const resultsEnteredQueue = filteredVisitsByBranch.filter((v) => v.status === 'RESULTS_ENTERED').length;
  const approvedQueue = filteredVisitsByBranch.filter((v) => v.status === 'APPROVED' || v.status === 'PUBLISHED').length;

  // Filtered Queue List based on selected tile
  const displayedQueueVisits = filteredVisitsByBranch.filter((v) => {
    if (selectedQueueFilter !== 'ALL' && v.status !== selectedQueueFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.patient_name.toLowerCase().includes(q) ||
        v.visit_id.toLowerCase().includes(q) ||
        v.patient_id.toLowerCase().includes(q) ||
        v.tests_summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Role Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              ROLE: {user?.role || 'RECEPTIONIST'}
            </span>
            <span className="bg-slate-800 text-slate-300 text-xs font-medium px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Branch Scope: {activeBranch || 'Main Branch - Hyderabad'}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Master Operations Control Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time diagnostics workflow orchestration across Patient Registration, Phlebotomy, Specimen Tracking, Analyzer Parameter Entry, and Pathologist Approval.
          </p>
        </div>

        {/* Branch Switcher Dropdown */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex flex-col gap-1 w-full lg:w-72">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            Switch Active Operational Branch
          </label>
          <select
            value={activeBranch}
            onChange={(e) => setActiveBranch(e.target.value)}
            className="bg-slate-900 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="Main Branch - Hyderabad (Central Hub)">Main Branch - Hyderabad</option>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Walk-ins</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{walkInsCount}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">+12%</span> vs yesterday
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Samples</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TestTube className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingSamplesCount}</p>
          <p className="text-xs text-amber-600 font-medium mt-1">Phlebotomy / Transport</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pathologist Approval</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{awaitingApprovalCount}</p>
          <p className="text-xs text-purple-600 font-medium mt-1">Awaiting Sign-off</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reports Published</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{reportsPublishedCount}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Ready for Patient</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{todayRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">Billing Counter Total</p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Operational Stations & Module Shortcuts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Station 1: Reception Desk */}
          <div
            onClick={() => navigate('/operations/patients')}
            className="group cursor-pointer bg-slate-50 hover:bg-blue-50/60 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition">
                Reception Desk
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Walk-in patient registration, lab visit creation, test catalog selection & billing receipts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>Open Desk Portal</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Station 2: Technician Workstation */}
          <div
            onClick={() => navigate('/operations/samples')}
            className="group cursor-pointer bg-slate-50 hover:bg-amber-50/60 p-5 rounded-2xl border border-slate-200 hover:border-amber-300 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition">
                <TestTube className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition">
                Specimen Tracking
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Phlebotomy tube collection, barcode generation (`LLD-2026-X892`), and sample matrix tracking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>Sample Workstation</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Station 3: Result Entry */}
          <div
            onClick={() => navigate('/operations/results')}
            className="group cursor-pointer bg-slate-50 hover:bg-indigo-50/60 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition">
                <Microscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-700 transition">
                Result Entry Form
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Enter lab analyzer test parameters, check reference ranges, and flag critical/abnormal values.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Enter Analyzer Values</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Station 4: Pathologist Approvals */}
          <div
            onClick={() => navigate('/operations/approvals')}
            className="group cursor-pointer bg-slate-50 hover:bg-purple-50/60 p-5 rounded-2xl border border-slate-200 hover:border-purple-300 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition">
                Pathologist Sign-Off
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Review flagged test parameters, verify patient medical history, attach digital stamp, and publish reports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Verification Queue</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Operational Control Hub Content Grid: Left Queue Matrix & Right Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Quick Queue Counter Filters & Live Patient Queue Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Live Operational Queue Matrix
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filter patient visits by their current stage in the laboratory lifecycle.
                </p>
              </div>

              {/* Search Control */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, ID, test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Queue Counter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedQueueFilter('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedQueueFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Active ({filteredVisitsByBranch.length})
              </button>

              <button
                onClick={() => setSelectedQueueFilter('REGISTERED')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedQueueFilter === 'REGISTERED'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Registered ({registeredQueue})
              </button>

              <button
                onClick={() => setSelectedQueueFilter('SAMPLES_COLLECTED')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedQueueFilter === 'SAMPLES_COLLECTED'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Samples Drawn ({samplesCollectedQueue})
              </button>

              <button
                onClick={() => setSelectedQueueFilter('IN_LAB')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedQueueFilter === 'IN_LAB'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                In Lab / Analyzer ({inLabQueue})
              </button>

              <button
                onClick={() => setSelectedQueueFilter('RESULTS_ENTERED')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedQueueFilter === 'RESULTS_ENTERED'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Needs Sign-Off ({resultsEnteredQueue})
              </button>

              <button
                onClick={() => setSelectedQueueFilter('APPROVED')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedQueueFilter === 'APPROVED' || selectedQueueFilter === 'PUBLISHED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Published ({approvedQueue})
              </button>
            </div>

            {/* High-density Queue Data Table */}
            <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Visit ID</th>
                    <th className="py-3 px-4">Patient Demographics</th>
                    <th className="py-3 px-4">Assigned Diagnostic Tests</th>
                    <th className="py-3 px-4">Billing</th>
                    <th className="py-3 px-4">Operational Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedQueueVisits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active lab visits match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    displayedQueueVisits.map((v) => (
                      <tr key={v.visit_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {v.visit_id}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">{v.created_at?.slice(11, 16)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{v.patient_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {v.patient_age} yrs, {v.patient_gender} • {v.patient_id}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-semibold" title={v.tests_summary}>
                          {v.tests_summary}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">₹{v.total_amount}</span>
                          <span
                            className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              v.payment_status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {v.payment_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {v.status === 'REGISTERED' && (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              <UserPlus className="w-3 h-3" /> REGISTERED
                            </span>
                          )}
                          {v.status === 'SAMPLES_COLLECTED' && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              <TestTube className="w-3 h-3" /> SAMPLE DRAWN
                            </span>
                          )}
                          {v.status === 'IN_LAB' && (
                            <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              <Microscope className="w-3 h-3" /> IN ANALYZER
                            </span>
                          )}
                          {v.status === 'RESULTS_ENTERED' && (
                            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3" /> PATHOLOGIST REVIEW
                            </span>
                          )}
                          {(v.status === 'APPROVED' || v.status === 'PUBLISHED') && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> PUBLISHED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {v.status === 'REGISTERED' && (
                            <button
                              onClick={() => navigate('/operations/samples')}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                            >
                              Collect
                            </button>
                          )}
                          {v.status === 'SAMPLES_COLLECTED' && (
                            <button
                              onClick={() => navigate('/operations/results')}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                            >
                              Enter Result
                            </button>
                          )}
                          {v.status === 'RESULTS_ENTERED' && (
                            <button
                              onClick={() => navigate('/operations/approvals')}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                            >
                              Verify
                            </button>
                          )}
                          {(v.status === 'APPROVED' || v.status === 'PUBLISHED') && (
                            <button
                              onClick={() => navigate('/operations/approvals')}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                            >
                              View Report
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Live Operational Activity Stream Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Live Operational Stream
                </h2>
                <p className="text-xs text-slate-500">Real-time audit log of staff actions.</p>
              </div>

              <button
                onClick={loadData}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                title="Refresh Feed"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent activity logs recorded.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1 hover:bg-slate-100/60 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        {log.actor} ({log.role})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-snug">{log.details}</p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Action: {log.action} • {log.branch}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
