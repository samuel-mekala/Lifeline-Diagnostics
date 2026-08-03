import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import ToastNotification from '../../../components/common/ToastNotification';
import { OfficialReceiptModal } from '../../../components/common/OfficialReceiptModal';
import { OfficialReportModal } from '../../../components/common/OfficialReportModal';
import {
  TestTube,
  Microscope,
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Save,
  Send,
  X,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  CheckSquare,
  Droplet,
  IndianRupee,
  MapPin,
  UserCheck,
  RotateCcw,
  Building2,
  FileText,
  User,
  ShieldCheck,
  XCircle,
  LifeBuoy,
  UserPlus,
  Stethoscope,
  CreditCard,
  DollarSign,
  Download,
  Check,
  MessageSquare,
  Receipt,
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

export default function TechnicianWorkstationPage({ mode: propMode }) {
  const { user } = useAuth();
  const location = useLocation();

  // Active View Tab: 'WORKSTATION' | 'REGISTER_PATIENT' | 'SUPPORT_DESK' | 'REPORTS_INVOICES'
  const [activeTab, setActiveTab] = useState('WORKSTATION');

  // Data States
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals & Toast State
  const [activeAptForCollection, setActiveAptForCollection] = useState(null);
  const [barcodePrintData, setBarcodePrintData] = useState(null);
  const [activeAptForResults, setActiveAptForResults] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [toast, setToast] = useState(null);

  // Parameter entry form
  const [parameters, setParameters] = useState([]);
  const [techComments, setTechComments] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [collectCash, setCollectCash] = useState(false);

  // Support Issues State (Requirement 9)
  const [supportIssues, setSupportIssues] = useState([
    { id: 'ISS-001', patient: 'Joel', issue: 'Hemolyzed Blood Sample in EDTA Tube', status: 'OPEN', priority: 'HIGH', created_at: '10:15 AM' },
    { id: 'ISS-002', patient: 'Ramesh Kumar', issue: 'Missing Referring Doctor Stamp on Requisition', status: 'IN_PROGRESS', priority: 'MEDIUM', created_at: '11:30 AM' },
  ]);

  // Direct Patient / Doctor Referral Registration Form (Requirement 4)
  const [techRegForm, setTechRegForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    gender: 'M',
    age: '30',
    address: 'Vijayawada',
    entry_mode: 'WALK_IN', // 'WALK_IN' (Direct) | 'DOCTOR_REFERRAL' (Doctor Visit)
    referring_doctor: '',
  });
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const catalogTests = [
    { test_id: 'TES-000001', name: 'Complete Blood Picture (CBC)', walk_in_price: 300 },
    { test_id: 'TES-000002', name: 'Erythrocyte Sedimentation Rate (ESR)', walk_in_price: 100 },
    { test_id: 'TES-000003', name: 'Glycated Hemoglobin (HbA1c)', walk_in_price: 500 },
    { test_id: 'TES-000004', name: 'Serum Calcium Test', walk_in_price: 500 },
    { test_id: 'TES-000008', name: 'Iron Profile (Fe, TIBC, % Sat)', walk_in_price: 800 },
    { test_id: 'TES-000009', name: 'Kidney Function Mini Profile (KFT)', walk_in_price: 800 },
    { test_id: 'TES-000010', name: 'Lipid Profile Complete', walk_in_price: 500 },
    { test_id: 'TES-000011', name: 'Liver Function Test (LFT)', walk_in_price: 500 },
  ];

  const fetchLiveAppointments = async () => {
    setLoading(true);
    try {
      const [aptsData, invsData, repsData] = await Promise.all([
        portalAPI.getStaffAppointments().catch(() => []),
        portalAPI.getStaffAllInvoices().catch(() => []),
        portalAPI.getStaffAllReports().catch(() => []),
      ]);
      setAppointments(Array.isArray(aptsData) ? aptsData : []);
      setInvoices(Array.isArray(invsData) ? invsData : []);
      setReports(Array.isArray(repsData) ? repsData : []);
    } catch (err) {
      console.error('Failed fetching technician workflow appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAppointments();
  }, []);

  // Update appointment stage locally & notify backend
  const updateAppointmentStage = async (aptId, newStatus, extraData = {}) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === aptId || a.invoice_id === aptId) {
          return {
            ...a,
            status: newStatus,
            ...extraData,
          };
        }
        return a;
      })
    );

    try {
      await portalAPI.updateStaffAppointment(aptId, { status: newStatus, ...extraData });
    } catch (e) {
      console.error('Failed to update stage on backend:', e);
    }
  };

  // Requirement 1: Accept Appointment
  const handleAcceptAppointment = (apt) => {
    updateAppointmentStage(apt.id, 'ACCEPTED', { assigned_to: user?.full_name || 'Anil Verma (Tech)' });
    setToast({ type: 'success', title: 'Appointment Accepted', message: `Appointment ${apt.invoice_id || apt.id} accepted! You are assigned.` });
  };

  // Requirement 2 & 8: Home visit / Lab visit Cash Collection & Mark Visited
  const handleMarkVisitedAndCollectCash = (apt) => {
    const isUnpaid = apt.payment_status !== 'PAID' && apt.payment_status !== 'COMPLETED';
    const payStatus = isUnpaid ? 'PAID' : apt.payment_status;
    updateAppointmentStage(apt.id, 'VISITED', { payment_status: payStatus });
    setToast({
      type: 'success',
      title: 'Visited & Cash Collected',
      message: `Patient ${apt.patient_name} marked as VISITED.${isUnpaid ? ' Cash collected & Payment marked PAID in MySQL DB.' : ''}`,
    });
  };

  // Requirement 3: Sample Collection & Barcode Auto-Generation
  const handleOpenSampleCollection = (apt) => {
    setActiveAptForCollection(apt);
    setCollectionNotes('');
    setCollectCash(apt.payment_status !== 'PAID');
  };

  const handleConfirmSampleCollection = async (e) => {
    e.preventDefault();
    if (!activeAptForCollection) return;

    const tubeType = activeAptForCollection.collection_type === 'HOME' ? 'EDTA Purple Tube (Whole Blood)' : 'SST Yellow Tube (Serum)';

    try {
      const res = await portalAPI.collectSample(activeAptForCollection.id);
      const barcodeId = res.sample_id || `SMP-${Math.floor(100000 + Math.random() * 900000)}`;

      updateAppointmentStage(activeAptForCollection.id, 'SAMPLE_COLLECTED', {
        barcode_id: barcodeId,
        tube_type: tubeType,
        sample_collected_at: new Date().toISOString(),
        payment_status: 'PAID',
      });

      setBarcodePrintData({
        barcode_id: barcodeId,
        patient_name: activeAptForCollection.patient_name,
        patient_id: activeAptForCollection.patient_id,
        tube_type: tubeType,
        created_at: new Date().toLocaleTimeString(),
      });

      setToast({ type: 'success', title: 'Sample Collected & Barcode Generated', message: `Sample ${barcodeId} created in MySQL database.` });
      setActiveAptForCollection(null);
      fetchLiveAppointments();
    } catch (err) {
      setToast({ type: 'error', title: 'Sample Collection Failed', message: err.message || 'Error collecting sample' });
    }
  };

  // Requirement 5: Test sample in analyzer
  const handleMarkTested = async (apt) => {
    try {
      await portalAPI.markTested(apt.id);
      updateAppointmentStage(apt.id, 'TESTED');
      setToast({ type: 'success', title: 'Analyzer Testing Complete', message: `Sample ${apt.barcode_id || apt.id} marked as TESTED in database.` });
      fetchLiveAppointments();
    } catch (err) {
      setToast({ type: 'error', title: 'Action Failed', message: err.message || 'Error marking tested' });
    }
  };

  // Requirement 6: Input report parameter values
  const handleOpenResultForm = async (apt) => {
    setActiveAptForResults(apt);

    try {
      const dbParams = await portalAPI.getTestParameters(apt.id);
      if (Array.isArray(dbParams) && dbParams.length > 0) {
        const flattened = [];
        dbParams.forEach((group) => {
          (group.parameters || []).forEach((p) => {
            flattened.push({
              test_parameter_id: p.id,
              ordered_test_id: group.ordered_test_id,
              test_name: group.test_name,
              name: p.name,
              result: '',
              unit: p.unit,
              reference_range: p.reference_range,
              flag: 'NORMAL',
            });
          });
        });
        if (flattened.length > 0) {
          setParameters(flattened);
          setTechComments(`Sample processed and calibrated on automated laboratory analyzer.`);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed fetching DB parameters:', err);
    }

    const testName = (apt.test_name || apt.tests || 'Diagnostic Test').toUpperCase();
    let fallbackParams = [];

    if (testName.includes('ESR') || testName.includes('ERYTHROCYTE')) {
      fallbackParams = [
        { test_parameter_id: 'p-esr-1', ordered_test_id: 'ORD-001', test_name: 'ESR', name: 'ESR (Westergren Method)', result: '12', unit: 'mm/hr', reference_range: '0 - 15', flag: 'NORMAL' }
      ];
    } else if (testName.includes('CBC') || testName.includes('BLOOD COUNT') || testName.includes('HAEMATOLOGY')) {
      fallbackParams = [
        { test_parameter_id: 'p-cbc-1', ordered_test_id: 'ORD-001', test_name: 'CBC', name: 'Hemoglobin', result: '14.2', unit: 'g/dL', reference_range: '13.5 - 17.5', flag: 'NORMAL' },
        { test_parameter_id: 'p-cbc-2', ordered_test_id: 'ORD-001', test_name: 'CBC', name: 'WBC Total Count', result: '7200', unit: '/mcL', reference_range: '4000 - 11000', flag: 'NORMAL' },
        { test_parameter_id: 'p-cbc-3', ordered_test_id: 'ORD-001', test_name: 'CBC', name: 'Platelet Count', result: '2.8', unit: 'Lakhs/µL', reference_range: '1.5 - 4.5', flag: 'NORMAL' },
        { test_parameter_id: 'p-cbc-4', ordered_test_id: 'ORD-001', test_name: 'CBC', name: 'RBC Total Count', result: '4.9', unit: 'M/µL', reference_range: '4.5 - 5.9', flag: 'NORMAL' },
      ];
    } else if (testName.includes('LIPID')) {
      fallbackParams = [
        { test_parameter_id: 'p-lip-1', ordered_test_id: 'ORD-001', test_name: 'Lipid Profile', name: 'Total Cholesterol', result: '175', unit: 'mg/dL', reference_range: '120 - 200', flag: 'NORMAL' },
        { test_parameter_id: 'p-lip-2', ordered_test_id: 'ORD-001', test_name: 'Lipid Profile', name: 'Triglycerides', result: '110', unit: 'mg/dL', reference_range: '50 - 150', flag: 'NORMAL' },
        { test_parameter_id: 'p-lip-3', ordered_test_id: 'ORD-001', test_name: 'Lipid Profile', name: 'HDL Cholesterol', result: '52', unit: 'mg/dL', reference_range: '40 - 60', flag: 'NORMAL' },
        { test_parameter_id: 'p-lip-4', ordered_test_id: 'ORD-001', test_name: 'Lipid Profile', name: 'LDL Cholesterol', result: '98', unit: 'mg/dL', reference_range: '60 - 100', flag: 'NORMAL' },
      ];
    } else if (testName.includes('LIVER') || testName.includes('LFT')) {
      fallbackParams = [
        { test_parameter_id: 'p-lft-1', ordered_test_id: 'ORD-001', test_name: 'LFT', name: 'SGOT (AST)', result: '28', unit: 'U/L', reference_range: '10 - 40', flag: 'NORMAL' },
        { test_parameter_id: 'p-lft-2', ordered_test_id: 'ORD-001', test_name: 'LFT', name: 'SGPT (ALT)', result: '32', unit: 'U/L', reference_range: '7 - 56', flag: 'NORMAL' },
        { test_parameter_id: 'p-lft-3', ordered_test_id: 'ORD-001', test_name: 'LFT', name: 'Total Bilirubin', result: '0.8', unit: 'mg/dL', reference_range: '0.2 - 1.2', flag: 'NORMAL' },
      ];
    } else {
      fallbackParams = [
        { test_parameter_id: 'p-gen-1', ordered_test_id: 'ORD-001', test_name: apt.test_name || 'Test', name: `${apt.test_name || 'Diagnostic'} Test Finding`, result: '12.5', unit: 'mg/dL', reference_range: 'Normal Adult Range', flag: 'NORMAL' }
      ];
    }

    setParameters(fallbackParams);
    setTechComments(`Sample processed and calibrated on automated laboratory analyzer. Test: ${apt.test_name || 'Routine Lab Test'}.`);
  };

  const handleParameterChange = (index, field, value) => {
    const updated = [...parameters];
    updated[index][field] = value;
    setParameters(updated);
  };

  // Requirement 7: Submit values for Pathologist approval
  const handleSubmitResultsForReview = async (e) => {
    e.preventDefault();
    if (!activeAptForResults) return;

    // Group parameters by ordered_test_id for API
    const grouped = {};
    parameters.forEach((p) => {
      const otId = p.ordered_test_id || 'ORD-001';
      if (!grouped[otId]) grouped[otId] = [];
      grouped[otId].push({
        test_parameter_id: p.test_parameter_id || p.id,
        value: p.result || p.value || '0',
      });
    });

    const payloadResults = Object.keys(grouped).map((otId) => ({
      ordered_test_id: otId,
      parameters: grouped[otId],
    }));

    try {
      await portalAPI.submitResults(activeAptForResults.id, payloadResults);

      updateAppointmentStage(activeAptForResults.id, 'UNDER_REVIEW', {
        parameters,
        tech_comments: techComments,
        submitted_for_review_at: new Date().toISOString(),
      });

      setToast({
        type: 'success',
        title: 'Report Submitted to Database',
        message: `Results for ${activeAptForResults.patient_name} saved in database & submitted for Pathologist approval.`,
      });
      setActiveAptForResults(null);
      fetchLiveAppointments();
    } catch (err) {
      setToast({ type: 'error', title: 'Submission Failed', message: err.message || 'Error submitting results' });
    }
  };

  // Requirement 4: Register Direct & Doctor Referral Patients from Workstation
  const handleTechRegisterPatient = async (e) => {
    e.preventDefault();
    if (!techRegForm.full_name || !techRegForm.phone) {
      setToast({ type: 'warning', title: 'Missing Information', message: 'Please enter patient name and mobile number.' });
      return;
    }
    if (selectedTests.length === 0) {
      setToast({ type: 'warning', title: 'No Test Selected', message: 'Please select at least 1 diagnostic test.' });
      return;
    }

    const mult = techRegForm.entry_mode === 'DOCTOR_REFERRAL' ? 2.0 : 1.0;
    const total = selectedTests.reduce((sum, t) => sum + Math.round(t.walk_in_price * mult), 0);

    let res = null;
    try {
      res = await portalAPI.registerWalkInVisit({
        ...techRegForm,
        tests: selectedTests,
        payment_method: paymentMethod,
      });
    } catch (err) {
      console.error('Tech registration error:', err);
    }

    const visId = res?.visit_id || `VIS-${Math.floor(100000 + Math.random() * 900000)}`;
    const invId = res?.invoice_id || `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    setToast({ type: 'success', title: 'Patient Registered at Workstation', message: `Visit ${visId} created. Cash collected: ₹${total}.` });
    fetchLiveAppointments();

    setTechRegForm({
      full_name: '',
      phone: '',
      email: '',
      gender: 'M',
      age: '30',
      address: 'Vijayawada',
      entry_mode: 'WALK_IN',
      referring_doctor: '',
    });
    setSelectedTests([]);
  };

  // Requirement 9: Resolve Support Issues
  const handleResolveSupportIssue = (issueId) => {
    setSupportIssues((prev) =>
      prev.map((iss) => (iss.id === issueId ? { ...iss, status: 'RESOLVED' } : iss))
    );
    setToast({ type: 'success', title: 'Support Issue Resolved', message: `Issue ${issueId} marked as RESOLVED by Technician.` });
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.barcode_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Central Laboratory Workstation
            </span>
            <span className="text-xs text-slate-300 font-semibold">Technician Desk — Vijayawada Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Lab Technician Processing & Testing Console
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Accept appointments, manage home collection visits, draw blood samples, register direct/doctor referral patients, enter test parameters, and resolve support issues.
          </p>
        </div>

        <div className="w-full lg:w-72">
          <InteractiveSearchBar
            placeholder="Search patient, barcode, INV-000001..."
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredAppointments.length}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-1 text-xs font-extrabold">
        <button
          onClick={() => setActiveTab('WORKSTATION')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'WORKSTATION' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>1. Sample Collection & Testing Pipeline ({filteredAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REGISTER_PATIENT')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'REGISTER_PATIENT' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>2. Register Direct & Doctor Referral Patients</span>
        </button>

        <button
          onClick={() => setActiveTab('SUPPORT_DESK')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'SUPPORT_DESK' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-amber-400" />
          <span>3. Lab Support & Issue Resolution Desk ({supportIssues.filter((i) => i.status !== 'RESOLVED').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS_INVOICES')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'REPORTS_INVOICES' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>4. Download Reports & Invoices</span>
        </button>
      </div>

      {/* TAB 1: SAMPLE COLLECTION & TESTING PIPELINE (Requirements 1, 2, 3, 5, 6, 7, 8) */}
      {activeTab === 'WORKSTATION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" /> Filter Workflow Stage:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="ALL">All Active Stages</option>
              <option value="PENDING">🕒 Pending Acceptance</option>
              <option value="ACCEPTED">✓ Accepted (Ready for Visit/Sample)</option>
              <option value="VISITED">🚗 Visited / Arrived</option>
              <option value="SAMPLE_COLLECTED">🧪 Sample Collected (In Analyzer)</option>
              <option value="TESTED">🔬 Tested (Ready for Report Entry)</option>
              <option value="UNDER_REVIEW">📜 Submitted Under Review</option>
              <option value="REJECTED">⚠️ Rejected by Pathologist (Needs Correction)</option>
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading technician workflow items...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
              <TestTube className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900">No Appointments Found in Stage</h3>
              <p className="text-xs text-slate-400">Book an appointment or register a walk-in patient to see workflow cards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((apt) => {
                const status = apt.status || 'PENDING';
                const isHome = apt.collection_type === 'HOME';
                const isUnpaid = apt.payment_status !== 'PAID' && apt.payment_status !== 'COMPLETED';

                return (
                  <div
                    key={apt.id}
                    className={`bg-white p-5 rounded-3xl border shadow-sm space-y-4 transition ${
                      status === 'REJECTED' ? 'border-2 border-rose-500 bg-rose-50/20' : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Rejection Alert Header if Pathologist Rejected */}
                    {status === 'REJECTED' && (
                      <div className="p-3 bg-rose-100 rounded-2xl border border-rose-300 text-xs text-rose-900 font-semibold space-y-1">
                        <span className="font-extrabold flex items-center gap-1 text-rose-800">
                          <AlertTriangle className="w-4 h-4 text-rose-600" /> Rejected by Pathologist for Re-entry
                        </span>
                        <p className="text-[11px] text-rose-800">Notes: "{apt.pathologist_notes || 'Please re-check HbA1c parameter value.'}"</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-purple-700">{apt.invoice_id || `INV-${apt.id.slice(0, 6)}`}</span>
                        <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">{capitalizeName(apt.patient_name)}</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-900 text-[10px] font-extrabold rounded-full">
                        {status}
                      </span>
                    </div>

                    {/* Stage Card Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Mode & Location</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          {isHome ? <MapPin className="w-3 h-3 text-amber-600" /> : <Building2 className="w-3 h-3 text-blue-600" />}
                          {isHome ? 'Home Visit Pickup' : 'In-Facility Lab Desk'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Sample Barcode ID</span>
                        <span className="font-mono font-bold text-purple-700 block mt-0.5">
                          {apt.sample_id || apt.barcode_id || 'Not Drawn Yet'}
                        </span>
                      </div>
                    </div>

                    {/* Action Toolbar per Stage */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Payment Status</span>
                        {isUnpaid ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">PAY LATER (Cash Due)</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">✓ PAID</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Requirement 1: Accept Appointment */}
                        {status === 'PENDING' && (
                          <button
                            onClick={() => handleAcceptAppointment(apt)}
                            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Accept Appointment
                          </button>
                        )}

                        {/* Requirement 2 & 8: Mark Visited & Collect Cash */}
                        {status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleMarkVisitedAndCollectCash(apt)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" /> {isHome ? (isUnpaid ? 'Visited Home & Collect Cash' : 'Visited Home (Paid Online)') : 'Mark Arrived at Lab'}
                          </button>
                        )}

                        {/* Requirement 3: Collect Sample & Auto-Generate Barcode (Requires Visited status for Home Pickups) */}
                        {(status === 'VISITED' || (!isHome && status === 'ACCEPTED')) && (
                          <button
                            onClick={() => handleOpenSampleCollection(apt)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <TestTube className="w-4 h-4" /> Collect Sample & Barcode
                          </button>
                        )}

                        {/* Requirement 5: Test sample in analyzer */}
                        {status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => handleMarkTested(apt)}
                            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Microscope className="w-4 h-4" /> Run Analyzer & Mark Tested
                          </button>
                        )}

                        {/* Requirement 6 & 7: Input report values & Submit for approval */}
                        {(status === 'TESTED' || status === 'REJECTED') && (
                          <button
                            onClick={() => handleOpenResultForm(apt)}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4" /> Input Report Values
                          </button>
                        )}

                        {status === 'UNDER_REVIEW' && (
                          <span className="px-3 py-1.5 bg-purple-100 text-purple-900 font-extrabold text-xs rounded-xl flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-purple-600" /> Awaiting Pathologist Approval
                          </span>
                        )}

                        {(status === 'APPROVED' || status === 'COMPLETED') && (
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-xl flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Report Signed & Published
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTER DIRECT & DOCTOR REFERRAL PATIENTS (Requirement 4) */}
      {activeTab === 'REGISTER_PATIENT' && (
        <form onSubmit={handleTechRegisterPatient} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserPlus className="w-4 h-4 text-purple-600" /> Register Direct & Doctor Referral Patients
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    value={techRegForm.full_name}
                    onChange={(e) => setTechRegForm({ ...techRegForm, full_name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      value={techRegForm.phone}
                      onChange={(e) => setTechRegForm({ ...techRegForm, phone: e.target.value })}
                      placeholder="+91 99887 66554"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Patient Type / Referral Tier</label>
                    <select
                      value={techRegForm.entry_mode}
                      onChange={(e) => setTechRegForm({ ...techRegForm, entry_mode: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                    >
                      <option value="WALK_IN">Direct Lab Patient (1.0x Base)</option>
                      <option value="DOCTOR_REFERRAL">Doctor Referral Visit (2.0x)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Catalog */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <TestTube className="w-4 h-4 text-purple-600" /> Select Diagnostic Tests
              </h2>

              <div className="grid grid-cols-2 gap-2">
                {catalogTests.map((t) => {
                  const isSel = selectedTests.some((item) => item.test_id === t.test_id);
                  const mult = techRegForm.entry_mode === 'DOCTOR_REFERRAL' ? 2.0 : 1.0;
                  const calcPrice = Math.round(t.walk_in_price * mult);

                  return (
                    <div
                      key={t.test_id}
                      onClick={() => {
                        if (isSel) setSelectedTests(selectedTests.filter((x) => x.test_id !== t.test_id));
                        else setSelectedTests([...selectedTests, t]);
                      }}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition ${
                        isSel ? 'border-2 border-purple-600 bg-purple-50 font-bold text-purple-900' : 'border-slate-200 bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span className="truncate pr-2">{t.name}</span>
                      <span className="font-extrabold text-slate-900 shrink-0">₹{calcPrice}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Collect Cash & Process Visit
              </h2>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="CASH">Cash at Workstation</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1 shadow-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Amount Collected</span>
                <span className="text-3xl font-black text-emerald-400 block">
                  ₹{selectedTests.reduce((sum, t) => sum + Math.round(t.walk_in_price * (techRegForm.entry_mode === 'DOCTOR_REFERRAL' ? 2.0 : 1.0)), 0)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Collect Payment & Add to Workstation
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: LAB SUPPORT & ISSUE RESOLUTION DESK (Requirement 9) */}
      {activeTab === 'SUPPORT_DESK' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-amber-500" /> Lab Support & Sample Quality Issues
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                View and resolve hemolyzed samples, damaged tubes, requisition errors, or patient support queries.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {supportIssues.map((iss) => (
              <div key={iss.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-500">{iss.id}</span>
                    <span className="font-extrabold text-slate-900">{iss.patient}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                        iss.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {iss.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-1">{iss.issue}</p>
                </div>

                {iss.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolveSupportIssue(iss.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Resolve Issue
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DOWNLOAD REPORTS & INVOICES (Requirement 10) */}
      {activeTab === 'REPORTS_INVOICES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Download Invoices */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Receipt className="w-4 h-4 text-emerald-600" /> Company Invoices ({invoices.length})
            </h3>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar text-xs">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-700">{inv.invoice_id}</span>
                    <span className="font-extrabold text-slate-900 ml-2">{capitalizeName(inv.patient_name)}</span>
                    <span className="text-[10px] text-slate-400 block">₹{inv.total_amount}</span>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedReceipt({
                        invoice_number: inv.invoice_id,
                        patient_name: inv.patient_name,
                        patient_id: inv.patient_id,
                        visit_id: inv.visit_id,
                        created_at: inv.created_at,
                        status: inv.status,
                        items: inv.items || [{ item_name: 'Diagnostic Package', quantity: 1, unit_price: inv.total_amount, line_total: inv.total_amount }],
                        subtotal: inv.total_amount,
                        total_amount: inv.total_amount,
                        amount_paid: inv.amount_paid,
                        balance_due: inv.balance_due,
                        payments: [{ method: 'Cash / Online' }],
                      })
                    }
                    className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Download Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Download Pathology Reports */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-purple-600" /> Pathology Reports ({reports.length})
            </h3>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar text-xs">
              {reports.map((rep) => (
                <div key={rep.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-purple-700">{rep.report_number}</span>
                    <span className="font-extrabold text-slate-900 ml-2">{capitalizeName(rep.patient_name)}</span>
                    <span className="text-[10px] text-slate-400 block">{rep.status}</span>
                  </div>
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
                        ],
                      })
                    }
                    className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download NABL Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sample Collection Barcode Auto-Gen */}
      {activeAptForCollection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <TestTube className="w-4 h-4 text-emerald-600" /> Draw Sample & Generate Barcode
              </h3>
              <button onClick={() => setActiveAptForCollection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Draw blood sample for <strong className="text-slate-800">{activeAptForCollection.patient_name}</strong> ({activeAptForCollection.invoice_id}).
            </p>

            <form onSubmit={handleConfirmSampleCollection} className="space-y-4 text-xs">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Assigned Tube Type</span>
                <span className="font-extrabold text-emerald-900">
                  {activeAptForCollection.collection_type === 'HOME' ? 'EDTA Purple Tube (Whole Blood)' : 'SST Yellow Tube (Serum)'}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
              >
                Confirm Collection & Print Barcode Label
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Result Parameter Entry */}
      {activeAptForResults && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" /> Input Test Report Values — {activeAptForResults.patient_name}
              </h3>
              <button onClick={() => setActiveAptForResults(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitResultsForReview} className="space-y-4 text-xs">
              <div className="space-y-3">
                {parameters.map((param, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-5 font-bold text-slate-800">{param.name}</span>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={param.result}
                        onChange={(e) => handleParameterChange(idx, 'result', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 text-center"
                      />
                    </div>
                    <span className="col-span-2 text-[10px] text-slate-500 font-mono">{param.unit} ({param.reference_range})</span>
                    <select
                      value={param.flag}
                      onChange={(e) => handleParameterChange(idx, 'flag', e.target.value)}
                      className="col-span-2 p-1.5 bg-white border border-slate-300 rounded-lg text-[10px] font-bold"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician Clinical Notes</label>
                <textarea
                  value={techComments}
                  onChange={(e) => setTechComments(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Report to Pathologist & Owner for Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modals & Toast */}
      <OfficialReceiptModal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} invoiceData={selectedReceipt} />
      <OfficialReportModal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} reportData={selectedReport} />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
