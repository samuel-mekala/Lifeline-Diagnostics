import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import portalAPI from '../../../services/portalAPI';
import OfficialReportModal from '../../../components/common/OfficialReportModal';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import { useAuth } from '../../../providers/AuthProvider';
import {
  FileText,
  Download,
  Lock,
  CheckCircle2,
  Search,
  Eye,
  Printer,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export const MyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null); // For Official Report Modal
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const data = await portalAPI.getReports();
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Reports load error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReports();
  }, [user]);

  // Filter Reports
  const filteredReports = reports.filter((r) =>
    (r.title || r.report_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.report_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.visit_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const patientId = user?.patient_id || reports[0]?.patient_id || 'PAT000002';


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Diagnostic Reports</h1>
            <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
              Patient ID: {patientId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Access, view, and print your signed NABL-certified diagnostic result reports.
          </p>
        </div>

        <div className="w-64">
          <InteractiveSearchBar
            placeholder="Search report ID, test name or visit..."
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={[
              'REP-2026-9081',
              'VISIT-1001',
              'Complete Blood Count (CBC)',
              'Thyroid Profile (T3, T4, TSH)',
              'Lipid Profile',
            ]}
            resultCount={filteredReports.length}
          />
        </div>
      </div>

      {/* Security Rule Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <p className="font-bold">Automated Report Release Security Rule</p>
          <p className="text-blue-700 mt-0.5">
            Diagnostic reports are automatically published here upon Pathologist digital approval. In accordance with laboratory policy, official PDF download is unlocked immediately once invoice payment is settled.
          </p>
        </div>
      </div>

      {/* Reports Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Report & Visit Ref</th>
                <th className="py-3.5 px-4">Diagnostic Test Title</th>
                <th className="py-3.5 px-4">Generated Date</th>
                <th className="py-3.5 px-4">Pathologist</th>
                <th className="py-3.5 px-4">Release Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredReports.map((report) => {
                const isPaid = report.payment_status === 'PAID';
                return (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{report.report_number}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Visit: {report.visit_id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {report.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(report.generated_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {report.pathologist_name}
                    </td>
                    <td className="py-3.5 px-4">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Unlocked &amp; Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" /> Payment Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isPaid ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Report
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const fname = `${report.report_id || 'report'}_${report.visit_id || 'visit'}.pdf`;
                                await portalAPI.downloadReportPdf(report.visit_id, fname);
                              } catch (err) {
                                alert(portalAPI.getErrorMessage ? portalAPI.getErrorMessage(err) : 'Failed to download report PDF.');
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                          >
                            <Download className="w-3.5 h-3.5" /> Download PDF
                          </button>
                        </div>
                      ) : (
                        <Link
                          to="/portal/invoices"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay Invoice to Release
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                    No diagnostic reports found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signed Report Modal */}
      <OfficialReportModal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        reportData={selectedReport}
        patientInfo={user}
      />
    </div>
  );
};

export default MyReportsPage;
