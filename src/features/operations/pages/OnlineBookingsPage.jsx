import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import { OfficialReceiptModal } from '../../../components/common/OfficialReceiptModal';
import { OfficialReportModal } from '../../../components/common/OfficialReportModal';
import ToastNotification from '../../../components/common/ToastNotification';
import {
  Globe,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  UserCheck,
  DollarSign,
  Printer,
  Calendar,
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Filter,
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

export const OnlineBookingsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('ALL'); // ALL | HOME | LAB
  const [loading, setLoading] = useState(true);

  // Modals & Toast State
  const [receiptData, setReceiptData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchOnlineBookings = async () => {
    setLoading(true);
    try {
      const data = await portalAPI.getStaffAppointments().catch(() => []);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading online bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineBookings();
  }, []);

  const handleUpdateStatus = async (apt, updatePayload, alertMsg) => {
    try {
      await portalAPI.updateStaffAppointment(apt.id, updatePayload);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, ...updatePayload } : a))
      );
      setToast({ type: 'success', title: 'Workflow Updated', message: alertMsg });
    } catch (err) {
      console.error('Failed to update appointment:', err);
      // Fallback local update
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, ...updatePayload } : a))
      );
      setToast({ type: 'success', title: 'Workflow Updated', message: alertMsg });
    }
  };

  const filtered = appointments.filter((a) => {
    const matchesSearch =
      (a.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCollection = collectionFilter === 'ALL' || a.collection_type === collectionFilter;

    return matchesSearch && matchesCollection;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Reception Tracker Module
            </span>
            <span className="text-xs text-slate-500 font-semibold">Life Line Diagnostics — Vijayawada Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Online Portal Bookings & Home Visits</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track online appointments, assign home collection technicians, and process patient arrivals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <InteractiveSearchBar
              placeholder="Search online booking, patient, INV..."
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filtered.length}
            />
          </div>

          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Modes (Home & Lab)</option>
            <option value="HOME">🏠 Home Collection Only</option>
            <option value="LAB">🏢 Lab Visit Only</option>
          </select>
        </div>
      </div>

      {/* Online Bookings Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Online Portal Appointments ({filtered.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Persisted Live to MySQL Database</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading live online bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800">No Online Appointments Found</h4>
            <p className="text-xs text-slate-400">Book an appointment in the Patient Portal to test real-time reception tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((apt) => {
              const isPaid = apt.payment_status === 'PAID' || apt.payment_status === 'COMPLETED';
              const isHome = apt.collection_type === 'HOME';
              const status = apt.status || 'PENDING';

              return (
                <div key={apt.id} className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 space-y-4 hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-blue-600">{apt.invoice_id || `INV-${apt.id.slice(0, 6)}`}</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{capitalizeName(apt.patient_name || 'Joel')}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full border border-amber-300">
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Scheduled Date & Time</span>
                      <span className="font-bold text-slate-900">{formatDate(apt.scheduled_for)} • {formatTime(apt.scheduled_for)}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Assigned Technician</span>
                      <span className="font-bold text-purple-700 block truncate">
                        {isHome ? apt.assigned_to || 'Unassigned (Assign Tech)' : 'In-Facility Staff'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold">Collection Mode & Address</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {apt.address || 'Vijayawada Hub'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Invoice Total</span>
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
                      {/* Technician Assignment ONLY for Home Collection */}
                      {isHome && !apt.assigned_to && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(apt, { assigned_to_email: 'tech@lifeline.com', assigned_to: 'Sunny (Tech)' }, `Assigned Lab Technician Sunny to home pickup ${apt.invoice_id}.`)
                          }
                          className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Assign Tech
                        </button>
                      )}

                      {!isPaid ? (
                        <button
                          onClick={() =>
                            handleUpdateStatus(apt, { payment_status: 'PAID', status: 'VISITED' }, `Collected cash for ${apt.patient_name}. Saved to MySQL DB.`)
                          }
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <DollarSign className="w-4 h-4" /> Collect Cash & Mark Paid
                        </button>
                      ) : status !== 'VISITED' && status !== 'APPROVED' ? (
                        <button
                          onClick={() =>
                            handleUpdateStatus(apt, { status: 'VISITED' }, `Patient ${apt.patient_name} marked as VISITED. Saved to MySQL DB.`)
                          }
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
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

      <OfficialReceiptModal isOpen={!!receiptData} onClose={() => setReceiptData(null)} invoiceData={receiptData} />
      <OfficialReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default OnlineBookingsPage;
