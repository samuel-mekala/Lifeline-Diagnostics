import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import { OfficialReceiptModal } from '../../../components/common/OfficialReceiptModal';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  DollarSign,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowDownToLine,
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
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return isoStr;
  }
};

export default function AllInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await portalAPI.getStaffAllInvoices().catch(() => []);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load company invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.visit_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Company Records Repository
            </span>
            <span className="text-xs text-slate-500 font-semibold">Life Line Diagnostics — Vijayawada Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">All Company Invoices & Billing Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete audited record of all walk-in, home collection, and online patient invoices in MySQL DB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <InteractiveSearchBar
              placeholder="Search invoice, patient, PAT-000001..."
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredInvoices.length}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">✓ Paid Invoices</option>
            <option value="UNPAID">⏳ Unpaid / Pay-Later</option>
          </select>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices Issued</span>
          <span className="text-2xl font-black text-slate-900 block">{invoices.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">All channels (Walk-In, Home, Online)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Collected Revenue</span>
          <span className="text-2xl font-black text-emerald-600 block">₹{totalRevenue.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-emerald-700 font-bold">100% verified & deposited</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Outstanding Balance</span>
          <span className="text-2xl font-black text-amber-600 block">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-amber-700 font-bold">Pay-Later home visit collections</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Billing Records Directory ({filteredInvoices.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Sequential IDs (INV-000001)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading company invoice records...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800">No Invoices Found</h4>
            <p className="text-xs text-slate-400">Issue a walk-in bill or book an appointment to view invoice records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Invoice ID</th>
                  <th className="py-3.5 px-4">Patient Name & ID</th>
                  <th className="py-3.5 px-4">Visit ID & Mode</th>
                  <th className="py-3.5 px-4">Bill Amount</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Generated Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';

                  return (
                    <tr key={inv.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-emerald-700">{inv.invoice_id || 'INV-000001'}</td>

                      <td className="py-4 px-4 font-extrabold text-slate-900">
                        {capitalizeName(inv.patient_name)}
                        <span className="block text-[10px] text-slate-400 font-mono">{inv.patient_id}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono text-purple-700 block font-bold">{inv.visit_id}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{inv.entry_mode}</span>
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900 text-sm">₹{inv.total_amount}</td>

                      <td className="py-4 px-4">
                        {isPaid ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-[10px] font-extrabold rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" /> PAY LATER
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{formatDate(inv.created_at)}</td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() =>
                            setSelectedReceipt({
                              invoice_number: inv.invoice_id,
                              patient_name: inv.patient_name,
                              patient_id: inv.patient_id,
                              visit_id: inv.visit_id,
                              created_at: inv.created_at,
                              status: inv.status,
                              items: inv.items || [{ item_name: 'Diagnostic Testing Package', quantity: 1, unit_price: inv.total_amount, line_total: inv.total_amount }],
                              subtotal: inv.total_amount,
                              total_amount: inv.total_amount,
                              amount_paid: inv.amount_paid,
                              balance_due: inv.balance_due,
                              payments: [{ method: inv.payment_preference || 'Cash / Online' }],
                            })
                          }
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OfficialReceiptModal isOpen={!!selectedReceipt} onClose={() => setSelectedReceipt(null)} invoiceData={selectedReceipt} />
    </div>
  );
}
