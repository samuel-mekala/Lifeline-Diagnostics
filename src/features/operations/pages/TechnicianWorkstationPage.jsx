import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import OperationsDataStore from '../services/operationsData';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
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
} from 'lucide-react';

export default function TechnicianWorkstationPage({ mode: propMode }) {
  const { user } = useAuth();
  const location = useLocation();

  const activeMode = propMode || (location.pathname.includes('/results') ? 'results' : 'samples');
  const isSampleMode = activeMode === 'samples';

  const [samples, setSamples] = useState([]);
  const [visits, setVisits] = useState([]);
  const [results, setResults] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Selected States
  const [activeSampleForCollection, setActiveSampleForCollection] = useState(null);
  const [barcodePrintSample, setBarcodePrintSample] = useState(null);
  const [activeVisitForResults, setActiveVisitForResults] = useState(null);

  // Form States
  const [collectionForm, setCollectionForm] = useState({
    tubeColor: 'EDTA Lavender (Whole Blood)',
    containerCount: 1,
    notes: '',
    collectPayment: false,
  });

  const [parameters, setParameters] = useState([]);
  const [techComments, setTechComments] = useState('');

  const refreshData = () => {
    setSamples(OperationsDataStore.getSamples() || []);
    setVisits(OperationsDataStore.getVisits() || []);
    setResults(OperationsDataStore.getResults() || {});
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Filter Samples by Search & Status
  const filteredSamples = samples.filter((s) => {
    const matchesSearch =
      s.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.barcode_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.test_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.visit_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Technician Accepts Patient Appointment / Home Visit
  const handleAcceptPatient = (visitId) => {
    OperationsDataStore.assignTechnician(
      visitId,
      user?.full_name || 'Anil Kumar (Tech)',
      'LAB_TECHNICIAN'
    );
    refreshData();
  };

  // Technician Marks Visit as "VISITED"
  const handleMarkVisited = (visitId) => {
    OperationsDataStore.markVisited(visitId, user?.full_name || 'Anil Kumar (Tech)');
    refreshData();
  };

  // Handle Phlebotomy Sample Collection & Payment Collection
  const handleConfirmCollection = (e) => {
    e.preventDefault();
    if (!activeSampleForCollection) return;

    // Collect sample & generate auto barcode codes
    OperationsDataStore.collectSampleAndGenerateCodes(
      activeSampleForCollection.visit_id,
      user?.full_name || 'Anil Kumar (Tech)',
      collectionForm.collectPayment
    );

    refreshData();
    setBarcodePrintSample(activeSampleForCollection);
    setActiveSampleForCollection(null);
    setCollectionForm({ tubeColor: 'EDTA Lavender (Whole Blood)', containerCount: 1, notes: '', collectPayment: false });
  };

  // Quick Status Update (e.g. "IN_LAB" / "TESTED")
  const handleQuickStatusUpdate = (barcodeId, newStatus) => {
    OperationsDataStore.updateSampleStatus(
      barcodeId,
      newStatus,
      newStatus === 'IN_LAB' ? 'Central Analyzer Station #1' : 'Sample Storage',
      user?.full_name || 'Anil Kumar (Tech)'
    );
    refreshData();
  };

  // Open Result Entry Modal / Form
  const openResultEntry = (visitId) => {
    const visit = visits.find((v) => v.visit_id === visitId);
    if (!visit) return;

    setActiveVisitForResults(visit);

    const existing = results[visitId];
    if (existing && existing.parameters) {
      setParameters(existing.parameters);
      setTechComments(existing.tech_comments || '');
    } else {
      const defaultParams = getDefaultParametersForTest(visit.tests_summary);
      setParameters(defaultParams);
      setTechComments('');
    }
  };

  const getDefaultParametersForTest = (testTitle = '') => {
    const titleLower = testTitle.toLowerCase();

    if (titleLower.includes('thyroid')) {
      return [
        { name: 'Total Triiodothyronine (T3)', result: '115.0', unit: 'ng/dL', reference_range: '80.0 - 200.0', flag: 'NORMAL' },
        { name: 'Total Thyroxine (T4)', result: '8.2', unit: 'µg/dL', reference_range: '5.0 - 12.0', flag: 'NORMAL' },
        { name: 'Thyroid Stimulating Hormone (TSH)', result: '2.45', unit: 'µIU/mL', reference_range: '0.40 - 4.00', flag: 'NORMAL' },
      ];
    } else if (titleLower.includes('blood') || titleLower.includes('cbc')) {
      return [
        { name: 'Hemoglobin (Hb)', result: '14.5', unit: 'g/dL', reference_range: '13.5 - 17.5', flag: 'NORMAL' },
        { name: 'Total Leukocyte Count (WBC)', result: '7,800', unit: '/µL', reference_range: '4,000 - 11,000', flag: 'NORMAL' },
        { name: 'Platelet Count', result: '2.5', unit: 'lakhs/µL', reference_range: '1.5 - 4.5', flag: 'NORMAL' },
        { name: 'RBC Count', result: '4.8', unit: 'million/µL', reference_range: '4.5 - 5.9', flag: 'NORMAL' },
      ];
    } else if (titleLower.includes('liver') || titleLower.includes('lft')) {
      return [
        { name: 'Bilirubin Total', result: '2.4', unit: 'mg/dL', reference_range: '0.2 - 1.2', flag: 'HIGH' },
        { name: 'SGOT (AST)', result: '62.0', unit: 'U/L', reference_range: '5.0 - 40.0', flag: 'HIGH' },
        { name: 'SGPT (ALT)', result: '68.0', unit: 'U/L', reference_range: '5.0 - 45.0', flag: 'HIGH' },
        { name: 'Alkaline Phosphatase (ALP)', result: '118.0', unit: 'U/L', reference_range: '30.0 - 120.0', flag: 'NORMAL' },
      ];
    } else {
      return [
        { name: 'Fasting Blood Glucose', result: '98.0', unit: 'mg/dL', reference_range: '70.0 - 110.0', flag: 'NORMAL' },
        { name: 'HbA1c Glycated Hemoglobin', result: '5.6', unit: '%', reference_range: '4.0 - 5.7', flag: 'NORMAL' },
      ];
    }
  };

  const handleParameterChange = (index, field, value) => {
    const updated = [...parameters];
    updated[index][field] = value;

    if (field === 'result') {
      const numVal = parseFloat(value);
      const rangeParts = updated[index].reference_range.split('-');
      if (!isNaN(numVal) && rangeParts.length === 2) {
        const min = parseFloat(rangeParts[0].trim());
        const max = parseFloat(rangeParts[1].trim());

        if (!isNaN(min) && !isNaN(max)) {
          if (numVal < min) updated[index].flag = 'LOW';
          else if (numVal > max * 1.5) updated[index].flag = 'CRITICAL';
          else if (numVal > max) updated[index].flag = 'HIGH';
          else updated[index].flag = 'NORMAL';
        }
      }
    }

    setParameters(updated);
  };

  const handleSaveResults = () => {
    if (!activeVisitForResults) return;

    OperationsDataStore.submitTestResults(
      activeVisitForResults.visit_id,
      parameters,
      techComments,
      user?.full_name || 'Anil Kumar (Tech)'
    );

    refreshData();
    setActiveVisitForResults(null);
  };

  return (
    <div className="space-y-6">
      {/* Workstation Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${isSampleMode ? 'bg-amber-500' : 'bg-blue-600'}`}>
              {isSampleMode ? 'LAB TECHNICIAN SPECIMEN WORKSTATION' : 'ANALYZER PARAMETER RESULT ENTRY'}
            </span>
            <span className="text-xs text-slate-400">Vijayawada Diagnostic Hub</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">
            {isSampleMode ? 'Patient Appointments & Specimen Barcode Logistics' : 'Analyzer Parameter Entry & Rejection Re-Entries'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Accept patient appointments, perform Home Visits, draw specimen tubes, auto-generate barcode IDs (`LLD-B-XXXXXX`), collect Pay Later fees, and enter analyzer values.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
          <span className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${isSampleMode ? 'bg-amber-500 text-white' : 'text-slate-400'}`}>
            <TestTube className="w-3.5 h-3.5" /> Sample & Home Visits
          </span>
          <span className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${!isSampleMode ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
            <Microscope className="w-3.5 h-3.5" /> Parameter Entry
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Patient Visits & Specimen Barcodes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Active Visits (Home / Lab Visits) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Assigned Appointments & Home Visit Lifecycle
                </h2>
                <p className="text-xs text-slate-500">Accept patient, mark visited, collect sample & payment.</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Visit ID</th>
                    <th className="py-3 px-4">Patient Demographics</th>
                    <th className="py-3 px-4">Visit Type</th>
                    <th className="py-3 px-4">Billing Status</th>
                    <th className="py-3 px-4">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No active appointments in queue.
                      </td>
                    </tr>
                  ) : (
                    visits.map((v) => (
                      <tr key={v.visit_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {v.visit_id}
                          <div className="text-[10px] text-slate-400 font-sans">{v.created_at?.slice(11, 16)}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{v.patient_name}</div>
                          <div className="text-[11px] text-slate-500">{v.mobile} • {v.tests_summary}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${v.visit_type === 'HOME_COLLECTION' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                            {v.visit_type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${v.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            ₹{v.total_amount} ({v.payment_status})
                          </span>
                        </td>

                        <td className="py-3.5 px-4 space-x-1">
                          {v.status === 'REGISTERED' && (
                            <button
                              onClick={() => handleAcceptPatient(v.visit_id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                            >
                              Accept
                            </button>
                          )}

                          {(v.status === 'TECHNICIAN_ASSIGNED' || v.status === 'REGISTERED') && (
                            <button
                              onClick={() => handleMarkVisited(v.visit_id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                            >
                              Mark Visited
                            </button>
                          )}

                          {(v.status === 'VISITED' || v.status === 'TECHNICIAN_ASSIGNED' || v.status === 'REGISTERED') && (
                            <button
                              onClick={() => setActiveSampleForCollection({ visit_id: v.visit_id, patient_name: v.patient_name, test_name: v.tests_summary, payment_status: v.payment_status, total_amount: v.total_amount })}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                            >
                              Collect Sample
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Specimen Barcodes Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-amber-600" />
                  Specimen Tube Barcodes
                </h2>
                <p className="text-xs text-slate-500">Auto-generated barcodes (`LLD-B-XXXXXX`, `LLD-S-XXXXXX`).</p>
              </div>

              <div className="w-full sm:w-64">
                <InteractiveSearchBar
                  placeholder="Search barcode or patient..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  suggestions={['LLD-B-000345', 'LLD-S-000345', 'Rahul Sharma', 'COLLECTED']}
                  resultCount={filteredSamples.length}
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Specimen Barcode</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Container Tube</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSamples.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No specimen barcodes match filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSamples.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          <div className="flex items-center gap-1">
                            <Barcode className="w-4 h-4" />
                            {s.barcode_id}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{s.patient_name}</td>
                        <td className="py-3.5 px-4">{s.tube_color}</td>
                        <td className="py-3.5 px-4">
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${s.status === 'COLLECTED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openResultEntry(s.visit_id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition"
                          >
                            Enter Parameter Values
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Ready for Result Entry & Rejection Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-indigo-600" />
              Visits Ready for Result Entry
            </h2>
            <p className="text-xs text-slate-500">Select visit to input parameter values or view rejection notes.</p>

            <div className="space-y-3">
              {visits.map((v) => {
                const res = results[v.visit_id];
                const isRejected = v.status === 'REJECTED' || (res && res.status === 'REJECTED');

                return (
                  <div
                    key={v.visit_id}
                    onClick={() => openResultEntry(v.visit_id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition space-y-2 ${
                      isRejected
                        ? 'border-rose-300 bg-rose-50/60 hover:bg-rose-100/60'
                        : 'border-slate-200 bg-slate-50 hover:bg-indigo-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-xs">{v.visit_id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isRejected
                            ? 'bg-rose-600 text-white animate-pulse'
                            : res
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isRejected ? 'REJECTED BY PATHOLOGIST' : res ? 'RESULTS SUBMITTED' : 'PENDING ENTRY'}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs">{v.patient_name}</div>
                    <div className="text-[11px] text-slate-600 truncate">{v.tests_summary}</div>

                    {isRejected && v.pathologist_notes && (
                      <div className="bg-white p-2 rounded-lg border border-rose-200 text-[11px] text-rose-800 font-medium">
                        <strong>Rejection Reason:</strong> {v.pathologist_notes}
                      </div>
                    )}

                    <div className="pt-1 text-[10px] font-bold text-indigo-600 flex items-center justify-between">
                      <span>{isRejected ? 'Click to re-enter corrected values' : 'Open parameter form'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: SAMPLE COLLECTION & PAY LATER COLLECTION */}
      {activeSampleForCollection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <TestTube className="w-5 h-5 text-amber-600" />
                Phlebotomy Sample Collection
              </h3>
              <button onClick={() => setActiveSampleForCollection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-900 space-y-1 border border-amber-200">
              <div>Visit ID: <strong>{activeSampleForCollection.visit_id}</strong></div>
              <div>Patient: <strong>{activeSampleForCollection.patient_name}</strong></div>
              <div>Tests: <strong>{activeSampleForCollection.test_name}</strong></div>
            </div>

            <form onSubmit={handleConfirmCollection} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Container Tube</label>
                <select
                  value={collectionForm.tubeColor}
                  onChange={(e) => setCollectionForm({ ...collectionForm, tubeColor: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="EDTA Lavender (Whole Blood)">EDTA Lavender (Whole Blood)</option>
                  <option value="SST Gold Gel (Serum Separator)">SST Gold Gel (Serum Separator)</option>
                  <option value="Sodium Fluoride Grey (Glucose)">Sodium Fluoride Grey (Glucose)</option>
                  <option value="Red Top Plain">Red Top Plain</option>
                </select>
              </div>

              {activeSampleForCollection.payment_status !== 'PAID' && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block">Collect Pay Later Amount</span>
                    <span className="text-[11px] text-emerald-700">Total Due: ₹{activeSampleForCollection.total_amount}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={collectionForm.collectPayment}
                    onChange={(e) => setCollectionForm({ ...collectionForm, collectPayment: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSampleForCollection(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm & Auto-Generate Barcode ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DYNAMIC PARAMETER ENTRY FORM WITH REJECTION CORRECTION */}
      {activeVisitForResults && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-indigo-600" />
                  Analyzer Parameter Result Entry Form
                </h3>
                <p className="text-xs text-slate-500">
                  Visit #{activeVisitForResults.visit_id} • Patient: <strong>{activeVisitForResults.patient_name}</strong>
                </p>
              </div>

              <button onClick={() => setActiveVisitForResults(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeVisitForResults.status === 'REJECTED' && (
              <div className="bg-rose-100 border-l-4 border-rose-600 p-3 rounded-r-xl text-xs text-rose-900 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                  <RotateCcw className="w-4 h-4" /> REJECTED BY PATHOLOGIST FOR RE-ENTRY
                </div>
                <p>Rejection Reason: {activeVisitForResults.pathologist_notes || 'Please verify parameter values.'}</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                Parameter Measurements & Reference Ranges
              </h4>

              <div className="space-y-2">
                {parameters.map((param, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-4 font-bold text-slate-800">{param.name}</div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={param.result}
                        onChange={(e) => handleParameterChange(idx, 'result', e.target.value)}
                        className="w-full bg-white p-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="col-span-2 text-slate-500 font-mono">{param.unit}</div>
                    <div className="col-span-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">{param.reference_range}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${param.flag === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {param.flag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Technician Observations & QC Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Quality controls passed."
                value={techComments}
                onChange={(e) => setTechComments(e.target.value)}
                className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={handleSaveResults}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Submit for Pathologist Sign-Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
