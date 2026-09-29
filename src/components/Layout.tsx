import React, { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Layers, Truck, FileText, DollarSign,
  TrendingUp, BarChart3, Bell, Sparkles, Bot, Settings, Menu, X, LogOut,
  Search, User, ChevronDown, ShieldCheck, UserCheck, Command, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type NavItem = 'dashboard'|'sales'|'products'|'inventory'|'customers'|'suppliers'|'procurement'|'expenses'|'analytics'|'forecast'|'alerts'|'recommendations'|'ai-assistant'|'admin'|'settings';
interface LayoutProps { currentTab: NavItem; onSelectTab: (tab: NavItem)=>void; children: React.ReactNode; activeAlertCount?: number; onOpenProfile?: ()=>void; }

const navGroups = [
  { title: 'Workspace', items: [{id:'dashboard',label:'Overview',icon:LayoutDashboard}] },
  { title: 'Operations', items: [
    {id:'sales',label:'Sales',icon:ShoppingCart},{id:'products',label:'Products',icon:Package},{id:'inventory',label:'Inventory',icon:Layers},{id:'customers',label:'Customers',icon:UserCheck},{id:'suppliers',label:'Suppliers',icon:Truck},{id:'procurement',label:'Purchasing',icon:FileText},{id:'expenses',label:'Expenses',icon:DollarSign}
  ]},
  { title: 'Insights', items: [
    {id:'analytics',label:'Analytics',icon:BarChart3},{id:'forecast',label:'Demand forecast',icon:TrendingUp},{id:'alerts',label:'Alerts',icon:Bell},{id:'recommendations',label:'Recommendations',icon:Sparkles},{id:'ai-assistant',label:'BizMind AI',icon:Bot}
  ]},
  { title: 'Administration', items: [{id:'admin',label:'Employees & audit',icon:ShieldCheck}]}
] as const;

export const Layout: React.FC<LayoutProps> = ({currentTab,onSelectTab,children,activeAlertCount=0,onOpenProfile}) => {
  const { user, logout } = useAuth();
  const [mobileOpen,setMobileOpen]=useState(false); const [accountOpen,setAccountOpen]=useState(false);
  const [commandOpen,setCommandOpen]=useState(false);

  const go=(id:NavItem)=>{onSelectTab(id);setMobileOpen(false);setCommandOpen(false);};
  const navButton=(item:any)=>{
    const active=currentTab===item.id; const Icon=item.icon; const badge=item.id==='alerts'&&activeAlertCount?activeAlertCount:null;
    return <button key={item.id} onClick={()=>go(item.id)} className={`group w-full flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${active?'bg-slate-900 text-white shadow-sm':'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
      <span className="flex items-center gap-3"><Icon className={`h-[17px] w-[17px] ${active?'text-white':'text-slate-500 group-hover:text-slate-700'}`}/>{item.label}</span>
      {badge?<span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center">{badge}</span>:null}
    </button>;
  };

  return <div className="bm-shell min-h-screen flex">
    <aside className={`fixed inset-y-0 left-0 z-50 w-[248px] bg-white border-r border-slate-200 flex flex-col transition-transform md:translate-x-0 ${mobileOpen?'translate-x-0':'-translate-x-full'}`}>
      <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm tracking-tight">BM</div>
        <div className="min-w-0"><div className="font-extrabold text-[15px] text-slate-900">BizMind <span className="text-emerald-600">BD</span></div><div className="text-[10px] text-slate-500 truncate">Business workspace</div></div>
      </div>
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        {navGroups.map((group,i)=><div key={group.title} className={i?'mt-6':''}><div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">{group.title}</div><div className="space-y-1">{group.items.map(navButton)}</div></div>)}
      </div>
      <div className="p-3 border-t border-slate-200 space-y-1">
        <button onClick={()=>go('settings')} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-100"><Settings className="w-[17px] h-[17px] text-slate-500"/>Settings</button>
        <button onClick={onOpenProfile} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-100"><User className="w-[17px] h-[17px] text-slate-500"/>My profile</button>
      </div>
    </aside>
    {mobileOpen&&<button aria-label="Close navigation" onClick={()=>setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"/>}

    <div className="w-full md:pl-[248px] min-w-0">
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={()=>setMobileOpen(true)}><Menu className="w-5 h-5 text-slate-600"/></button>
          <div className="hidden sm:block min-w-0"><div className="text-sm font-semibold text-slate-900 truncate">{user?.business?.name||'My business'}</div><div className="text-[11px] text-slate-500">{user?.business?.industry||'Business management'}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setCommandOpen(true)} className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-500 hover:border-slate-300"><Search className="w-3.5 h-3.5"/>Search<span className="ml-3 text-[10px] border border-slate-200 rounded px-1.5 py-0.5">⌘K</span></button>
          <button onClick={()=>go('ai-assistant')} className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"><Bot className="w-3.5 h-3.5"/>Ask BizMind</button>
          <button onClick={()=>go('alerts')} className="relative p-2 rounded-lg hover:bg-slate-100"><Bell className="w-[18px] h-[18px] text-slate-600"/>{activeAlertCount>0&&<span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">{activeAlertCount}</span>}</button>
          <div className="relative">
            <button onClick={()=>setAccountOpen(v=>!v)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100"><div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">{user?.name?.slice(0,1)||'U'}</div><ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block"/></button>
            {accountOpen&&<div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100"><div className="text-sm font-semibold text-slate-900">{user?.name}</div><div className="text-xs text-slate-500 truncate">{user?.email}</div><div className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 rounded px-2 py-1">{user?.role}</div></div>
              <button onClick={()=>{onOpenProfile?.();setAccountOpen(false)}} className="w-full text-left flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-xs text-slate-700 hover:bg-slate-50"><User className="w-4 h-4"/>Profile & business</button>
              <button onClick={()=>{go('settings');setAccountOpen(false)}} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50"><Settings className="w-4 h-4"/>Settings</button>
              <button onClick={()=>{logout();setAccountOpen(false)}} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50"><LogOut className="w-4 h-4"/>Sign out</button>
            </div>}
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8"><div className="max-w-[1400px] mx-auto">{children}</div></main>
    </div>

    {commandOpen&&<div className="fixed inset-0 z-[60] bg-slate-950/25 backdrop-blur-sm p-4 sm:p-10" onClick={()=>setCommandOpen(false)}>
      <div className="max-w-xl mx-auto mt-10 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3"><Command className="w-4 h-4 text-slate-400"/><input autoFocus placeholder="Search a module…" className="flex-1 outline-none text-sm text-slate-900" onChange={()=>{}}/><button onClick={()=>setCommandOpen(false)}><X className="w-4 h-4 text-slate-400"/></button></div>
        <div className="p-2">{navGroups.flatMap(g=>g.items).map((item:any)=><button key={item.id} onClick={()=>go(item.id)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"><item.icon className="w-4 h-4 text-slate-500"/>{item.label}</button>)}</div>
      </div>
    </div>}
  </div>;
};
