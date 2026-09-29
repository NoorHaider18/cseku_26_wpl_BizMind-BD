import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { NavItem } from './Layout.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface RecommendationsViewProps {
  onNavigate: (tab: NavItem) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({ onNavigate }) => {
  const { formatMoney } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Review Details Modal
  const [reviewingRec, setReviewingRec] = useState<any | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      setLoading(true);
      const data = await api.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const res = await api.approveRecommendation(id);
      setActionSuccess(
        `Recommendation approved! Purchase Order Draft #${res.purchase_order.id} automatically created for ${res.purchase_order.items[0]?.quantity} units (${formatMoney(res.purchase_order.total_estimated_cost)}).`
      );
      setReviewingRec(null);
      loadRecommendations();
    } catch (err: any) {
      alert(err.message || 'Failed to approve recommendation');
    }
  }

  async function handleReject(id: string) {
    try {
      await api.rejectRecommendation(id);
      setActionSuccess('Recommendation rejected.');
      setReviewingRec(null);
      loadRecommendations();
    } catch (err: any) {
      alert(err.message || 'Failed to reject recommendation');
    }
  }

  const pending = recommendations.filter(r => r.status === 'pending');
  const past = recommendations.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>AI Actionable Recommendations</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                Human-In-The-Loop Approval
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Turn business intelligence into direct replenishment decisions. Approving generates a formal Purchase Order Draft.
          </p>
        </div>
        <button
          onClick={() => onNavigate('procurement')}
          className="px-4 py-2 bg-[#0d1424] hover:bg-[#121c32] border border-blue-900/40 text-blue-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>View All Purchase Orders</span>
        </button>
      </div>

      {/* Workflow Explainer Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-[#0d1830] to-[#091122] p-4 rounded-3xl border border-blue-800/50 text-xs text-slate-300 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Standard Human-Approval Workflow</p>
            <p className="text-slate-400 mt-0.5">
              Current Inventory → Historical Sales → Demand Forecast → Stockout Risk → Supplier Price → <strong className="text-cyan-300">AI Recommendation</strong> → <strong className="text-emerald-400">Human Approval</strong> → <strong className="text-blue-300">PO Draft</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('procurement')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              Open Procurement
            </button>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold ml-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Pending Recommendations Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Pending Decisions Awaiting Your Review</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
            {pending.length}
          </span>
        </h2>

        {pending.length === 0 ? (
          <div className="bg-[#0d1424] p-10 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            All current AI replenishment recommendations have been reviewed and acted upon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map(rec => (
              <div
                key={rec.id}
                className="bg-[#0d1424] rounded-3xl border border-slate-800/80 p-5 shadow-lg hover:border-cyan-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50">
                      Replenishment Proposal
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      Est. Total: {formatMoney(rec.estimated_cost || 0)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                    {rec.title}
                  </h3>

                  <div className="p-3.5 bg-[#090d16] rounded-2xl border border-slate-800 text-xs space-y-1.5 my-3">
                    <p className="font-semibold text-slate-200">Verified Evidence:</p>
                    <p className="text-slate-400 font-mono text-[11px] leading-relaxed">{rec.evidence}</p>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-normal mb-3">
                    <strong className="text-cyan-300">Suggested Action:</strong> {rec.suggested_action}
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2.5 border-t border-slate-800">
                    <span>Vendor: <strong className="text-slate-200">{rec.supplier_name}</strong></span>
                    <span>Quantity: <strong className="text-cyan-300">{rec.suggested_quantity} units</strong></span>
                  </div>
                </div>

                {/* Action Buttons: [Review] [Approve] [Reject] */}
                <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setReviewingRec(rec)}
                    className="px-3.5 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    Review
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(rec.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/50 rounded-xl border border-rose-800/50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(rec.id)}
                      className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Create PO</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed / Past Recommendations */}
      {past.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resolved Recommendations History
          </h2>
          <div className="bg-[#0d1424] rounded-3xl border border-slate-800 shadow-md divide-y divide-slate-800 overflow-hidden text-xs">
            {past.map(rec => (
              <div key={rec.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        rec.status === 'approved'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rec.status}
                    </span>
                    <h3 className="font-semibold text-slate-200">{rec.title}</h3>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {rec.suggested_action}
                  </p>
                </div>

                {rec.purchase_order_id && (
                  <button
                    onClick={() => onNavigate('procurement')}
                    className="text-xs text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1 shrink-0 ml-3"
                  >
                    <span>PO #{rec.purchase_order_id}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Recommendation Details Modal */}
      {reviewingRec && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0d1424] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-blue-900/40 text-xs text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">{reviewingRec.title}</h3>
                <p className="text-slate-400 text-[11px]">Proposed by SME Demand Forecast & Stockout Engine</p>
              </div>
              <button onClick={() => setReviewingRec(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="p-3.5 bg-[#090d16] rounded-2xl border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-300 block">Analytical Evidence & Forecast:</span>
                <p className="text-slate-400 font-mono text-[11px] leading-relaxed">{reviewingRec.evidence}</p>
              </div>

              <div className="p-3.5 bg-blue-950/40 rounded-2xl border border-blue-900/50 space-y-1 text-blue-200">
                <span className="font-semibold text-blue-300 block">Replenishment Action:</span>
                <p>{reviewingRec.suggested_action}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#090d16] rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">Vendor</span>
                  <span className="font-bold text-slate-200">{reviewingRec.supplier_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Order Quantity</span>
                  <span className="font-bold text-cyan-300">{reviewingRec.suggested_quantity} units</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Estimated Cost</span>
                  <span className="font-bold text-emerald-400">{formatMoney(reviewingRec.estimated_cost || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Order Status Upon Approval</span>
                  <span className="font-bold text-blue-400">PO Draft Created</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setReviewingRec(null)}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleReject(reviewingRec.id)}
                className="px-4 py-2 text-rose-400 hover:bg-rose-950/50 rounded-xl border border-rose-800/50 font-semibold"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(reviewingRec.id)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Approve Recommendation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
