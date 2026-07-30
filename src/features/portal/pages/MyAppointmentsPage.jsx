import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  PlusCircle,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Home,
  TestTube,
} from 'lucide-react';

const formatDate = (isoStr) => {
  if (!isoStr) return 'Date Pending';
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

const getStatusBadge = (status) => {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Completed</span>;
    case 'ACCEPTED':
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Technician Accepted</span>;
    case 'VISITED':
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">Visited</span>;
    case 'SAMPLE_COLLECTED':
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">Sample Collected</span>;
    case 'TESTED':
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Testing Complete</span>;
    case 'UNDER_REVIEW':
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Under Review</span>;
    case 'PENDING':
    case 'BOOKED':
    default:
      return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Acceptance</span>;
  }
};

export const MyAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await portalAPI.getAppointments();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Appointments load error:', e);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  const filteredAppointments = appointments.filter((a) =>
    (a.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.status || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.collection_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Diagnostic Appointments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active home collection requests and laboratory visit schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <InteractiveSearchBar
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredAppointments.length}
            />
          </div>

          <Link
            to="/portal/appointments/book"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              <div className="h-10 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Appointments Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You don't have any booked appointments yet. Book a home collection or lab visit now.
            </p>
          </div>
          <Link
            to="/portal/appointments/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Diagnostic Test</span>
          </Link>
        </div>
      ) : (
        /* Appointments List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => {
            const aptNum = apt.invoice_id || apt.patient_id || `APT-${apt.id.slice(0, 8)}`;
            const collectionLabel = apt.collection_type === 'HOME' ? 'Home Collection Visit' : 'Laboratory Visit';

            return (
              <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                {/* Top Bar: Reference & Status */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-blue-600">{aptNum}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                        {apt.collection_type === 'HOME' ? '🏠 HOME' : '🏥 LAB VISIT'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{collectionLabel}</p>
                  </div>
                  <div>{getStatusBadge(apt.status)}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Date</span>
                      <span className="font-bold text-slate-900">{formatDate(apt.scheduled_for)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Time Slot</span>
                      <span className="font-bold text-slate-900">{formatTime(apt.scheduled_for)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Assigned Lab / Branch</span>
                      <span className="font-bold text-slate-900">Life Line Diagnostics — Vijayawada Hub</span>
                    </div>
                  </div>

                  {apt.collection_type === 'HOME' && (
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-semibold">Sample Pickup Address</span>
                        <span className="font-semibold text-slate-800 truncate block">{apt.address || 'Address provided on booking'}</span>
                      </div>
                    </div>
                  )}

                  {apt.assigned_to && (
                    <div className="flex items-center gap-2 text-slate-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 col-span-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-emerald-600 block font-semibold">Assigned Phlebotomist / Tech</span>
                        <span className="font-bold text-emerald-900">{apt.assigned_to}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Billing & Payment Status */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Invoice Bill</span>
                    <span className="text-sm font-black text-slate-900">
                      {apt.total_amount ? `₹${apt.total_amount}` : 'Calculated'}
                    </span>
                  </div>

                  {apt.payment_status === 'PAID' ? (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Payment Settled</span>
                    </span>
                  ) : (
                    <Link
                      to="/portal/invoices"
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay {apt.total_amount ? `₹${apt.total_amount}` : 'Bill'}</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;
