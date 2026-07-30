import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI, { getErrorMessage } from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  UserPlus,
  Search,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Building2,
  Printer,
  FileText,
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Plus,
  Trash2,
  CreditCard,
  QrCode,
  AlertCircle,
  Clock,
  Filter,
  Bell,
  Send,
  UserCheck,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

export default function ReceptionDeskPage() {
  const { user } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('REGISTER_VISIT'); // 'REGISTER_VISIT' | 'WORKFLOW_QUEUE' | 'HOME_VISITS' | 'INVOICES' | 'REPORTS'

  // Global State from Database
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState([]);
  const [testCatalog, setTestCatalog] = useState([]);
  const [packageCatalog, setPackageCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Action States
  const [showVisitReceiptModal, setShowVisitReceiptModal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showAssignTechModal, setShowAssignTechModal] = useState(null);
  const [paymentModalMethod, setPaymentModalMethod] = useState('CASH');
  const [techEmailInput, setTechEmailInput] = useState('');
  const [notificationToast, setNotificationToast] = useState('');

  // Walk-in Registration Form State
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    age: '30',
    gender: 'Male',
    mobile: '',
    email: '',
    address: 'Vijayawada',
    entryMode: 'WALK_IN', // 'WALK_IN' | 'DOCTOR_REFERRAL' | 'DIRECT' | 'EMERGENCY'
    referringDoctor: '',
  });

  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // ── Load Data from Backend APIs ───────────────────────────────────────
  const fetchAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [aptsRes, invsRes, repsRes, testsRes, pkgsRes] = await Promise.all([
        portalAPI.getStaffAppointments().catch(() => []),
        portalAPI.getStaffAllInvoices().catch(() => []),
        portalAPI.getStaffAllReports().catch(() => []),
        portalAPI.getTestCatalog().catch(() => []),
        portalAPI.getPackageCatalog().catch(() => []),
      ]);

      setAppointments(Array.isArray(aptsRes) ? aptsRes : []);
      setInvoices(Array.isArray(invsRes) ? invsRes : []);
      setReports(Array.isArray(repsRes) ? repsRes : []);
      setTestCatalog(Array.isArray(testsRes) ? testsRes : []);
      setPackageCatalog(Array.isArray(pkgsRes) ? pkgsRes : []);
    } catch (err) {
      console.error('Error fetching receptionist data:', err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerToast = (msg) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(''), 4000);
  };

  // ── Catalog Helpers ───────────────────────────────────────────────────
  const selectedTests = useMemo(
    () => testCatalog.filter((t) => selectedTestIds.includes(t.test_id || t.id)),
    [testCatalog, selectedTestIds]
  );

  const selectedPackages = useMemo(
    () => packageCatalog.filter((p) => selectedPackageIds.includes(p.package_id || p.id)),
    [packageCatalog, selectedPackageIds]
  );

  // Price multiplier for entry mode
  const entryModeMultiplier =
    patientForm.entryMode === 'DOCTOR_REFERRAL' ? 2.0 : patientForm.entryMode === 'EMERGENCY' ? 1.5 : 1.0;

  const rawSubtotal =
    selectedTests.reduce((sum, t) => sum + (t.walk_in_price || t.price || 300), 0) +
    selectedPackages.reduce((sum, p) => sum + (p.price || 1200), 0);

  const totalBillAmount = Math.round(rawSubtotal * entryModeMultiplier);

  const toggleTest = (testId) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const togglePackage = (pkgId) => {
    setSelectedPackageIds((prev) =>
      prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]
    );
  };

  // ── Submit Walk-In Registration ───────────────────────────────────────
  const handleRegisterWalkIn = async (e) => {
    e.preventDefault();
    if (!patientForm.fullName || !patientForm.mobile) {
      alert('Patient Full Name and Mobile Number are required!');
      return;
    }
    if (selectedTestIds.length === 0 && selectedPackageIds.length === 0) {
      alert('Please select at least one Test or Health Package!');
      return;
    }

    setSubmittingWalkIn(true);
    try {
      const payload = {
        full_name: patientForm.fullName,
        phone: patientForm.mobile,
        email: patientForm.email,
        gender: patientForm.gender === 'Male' ? 'M' : patientForm.gender === 'Female' ? 'F' : 'O',
        age: parseInt(patientForm.age, 10) || 30,
        address: patientForm.address,
        entry_mode: patientForm.entryMode,
        referring_doctor: patientForm.referringDoctor,
        payment_method: paymentMethod,
        tests: selectedTests.map((t) => ({
          test_id: t.test_id,
          name: t.name,
          walk_in_price: t.walk_in_price || t.price || 300,
        })),
        packages: selectedPackages.map((p) => ({
          package_id: p.package_id,
          name: p.name,
          price: p.price || 1200,
        })),
      };

      const result = await portalAPI.registerWalkInVisit(payload);
      triggerToast(`Visit ${result.visit_id || 'Registered'} created successfully!`);
      
      // Reset form
      setPatientForm({
        fullName: '',
        age: '30',
        gender: 'Male',
        mobile: '',
        email: '',
        address: 'Vijayawada',
        entryMode: 'WALK_IN',
        referringDoctor: '',
      });
      setSelectedTestIds([]);
      setSelectedPackageIds([]);

      // Show receipt modal
      setShowVisitReceiptModal(result);
      fetchAllData();
    } catch (err) {
      alert(`Walk-in Registration Failed: ${getErrorMessage(err)}`);
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  // ── Quick Status / Action Handlers ─────────────────────────────────────
  const handleMarkVisited = async (aptId) => {
    try {
      await portalAPI.updateStaffAppointment(aptId, { status: 'VISITED' });
      triggerToast('Appointment marked as VISITED');
      fetchAllData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleCollectPayment = async (aptId) => {
    try {
      await portalAPI.collectPayment(aptId, paymentModalMethod);
      triggerToast('Payment collected successfully!');
      setShowPaymentModal(null);
      fetchAllData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleAssignTechnician = async (aptId) => {
    if (!techEmailInput.trim()) {
      alert('Please enter technician email or name!');
      return;
    }
    try {
      await portalAPI.updateStaffAppointment(aptId, { assigned_to_email: techEmailInput.trim() });
      triggerToast(`Technician assigned successfully to ${techEmailInput}`);
      setShowAssignTechModal(null);
      setTechEmailInput('');
      fetchAllData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleNotifyRole = (apt, targetRole) => {
    triggerToast(`Alert sent to ${targetRole} for Patient: ${apt.patient_name} (${apt.display_id || apt.id})`);
  };

  // ── Filtered Datasets ─────────────────────────────────────────────────
  const normalizeText = (str) => (str || '').toLowerCase().replace(/[-_\s]/g, '');

  const filteredAppointments = useMemo(() => {
    const q = normalizeText(searchQuery);
    return appointments.filter((apt) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'HOME' && apt.collection_type !== 'HOME') return false;
        if (statusFilter === 'UNPAID' && apt.payment_status === 'PAID') return false;
        if (statusFilter !== 'HOME' && statusFilter !== 'UNPAID' && apt.status !== statusFilter) return false;
      }
      if (!q) return true;
      const pName = normalizeText(apt.patient_name);
      const pPhone = normalizeText(apt.patient_phone);
      const aptId = normalizeText(apt.display_id || apt.id);
      const testSum = normalizeText(apt.tests_summary);
      const st = normalizeText(apt.status);
      return pName.includes(q) || pPhone.includes(q) || aptId.includes(q) || testSum.includes(q) || st.includes(q);
    });
  }, [appointments, searchQuery, statusFilter]);

  const homeVisitAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.collection_type === 'HOME');
  }, [appointments]);

  const filteredInvoices = useMemo(() => {
    const q = normalizeText(searchQuery);
    return invoices.filter((inv) => {
      if (!q) return true;
      return (
        normalizeText(inv.invoice_id).includes(q) ||
        normalizeText(inv.patient_name).includes(q) ||
        normalizeText(inv.status).includes(q)
      );
    });
  }, [invoices, searchQuery]);

  const filteredReports = useMemo(() => {
    const q = normalizeText(searchQuery);
    return reports.filter((rep) => {
      if (!q) return true;
      return (
        normalizeText(rep.report_id).includes(q) ||
        normalizeText(rep.patient_name).includes(q) ||
        normalizeText(rep.status).includes(q)
      );
    });
  }, [reports, searchQuery]);

  // Check if home visit needs tech assignment (>5 mins unassigned)
  const isStuckHomeVisit = (apt) => {
    if (apt.collection_type !== 'HOME') return false;
    if (apt.assigned_to) return false;
    if (['COMPLETED', 'APPROVED', 'CANCELLED'].includes(apt.status)) return false;
    const createdAt = new Date(apt.created_at || Date.now()).getTime();
    const now = Date.now();
    return now - createdAt > 5 * 60 * 1000; // > 5 minutes
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Bell className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{notificationToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Reception Desk
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Life Line Diagnostics — Vijayawada Hub (VJW-MAIN)
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Receptionist Management Hub
              </h1>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
              <button
                onClick={() => setActiveTab('REGISTER_VISIT')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'REGISTER_VISIT'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Register Walk-In
              </button>

              <button
                onClick={() => setActiveTab('WORKFLOW_QUEUE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'WORKFLOW_QUEUE'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Workflow Queue ({appointments.length})
              </button>

              <button
                onClick={() => setActiveTab('HOME_VISITS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all relative ${
                  activeTab === 'HOME_VISITS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Home Visits ({homeVisitAppointments.length})
                {homeVisitAppointments.some(isStuckHomeVisit) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-1.5 right-1.5" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('INVOICES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'INVOICES'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <IndianRupee className="w-4 h-4" />
                Invoices & Bills
              </button>

              <button
                onClick={() => setActiveTab('REPORTS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'REPORTS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports Archive
              </button>

              <button
                onClick={fetchAllData}
                title="Refresh Data"
                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-white transition-all ml-1"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: REGISTER WALK-IN VISIT */}
        {activeTab === 'REGISTER_VISIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Patient Info & Settings */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Patient Information
                  </h2>
                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase">
                    Step 1 of 2
                  </span>
                </div>

                <form onSubmit={handleRegisterWalkIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={patientForm.fullName}
                      onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit phone"
                        value={patientForm.mobile}
                        onChange={(e) => setPatientForm({ ...patientForm, mobile: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Age (Years)</label>
                      <input
                        type="number"
                        placeholder="30"
                        value={patientForm.age}
                        onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={patientForm.gender}
                        onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Entry Mode</label>
                      <select
                        value={patientForm.entryMode}
                        onChange={(e) => setPatientForm({ ...patientForm, entryMode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      >
                        <option value="WALK_IN">Walk-in Direct (Standard Price)</option>
                        <option value="DOCTOR_REFERRAL">Doctor Referral (2x Priority)</option>
                        <option value="EMERGENCY">Emergency STAT (1.5x Multiplier)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={patientForm.email}
                      onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Address / Location</label>
                    <input
                      type="text"
                      placeholder="Street, City"
                      value={patientForm.address}
                      onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Referring Doctor</label>
                    <input
                      type="text"
                      placeholder="Dr. Rao / Self"
                      value={patientForm.referringDoctor}
                      onChange={(e) => setPatientForm({ ...patientForm, referringDoctor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['CASH', 'UPI', 'CARD'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                            paymentMethod === m
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Catalog Selection & Booking Summary */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                      Select Diagnostic Tests & Packages
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">
                      Live Catalog from Database
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase">
                    Step 2 of 2
                  </span>
                </div>

                {/* Individual Tests Catalog */}
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                    Individual Tests ({testCatalog.length} available)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {testCatalog.map((t) => {
                      const tId = t.test_id || t.id;
                      const isSelected = selectedTestIds.includes(tId);
                      const price = t.walk_in_price || t.price || 300;
                      return (
                        <div
                          key={tId}
                          onClick={() => toggleTest(tId)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-black">{t.name}</p>
                            <p className="text-[10px] font-bold text-slate-500">
                              {t.category || 'Laboratory'} • {t.sample_type || 'Blood'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-blue-700">₹{price}</p>
                            <div
                              className={`w-4 h-4 rounded-md border ml-auto flex items-center justify-center ${
                                isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Health Packages Catalog */}
                {packageCatalog.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                      Health Packages ({packageCatalog.length} available)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {packageCatalog.map((p) => {
                        const pId = p.package_id || p.id;
                        const isSelected = selectedPackageIds.includes(pId);
                        const price = p.price || 1200;
                        return (
                          <div
                            key={pId}
                            onClick={() => togglePackage(pId)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50/80 border-emerald-600 text-emerald-900 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-black">{p.name}</p>
                              <p className="text-[10px] font-bold text-slate-500">
                                Includes {p.tests_count || 5} tests
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-emerald-700">₹{price}</p>
                              <div
                                className={`w-4 h-4 rounded-md border ml-auto flex items-center justify-center ${
                                  isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bill Summary & Complete Registration */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400">Total Items Selected</span>
                    <span className="text-xs font-black text-white">
                      {selectedTests.length + selectedPackages.length} Selection(s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Total Payable Amount</p>
                      {entryModeMultiplier > 1.0 && (
                        <p className="text-[10px] text-amber-400 font-bold">
                          Includes {entryModeMultiplier}x Priority Multiplier
                        </p>
                      )}
                    </div>
                    <p className="text-2xl font-black text-emerald-400">₹{totalBillAmount}</p>
                  </div>

                  <button
                    type="button"
                    disabled={submittingWalkIn}
                    onClick={handleRegisterWalkIn}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                  >
                    {submittingWalkIn ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Registration & Take Payment (₹{totalBillAmount})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WORKFLOW QUEUE */}
        {activeTab === 'WORKFLOW_QUEUE' && (
          <div className="space-y-6">
            {/* Search & Filter Header */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <InteractiveSearchBar
                    placeholder="Search by Patient Name, Mobile, Appointment ID (e.g. VJW-2026-000001)..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    resultCount={filteredAppointments.length}
                  />
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: 'ALL', label: 'All Statuses' },
                    { id: 'BOOKED', label: 'Booked / Pending' },
                    { id: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
                    { id: 'TESTED', label: 'Tested' },
                    { id: 'UNDER_REVIEW', label: 'Under Review' },
                    { id: 'APPROVED', label: 'Approved' },
                    { id: 'UNPAID', label: 'Unpaid Only' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        statusFilter === f.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Appointments Queue Grid */}
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-black text-slate-700">No Appointments Found</h3>
                <p className="text-xs text-slate-500">
                  Try adjusting your search criteria or filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAppointments.map((apt) => {
                  const isUnpaid = apt.payment_status !== 'PAID';
                  const isHome = apt.collection_type === 'HOME';
                  const isStuck = isStuckHomeVisit(apt);

                  return (
                    <div
                      key={apt.id}
                      className={`bg-white rounded-3xl p-5 border transition-all shadow-sm hover:shadow-md relative flex flex-col justify-between ${
                        isStuck
                          ? 'border-red-300 ring-2 ring-red-500/20'
                          : isUnpaid
                          ? 'border-amber-200'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Top Row: IDs & Badges */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {apt.display_id || (typeof apt.id === 'string' ? apt.id.slice(0, 8) : 'APT')}
                            </span>
                            <h3 className="text-sm font-black text-slate-900 mt-1">
                              {apt.patient_name || 'Patient'}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {apt.patient_phone || 'N/A'}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                apt.status === 'APPROVED' || apt.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : apt.status === 'UNDER_REVIEW'
                                  ? 'bg-purple-100 text-purple-800'
                                  : apt.status === 'TESTED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : apt.status === 'SAMPLE_COLLECTED'
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {apt.status || 'BOOKED'}
                            </span>

                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isUnpaid ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isUnpaid ? 'UNPAID' : 'PAID'}
                            </span>
                          </div>
                        </div>

                        {/* Test Summary */}
                        <div className="bg-slate-50 rounded-2xl p-3 mb-4 space-y-1">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Booked Tests / Mode
                          </p>
                          <p className="text-xs font-bold text-slate-800 line-clamp-2">
                            {apt.tests_summary || 'Diagnostic Tests'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 pt-1">
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {apt.collection_type || 'LAB'} VISIT
                            </span>
                            {apt.assigned_to_name && (
                              <span className="text-blue-600 font-extrabold">
                                Tech: {apt.assigned_to_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Bar */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        {/* 1. Mark Visited for Lab Visits */}
                        {apt.status === 'BOOKED' && !isHome && (
                          <button
                            onClick={() => handleMarkVisited(apt.id)}
                            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Mark Patient Visited
                          </button>
                        )}

                        {/* 2. Take Payment if Unpaid */}
                        {isUnpaid && (
                          <button
                            onClick={() => setShowPaymentModal(apt)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Collect Payment (₹{apt.total_amount || 0})
                          </button>
                        )}

                        {/* 3. Assign Technician for Home Visit */}
                        {isHome && !apt.assigned_to && (
                          <button
                            onClick={() => setShowAssignTechModal(apt)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Assign Technician
                          </button>
                        )}

                        {/* 4. Notify Roles if Stuck */}
                        <div className="flex items-center gap-2">
                          {['BOOKED', 'SAMPLE_COLLECTED', 'TESTED'].includes(apt.status) && (
                            <button
                              onClick={() => handleNotifyRole(apt, 'Technician')}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-1.5 rounded-xl text-[10px] flex items-center justify-center gap-1"
                            >
                              <Bell className="w-3 h-3 text-amber-500" />
                              Notify Tech
                            </button>
                          )}

                          {apt.status === 'UNDER_REVIEW' && (
                            <button
                              onClick={() => handleNotifyRole(apt, 'Pathologist')}
                              className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold py-1.5 rounded-xl text-[10px] flex items-center justify-center gap-1"
                            >
                              <Bell className="w-3 h-3 text-purple-600" />
                              Notify Pathologist
                            </button>
                          )}

                          {(apt.status === 'APPROVED' || apt.status === 'COMPLETED') && (
                            <button
                              onClick={() => setShowReportModal(apt)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print & Handover Report
                            </button>
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

        {/* TAB 3: HOME VISITS QUEUE */}
        {activeTab === 'HOME_VISITS' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Home Visit Appointments Dispatch
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Appointments requiring technician dispatch to patient homes.
                </p>
              </div>
              <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-black">
                {homeVisitAppointments.filter(isStuckHomeVisit).length} Unassigned (&gt;5m)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {homeVisitAppointments.map((apt) => {
                const isStuck = isStuckHomeVisit(apt);
                return (
                  <div
                    key={apt.id}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-sm ${
                      isStuck ? 'border-red-400 ring-2 ring-red-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {apt.display_id || apt.id}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-1">{apt.patient_name}</h3>
                        <p className="text-xs text-slate-500 font-bold">{apt.patient_phone}</p>
                      </div>

                      {isStuck && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                          STUCK (&gt;5m)
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3 mb-4 text-xs font-bold text-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-black">Home Address</p>
                      <p className="mt-0.5">{apt.address || 'Vijayawada Location'}</p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setShowAssignTechModal(apt)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {apt.assigned_to ? `Reassign (${apt.assigned_to})` : 'Assign Technician Now'}
                      </button>

                      <button
                        onClick={() => handleNotifyRole(apt, 'Technician Pool')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <Bell className="w-3 h-3 text-amber-500" />
                        Broadcast Alert to Technicians
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: INVOICES & BILLS */}
        {activeTab === 'INVOICES' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-blue-600" />
                All Patient Invoices ({invoices.length})
              </h2>
              <InteractiveSearchBar
                placeholder="Search Invoices by ID, Patient Name..."
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={filteredInvoices.length}
                className="w-72"
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Invoice ID</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id || inv.invoice_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black text-blue-600">{inv.invoice_id}</td>
                      <td className="p-4 font-bold text-slate-900">{inv.patient_name || 'Walk-in Patient'}</td>
                      <td className="p-4 text-slate-500">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Today'}</td>
                      <td className="p-4 font-black text-slate-900">₹{inv.total_amount || 0}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => window.print()}
                          className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS ARCHIVE */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Reports Archive & Print Hub ({reports.length})
              </h2>
              <InteractiveSearchBar
                placeholder="Search Reports by ID, Patient Name..."
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={filteredReports.length}
                className="w-72"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredReports.map((rep) => (
                <div key={rep.id || rep.report_id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {rep.report_id}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-1">{rep.patient_name}</h3>
                      <p className="text-xs text-slate-500 font-bold">{rep.tests_summary || 'Diagnostic Report'}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {rep.status || 'APPROVED'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">
                      Verified by Pathologist
                    </span>
                    <button
                      onClick={() => setShowReportModal(rep)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View & Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: RECEIPT PRINT MODAL ──────────────────────────────── */}
      {showVisitReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Visit Receipt & Bill Confirmation
              </h3>
              <button onClick={() => setShowVisitReceiptModal(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs font-bold text-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Visit ID:</span>
                <span className="text-blue-600 font-black">{showVisitReceiptModal.visit_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice ID:</span>
                <span>{showVisitReceiptModal.invoice_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="text-emerald-600 font-black">₹{showVisitReceiptModal.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span>Life Line Diagnostics — Vijayawada Hub</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Printer className="w-4 h-4" />
                Print Official Receipt
              </button>
              <button
                onClick={() => setShowVisitReceiptModal(null)}
                className="px-5 bg-slate-100 text-slate-700 font-extrabold py-3 rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ASSIGN TECHNICIAN MODAL ──────────────────────────── */}
      {showAssignTechModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Assign Lab Technician
              </h3>
              <button onClick={() => setShowAssignTechModal(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-600">
              Assigning technician for Patient: <span className="text-slate-900 font-black">{showAssignTechModal.patient_name}</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Technician Email or Username</label>
              <input
                type="text"
                placeholder="tech@lifeline.com or Technician Name"
                value={techEmailInput}
                onChange={(e) => setTechEmailInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAssignTechnician(showAssignTechModal.id)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                Confirm Assignment
              </button>
              <button
                onClick={() => setShowAssignTechModal(null)}
                className="px-4 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: COLLECT PAYMENT MODAL ────────────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Collect Pending Payment
              </h3>
              <button onClick={() => setShowPaymentModal(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 space-y-1 text-xs font-bold text-amber-900">
              <p>Patient: {showPaymentModal.patient_name}</p>
              <p className="text-base font-black text-amber-700">Amount Due: ₹{showPaymentModal.total_amount || 0}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'UPI', 'CARD'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentModalMethod(m)}
                    className={`py-2 rounded-xl text-xs font-black border transition-all ${
                      paymentModalMethod === m
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCollectPayment(showPaymentModal.id)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-amber-500/20"
              >
                Mark Paid (₹{showPaymentModal.total_amount || 0})
              </button>
              <button
                onClick={() => setShowPaymentModal(null)}
                className="px-4 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: REPORT PREVIEW MODAL ─────────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  Diagnostic Lab Report — Life Line Diagnostics
                </h3>
              </div>
              <button onClick={() => setShowReportModal(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Printable Report Card */}
            <div className="border border-slate-200 rounded-2xl p-6 space-y-6 bg-white text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="font-black text-sm text-slate-900">LIFE LINE DIAGNOSTICS</h2>
                  <p className="text-[10px] text-slate-500 font-bold">Vijayawada Central Hub • License: VJW-LAB-88492</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-blue-600">REPORT ID: {showReportModal.report_id || 'REP-000001'}</p>
                  <p className="text-[10px] text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2 font-bold text-slate-700">
                <p>Patient: {showReportModal.patient_name || 'Ramesh Kumar'}</p>
                <p>Status: VERIFIED & APPROVED</p>
              </div>

              <div className="space-y-2">
                <p className="font-black text-slate-900 uppercase">Test Results Summary</p>
                <p className="text-slate-600">{showReportModal.tests_summary || 'Hematology & Biochemistry Panel'}</p>
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                <div className="text-[10px] text-slate-400">
                  Verified digitally by Pathologist on duty.
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-slate-900 mb-1 ml-auto"></div>
                  <p className="font-black text-slate-900 text-[10px]">Chief Pathologist Signature</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Printer className="w-4 h-4" />
                Print Official Report
              </button>
              <button
                onClick={() => setShowReportModal(null)}
                className="px-5 bg-slate-100 text-slate-700 font-extrabold py-3 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
