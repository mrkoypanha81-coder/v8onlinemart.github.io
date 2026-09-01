import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import v8Logo from '../../assets/iconv8mart.jpg';
import { ShieldCheck, Lock, ArrowRight, Store, KeyRound, AlertCircle, Shield, Users, Phone } from 'lucide-react';

export const AdminAuth = () => {
  const { adminLogin, memberLogin, navigateTo, lang } = useStore();
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' | 'member'
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (loginMode === 'admin') {
      const success = adminLogin(pin, remember);
      if (!success) {
        setError(lang === 'km' ? 'លេខកូដ PIN មិនត្រឹមត្រូវទេ! (សាកល្បង៖ 1234)' : 'Incorrect PIN! (Default: 1234)');
      }
    } else {
      if (!phone.trim()) {
        setError(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter phone number!');
        return;
      }
      const success = memberLogin(phone, pin, remember);
      if (!success) {
        setError(lang === 'km' ? 'លេខទូរស័ព្ទ ឬ លេខកូដ PIN មិនត្រឹមត្រូវទេ!' : 'Incorrect phone number or PIN!');
      }
    }
  };

  const handleQuickDemoLogin = () => {
    adminLogin('1234', true);
  };

  const handleQuickMemberLogin = (demoPhone, demoPin) => {
    memberLogin(demoPhone, demoPin, true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/95 border border-emerald-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-slate-100">
        {/* Brand Header */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-500/40 bg-white flex items-center justify-center mx-auto p-1">
            <img src={v8Logo} alt="V8 Mini Mart Official" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              V8 MERCHANT PORTAL
            </h1>
            <p className="text-xs text-emerald-400 font-medium mt-1">
              {lang === 'km' 
                ? 'ប្រព័ន្ធគ្រប់គ្រងស្តុក ទំនិញ និងការបញ្ជាទិញ (Admin Only)'
                : 'Inventory, Stock & Order Management System'}
            </p>
          </div>
        </div>


        {/* Login Mode Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mt-4 select-none">
          <button
            type="button"
            onClick={() => {
              setLoginMode('admin');
              setError('');
              setPin('');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              loginMode === 'admin'
                ? 'bg-emerald-800 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'Admin PIN' : 'Admin PIN'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('member');
              setError('');
              setPhone('');
              setPin('');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              loginMode === 'member'
                ? 'bg-emerald-800 text-white shadow-xs font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'សមាជិក / បុគ្គលិក' : 'Member / Staff'}</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loginMode === 'member' && (
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300 flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-450 animate-pulse" />
                {lang === 'km' ? 'លេខទូរស័ព្ទ (Phone Number)' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="012345678"
                className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                {loginMode === 'admin'
                  ? (lang === 'km' ? 'បញ្ចូលលេខកូដសម្ងាត់ (Admin PIN)' : 'Enter Admin Security PIN')
                  : (lang === 'km' ? 'បញ្ចូលលេខកូដ PIN' : 'Enter Personal PIN')
                }
              </span>
              {loginMode === 'admin' && (
                <span className="text-[10px] text-slate-400 font-mono bg-slate-700/60 px-1.5 py-0.5 rounded">
                  PIN: 1234
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={loginMode === 'admin' ? 8 : 12}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em] font-mono text-white placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
              />
              <span>{lang === 'km' ? 'ចងចាំនៅលើឧបករណ៍នេះ' : 'Remember this device'}</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-700/30 flex items-center justify-center space-x-2 transition transform active:scale-[0.98]"
          >
            <span>{lang === 'km' ? 'ផ្ទៀងផ្ទាត់ & ចូលគ្រប់គ្រង' : 'Unlock Merchant Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Login Button */}
          {loginMode === 'admin' ? (
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-slate-700"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'km' ? '⚡ ចូលរហ័ស (Quick Demo: 1234)' : '⚡ Quick Demo Login (1234)'}</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] font-black text-slate-500 uppercase text-left tracking-wider">
                {lang === 'km' ? 'គណនីសាកល្បងរហ័ស (Demo Accounts):' : 'Quick Demo Accounts:'}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickMemberLogin('012345678', '1111')}
                  className="py-2 px-2 bg-slate-800/70 hover:bg-slate-850 rounded-xl border border-slate-700 text-slate-300 text-[9px] font-bold transition flex flex-col items-center cursor-pointer overflow-hidden"
                >
                  <span className="text-emerald-400 font-extrabold truncate w-full">Sopheap (Staff)</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5">PIN: 1111</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickMemberLogin('098765432', '2222')}
                  className="py-2 px-2 bg-slate-800/70 hover:bg-slate-850 rounded-xl border border-slate-700 text-slate-300 text-[9px] font-bold transition flex flex-col items-center cursor-pointer overflow-hidden"
                >
                  <span className="text-blue-400 font-extrabold truncate w-full">Dara (Delivery)</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5">PIN: 2222</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickMemberLogin('077112233', '3333')}
                  className="py-2 px-2 bg-slate-800/70 hover:bg-slate-850 rounded-xl border border-slate-700 text-slate-300 text-[9px] font-bold transition flex flex-col items-center cursor-pointer overflow-hidden"
                >
                  <span className="text-orange-400 font-extrabold truncate w-full">Sokha (Superv)</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5">PIN: 3333</span>
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Back to Live Storefront */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <button
            onClick={() => navigateTo('/')}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 font-medium transition"
          >
            <Store className="w-4 h-4" />
            <span>{lang === 'km' ? '← ត្រឡប់ទៅវេបសាយទំនិញភ្ញៀវ (Live Store)' : '← Back to Live Customer Store'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
