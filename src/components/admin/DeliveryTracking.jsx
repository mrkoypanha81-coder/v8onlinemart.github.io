import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { resolveAssetUrl, handleImageError } from '../../utils/resolveAssetUrl';
import confetti from 'canvas-confetti';
import { 
  Truck, Search, CheckCircle2, Clock, Package, 
  MapPin, Phone, MessageSquare, AlertCircle, RefreshCw, 
  ExternalLink, Printer, User, Filter, ArrowRight, ShieldCheck,
  ChevronRight, Calendar, Sparkles, Navigation, X, AlertTriangle,
  Camera, Upload, Image as ImageIcon, Eye, Table, LayoutGrid, ChevronLeft
} from 'lucide-react';

export const DeliveryTracking = () => {
  const { 
    orders, 
    updateOrderStatus, 
    confirmOrderDelivery, 
    uploadDeliveryEvidence,
    formatPrice, 
    formatDualPrice, 
    lang, 
    t 
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'preparing' | 'shipped' | 'delivered' | 'flora' | 'outside'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'price_high'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [uploadingOrderId, setUploadingOrderId] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedDriver, setSelectedDriver] = useState({
    name: 'Chan Dara (ដារ៉ា)',
    phone: '098 777 666',
    vehicle: 'Honda Dream 125 (ភ្នំពេញ 1AB-8899)'
  });

  // Date Helpers
  const isSameDay = (d1, d2) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  };

  const isTodayDate = (dateStr) => isSameDay(dateStr, new Date());
  
  const isYesterdayDate = (dateStr) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(dateStr, yesterday);
  };

  const isThisWeekDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    return d >= startOfWeek;
  };

  const isThisMonthDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  // Categorize orders for delivery tracking
  const activeDeliveries = orders.filter(o => o.status === 'shipped');
  const preparingOrders = orders.filter(o => o.status === 'paid' || o.status === 'pending');
  const deliveredOrders = orders.filter(o => o.status === 'completed');
  const floraDeliveries = orders.filter(o => o.is_in_borey_the_flora);

  // Filter & Sorting logic (Newest First by default!)
  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = (o.id || '').toLowerCase().includes(q) ||
                        (o.customer_name || '').toLowerCase().includes(q) ||
                        (o.customer_phone || '').toLowerCase().includes(q) ||
                        (o.shipping_address || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterTab === 'preparing' && !(o.status === 'pending' || o.status === 'paid')) return false;
    if (filterTab === 'shipped' && o.status !== 'shipped') return false;
    if (filterTab === 'delivered' && o.status !== 'completed') return false;
    if (filterTab === 'flora' && !o.is_in_borey_the_flora) return false;
    if (filterTab === 'outside' && o.is_in_borey_the_flora) return false;

    // Date Filter logic
    const createdAt = o.created_at || Date.now();
    if (dateFilter === 'today' && !isTodayDate(createdAt)) return false;
    if (dateFilter === 'yesterday' && !isYesterdayDate(createdAt)) return false;
    if (dateFilter === 'this_week' && !isThisWeekDate(createdAt)) return false;
    if (dateFilter === 'this_month' && !isThisMonthDate(createdAt)) return false;
    if (dateFilter === 'custom' && selectedDate) {
      const oDateStr = new Date(createdAt).toISOString().split('T')[0];
      if (oDateStr !== selectedDate) return false;
    }

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();

    if (sortBy === 'oldest') {
      return timeA - timeB;
    } else if (sortBy === 'price_high') {
      return (b.total_amount || 0) - (a.total_amount || 0);
    } else {
      // Default: 'newest' (Newest data always at the top!)
      return timeB - timeA;
    }
  });

  const handleStepStatus = (orderId, targetStatus) => {
    if (targetStatus === 'completed') {
      confirmOrderDelivery(orderId, 'admin');
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      updateOrderStatus(orderId, targetStatus);
    }
  };

  const handleTriggerUpload = (orderId, useCamera = false) => {
    setUploadingOrderId(orderId);
    if (useCamera) {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleEvidenceFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingOrderId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      uploadDeliveryEvidence(uploadingOrderId, base64);
      setUploadingOrderId(null);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>បានប្រគល់ជោគជ័យ (Delivered)</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center space-x-1 animate-pulse">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>កំពុងដឹកជញ្ជូន (Out for Delivery)</span>
          </span>
        );
      case 'paid':
        return (
          <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center space-x-1">
            <Package className="w-3 h-3 text-amber-600" />
            <span>កំពុងវេចខ្ចប់ (Packing)</span>
          </span>
        );
      case 'pending':
        return (
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>បានកុម្ម៉ង់ (Order Placed)</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
            បានបោះបង់ (Cancelled)
          </span>
        );
      default:
        return null;
    }
  };

  const getRowStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'paid':
        return 'bg-amber-100/90 dark:bg-amber-950/70 hover:bg-amber-200/90 dark:hover:bg-amber-900/80 border-l-6 border-l-amber-500 font-medium text-slate-950 dark:text-slate-100';
      case 'shipped':
        return 'bg-sky-100/90 dark:bg-sky-950/70 hover:bg-sky-200/90 dark:hover:bg-sky-900/80 border-l-6 border-l-sky-500 font-medium text-slate-950 dark:text-slate-100';
      case 'completed':
        return 'bg-emerald-100/90 dark:bg-emerald-950/70 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/80 border-l-6 border-l-emerald-500 font-medium text-slate-950 dark:text-slate-100';
      case 'cancelled':
        return 'bg-rose-100/90 dark:bg-rose-950/70 hover:bg-rose-200/90 dark:hover:bg-rose-900/80 border-l-6 border-l-rose-500 font-medium text-slate-950 dark:text-slate-100';
      default:
        return 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border-l-6 border-l-slate-400 dark:border-l-slate-600 text-slate-900 dark:text-slate-100';
    }
  };

  const getRowIndexBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
      case 'paid':
        return 'bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 font-black';
      case 'shipped':
        return 'bg-sky-200/90 dark:bg-sky-900/80 text-sky-950 dark:text-sky-100 font-black';
      case 'completed':
        return 'bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 font-black';
      case 'cancelled':
        return 'bg-rose-200/90 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 font-black';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Hidden File Inputs for Evidence Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleEvidenceFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleEvidenceFileChange}
        className="hidden"
      />

      {/* 1. Header & Quick Summary KPI Cards */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
              <span className="p-2 bg-orange-600 text-white rounded-2xl shadow-md shadow-orange-600/20">
                <Truck className="w-5 h-5" />
              </span>
              <span>{lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រង & តាមដានការដឹកទំនិញ (Delivery Dispatch Tracker)' : 'Delivery Dispatch & Live Order Tracker'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'km' ? 'គ្រប់គ្រងអ្នកដឹកជញ្ជូន តាមដានស្ថានភាពដឹក និងបញ្ចូលរូបភាពភស្តុតាងប្រគល់ទំនិញ (Proof of Delivery Evidence)' : 'Manage delivery drivers, real-time tracking, and upload proof of delivery photo evidence'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              ⚡ Real-time Dispatch Active
            </span>
          </div>
        </div>

        {/* 4 Delivery KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>{lang === 'km' ? 'ការដឹកសរុប' : 'Total Orders'}</span>
              <Package className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {orders.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {orders.filter(o => o.status !== 'cancelled').length} Active
            </div>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold">
              <span>{lang === 'km' ? 'កំពុងរៀបចំ & វេចខ្ចប់' : 'Preparing / Packing'}</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-800 dark:text-amber-300 mt-1">
              {preparingOrders.length}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              Ready for dispatch
            </div>
          </div>

          <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50">
            <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-xs font-bold">
              <span>{lang === 'km' ? 'កំពុងធ្វើដំណើរដឹក' : 'Out for Delivery'}</span>
              <Truck className="w-4 h-4 text-blue-600 animate-pulse" />
            </div>
            <div className="text-2xl font-black font-mono text-blue-800 dark:text-blue-300 mt-1">
              {activeDeliveries.length}
            </div>
            <div className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-0.5">
              Drivers en route
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <span>{lang === 'km' ? 'បានប្រគល់ជោគជ័យ' : 'Delivered / Completed'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-800 dark:text-emerald-300 mt-1">
              {deliveredOrders.length}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              {orders.filter(o => o.delivery_evidence_image).length} With Photo Evidence 📸
            </div>
          </div>

        </div>
      </div>

      {/* 2. Filters, Search & View Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        
        {/* Search & View Mode Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder={lang === 'km' ? 'ស្វែងរកតាមលេខ Order, ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ, ឬអាសយដ្ឋានដឹក...' : 'Search by Order ID, customer, phone, or address...'}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          {/* View Mode Switcher, Sort Order & Page Size Selector */}
          <div className="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto justify-between md:justify-end flex-wrap gap-2">
            
            {/* Sort Order Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <ArrowRight className="w-3.5 h-3.5 text-orange-600 rotate-90" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                aria-label="Sort order selector"
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="newest">🆕 ថ្មីៗនៅខាងលើ (Newest First)</option>
                <option value="oldest">⏳ ចាស់ៗនៅខាងលើ (Oldest First)</option>
                <option value="price_high">💲 តម្លៃខ្ពស់មុន (Highest Price)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? '📊 តារាង' : 'Table'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? '🗂️ កាត' : 'Grid'}</span>
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(e.target.value); setCurrentPage(1); }}
              aria-label="Rows per page selector"
              className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value={15}>15 ជួរ/ទំព័រ</option>
              <option value={30}>30 ជួរ/ទំព័រ</option>
              <option value={50}>50 ជួរ/ទំព័រ</option>
              <option value={100}>100 ជួរ/ទំព័រ</option>
              <option value="all">ទាំងអស់ (All)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Bar (NEW!) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              <span>{lang === 'km' ? '📅 តម្រងតាមកាលបរិច្ឆេទ (Date Filter):' : 'Date Filter:'}</span>
            </span>

            {/* Custom Date Input Picker */}
            {dateFilter === 'custom' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-orange-500 rounded-xl text-slate-800 dark:text-slate-100 outline-none shadow-xs"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: '📅 ទាំងអស់ (All Time)' },
              { id: 'today', label: '☀️ ថ្ងៃនេះ (Today)' },
              { id: 'yesterday', label: '🌙 ម្សិលមិញ (Yesterday)' },
              { id: 'this_week', label: '📅 សប្តាហ៍នេះ (This Week)' },
              { id: 'this_month', label: '🗓️ ខែនេះ (This Month)' },
              { id: 'custom', label: '📆 ជ្រើសរើសថ្ងៃ... (Custom Date)' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setDateFilter(tab.id); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: lang === 'km' ? `ទាំងអស់ (${orders.length})` : `All (${orders.length})` },
            { id: 'preparing', label: lang === 'km' ? `📦 កំពុងវេចខ្ចប់ (${preparingOrders.length})` : `Packing (${preparingOrders.length})` },
            { id: 'shipped', label: lang === 'km' ? `🚚 កំពុងដឹក (${activeDeliveries.length})` : `En Route (${activeDeliveries.length})` },
            { id: 'delivered', label: lang === 'km' ? `✅ បានប្រគល់ (${deliveredOrders.length})` : `Delivered (${deliveredOrders.length})` },
            { id: 'flora', label: lang === 'km' ? `🏡 ក្នុងបុរី The Flora (${floraDeliveries.length})` : `Borey Flora (${floraDeliveries.length})` },
            { id: 'outside', label: lang === 'km' ? `🚚 ក្រៅបុរី The Flora` : `Outside Flora` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setFilterTab(tab.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-slate-900 dark:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* 3. Delivery Orders View Mode Switcher Rendering */}
      {viewMode === 'table' ? (
        /* TABLE VIEW FORMAT WITH COLOR HIGHLIGHTING */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          
          {/* COLOR HIGHLIGHT LEGEND BAR */}
          <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <span>🎨 ពណ៌សម្គាល់ជួរ (Status Highlight Legend):</span>
            </span>
            <div className="flex flex-wrap items-center gap-2 font-bold text-[11px]">
              <span className="inline-flex items-center space-x-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-lg border-l-4 border-amber-500">
                <span>🟡 ថ្មី / វេចខ្ចប់ (New/Packing)</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 px-2.5 py-0.5 rounded-lg border-l-4 border-blue-500">
                <span>🔵 កំពុងដឹក (En Route)</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg border-l-4 border-emerald-500">
                <span>🟢 បានប្រគល់ & ទូទាត់រួច (Delivered/Paid)</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 px-2.5 py-0.5 rounded-lg border-l-4 border-rose-500">
                <span>🔴 បានបោះបង់ (Cancelled)</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Order ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">កាលបរិច្ឆេទ (Date)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">អតិថិជន (Customer)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">អាសយដ្ឋានដឹក (Destination)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">ទំនិញ & សរុប (Items)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">ភស្តុតាង (Photo Evidence)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">ស្ថានភាព (Status)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">សកម្មភាព (Actions)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {(() => {
                  const totalItems = filteredOrders.length;
                  const numericPageSize = pageSize === 'all' ? totalItems || 1 : Number(pageSize);
                  const startIndex = (currentPage - 1) * numericPageSize;
                  const paginatedOrders = pageSize === 'all' 
                    ? filteredOrders 
                    : filteredOrders.slice(startIndex, startIndex + numericPageSize);

                  if (paginatedOrders.length === 0) {
                    return (
                      <tr>
                        <td colSpan="9" className="py-12 text-center text-slate-400 font-bold">
                          {lang === 'km' ? 'រកមិនឃើញការដឹកជញ្ជូនដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកនេះទេ' : 'No deliveries match search query'}
                        </td>
                      </tr>
                    );
                  }

                  return paginatedOrders.map((order, idx) => {
                    const rowNumber = startIndex + idx + 1;

                    return (
                      <tr key={order.id} className={`${getRowStatusColor(order.status)} transition-colors duration-150`}>
                        {/* Sequential Row Number # */}
                        <td className={`py-3.5 px-4 font-mono font-black text-center ${getRowIndexBadgeStyle(order.status)}`}>
                          #{rowNumber}
                        </td>

                        {/* Order ID */}
                        <td className="py-3 px-4 font-mono font-black text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          {order.id}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                          {new Date(order.created_at || Date.now()).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Customer Info */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                            <User className="w-3 h-3 text-slate-400 inline" />
                            <span>{order.customer_name}</span>
                          </div>
                          <a href={`tel:${order.customer_phone}`} className="text-slate-500 font-mono hover:text-emerald-600 block">
                            📞 {order.customer_phone}
                          </a>
                        </td>

                        {/* Destination & Borey Tag */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="truncate font-medium text-slate-800 dark:text-slate-200" title={order.shipping_address}>
                            {order.shipping_address}
                          </div>
                          {order.is_in_borey_the_flora ? (
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                              🏡 ក្នុងបុរី The Flora
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                              🚚 ក្រៅបុរី The Flora
                            </span>
                          )}
                        </td>

                        {/* Items & Total */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900 dark:text-white">
                            ${(order.total_amount || 0).toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {order.order_items?.length || 0} មុខទំនិញ
                          </span>
                        </td>

                        {/* Proof Photo Evidence */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {order.delivery_evidence_image ? (
                            <div 
                              onClick={() => setPreviewImageModal(order.delivery_evidence_image)}
                              className="w-10 h-10 mx-auto rounded-lg overflow-hidden border border-emerald-500/50 cursor-pointer group shadow-2xs relative"
                            >
                              <img src={resolveAssetUrl(order.delivery_evidence_image)} alt="Proof" onError={handleImageError} className="w-full h-full object-cover group-hover:scale-110 transition" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold">
                                👁️
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleTriggerUpload(order.id, true)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Snap Photo"
                              >
                                📸
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTriggerUpload(order.id, false)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Upload Gallery"
                              >
                                🖼️
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          {order.status !== 'shipped' && order.status !== 'completed' && (
                            <button
                              onClick={() => handleStepStatus(order.id, 'shipped')}
                              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                            >
                              🚀 ដឹក
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button
                              onClick={() => handleStepStatus(order.id, 'completed')}
                              className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                            >
                              ✅ ប្រគល់
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedDelivery(order)}
                            className="py-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg cursor-pointer"
                          >
                            👁️ លម្អិត
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW FORMAT WITH ROW NUMBERS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const totalItems = filteredOrders.length;
            const numericPageSize = pageSize === 'all' ? totalItems || 1 : Number(pageSize);
            const startIndex = (currentPage - 1) * numericPageSize;
            const paginatedOrders = pageSize === 'all' 
              ? filteredOrders 
              : filteredOrders.slice(startIndex, startIndex + numericPageSize);

            if (paginatedOrders.length === 0) {
              return (
                <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                  <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {lang === 'km' ? 'រកមិនឃើញការដឹកជញ្ជូនដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកនេះទេ' : 'No deliveries match search query'}
                  </p>
                </div>
              );
            }

            return paginatedOrders.map((order, idx) => {
              const rowNumber = startIndex + idx + 1;

              return (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Top */}
                  <div className="p-5 space-y-3.5">
                    
                    {/* Header: Row Index # & Order ID */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          #{rowNumber}
                        </span>
                        <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-lg border border-orange-200 dark:border-orange-900/50">
                          {order.id}
                        </span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customer_name}</span>
                      </span>
                      <a 
                        href={`tel:${order.customer_phone}`} 
                        className="font-mono text-slate-600 dark:text-slate-400 hover:text-emerald-600 flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{order.customer_phone}</span>
                      </a>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 flex items-start space-x-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.shipping_address}, {order.city_province}</span>
                    </p>

                    {/* Borey The Flora Tag */}
                    <div className="pt-1">
                      {order.is_in_borey_the_flora ? (
                        <span className="inline-block text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                          🏡 ក្នុងបុរី The Flora (Free Delivery)
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                          🚚 ក្រៅបុរី The Flora (សេវាដឹក 6,000 ៛)
                        </span>
                      )}
                    </div>

                    {/* Delivery Remarks */}
                    {order.delivery_remarks && (
                      <div className="p-2 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 text-[11px] text-orange-950 dark:text-orange-300 mt-1">
                        <span className="font-bold">📌 សម្គាល់៖ </span>
                        <span>{order.delivery_remarks}</span>
                      </div>
                    )}
                  </div>

                  {/* Items Preview */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                      <span>ទំនិញ ({order.order_items?.length || 0} មុខ):</span>
                      <span className="font-mono text-slate-900 dark:text-white font-black text-xs">${(order.total_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 max-h-16 overflow-y-auto">
                      {order.order_items?.map((it, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="truncate max-w-[200px]">{it.quantity}x {it.product_name}</span>
                          <span className="font-mono font-bold">${(it.total_price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROOF OF DELIVERY PHOTO EVIDENCE SECTION */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'km' ? 'ភស្តុតាងប្រគល់ (Evidence):' : 'Proof of Delivery:'}</span>
                      </span>
                      {order.delivery_evidence_image && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          ✓ Photo Uploaded
                        </span>
                      )}
                    </div>

                    {order.delivery_evidence_image ? (
                      <div className="flex items-center space-x-3">
                        <div 
                          onClick={() => setPreviewImageModal(order.delivery_evidence_image)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/40 relative cursor-pointer group shadow-2xs flex-shrink-0"
                        >
                          <img 
                            src={resolveAssetUrl(order.delivery_evidence_image)} 
                            alt="Delivery Evidence" 
                            onError={handleImageError}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                        
                        <div className="flex-1 text-[11px] space-y-1">
                          <p className="text-slate-500 dark:text-slate-400 truncate">
                            {order.delivery_evidence_time ? new Date(order.delivery_evidence_time).toLocaleTimeString() : 'Verified'}
                          </p>
                          <div className="flex space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(order.id, true)}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
                            >
                              <Camera className="w-3 h-3 text-emerald-600" />
                              <span>ថតថ្មី</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(order.id, false)}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-orange-600" />
                              <span>ប្តូររូប</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleTriggerUpload(order.id, true)}
                          className="flex-1 py-2 px-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{lang === 'km' ? '📸 ថតរូបផ្ទាល់' : '📸 Snap Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTriggerUpload(order.id, false)}
                          className="flex-1 py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-orange-600" />
                          <span>{lang === 'km' ? '🖼️ ជ្រើសពី Gallery' : '🖼️ Gallery'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Actions Bottom */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {order.status !== 'shipped' && order.status !== 'completed' && (
                      <button
                        onClick={() => handleStepStatus(order.id, 'shipped')}
                        className="col-span-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        <span>{lang === 'km' ? '🚀 ចេញដំណើរដឹក (Out for Delivery)' : 'Dispatch (En Route)'}</span>
                      </button>
                    )}

                    {order.status === 'shipped' && (
                      <button
                        onClick={() => handleStepStatus(order.id, 'completed')}
                        className="col-span-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{lang === 'km' ? '✅ បញ្ជាក់បានប្រគល់ (Confirm Delivered)' : 'Confirm Delivered'}</span>
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <div className="col-span-2 py-1.5 px-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'km' ? 'បានប្រគល់ទំនិញរួចរាល់ ១០០%' : 'Delivered & Confirmed'}</span>
                      </div>
                    )}

                    <a
                      href={`tel:${order.customer_phone}`}
                      className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 transition"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>ខលភ្ញៀវ</span>
                    </a>

                    <button
                      onClick={() => setSelectedDelivery(order)}
                      className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3 text-orange-600" />
                      <span>លម្អិត & Print</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          });
        })()}
        </div>
      )}

      {/* 4. PAGINATION FOOTER BAR (SHOWS EXACT PAGE STATS & ROW RANGES) */}
      {filteredOrders.length > 0 && (() => {
        const totalItems = filteredOrders.length;
        const numericPageSize = pageSize === 'all' ? totalItems || 1 : Number(pageSize);
        const totalPages = Math.ceil(totalItems / numericPageSize) || 1;
        const startIndex = (currentPage - 1) * numericPageSize;
        const endIndex = Math.min(startIndex + numericPageSize, totalItems);

        return (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              {lang === 'km' 
                ? `បង្ហាញ ${startIndex + 1} ដល់ ${endIndex} នៃទិន្នន័យសរុប ${totalItems} (ទំព័រ ${currentPage} នៃ ${totalPages})`
                : `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} entries (Page ${currentPage} of ${totalPages})`}
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40 text-slate-800 dark:text-slate-200 font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === 'km' ? 'ថយក្រោយ' : 'Previous'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl font-black text-xs transition cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40 text-slate-800 dark:text-slate-200 font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>{lang === 'km' ? 'បន្ទាប់' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. Delivery Details Modal & Printable Slip */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  ប័ណ្ណដឹកជញ្ជូនទំនិញ (Delivery Slip) • <span className="font-mono text-orange-600">{selectedDelivery.id}</span>
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDelivery(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Delivery Info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">អតិថិជន៖</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDelivery.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">លេខទូរស័ព្ទ៖</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedDelivery.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">ទីតាំងដឹក៖</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[280px]">
                    {selectedDelivery.shipping_address}, {selectedDelivery.city_province}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">ប្រភេទទីតាំង៖</span>
                  <span className="font-bold text-emerald-600">
                    {selectedDelivery.is_in_borey_the_flora ? '🏡 បុរី The Flora (Free Delivery)' : '🚚 ក្រៅបុរី The Flora'}
                  </span>
                </div>
              </div>

              {/* Driver Info */}
              <div className="p-4 bg-orange-50/70 dark:bg-orange-950/40 rounded-2xl border border-orange-200 dark:border-orange-900/60 space-y-2">
                <div className="font-bold text-orange-900 dark:text-orange-200 flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-orange-600" />
                  <span>ព័ត៌មានអ្នកដឹក (Assigned Delivery Driver)</span>
                </div>
                <div className="flex justify-between text-orange-950 dark:text-orange-200">
                  <span>អ្នកដឹកជញ្ជូន៖</span>
                  <span className="font-bold">{selectedDriver.name}</span>
                </div>
                <div className="flex justify-between text-orange-950 dark:text-orange-200">
                  <span>លេខទូរស័ព្ទ Driver៖</span>
                  <span className="font-mono font-bold">{selectedDriver.phone}</span>
                </div>
                <div className="flex justify-between text-orange-950 dark:text-orange-200">
                  <span>មធ្យោបាយធ្វើដំណើរ៖</span>
                  <span>{selectedDriver.vehicle}</span>
                </div>
              </div>

              {/* Photo Evidence in Slip */}
              {selectedDelivery.delivery_evidence_image && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>រូបភាពភស្តុតាងប្រគល់ទំនិញ (Proof of Delivery Photo)</span>
                  </div>
                  <div className="w-full max-h-48 rounded-xl overflow-hidden border border-emerald-300">
                    <img 
                      src={resolveAssetUrl(selectedDelivery.delivery_evidence_image)} 
                      alt="Delivery Evidence" 
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    {selectedDelivery.delivery_evidence_time && `កាលបរិច្ឆេទថត៖ ${new Date(selectedDelivery.delivery_evidence_time).toLocaleString()}`}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">មុខទំនិញត្រូវដឹក៖</span>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {selectedDelivery.order_items?.map((it, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{it.product_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{it.quantity}x • ${it.unit_price.toFixed(2)}</div>
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">${it.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>តម្លៃទំនិញ៖</span>
                  <span className="font-mono font-bold">${(selectedDelivery.subtotal || selectedDelivery.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>សេវាដឹកជញ្ជូន៖</span>
                  <span className="font-mono font-bold">{selectedDelivery.shipping_fee === 0 ? '$0.00 (Free)' : `$${(selectedDelivery.shipping_fee || 0).toFixed(2)}`}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                  <span>សរុបត្រូវប្រមូល៖</span>
                  <div className="text-right">
                    <span className="text-orange-600 font-mono block">${selectedDelivery.total_amount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">≈ {formatDualPrice(selectedDelivery.total_amount).khr}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center space-x-1.5 text-slate-700 dark:text-slate-200"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="py-2 px-5 bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                {t.close}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Full-Size Image Preview Modal */}
      {previewImageModal && (
        <div 
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center">
            <button 
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-rose-400 bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={resolveAssetUrl(previewImageModal)} 
              alt="Full Evidence Preview" 
              onError={handleImageError}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <div className="text-white text-xs font-bold mt-3 bg-black/60 px-4 py-1.5 rounded-full">
              📸 រូបភាពភស្តុតាងប្រគល់ទំនិញ (Proof of Delivery Evidence)
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
