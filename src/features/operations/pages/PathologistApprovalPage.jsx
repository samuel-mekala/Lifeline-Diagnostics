import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import OperationsDataStore from '../services/operationsData';
import PortalDataStore from '../../portal/services/portalData';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Printer,
  ShieldCheck,
  X,
  Clock,
  Sparkles,
  FileText,
  UserCheck,
  Award,
  QrCode,
  Download,
  Share2,
  TestTube,
} from 'lucide-react';

export default function PathologistApprovalPage({ mode: propMode }) {
  const { user } = useAuth();
  const location = useLocation();

  const activeMode = propMode || (location.pathname.includes('/samples') ? 'samples' : 'approvals');
  const isSampleAuditMode = activeMode === 'samples';

  const [visits, setVisits] = useState([]);
  const [results, setResults] = useState({});
  const [selectedVisitForApproval, setSelectedVisitForApproval] = useState(null);
  const [showReportPreviewModal, setShowReportPreviewModal] = useState(null);

  const [pathologistNotes, setPathologistNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    setVisits(OperationsDataStore.getVisits());
    setResults(OperationsDataStore.getResults());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter Visits awaiting Pathologist Verification or Already Approved
  const pendingVisits = visits.filter(
    (v) =>
      v.status === 'RESULTS_ENTERED' &&
      (v.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.visit_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const approvedVisits = visits.filter(
    (v) =>
      (v.status === 'APPROVED' || v.status === 'PUBLISHED') &&
      (v.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.visit_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle Approve & Sign-Off Report
  const handleApproveReport = () => {
    if (!selectedVisitForApproval) return;

    OperationsDataStore.approveReport(
      selectedVisitForApproval.visit_id,
      pathologistNotes || 'All parameter findings verified and signed off.',
      user?.full_name || 'Dr. Sunita Rao (MD, Path)'
    );

    refreshData();
    setShowReportPreviewModal(selectedVisitForApproval);
    setSelectedVisitForApproval(null);
    setPathologistNotes('');
  };

  // Handle Request Re-run / Re-sample
  const handleRequestRerun = () => {
    if (!selectedVisitForApproval) return;
    if (!pathologistNotes) {
      alert('Please enter a note explaining why a re-run or re-sample is required.');
      return;
    }

    OperationsDataStore.rejectReport(
      selectedVisitForApproval.visit_id,
      pathologistNotes,
      user?.full_name || 'Dr. Sunita Rao (MD, Path)'
    );

    refreshData();
    setSelectedVisitForApproval(null);
    setPathologistNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> PATHOLOGIST APPROVAL DESK
            </span>
            <span className="text-xs text-slate-400">Chief Pathologist: Dr. Sunita Rao (MD, Path)</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Diagnostic Report Verification & Digital Sign-Off</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review lab technician analyzer parameter entries, check flag indicators, apply digital pathologist stamp, and approve reports for patient release.
          </p>
        </div>
      </div>

      {/* Main Grid: Pending Queue & Approved Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Pending Approvals Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Pending Sign-Off Queue ({pendingVisits.length})
            </h2>

            <div className="w-56">
              <InteractiveSearchBar
                placeholder="Search visit ID or patient..."
                value={searchQuery}
                onChange={setSearchQuery}
                suggestions={[
                  'VISIT-1001',
                  'VISIT-1002',
                  'Rajesh Kumar',
                  'ABNORMAL VALUES',
                  'CBC Profile',
                ]}
                resultCount={pendingVisits.length}
              />
            </div>
          </div>

          <div className="space-y-3">
            {pendingVisits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No reports currently awaiting pathologist verification.
              </div>
            ) : (
              pendingVisits.map((v) => {
                const res = results[v.visit_id];
                const hasAbnormal = res?.parameters?.some((p) => p.flag === 'HIGH' || p.flag === 'CRITICAL');

                return (
                  <div
                    key={v.visit_id}
                    onClick={() => setSelectedVisitForApproval(v)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/40 cursor-pointer transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-xs">{v.visit_id}</span>
                      {hasAbnormal ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> ABNORMAL VALUES FLAGGED
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          NORMAL RANGE
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-slate-900 text-sm">{v.patient_name}</div>
                    <div className="text-xs text-slate-600 font-medium">{v.tests_summary}</div>
                    <div className="text-[11px] text-slate-500">Tech Notes: {v.technician_notes || 'None'}</div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-purple-600">
                      <span>Click to open verification modal</span>
                      <FileCheck className="w-4 h-4" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Recently Approved & Published Reports */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Signed & Published Reports ({approvedVisits.length})
          </h2>

          <div className="space-y-3">
            {approvedVisits.map((v) => (
              <div
                key={v.visit_id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{v.patient_name}</div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    {v.visit_id} • {v.tests_summary}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">
                    ✓ Verified & Digitally Signed by Dr. Sunita Rao
                  </div>
                </div>

                <button
                  onClick={() => setShowReportPreviewModal(v)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> View PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: PATHOLOGIST VERIFICATION & SIGN-OFF MODAL */}
      {selectedVisitForApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  Pathology Parameter Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: <strong>{selectedVisitForApproval.patient_name}</strong> (
                  {selectedVisitForApproval.patient_age} yrs, {selectedVisitForApproval.patient_gender})
                </p>
              </div>

              <button
                onClick={() => setSelectedVisitForApproval(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parameter Measurement List */}
            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold uppercase text-slate-500 tracking-wider">
                Analyzer Parameter Results for {selectedVisitForApproval.tests_summary}
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {results[selectedVisitForApproval.visit_id]?.parameters?.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <div className="text-[10px] text-slate-400">Ref Range: {p.reference_range}</div>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-sm font-black text-slate-900">
                        {p.result} {p.unit}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          p.flag === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : p.flag === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.flag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pathologist Verification Notes */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Pathologist Interpretation & Remarks</label>
              <textarea
                rows={2}
                placeholder="e.g. Clinical correlation suggested. Values checked."
                value={pathologistNotes}
                onChange={(e) => setPathologistNotes(e.target.value)}
                className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none"
              ></textarea>
            </div>

            {/* Pathologist Stamp Badge */}
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold">
                DR
              </div>
              <div>
                <div className="font-bold text-slate-900">Dr. Sunita Rao (MD, Pathology)</div>
                <div className="text-[10px] text-purple-700 font-medium">
                  Reg No: TSMC/2014/9082 • Digital Certificate Key Validated
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={handleRequestRerun}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Request Re-Run / Correction
              </button>

              <button
                onClick={handleApproveReport}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Attach Digital Stamp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: OFFICIAL DIAGNOSTIC REPORT PDF PREVIEW WITH LETTERHEAD */}
      {showReportPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Official Patient Diagnostic Report (A4 Letterhead)
              </h3>
              <button
                onClick={() => setShowReportPreviewModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Letterhead Report Content */}
            <div className="bg-white p-6 border-2 border-slate-200 rounded-xl space-y-4 text-xs font-sans text-slate-800">
              {/* Header Letterhead Banner */}
              <div className="border-b-2 border-blue-600 pb-3 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black text-blue-700 tracking-tight">LIFE LINE DIAGNOSTICS</h1>
                  <p className="text-[10px] text-slate-500 font-bold">NABL ACCREDITED & ISO 9001:2015 CERTIFIED LAB</p>
                  <p className="text-[10px] text-slate-400">Road No 1, Banjara Hills, Hyderabad • Phone: +91 40 6789 0000</p>
                </div>
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>

              {/* Patient Info Bar */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                <div>
                  <div>
                    Patient Name: <strong>{showReportPreviewModal.patient_name}</strong>
                  </div>
                  <div>
                    Age / Gender: <strong>{showReportPreviewModal.patient_age} yrs / {showReportPreviewModal.patient_gender}</strong>
                  </div>
                  <div>
                    Visit ID: <strong className="font-mono">{showReportPreviewModal.visit_id}</strong>
                  </div>
                </div>
                <div>
                  <div>
                    Report Date: <strong>{new Date().toLocaleDateString()}</strong>
                  </div>
                  <div>
                    Ref Doctor: <strong>Self Walk-In</strong>
                  </div>
                  <div>
                    Verification: <strong className="text-emerald-700">VERIFIED & APPROVED</strong>
                  </div>
                </div>
              </div>

              {/* Parameter Table */}
              <div className="space-y-2">
                <h2 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1">
                  {showReportPreviewModal.tests_summary}
                </h2>

                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-600 text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Test Parameter</th>
                      <th className="p-2">Observed Value</th>
                      <th className="p-2">Units</th>
                      <th className="p-2">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {results[showReportPreviewModal.visit_id]?.parameters?.map((p, i) => (
                      <tr key={i}>
                        <td className="p-2 font-bold text-slate-900">{p.name}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{p.result}</td>
                        <td className="p-2 font-mono text-slate-500">{p.unit}</td>
                        <td className="p-2 font-mono text-slate-500">{p.reference_range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Digital Stamp & Signature */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  Electronically generated report. Verification Token: <span className="font-mono">ver_tok_{showReportPreviewModal.visit_id}</span>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900">Dr. Sunita Rao (MD, Path)</div>
                  <div className="text-[10px] text-purple-700 font-bold">Chief Pathologist & Lab Director</div>
                  <div className="text-[9px] text-slate-400">Digitally Signed & Validated</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
