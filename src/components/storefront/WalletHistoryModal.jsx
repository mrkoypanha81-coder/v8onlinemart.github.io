import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, Wallet, ArrowDownLeft, ArrowUpRight, PlusCircle, 
  ShoppingBag, Gift, Sparkles, Filter, Calendar, Clock, 
  CheckCircle2, AlertCircle, ChevronRight, ShieldCheck, 
  Receipt, ArrowRight, ExternalLink, QrCode, Banknote, CreditCard, Lock, User
} from 'lucide-react';
import { DepositCreditModal } from './DepositCreditModal';

export const WalletHistoryModal = () => {
  const { 
    isWalletHistoryOpen, 
    setIsWalletHistoryOpen, 
    customerProfile, 
    walletTransactions = [], 
    lang, 
    formatDualPrice,
    setIsSettingsOpen
  } = useStore();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'inflow' | 'outflow'
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Filter transactions for currently logged in customer
  const customerTransactions = useMemo(() => {
    if (!customerProfile.isRegistered || !customerProfile.phone) {
      return [];
    }

    const cleanPhone = customerProfile.phone.trim();
    const cleanName = (customerProfile.fullName || '').trim();

    return walletTransactions.filter(tx => {
      const matchCustomer = 
        (tx.customerPhone && tx.customerPhone.trim() === cleanPhone) ||
        (tx.customerName && cleanName && tx.customerName.trim().toLowerCase() === cleanName.toLowerCase());

      if (!matchCustomer) return false;

      const isCredit = tx.direction === 'credit' || tx.type === 'deposit' || tx.type === 'topup' || tx.type === 'bonus';

      if (activeTab === 'inflow') {
        return isCredit;
      }
      if (activeTab === 'outflow') {
        return !isCredit;
      }
      return true;
    });
  }, [walletTransactions, customerProfile, activeTab]);

  // Calculate Inflow and Outflow totals
  const stats = useMemo(() => {
    if (!customerProfile.isRegistered || !customerProfile.phone) {
      return { totalDeposited: 0, totalSpent: 0 };
    }
    const cleanPhone = customerProfile.phone.trim();
    const cleanName = (customerProfile.fullName || '').trim();

    const userAll = walletTransactions.filter(tx => 
      (tx.customerPhone && tx.customerPhone.trim() === cleanPhone) ||
      (tx.customerName && cleanName && tx.customerName.trim().toLowerCase() === cleanName.toLowerCase())
    );

    let totalDeposited = 0;
    let totalSpent = 0;

    userAll.forEach(tx => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.direction === 'credit' || tx.type === 'deposit' || tx.type === 'topup' || tx.type === 'bonus') {
        totalDeposited += amt;
      } else {
        totalSpent += amt;
      }
    });

    return { totalDeposited, totalSpent };
  }, [walletTransactions, customerProfile]);

  // Group transactions by date categories: 'Today', 'Yesterday', 'Earlier'
  const groupedTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };

    customerTransactions.forEach(tx => {
      const txDate = (tx.date || '').split('T')[0];
      if (txDate === today) {
        groups.today.push(tx);
      } else if (txDate === yesterday) {
        groups.yesterday.push(tx);
      } else {
        groups.earlier.push(tx);
      }
    });

    return groups;
  }, [customerTransactions]);

  const formatTxTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? (lang === 'km' ? 'រសៀល' : 'PM') : (lang === 'km' ? 'ព្រឹក' : 'AM');
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  const formatFullDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      const isKm = lang === 'km';
      const monthsKm = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
      const day = date.getDate();
      const month = isKm ? monthsKm[date.getMonth()] : date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year} • ${hours}:${minutes} ${ampm}`;
    } catch {
      return isoString;
    }
  };

  const renderTxRow = (tx) => {
    const isCredit = tx.direction === 'credit' || tx.type === 'deposit' || tx.type === 'topup' || tx.type === 'bonus';
    const isBonus = tx.type === 'bonus';
    const isTopUp = tx.type === 'topup';

    return (
      <div
        key={tx.id}
        onClick={() => setSelectedTx(tx)}
        className="p-3 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition flex items-center justify-between gap-3 cursor-pointer group rounded-2xl"
      >
        {/* Left: Icon & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold transition group-hover:scale-105 ${
            isCredit
              ? (isBonus ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300')
              : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
          }`}>
            {isCredit ? (
              isBonus ? <Gift className="w-5 h-5" /> : (isTopUp ? <Sparkles className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />)
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              {lang === 'km' ? (tx.titleKh || tx.titleEn) : (tx.titleEn || tx.titleKh)}
            </h5>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
              <span>{formatTxTime(tx.date)}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {lang === 'km' ? 'សមតុល្យ៖ ' : 'Bal: '}${parseFloat(tx.balanceAfter || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Amount with + or - */}
        <div className="text-right flex-shrink-0">
          <span className={`font-mono font-black text-sm sm:text-base block ${
            isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isCredit ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            {isCredit ? '+' : '-'}{formatDualPrice(tx.amount).khr}
          </span>
        </div>
      </div>
    );
  };

  if (!isWalletHistoryOpen) return null;

  const currentBalance = customerProfile.isRegistered && customerProfile.phone 
    ? (parseFloat(customerProfile.balance) || 0) 
    : 0;

  const { khr: balanceKhr } = formatDualPrice(currentBalance);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden relative flex flex-col max-h-[92vh]">
        
        {/* ============================================================== */}
        {/* 1. TOP BAR                                                     */}
        {/* ============================================================== */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-2xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {lang === 'km' ? 'កាបូបលុយ V8 Wallet' : 'V8 Digital Wallet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {customerProfile.isRegistered 
                  ? `${customerProfile.fullName} (${customerProfile.phone})`
                  : (lang === 'km' ? 'គណនីភ្ញៀវ (មិនទាន់ចូល)' : 'Guest Mode')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWalletHistoryOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 2. BODY CONTENT                                                */}
        {/* ============================================================== */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* A. CLEAN LUXURY WALLET BALANCE CARD */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden space-y-4">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            {/* Balance Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-100 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>{lang === 'km' ? 'សមតុល្យដែលអាចប្រើបាន' : 'Available Balance'}</span>
              </span>

              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                customerProfile.isRegistered && customerProfile.phone
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-black/30 border-white/15 text-emerald-200'
              }`}>
                {customerProfile.isRegistered && customerProfile.phone ? '✓ Active' : 'Locked'}
              </span>
            </div>

            {/* Main Balance Display */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
              <div>
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-xs block">
                  ${currentBalance.toFixed(2)}
                </span>
                <span className="inline-block bg-white/15 text-emerald-100 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold mt-1">
                  ≈ {balanceKhr}
                </span>
              </div>

              {/* Deposit Quick Button */}
              <button
                type="button"
                onClick={() => {
                  if (customerProfile.isRegistered && customerProfile.phone) {
                    setIsDepositModalOpen(true);
                  } else {
                    setIsWalletHistoryOpen(false);
                    setIsSettingsOpen(true);
                  }
                }}
                className="py-2.5 px-4 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 font-black text-xs rounded-2xl flex items-center justify-center space-x-1.5 shadow-md transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>
                  {customerProfile.isRegistered && customerProfile.phone 
                    ? (lang === 'km' ? '+ ដាក់លុយចូល' : '+ Deposit') 
                    : (lang === 'km' ? '🔑 ចូលគណនី' : 'Login')}
                </span>
              </button>
            </div>

            {/* Inflow & Outflow Summary Pills */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/20 text-xs">
              <div className="bg-emerald-900/40 rounded-2xl p-2.5 flex items-center space-x-2 border border-white/10">
                <div className="w-7 h-7 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center flex-shrink-0 font-bold">
                  ↓
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-200 block truncate font-medium">
                    {lang === 'km' ? 'លុយចូលសរុប' : 'Total Inflow'}
                  </span>
                  <span className="font-mono font-black text-white text-xs">
                    +${stats.totalDeposited.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-900/40 rounded-2xl p-2.5 flex items-center space-x-2 border border-white/10">
                <div className="w-7 h-7 rounded-xl bg-rose-400/20 text-rose-300 flex items-center justify-center flex-shrink-0 font-bold">
                  ↑
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-200 block truncate font-medium">
                    {lang === 'km' ? 'លុយចេញសរុប' : 'Total Spent'}
                  </span>
                  <span className="font-mono font-black text-white text-xs">
                    -${stats.totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* B. SIMPLE 3-TAB FILTER BAR */}
          <div className="grid grid-cols-3 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>{lang === 'km' ? 'ទាំងអស់' : 'All'}</span>
              <span className="text-[10px] opacity-70 font-mono">({customerTransactions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inflow')}
              className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'inflow'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="text-emerald-500">●</span>
              <span>{lang === 'km' ? 'លុយចូល' : 'Inflow'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outflow')}
              className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'outflow'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="text-rose-500">●</span>
              <span>{lang === 'km' ? 'លុយចេញ' : 'Spent'}</span>
            </button>
          </div>

          {/* C. TRANSACTION LIST */}
          {!customerProfile.isRegistered || !customerProfile.phone ? (
            /* Logged-Out Friendly State */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-3 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-black text-sm text-slate-900 dark:text-white">
                  {lang === 'km' ? 'សូមចូលគណនីដើម្បីមើលប្រវត្តិ' : 'Please Login to View History'}
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {lang === 'km' 
                    ? 'កាបូបលុយត្រូវបានការពារដោយលេខសម្ងាត់ Password សូម Login ជាមួយលេខទូរស័ព្ទដើម្បីពិនិត្យមើលប្រតិបត្តិការ។'
                    : 'Your account is password-protected. Please login with your phone and password.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWalletHistoryOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                {lang === 'km' ? '🔑 ចូលគណនី (Login Now)' : 'Login Now'}
              </button>
            </div>
          ) : customerTransactions.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center space-y-2.5 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {lang === 'km' ? 'មិនមានប្រតិបត្តិការនៅក្នុងបញ្ជីនេះទេ' : 'No Transactions Found'}
              </h5>
              <p className="text-xs text-slate-400">
                {lang === 'km' ? 'រាល់ការដាក់លុយ និងការចំណាយនឹងកត់ត្រានៅទីនេះ' : 'All deposits and purchases will appear here.'}
              </p>
            </div>
          ) : (
            /* Grouped Transactions Feed */
            <div className="space-y-4">
              
              {/* Group: TODAY */}
              {groupedTransactions.today.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? 'ថ្ងៃនេះ (Today)' : 'Today'}</span>
                  </span>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
                    {groupedTransactions.today.map(tx => renderTxRow(tx))}
                  </div>
                </div>
              )}

              {/* Group: YESTERDAY */}
              {groupedTransactions.yesterday.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? 'ម្សិលមិញ (Yesterday)' : 'Yesterday'}</span>
                  </span>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
                    {groupedTransactions.yesterday.map(tx => renderTxRow(tx))}
                  </div>
                </div>
              )}

              {/* Group: EARLIER */}
              {groupedTransactions.earlier.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? 'មុនៗ (Earlier)' : 'Earlier'}</span>
                  </span>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
                    {groupedTransactions.earlier.map(tx => renderTxRow(tx))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* D. TRANSACTION DETAIL RECEIPT MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-up">
            
            {/* Receipt Header Icon */}
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-md ${
                selectedTx.direction === 'credit' || selectedTx.type === 'deposit' || selectedTx.type === 'topup' || selectedTx.type === 'bonus'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {selectedTx.direction === 'credit' || selectedTx.type === 'deposit' || selectedTx.type === 'topup' || selectedTx.type === 'bonus' ? (
                  <ArrowDownLeft className="w-7 h-7 stroke-[2.5]" />
                ) : (
                  <ShoppingBag className="w-7 h-7 stroke-[2.5]" />
                )}
              </div>

              <div>
                <span className={`text-2xl font-black font-mono block ${
                  selectedTx.direction === 'credit' || selectedTx.type === 'deposit' || selectedTx.type === 'topup' || selectedTx.type === 'bonus'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {selectedTx.direction === 'credit' || selectedTx.type === 'deposit' || selectedTx.type === 'topup' || selectedTx.type === 'bonus' ? '+' : '-'}${parseFloat(selectedTx.amount).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ≈ {formatDualPrice(selectedTx.amount).khr}
                </span>
              </div>

              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {lang === 'km' ? (selectedTx.titleKh || selectedTx.titleEn) : (selectedTx.titleEn || selectedTx.titleKh)}
              </h4>
            </div>

            {/* Receipt Fields Table */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{lang === 'km' ? 'លេខកូដប្រតិបត្តិការ' : 'Transaction ID'}:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedTx.id}</span>
              </div>

              {selectedTx.orderId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{lang === 'km' ? 'កូដបញ្ជាទិញ' : 'Order ID'}:</span>
                  <span className="font-mono font-bold text-emerald-600">#{selectedTx.orderId}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">{lang === 'km' ? 'កាលបរិច្ឆេទ' : 'Date & Time'}:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatFullDate(selectedTx.date)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">{lang === 'km' ? 'វិធីសាស្ត្រ' : 'Payment Method'}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {selectedTx.paymentMethod === 'aba_khqr' ? 'ABA KHQR' : (selectedTx.paymentMethod === 'cash' ? 'Cash at Mart' : 'V8 Wallet')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">{lang === 'km' ? 'សមតុល្យនៅសល់' : 'Running Balance'}:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  ${(parseFloat(selectedTx.balanceAfter) || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">{lang === 'km' ? 'ស្ថានភាព' : 'Status'}:</span>
                <span className="font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'ជោគជ័យ' : 'Completed'}</span>
                </span>
              </div>
            </div>

            {/* Close Receipt Button */}
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              {lang === 'km' ? 'បិទវិក្កយបត្រ (Close)' : 'Close Receipt'}
            </button>
          </div>
        </div>
      )}

      {/* Deposit Credit Modal Trigger */}
      <DepositCreditModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
};
