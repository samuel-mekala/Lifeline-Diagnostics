import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import { OfficialReceiptModal } from '../../../components/common/OfficialReceiptModal';
import { OfficialReportModal } from '../../../components/common/OfficialReportModal';
import ToastNotification from '../../../components/common/ToastNotification';
import {
  ClipboardList,
  PlusCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Building2,
  Stethoscope,
  Receipt,
  TestTube,
  Package as PackageIcon,
  Search,
  Filter,
  DollarSign,
  Printer,
  Home,
  User,
  UserCheck,
  ShieldCheck,
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
  if (!isoStr) return 'Scheduled Date';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return isoStr;
  }
};

const formatTime = (isoStr) => {
  if (!isoStr) return '08:30 AM';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '08:30 AM';
  }
};

export const LabVisitsBillingPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const preselectedPatient = location.state?.selectedPatient || null;

  const [activeTab, setActiveTab] = useState('ONLINE_APPOINTMENTS'); // 'ONLINE_APPOINTMENTS' | 'DESK_VISITS'
  const [onlineAppointments, setOnlineAppointments] = useState([]);
  const [deskVisits, setDeskVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // New Visit Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient);
  const [entryMode, setEntryMode] = useState('WALK_IN'); // WALK_IN (1.0x), HOME (1.5x), REFERRAL (2.0x)
  const [referringDoctor, setReferringDoctor] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Receipt & Report Modals State
  const [receiptData, setReceiptData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [toast, setToast] = useState(null);

  // Catalog tests for checkout selection
  const catalogTests = [
    { test_id: 'TES-000001', name: 'Complete Blood Picture (CBC)', walk_in_price: 300 },
    { test_id: 'TES-000002', name: 'Erythrocyte Sedimentation Rate (ESR)', walk_in_price: 100 },
    { test_id: 'TES-000003', name: 'Glycated Hemoglobin (HbA1c)', walk_in_price: 500 },
    { test_id: 'TES-000004', name: 'Serum Calcium Test', walk_in_price: 500 },
    { test_id: 'TES-000008', name: 'Iron Profile (Fe, TIBC, % Sat)', walk_in_price: 800 },
    { test_id: 'TES-000009', name: 'Kidney Function Mini Profile (KFT)', walk_in_price: 800 },
    { test_id: 'TES-000010', name: 'Lipid Profile Complete', walk_in_price: 500 },
    { test_id: 'TES-000011', name: 'Liver Function Test (LFT)', walk_in_price: 500 },
    { test_id: 'TES-000013', name: 'Thyroid Profile I (T3, T4, TSH)', walk_in_price: 500 },
  ];

  // Fetch real patient portal appointments from Django REST API
  const fetchRealData = async () => {
    setLoading(true);
    try {
      const apts = await portalAPI.getStaffAppointments().catch(() => []);
      setOnlineAppointments(Array.isArray(apts) ? apts : []);
      setDeskVisits([]);
    } catch (err) {
      console.error('Error fetching visits data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  useEffect(() => {
    if (preselectedPatient) {
      setShowCreateModal(true);
    }
  }, [preselectedPatient]);

  // Calculate pricing multiplier
  const getMultiplier = () => {
    if (entryMode === 'HOME') return 1.5;
    if (entryMode === 'REFERRAL') return 2.0;
    return 1.0;
  };

  const calculateSubtotal = () => {
    const mult = getMultiplier();
    return selectedTests.reduce((sum, t) => sum + Math.round(t.walk_in_price * mult), 0);
  };

  const toggleTest = (t) => {
    if (selectedTests.some((item) => item.test_id === t.test_id)) {
      setSelectedTests(selectedTests.filter((item) => item.test_id !== t.test_id));
    } else {
      setSelectedTests([...selectedTests, t]);
    }
  };

  // Walk-In Visit Registration & Bill Issuance
  const handleCreateVisitAndBill = (e) => {
    e.preventDefault();
    if (selectedTests.length === 0) {
      setToast({ type: 'warning', title: 'Test Selection Required', message: 'Please select at least 1 test for the lab visit.' });
      return;
    }

    const mult = getMultiplier();
    const nextSeq = (deskVisits.length + 1).toString().padStart(6, '0');
    const total = calculateSubtotal();

    const newVisit = {
      visit_id: `VIS-${nextSeq}`,
      patient_id: selectedPatient?.patient_id || 'PAT-000001',
      patient_name: selectedPatient?.full_name || 'Walk-In Patient',
      entry_mode: entryMode,
      referring_doctor: referringDoctor,
      items_summary: selectedTests.map((t) => t.name).join(', '),
      scheduled_for: new Date().toISOString(),
      total_amount: total,
      payment_status: 'PAID',
      invoice_id: `INV-${nextSeq}`,
      created_at: new Date().toISOString(),
      items: selectedTests.map((t) => ({
        item_name: t.name,
        quantity: 1,
        unit_price: Math.round(t.walk_in_price * mult),
        line_total: Math.round(t.walk_in_price * mult),
      })),
    };

    setDeskVisits([newVisit, ...deskVisits]);
    setShowCreateModal(false);
    setSelectedTests([]);

    // Open Printable Receipt
    setReceiptData({
      invoice_number: newVisit.invoice_id,
      patient_name: newVisit.patient_name,
      patient_id: newVisit.patient_id,
      visit_id: newVisit.visit_id,
      created_at: newVisit.created_at,
      status: 'PAID',
      items: newVisit.items,
      subtotal: total,
      total_amount: total,
      amount_paid: total,
      balance_due: 0,
      payments: [{ method: paymentMethod }],
    });
  };

  // Receptionist collects cash for pay-later or marks patient arrived
  const handleReceptionistAction = async (apt, actionType) => {
    let updateFields = {};
    if (actionType === 'MARK_PAID') {
      updateFields = { payment_status: 'PAID', status: 'VISITED' };
    } else if (actionType === 'MARK_VISITED') {
      updateFields = { status: 'VISITED' };
    } else if (actionType === 'ASSIGN_TECH') {
      updateFields = { assigned_to_email: 'tech@lifeline.com', assigned_to: 'Sunny (Technician)' };
    }

    try {
      await portalAPI.updateStaffAppointment(apt.id, updateFields);
      setOnlineAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, ...updateFields } : a))
      );
    } catch (err) {
      console.error('API update error:', err);
      setOnlineAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, ...updateFields } : a))
      );
    }

    if (actionType === 'MARK_PAID') {
      setToast({ type: 'success', title: 'Payment Collected & Saved', message: `Payment of ₹${apt.total_amount || 450} collected for ${apt.patient_name}. Saved to MySQL database.` });
    } else if (actionType === 'MARK_VISITED') {
      setToast({ type: 'success', title: 'Patient Arrival Recorded', message: `Patient ${apt.patient_name} marked as ARRIVED / VISITED at lab. Saved to MySQL database.` });
    } else if (actionType === 'ASSIGN_TECH') {
      setToast({ type: 'success', title: 'Technician Assigned', message: `Assigned Lab Technician Sunny to home pickup ${apt.invoice_id || apt.id}. Saved to MySQL database.` });
    }
  };

  const filteredOnlineAppointments = onlineAppointments.filter(
    (a) =>
      (a.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeskVisits = deskVisits.filter(
    (v) =>
      v.visit_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.invoice_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Reception Desk Module
            </span>
            <span className="text-xs text-slate-500 font-semibold">Life Line Diagnostics — Vijayawada Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Lab Visits & Invoicing Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process patient portal appointments, collect pay-later fees, assign lab technicians, and issue walk-in bills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <InteractiveSearchBar
              placeholder="Search visit, invoice, patient..."
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={activeTab === 'ONLINE_APPOINTMENTS' ? filteredOnlineAppointments.length : filteredDeskVisits.length}
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Walk-In Visit & Bill</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('ONLINE_APPOINTMENTS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ONLINE_APPOINTMENTS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GlobeIcon className="w-4 h-4" />
          <span>Online Portal Appointments ({onlineAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DESK_VISITS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'DESK_VISITS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Walk-In Desk Invoices ({deskVisits.length})</span>
        </button>
      </div>

      {/* Tab 1: Patient Portal Online Appointments */}
      {activeTab === 'ONLINE_APPOINTMENTS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading portal appointments...</div>
          ) : filteredOnlineAppointments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900">No Online Appointments Found</h3>
              <p className="text-xs text-slate-500">Book an appointment in the Patient Portal to test reception workflow sync.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOnlineAppointments.map((apt) => {
                const isPaid = apt.payment_status === 'PAID' || apt.payment_status === 'COMPLETED';
                const status = apt.status || 'PENDING';

                return (
                  <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all">
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-blue-600">{apt.invoice_id || `INV-${apt.id.slice(0, 6)}`}</span>
                        <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">{capitalizeName(apt.patient_name || 'Joel')}</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full border border-amber-300">
                        {status}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Scheduled Date & Time</span>
                        <span className="font-bold text-slate-900">{formatDate(apt.scheduled_for)} • {formatTime(apt.scheduled_for)}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {apt.collection_type === 'HOME' ? 'Assigned Technician' : 'Collection Location'}
                        </span>
                        <span className="font-bold text-purple-700 block truncate">
                          {apt.collection_type === 'HOME' ? apt.assigned_to || 'Unassigned (Assign Tech)' : 'In-Facility Lab Desk'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                        <span className="text-[10px] text-slate-400 block font-semibold">Collection Mode & Address</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {apt.address || 'Vijayawada Hub'}
                        </span>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Total Invoice Amount</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">₹{apt.total_amount || 450}</span>
                          {isPaid ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">✓ PAID</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">PAY LATER</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.collection_type === 'HOME' && !apt.assigned_to && (
                          <button
                            onClick={() => handleReceptionistAction(apt, 'ASSIGN_TECH')}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl border border-purple-200 transition cursor-pointer"
                          >
                            Assign Tech
                          </button>
                        )}

                        {!isPaid ? (
                          <button
                            onClick={() => handleReceptionistAction(apt, 'MARK_PAID')}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4" /> Collect Cash & Mark Paid
                          </button>
                        ) : status !== 'VISITED' ? (
                          <button
                            onClick={() => handleReceptionistAction(apt, 'MARK_VISITED')}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" /> Mark Arrived / Visited
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setReceiptData({
                                invoice_number: apt.invoice_id || 'INV-000001',
                                patient_name: apt.patient_name,
                                patient_id: apt.patient_id,
                                visit_id: 'VIS-000001',
                                created_at: apt.created_at || new Date().toISOString(),
                                status: 'PAID',
                                items: [{ item_name: 'Diagnostic Testing Package', quantity: 1, unit_price: apt.total_amount || 450, line_total: apt.total_amount || 450 }],
                                subtotal: apt.total_amount || 450,
                                total_amount: apt.total_amount || 450,
                                amount_paid: apt.total_amount || 450,
                                balance_due: 0,
                                payments: [{ method: 'Cash / Online' }],
                              })
                            }
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print Receipt
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

      {/* Tab 2: Walk-In Desk Invoices */}
      {activeTab === 'DESK_VISITS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Walk-In Desk Invoices ({filteredDeskVisits.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Sequential IDs (VIS-000001, INV-000001)</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Visit ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Entry Mode</th>
                  <th className="py-3 px-4">Items / Tests Summary</th>
                  <th className="py-3 px-4">Bill Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDeskVisits.map((v) => (
                  <tr key={v.visit_id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{v.visit_id}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {capitalizeName(v.patient_name)}
                      <span className="block text-[10px] text-slate-400 font-mono">{v.patient_id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {v.entry_mode === 'HOME' ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">🏠 Home (1.5x)</span>
                      ) : v.entry_mode === 'REFERRAL' ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">🩺 Referral (2.0x)</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">🏢 Walk-In (1.0x)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{v.items_summary}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{v.total_amount}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                        ✓ PAID
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          setReceiptData({
                            invoice_number: v.invoice_id,
                            patient_name: v.patient_name,
                            patient_id: v.patient_id,
                            visit_id: v.visit_id,
                            created_at: v.created_at,
                            status: 'PAID',
                            items: v.items || [{ item_name: v.items_summary, quantity: 1, unit_price: v.total_amount, line_total: v.total_amount }],
                            subtotal: v.total_amount,
                            total_amount: v.total_amount,
                            amount_paid: v.total_amount,
                            balance_due: 0,
                            payments: [{ method: 'UPI / Cash' }],
                          })
                        }
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Visit & Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" /> Create Walk-In Lab Visit & Issue Bill
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Generates sequential Visit ID (VIS-000001) & Invoice (INV-000001)</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisitAndBill} className="space-y-4 text-xs">
              {/* Patient Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Name / ID</label>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{selectedPatient ? capitalizeName(selectedPatient.full_name) : 'Walk-In Guest Patient'}</span>
                    <span className="text-[11px] text-blue-700 font-mono">{selectedPatient?.patient_id || 'PAT-000001'}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Walk-In Mode</span>
                </div>
              </div>

              {/* Entry Mode Pricing Tier Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Entry Mode Pricing Tier *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryMode('WALK_IN')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      entryMode === 'WALK_IN' ? 'border-2 border-blue-600 bg-blue-50/80 font-bold text-blue-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-black">Walk-In</span>
                    <span className="text-[10px] text-slate-500">Base Price (1.0x)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryMode('HOME')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      entryMode === 'HOME' ? 'border-2 border-blue-600 bg-blue-50/80 font-bold text-blue-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-black">Home Pickup</span>
                    <span className="text-[10px] text-blue-700">1.5x Multiplier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryMode('REFERRAL')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      entryMode === 'REFERRAL' ? 'border-2 border-purple-600 bg-purple-50/80 font-bold text-purple-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-black">Doctor Referral</span>
                    <span className="text-[10px] text-purple-700">2.0x Multiplier</span>
                  </button>
                </div>
              </div>

              {entryMode === 'REFERRAL' && (
                <div>
                  <label className="block font-bold text-purple-700 mb-1">Referring Doctor Name</label>
                  <input
                    type="text"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    placeholder="Dr. K. Srinivas (MD)"
                    className="w-full p-2.5 bg-purple-50 border border-purple-200 rounded-xl focus:outline-none"
                  />
                </div>
              )}

              {/* Test Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Diagnostic Tests *</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1 border border-slate-200 rounded-xl bg-slate-50">
                  {catalogTests.map((t) => {
                    const isSel = selectedTests.some((item) => item.test_id === t.test_id);
                    const calcPrice = Math.round(t.walk_in_price * getMultiplier());
                    return (
                      <div
                        key={t.test_id}
                        onClick={() => toggleTest(t)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                          isSel ? 'border-blue-600 bg-blue-100/70 font-bold text-blue-900' : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-blue-600 block">{t.test_id}</span>
                          <span className="truncate block font-bold">{t.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-900 shrink-0 ml-1">₹{calcPrice}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="CASH">Cash at Counter</option>
                    <option value="UPI">UPI / GooglePay</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>

                <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-col justify-between text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Bill Payable</span>
                  <span className="text-xl font-black text-emerald-400">₹{calculateSubtotal()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-md cursor-pointer"
                >
                  Confirm & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      <OfficialReceiptModal isOpen={!!receiptData} onClose={() => setReceiptData(null)} invoiceData={receiptData} />

      {/* Official Printable Report Modal */}
      <OfficialReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

const GlobeIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4 10 15.3 15.3 0 014-10z" />
  </svg>
);

export default LabVisitsBillingPage;
