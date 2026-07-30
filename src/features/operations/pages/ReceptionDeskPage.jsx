import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import OperationsDataStore from '../services/operationsData';
import PortalDataStore, { CATALOG_TESTS, CATALOG_PACKAGES, BRANCHES } from '../../portal/services/portalData';
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
} from 'lucide-react';

export default function ReceptionDeskPage() {
  const { user, activeBranch } = useAuth();

  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('REGISTER_VISIT'); // 'REGISTER_VISIT' | 'PATIENTS_LIST' | 'VISITS_QUEUE'

  // Modals
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showVisitReceiptModal, setShowVisitReceiptModal] = useState(null);

  // New Patient Form State
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    mobile: '',
    email: '',
    address: '',
    referringDoctor: '',
    emergencyContact: '',
  });

  // New Lab Visit Form State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(activeBranch || 'Main Branch - Hyderabad (Central Hub)');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentPreference, setPaymentPreference] = useState('PAY_NOW');

  // Load state on mount
  const refreshData = () => {
    setPatients(OperationsDataStore.getPatients());
    setVisits(OperationsDataStore.getVisits());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter patients by search
  const filteredPatients = patients.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mobile?.includes(searchQuery)
  );

  // Filter visits by search
  const filteredVisits = visits.filter(
    (v) =>
      v.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.visit_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tests_summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle Test Selection
  const toggleTest = (testId) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  // Toggle Package Selection
  const togglePackage = (pkgId) => {
    setSelectedPackageIds((prev) =>
      prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]
    );
  };

  // Selected Tests & Packages Objects
  const selectedTests = CATALOG_TESTS.filter((t) => selectedTestIds.includes(t.id));
  const selectedPackages = CATALOG_PACKAGES.filter((p) => selectedPackageIds.includes(p.id));

  // Subtotal calculation
  const subtotal =
    selectedTests.reduce((sum, t) => sum + t.price, 0) +
    selectedPackages.reduce((sum, p) => sum + p.price, 0);

  // Handle New Patient Registration
  const handleRegisterPatient = (e) => {
    e.preventDefault();
    if (!patientForm.fullName || !patientForm.mobile) {
      alert('Patient Full Name and Mobile number are required!');
      return;
    }

    const newPatient = OperationsDataStore.registerPatient(patientForm, user?.full_name || 'Receptionist');
    refreshData();
    setSelectedPatient(newPatient);
    setShowNewPatientModal(false);
    setPatientForm({
      fullName: '',
      age: '',
      gender: 'Male',
      mobile: '',
      email: '',
      address: '',
      referringDoctor: '',
      emergencyContact: '',
    });
  };

  // Handle Creating Visit & Receipt Generation
  const handleCreateVisit = () => {
    if (!selectedPatient) {
      alert('Please select or register a patient first!');
      return;
    }
    if (selectedTestIds.length === 0 && selectedPackageIds.length === 0) {
      alert('Please select at least one test or health package!');
      return;
    }

    const result = OperationsDataStore.createVisit({
      patient: selectedPatient,
      selectedTests,
      selectedPackages,
      branchName: selectedBranch,
      paymentMethod,
      paymentPreference,
      actorName: user?.full_name || 'Receptionist Desk',
    });

    refreshData();
    setShowVisitReceiptModal(result.visit);

    // Reset Form
    setSelectedTestIds([]);
    setSelectedPackageIds([]);
    setSelectedPatient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              RECEPTION & BILLING DESK
            </span>
            <span className="text-xs text-slate-400">Branch: {selectedBranch}</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Patient Registration & Visit Billing</h1>
          <p className="text-sm text-slate-400 mt-1">
            Register walk-in/referral patients, assign diagnostic tests/packages, collect payment, and issue thermal lab receipts.
          </p>
        </div>

        <button
          onClick={() => setShowNewPatientModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4" />
          Register Walk-In Patient
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('REGISTER_VISIT')}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-sm transition flex items-center gap-2 ${
            activeTab === 'REGISTER_VISIT'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          New Lab Visit Booking
        </button>

        <button
          onClick={() => setActiveTab('PATIENTS_LIST')}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-sm transition flex items-center gap-2 ${
            activeTab === 'PATIENTS_LIST'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Registered Patients Directory ({patients.length})
        </button>

        <button
          onClick={() => setActiveTab('VISITS_QUEUE')}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-sm transition flex items-center gap-2 ${
            activeTab === 'VISITS_QUEUE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Active Visits & Appointments ({visits.length})
        </button>
      </div>

      {/* TAB 1: NEW LAB VISIT BOOKING WORKFLOW */}
      {activeTab === 'REGISTER_VISIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Patient Search/Select & Test Catalog Selector */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Patient Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  Select Patient Demographics
                </h2>

                <button
                  onClick={() => setShowNewPatientModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Add New Patient
                </button>
              </div>

              {selectedPatient ? (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{selectedPatient.full_name}</span>
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {selectedPatient.patient_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {selectedPatient.age} yrs, {selectedPatient.gender} • Mobile: {selectedPatient.mobile}
                    </p>
                    <p className="text-xs text-slate-500">
                      Doctor: {selectedPatient.referring_doctor || 'Self Walk-In'}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs font-bold text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition"
                  >
                    Change Patient
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <InteractiveSearchBar
                    placeholder="Search patient by Name, ID (PAT-...), or Mobile number..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    suggestions={[
                      'Rajesh Kumar (PAT-1001)',
                      'Priya Sharma (PAT-1002)',
                      'Venkat Rao (PAT-1003)',
                      'Sunita Reddy (PAT-1004)',
                      'Vijayawada Main Branch',
                    ]}
                    resultCount={filteredPatients.length}
                  />

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No matching patients found.{' '}
                        <button
                          onClick={() => setShowNewPatientModal(true)}
                          className="text-blue-600 font-bold underline"
                        >
                          Register new patient
                        </button>
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPatient(p)}
                          className="p-3 hover:bg-blue-50/60 cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{p.full_name}</span>
                            <span className="ml-2 font-mono text-slate-400">({p.patient_id})</span>
                            <div className="text-slate-500 mt-0.5">
                              {p.age} yrs, {p.gender} • {p.mobile}
                            </div>
                          </div>
                          <button className="bg-blue-600 text-white font-bold px-3 py-1 rounded-lg text-xs hover:bg-blue-700">
                            Select
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Diagnostic Tests & Packages Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Assign Individual Diagnostic Tests & Packages
              </h2>

              {/* Health Packages List */}
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                  Health Checkup Packages
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CATALOG_PACKAGES.map((pkg) => {
                    const isSelected = selectedPackageIds.includes(pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => togglePackage(pkg.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{pkg.name}</span>
                            <span className="font-extrabold text-blue-700 text-xs">₹{pkg.price}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-blue-600 flex items-center gap-1">
                          {isSelected ? '✓ Selected Package' : '+ Click to Add Package'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Tests Grid */}
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                  Individual Diagnostic Tests Catalog
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                  {CATALOG_TESTS.map((t) => {
                    const isSelected = selectedTestIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTest(t.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="truncate font-medium max-w-[140px]">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.sample_type}</div>
                        </div>
                        <span className="font-bold text-slate-900 ml-1">₹{t.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Visit Billing Summary & Immediate Invoice Generation */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5">
              <h2 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Visit Order & Billing Summary
              </h2>

              {/* Selected Items Breakdown */}
              <div className="space-y-2 border-t border-b border-slate-800 py-3 text-xs max-h-48 overflow-y-auto">
                {selectedTests.length === 0 && selectedPackageIds.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No tests or packages selected yet.</p>
                ) : (
                  <>
                    {selectedPackages.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-slate-200">
                        <span className="font-medium truncate max-w-[180px]">{p.name} (Pkg)</span>
                        <span className="font-mono">₹{p.price}</span>
                      </div>
                    ))}
                    {selectedTests.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-slate-300">
                        <span className="truncate max-w-[180px]">{t.name}</span>
                        <span className="font-mono">₹{t.price}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Total Calculation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Charges</span>
                  <span className="text-2xl font-black text-white">₹{subtotal}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Payment Collection Status
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentPreference('PAY_NOW')}
                    className={`py-2 px-3 rounded-xl font-bold transition ${
                      paymentPreference === 'PAY_NOW'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Pay Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPreference('PAY_LATER')}
                    className={`py-2 px-3 rounded-xl font-bold transition ${
                      paymentPreference === 'PAY_LATER'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Pay Later
                  </button>
                </div>

                {paymentPreference === 'PAY_NOW' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs text-slate-400 font-medium">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-800 text-white text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none"
                    >
                      <option value="UPI">UPI Digital Transfer</option>
                      <option value="CASH">Cash Payment Counter</option>
                      <option value="CARD">Debit / Credit Card POS</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Generate Visit Action */}
              <button
                onClick={handleCreateVisit}
                disabled={!selectedPatient || subtotal === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-sm py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Generate Visit & Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED PATIENTS DIRECTORY */}
      {activeTab === 'PATIENTS_LIST' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Registered Patient Index</h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, ID, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Mobile & Email</th>
                  <th className="py-3 px-4">Referring Doctor</th>
                  <th className="py-3 px-4 text-center">Visits</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.patient_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.full_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.age} yrs, {p.gender}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{p.mobile}</div>
                      <div className="text-[10px] text-slate-400">{p.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{p.referring_doctor || 'Self'}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600">{p.visit_count || 1}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPatient(p);
                          setActiveTab('REGISTER_VISIT');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1 rounded-lg transition"
                      >
                        Book Visit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VISITS QUEUE */}
      {activeTab === 'VISITS_QUEUE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Lab Visit Billing & Queue History</h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search visit ID or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Visit ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Assigned Tests</th>
                  <th className="py-3 px-4">Total & Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredVisits.map((v) => (
                  <tr key={v.visit_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{v.visit_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{v.patient_name}</td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{v.tests_summary}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{v.total_amount}{' '}
                      <span
                        className={`ml-1 text-[10px] px-1.5 py-0.5 rounded ${
                          v.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{v.status}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setShowVisitReceiptModal(v)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
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

      {/* MODAL 1: WALK-IN PATIENT REGISTRATION */}
      {showNewPatientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Walk-In / Referral Patient Registration
              </h3>
              <button
                onClick={() => setShowNewPatientModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={patientForm.fullName}
                    onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Age *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 42"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Gender</label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                      className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={patientForm.mobile}
                    onChange={(e) => setPatientForm({ ...patientForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Referring Doctor / Clinic</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A. K. Reddy (Cardiologist) or Self"
                  value={patientForm.referringDoctor}
                  onChange={(e) => setPatientForm({ ...patientForm, referringDoctor: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, Area, City..."
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Save & Select Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: THERMAL RECEIPT & INVOICE PRINT PREVIEW */}
      {showVisitReceiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                Thermal Lab Visit Receipt
              </h3>
              <button
                onClick={() => setShowVisitReceiptModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content Card */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 font-mono text-[11px] space-y-2 text-slate-800">
              <div className="text-center font-bold border-b border-dashed border-amber-300 pb-2">
                <div className="text-sm font-black text-slate-900">LIFE LINE DIAGNOSTICS</div>
                <div>{showVisitReceiptModal.branch_name}</div>
                <div className="text-[10px] text-slate-500 font-normal">GSTIN: 36AAACL8890A1ZX</div>
              </div>

              <div className="flex justify-between pt-1">
                <span>Visit ID:</span>
                <span className="font-bold">{showVisitReceiptModal.visit_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient Name:</span>
                <span className="font-bold">{showVisitReceiptModal.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Age/Gender:</span>
                <span>
                  {showVisitReceiptModal.patient_age} yrs / {showVisitReceiptModal.patient_gender}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-amber-300 pb-2">
                <span>Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>

              <div className="space-y-1 py-1">
                <div className="font-bold text-slate-900">Assigned Tests:</div>
                <div className="text-slate-700">{showVisitReceiptModal.tests_summary}</div>
              </div>

              <div className="border-t border-dashed border-amber-300 pt-2 flex justify-between font-extrabold text-xs text-slate-900">
                <span>TOTAL AMOUNT:</span>
                <span>₹{showVisitReceiptModal.total_amount}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Payment Status:</span>
                <span className="font-bold uppercase text-emerald-700">{showVisitReceiptModal.payment_status}</span>
              </div>

              <div className="text-center text-[9px] text-slate-500 border-t border-dashed border-amber-300 pt-2">
                Thank you for choosing Life Line Diagnostics.
                <br />
                Sample collection phlebotomy queue assigned.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
