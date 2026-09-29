import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bot,
  ChevronRight,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api.ts';
import { NavItem } from './Layout.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardViewProps {
  onNavigate: (tab: NavItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, currency, formatMoney } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load dashboard analytics:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your business overview...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="font-bold text-slate-900 text-lg">Unable to load dashboard</p>
        <p className="text-sm text-slate-500 mt-1">{error || 'Data unavailable'}</p>
        <button
          onClick={loadDashboard}
          className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-slate-900 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-blue-600/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { kpis, charts, alerts, insights } = data;

  return (
    <div className="space-y-6">
      {/* Header with Title and Quick Workflow Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Business overview</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            A clear view of sales, cash, inventory and business signals for {user?.business?.name || 'BizMind BD Enterprise Ltd'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('sales')}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Record Sale & POS</span>
          </button>
          <button
            onClick={() => onNavigate('procurement')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>New PO Draft</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Sales Count */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-sm cursor-pointer transition-all hover:bg-slate-50 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Sales</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {kpis.total_sales_count.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400/90 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Open sales activity</span>
          </p>
        </div>

        {/* Total Revenue */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-cyan-300 shadow-sm cursor-pointer transition-all hover:bg-slate-50 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Revenue</span>
            <div className="p-1.5 bg-cyan-50 text-cyan-400 rounded-lg group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-cyan-700">
            {currency}{kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            COGS: {currency}{(kpis.cogs).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Operating Expenses */}
        <div
          onClick={() => onNavigate('expenses')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-rose-500/50 shadow-sm cursor-pointer transition-all hover:bg-slate-50 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Expenses</span>
            <div className="p-1.5 bg-rose-50 text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            {currency}{kpis.expenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-rose-400/90 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Open expense details</span>
          </p>
        </div>

        {/* Estimated Profit */}
        <div
          onClick={() => onNavigate('analytics')}
          className="bg-white p-4 rounded-2xl border border-emerald-200 hover:border-emerald-300 shadow-sm cursor-pointer transition-all hover:bg-slate-50 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Est. Profit</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {currency}{kpis.estimated_profit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-emerald-400/90 font-medium mt-1">
            Margin: {((kpis.estimated_profit / kpis.revenue) * 100).toFixed(1)}% Net
          </p>
        </div>

        {/* Inventory Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm cursor-pointer transition-all hover:bg-slate-50 group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Inv. Value</span>
            <div className="p-1.5 bg-slate-50/60 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {currency}{kpis.inventory_value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Current inventory across active products
          </p>
        </div>

        {/* Low Stock Products */}
        <div
          onClick={() => onNavigate('inventory')}
          className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all group ${
            kpis.low_stock_count > 0
              ? 'bg-amber-50 border-amber-200 hover:border-amber-400/70'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Low Stock</span>
            <div className="p-1.5 bg-amber-50 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {kpis.low_stock_count} Items
          </div>
          <p className="text-[11px] text-amber-400/90 font-medium mt-1 flex items-center justify-between">
            <span>Requires reorder</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>
      </div>

      {/* AI Automated Insights Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-200">
              <Sparkles className="w-4 h-4 text-cyan-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Business signals
              </h2>
              <p className="text-xs text-slate-500">
                Key changes and operational signals from your business data
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600/50 border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-700" />
            <span>Ask Follow-up</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {insights.map((ins: any) => (
            <div
              key={ins.id}
              className="bg-slate-50 backdrop-blur-xs border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-300 transition-all group"
            >
              <div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-2 ${
                    ins.type === 'critical'
                      ? 'bg-rose-500/20 text-rose-700 border border-rose-500/40'
                      : ins.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-700 border border-amber-200'
                      : ins.type === 'anomaly'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/40'
                  }`}
                >
                  {ins.type}
                </span>
                <h3 className="font-semibold text-xs text-slate-900 leading-snug mb-1">{ins.title}</h3>
                <p className="text-[11px] text-slate-500 leading-normal">{ins.message}</p>
              </div>
              <button
                onClick={() =>
                  onNavigate(
                    ins.route === '/recommendations'
                      ? 'recommendations'
                      : ins.route === '/expenses'
                      ? 'expenses'
                      : 'analytics'
                  )
                }
                className="mt-3 pt-2.5 border-t border-slate-200 text-xs font-medium text-cyan-400 hover:text-cyan-700 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
              >
                <span>{ins.action}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Sales, Cost & Estimated Profit Trend
              </h2>
              <p className="text-xs text-slate-500">
                Revenue, cost and estimated profit over the latest six months
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> COGS
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Est. Profit
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <AreaChart data={charts.sales_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `$${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderRadius: '0.75rem',
                    border: '1px solid #1e293b',
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                <Area type="monotone" dataKey="cogs" stroke="#64748b" strokeWidth={1.5} fillOpacity={0} name="COGS" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" name="Est. Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs Expenses Bar Comparison */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Revenue vs Expenses
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Monthly operational balance comparison
            </p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                <BarChart data={charts.sales_trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={val => `$${val / 1000}k`} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: '#0b1120',
                      borderRadius: '0.75rem',
                      border: '1px solid #1e293b',
                      color: '#f8fafc',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 mt-2">
            <span className="font-semibold text-blue-400">Insight:</span> August & September expenses rose due to fuel charges, moderating profit margin.
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Products & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Selling Products */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Top-Selling Products
              </h2>
              <p className="text-xs text-slate-500">Volume turnover & generated revenue</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-cyan-400 font-semibold hover:text-cyan-700 flex items-center gap-1"
            >
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Product</th>
                  <th className="py-2.5 px-2 font-semibold">SKU</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Units Sold</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {charts.top_products.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">{item.sku}</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-200">
                      {item.unitsSold.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                      ${item.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Alerts & Risk Notifications */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Operational Alerts</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                </h2>
                <p className="text-xs text-slate-500">Stockouts, expense spikes & demand shifts</p>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-cyan-400 font-semibold hover:text-cyan-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  All business systems healthy. No active alerts.
                </div>
              ) : (
                alerts.map((alt: any) => (
                  <div
                    key={alt.id}
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                      alt.severity === 'critical'
                        ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                        : alt.severity === 'warning'
                        ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                        : 'bg-slate-50/30 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {alt.severity === 'critical' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : alt.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 leading-tight">{alt.title}</p>
                      <p className="text-slate-500 mt-0.5 leading-normal">{alt.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need automatic replenishment?</span>
            <button
              onClick={() => onNavigate('recommendations')}
              className="font-semibold text-cyan-400 hover:text-cyan-700 flex items-center gap-1"
            >
              <span>Review AI Purchase Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
