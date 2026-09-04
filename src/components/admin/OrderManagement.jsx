import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { resolveAssetUrl, handleImageError } from '../../utils/resolveAssetUrl';
import { 
  Search, Eye, Clock, CheckCircle2, Truck, 
  XCircle, AlertTriangle, Phone, MapPin, DollarSign, 
  User, RefreshCw, X, ArrowUpDown, TrendingUp, Receipt,
  Calendar, ArrowRight
} from 'lucide-react';

export const OrderManagement = () => {
  const { 
    orders, 
    updateOrderStatus, 
    formatPrice, 
    formatDualPrice,
    lang, 
    t 
  } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'price_high'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const filteredOrders = orders.filter(o => {
    const query = search.toLowerCase();
    const matchSearch = (o.id || '').toLowerCase().includes(query) ||
                        (o.customer_name || '').toLowerCase().includes(query) ||
                        (o.customer_phone || '').toLowerCase().includes(query);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    if (!matchSearch || !matchStatus) return false;

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black px-3 py-1 rounded-full uppercase">PAID (បានទូទាត់)</span>;
      case 'shipped':
        return <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-black px-3 py-1 rounded-full uppercase">SHIPPED (កំពុងដឹក)</span>;
      case 'completed':
        return <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-black px-3 py-1 rounded-full uppercase">COMPLETED (ជោគជ័យ)</span>;
      case 'cancelled':
        return <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-black px-3 py-1 rounded-full uppercase">CANCELLED (បានបោះបង់)</span>;
      case 'pending':
      default:
        return <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black px-3 py-1 rounded-full uppercase">PENDING (រង់ចាំ)</span>;
    }
  };

  const calculateOrderProfit = (order) => {
    const totalCost = (order.order_items || []).reduce((sum, item) => {
      const cost = parseFloat(item.cost_price) || (parseFloat(item.unit_price) * 0.7);
      return sum + (cost * (item.quantity || 1));
    }, 0);
    const subtotal = order.subtotal || order.total_amount || 0;
    const profit = Math.max(0, subtotal - totalCost);
    const margin = subtotal > 0 ? ((profit / subtotal) * 100).toFixed(1) : 0;
    return { totalCost, profit, margin };
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
      {/* Header & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {lang === 'km' ? 'គ្រប់គ្រងការបញ្ជាទិញ & ប្រាក់ចំណេញ (Orders & Profit)' : 'Order Management & Sales Profit'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'km' ? 'ផ្ទៀងផ្ទាត់ការទូទាត់ តាមដានការដឹក និងពិនិត្យមើលចំណេញលើ Order នីមួយៗ' : 'Track shipments, verify payments, and inspect realized profit per order'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកតាមលេខ Order, ឈ្មោះ, ឬលេខទូរស័ព្ទ...' : 'Search by Order ID, customer name or phone...'}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter orders by status in admin order management"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">Pending (រង់ចាំ)</option>
              <option value="paid">Paid (បានទូទាត់)</option>
              <option value="shipped">Shipped (កំពុងដឹក)</option>
              <option value="completed">Completed (បានបញ្ចប់)</option>
              <option value="cancelled">Cancelled (បានបោះបង់)</option>
            </select>
          </div>

          {/* Sort Order Selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort order selector in order management"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
            >
              <option value="newest">🆕 ថ្មីៗនៅខាងលើ (Newest First)</option>
              <option value="oldest">⏳ ចាស់ៗនៅខាងលើ (Oldest First)</option>
              <option value="price_high">💲 តម្លៃខ្ពស់មុន (Highest Price)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'km' ? '📅 តម្រងតាមកាលបរិច្ឆេទ (Date Filter):' : 'Date Filter:'}</span>
            </span>

            {dateFilter === 'custom' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-500 rounded-xl text-slate-800 dark:text-slate-100 outline-none shadow-xs"
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
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
        
        {/* COLOR HIGHLIGHT LEGEND BAR */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <span>🎨 ពណ៌សម្គាល់ជួរ (Status Highlight Legend):</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 font-bold text-[11px]">
            <span className="inline-flex items-center space-x-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-lg border-l-4 border-amber-500">
              <span>🟡 ថ្មី / វេចខ្ចប់ (New/Pending)</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 px-2.5 py-0.5 rounded-lg border-l-4 border-blue-500">
              <span>🔵 កំពុងដឹក (Shipped)</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg border-l-4 border-emerald-500">
              <span>🟢 បានប្រគល់ & ទូទាត់រួច (Paid/Completed)</span>
            </span>
            <span className="inline-flex items-center space-x-1 bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 px-2.5 py-0.5 rounded-lg border-l-4 border-rose-500">
              <span>🔴 បានបោះបង់ (Cancelled)</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-350 font-black uppercase text-xs tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-4 px-4 w-12 text-center whitespace-nowrap">#</th>
                <th className="py-4 px-4 whitespace-nowrap">Order ID</th>
                <th className="py-4 px-4 whitespace-nowrap">Date & Time</th>
                <th className="py-4 px-4 whitespace-nowrap">Customer</th>
                <th className="py-4 px-4 whitespace-nowrap">Total Amount</th>
                <th className="py-4 px-4 whitespace-nowrap">Cost vs Profit</th>
                <th className="py-4 px-4 whitespace-nowrap">Payment</th>
                <th className="py-4 px-4 whitespace-nowrap">Status</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-xs">
                    {t.noOrdersFound}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const { totalCost, profit, margin } = calculateOrderProfit(order);

                  return (
                    <tr key={order.id} className={`${getRowStatusColor(order.status)} transition-colors duration-150`}>
                      <td className={`py-4 px-4 font-mono font-black text-center whitespace-nowrap ${getRowIndexBadgeStyle(order.status)}`}>
                        #{idx + 1}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {order.id}
                      </td>

                      <td className="py-4 px-4 text-slate-550 dark:text-slate-400 text-sm whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{order.customer_name}</div>
                        <div className="text-sm text-slate-450 dark:text-slate-500 font-mono">{order.customer_phone}</div>
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900 dark:text-white font-mono whitespace-nowrap">
                        ${order.total_amount.toFixed(2)}
                      </td>

                      {/* Cost vs Profit column */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
                          ដើម: ${totalCost.toFixed(2)}
                        </div>
                        <span className="inline-flex items-center text-sm font-black text-emerald-700 dark:text-emerald-355 font-mono">
                          +{formatPrice(profit)} ({margin}%)
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="uppercase font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {order.payment_method}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-700 hover:text-white text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition shadow-xs cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Status Manager Modal */}
      {selectedOrder && (() => {
        const { totalCost, profit, margin } = calculateOrderProfit(selectedOrder);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">{selectedOrder.id}</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
                {/* Status Selector with Stock Restoration Notice */}
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-emerald-950 dark:text-emerald-200 block">
                      {lang === 'km' ? 'កែប្រែស្ថានភាព Order:' : 'Update Order Status:'}
                    </label>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                      Real-time Stock Auto Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['pending', 'paid', 'shipped', 'cancelled'].map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, st);
                          setSelectedOrder(prev => ({ ...prev, status: st }));
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold uppercase transition ${
                          selectedOrder.status === st
                            ? 'bg-slate-900 dark:bg-emerald-700 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Stock Return Alert Warning if Cancelled */}
                  {selectedOrder.status === 'cancelled' && (
                    <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span><strong>Stock Restored:</strong> All items in this order have been returned to warehouse inventory!</span>
                    </div>
                  )}
                </div>

                {/* Profit & Financial Breakdown Box for this Order */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">ដើមទុនទំនិញ (Cost)</span>
                    <span className="text-base font-black font-mono text-slate-700 dark:text-slate-200">${totalCost.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">ចំណូលទំនិញ (Subtotal)</span>
                    <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">${(selectedOrder.subtotal || selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-bold">ចំណេញសុទ្ធ (Profit)</span>
                    <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">+${profit.toFixed(2)} ({margin}%)</span>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-750">
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Customer Info</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{selectedOrder.customer_name}</p>
                    <p className="font-mono text-slate-500">{selectedOrder.customer_phone}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-750">
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Shipping Destination</span>
                    <p className="text-slate-800 dark:text-slate-100">{selectedOrder.shipping_address}</p>
                    <p className="text-slate-550 dark:text-slate-450">{selectedOrder.city_province}</p>
                  </div>
                </div>

                {/* Order Items Table */}
                <div>
                  <span className="text-sm font-black text-slate-850 dark:text-slate-250 block mb-2">Order Items:</span>
                  <div className="border border-slate-200 dark:border-slate-750 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {selectedOrder.order_items.map((item, idx) => {
                      const itemCost = parseFloat(item.cost_price) || (parseFloat(item.unit_price) * 0.7);
                      const itemProfit = (parseFloat(item.unit_price) - itemCost) * item.quantity;

                      return (
                        <div key={idx} className="p-3 flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-3">
                            <img src={resolveAssetUrl(item.product_image)} alt={item.product_name} onError={handleImageError} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{item.product_name}</div>
                              <div className="text-xs text-slate-450 dark:text-slate-500 font-mono">
                                {item.sku} • {item.quantity} x ${item.unit_price.toFixed(2)} 
                                <span className="ml-1 text-slate-450">(ដើម: ${itemCost.toFixed(2)})</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 dark:text-white font-mono block">${item.total_price.toFixed(2)}</span>
                            <span className="text-xs text-emerald-600 font-mono font-bold">ចំណេញ: +${itemProfit.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtotal, Shipping Fee, Remarks & Grand Total */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{lang === 'km' ? 'តម្លៃទំនិញ (Subtotal)៖' : 'Items Subtotal:'}</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">${(selectedOrder.subtotal || selectedOrder.total_amount).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>{lang === 'km' ? 'សេវាដឹកជញ្ជូន (Delivery)៖' : 'Delivery Fee:'}</span>
                    <span className={`font-bold font-mono ${selectedOrder.shipping_fee === 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {selectedOrder.shipping_fee === 0 ? '$0.00 (Free 🎉)' : `$${(selectedOrder.shipping_fee || 0).toFixed(2)} (≈ 6,000 ៛)`}
                    </span>
                  </div>

                  {/* Evidence Photo if present */}
                  {selectedOrder.delivery_evidence_image && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                        <span>📸 រូបភាពភស្តុតាងប្រគល់ទំនិញ (Proof of Delivery)</span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-full">Verified</span>
                      </div>
                      <div className="w-full max-h-48 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-700">
                        <img src={resolveAssetUrl(selectedOrder.delivery_evidence_image)} alt="Evidence" onError={handleImageError} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-start space-x-1.5">
                    <span className="font-bold flex-shrink-0">📌 {lang === 'km' ? 'សម្គាល់ដឹក៖' : 'Delivery Note:'}</span>
                    <span>
                      {selectedOrder.delivery_remarks || (selectedOrder.is_in_borey_the_flora ? 'ដឹកជញ្ជូនឥតគិតថ្លៃ (ក្នុងបុរី The Flora)' : 'សេវាដឹកជញ្ជូន 6,000 ៛ (ក្រៅបុរី The Flora)')}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-between items-baseline border-t border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <div className="text-right">
                      <span className="text-emerald-600 dark:text-emerald-400 text-base">${selectedOrder.total_amount.toFixed(2)}</span>
                      <div className="text-[10px] font-normal text-slate-400">≈ {formatDualPrice(selectedOrder.total_amount).khr}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
