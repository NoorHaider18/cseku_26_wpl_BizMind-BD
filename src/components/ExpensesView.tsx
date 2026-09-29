import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Plus,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  X,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const ExpensesView: React.FC = () => {
  const { currency, formatMoney } = useAuth();
  const [data, setData] = useState<{ summary: any; expenses: any[] }>({
    summary: { totalExpenses: 0, byCategory: {}, byMonth: {}, topExpenseCategories: [] },
    expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  // Form
  const [formData, setFormData] = useState({
    category: 'Rent',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  useEffect(() => {
    loadExpenses();
  }, [categoryFilter]);

  async function loadExpenses() {
    try {
      setLoading(true);
      const res = await api.getExpenses({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingExpense(null);
    setFormData({
      category: 'Rent',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(exp: any) {
    setEditingExpense(exp);
    setFormData({
      category: exp.category,
      amount: String(exp.amount),
      date: exp.date,
      description: exp.description,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, {
          category: formData.category,
          amount: Number(formData.amount),
          date: formData.date,
          description: formData.description,
        });
      } else {
        await api.createExpense({
          category: formData.category,
          amount: Number(formData.amount),
          date: formData.date,
          description: formData.description,
        });
      }
      setIsModalOpen(false);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      loadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  }

  const { summary, expenses } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Operating Expenses Management</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              {formatMoney(summary.totalExpenses)} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track fixed overhead (Rent, Payroll) and variable logistics to preserve net operating margin
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {['Rent', 'Salary', 'Electricity', 'Transportation', 'Marketing', 'Maintenance', 'Other'].map(cat => {
          const amt = summary.byCategory?.[cat] || 0;
          const isSelected = categoryFilter === cat;
          return (
            <div
              key={cat}
              onClick={() => setCategoryFilter(isSelected ? 'all' : cat)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                  : 'bg-[#0d1424] border-slate-800/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                {cat}
              </span>
              <p className="text-sm font-bold text-white mt-1">
                {formatMoney(amt)}
              </p>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, summary.totalExpenses ? (amt / summary.totalExpenses) * 100 * 3 : 0)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expenses Table */}
      <div className="bg-[#0d1424] rounded-3xl border border-slate-800/80 shadow-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Expense Ledger & Disbursements
            </h2>
            <span className="text-xs text-slate-400">({expenses.length} records)</span>
          </div>
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Reset filter ({categoryFilter})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{exp.date}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          exp.category === 'Transportation'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                            : exp.category === 'Rent'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                            : exp.category === 'Salary'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                            : 'bg-slate-800/60 text-slate-300 border border-slate-700/50'
                        }`}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-200">{exp.description}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-white">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white">
                {editingExpense ? 'Edit Expense' : 'Record Operating Expense'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salary</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1250.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly commercial warehouse lease"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
