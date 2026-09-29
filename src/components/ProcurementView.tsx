import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  Truck,
  Check,
  Package,
  X,
  ChevronRight,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';

export const ProcurementView: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create PO Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number }>>([]);

  // Details Modal
  const [selectedPO, setSelectedPO] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [pos, sups, prods] = await Promise.all([
        api.getPurchaseOrders(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(sups[0].id);
      }
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    if (suppliers.length === 0) return;
    const supId = suppliers[0].id;
    setSelectedSupplierId(supId);
    setPoNotes('');
    const supProds = products.filter(p => p.supplier_id === supId);
    if (supProds.length > 0) {
      setPoItems([{ product_id: supProds[0].id, quantity: 50, unit_price: supProds[0].purchase_price }]);
    } else {
      setPoItems([]);
    }
    setIsCreateOpen(true);
  }

  function handleSupplierChange(supId: string) {
    setSelectedSupplierId(supId);
    const supProds = products.filter(p => p.supplier_id === supId);
    if (supProds.length > 0) {
      setPoItems([{ product_id: supProds[0].id, quantity: 50, unit_price: supProds[0].purchase_price }]);
    } else {
      setPoItems([]);
    }
  }

  function handleAddLineItem() {
    const available = products.filter(p => p.supplier_id === selectedSupplierId);
    if (available.length === 0) return;
    setPoItems([...poItems, { product_id: available[0].id, quantity: 20, unit_price: available[0].purchase_price }]);
  }

  function handleUpdateLineItem(index: number, field: string, value: any) {
    const next = [...poItems];
    const item = next[index];
    if (field === 'product_id') {
      const p = products.find(prod => prod.id === value);
      item.product_id = value;
      if (p) item.unit_price = p.purchase_price;
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, Number(value));
    } else if (field === 'unit_price') {
      item.unit_price = Math.max(0, Number(value));
    }
    setPoItems(next);
  }

  function handleRemoveLineItem(index: number) {
    setPoItems(poItems.filter((_, i) => i !== index));
  }

  const totalCost = poItems.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

  async function handleCreatePOSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please select at least one item to purchase.');
      return;
    }

    try {
      await api.createPurchaseOrder({
        supplier_id: selectedSupplierId,
        items: poItems,
        notes: poNotes,
        status: 'draft',
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase order');
    }
  }

  async function handleUpdateStatus(id: string, newStatus: string) {
    try {
      await api.updatePurchaseOrderStatus(id, newStatus);
      loadData();
      if (selectedPO && selectedPO.id === id) {
        setSelectedPO({ ...selectedPO, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Procurement & Purchase Orders</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/60">
              {purchaseOrders.length} Orders
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            5-Stage Lifecycle: Draft → Pending Approval → Approved → Ordered → Delivered (Restocks Inventory)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* 4 Pipeline Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Drafts & Proposals</span>
          <p className="text-2xl font-extrabold text-white mt-1">
            {purchaseOrders.filter(p => p.status === 'draft').length}
          </p>
          <span className="text-[11px] text-blue-400 mt-0.5 block">Waiting for review</span>
        </div>

        <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Approved Orders</span>
          <p className="text-2xl font-extrabold text-cyan-300 mt-1">
            {purchaseOrders.filter(p => p.status === 'approved').length}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ready to send to supplier</span>
        </div>

        <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">In Transit (Ordered)</span>
          <p className="text-2xl font-extrabold text-purple-300 mt-1">
            {purchaseOrders.filter(p => p.status === 'ordered').length}
          </p>
          <span className="text-[11px] text-purple-400/90 mt-0.5 block">Expected at warehouse</span>
        </div>

        <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Delivered & Restocked</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            {purchaseOrders.filter(p => p.status === 'delivered').length}
          </p>
          <span className="text-[11px] text-emerald-400/90 mt-0.5 block">Stock credited to inventory</span>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-[#0d1424] rounded-3xl border border-slate-800/80 shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Purchase Orders Ledger
          </h2>
          <span className="text-xs text-slate-400">Chronological history</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3 text-center">Items Count</th>
                <th className="py-3 px-3 text-right">Estimated Cost</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Pipeline Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading procurement orders...
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No purchase orders found. Click "Create Purchase Order" above.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po: any) => {
                  return (
                    <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        #{po.id}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {new Date(po.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-100">{po.supplier_name}</td>
                      <td className="py-3.5 px-3 text-center text-slate-300">
                        {po.item_count || po.items?.length || 1} items
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-white">
                        ${po.total_estimated_cost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            po.status === 'delivered'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                              : po.status === 'approved'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                              : po.status === 'ordered'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                              : po.status === 'pending_approval'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                          }`}
                        >
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPO(po)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                          >
                            Details
                          </button>
                          {(po.status === 'draft' || po.status === 'pending_approval') && (
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'approved')}
                              className="px-3 py-1 text-xs font-semibold bg-blue-950/60 text-blue-300 hover:bg-blue-900/60 rounded-xl border border-blue-800/50 transition-all"
                            >
                              Approve
                            </button>
                          )}
                          {po.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'ordered')}
                              className="px-3 py-1 text-xs font-semibold bg-purple-950/60 text-purple-300 hover:bg-purple-900/60 rounded-xl border border-purple-800/50 transition-all"
                            >
                              Mark Ordered
                            </button>
                          )}
                          {po.status === 'ordered' && (
                            <button
                              onClick={() => handleUpdateStatus(po.id, 'delivered')}
                              className="px-3 py-1 text-xs font-semibold bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 rounded-xl border border-emerald-800/50 flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3 h-3" />
                              <span>Receive Stock</span>
                            </button>
                          )}
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

      {/* Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white">Create Purchase Order</h2>
                <p className="text-slate-400 text-[11px]">Select supplier partner and items to order</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => handleSupplierChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.delivery_time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-300">Ordered Products</label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1.5 bg-[#090d16] hover:bg-slate-800 text-blue-400 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-800 rounded-2xl p-3 bg-[#090d16]">
                  {poItems.map((item, idx) => {
                    const supProds = products.filter(p => p.supplier_id === selectedSupplierId);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2.5 bg-[#0d1424] rounded-xl border border-slate-800">
                        <select
                          value={item.product_id}
                          onChange={e => handleUpdateLineItem(idx, 'product_id', e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-slate-100"
                        >
                          {supProds.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.purchase_price.toFixed(2)})
                            </option>
                          ))}
                        </select>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateLineItem(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-center text-slate-100"
                            placeholder="Qty"
                          />
                        </div>

                        <div className="w-24 text-right font-bold text-white">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Rush delivery requested for low stock replenishment"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-slate-400 text-xs">Total Estimated Cost</span>
                  <p className="text-xl font-bold text-emerald-400">${totalCost.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-blue-600/30"
                  >
                    Create PO
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Details Drawer */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Purchase Order #{selectedPO.id}</h3>
                <p className="text-slate-400 text-[11px]">{selectedPO.supplier_name}</p>
              </div>
              <button onClick={() => setSelectedPO(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 bg-[#090d16] rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Status</span>
                  <span className="font-bold text-blue-400 uppercase">{selectedPO.status}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Cost</span>
                  <span className="font-bold text-white text-base">${selectedPO.total_estimated_cost.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1.5">Line Items:</span>
                <div className="border border-slate-800 rounded-2xl divide-y divide-slate-800 bg-[#090d16] overflow-hidden">
                  {selectedPO.items?.map((it: any) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{it.product_name}</p>
                        <p className="text-slate-500 text-[10px]">{it.quantity} units @ ${it.unit_price.toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-white">${it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
