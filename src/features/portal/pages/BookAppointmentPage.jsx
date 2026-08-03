import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { CATALOG_TESTS, CATALOG_PACKAGES, BRANCHES } from '../services/portalData';
import portalAPI from '../../../services/portalAPI';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  TestTube,
  Package,
  Search,
  Plus,
  X,
  CreditCard,
  Banknote,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

export const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Wizard Step State (1: Select Services, 2: Schedule & Location, 3: Payment & Review)
  const [step, setStep] = useState(1);

  // Form State
  const [collectionType, setCollectionType] = useState('HOME_COLLECTION'); // HOME_COLLECTION or LAB_VISIT
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:30 AM');

  // Address selection state (2 Options for Home Collection)
  const [addressOption, setAddressOption] = useState('EXISTING'); // 'EXISTING' or 'NEW'
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [address, setAddress] = useState(user?.address || '');

  const [paymentPreference, setPaymentPreference] = useState('PAY_NOW'); // PAY_NOW or PAY_LATER
  const [notes, setNotes] = useState('');

  // Search filter states
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [pkgSearchQuery, setPackageSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Fetch saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const addrs = await portalAPI.getAddresses();
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddressId(defaultAddr.id);
          setAddress(defaultAddr.address);
        } else {
          setAddressOption('NEW');
        }
      } catch (err) {
        console.warn('Failed to load saved addresses:', err);
        setAddressOption('NEW');
      }
    };
    if (user) fetchAddresses();
  }, [user]);


  // Handle preselected package if passed from Dashboard
  useEffect(() => {
    if (location.state?.preselectedPackage) {
      setSelectedPackages([location.state.preselectedPackage]);
    }
  }, [location.state]);

  // Working Hours Slots (Mon-Sat 07:00 AM - 08:00 PM)
  const availableTimeSlots = [
    '07:00 AM',
    '07:30 AM',
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '11:00 AM',
    '02:00 PM',
    '04:00 PM',
    '06:00 PM',
    '07:30 PM',
  ];

  // Set minimum date to today (YYYY-MM-DD)
  const minDateStr = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // Total Calculation
  const totalAmount = useMemo(() => {
    const testsTotal = selectedTests.reduce((sum, t) => sum + t.price, 0);
    const pkgsTotal = selectedPackages.reduce((sum, p) => sum + p.price, 0);
    return testsTotal + pkgsTotal;
  }, [selectedTests, selectedPackages]);

  // Handlers for Test / Package selection
  const toggleTestSelection = (test) => {
    if (selectedTests.some((t) => t.id === test.id)) {
      setSelectedTests((prev) => prev.filter((t) => t.id !== test.id));
    } else {
      setSelectedTests((prev) => [...prev, test]);
    }
    setError('');
  };

  const togglePackageSelection = (pkg) => {
    if (selectedPackages.some((p) => p.id === pkg.id)) {
      setSelectedPackages((prev) => prev.filter((p) => p.id !== pkg.id));
    } else {
      setSelectedPackages((prev) => [...prev, pkg]);
    }
    setError('');
  };

  // Step 1 Validation
  const handleNextToStep2 = (e) => {
    e.preventDefault();
    if (selectedTests.length === 0 && selectedPackages.length === 0) {
      setError('Please select at least 1 diagnostic test or health package to proceed.');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 Validation
  const handleNextToStep3 = (e) => {
    e.preventDefault();
    if (!scheduledDate) {
      setError('Please select a valid appointment date.');
      return;
    }

    // Check Sunday rule
    const chosenDay = new Date(scheduledDate).getDay();
    if (chosenDay === 0) {
      setError('Laboratory is closed on Sundays. Please select Monday to Saturday (07:00 AM – 08:00 PM).');
      return;
    }

    if (collectionType === 'HOME_COLLECTION' && !address.trim()) {
      setError('Please enter a complete home address for sample collection.');
      return;
    }

    setError('');
    setStep(3);
  };

  // Final Submit Handler
  const handleFinalBooking = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Build ISO datetime string
      const dateTimeIso = `${scheduledDate}T${scheduledTime.includes('PM') && !scheduledTime.startsWith('12') ? parseInt(scheduledTime.split(':')[0], 10) + 12 : scheduledTime.split(':')[0].padStart(2, '0')}:${scheduledTime.split(':')[1].split(' ')[0]}:00`;

      const payload = {
        collection_type: collectionType === 'HOME_COLLECTION' ? 'HOME' : 'LAB',
        scheduled_for: dateTimeIso,
        payment_preference: paymentPreference,
        test_ids: selectedTests.map((t) => t.test_id || t.id),
        package_ids: selectedPackages.map((p) => p.package_id || p.id),
        remarks: notes,
      };

      if (collectionType === 'HOME_COLLECTION') {
        if (addressOption === 'EXISTING' && selectedAddressId) {
          payload.address_id = selectedAddressId;
        } else if (newAddressText) {
          payload.new_address = newAddressText;
          payload.new_address_label = newAddressLabel;
        }
      }

      const res = await portalAPI.bookAppointment(payload);
      setBookingSuccess({
        appointment: {
          appointment_number: String(res.visit_id || res.appointment_id || 'VIS-0001'),
        },
        invoice: {
          invoice_number: String(res.invoice_id || 'INV-0001'),
        },
        total_amount: res.total_amount || totalAmount,
        payment_status: res.payment_status || 'PENDING',
      });
    } catch (err) {
      let errMsg = 'Failed to complete appointment booking. Please try again.';
      const errData = err.response?.data;
      if (typeof errData?.error === 'string') {
        errMsg = errData.error;
      } else if (typeof errData?.error?.message === 'string') {
        errMsg = errData.error.message;
      } else if (typeof errData?.detail === 'string') {
        errMsg = errData.detail;
      } else if (typeof err?.message === 'string') {
        errMsg = err.message;
      }
      setError(String(errMsg));
    } finally {
      setLoading(false);
    }
  };


  // Filtered lists
  const filteredTests = CATALOG_TESTS.filter((t) =>
    t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(testSearchQuery.toLowerCase())
  );

  const filteredPackages = CATALOG_PACKAGES.filter((p) =>
    p.name.toLowerCase().includes(pkgSearchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(pkgSearchQuery.toLowerCase())
  );

  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Booking Confirmed
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Appointment Scheduled Successfully</h1>
          <p className="text-xs text-slate-500 mt-1">
            Appointment Ref: <strong className="text-slate-900">{bookingSuccess.appointment.appointment_number}</strong> | Invoice: <strong className="text-slate-900">{bookingSuccess.invoice.invoice_number}</strong>
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2.5 border border-slate-200/80">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Collection Mode:</span>
            <span className="font-bold text-slate-900">{collectionType.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Scheduled Time:</span>
            <span className="font-bold text-slate-900">{scheduledDate} at {scheduledTime}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Assigned Branch:</span>
            <span className="font-bold text-slate-900">{selectedBranch.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Payment Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              paymentPreference === 'PAY_NOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {paymentPreference === 'PAY_NOW' ? 'PAID ONLINE (₹' + totalAmount + ')' : 'PAY ON COLLECTION (₹' + totalAmount + ')'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Location / Address:</span>
            <span className="font-bold text-slate-900 max-w-xs text-right">{address}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            to="/portal/dashboard"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm text-center"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/portal/invoices"
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center"
          >
            View Invoice & Receipt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Book Diagnostic Appointment</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select diagnostic tests or packages, choose your preferred slot, and select collection mode.
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {step > 1 ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <span className="text-xs font-bold hidden sm:inline">1. Select Tests & Packages</span>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-slate-200"></div>

        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {step > 2 ? <Check className="w-4 h-4" /> : '2'}
          </div>
          <span className="text-xs font-bold hidden sm:inline">2. Schedule & Location</span>
        </div>

        <div className="h-0.5 w-8 sm:w-16 bg-slate-200"></div>

        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            3
          </div>
          <span className="text-xs font-bold hidden sm:inline">3. Payment & Review</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs font-medium text-red-700">
            {typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error)}
          </div>
        </div>
      )}

      {/* STEP 1: SERVICE & TEST SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Collection Type Toggle */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Choose Collection Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCollectionType('HOME_COLLECTION')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  collectionType === 'HOME_COLLECTION'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  collectionType === 'HOME_COLLECTION' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Home Sample Collection</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Phlebotomist visits your home address</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCollectionType('LAB_VISIT')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  collectionType === 'LAB_VISIT'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  collectionType === 'LAB_VISIT' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Direct Laboratory Visit</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Walk-in at your nearest branch desk</p>
                </div>
              </button>
            </div>
          </div>

          {/* Selected Summary Badge Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-xs text-slate-400">Selected Items ({selectedTests.length + selectedPackages.length})</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedTests.map((t) => (
                  <span key={t.id} className="bg-blue-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    {t.name} <X className="w-3 h-3 cursor-pointer" onClick={() => toggleTestSelection(t)} />
                  </span>
                ))}
                {selectedPackages.map((p) => (
                  <span key={p.id} className="bg-emerald-500 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    {p.name} <X className="w-3 h-3 cursor-pointer" onClick={() => togglePackageSelection(p)} />
                  </span>
                ))}
                {selectedTests.length === 0 && selectedPackages.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No tests or packages selected yet.</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Subtotal</span>
              <span className="text-lg font-extrabold text-white">₹{totalAmount}</span>
            </div>
          </div>

          {/* Health Packages Selection Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>2. Select Comprehensive Health Packages</span>
                </h3>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pkgSearchQuery}
                  onChange={(e) => setPackageSearchQuery(e.target.value)}
                  placeholder="Filter packages..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredPackages.map((pkg) => {
                const isSelected = selectedPackages.some((p) => p.id === pkg.id);
                return (
                  <div
                    key={pkg.id}
                    onClick={() => togglePackageSelection(pkg)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {pkg.included_test_count} Tests
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs font-bold text-slate-900">{pkg.name}</p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-base font-black text-slate-900">₹{pkg.price}</span>
                      <button
                        type="button"
                        className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Package Selected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add Package</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Test Catalog Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-blue-600" />
                  <span>3. Select Individual Diagnostic Tests</span>
                </h3>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  placeholder="Search individual tests..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {filteredTests.map((test) => {
                const isSelected = selectedTests.some((t) => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTestSelection(test)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-50/80 shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          {test.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{test.sample_type}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate mt-1">{test.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{test.preparation}</p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-sm font-black text-slate-900">₹{test.price}</span>
                      <button
                        type="button"
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-blue-600/25 font-black'
                            : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 font-bold'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add Test</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleNextToStep2}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Continue to Schedule & Location</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SCHEDULE & LOCATION */}
      {step === 2 && (
        <form onSubmit={handleNextToStep3} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Choose Branch & Slot</h2>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Tests
              </button>
            </div>

            {/* Branch Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Assigned Branch <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BRANCHES.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBranch(b)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedBranch.id === b.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{b.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{b.address}</p>
                    <span className="text-[10px] text-blue-600 font-semibold block mt-1.5">{b.operating_hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Laboratory operates Monday to Saturday</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Working Hours Slot <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduledTime(slot)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold text-center border transition-colors cursor-pointer ${
                        scheduledTime === slot
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Address Field (For Home Collection - 2 Options) */}
            {collectionType === 'HOME_COLLECTION' && (
              <div className="pt-2 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Home Collection Address <span className="text-red-500">*</span>
                </label>

                {/* 2-Option Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAddressOption('EXISTING')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      addressOption === 'EXISTING'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Select Saved Address ({savedAddresses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressOption('NEW')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      addressOption === 'NEW'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Provide New Address
                  </button>
                </div>

                {/* Option 1: Saved Addresses Dropdown/List */}
                {addressOption === 'EXISTING' && (
                  <div>
                    {savedAddresses.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setAddress(addr.address);
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer text-xs flex items-start justify-between transition-all ${
                              selectedAddressId === addr.id
                                ? 'border-2 border-blue-600 bg-blue-50/60 font-semibold shadow-sm'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                                  {addr.label}
                                </span>
                                <p className="text-slate-700 mt-1">{addr.address}</p>
                              </div>
                            </div>
                            {selectedAddressId === addr.id && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                        No saved addresses found. Please choose "Provide New Address" to enter your address.
                      </p>
                    )}
                  </div>
                )}

                {/* Option 2: Enter New Address */}
                {addressOption === 'NEW' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-600">Label:</label>
                      {['Home', 'Office', 'Other'].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setNewAddressLabel(lbl)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                            newAddressLabel === lbl
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <textarea
                        rows="3"
                        required
                        value={newAddressText}
                        onChange={(e) => {
                          setNewAddressText(e.target.value);
                          setAddress(e.target.value);
                        }}
                        placeholder="Enter complete home/delivery address with landmark..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>
            )}


            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Special Instructions / Clinical Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Patient is diabetic, fasting for 12 hours"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Continue to Payment & Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PAYMENT & REVIEW */}
      {step === 3 && (
        <form onSubmit={handleFinalBooking} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-700 font-medium">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Booking Error:</span> {error}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Review Booking & Choose Payment Mode</h2>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Schedule
              </button>
            </div>

            {/* Order Review Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Selected Test Summary</p>

              <div className="space-y-2">
                {selectedTests.map((t) => (
                  <div key={t.id} className="flex justify-between text-xs">
                    <span className="text-slate-800 font-medium">{t.name}</span>
                    <span className="font-bold text-slate-900">₹{t.price}</span>
                  </div>
                ))}
                {selectedPackages.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-slate-800 font-medium">{p.name} (Package)</span>
                    <span className="font-bold text-slate-900">₹{p.price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Amount Payable</span>
                <span className="text-base text-blue-600">₹{totalAmount}</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Payment Mode <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentPreference('PAY_NOW')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    paymentPreference === 'PAY_NOW'
                      ? 'border-2 border-emerald-600 bg-emerald-50/40 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    paymentPreference === 'PAY_NOW' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Pay Online Now (Instant Release)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">UPI, Debit/Credit Card or NetBanking</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentPreference('PAY_LATER')}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    paymentPreference === 'PAY_LATER'
                      ? 'border-2 border-blue-600 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    paymentPreference === 'PAY_LATER' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Pay Later (Cash on Collection)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pay phlebotomist or reception desk</p>
                  </div>
                </button>
              </div>

              {/* Sub-options when Pay Online Now is selected */}
              {paymentPreference === 'PAY_NOW' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Select Online Payment Gateway Option
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'UPI', label: 'UPI (GPay/PhonePe)', icon: '⚡' },
                      { id: 'CARD', label: 'Debit/Credit Card', icon: '💳' },
                      { id: 'NETBANKING', label: 'NetBanking', icon: '🏦' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setNotes(`Paid via ${mode.id}`)}
                        className="bg-white hover:bg-blue-50 text-slate-800 border border-slate-200 hover:border-blue-400 p-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 shadow-sm"
                      >
                        <span className="text-base">{mode.icon}</span>
                        <span className="text-[11px] text-slate-900 font-bold">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating Diagnostic Booking...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Appointment ({paymentPreference === 'PAY_NOW' ? 'Pay ₹' + totalAmount : 'Pay ₹' + totalAmount + ' Later'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookAppointmentPage;
