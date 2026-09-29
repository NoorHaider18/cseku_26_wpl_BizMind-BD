import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Receipt,
  User,
  CheckCircle,
  AlertTriangle,
  Trash2,
  X,
  CreditCard,
  Banknote,
  ArrowRight,
  Printer,
  Smartphone,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { InvoiceModal } from './InvoiceModal.tsx';

export const SalesView: React.FC = () => {
  const { user, currency, formatMoney } = useAuth();
  const [salesData, setSalesData] = useState<{ total: number; sales: any[] }>({ total: 0, sales: [] });
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // New Sale Modal State
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [saleNotes, setSaleNotes] = useState('');
  const [cartItems, setCartItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number }>>([]);

  // Selected Sale Details Modal
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  // Success Notification
  const [lastSaleResult, setLastSaleResult] = useState<any | null>(null);

  // Invoice Print Modal State
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceSaleData, setInvoiceSaleData] = useState<any | null>(null);

  useEffect(() => {
    loadSales();
  }, [search, startDate, endDate]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [prods, custs] = await Promise.all([api.getProducts(), api.getCustomers()]);
      setProducts(prods);
      setCustomers(custs);
    } catch (err) {
      console.error('Failed to load products/customers:', err);
    }
  }

  async function loadSales() {
    try {
      setLoading(true);
      const res = await api.getSales({
        search: search || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setSalesData(res);
    } catch (err) {
      console.error('Failed to load sales list:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenNewSale() {
    setCustomerName('Walk-in Customer');
    setCustomerId('');
    setPaymentMethod('Cash');
    setSaleNotes('');
    if (products.length > 0) {
      setCartItems([{ product_id: products[0].id, quantity: 1, unit_price: products[0].selling_price }]);
    } else {
      setCartItems([]);
    }
    setIsAddSaleOpen(true);
  }

  function handleAddLineItem() {
    if (products.length === 0) return;
    setCartItems([...cartItems, { product_id: products[0].id, quantity: 1, unit_price: products[0].selling_price }]);
  }

  function handleUpdateCartItem(index: number, field: string, value: any) {
    const nextCart = [...cartItems];
    const current = nextCart[index];

    if (field === 'product_id') {
      const p = products.find(prod => prod.id === value);
      current.product_id = value;
      if (p) current.unit_price = p.selling_price;
    } else if (field === 'quantity') {
      current.quantity = Math.max(1, Number(value));
    } else if (field === 'unit_price') {
      current.unit_price = Number(value);
    }
    setCartItems(nextCart);
  }

  function handleRemoveLineItem(index: number) {
    setCartItems(cartItems.filter((_, idx) => idx !== index));
  }

  const cartTotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);

  async function handleRecordSaleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Please add at least one line item to the sale.');
      return;
    }

    try {
      const res = await api.createSale({
        customer_name: customerName,
        customer_id: customerId || undefined,
        payment_method: paymentMethod,
        notes: saleNotes,
        items: cartItems,
      });

      setLastSaleResult(res);
      setIsAddSaleOpen(false);
      loadSales();
    } catch (err: any) {
      alert(err.message || 'Failed to record sale');
    }
  }

  async function handleViewSaleDetails(id: string) {
    try {
      const sale = await api.getSale(id);
      setSelectedSale(sale);
    } catch (err: any) {
      alert(err.message || 'Failed to load sale details');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Sales & Revenue Management</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/60">
              {salesData.total} Recorded
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Full transactional loop: Inventory reduction, cost attribution & automated profit recalculation
          </p>
        </div>
        <button
          onClick={handleOpenNewSale}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Sale Notification Alert */}
      {lastSaleResult && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-start justify-between text-xs text-emerald-200">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-white">
                Sale #{lastSaleResult.sale.id.slice(-6)} recorded successfully! Total: {formatMoney(lastSaleResult.sale.total_amount)}
              </p>
              <p className="text-emerald-400/90 mt-0.5">
                Inventory was reduced and stock transactions have been posted to the database.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setInvoiceSaleData(lastSaleResult.sale);
                    setIsInvoiceOpen(true);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Tax Invoice & Cash Memo</span>
                </button>
              </div>
              {lastSaleResult.low_stock_alerts_triggered?.length > 0 && (
                <div className="mt-2 text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Low stock alerts triggered for:{' '}
                    {lastSaleResult.low_stock_alerts_triggered.map((p: any) => p.product).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setLastSaleResult(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or transaction ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-[#090d16] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-slate-100 focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-slate-100 focus:outline-none"
            />
          </div>

          {(startDate || endDate || search) && (
            <button
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-[#0d1424] rounded-3xl border border-slate-800/80 shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Sales Transactions History
          </h2>
          <span className="text-xs text-slate-400">{salesData.total} transactions logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Sale ID</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Revenue</th>
                <th className="py-3 px-3 text-right">Cost (COGS)</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : salesData.sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No sales records found matching your filters.
                  </td>
                </tr>
              ) : (
                salesData.sales.map((sale: any) => {
                  const profit = sale.total_amount - sale.total_cost;
                  const marginPct = ((profit / sale.total_amount) * 100).toFixed(1);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        #{sale.id.slice(-5)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {new Date(sale.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-100">{sale.customer_name}</td>
                      <td className="py-3.5 px-3 text-slate-400">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#090d16] border border-slate-800 text-slate-300">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-white">
                        {formatMoney(sale.total_amount)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400">
                        {formatMoney(sale.total_cost)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-emerald-400">
                        {formatMoney(profit)}{' '}
                        <span className="text-[10px] text-emerald-300/80 font-normal">({marginPct}%)</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setInvoiceSaleData(sale);
                              setIsInvoiceOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:text-white bg-emerald-950/60 hover:bg-emerald-600 border border-emerald-800/60 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            title="Print NBR Tax Invoice"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                          <button
                            onClick={() => handleViewSaleDetails(sale.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:text-white hover:bg-blue-600 rounded-xl transition-all"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal */}
      {isAddSaleOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white">Record New Sale</h2>
                <p className="text-slate-400 text-[11px]">
                  Automatically verifies stock, decreases inventory, and recalculates metrics
                </p>
              </div>
              <button
                onClick={() => setIsAddSaleOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSaleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Customer</label>
                  <select
                    value={customerId}
                    onChange={e => {
                      const id = e.target.value;
                      setCustomerId(id);
                      const c = customers.find(item => item.id === id);
                      if (c) setCustomerName(c.name);
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Cash">Cash (Counter POS)</option>
                    <option value="bKash (MFS)">bKash (MFS Merchant)</option>
                    <option value="Nagad (MFS)">Nagad (MFS Merchant)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer (Wholesale)</option>
                  </select>
                </div>
              </div>

              {/* Items in Cart */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-white text-xs uppercase tracking-wider">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1.5 text-xs bg-[#090d16] hover:bg-slate-800 text-blue-400 border border-slate-700 font-semibold rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-800 rounded-2xl p-3 bg-[#090d16]">
                  {cartItems.map((cartItem, idx) => {
                    const prod = products.find(p => p.id === cartItem.product_id);
                    const isExceeding = prod ? prod.current_stock < cartItem.quantity : false;
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-[#0d1424] rounded-xl border border-slate-800">
                        <div className="flex-1 w-full">
                          <select
                            value={cartItem.product_id}
                            onChange={e => handleUpdateCartItem(idx, 'product_id', e.target.value)}
                            className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-xl text-xs text-slate-100"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.current_stock}) - ${p.selling_price.toFixed(2)}
                              </option>
                            ))}
                          </select>
                          {isExceeding && (
                            <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                              ⚠️ Exceeds stock ({prod?.current_stock} available)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="w-20">
                            <span className="text-[10px] text-slate-500 block">Qty</span>
                            <input
                              type="number"
                              min="1"
                              value={cartItem.quantity}
                              onChange={e => handleUpdateCartItem(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-center text-slate-100"
                            />
                          </div>

                          <div className="w-24">
                            <span className="text-[10px] text-slate-500 block">Unit Price</span>
                            <input
                              type="number"
                              step="0.01"
                              value={cartItem.unit_price}
                              onChange={e => handleUpdateCartItem(idx, 'unit_price', e.target.value)}
                              className="w-full px-2 py-1 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-right text-slate-100"
                            />
                          </div>

                          <div className="w-24 text-right">
                            <span className="text-[10px] text-slate-500 block">Subtotal</span>
                            <span className="font-bold text-emerald-400 text-xs block py-1">
                              ${(cartItem.quantity * cartItem.unit_price).toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                            title="Remove Line Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Transaction Notes</label>
                <input
                  type="text"
                  placeholder="Optional customer reference or invoice note"
                  value={saleNotes}
                  onChange={e => setSaleNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Total & Submit */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-slate-400 text-xs">Total Transaction Amount</span>
                  <p className="text-xl font-bold text-emerald-400 font-mono">{formatMoney(cartTotal)}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddSaleOpen(false)}
                    className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Record Sale</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Details / Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Receipt #{selectedSale.id}</h3>
                <p className="text-slate-400 text-[11px]">
                  {new Date(selectedSale.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#090d16] rounded-2xl border border-slate-800 flex justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] block">Customer</span>
                  <span className="font-semibold text-slate-200">{selectedSale.customer_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">Payment Method</span>
                  <span className="font-semibold text-emerald-400">{selectedSale.payment_method}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1.5">Purchased Items:</span>
                <div className="border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden bg-[#090d16]">
                  {selectedSale.items?.map((it: any) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{it.product_name}</p>
                        <p className="text-slate-500 text-[10px]">
                          {it.quantity} units @ {formatMoney(it.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold text-white font-mono">{formatMoney(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Total</span>
                  <span className="font-bold text-white font-mono">{formatMoney(selectedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Cost Basis</span>
                  <span className="font-mono">{formatMoney(selectedSale.total_cost)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold text-sm">
                  <span>Gross Profit</span>
                  <span className="font-mono">{formatMoney(selectedSale.total_amount - selectedSale.total_cost)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setInvoiceSaleData(selectedSale);
                  setIsInvoiceOpen(true);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print NBR Tax Invoice</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice & Cash Memo Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={invoiceSaleData}
      />
    </div>
  );
};
