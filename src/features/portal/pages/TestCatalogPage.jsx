import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  TestTube,
  Clock,
  Info,
  ShieldCheck,
  CalendarPlus,
  Package,
  Award,
  Sparkles,
  ChevronRight,
  Droplet,
  Check,
  Filter,
} from 'lucide-react';

export default function TestCatalogPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('INDIVIDUAL_TESTS'); // 'INDIVIDUAL_TESTS' | 'HEALTH_PACKAGES'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const [tData, pData] = await Promise.all([
          portalAPI.getTestCatalog(),
          portalAPI.getPackageCatalog(),
        ]);
        setTests(Array.isArray(tData) ? tData : []);
        setPackages(Array.isArray(pData) ? pData : []);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const categories = [
    { label: 'Hematology', value: 'HEMATOLOGY' },
    { label: 'Biochemistry', value: 'BIOCHEMISTRY' },
    { label: 'Immunology', value: 'IMMUNOLOGY' },
    { label: 'Pathology', value: 'PATHOLOGY' },
  ];

  // Filter Tests
  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.sample_type || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBookTest = (test) => {
    navigate('/portal/appointments/book', { state: { preselectedTest: test } });
  };

  const handleBookPackage = (pkg) => {
    navigate('/portal/appointments/book', { state: { preselectedPackage: pkg } });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <TestTube className="w-3.5 h-3.5" /> DIAGNOSTIC REFERENCE LIBRARY
            </span>
            <span className="text-xs text-blue-300 font-semibold">100% NABL Accredited Parameters</span>
          </div>
          <h1 className="text-2xl font-black mt-2">Laboratory Test Catalog & Clinical Directory</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Explore sample requirements, turnaround times, and 3-tier price catalogs. Book tests with home sample pickup or walk-in appointment.
          </p>
        </div>

        {/* View Switcher */}
        <div className="bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 flex items-center gap-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('INDIVIDUAL_TESTS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'INDIVIDUAL_TESTS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <TestTube className="w-4 h-4" /> Individual Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('HEALTH_PACKAGES')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'HEALTH_PACKAGES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Health Packages ({packages.length})
          </button>
        </div>
      </div>

      {/* Interactive Search Bar & Filters */}
      {activeTab === 'INDIVIDUAL_TESTS' && (
        <InteractiveSearchBar
          placeholder="Search test by name, department (Hematology, Bio), or specimen..."
          value={searchQuery}
          onChange={setSearchQuery}
          filterTags={categories}
          activeTag={selectedCategory}
          onTagSelect={setSelectedCategory}
          resultCount={filteredTests.length}
        />
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-100 rounded"></div>
              <div className="h-12 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : activeTab === 'INDIVIDUAL_TESTS' ? (
        /* View Content: Individual Tests Catalog */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => (
            <div
              key={test.test_id || test.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                    {test.test_id || test.id}
                  </span>
                  <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                    {test.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{test.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" />
                      {test.sample_type || 'Blood'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Same Day Report
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Price Catalogs Badge Row */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Walk-In</span>
                    <span className="text-xs font-black text-slate-900">₹{test.walk_in_price || 0}</span>
                  </div>

                  <div className="bg-blue-50 p-2 rounded-xl border border-blue-200/60">
                    <span className="text-[9px] font-bold text-blue-700 uppercase block">Home (1.5x)</span>
                    <span className="text-xs font-black text-blue-900">₹{test.home_collection_price || Math.round((test.walk_in_price || 0) * 1.5)}</span>
                  </div>

                  <div className="bg-purple-50 p-2 rounded-xl border border-purple-200/60">
                    <span className="text-[9px] font-bold text-purple-700 uppercase block">Doc Ref (2.0x)</span>
                    <span className="text-xs font-black text-purple-900">₹{test.doctor_referral_price || Math.round((test.walk_in_price || 0) * 2.0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBookTest(test)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <CalendarPlus className="w-3.5 h-3.5" /> Book This Test
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* View Content: Health Packages Catalog */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.package_id || pkg.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-lg transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {pkg.test_count || (pkg.tests ? pkg.tests.length : 10)} Tests Included
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" /> POPULAR
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{pkg.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>

                {pkg.tests && pkg.tests.length > 0 && (
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-2">
                    <div className="font-bold text-blue-900 text-[11px] uppercase tracking-wider">Key Included Diagnostics:</div>
                    <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-700 font-medium">
                      {pkg.tests.slice(0, 4).map((tName, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" /> {tName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Walk-In</span>
                    <span className="text-xs font-black text-slate-900">₹{pkg.walk_in_price || 0}</span>
                  </div>

                  <div className="bg-blue-50 p-2 rounded-xl border border-blue-200/60">
                    <span className="text-[9px] font-bold text-blue-700 uppercase block">Home</span>
                    <span className="text-xs font-black text-blue-900">₹{pkg.home_collection_price || Math.round((pkg.walk_in_price || 0) * 1.5)}</span>
                  </div>

                  <div className="bg-purple-50 p-2 rounded-xl border border-purple-200/60">
                    <span className="text-[9px] font-bold text-purple-700 uppercase block">Doc Ref</span>
                    <span className="text-xs font-black text-purple-900">₹{pkg.doctor_referral_price || Math.round((pkg.walk_in_price || 0) * 2.0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBookPackage(pkg)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4" /> Book Package Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
