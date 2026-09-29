import React, { useEffect, useState } from 'react';
import {
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  CheckCircle,
  History,
  TrendingDown,
  X,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const InventoryView: React.FC = () => {
  const { currency, formatMoney } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Adjustment modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'stock_in' | 'stock_out' | 'adjustment'>('stock_in');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      const res = await api.getInventory();
      setData(res);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdjust(item?: any) {
    if (item) {
      setSelectedProduct(item);
    } else if (data?.items?.[0]) {
      setSelectedProduct(data.items[0]);
    }
    setAdjustType('stock_in');
    setAdjustQuantity('');
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.adjustInventory({
        product_id: selectedProduct.product_id,
        type: adjustType,
        quantity: Number(adjustQuantity),
        reason: adjustReason || `Manual inventory ${adjustType.replace('_', ' ')}`,
      });
      setIsAdjustModalOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust inventory');
    }
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading live stock levels and ledger...</p>
      </div>
    );
  }

  const items = data?.items || [];
  const transactions = data?.transactions || [];
  const summary = data?.summary || { total_items: 0, total_units: 0, total_value: 0, low_stock_count: 0 };

  const filteredItems = items.filter((item: any) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = filterLowStock ? item.is_low_stock : true;
    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Inventory Operations & Ledger</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/60">
              Live Stock Control
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Stock intake, stock-out reconciliation, automated ledger logging & minimum safety triggers
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenAdjust()}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Stock In / Out / Adjust</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Tracked SKUs</span>
          <p className="text-2xl font-extrabold text-white mt-1">{summary.total_items}</p>
          <span className="text-[11px] text-blue-400 mt-0.5 block">Active products</span>
        </div>

        <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Physical Units</span>
          <p className="text-2xl font-extrabold text-cyan-300 mt-1">
            {summary.total_units.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">In stock ready for fulfillment</span>
        </div>

        <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Valuation at Cost</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            {formatMoney(summary.total_value)}
          </p>
          <span className="text-[11px] text-emerald-400/90 mt-0.5 block">Asset balance</span>
        </div>

        <div
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
            summary.low_stock_count > 0
              ? 'bg-[#15111b] border-amber-500/40 hover:border-amber-400/70'
              : 'bg-[#0d1424] border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Low Stock Triggered</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300 mt-1">
            {summary.low_stock_count} <span className="text-xs font-normal text-slate-400">items</span>
          </p>
          <span className="text-[11px] text-amber-400/90 mt-0.5 block">
            {filterLowStock ? 'Showing low stock items' : 'Click to filter'}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stock item by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
            filterLowStock
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-[#090d16] text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Low Stock Only ({summary.low_stock_count})</span>
        </button>
      </div>

      {/* Stock Level Table */}
      <div className="bg-[#0d1424] rounded-3xl border border-slate-800/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0f1d] text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-3">Supplier</th>
                <th className="py-3.5 px-3 text-right">Current Stock</th>
                <th className="py-3.5 px-3 text-right">Safety Minimum</th>
                <th className="py-3.5 px-3 text-right">Avg Sales / Day</th>
                <th className="py-3.5 px-3 text-right">Days to Stockout</th>
                <th className="py-3.5 px-4 text-center">Risk Level</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const isLow = item.is_low_stock;
                  return (
                    <tr key={item.product_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            <span className="font-mono text-slate-400 text-[10px]">{item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">{item.supplier_name}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-sm">
                        <span className={isLow ? 'text-amber-400' : 'text-slate-100'}>
                          {item.current_stock}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                        {item.min_stock}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        {item.avg_daily_sales} u/d
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium">
                        {item.stockout_risk === 'critical' ? (
                          <span className="text-rose-400 font-bold">~{item.estimated_stockout_days} days</span>
                        ) : item.stockout_risk === 'high' ? (
                          <span className="text-amber-400 font-bold">~{item.estimated_stockout_days} days</span>
                        ) : (
                          <span className="text-slate-400">~{item.estimated_stockout_days} days</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.stockout_risk === 'critical' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-300 border border-rose-800/50 uppercase tracking-wider">
                            Critical
                          </span>
                        ) : item.stockout_risk === 'high' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-800/50 uppercase tracking-wider">
                            High
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 uppercase tracking-wider">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="px-3 py-1.5 bg-[#090d16] hover:bg-blue-600 hover:text-white border border-slate-700 rounded-xl text-blue-400 font-semibold transition-all"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Transaction History */}
      <div className="bg-[#0d1424] rounded-3xl border border-slate-800/80 shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recent Inventory Ledger & Audit Trail
            </h2>
          </div>
          <span className="text-xs text-slate-500">Automatic logging on sales & adjustments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-center">Prev → New Stock</th>
                <th className="py-3 px-4">Reason / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.slice(0, 15).map((tx: any) => {
                const isOut = tx.quantity < 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(tx.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{tx.product_name}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          tx.type === 'sale'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                            : tx.type === 'stock_in'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                            : tx.type === 'purchase'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={isOut ? 'text-rose-400' : 'text-emerald-400'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 text-[11px]">
                      {tx.previous_stock} → <span className="font-bold text-white">{tx.new_stock}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{tx.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white">Adjust Inventory Stock</h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Product *</label>
                <select
                  value={selectedProduct?.product_id}
                  onChange={e => {
                    const found = items.find((i: any) => i.product_id === e.target.value);
                    if (found) setSelectedProduct(found);
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {items.map((i: any) => (
                    <option key={i.product_id} value={i.product_id}>
                      {i.name} (Current: {i.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Action Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('stock_in')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      adjustType === 'stock_in'
                        ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    + Stock In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('stock_out')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      adjustType === 'stock_out'
                        ? 'bg-rose-950/60 border-rose-500/70 text-rose-300'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    - Stock Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      adjustType === 'adjustment'
                        ? 'bg-blue-950/60 border-blue-500/70 text-blue-300'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Set Count
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {adjustType === 'adjustment' ? 'New Exact Stock Level *' : 'Quantity Units *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder={adjustType === 'adjustment' ? 'e.g. 50' : 'e.g. 20'}
                  value={adjustQuantity}
                  onChange={e => setAdjustQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment, recount, damaged goods write-off"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-blue-600/30"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
