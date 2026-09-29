import React, { useEffect, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Package,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { NavItem } from './Layout.tsx';

interface AlertsViewProps {
  onNavigate: (tab: NavItem) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [risks, setRisks] = useState<any[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      setLoading(true);
      const [data, riskData] = await Promise.all([api.getAlerts(), api.getRisks()]);
      setAlerts(data);
      setRisks(riskData.risks || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string) {
    try {
      await api.resolveAlert(id);
      loadAlerts();
    } catch (err) {
      alert('Failed to resolve alert');
    }
  }

  const filtered = alerts.filter(a => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>System Alerts & Anomaly Monitor</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/60">
              Active Triggers
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated event triggers detecting inventory depletion risks, margin contractions, and expense shifts
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Filter Severity:</span>
          {['all', 'critical', 'warning', 'info'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider capitalize transition-all ${
                filterSeverity === s
                  ? 'bg-blue-600 text-slate-900 shadow-xs'
                  : 'bg-slate-50 border border-slate-700 text-slate-500 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bm-card p-5"><div className="flex items-center justify-between mb-4"><div><h2 className="font-semibold text-slate-900">Business risk signals</h2><p className="text-xs text-slate-500 mt-1">Evidence-based signals from recent sales, expenses, inventory and forecasts.</p></div><span className="text-xs font-semibold text-slate-500">{risks.length} detected</span></div>{risks.length===0?<div className="text-sm text-slate-500">No material risk signal detected from the available data.</div>:<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{risks.slice(0,8).map((r:any,i:number)=><div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50"><div className="flex justify-between gap-3"><div><div className="font-semibold text-sm text-slate-900">{r.title}</div><div className="text-xs text-slate-600 mt-1">{r.evidence}</div></div><span className="text-[10px] uppercase font-bold text-slate-500">{r.severity}</span></div><div className="text-xs text-slate-500 mt-2">Suggested investigation: {r.recommended_action}</div></div>)}</div>}</div>

      {/* Alerts List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900 text-sm">No Active Alerts</p>
            <p className="text-xs text-slate-500 mt-1">All business operations are performing within standard thresholds.</p>
          </div>
        ) : (
          filtered.map(alert => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-3xl border transition-all ${
                  alert.is_resolved
                    ? 'bg-slate-50/60 border-slate-200 opacity-50'
                    : isCritical
                    ? 'bg-[#150d14] border-rose-900/60 shadow-lg shadow-rose-950/20'
                    : isWarning
                    ? 'bg-[#15120e] border-amber-900/60 shadow-lg shadow-amber-950/20'
                    : 'bg-white border-blue-900/40 shadow-lg shadow-blue-950/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                        isCritical
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                          : isWarning
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : 'bg-blue-950/80 text-blue-400 border border-blue-800/60'
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                              : isWarning
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                          }`}
                        >
                          {alert.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(alert.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {alert.is_resolved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Resolved
                          </span>
                        )}
                      </div>

                      <h2 className="text-sm font-bold text-slate-900 mt-1.5">{alert.title}</h2>
                      <p className="text-xs text-slate-500 mt-1 leading-normal max-w-3xl">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {alert.type === 'low_stock' && (
                      <button
                        onClick={() => onNavigate('recommendations')}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
                      >
                        Review Reorder
                      </button>
                    )}
                    {alert.type === 'expense_anomaly' && (
                      <button
                        onClick={() => onNavigate('expenses')}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-900 rounded-xl text-xs font-semibold shadow-md shadow-purple-600/30 transition-all"
                      >
                        Inspect Expenses
                      </button>
                    )}
                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-800 border border-slate-700 text-slate-600 rounded-xl text-xs font-semibold transition-all"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
