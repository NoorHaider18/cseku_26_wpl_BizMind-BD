import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Package, Truck, RefreshCw, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const AnalyticsView: React.FC = () => {
  const { formatMoney } = useAuth();
  const [profit, setProfit] = useState<any>(null);
  const [sales, setSales] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      const [p, s, i, sp, r] = await Promise.all([
        api.getProfitAnalytics(), api.getSalesAnalytics(), api.getInventoryAnalytics(), api.getSupplierAnalytics(), api.getRisks()
      ]);
      setProfit(p); setSales(s); setInventory(i); setSuppliers(sp || []); setRisks(r?.risks || []);
    } catch (e: any) { setError(e?.message || 'Unable to load analytics.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const monthly = useMemo(() => Object.entries(profit?.monthlyBreakdown || {})
    .map(([month, value]: [string, any]) => ({ month: month.slice(5), ...value }))
    .sort((a, b) => a.month.localeCompare(b.month)), [profit]);
  const topProducts = sales?.topProducts?.topByRevenue || [];
  const supplierData = [...suppliers].sort((a,b) => b.fulfillment_rate - a.fulfillment_rate).slice(0, 8);

  if (loading) return <div className="bm-card p-12 text-center text-sm text-slate-500">Loading business intelligence…</div>;
  if (error) return <div className="bm-card p-8 text-center"><AlertCircle className="mx-auto mb-3 text-rose-500"/><p className="font-semibold text-slate-900">Analytics could not be loaded</p><p className="text-sm text-slate-500 mt-1">{error}</p><button onClick={load} className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"><RefreshCw className="inline w-4 h-4 mr-2"/>Retry</button></div>;

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business intelligence</p><h1 className="text-2xl font-bold text-slate-900 mt-1">Analytics</h1><p className="text-sm text-slate-500 mt-1">Sales, inventory, estimated profit, and supplier performance from recorded business data.</p></div><button onClick={load} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="inline w-4 h-4 mr-2"/>Refresh</button></div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[['Revenue', profit.totalRevenue], ['COGS', profit.totalCostOfGoodsSold], ['Expenses', profit.totalExpenses], ['Estimated profit', profit.estimatedProfit]].map(([label,value]: any) => <div className="bm-card p-5" key={label}><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p><p className="text-xl font-bold text-slate-900 mt-2">{formatMoney(value)}</p>{label==='Estimated profit' && <p className="text-xs text-emerald-600 mt-1">Margin {profit.netProfitMargin}%</p>}</div>)}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <section className="bm-card p-5 xl:col-span-2"><div className="flex items-center gap-2 mb-5"><TrendingUp className="w-4 h-4 text-slate-700"/><div><h2 className="font-semibold text-slate-900">Revenue & profit trend</h2><p className="text-xs text-slate-500">Monthly recorded sales and estimated operating profit</p></div></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={(v:any)=>formatMoney(v)}/><Line type="monotone" dataKey="revenue" strokeWidth={2.5} name="Revenue"/><Line type="monotone" dataKey="profit" strokeWidth={2.5} name="Profit"/></LineChart></ResponsiveContainer></div></section>
      <section className="bm-card p-5"><div className="flex items-center gap-2 mb-5"><Package className="w-4 h-4 text-slate-700"/><div><h2 className="font-semibold text-slate-900">Inventory position</h2><p className="text-xs text-slate-500">Current stock valuation</p></div></div><div className="space-y-4"><div><p className="text-xs text-slate-500">Inventory value</p><p className="text-2xl font-bold text-slate-900">{formatMoney(inventory.totalInventoryValue)}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Products</p><p className="font-bold text-slate-900 mt-1">{inventory.totalProductsCount}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Low stock</p><p className="font-bold text-amber-700 mt-1">{inventory.lowStockCount}</p></div></div></div></section>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="bm-card p-5"><h2 className="font-semibold text-slate-900">Top products by revenue</h2><p className="text-xs text-slate-500 mb-4">Recorded sales contribution by product</p><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts} layout="vertical" margin={{left:10,right:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number"/><YAxis type="category" dataKey="name" width={100} tick={{fontSize:11}}/><Tooltip formatter={(v:any)=>formatMoney(v)}/><Bar dataKey="totalRevenue" name="Revenue" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div></section>
      <section className="bm-card p-5"><div className="flex items-center gap-2 mb-4"><Truck className="w-4 h-4 text-slate-700"/><div><h2 className="font-semibold text-slate-900">Supplier performance</h2><p className="text-xs text-slate-500">Fulfillment based on recorded purchase orders</p></div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100"><th className="py-2">Supplier</th><th>Reliability</th><th>Orders</th><th>Fulfillment</th></tr></thead><tbody>{supplierData.map(s=><tr key={s.supplier_id} className="border-b border-slate-50"><td className="py-3 font-medium text-slate-800">{s.supplier}</td><td>{s.reliability}%</td><td>{s.total_orders}</td><td>{s.fulfillment_rate}%</td></tr>)}</tbody></table>{supplierData.length===0&&<p className="text-sm text-slate-500 py-8 text-center">No supplier performance data yet.</p>}</div></section>
    </div>

    <section className="bm-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Risk signals</h2><p className="text-xs text-slate-500">Signals requiring human review; they do not trigger purchases automatically.</p></div><BarChart3 className="w-4 h-4 text-slate-400"/></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">{risks.slice(0,6).map((r,i)=><div key={i} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-2"><p className="font-semibold text-sm text-slate-900">{r.title}</p><span className="text-[10px] uppercase font-bold text-slate-500">{r.severity}</span></div><p className="text-xs text-slate-500 mt-2">{r.evidence}</p></div>)}{risks.length===0&&<p className="text-sm text-slate-500">No material risk signals detected from available data.</p>}</div></section>

    <p className="text-xs text-slate-400">Profit is an estimated metric calculated as recorded revenue − recorded COGS − recorded operating expenses. Supplier metrics reflect recorded purchase orders and supplier records.</p>
  </div>;
};
