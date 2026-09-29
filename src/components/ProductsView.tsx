import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  TrendingUp,
  Truck,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const ProductsView: React.FC = () => {
  const { currency, formatMoney } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: 'cat-001',
    purchase_price: '',
    selling_price: '',
    current_stock: '',
    min_stock: '',
    supplier_id: 'sup-001',
  });

  useEffect(() => {
    loadData();
  }, [search, categoryFilter, lowStockFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [prods, sups] = await Promise.all([
        api.getProducts({
          search: search || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          low_stock: lowStockFilter || undefined,
        }),
        api.getSuppliers(),
      ]);
      setProducts(prods);
      setSuppliers(sups);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      category_id: 'cat-001',
      purchase_price: '',
      selling_price: '',
      current_stock: '50',
      min_stock: '20',
      supplier_id: suppliers[0]?.id || 'sup-001',
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(prod: any) {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category_id: prod.category_id,
      purchase_price: String(prod.purchase_price),
      selling_price: String(prod.selling_price),
      current_stock: String(prod.current_stock),
      min_stock: String(prod.min_stock),
      supplier_id: prod.supplier_id,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate product');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Product Inventory Catalog</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/60">
              {products.length} Items
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Core Master Data: SKU tracking, profit margins, supplier links & safety thresholds
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/25 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0d1424] p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#090d16] border border-slate-800 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="cat-001">Grains & Staples</option>
            <option value="cat-002">Edible Oils & Sauces</option>
            <option value="cat-003">Beverages & Drinks</option>
            <option value="cat-004">Personal & Home Care</option>
            <option value="cat-005">Dairy & Breakfast</option>
            <option value="cat-006">Snacks & Confectionery</option>
          </select>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              lowStockFilter
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#090d16] text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#0d1424] rounded-3xl border border-slate-800/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0f1d] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Product Name</th>
                <th className="py-3.5 px-3 font-semibold">SKU</th>
                <th className="py-3.5 px-3 font-semibold">Category</th>
                <th className="py-3.5 px-3 font-semibold">Supplier</th>
                <th className="py-3.5 px-3 text-right font-semibold">Purchase Price</th>
                <th className="py-3.5 px-3 text-right font-semibold">Selling Price</th>
                <th className="py-3.5 px-3 text-right font-semibold">Margin</th>
                <th className="py-3.5 px-3 text-center font-semibold">Stock / Min</th>
                <th className="py-3.5 px-4 text-center font-semibold">Status</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No products matched your criteria.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const isLow = product.current_stock <= product.min_stock;
                  const marginPct = (
                    ((product.selling_price - product.purchase_price) / product.selling_price) *
                    100
                  ).toFixed(1);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    >
                      <td
                        onClick={() => setSelectedProduct(product)}
                        className="py-3.5 px-4 font-semibold text-slate-100 group-hover:text-blue-400 transition-colors flex items-center gap-2"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{product.name}</span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">{product.sku}</td>
                      <td className="py-3.5 px-3 text-slate-400">{product.category_name}</td>
                      <td className="py-3.5 px-3 text-slate-400">{product.supplier_name}</td>
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        {formatMoney(product.purchase_price)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-white">
                        {formatMoney(product.selling_price)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-emerald-400">
                        {marginPct}%
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium">
                        <span className={isLow ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                          {product.current_stock}
                        </span>{' '}
                        <span className="text-slate-500 text-[11px]">/ {product.min_stock}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-800/50">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
                            <Check className="w-3 h-3 text-emerald-400" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenEdit(product);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(product.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Deactivate Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-blue-900/40 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice 5kg"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GRN-RICE-05"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="cat-001">Grains & Staples</option>
                    <option value="cat-002">Edible Oils & Sauces</option>
                    <option value="cat-003">Beverages & Drinks</option>
                    <option value="cat-004">Personal & Home Care</option>
                    <option value="cat-005">Dairy & Breakfast</option>
                    <option value="cat-006">Snacks & Confectionery</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Purchase Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="18.50"
                    value={formData.purchase_price}
                    onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="24.00"
                    value={formData.selling_price}
                    onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    placeholder="34"
                    value={formData.current_stock}
                    onChange={e => setFormData({ ...formData, current_stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Minimum Safety Stock *</label>
                  <input
                    type="number"
                    required
                    placeholder="40"
                    value={formData.min_stock}
                    onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Primary Supplier *</label>
                <select
                  value={formData.supplier_id}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.delivery_time})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-blue-600/30"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Drawer / Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d1424] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-900/40 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">{selectedProduct.name}</h3>
                <span className="font-mono text-slate-400 text-xs">{selectedProduct.sku}</span>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#090d16] rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[11px]">Current Stock</span>
                  <p className="text-base font-bold text-white">{selectedProduct.current_stock} units</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Minimum Reorder Stock</span>
                  <p className="text-base font-bold text-white">{selectedProduct.min_stock} units</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#090d16] rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[11px]">Unit Cost</span>
                  <p className="text-sm font-semibold text-slate-200">{formatMoney(selectedProduct.purchase_price)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Unit Price</span>
                  <p className="text-sm font-semibold text-emerald-400">{formatMoney(selectedProduct.selling_price)}</p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-950/40 rounded-2xl border border-blue-900/50 text-blue-200">
                <span className="font-semibold block mb-0.5 text-blue-300">Supplier Partner:</span>
                <p>{selectedProduct.supplier_name}</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
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
