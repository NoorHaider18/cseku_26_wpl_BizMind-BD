import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  ShieldCheck,
  Receipt,
  CheckCircle,
  Coins,
  Lock,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, updateBusinessProfile, currency } = useAuth();

  const [activeTab, setActiveTab] = useState<'user' | 'business'>('user');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'bg-emerald-600');
  const [newPassword, setNewPassword] = useState('');

  // Business fields
  const [businessName, setBusinessName] = useState(user?.business?.name || 'BizMind BD Enterprise Ltd');
  const [industry, setIndustry] = useState(user?.business?.industry || 'FMCG, Retail & Wholesale Distribution');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.business?.currency || '৳');
  const [location, setLocation] = useState(user?.business?.location || 'Motijheel C/A, Dhaka-1000, Bangladesh');
  const [binNumber, setBinNumber] = useState(user?.business?.bin_number || '002849175-0101');
  const [tradeLicense, setTradeLicense] = useState(user?.business?.trade_license || 'TRAD/DSCC/019284/2026');

  if (!isOpen) return null;

  const avatarOptions = [
    { label: 'Emerald Green', class: 'bg-emerald-600' },
    { label: 'Deep Blue', class: 'bg-blue-600' },
    { label: 'Indigo Purple', class: 'bg-indigo-600' },
    { label: 'Cyan Ocean', class: 'bg-cyan-600' },
    { label: 'Amber Gold', class: 'bg-amber-600' },
  ];

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        job_title: jobTitle.trim(),
        avatar,
        password: newPassword ? newPassword : undefined,
      });
      setSuccessMsg('Your personal profile has been successfully saved!');
      setTimeout(() => setSuccessMsg(null), 3500);
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update personal profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBusiness(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      await updateBusinessProfile({
        name: businessName.trim(),
        industry,
        currency: selectedCurrency,
        location: location.trim(),
        bin_number: binNumber.trim(),
        trade_license: tradeLicense.trim(),
      });
      setSuccessMsg('Enterprise profile and currency settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update enterprise profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0b101d] border border-blue-900/50 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${avatar} text-white flex items-center justify-center font-extrabold text-sm shadow-md`}>
              {user?.name?.slice(0, 2).toUpperCase() || 'BM'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{user?.name || 'Your Profile'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 uppercase">
                  {user?.role}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 border-b border-slate-800 text-xs font-semibold bg-[#080d17]">
          <button
            onClick={() => setActiveTab('user')}
            className={`py-3 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'user'
                ? 'text-emerald-400 bg-emerald-950/20 border-b-2 border-emerald-500 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Profile & Credentials</span>
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`py-3 flex items-center justify-center gap-2 transition-all ${
              activeTab === 'business'
                ? 'text-emerald-400 bg-emerald-950/20 border-b-2 border-emerald-500 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Business & Enterprise Profile</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        <div className="p-4 overflow-y-auto space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <X className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: User Profile Form */}
          {activeTab === 'user' && (
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12]/60 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+880 1711-000000"
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      placeholder="Managing Director & Founder"
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Avatar Color Badge</label>
                  <div className="flex items-center gap-2.5">
                    {avatarOptions.map(opt => (
                      <button
                        key={opt.class}
                        type="button"
                        onClick={() => setAvatar(opt.class)}
                        className={`w-7 h-7 rounded-xl ${opt.class} transition-all ${
                          avatar === opt.class ? 'scale-115 ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0b101d]' : 'opacity-60 hover:opacity-100'
                        }`}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Change Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password (min 6 characters)"
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Business Profile Form */}
          {activeTab === 'business' && (
            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Enterprise / Business Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Sector</label>
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="FMCG, Retail & Wholesale Distribution">FMCG, Retail & Wholesale</option>
                    <option value="Ready-Made Garments (RMG) & Textiles">Garments & Textiles (RMG)</option>
                    <option value="Consumer Electronics & Hardware">Electronics & Gadgets</option>
                    <option value="Pharmaceuticals & Healthcare Products">Pharmaceuticals & Healthcare</option>
                    <option value="Agribusiness & Seed/Fertilizer Supply">Agribusiness & Crops</option>
                    <option value="Food, Beverage & Restaurants">Food & Beverage (F&B)</option>
                    <option value="Building Materials & Manufacturing">Manufacturing & Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Currency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('৳')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        selectedCurrency === '৳'
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                          : 'bg-[#060a12] text-slate-400 border-slate-800'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>৳ BDT (Taka)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('$')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        selectedCurrency === '$'
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                          : 'bg-[#060a12] text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>$ USD (Dollar)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Business BIN Number</label>
                  <div className="relative">
                    <Receipt className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={binNumber}
                      onChange={e => setBinNumber(e.target.value)}
                      placeholder="002849175-0101"
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trade License Number</label>
                  <input
                    type="text"
                    value={tradeLicense}
                    onChange={e => setTradeLicense(e.target.value)}
                    placeholder="TRAD/DSCC/019284/2026"
                    className="w-full px-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Registered Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Motijheel C/A, Dhaka-1000, Bangladesh"
                      className="w-full pl-9 pr-3 py-2 bg-[#060a12] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Updating...' : 'Update Enterprise Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
