import React from 'react';
import {
  X,
  Printer,
  Building2,
  Receipt,
  Download,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale }) => {
  const { user, currency, formatMoney } = useAuth();

  if (!isOpen || !sale) return null;

  const biz = user?.business || {
    name: 'BizMind BD Enterprise Ltd',
    industry: 'FMCG & Wholesale',
    currency: '৳',
    location: 'Motijheel C/A, Dhaka-1000, Bangladesh',
    bin_number: '002849175-0101',
    trade_license: 'TRAD/DSCC/019284/2026',
    phone: '+880 1711-000000',
    email: 'operations@bizmindbd.com',
  };

  const invoiceNumber = `INV-${sale.id ? String(sale.id).slice(-6).toUpperCase() : '2026-089'}`;
  const saleDate = sale.sale_date || sale.created_at || new Date().toISOString();
  const formattedDate = new Date(saleDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const subtotal = Number(sale.total_amount) || 0;
  const vatRate = 0.05; // 5% standard SME VAT
  const vatAmount = subtotal * vatRate;
  const grandTotal = subtotal + vatAmount;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-[#0b101c] border border-blue-900/60 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="p-4 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-slate-200">
              Tax Invoice & Cash Memo • {invoiceNumber}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              NBR Compliant
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice" className="p-8 bg-white text-slate-900 font-sans print:p-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                  BM
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                    {biz.name}
                  </h1>
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                    BizMind BD Operating Tenant
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-sm leading-relaxed">
                {biz.location || 'Dhaka, Bangladesh'}
                {biz.phone && ` • Tel: ${biz.phone}`}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-600 font-medium">
                {biz.bin_number && <span>BIN: <strong>{biz.bin_number}</strong></span>}
                {biz.trade_license && <span>Trade License: <strong>{biz.trade_license}</strong></span>}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-md">
                TAX INVOICE
              </span>
              <p className="text-sm font-extrabold text-slate-900 mt-2">
                No: {invoiceNumber}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Date: {formattedDate}</p>
              <p className="text-xs text-emerald-700 font-bold mt-1">Payment: {sale.payment_method || 'Cash / MFS'}</p>
            </div>
          </div>

          {/* Customer & Transaction Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Billed To (Customer):</p>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                {sale.customer_name || 'Walk-in Retail Customer'}
              </p>
              <p className="text-slate-600 mt-0.5">
                {sale.customer_phone ? `Phone: ${sale.customer_phone}` : 'Registered Retail Counter Sale'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Processed By:</p>
              <p className="font-bold text-slate-800 text-xs mt-0.5">
                {user?.name || 'Mamun Hasan'} ({user?.role === 'owner' ? 'Owner' : 'Manager'})
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">BizMind BD Terminal #01</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.product_name || `Product #${item.product_id}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatMoney(item.unit_price)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatMoney(item.subtotal || item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">1</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">General Wholesale Order</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatMoney(subtotal)}</td>
                    <td className="py-2.5 px-3 text-center font-bold">1</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatMoney(subtotal)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="flex justify-between items-start pt-2">
            <div className="text-xs text-slate-500 max-w-sm space-y-1">
              <p className="font-semibold text-slate-800">Terms & Conditions:</p>
              <p className="text-[11px] leading-relaxed">
                Goods sold under standard warranty. Valid for tax deduction under National Board of Revenue (NBR) Bangladesh VAT regulations.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-300 w-48 text-center">
                <p className="text-[11px] font-bold text-slate-700">Authorized Signature</p>
                <p className="text-[10px] text-slate-400">BizMind BD Verified</p>
              </div>
            </div>

            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 pb-1.5 border-b border-slate-200">
                <span>Subtotal (Net):</span>
                <span className="font-mono font-semibold text-slate-900">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-1.5 border-b border-slate-200">
                <span>Government VAT (5%):</span>
                <span className="font-mono font-semibold text-slate-900">{formatMoney(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 text-sm font-black pt-1">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-800">{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
