import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import { PortalDataStore } from '../services/portalData';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  PlusCircle,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';

export const MyAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setAppointments(PortalDataStore.getAppointments(user));
  }, [user]);

  const filteredAppointments = appointments.filter((a) =>
    a.appointment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.items_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.branch_name.toLowerCase().includes(searchQuery.toLowerCase())
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
              suggestions={[
                'APT-1001',
                'Complete Blood Count (CBC)',
                'Vijayawada Main Diagnostic Hub',
                'Home Collection',
              ]}
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

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAppointments.map((apt) => (
          <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600">{apt.appointment_number}</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{apt.items_summary}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {apt.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{apt.scheduled_date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{apt.scheduled_time}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 col-span-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{apt.branch_name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{apt.address}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Bill</span>
                <span className="text-sm font-extrabold text-slate-900">₹{apt.total_amount}</span>
              </div>

              {apt.payment_status === 'PAID' ? (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
                  Payment Settled
                </span>
              ) : (
                <Link
                  to="/portal/invoices"
                  className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay ₹{apt.total_amount}
                </Link>
              )}
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No diagnostic appointments found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointmentsPage;
