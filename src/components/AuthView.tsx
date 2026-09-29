import React, { useState } from 'react';
import { Building2, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth, RegisterPayload } from '../context/AuthContext.tsx';

interface AuthViewProps { onSuccess?: () => void; }

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login, register, switchDemoUser } = useAuth();
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [showPassword,setShowPassword]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null);
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [name,setName]=useState(''); const [confirm,setConfirm]=useState(''); const [phone,setPhone]=useState('');
  const [business,setBusiness]=useState(''); const [industry,setIndustry]=useState('Retail & Wholesale'); const [location,setLocation]=useState('Bangladesh');

  async function submit(e:React.FormEvent){ e.preventDefault(); setError(null); try{
    setLoading(true);
    if(mode==='login') { if(!email||!password) throw new Error('Enter your email and password.'); await login(email.trim(),password); }
    else {
      if(!name.trim()||!email.trim()||!password) throw new Error('Name, email and password are required.');
      if(password.length<8) throw new Error('Use a password with at least 8 characters.');
      if(password!==confirm) throw new Error('Passwords do not match.');
      const payload:RegisterPayload={name:name.trim(),email:email.trim(),password,role:'owner',phone:phone.trim(),avatar:'bg-slate-900',job_title:'Owner',business_name:business.trim()||'My Business',industry,currency:'৳',location:location.trim()};
      await register(payload);
    }
    onSuccess?.();
  }catch(err:any){setError(err?.message||'Something went wrong. Please try again.');}finally{setLoading(false)} }

  async function demo(role:'owner'|'manager'){try{setLoading(true);setError(null);await switchDemoUser(role);onSuccess?.()}catch(err:any){setError(err?.message||'Demo sign-in failed.')}finally{setLoading(false)}}

  return <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center p-4 sm:p-8">
    <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_.95fr] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,.10)]">
      <section className="hidden lg:flex bg-slate-950 text-white p-12 flex-col justify-between min-h-[690px]">
        <div><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black">BM</div><div className="font-extrabold text-lg">BizMind <span className="text-emerald-400">BD</span></div></div>
          <div className="mt-24 max-w-md"><p className="text-emerald-400 text-xs font-bold uppercase tracking-[.18em]">Business intelligence for SMEs</p><h1 className="mt-4 text-4xl font-semibold tracking-tight leading-tight">Run the business.<br/>Understand the numbers.</h1><p className="mt-5 text-slate-400 leading-7">Bring sales, inventory, purchasing and expenses into one calm workspace—with practical intelligence where decisions happen.</p>
          <div className="mt-8 space-y-3">{['One workspace for daily operations','Inventory signals before stock becomes a problem','Business insights grounded in your own data'].map(x=><div key={x} className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-400"/>{x}</div>)}</div></div>
        </div><div className="text-xs text-slate-500">Designed for practical SME operations • Bangladesh</div>
      </section>
      <section className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
        <div className="lg:hidden flex items-center gap-3 mb-10"><div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black">BM</div><div className="font-extrabold text-lg text-slate-900">BizMind <span className="text-emerald-600">BD</span></div></div>
        <div className="max-w-md w-full mx-auto"><div className="mb-8"><h2 className="text-2xl font-bold text-slate-900 tracking-tight">{mode==='login'?'Welcome back':'Create your workspace'}</h2><p className="mt-2 text-sm text-slate-500">{mode==='login'?'Sign in to continue to your business workspace.':'Set up your business and start with a clean operational workspace.'}</p></div>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-7"><button onClick={()=>{setMode('login');setError(null)}} className={`py-2 text-sm font-semibold rounded-lg ${mode==='login'?'bg-white text-slate-900 shadow-sm':'text-slate-500'}`}>Sign in</button><button onClick={()=>{setMode('register');setError(null)}} className={`py-2 text-sm font-semibold rounded-lg ${mode==='register'?'bg-white text-slate-900 shadow-sm':'text-slate-500'}`}>Create account</button></div>
          {error&&<div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            {mode==='register'&&<><Field icon={User} label="Your name"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className={input}/></Field><Field icon={Building2} label="Business name"><input value={business} onChange={e=>setBusiness(e.target.value)} placeholder="e.g. Rahman Traders" className={input}/></Field><div className="grid sm:grid-cols-2 gap-4"><Field icon={Building2} label="Industry"><select value={industry} onChange={e=>setIndustry(e.target.value)} className={input}><option>Retail & Wholesale</option><option>Grocery / FMCG</option><option>Electronics</option><option>Restaurant / Food</option><option>Pharmacy</option><option>Other</option></select></Field><Field icon={Building2} label="Location"><input value={location} onChange={e=>setLocation(e.target.value)} className={input}/></Field></div></>}
            <Field icon={Mail} label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com" className={input}/></Field>
            {mode==='register'&&<Field icon={Phone} label="Phone"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+880 1XXXXXXXXX" className={input}/></Field>}
            <Field icon={Lock} label="Password"><div className="relative"><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className={input+' pr-11'}/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></Field>
            {mode==='register'&&<Field icon={Lock} label="Confirm password"><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" className={input}/></Field>}
            <button disabled={loading} className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2">{loading?'Please wait…':mode==='login'?'Sign in':'Create workspace'}{!loading&&<ArrowRight className="w-4 h-4"/>}</button>
          </form>
          <div className="my-7 flex items-center gap-3"><div className="h-px bg-slate-200 flex-1"/><span className="text-[11px] text-slate-400 uppercase tracking-wider">Demo access</span><div className="h-px bg-slate-200 flex-1"/></div>
          <div className="grid grid-cols-2 gap-3"><button disabled={loading} onClick={()=>demo('owner')} className="h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4"/>Owner</button><button disabled={loading} onClick={()=>demo('manager')} className="h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"><User className="w-4 h-4"/>Manager</button></div>
        </div>
      </section>
    </div>
  </div>;
};

const input='w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition';
const Field=({icon:Icon,label,children}:{icon:any,label:string,children:React.ReactNode})=><label className="block"><span className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-700"><Icon className="w-3.5 h-3.5 text-slate-400"/>{label}</span>{children}</label>;
