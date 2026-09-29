import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Package,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api.ts';
import { NavItem } from './Layout.tsx';

interface ForecastViewProps {
  onNavigate: (tab: NavItem) => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ onNavigate }) => {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-001'); // Default Rice 5kg
  const [productDetails, setProductDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [forecastDays, setForecastDays] = useState<7 | 14 | 30>(14);

  useEffect(() => {
    loadForecasts(forecastDays);
  }, [forecastDays]);

  useEffect(() => {
    if (selectedProductId) {
      loadProductForecast(selectedProductId, forecastDays);
    }
  }, [selectedProductId, forecastDays]);

  async function loadForecasts(days = forecastDays) {
    try {
      setLoading(true);
      const data = await api.getForecasts(days);
      setForecasts(data);
      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].product_id);
      }
    } catch (err) {
      console.error('Failed to load forecasts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductForecast(id: string, days = forecastDays) {
    try {
      setDetailsLoading(true);
      const details = await api.getProductForecast(id, days);
      setProductDetails(details);
    } catch (err) {
      console.error('Failed to load product forecast:', err);
    } finally {
      setDetailsLoading(false);
    }
  }

  const filteredForecasts = forecasts.filter(f => {
    if (filterRisk === 'all') return true;
    return f.stockout_risk === filterRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Demand Forecasting & Stockout Risk</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/60">
              Predictive Models
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Statistical moving average demand projections with automatic stockout countdown
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {[7,14,30].map(days => <button key={days} onClick={() => setForecastDays(days as 7|14|30)} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${forecastDays===days?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50'}`}>{days}d</button>)}
        </div>
        <button
          onClick={() => onNavigate('recommendations')}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Sparkles className="w-4 h-4 text-cyan-700" />
          <span>Review Reorder Recommendations</span>
        </button>
      </div>

      {/* Selected Product Spotlight (Showcasing User Brief's Exact Example: Rice 5kg) */}
      {productDetails && (
        <div className="bg-white rounded-3xl border border-blue-900/40 p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-800/60">
                  Target Product Spotlight
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    productDetails.forecast?.stockout_risk === 'critical'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                      : productDetails.forecast?.stockout_risk === 'high'
                      ? 'bg-amber-950/60 text-amber-700 border border-amber-800/50'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  }`}
                >
                  Stockout Risk: {productDetails.forecast?.stockout_risk?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                {productDetails.product?.name}{' '}
                <span className="font-mono text-slate-500 text-sm">({productDetails.product?.sku})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary Supplier: <strong className="text-slate-200">{productDetails.supplier?.name}</strong> ({productDetails.supplier?.delivery_time} delivery)
              </p>
            </div>

            <button
              onClick={() => onNavigate('recommendations')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 self-start lg:self-auto transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-700" />
              <span>Generate Procurement Draft</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px] block">Current Stock</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {productDetails.product?.current_stock} <span className="text-xs font-normal text-slate-500">units</span>
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Min Safety Margin: {productDetails.product?.min_stock} units
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px] block">Average Daily Sales</span>
              <p className="text-2xl font-extrabold text-cyan-700 mt-1">
                {productDetails.forecast?.avg_daily_sales}{' '}
                <span className="text-xs font-normal text-slate-500">units / day</span>
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">Moving average weighted</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px] block">Estimated Stockout In</span>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">
                ~{productDetails.forecast?.estimated_stockout_days}{' '}
                <span className="text-xs font-normal text-slate-500">days</span>
              </p>
              <span className="text-[10px] text-amber-400/90 font-semibold block mt-0.5">
                Order buffer urgently needed
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px] block">Recommended Reorder</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {productDetails.forecast?.recommended_reorder_qty}{' '}
                <span className="text-xs font-normal text-slate-500">units</span>
              </p>
              <span className="text-[10px] text-emerald-700/90 font-semibold block mt-0.5">
                Est: ${(((productDetails.forecast?.recommended_reorder_qty || 0) * (productDetails.product?.purchase_price || 0))).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Historical Demand Chart */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              30-Day Historical Sales Velocity
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                <AreaChart data={productDetails.history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={d => d.slice(5)} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1120',
                      borderRadius: '0.75rem',
                      border: '1px solid #1e293b',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any) => [`${val} units sold`, 'Volume']}
                  />
                  <Area type="monotone" dataKey="quantity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Demand Forecast Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-[#0a0f1d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Demand Forecast & Replenishment Matrix
            </h2>
            <p className="text-[11px] text-slate-500">
              Select any product to inspect velocity curve and generate orders
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Risk Filter:</span>
            {['all', 'critical', 'high', 'medium', 'low'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  filterRisk === r
                    ? 'bg-blue-600 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border border-slate-700 text-slate-500 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Avg Daily Sales</th>
                <th className="py-3 px-3 text-right">Est. Stockout Days</th>
                <th className="py-3 px-3 text-center">Stockout Risk</th>
                <th className="py-3 px-3 text-right">Recommended Reorder</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredForecasts.map(fc => {
                const isSelected = fc.product_id === selectedProductId;
                return (
                  <tr
                    key={fc.id}
                    onClick={() => setSelectedProductId(fc.product_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-950/40 border-l-4 border-l-cyan-400'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{fc.product_name}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">{fc.current_stock}</td>
                    <td className="py-3.5 px-3 text-right text-slate-600">{fc.avg_daily_sales} / day</td>
                    <td className="py-3.5 px-3 text-right font-bold">
                      {fc.estimated_stockout_days <= 3 ? (
                        <span className="text-rose-400 font-bold">~{fc.estimated_stockout_days} days</span>
                      ) : fc.estimated_stockout_days <= 7 ? (
                        <span className="text-amber-400 font-bold">~{fc.estimated_stockout_days} days</span>
                      ) : (
                        <span className="text-slate-500">~{fc.estimated_stockout_days} days</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          fc.stockout_risk === 'critical'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                            : fc.stockout_risk === 'high'
                            ? 'bg-amber-950/60 text-amber-700 border border-amber-800/50'
                            : fc.stockout_risk === 'medium'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                        }`}
                      >
                        {fc.stockout_risk}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                      {fc.recommended_reorder_qty > 0 ? `${fc.recommended_reorder_qty} units` : 'Adequate'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedProductId(fc.product_id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-slate-900 hover:bg-blue-600 rounded-xl transition-all"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
