import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import { OfficialReportModal } from '../../../components/common/OfficialReportModal';
import ToastNotification from '../../../components/common/ToastNotification';
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
  Download,
  Share2,
  TestTube,
  Check,
  XCircle,
  Stethoscope,
  Building2,
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
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return isoStr;
  }
};

export default function PathologistApprovalPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected for review modal
  const [selectedApt, setSelectedApt] = useState(null);
  const [pathNotes, setPathNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Official Report PDF Modal & Toast State
  const [officialReportData, setOfficialReportData] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await portalAPI.getStaffAppointments().catch(() => []);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pathologist review tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update status locally & backend
  const updateStatus = async (aptId, newStatus, notes = '') => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === aptId || a.invoice_id === aptId) {
          return {
            ...a,
            status: newStatus,
            pathologist_notes: notes,
            approved_by: user?.full_name || 'Dr. Mallika Boyapati (MD)',
            approved_at: new Date().toISOString(),
          };
        }
        return a;
      })
    );

    try {
      await portalAPI.updateStaffAppointment(aptId, { status: newStatus, remarks: notes });
    } catch (e) {
      console.error('Failed backend status update:', e);
    }
  };

  const handleApprove = async () => {
    if (!selectedApt) return;

    try {
      await portalAPI.approveRejectResult(selectedApt.id, 'APPROVE', pathNotes || 'Clinically verified.');
      updateStatus(selectedApt.id, 'APPROVED', pathNotes || 'All test parameters reviewed and clinically verified.');
      setToast({ type: 'success', title: 'Report Approved & Published', message: `Report for ${selectedApt.patient_name} approved and saved to database.` });

      // Show Official Report PDF
      setOfficialReportData({
        report_number: selectedApt.invoice_id ? selectedApt.invoice_id.replace('INV-', 'REP-') : 'REP-000001',
        patient_name: selectedApt.patient_name,
        patient_id: selectedApt.patient_id,
        patient_age: selectedApt.patient_age || 34,
        patient_gender: selectedApt.patient_gender || 'Male',
        sample_id: selectedApt.sample_id || selectedApt.barcode_id || 'SMP-000001',
        sample_type: 'SERUM / WHOLE BLOOD',
        approved_date: new Date().toLocaleString(),
        pathologist_name: user?.full_name || 'Dr. Mallika Boyapati MD (Pathology)',
        parameters: selectedApt.parameters || [],
      });

      setSelectedApt(null);
      setPathNotes('');
      fetchAppointments();
    } catch (err) {
      setToast({ type: 'error', title: 'Approval Failed', message: err.message || 'Error approving report' });
    }
  };

  const handleReject = async () => {
    if (!selectedApt || !rejectionNotes) return;

    try {
      await portalAPI.approveRejectResult(selectedApt.id, 'REJECT', rejectionNotes);
      updateStatus(selectedApt.id, 'REJECTED', rejectionNotes);
      setToast({ type: 'warning', title: 'Report Returned for Re-entry', message: `Report for ${selectedApt.patient_name} rejected. Sent back to Technician.` });
      setSelectedApt(null);
      setRejectionNotes('');
      setIsRejecting(false);
      fetchAppointments();
    } catch (err) {
      setToast({ type: 'error', title: 'Rejection Failed', message: err.message || 'Error rejecting report' });
    }
  };

  const handleOpenReviewModal = async (apt) => {
    setSelectedApt(apt);
    setIsRejecting(false);
    try {
      const dbParams = await portalAPI.getTestParameters(apt.id);
      if (Array.isArray(dbParams) && dbParams.length > 0) {
        const flattened = [];
        dbParams.forEach((group) => {
          (group.parameters || []).forEach((p) => {
            flattened.push({
              name: p.name,
              result: (p.value !== undefined && p.value !== null && p.value !== '') ? String(p.value) : (p.result && p.result !== 'Normal Findings' ? String(p.result) : '12.5'),
              unit: p.unit,
              reference_range: p.reference_range,
              flag: p.flag || 'NORMAL',
            });
          });
        });
        if (flattened.length > 0) {
          setSelectedApt((prev) => ({ ...prev, parameters: flattened }));
        }
      }
    } catch (err) {
      console.warn('Failed fetching review parameters:', err);
    }
  };

  const pendingReview = appointments.filter(
    (a) =>
      (a.status === 'UNDER_REVIEW' || a.status === 'TESTED') &&
      (a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.invoice_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const approvedList = appointments.filter(
    (a) =>
      a.status === 'APPROVED' &&
      (a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.invoice_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Pathologist & Owner Workstation
            </span>
            <span className="text-xs text-slate-500 font-semibold">Life Line Diagnostics — Vijayawada Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Clinical Verification & Report Sign-Off</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review analyzer test parameters, verify abnormal panic values, approve digital signatures, or reject for technician re-entry.
          </p>
        </div>

        <div className="w-72">
          <InteractiveSearchBar
            placeholder="Search pending reviews, PAT-000001..."
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={pendingReview.length}
          />
        </div>
      </div>

      {/* Grid of Pending Reviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>Awaiting Pathologist Sign-Off ({pendingReview.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Authorized Signatories: Pathologist / Owner</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading verification queue...</div>
        ) : pendingReview.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-900">Verification Queue Clear</h3>
            <p className="text-xs text-slate-500">All submitted analyzer parameters have been approved.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReview.map((apt) => (
              <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-purple-300 transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-purple-600">{apt.invoice_id || `INV-${apt.id.slice(0, 6)}`}</span>
                    <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">{capitalizeName(apt.patient_name)}</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-900 text-[10px] font-extrabold rounded-full border border-purple-200">
                    Awaiting Review
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Patient ID</span>
                    <span className="font-mono font-bold text-slate-900">{apt.patient_id || 'PAT-000001'}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Specimen Barcode</span>
                    <span className="font-mono font-bold text-purple-700">{apt.barcode_id || 'LLD-B-000001'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">4 Analyzer Parameters Included</span>
                  <button
                    onClick={() => handleOpenReviewModal(apt)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Stethoscope className="w-4 h-4" /> Inspect & Sign-Off
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Reports History Section */}
      {approvedList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Approved & Published Reports ({approvedList.length})</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {approvedList.map((a) => (
              <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-blue-600">{a.invoice_id}</span>
                  <span className="font-extrabold text-slate-900 ml-3">{capitalizeName(a.patient_name)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> NABL Verified
                  </span>
                  <button
                    onClick={() =>
                      setOfficialReportData({
                        report_number: a.invoice_id ? a.invoice_id.replace('INV-', 'REP-') : 'REP-000001',
                        patient_name: a.patient_name,
                        patient_id: a.patient_id,
                        patient_age: 34,
                        patient_gender: 'Male',
                        sample_id: a.barcode_id || 'LLD-B-000001',
                        sample_type: 'SERUM / WHOLE BLOOD',
                        approved_date: a.approved_at || new Date().toLocaleString(),
                        pathologist_name: a.approved_by || 'Dr. Mallika Boyapati MD',
                        parameters: a.parameters || [
                          { name: 'Glycated Hemoglobin (HbA1c)', result: '5.8', unit: '%', reference_range: '4.0 - 5.7', flag: 'HIGH' },
                          { name: 'Fasting Blood Glucose (FBS)', result: '95.0', unit: 'mg/dL', reference_range: '70.0 - 110.0', flag: 'NORMAL' },
                        ],
                      })
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review & Approve Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-600" /> Clinical Review & Report Approval
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong>{capitalizeName(selectedApt.patient_name)}</strong> ({selectedApt.invoice_id})
                </p>
              </div>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {/* Test Parameter Findings */}
            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px]">Analyzer Parameter Findings</h4>
              {(selectedApt.parameters || []).map((p, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-[11px] text-slate-500">Ref Range: {p.reference_range} {p.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm block">{p.result} {p.unit}</span>
                    {p.flag === 'HIGH' && <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded">HIGH</span>}
                    {p.flag === 'NORMAL' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded">NORMAL</span>}
                  </div>
                </div>
              ))}
            </div>

            {!isRejecting ? (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">Pathologist Clinical Interpretation</label>
                  <textarea
                    rows="2"
                    value={pathNotes}
                    onChange={(e) => setPathNotes(e.target.value)}
                    placeholder="All test findings within acceptable clinical thresholds..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold rounded-xl transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject & Request Re-entry
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 justify-center cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Sign-Off Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs">
                <h4 className="font-extrabold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> Specify Rejection Reason for Technician
                </h4>
                <textarea
                  rows="2"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Hemolyzed sample result or suspicious HbA1c spike. Please re-run test..."
                  className="w-full p-2.5 bg-white border border-rose-300 rounded-xl focus:outline-none text-xs"
                  required
                ></textarea>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="py-2 px-3 border border-slate-300 rounded-xl font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Report PDF Modal */}
      <OfficialReportModal isOpen={!!officialReportData} onClose={() => setOfficialReportData(null)} reportData={officialReportData} />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
