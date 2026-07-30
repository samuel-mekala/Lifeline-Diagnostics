import React from 'react';
import Logo from './Logo';
import { X, Printer, CheckCircle2, IndianRupee, ShieldCheck } from 'lucide-react';

export const OfficialReceiptModal = ({ isOpen, onClose, invoiceData, patientInfo }) => {
  if (!isOpen || !invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const patientName = invoiceData.patient_name || patientInfo?.full_name || 'Patient';
  const patientId = invoiceData.patient_id || patientInfo?.patient_id || 'PAT-001';
  const invoiceNum = invoiceData.invoice_number || invoiceData.id || 'INV-2026-0041';
  const visitId = invoiceData.visit_id || 'VIS-904101';
  const dateStr = invoiceData.created_at ? new Date(invoiceData.created_at).toLocaleString() : '2026-07-28 10:30 AM';
  const paymentStatus = invoiceData.status || 'PAID';
  const items = invoiceData.items || [
    { item_name: 'Ayush-2 Full Body Checkup', item_type: 'PACKAGE', quantity: 1, unit_price: 750, line_total: 750 },
  ];
  const subtotal = invoiceData.subtotal || 750;
  const totalAmount = invoiceData.total_amount || 750;
  const amountPaid = invoiceData.amount_paid || 750;
  const balanceDue = invoiceData.balance_due || 0;
  const paymentMethod = invoiceData.payments?.[0]?.method || 'UPI / Cash';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full my-auto flex flex-col border border-slate-300 max-h-[92vh]">
        {/* Modal Action Header */}
        <div className="bg-slate-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
              OFFICIAL TAX INVOICE
            </span>
            <span className="text-xs text-slate-300 font-mono">Invoice #{invoiceNum}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / Download Receipt
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="overflow-y-auto p-4 sm:p-8 flex-1 bg-slate-200">
          <div className="bg-white mx-auto shadow-xl border border-slate-300 p-6 sm:p-8 rounded-sm text-slate-900 max-w-2xl font-sans printable-receipt">
            {/* Header Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
              <Logo showText={true} textVariant="dark" className="w-12 h-12" />
              <div className="text-right">
                <div className="text-xl font-black text-slate-900 uppercase tracking-tight">TAX INVOICE & RECEIPT</div>
                <div className="text-xs font-mono font-bold text-blue-600 mt-0.5">INV NO: {invoiceNum}</div>
                <div className="text-[10px] text-slate-500">{dateStr}</div>
              </div>
            </div>

            {/* Billed To & Lab Info */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <div className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">BILLED TO (PATIENT):</div>
                <div className="font-bold text-slate-900 text-sm">{patientName}</div>
                <div className="font-mono text-slate-600">Patient ID: <span className="font-bold text-blue-600">{patientId}</span></div>
                <div className="font-mono text-slate-600">Visit Ref: {visitId}</div>
              </div>

              <div className="space-y-1 text-right">
                <div className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">DIAGNOSTIC HUB:</div>
                <div className="font-bold text-slate-900">Life Line Diagnostics</div>
                <div className="text-slate-600 text-[11px]">Puspha Hotel Rd, Vijayawada, AP</div>
                <div className="font-mono text-slate-600 text-[11px]">GSTIN: 37AABCL1092Q1Z8</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-300 rounded-md overflow-hidden mb-6 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-extrabold text-slate-700 uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.item_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{item.item_type}</div>
                      </td>
                      <td className="p-3 text-center font-mono">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">₹{item.unit_price}</td>
                      <td className="p-3 text-right font-mono font-bold">₹{item.line_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="flex justify-end mb-6">
              <div className="w-64 space-y-2 text-xs font-medium border-t border-slate-200 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (0% Diagnostic Exemption):</span>
                  <span className="font-mono text-slate-900">₹0.00</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-300">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-emerald-700">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-mono font-bold text-emerald-600">₹{amountPaid}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Balance Due:</span>
                  <span className="font-mono font-bold text-rose-600">₹{balanceDue}</span>
                </div>
              </div>
            </div>

            {/* Payment Status Stamp */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`font-black text-xs px-3 py-1 rounded border uppercase ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {paymentStatus} ({paymentMethod})
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Verified Payment Ledger</span>
              </div>

              <div className="text-right">
                <div className="font-serif italic font-bold text-slate-800 text-xs">Authorized Signatory</div>
                <div className="text-[10px] text-slate-500 font-mono">Life Line Accounts Dept</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OfficialReceiptModal;
