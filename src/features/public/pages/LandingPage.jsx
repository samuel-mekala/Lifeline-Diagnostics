import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../../../components/common/Logo';
import { CATALOG_TESTS, CATALOG_PACKAGES, BRANCHES } from '../../portal/services/portalData';
import OperationsDataStore from '../../operations/services/operationsData';
import { useAuth } from '../../../providers/AuthProvider';
import {
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
  Phone,
  Award,
  TestTube,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Building2,
  Package,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronDown,
  HeartPulse,
  Activity,
  Bot,
  Zap,
  Filter,
  X,
  CreditCard,
  UserPlus,
  Stethoscope,
  Printer,
  Check,
  Layers,
  Thermometer,
  Cpu,
  BarChart3,
  BadgeCheck,
  TrendingUp,
} from 'lucide-react';
import AIChatbotModal from '../../../components/common/AIChatbotModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAiBot, setShowAiBot] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const searchContainerRef = useRef(null);

  // Modal custom dropdown state
  const [isModalDropdownOpen, setIsModalDropdownOpen] = useState(false);
  const [modalSearchFilter, setModalSearchFilter] = useState('');
  const modalDropdownRef = useRef(null);

  // Popular recommended search presets
  const POPULAR_RECOMMENDED = [
    { label: '🔥 Complete Blood Picture (CBC)', query: 'CBC' },
    { label: '🔥 Thyroid Profile (T3, T4, TSH)', query: 'Thyroid' },
    { label: '🔥 Liver Function Test (LFT)', query: 'LFT' },
    { label: '🔥 Glycated Hemoglobin (HbA1c)', query: 'HbA1c' },
    { label: '🔥 Lipid Profile Complete', query: 'Lipid' },
    { label: '🔥 Vitamin D Total (25-OH)', query: 'Vitamin D' },
  ];

  // Interactive Quick Booking Modal State
  const [bookingTestModal, setBookingTestModal] = useState(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    fullName: user?.full_name || '',
    mobile: user?.phone || '',
    age: '30',
    gender: 'Male',
    address: 'Hyderabad',
    visitType: 'HOME_COLLECTION',
    paymentPreference: 'PAY_NOW',
    paymentMethod: 'UPI',
  });

  const primaryBranch = BRANCHES[0];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      if (modalDropdownRef.current && !modalDropdownRef.current.contains(e.target)) {
        setIsModalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Search Filter across Diagnostic Tests & Packages
  const filteredTests = CATALOG_TESTS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sample_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredPackages = CATALOG_PACKAGES.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['ALL', 'BIOCHEMISTRY', 'HEMATOLOGY', 'IMMUNOLOGY', 'ENDOCRINOLOGY', 'CARDIAC'];

  // Smooth scroll handler with header offset calculation
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Home Refresh & Top Scroll Handler
  const handleHomeRefresh = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  // Open Quick Booking Modal with patient selectable test option
  const openBookingModal = (item = CATALOG_TESTS[0], type = 'TEST', defaultVisit = 'HOME_COLLECTION') => {
    setBookingTestModal({ item, type });
    setBookingForm((prev) => ({ ...prev, visitType: defaultVisit }));
  };

  // Handle Quick Booking Submission
  const handleConfirmQuickBooking = (e) => {
    e.preventDefault();
    if (!bookingForm.fullName || !bookingForm.mobile) {
      alert('Please fill in your name and mobile number!');
      return;
    }

    const patientObj = {
      patient_id: `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      full_name: bookingForm.fullName,
      mobile: bookingForm.mobile,
      age: parseInt(bookingForm.age, 10) || 30,
      gender: bookingForm.gender,
      address: bookingForm.address,
    };

    const selectedTests = bookingTestModal.type === 'TEST' ? [bookingTestModal.item] : [];
    const selectedPackages = bookingTestModal.type === 'PACKAGE' ? [bookingTestModal.item] : [];

    const visitRecord = OperationsDataStore.createVisit({
      patient: patientObj,
      selectedTests,
      selectedPackages,
      branchName: primaryBranch.name,
      visitType: bookingForm.visitType,
      paymentMethod: bookingForm.paymentMethod,
      paymentPreference: bookingForm.paymentPreference,
      actorName: 'Landing Page Self-Booking',
    });

    setBookingTestModal(null);
    setBookingSuccessModal(visitRecord);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Emergency & Accreditation Utility Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
          <a href="tel:+918662478900" className="flex items-center gap-1.5 font-semibold text-blue-400 hover:underline">
            <Phone className="w-3.5 h-3.5" />
            <span>24/7 Phlebotomy Helpline: +91 866 247 8900</span>
          </a>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:flex items-center gap-1.5 text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NABL ACCREDITED & ISO 9001:2015 CERTIFIED DIAGNOSTICS</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-400 font-mono">Operating Hours: Mon - Sat: 06:00 AM - 09:30 PM</span>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={isAuthenticated ? '/portal/dashboard' : '/login'}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'My Dashboard' : 'Portal Sign In'}</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
          {/* Left Brand & Nav Links Grouped Naturally */}
          <div className="flex items-center gap-8 xl:gap-12">
            {/* Logo & Title */}
            <div
              onClick={handleHomeRefresh}
              className="flex items-center gap-2.5 group transition cursor-pointer shrink-0"
              title="Refresh & Return to Home"
            >
              <Logo
                showText={true}
                textVariant="dark"
                className="w-13 h-13 sm:w-15 sm:h-15 group-hover:scale-105 transition-transform shrink-0"
                titleClassName="text-base sm:text-xl font-black tracking-tight whitespace-nowrap"
                subtitleClassName="text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap"
              />
            </div>

            {/* Center Navigation Links (Swapped Order & Tightened Icon Gap) */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-extrabold text-slate-700 uppercase tracking-wider shrink-0">
              <button
                onClick={() => scrollToSection('home-visit')}
                className="hover:text-blue-600 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap py-1.5"
              >
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Home Sample Visit</span>
              </button>
              <button
                onClick={() => scrollToSection('search-catalog')}
                className="hover:text-blue-600 transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap py-1.5"
              >
                <TestTube className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tests & Packages</span>
              </button>
              <button
                onClick={() => scrollToSection('workflow')}
                className="hover:text-blue-600 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap py-1.5"
              >
                <Activity className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Workflow & Roles</span>
              </button>
              <button
                onClick={() => scrollToSection('branch')}
                className="hover:text-blue-600 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap py-1.5"
              >
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Flagship Lab</span>
              </button>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAiBot(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-sm"
            >
              <Bot className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">AI Lab Assistant</span>
            </motion.button>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to={isAuthenticated ? '/portal/dashboard' : '/login'}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-600/20 transition inline-flex items-center gap-2 whitespace-nowrap"
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Portal Login'}</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO & HOME VISIT (z-20 without overflow-hidden so z-50 dropdown floats over lower sections) */}
      <section
        id="home-visit"
        className="min-h-[calc(100vh-5rem)] relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col justify-center py-12 sm:py-16 px-4 sm:px-8 z-20 scroll-mt-20"
      >
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-extrabold px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>NABL ACCREDITED DIGITAL PATHOLOGY HUB</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Advanced Laboratory <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
                Information Management System
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Book Home Sample Visits or Lab Visits with instant Pay Now or Pay Later options. Track automated barcode generation (`LLD-B-XXXXXX`), analyzer parameter entries, and NABL A4 Letterhead reports.
            </p>

            {/* LIVE DYNAMIC SEARCH BAR WITH POPULAR RECOMMENDATIONS */}
            <div ref={searchContainerRef} className="relative max-w-xl mx-auto lg:mx-0 z-30">
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-400">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  placeholder="Search 100+ diagnostic tests (e.g., HbA1c, Thyroid, LFT, CBC)..."
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
                />

                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchFocused(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white mr-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dynamic Dropdown Panel (Unclipped z-50 overlay) */}
              {isSearchFocused && (
                <div className="absolute left-0 right-0 mt-2 bg-slate-900/98 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-88 overflow-y-auto divide-y divide-slate-800 text-left text-xs">
                  {/* Dropdown Header */}
                  <div className="p-3 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1 text-blue-400">
                      {searchQuery.trim() ? (
                        <>
                          <Search className="w-3.5 h-3.5" /> Search Results ({filteredTests.length + filteredPackages.length} found)
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Popular Recommended Searches
                        </>
                      )}
                    </span>
                    <button
                      onClick={() => {
                        scrollToSection('search-catalog');
                        setIsSearchFocused(false);
                      }}
                      className="text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 font-extrabold"
                    >
                      <span>Explore Catalog</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Empty Query: Render Popular Recommendation Chips */}
                  {!searchQuery.trim() && (
                    <div className="p-4 space-y-3">
                      <div className="text-[11px] text-slate-400 font-semibold">Click any popular test recommendation to search:</div>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_RECOMMENDED.map((rec, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchQuery(rec.query);
                              setIsSearchFocused(true);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                          >
                            <span>{rec.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Non-Empty Query: Render Filtered Search Results */}
                  {searchQuery.trim() && (
                    <>
                      {filteredTests.length === 0 && filteredPackages.length === 0 ? (
                        <div className="p-5 text-center text-slate-400 space-y-2">
                          <p>No diagnostic tests matched "{searchQuery}".</p>
                          <button
                            onClick={() => {
                              scrollToSection('search-catalog');
                              setIsSearchFocused(false);
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Browse Full Catalog Below
                          </button>
                        </div>
                      ) : (
                        <>
                          {filteredTests.map((test) => (
                            <div
                              key={test.id}
                              onClick={() => {
                                openBookingModal(test, 'TEST');
                                setIsSearchFocused(false);
                              }}
                              className="p-3.5 hover:bg-blue-600/30 cursor-pointer transition flex items-center justify-between group"
                            >
                              <div>
                                <span className="font-bold text-white text-sm group-hover:text-blue-300 transition">
                                  {test.name}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Category: <span className="text-blue-400 font-semibold">{test.category}</span> • Sample: {test.sample_type}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-emerald-400 text-sm block">₹{test.price}</span>
                                <span className="text-[10px] text-blue-400 font-bold">Book Now →</span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Live Key Metrics */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-xs">
              <div>
                <div className="font-black text-white text-lg sm:text-2xl">30 Mins</div>
                <div className="text-slate-400 text-[11px]">Home Sample Arrival</div>
              </div>
              <div>
                <div className="font-black text-white text-lg sm:text-2xl">100% Verified</div>
                <div className="text-slate-400 text-[11px]">Pathologist Sign-off</div>
              </div>
              <div>
                <div className="font-black text-white text-lg sm:text-2xl">Pay Now/Later</div>
                <div className="text-slate-400 text-[11px]">Instant Bill Generation</div>
              </div>
            </div>
          </div>

          {/* Right Hero Card: Quick Booking Workflow Options */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 backdrop-blur-xl text-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-blue-600 shrink-0" />
                    Book Diagnostic Visit
                  </h3>
                  <p className="text-xs text-slate-500">Home Collection or Lab Visit Appointment</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  LIVE SLOTS
                </span>
              </div>

              <div className="space-y-3">
                {/* Home Visit Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => openBookingModal(CATALOG_TESTS[0], 'TEST', 'HOME_COLLECTION')}
                  className="p-4 bg-slate-50 hover:bg-blue-50/70 rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition shadow-sm hover:shadow-md space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" /> Home Visit Service
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
                      Pay Now / Later
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Phlebotomist arrives with vacutainer kit. Auto sample code generated.</p>
                </motion.div>

                {/* Lab Visit Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => openBookingModal(CATALOG_TESTS[0], 'TEST', 'LAB_VISIT')}
                  className="p-4 bg-slate-50 hover:bg-purple-50/70 rounded-2xl border border-slate-200 hover:border-purple-400 cursor-pointer transition shadow-sm hover:shadow-md space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-600 shrink-0" /> Direct Lab Visit
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
                      Scheduled Slot
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Walk-in or doctor referral at dedicated time slot. Reception desk billing.</p>
                </motion.div>
              </div>

              <button
                onClick={() => openBookingModal(CATALOG_TESTS[0], 'TEST', 'HOME_COLLECTION')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Select Diagnostic Test & Book</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: TESTS CATALOG WITH HOVER TILE ANIMATIONS */}
      <section
        id="search-catalog"
        className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-8 scroll-mt-20 relative z-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Full Diagnostic Suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">NABL Diagnostic Test Catalog</h2>
            <p className="text-xs text-slate-500">Filter parameters by specialty category or search keyword.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Tests Grid with Smooth Lift & Shadow Hover Animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredTests.map((test) => (
            <motion.div
              key={test.id}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all space-y-4 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                    {test.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{test.sample_type}</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                  {test.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{test.preparation}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-base font-black text-slate-900">₹{test.price}</span>
                <button
                  onClick={() => openBookingModal(test, 'TEST')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm group-hover:shadow-md"
                >
                  <span>Book Test</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3: WORKFLOW & ROLES */}
      <section
        id="workflow"
        className="relative py-20 sm:py-28 bg-slate-950 text-white px-4 sm:px-8 scroll-mt-20 overflow-hidden border-t border-b border-slate-800"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-4 py-1.5 rounded-full border border-emerald-800/80 backdrop-blur-md mb-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>COMPLETE LIMS OPERATING WORKFLOW</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight pt-1">End-to-End Laboratory Lifecycle</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed pt-1">
              From patient booking to automated sample barcodes (`LLD-B-XXXXXX`), analyzer parameter entries, and digital pathologist approvals.
            </p>

            {/* Metric Highlights Pills */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <span className="bg-slate-900 border border-slate-800 text-blue-300 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> 99.9% Testing Precision
              </span>
              <span className="bg-slate-900 border border-slate-800 text-amber-300 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Automated Vacutainer Barcoding
              </span>
              <span className="bg-slate-900 border border-slate-800 text-purple-300 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" /> Instant NABL Signed Reports
              </span>
            </div>
          </div>

          {/* Workflow Steps Grid with Hover Animations */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs relative">
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-slate-900/90 hover:bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all space-y-4 shadow-xl relative group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black flex items-center justify-center text-base shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">STAGE 01</span>
                <h3 className="font-extrabold text-white text-base mt-0.5">Patient Booking</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Choose Home Visit or Lab Visit. Select <strong>Pay Now</strong> (instant digital invoice) or <strong>Pay Later</strong> (collected by Tech/Receptionist).
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="bg-slate-900/90 hover:bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all space-y-4 shadow-xl relative group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black flex items-center justify-center text-base shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">STAGE 02</span>
                <h3 className="font-extrabold text-white text-base mt-0.5">Sample Collection</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Technician accepts appointment, marks "Visited", collects sample → System auto-generates barcode ID (`LLD-B-XXXXXX`, `LLD-S-XXXXXX`).
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="bg-slate-900/90 hover:bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 shadow-xl relative group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black flex items-center justify-center text-base shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">STAGE 03</span>
                <h3 className="font-extrabold text-white text-base mt-0.5">Analyzer Result Entry</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Technician inputs test parameter values into dedicated test forms with auto HIGH/LOW flag calculation and submits for review.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="bg-slate-900/90 hover:bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all space-y-4 shadow-xl relative group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white font-black flex items-center justify-center text-base shadow-lg group-hover:scale-110 transition-transform">
                4
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">STAGE 04</span>
                <h3 className="font-extrabold text-white text-base mt-0.5">Approval / Rejection Loop</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Pathologist or Owner verifies values. <strong>If Approved</strong>: NABL A4 PDF Report published. <strong>If Rejected</strong>: Returned to Tech for correction.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FLAGSHIP LAB LOCATION & CAPABILITIES SHOWCASE */}
      <section
        id="branch"
        className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto space-y-12 scroll-mt-20"
      >
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200 mb-2">
            <span>Flagship Laboratory Centre</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 pt-1">Visit Our Central Diagnostic Hub</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto pt-1">
            State-of-the-art pathology facility equipped with fully automated analyzers and cold-chain sample transport protocols.
          </p>
        </div>

        {/* 2-Column Hub Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Primary Branch Card */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-8 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-extrabold bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
                    {primaryBranch.code}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-xl mt-2">{primaryBranch.name}</h3>
                </div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200">
                  {primaryBranch.accreditation}
                </span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Address:</span>
                    <p className="text-slate-600 leading-relaxed font-medium">{primaryBranch.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Helpline:</span>
                  <a href={`tel:${primaryBranch.phone}`} className="text-slate-800 font-mono font-bold hover:underline">
                    {primaryBranch.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <a
                href={`tel:${primaryBranch.phone}`}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl text-center transition shadow-md shadow-blue-600/20"
              >
                Call Phlebotomy Desk
              </a>
              <button
                onClick={() => openBookingModal(CATALOG_TESTS[0], 'TEST', 'LAB_VISIT')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold rounded-xl text-center transition"
              >
                Book Walk-In Visit
              </button>
            </div>
          </div>

          {/* Right Column: Lab Capabilities Grid */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ y: -4 }}
              className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all space-y-2 flex flex-col justify-between cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Automated Analyzers</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">High-throughput biochemistry & hematology testing instruments.</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2 flex flex-col justify-between cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Cold-Chain Transport</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Temperature-monitored vacutainer sample carrying kits.</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all space-y-2 flex flex-col justify-between cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">NABL QC Standards</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Multi-level calibration and daily standard run checks.</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all space-y-2 flex flex-col justify-between cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Digital Portal Sync</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Real-time report publishing directly to patient & doctor portals.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER WITH OFFICIAL BRANDING */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div onClick={handleHomeRefresh} className="cursor-pointer">
              <Logo
                textVariant="light"
                className="w-13 h-13 sm:w-15 sm:h-15"
                titleClassName="text-lg sm:text-xl font-black whitespace-nowrap"
                subtitleClassName="text-[10px] sm:text-xs font-extrabold whitespace-nowrap"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Life Line Diagnostics is an NABL accredited & ISO 9001:2015 certified laboratory network providing comprehensive digital pathology services.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase text-xs tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs">
              <li><button onClick={() => scrollToSection('search-catalog')} className="hover:text-white cursor-pointer transition">Diagnostic Tests Catalog</button></li>
              <li><button onClick={() => scrollToSection('workflow')} className="hover:text-white cursor-pointer transition">Workflow & Roles</button></li>
              <li><button onClick={() => scrollToSection('branch')} className="hover:text-white cursor-pointer transition">Branch Location</button></li>
              <li><Link to="/login" className="hover:text-white transition">Patient Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase text-xs tracking-wider mb-4">LIMS Workstation Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/login" className="hover:text-white transition">Reception Desk Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Technician Specimen Workstation</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Pathologist Approval Desk</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Owner / Admin Control Hub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase text-xs tracking-wider mb-4">Support & Helpline</h4>
            <p className="text-xs text-slate-300 font-bold leading-relaxed">Puspha Hotel Rd, opp. to Assure hospital, New Giri Puram, Kasturibaipet, Vijayawada, Andhra Pradesh 520002</p>
            <p className="text-xs text-slate-400 mt-2 font-mono font-bold">Phone: +91 866 247 8900</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-800 text-center text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Life Line Diagnostics Path Labs. All rights reserved.
        </div>
      </footer>

      {/* QUICK TEST BOOKING MODAL (WITH CUSTOM SEARCHABLE DROPDOWN) */}
      {bookingTestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-blue-600 shrink-0" />
                  Book Diagnostic Test / Package
                </h3>
                <p className="text-xs text-slate-500">Selected Item Amount: <strong className="font-bold text-slate-900">₹{bookingTestModal.item.price}</strong></p>
              </div>

              <button onClick={() => setBookingTestModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickBooking} className="space-y-4 text-xs">
              {/* PATIENT TEST SELECTION CUSTOM SEARCHABLE DROPDOWN */}
              <div ref={modalDropdownRef} className="space-y-1 relative">
                <label className="font-bold text-slate-700 block">Select Diagnostic Test or Package *</label>

                {/* Selected Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsModalDropdownOpen(!isModalDropdownOpen)}
                  className="w-full bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-300 transition text-left flex items-center justify-between cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <TestTube className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-900 text-xs">{bookingTestModal.item.name}</span>
                      <span className="text-[10px] text-slate-500 ml-2 font-mono">₹{bookingTestModal.item.price}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                </button>

                {/* Searchable Dropdown Popup Menu */}
                {isModalDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 space-y-2 max-h-64 overflow-y-auto">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        autoFocus
                        value={modalSearchFilter}
                        onChange={(e) => setModalSearchFilter(e.target.value)}
                        placeholder="Type test name or category to search..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {/* Diagnostic Tests */}
                      <div className="py-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Single Diagnostic Tests
                        </div>
                        {CATALOG_TESTS.filter((t) =>
                          t.name.toLowerCase().includes(modalSearchFilter.toLowerCase()) ||
                          t.category.toLowerCase().includes(modalSearchFilter.toLowerCase())
                        ).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setBookingTestModal({ item: t, type: 'TEST' });
                              setIsModalDropdownOpen(false);
                              setModalSearchFilter('');
                            }}
                            className={`p-2 rounded-xl cursor-pointer transition flex items-center justify-between ${
                              bookingTestModal.item.id === t.id
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div>
                              <div className="font-bold">{t.name}</div>
                              <div className="text-[10px] text-slate-400">{t.category}</div>
                            </div>
                            <span className="font-mono font-bold text-emerald-600 text-xs">₹{t.price}</span>
                          </div>
                        ))}
                      </div>

                      {/* Health Packages */}
                      <div className="py-1">
                        <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider px-2 py-1">
                          Comprehensive Health Packages
                        </div>
                        {CATALOG_PACKAGES.filter((p) =>
                          p.name.toLowerCase().includes(modalSearchFilter.toLowerCase()) ||
                          p.description?.toLowerCase().includes(modalSearchFilter.toLowerCase())
                        ).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setBookingTestModal({ item: p, type: 'PACKAGE' });
                              setIsModalDropdownOpen(false);
                              setModalSearchFilter('');
                            }}
                            className={`p-2 rounded-xl cursor-pointer transition flex items-center justify-between ${
                              bookingTestModal.item.id === p.id
                                ? 'bg-purple-50 text-purple-700 font-bold'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div>
                              <div className="font-bold">{p.name}</div>
                              <div className="text-[10px] text-slate-400">{p.description}</div>
                            </div>
                            <span className="font-mono font-bold text-purple-600 text-xs">₹{p.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Rajesh Kumar"
                    value={bookingForm.fullName}
                    onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={bookingForm.mobile}
                    onChange={(e) => setBookingForm({ ...bookingForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Service Visit Type</label>
                  <select
                    value={bookingForm.visitType}
                    onChange={(e) => setBookingForm({ ...bookingForm, visitType: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="HOME_COLLECTION">Home Sample Visit</option>
                    <option value="LAB_VISIT">Direct Lab Visit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Option</label>
                  <select
                    value={bookingForm.paymentPreference}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentPreference: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="PAY_NOW">Pay Now (Online)</option>
                    <option value="PAY_LATER">Pay Later (During Visit)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Address for home collection / report delivery"
                  value={bookingForm.address}
                  onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingTestModal(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 shrink-0" /> Confirm & Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING SUCCESS CONFIRMATION MODAL */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Appointment Booked Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Visit ID: <strong className="font-mono text-blue-700">{bookingSuccessModal.visit_id}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1 text-slate-700 font-mono">
              <div>Patient: {bookingSuccessModal.patient_name}</div>
              <div>Test: {bookingSuccessModal.tests_summary}</div>
              <div>Amount: ₹{bookingSuccessModal.total_amount} ({bookingSuccessModal.payment_status})</div>
              <div>Type: {bookingSuccessModal.visit_type}</div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Sign In to Track Live Status & Download Bill
              </Link>
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close & Return to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI CHATBOT MODAL */}
      <AIChatbotModal isOpen={showAiBot} onClose={() => setShowAiBot(false)} />
    </div>
  );
}
