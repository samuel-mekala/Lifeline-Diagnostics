import React, { useState, useEffect } from 'react';
import portalAPI from '../../../services/portalAPI';
import OfficialReceiptModal from '../../../components/common/OfficialReceiptModal';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import { useAuth } from '../../../providers/AuthProvider';

import {
  CreditCard,
  CheckCircle2,
  Clock,
  Receipt,
  Printer,
  Search,
  QrCode,
  X,
  Download,
} from 'lucide-react';

export const MyInvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // For Itemized Receipt Modal
  const [payingInvoice, setPayingInvoice] = useState(null); // For Pay Modal
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  const refreshInvoices = async () => {
    try {
      const data = await portalAPI.getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Invoices load error:', e);
    }
  };

  useEffect(() => {
    if (user) refreshInvoices();
  }, [user]);

  const handlePayInvoice = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;
    try {
      const invId = payingInvoice.invoice_id || payingInvoice.invoice_number;
      const res = await portalAPI.payInvoice(invId, paymentMethod);
      setPaymentSuccessMsg(res.message || `Payment of ₹${payingInvoice.total_amount} confirmed successfully via ${paymentMethod}!`);
      setPayingInvoice(null);
      await refreshInvoices();
      setTimeout(() => setPaymentSuccessMsg(''), 6000);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
    }
  };


  const filteredInvoices = invoices.filter((i) =>
    (i.invoice_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.visit_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const patientId = user?.patient_id || invoices[0]?.patient_id || 'PAT000002';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Invoices & Bills</h1>
            <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
              ID: {patientId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            View billing history, download tax invoices & official receipts, and settle balances online.
          </p>
        </div>

        <div className="w-64">
          <InteractiveSearchBar
            placeholder="Search invoice or visit..."
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={[
              'INV-2026-001',
              'VISIT-1001',
              'PAID',
              'UNPAID',
            ]}
            resultCount={filteredInvoices.length}
          />
        </div>
      </div>

      {paymentSuccessMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold text-emerald-800">{paymentSuccessMsg}</p>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice # & Visit</th>
                <th className="py-3.5 px-4">Issued Date</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Amount Paid</th>
                <th className="py-3.5 px-4">Balance Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID' || inv.balance_due === 0;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.invoice_number}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Visit: {inv.visit_id} • Patient ID: {inv.patient_id || patientId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ₹{inv.total_amount}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                      ₹{inv.amount_paid}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{inv.balance_due}
                    </td>
                    <td className="py-3.5 px-4">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> UNPAID
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-blue-200 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Download / Print Bill
                        </button>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => setPayingInvoice(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay ₹{inv.balance_due}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                    No billing records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Tax Invoice & Receipt Modal */}
      <OfficialReceiptModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoiceData={selectedInvoice}
        patientInfo={user}
      />

      {/* Pay Invoice Checkout Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Settle Invoice #{payingInvoice.invoice_number}</h3>
                <p className="text-[10px] text-slate-400">Total Payable: ₹{payingInvoice.balance_due}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Online Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    UPI / GooglePay
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Debit / Credit Card
                  </button>
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
                  <QrCode className="w-16 h-16 mx-auto text-slate-800" />
                  <p className="text-[11px] font-bold text-slate-700">Simulated Instant UPI Payment</p>
                  <p className="text-[10px] text-slate-400">UPI ID: lifeline.diagnostics@icici</p>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    readOnly
                    value="4111 •••• •••• 8821"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment of ₹{payingInvoice.balance_due}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvoicesPage;
