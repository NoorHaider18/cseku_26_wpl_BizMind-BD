import React, { useState } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  CheckCircle,
  Database,
  Lock,
  User,
  Coins,
  MapPin,
  Receipt,
  Phone,
  Briefcase,
  Save,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface SettingsViewProps {
  onOpenProfile?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenProfile }) => {
  const { user, switchDemoUser, currency, updateBusinessProfile, updateProfile } = useAuth();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Quick edit business
  const [bName, setBName] = useState(user?.business?.name || 'BizMind BD Enterprise Ltd');
  const [bIndustry, setBIndustry] = useState(user?.business?.industry || 'FMCG, Retail & Wholesale Distribution');
  const [bLocation, setBLocation] = useState(user?.business?.location || 'Motijheel C/A, Dhaka-1000, Bangladesh');
  const [bBin, setBBin] = useState(user?.business?.bin_number || '002849175-0101');
  const [bTrade, setBTrade] = useState(user?.business?.trade_license || 'TRAD/DSCC/019284/2026');

  async function handleSaveBusinessQuick(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setFeedbackMsg(null);
      await updateBusinessProfile({
        name: bName.trim(),
        industry: bIndustry,
        location: bLocation.trim(),
        bin_number: bBin.trim(),
        trade_license: bTrade.trim(),
      });
      setFeedbackMsg('Enterprise details updated successfully!');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save enterprise details');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleCurrencyChange(cur: '৳' | '$') {
    try {
      await updateBusinessProfile({ currency: cur });
      setFeedbackMsg(`Primary currency switched to ${cur === '৳' ? 'BDT (৳)' : 'USD ($)'}`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update currency');
    }
  }

  async function handleResetDemo() {
    if (
      confirm(
        'Are you sure you want to reset the database to its pristine demo state? (50 products, 10 suppliers, 6 months sales, low stock alerts)'
      )
    ) {
      try {
        setResetting(true);
        await api.resetDemoData();
        setResetSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        alert(err.message || 'Failed to reset demo data');
      } finally {
        setResetting(false);
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>BizMind BD Workspace & Profile</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            Enterprise Cloud
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Manage your personal user profile, enterprise details, currency configuration, and security credentials
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-xs text-emerald-200 flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-xs text-emerald-200 flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold">Demo database reset successfully! Reloading workspace...</span>
        </div>
      )}

      {/* User Personal Profile Card */}
      <div className="bg-[#0d1424] p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg ${
                user?.avatar || (user?.role === 'owner' ? 'bg-emerald-600' : 'bg-blue-600')
              }`}
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'BM'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{user?.name || 'Mamun Hasan'}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    user?.role === 'owner'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                  }`}
                >
                  {user?.role}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
              {user?.phone && <p className="text-[11px] text-slate-500 mt-0.5">Phone: {user.phone}</p>}
            </div>
          </div>

          <button
            onClick={() => onOpenProfile && onOpenProfile()}
            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Edit Full Profile & Password</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#090d16] rounded-2xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Job Title</span>
            <p className="font-semibold text-slate-200 mt-1">{user?.job_title || 'Managing Director & Founder'}</p>
          </div>
          <div className="p-3 bg-[#090d16] rounded-2xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Tenant ID</span>
            <p className="font-semibold text-slate-200 mt-1 font-mono">{user?.business_id || 'biz-001'}</p>
          </div>
          <div className="p-3 bg-[#090d16] rounded-2xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Access Privileges</span>
            <p className="font-semibold text-emerald-300 mt-1">
              {user?.role === 'owner' ? 'Full Authority (Admin + POs)' : 'Operational & Inventory'}
            </p>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="p-4 bg-[#090d16] rounded-2xl border border-slate-800 text-xs">
          <p className="font-bold text-slate-300 mb-2.5">Switch Active Profile for Testing:</p>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => switchDemoUser('owner')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                user?.role === 'owner'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-[#0d1424] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Mamun Hasan (Founder / Owner)</span>
            </button>
            <button
              onClick={() => switchDemoUser('manager')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                user?.role === 'manager'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-[#0d1424] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-300" />
              <span>Rafiqul Islam (Operations Manager)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enterprise & Business Settings */}
      <div className="bg-[#0d1424] p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{user?.business?.name || 'BizMind BD Enterprise Ltd'}</h2>
              <p className="text-xs text-slate-400">Enterprise Tenant & Tax Configuration</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Active Currency:</span>
            <div className="flex bg-[#090d16] p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => handleCurrencyChange('৳')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === '৳'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ৳ BDT
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyChange('$')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === '$'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveBusinessQuick} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company / Business Name</label>
              <input
                type="text"
                value={bName}
                onChange={e => setBName(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Industry</label>
              <input
                type="text"
                value={bIndustry}
                onChange={e => setBIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Registered Business BIN</label>
              <input
                type="text"
                value={bBin}
                onChange={e => setBBin(e.target.value)}
                placeholder="002849175-0101"
                className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Trade License No.</label>
              <input
                type="text"
                value={bTrade}
                onChange={e => setBTrade(e.target.value)}
                placeholder="TRAD/DSCC/019284/2026"
                className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Corporate Address / Office</label>
              <input
                type="text"
                value={bLocation}
                onChange={e => setBLocation(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-xl text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSettings ? 'Saving...' : 'Save Enterprise Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demo Data Management */}
      <div className="bg-[#0d1424] p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-4">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/50 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Database & Scenario Maintenance</h2>
            <p className="text-xs text-slate-400">Restore or reset pristine 6-month demonstration scenario</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Resetting will restore the verified baseline: 50 realistic products, 10 suppliers, 50+ customers, 6 months of sales history in BDT (৳), and predefined low-stock targets.
        </p>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo Database to Initial State'}</span>
        </button>
      </div>
    </div>
  );
};
