import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  ChevronRight,
  X,
  Package,
} from 'lucide-react';
import { api } from '../services/api.ts';

export const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    location: '',
    delivery_time: '2-3 business days',
    reliability: '95',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      setLoading(true);
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createSupplier(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        contact: '',
        email: '',
        location: '',
        delivery_time: '2-3 business days',
        reliability: '95',
      });
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier');
    }
  }

  async function handleViewSupplier(id: string) {
    try {
      const details = await api.getSupplier(id);
      setSelectedSupplier(details);
    } catch (err) {
      alert('Failed to load supplier details');
    }
  }

  const filtered = suppliers.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Suppliers & Vendor Network</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/60">
              {suppliers.length} Vendors
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage distribution channels, lead times, reliability indices, and procurement contracts
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search supplier by name or warehouse location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading supplier directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No suppliers found matching your query.
          </div>
        ) : (
          filtered.map(supplier => (
            <div
              key={supplier.id}
              className="bg-[#0d1424] p-5 rounded-3xl border border-slate-800/80 shadow-md hover:border-blue-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                        {supplier.name}
                      </h3>
                      <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{supplier.location}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {supplier.reliability}% Reliability
                  </span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      Lead Time:
                    </span>
                    <span className="font-medium text-slate-200">{supplier.delivery_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      Contact:
                    </span>
                    <span className="font-medium text-slate-200">{supplier.contact}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                      Orders Email:
                    </span>
                    <span className="font-mono text-[11px] text-blue-400 truncate max-w-[150px]">
                      {supplier.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Tier 1 Logistics Vendor</span>
                <button
                  onClick={() => handleViewSupplier(supplier.id)}
                  className="px-3 py-1.5 bg-[#090d16] hover:bg-blue-600 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold text-cyan-400 flex items-center gap-1 transition-all"
                >
                  <span>Catalog</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white">Add New Supplier</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Supplier / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Food Wholesale Ltd"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 019-2831"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="orders@vendor.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Location / Warehouse</label>
                <input
                  type="text"
                  placeholder="e.g. West Hub Logistics Park, Dock 4"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Delivery Lead Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 2-3 business days"
                    value={formData.delivery_time}
                    onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Reliability Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.reliability}
                    onChange={e => setFormData({ ...formData, reliability: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-blue-600/30"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Products Drawer */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
              <div>
                <h3 className="font-bold text-white text-base">{selectedSupplier.name}</h3>
                <p className="text-slate-400 text-xs">{selectedSupplier.location} · {selectedSupplier.delivery_time}</p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <span className="font-bold text-slate-300 block mb-2 uppercase tracking-wider text-[11px]">
                  Supplied Products ({selectedSupplier.products?.length || 0})
                </span>
                <div className="border border-slate-800 rounded-2xl divide-y divide-slate-800 bg-[#090d16] overflow-hidden">
                  {selectedSupplier.products?.map((p: any) => (
                    <div key={p.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{p.name}</p>
                        <p className="text-slate-500 text-[10px] font-mono">{p.sku}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">${p.purchase_price.toFixed(2)}</span>
                        <p className="text-slate-500 text-[10px]">Stock: {p.current_stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-2 uppercase tracking-wider text-[11px]">
                  Purchase Order History ({selectedSupplier.purchase_orders?.length || 0})
                </span>
                {selectedSupplier.purchase_orders?.length === 0 ? (
                  <p className="text-slate-500 italic p-3 text-center">No past orders with this supplier yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSupplier.purchase_orders?.map((po: any) => (
                      <div key={po.id} className="p-3 bg-[#090d16] rounded-2xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-mono text-blue-400 font-bold block">PO #{po.id.slice(-6)}</span>
                          <span className="text-[10px] text-slate-500">{new Date(po.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">${po.total_estimated_cost.toFixed(2)}</span>
                          <span className="block text-[10px] uppercase font-bold text-cyan-400">{po.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedSupplier(null)}
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
