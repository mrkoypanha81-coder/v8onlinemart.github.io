import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  DollarSign, ShoppingCart, Package, AlertTriangle, 
  TrendingUp, ArrowUpRight, CheckCircle2, Clock, 
  ArrowRight, ShieldCheck, Sparkles, Plus, Send, 
  Calendar, Layers, Store, PiggyBank, Receipt, BarChart3,
  BadgePercent, Tag, Wallet, MinusCircle, PlusCircle, X,
  Trash2, Info, Check
} from 'lucide-react';

export const AdminOverview = ({ onNavigate }) => {
  const { 
    totalRevenue, 
    totalOrdersCount, 
    totalCostValue,
    totalInventoryValue,
    totalEstimatedStockProfit,
    totalCostOfGoodsSold,
    totalDiscountsGiven,
    totalOperatingExpenses,
    totalExpensesAndDiscounts,
    totalRealizedProfit,
    overallProfitMargin,
    expenses = [],
    addExpense,
    deleteExpense,
    products, 
    lowStockProducts, 
    orders, 
    banners = [],
    formatPrice, 
    formatDualPrice,
    currency,
    setCurrency,
    exchangeRate = 4000,
    setExchangeRate,
    lang, 
    t 
  } = useStore();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRate.toString());
  const [expenseForm, setExpenseForm] = useState({
    title_km: '',
    title_en: '',
    amount: '',
    category: 'general'
  });

  const inStockCount = products.filter(p => p.stock_quantity > 0).length;
  const recentOrders = orders.slice(0, 5);
  const bestSellers = [...products].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 4);

  // Calculate expiring products
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiringProducts = products.filter(p => {
    if (!p.expiry_date) return false;
    const exp = new Date(p.expiry_date);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  // Financial percentages for visual analytics
  const cogsPercent = totalRevenue > 0 ? ((totalCostOfGoodsSold / totalRevenue) * 100).toFixed(1) : '0';
  const expPercent = totalRevenue > 0 ? ((totalExpensesAndDiscounts / totalRevenue) * 100).toFixed(1) : '0';
  const profitPercent = totalRevenue > 0 ? ((totalRealizedProfit / totalRevenue) * 100).toFixed(1) : '0';

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || isNaN(parseFloat(expenseForm.amount))) {
      alert(lang === 'km' ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ចំណាយ' : 'Please enter a valid expense amount');
      return;
    }

    addExpense({
      title_km: expenseForm.title_km || (lang === 'km' ? 'ចំណាយទូទៅ' : 'General Expense'),
      title_en: expenseForm.title_en || expenseForm.title_km || 'General Expense',
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category
    });

    setExpenseForm({ title_km: '', title_en: '', amount: '', category: 'general' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
      {/* 1. Quick Merchant Header & Fast Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-4 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-900/40">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
              {lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម & របាយការណ៍ហិរញ្ញវត្ថុ' : 'Enterprise Financial & Sales Dashboard'}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white">
            {lang === 'km' ? 'សូមស្វាគមន៍មកកាន់ V8 Mini Mart Admin' : 'Welcome to V8 Mini Mart Admin'}
          </h2>
          <p className="text-xs text-slate-300">
            {lang === 'km' 
              ? 'តាមដានចំណូលសរុប ថ្លៃដើមទំនិញ ចំណាយ/បញ្ចុះតម្លៃ ប្រាក់ចំណេញសុទ្ធ និងតម្លៃស្តុក'
              : 'Real-time revenue, COGS, expenses & discounts, net profit, and warehouse stock valuation'}
          </p>
        </div>

        {/* Currency & Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Exchange Rate Quick Setting */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-1 px-2.5 flex items-center space-x-1.5 text-xs font-bold shadow-xs">
            <span className="text-amber-400 font-mono text-[11px]">$1 =</span>
            <input
              type="number"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              onBlur={() => {
                const val = parseInt(rateInput, 10);
                if (val && val >= 1000 && val !== exchangeRate) {
                  setExchangeRate(val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt(rateInput, 10);
                  if (val && val >= 1000) {
                    setExchangeRate(val);
                  }
                }
              }}
              title="Click to change exchange rate (e.g. 4000)"
              className="w-16 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-amber-300 font-mono text-center text-xs font-black outline-none focus:border-amber-400"
            />
            <span className="text-slate-400 text-[10px]">៛</span>
          </div>

          {/* Admin Currency Selector */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-1 flex items-center text-xs font-bold shadow-xs">
            <span className="text-slate-400 px-2 text-[10px] uppercase font-mono">Currency:</span>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded-lg transition ${currency === 'USD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('KHR')}
              className={`px-2.5 py-1 rounded-lg transition ${currency === 'KHR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
            >
              KHR (៛)
            </button>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? '+ បញ្ចូលទំនិញ' : '+ Product'}</span>
          </button>

          <button
            onClick={() => onNavigate('banners')}
            className="bg-orange-600 hover:bg-orange-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? '+ ផ្ទាំងផ្សាយ' : '+ Banner'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ENTERPRISE 5-CARD FINANCIAL & PROFIT REPORT (REDESIGNED FOR POS/ERP) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{lang === 'km' ? '📊 របាយការណ៍ហិរញ្ញវត្ថុ & ប្រាក់ចំណេញ (Financial Analytics)' : '📊 Financial Performance & Profit Analytics'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'km' 
                  ? 'គណនាដោយស្វ័យប្រវត្តិតាមរូបមន្តស្តង់ដារ៖ ចំណេញសុទ្ធ = ចំណូលសរុប - ថ្លៃដើម (COGS) - ចំណាយ/បញ្ចុះតម្លៃ'
                  : 'Auto-calculated via standard ERP formula: Net Profit = Revenue - COGS - Expenses/Discounts'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-black border border-amber-200 dark:border-amber-800 flex items-center space-x-1.5 transition shadow-xs"
            >
              <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'km' ? 'គ្រប់គ្រងចំណាយ & វិក្កយបត្រ' : 'Manage Expenses'}</span>
            </button>
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              Live Real-time
            </span>
          </div>
        </div>

        {/* 5-CARD MODERN GRID (Responsive 1/2/3/5 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          
          {/* ------------------------------------------------------------- */}
          {/* CARD 1: ចំណូលសរុប (TOTAL REVENUE)                             */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-800/90 dark:to-slate-850 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-soft hover:shadow-md transition flex flex-col justify-between space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-wider block">
                  1. {lang === 'km' ? 'ចំណូលសរុប' : 'Total Revenue'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'km' ? 'ចំណូលលក់ពី Orders' : 'Gross Sales Volume'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-600/30">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ${totalRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center justify-between">
                <span>≈ {formatDualPrice(totalRevenue).khr}</span>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                  {orders.filter(o => o.status !== 'cancelled').length} Orders
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* CARD 2: ថ្លៃដើមទំនិញ (COGS)                                   */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/90 dark:to-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-soft hover:shadow-md transition flex flex-col justify-between space-y-3 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-wider block">
                  2. {lang === 'km' ? 'ថ្លៃដើមទំនិញ (COGS)' : 'Cost of Goods (COGS)'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'km' ? 'ដើមទុនទំនិញបានលក់' : 'Direct Product Cost'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-700 dark:bg-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                ${totalCostOfGoodsSold.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center justify-between">
                <span>≈ {formatDualPrice(totalCostOfGoodsSold).khr}</span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-750 px-1.5 py-0.5 rounded">
                  {cogsPercent}% of Sales
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* CARD 3: ចំណាយផ្សេងៗ/បញ្ចុះតម្លៃ (EXPENSES & DISCOUNTS) (✨ NEW) */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/20 dark:to-slate-850 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-soft hover:shadow-md transition flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black uppercase tracking-wider block">
                    3. {lang === 'km' ? 'ចំណាយ & បញ្ចុះតម្លៃ' : 'Expenses & Discounts'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'km' ? 'Promos & Operating Costs' : 'Discounts + OpEx'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/30 group-hover:scale-105 transition">
                <BadgePercent className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 font-mono tracking-tight">
                ${totalExpensesAndDiscounts.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center justify-between">
                <span>បញ្ចុះ: ${totalDiscountsGiven.toFixed(2)} • ចំណាយ: ${totalOperatingExpenses.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                  {expPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* CARD 4: ចំណេញសុទ្ធ (NET PROFIT)                              */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-gradient-to-b from-emerald-50/90 to-white dark:from-emerald-950/40 dark:to-slate-850 p-4 rounded-2xl border-2 border-emerald-500/60 dark:border-emerald-500/50 shadow-md shadow-emerald-500/10 hover:shadow-lg transition flex flex-col justify-between space-y-3 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black uppercase tracking-wider block">
                  4. {lang === 'km' ? 'ចំណេញសុទ្ធ (Net Profit)' : 'Realized Net Profit'}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {lang === 'km' ? 'ចំណេញពិតប្រាកដក្រោយកាត់ថ្លៃ' : 'Net Take-Home Margin'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/30">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">
                +${totalRealizedProfit.toFixed(2)}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 flex items-center justify-between">
                <span>≈ {formatDualPrice(totalRealizedProfit).khr}</span>
                <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                  {overallProfitMargin.toFixed(1)}% Margin
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* CARD 5: តម្លៃស្តុក & ចំណេញរំពឹងទុក (INVENTORY & POTENTIAL)     */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => onNavigate('inventory')}
            className="bg-gradient-to-b from-orange-50/80 to-white dark:from-orange-950/20 dark:to-slate-850 p-4 rounded-2xl border border-orange-200 dark:border-orange-900/40 shadow-soft hover:shadow-md transition flex flex-col justify-between space-y-3 cursor-pointer group col-span-1 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-orange-800 dark:text-orange-300 font-black uppercase tracking-wider block">
                  5. {lang === 'km' ? 'តម្លៃស្តុក & ចំណេញរំពឹងទុក' : 'Stock & Potential Profit'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'km' ? 'ដើមទុន & តម្លៃលក់ក្នុងឃ្លាំង' : 'Warehouse Capital'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-600/30 group-hover:scale-105 transition">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">
                ដើមទុន: ${totalCostValue.toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-orange-700 dark:text-orange-400 mt-0.5 flex items-center justify-between">
                <span>លក់សរុប: ${totalInventoryValue.toFixed(2)}</span>
                <span className="text-[10px] font-black bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 px-1.5 py-0.5 rounded">
                  +{formatPrice(totalEstimatedStockProfit)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------------- */}
        {/* EXECUTIVE FLOW BREAKDOWN BAR (Shopify / Square / Stripe Style)   */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-slate-50 dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-750 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 gap-1">
            <span className="flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'km' ? 'សមាមាត្រហិរញ្ញវត្ថុពីចំណូលសរុប (Revenue Distribution Breakdown):' : 'Gross Revenue Distribution Breakdown:'}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">
              100% Revenue (${totalRevenue.toFixed(2)})
            </span>
          </div>

          {/* Multi-Segment Color Progress Bar */}
          <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
            {/* Segment 1: COGS */}
            <div 
              style={{ width: `${Math.min(100, Math.max(0, parseFloat(cogsPercent)))}%` }} 
              title={`COGS: ${cogsPercent}%`}
              className="bg-slate-600 h-full transition-all duration-500"
            />
            {/* Segment 2: Expenses & Discounts */}
            <div 
              style={{ width: `${Math.min(100, Math.max(0, parseFloat(expPercent)))}%` }} 
              title={`Expenses/Discounts: ${expPercent}%`}
              className="bg-amber-500 h-full transition-all duration-500"
            />
            {/* Segment 3: Net Profit */}
            <div 
              style={{ width: `${Math.min(100, Math.max(0, parseFloat(profitPercent)))}%` }} 
              title={`Net Profit: ${profitPercent}%`}
              className="bg-emerald-600 h-full transition-all duration-500"
            />
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 pt-1">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 flex-shrink-0" />
              <span className="truncate">ថ្លៃដើម COGS ({cogsPercent}%)</span>
            </div>
            <div className="flex items-center space-x-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="truncate">ចំណាយ/បញ្ចុះតម្លៃ ({expPercent}%)</span>
            </div>
            <div className="flex items-center space-x-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
              <span className="truncate">ចំណេញសុទ្ធ ({profitPercent}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Operational KPI Cards (Orders, Expiry Alerts, Low Stock) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Orders */}
        <div 
          onClick={() => onNavigate('orders')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex items-center justify-between cursor-pointer hover:border-slate-400 transition"
        >
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
              {lang === 'km' ? 'ការបញ្ជាទិញសរុប' : 'Total Orders'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight font-mono">
              {totalOrdersCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" />
              100% Processed
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Expiry & Shelf Alerts */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-soft flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
        >
          <div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold uppercase block mb-1">
              {lang === 'km' ? '⚠️ ជិតផុតកំណត់ (Expire)' : '⚠️ Expiring Soon'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300 leading-tight font-mono">
              {expiringProducts.length}
            </div>
            <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">
              {lang === 'km' ? 'ក្នុងរយៈពេល ៣០ ថ្ងៃ' : '< 30 days left'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Low Stock Alert */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-soft flex items-center justify-between cursor-pointer hover:border-rose-400 transition col-span-2 lg:col-span-1"
        >
          <div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase block mb-1">
              {lang === 'km' ? '📉 ស្តុកជិតអស់ (Low Stock)' : 'Low Stock Alert'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 leading-tight font-mono">
              {lowStockProducts.length}
            </div>
            <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
              {lang === 'km' ? 'សល់ក្រោម ៥ ឯកតា' : 'Stock < 5 units'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Middle Section: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Recent Orders (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {lang === 'km' ? '📦 ការបញ្ជាទិញថ្មីៗ (Recent Orders)' : '📦 Recent Orders'}
              </h3>
              <p className="text-[11px] text-slate-400">Live order transactions</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
            {recentOrders.map(order => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs min-w-[320px]">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{order.id}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{order.customer_name} ({order.order_items.length} items)</div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-black text-slate-900 dark:text-white font-mono">${order.total_amount.toFixed(2)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    order.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                    order.status === 'shipped' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                    order.status === 'completed' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300' :
                    'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Selling Products (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {lang === 'km' ? '🔥 ទំនិញលក់ដាច់បំផុត' : '🔥 Top Selling Products'}
              </h3>
              <p className="text-[11px] text-slate-400">Ranked by total quantity sold</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {bestSellers.map((product, idx) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={product.images[0]} 
                      alt={product.title_en || product.title_kh} 
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                      #{idx + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 max-w-[160px]">
                      {lang === 'km' ? product.title_kh : (product.title_en || product.title_kh)}
                    </h4>
                    <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold">{formatPrice(product.price)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono block">
                    {product.sold_count} sold
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    In stock: {product.stock_quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Promotional Banners Quick Access Banner */}
      <div 
        onClick={() => onNavigate('banners')}
        className="cursor-pointer bg-gradient-to-r from-emerald-900 via-emerald-800 to-orange-700 text-white p-5 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-700/40 hover:brightness-105 transition transform hover:scale-[1.01]"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/20">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">
              {lang === 'km' ? 'គ្រប់គ្រងផ្ទាំងផ្សព្វផ្សាយ & រូបភាព Discount (Promotional Banners)' : 'Promotional Banners & Discount Management'}
            </h4>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {lang === 'km' ? 'Upload រូបភាពថ្មី កែសម្រួលចំណងជើង និងបើក/បិទការបញ្ចុះតម្លៃលើទំព័រមុខ' : 'Upload custom banner images, customize discount text & toggle storefront campaigns'}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('banners');
          }}
          className="bg-white text-emerald-900 px-4 py-2 rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition flex-shrink-0"
        >
          <span>{lang === 'km' ? 'គ្រប់គ្រងផ្ទាំងផ្សព្វផ្សាយ' : 'Manage Banners'}</span>
          <ArrowRight className="w-4 h-4 text-orange-600" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 6. MANAGE EXPENSES & DISCOUNT MODAL                                       */}
      {/* ========================================================================= */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <BadgePercent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {lang === 'km' ? 'កត់ត្រាចំណាយ & បញ្ចុះតម្លៃ (Expenses & Promos)' : 'Store Expenses & Promo Discounts'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'km' ? 'សរុបចំណាយទូទៅ និងបញ្ចុះតម្លៃសម្រាប់គណនាប្រាក់ចំណេញសុទ្ធ' : 'Track promotional discounts & store operating costs'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              
              {/* Summary Stats in Modal */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block">បញ្ចុះតម្លៃលើ Orders:</span>
                  <span className="text-base font-black text-amber-900 dark:text-amber-200 font-mono">${totalDiscountsGiven.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block">ចំណាយប្រតិបត្តិការទូទៅ:</span>
                  <span className="text-base font-black text-amber-900 dark:text-amber-200 font-mono">${totalOperatingExpenses.toFixed(2)}</span>
                </div>
              </div>

              {/* Add Expense Form */}
              <form onSubmit={handleAddExpenseSubmit} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  + {lang === 'km' ? 'បន្ថែមការចំណាយថ្មី (Add Store Expense)' : 'Record New Operating Expense'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      {lang === 'km' ? 'ឈ្មោះចំណាយ (Expense Description) *' : 'Expense Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={expenseForm.title_km}
                      onChange={(e) => setExpenseForm({ ...expenseForm, title_km: e.target.value, title_en: e.target.value })}
                      placeholder="ឧ. ថ្លៃថង់វិចខ្ចប់, សាំងដឹកទំនិញ, ទឹកភ្លើង..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      {lang === 'km' ? 'ទឹកប្រាក់ ($ USD) *' : 'Amount ($ USD) *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? 'រក្សាទុកចំណាយ' : 'Save Expense'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Expenses List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'km' ? 'បញ្ជីចំណាយដែលបានកត់ត្រា (Logged Expenses):' : 'Logged Expenses History:'}
                </span>

                {expenses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-850 rounded-xl">
                    {lang === 'km' ? 'មិនទាន់មានការចំណាយផ្សេងៗនៅឡើយទេ' : 'No recorded operating expenses yet'}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-750 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                    {expenses.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {lang === 'km' ? item.title_km : item.title_en}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-black font-mono text-amber-700 dark:text-amber-400">${parseFloat(item.amount).toFixed(2)}</span>
                          <button
                            onClick={() => deleteExpense(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {lang === 'km' ? 'រួចរាល់' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
