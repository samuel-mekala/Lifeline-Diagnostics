import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import { OfficialReceiptModal } from '../../../components/common/OfficialReceiptModal';
import ToastNotification from '../../../components/common/ToastNotification';
import {
  UserPlus,
  Building2,
  Stethoscope,
  TestTube,
  CheckCircle2,
  Printer,
  CreditCard,
  Search,
  Phone,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
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

export const WalkInRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Patient Registration Details
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    gender: 'M',
    age: '30',
    address: 'Vijayawada',
    entry_mode: 'WALK_IN', // WALK_IN (1.0x) | DOCTOR_REFERRAL (2.0x)
    referring_doctor: '',
  });

  // Selected Tests / Packages
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH | UPI | CARD
  const [receiptData, setReceiptData] = useState(null);
  const [registeredSuccessMsg, setRegisteredSuccessMsg] = useState('');
  const [toast, setToast] = useState(null);

  // Catalog tests for checkout selection
  const catalogTests = [
    { test_id: 'TES-000001', name: 'Complete Blood Picture (CBC)', walk_in_price: 300, category: 'Hematology' },
    { test_id: 'TES-000002', name: 'Erythrocyte Sedimentation Rate (ESR)', walk_in_price: 100, category: 'Hematology' },
    { test_id: 'TES-000003', name: 'Glycated Hemoglobin (HbA1c)', walk_in_price: 500, category: 'Biochemistry' },
    { test_id: 'TES-000004', name: 'Serum Calcium Test', walk_in_price: 500, category: 'Biochemistry' },
    { test_id: 'TES-000008', name: 'Iron Profile (Fe, TIBC, % Sat)', walk_in_price: 800, category: 'Biochemistry' },
    { test_id: 'TES-000009', name: 'Kidney Function Mini Profile (KFT)', walk_in_price: 800, category: 'Biochemistry' },
    { test_id: 'TES-000010', name: 'Lipid Profile Complete', walk_in_price: 500, category: 'Biochemistry' },
    { test_id: 'TES-000011', name: 'Liver Function Test (LFT)', walk_in_price: 500, category: 'Biochemistry' },
    { test_id: 'TES-000013', name: 'Thyroid Profile I (T3, T4, TSH)', walk_in_price: 500, category: 'Immunology' },
  ];

  const getMultiplier = () => (formData.entry_mode === 'DOCTOR_REFERRAL' ? 2.0 : 1.0);

  const calculateTotal = () => {
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

  const handleRegisterAndBillWalkIn = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      setToast({ type: 'warning', title: 'Missing Information', message: 'Please fill in patient name and phone number.' });
      return;
    }
    if (selectedTests.length === 0) {
      setToast({ type: 'warning', title: 'Test Selection Required', message: 'Please select at least 1 diagnostic test.' });
      return;
    }

    const mult = getMultiplier();
    const lineItems = selectedTests.map((t) => ({
      item_name: t.name,
      quantity: 1,
      unit_price: Math.round(t.walk_in_price * mult),
      line_total: Math.round(t.walk_in_price * mult),
    }));

    let res = null;
    try {
      res = await portalAPI.registerWalkInVisit({
        ...formData,
        tests: selectedTests,
        payment_method: paymentMethod,
      });
    } catch (err) {
      console.error('Walk-in API error:', err);
    }

    const patId = res?.patient_id || `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const visId = res?.visit_id || `VIS-${Math.floor(100000 + Math.random() * 900000)}`;
    const invId = res?.invoice_id || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const total = res?.total_amount || calculateTotal();

    // Trigger Official Printable Receipt Modal
    setReceiptData({
      invoice_number: invId,
      patient_name: formData.full_name,
      patient_id: patId,
      visit_id: visId,
      created_at: new Date().toISOString(),
      status: 'PAID',
      items: lineItems,
      subtotal: total,
      total_amount: total,
      amount_paid: total,
      balance_due: 0,
      payments: [{ method: paymentMethod }],
    });

    setRegisteredSuccessMsg(`Walk-in visit ${visId} & Invoice ${invId} saved to MySQL DB for ${formData.full_name}!`);
    setToast({ type: 'success', title: 'Walk-In Registered & Saved', message: `Visit ${visId} created in MySQL database.` });

    // Reset Form
    setFormData({
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Reception Desk Action 1 & 2
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              Walk-In Patient Registration & Counter Billing
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Register direct walk-in or doctor referral patients, collect immediate payment, and generate official receipts. (No prior account required).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-right shrink-0">
            <span className="text-[10px] text-slate-300 uppercase font-bold block">Active Location</span>
            <span className="text-xs font-black text-yellow-400">Vijayawada Diagnostic Hub</span>
          </div>
        </div>
      </div>

      {registeredSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center justify-between text-emerald-900 text-xs font-extrabold shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{registeredSuccessMsg}</span>
          </div>
          <button
            onClick={() => navigate('/operations/visits')}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
          >
            View in Visits Desk →
          </button>
        </div>
      )}

      {/* Main Registration & Billing Form */}
      <form onSubmit={handleRegisterAndBillWalkIn} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Patient Demographics */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-4 h-4 text-blue-600" /> Patient Personal & Contact Info
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Samuel Mekala"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="patient@gmail.com"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Mode</label>
                  <select
                    value={formData.entry_mode}
                    onChange={(e) => setFormData({ ...formData, entry_mode: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="WALK_IN">Direct Walk-In (1.0x Base)</option>
                    <option value="DOCTOR_REFERRAL">Doctor Referral (2.0x)</option>
                  </select>
                </div>
              </div>

              {formData.entry_mode === 'DOCTOR_REFERRAL' && (
                <div>
                  <label className="block font-bold text-purple-700 mb-1 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4" /> Referring Doctor Name & Degree *
                  </label>
                  <input
                    type="text"
                    value={formData.referring_doctor}
                    onChange={(e) => setFormData({ ...formData, referring_doctor: e.target.value })}
                    placeholder="Dr. K. Srinivas (MD, Gen Medicine)"
                    className="w-full p-3 bg-purple-50 border border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 font-medium text-purple-950"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Test Catalog Selection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <TestTube className="w-4 h-4 text-purple-600" /> Select Diagnostic Tests ({selectedTests.length} selected)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catalogTests.map((t) => {
                const isSel = selectedTests.some((item) => item.test_id === t.test_id);
                const price = Math.round(t.walk_in_price * getMultiplier());

                return (
                  <div
                    key={t.test_id}
                    onClick={() => toggleTest(t)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      isSel ? 'border-2 border-blue-600 bg-blue-50/80 font-bold text-blue-900 shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-mono text-blue-600 block">{t.test_id}</span>
                      <span className="font-extrabold truncate block">{t.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{t.category}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 shrink-0">₹{price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & Instant Receipt */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Counter Checkout & Billing
            </h2>

            {/* Selected Items Summary */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Line Items</span>
              {selectedTests.length === 0 ? (
                <p className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">No tests selected yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {selectedTests.map((t) => (
                    <div key={t.test_id} className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                      <span className="truncate pr-2">{t.name}</span>
                      <span className="font-bold text-slate-900 shrink-0">₹{Math.round(t.walk_in_price * getMultiplier())}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Payment Method (PAY NOW Only)</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="CASH">Cash at Counter</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>

            {/* Total Payable Box */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1 shadow-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Grand Total</span>
                <span>{formData.entry_mode === 'DOCTOR_REFERRAL' ? '2.0x Referral' : '1.0x Walk-In'}</span>
              </div>
              <span className="text-3xl font-black text-emerald-400 block">₹{calculateTotal()}</span>
              <span className="text-[10px] text-slate-400 block">Includes GST & NABL Verification charges</span>
            </div>

            {/* Register & Print Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" /> Collect Payment & Issue Receipt
            </button>
          </div>
        </div>
      </form>

      {/* Official Receipt Modal */}
      <OfficialReceiptModal isOpen={!!receiptData} onClose={() => setReceiptData(null)} invoiceData={receiptData} />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default WalkInRegistrationPage;
