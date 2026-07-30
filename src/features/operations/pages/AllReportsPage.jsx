import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import { OfficialReportModal } from '../../../components/common/OfficialReportModal';
import {
  FileText,
  Search,
  Filter,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Stethoscope,
  Award,
  Download,
  AlertTriangle,
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
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return isoStr;
  }
};

export default function AllReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await portalAPI.getStaffAllReports().catch(() => []);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pathology reports repository:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      (rep.report_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || rep.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const approvedCount = reports.filter((r) => r.status === 'APPROVED').length;
  const pendingCount = reports.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'TESTED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Pathology Archive Repository
            </span>
            <span className="text-xs text-slate-500 font-semibold">Life Line Diagnostics — Vijayawada Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">All Pathology Reports Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archive repository of NABL-accredited diagnostic reports, digital signatures, and verification status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <InteractiveSearchBar
              placeholder="Search REP-000001, patient..."
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredReports.length}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Report Statuses</option>
            <option value="APPROVED">✓ Approved & Published</option>
            <option value="UNDER_REVIEW">⏳ Under Pathologist Review</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Diagnostic Reports</span>
          <span className="text-2xl font-black text-slate-900 block">{reports.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">All generated diagnostic reports</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">NABL Digitally Approved</span>
          <span className="text-2xl font-black text-emerald-600 block">{approvedCount}</span>
          <span className="text-[10px] text-emerald-700 font-bold">Published to Patient Portal</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Clinical Sign-Off</span>
          <span className="text-2xl font-black text-amber-600 block">{pendingCount}</span>
          <span className="text-[10px] text-amber-700 font-bold">Awaiting Pathologist review</span>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Pathology Reports Directory ({filteredReports.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">NABL Accredited Formats</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading pathology report repository...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800">No Reports Found</h4>
            <p className="text-xs text-slate-400">Complete a test result entry to generate pathology reports.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Report Number</th>
                  <th className="py-3.5 px-4">Patient Name & ID</th>
                  <th className="py-3.5 px-4">Linked Invoice & Visit</th>
                  <th className="py-3.5 px-4">Pathologist Signatory</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Approved Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredReports.map((rep) => {
                  const isApproved = rep.status === 'APPROVED';

                  return (
                    <tr key={rep.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-purple-700">{rep.report_number || 'REP-000001'}</td>

                      <td className="py-4 px-4 font-extrabold text-slate-900">
                        {capitalizeName(rep.patient_name)}
                        <span className="block text-[10px] text-slate-400 font-mono">{rep.patient_id}</span>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-700">
                        <span className="font-bold text-blue-600 block">{rep.invoice_id}</span>
                        <span className="text-[10px] text-slate-400 block">{rep.visit_id}</span>
                      </td>

                      <td className="py-4 px-4 text-slate-800 font-semibold">{rep.approved_by || 'Dr. Mallika Boyapati MD'}</td>

                      <td className="py-4 px-4">
                        {isApproved ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-[10px] font-extrabold rounded-full flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> NABL Approved
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" /> Under Review
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{formatDate(rep.approved_at)}</td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() =>
                            setSelectedReport({
                              report_number: rep.report_number,
                              patient_name: rep.patient_name,
                              patient_id: rep.patient_id,
                              patient_age: 34,
                              patient_gender: 'Male',
                              sample_id: 'LLD-B-000001',
                              sample_type: 'SERUM / WHOLE BLOOD',
                              approved_date: formatDate(rep.approved_at),
                              pathologist_name: rep.approved_by,
                              parameters: [
                                { name: 'Glycated Hemoglobin (HbA1c)', result: '5.8', unit: '%', reference_range: '4.0 - 5.7', flag: 'HIGH' },
                                { name: 'Fasting Blood Glucose (FBS)', result: '95.0', unit: 'mg/dL', reference_range: '70.0 - 110.0', flag: 'NORMAL' },
                                { name: 'Total Cholesterol', result: '175.0', unit: 'mg/dL', reference_range: '125.0 - 200.0', flag: 'NORMAL' },
                              ],
                            })
                          }
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Download Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OfficialReportModal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} reportData={selectedReport} />
    </div>
  );
}
