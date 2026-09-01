import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import confetti from 'canvas-confetti';
import { 
  X, Search, Truck, CheckCircle2, Clock, PackageCheck, 
  MapPin, Phone, MessageSquare, AlertCircle, ShoppingBag, 
  ArrowRight, ShieldCheck, ChevronRight, RefreshCw, Sparkles, User,
  Camera, Eye, Image as ImageIcon, ClipboardList, CheckSquare,
  ArrowLeft, FileText, ChevronDown, DollarSign, Calendar
} from 'lucide-react';

export const OrderTrackingModal = () => {
  const { 
    isTrackingOpen, 
    setIsTrackingOpen, 
    orders, 
    customerProfile, 
    activeTrackingOrderId, 
    setActiveTrackingOrderId, 
    confirmOrderDelivery, 
    trackingActiveTab,
    setTrackingActiveTab,
    formatPrice, 
    formatDualPrice, 
    lang, 
    t 
  } = useStore();

  const [searchInput, setSearchInput] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Find relevant customer orders (by active tracking ID, registered phone, or matching search)
  const customerPhone = customerProfile?.phone?.replace(/\s+/g, '') || '';

  // Get matching orders matching search or logged in customer profile
  const myOrders = orders.filter(o => {
    if (activeTrackingOrderId && o.id === activeTrackingOrderId) {
      return true;
    }
    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      const cleanPhone = (o.customer_phone || '').replace(/\s+/g, '').toLowerCase();
      return (o.id || '').toLowerCase().includes(q) || cleanPhone.includes(q) || (o.customer_name || '').toLowerCase().includes(q);
    }
    if (customerPhone) {
      const cleanPhone = (o.customer_phone || '').replace(/\s+/g, '');
      return cleanPhone === customerPhone;
    }
    return false;
  });

  // Filter orders by active vs history
  const activeOrders = myOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const historyOrders = myOrders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  // Total statistics for history orders
  const totalHistorySpent = historyOrders.reduce((sum, o) => sum + (o.status === 'completed' ? o.total_amount : 0), 0);

  // Default selected order based on tracking mode and active tab
  useEffect(() => {
    if (isTrackingOpen) {
      if (activeTrackingOrderId) {
        setSelectedOrderId(activeTrackingOrderId);
      } else if (trackingActiveTab === 'active' && activeOrders.length > 0) {
        setSelectedOrderId(activeOrders[0].id);
      } else if (trackingActiveTab === 'history' && historyOrders.length > 0) {
        setSelectedOrderId(historyOrders[0].id);
      }
    }
  }, [isTrackingOpen, activeTrackingOrderId, trackingActiveTab, activeOrders.length, historyOrders.length]);

  if (!isTrackingOpen) return null;

  const currentOrder = trackingActiveTab === 'history' && selectedHistoryOrder
    ? selectedHistoryOrder
    : (orders.find(o => o.id === selectedOrderId) || activeOrders[0] || myOrders[0] || orders[0]);

  // Delivery Stages calculation (1 to 4)
  const getStageNumber = (status) => {
    switch (status) {
      case 'completed': return 4;
      case 'shipped': return 3;
      case 'paid': return 2;
      case 'pending': return 1;
      case 'cancelled': return 0;
      default: return 1;
    }
  };

  const currentStage = currentOrder ? getStageNumber(currentOrder.status) : 1;

  const handleConfirmReceived = (orderId) => {
    setIsConfirming(true);
    setTimeout(() => {
      confirmOrderDelivery(orderId, 'customer');
      setIsConfirming(false);
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.55 }
        });
      } catch (e) {
        console.error(e);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <span>{lang === 'km' ? 'តាមដានការដឹក & ប្រវត្តិទិញ' : 'Order Tracking & History'}</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  V8 Mini Mart
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'km' ? 'ពិនិត្យមើលដំណាក់កាលដឹកទំនិញ និងបញ្ជីដែលធ្លាប់បានបញ្ជាទិញរួច' : 'Check live delivery tracking and view your completed purchase history'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTrackingOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Dynamic Tab Switcher */}
        <div className="p-4 sm:px-6 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
          
          {/* Active vs History Tab Buttons */}
          <div className="grid grid-cols-2 gap-2 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => {
                setTrackingActiveTab('active');
                setSelectedHistoryOrder(null);
                setSearchInput('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition ${
                trackingActiveTab === 'active'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{lang === 'km' ? `កំពុងដឹកជញ្ជូន (${activeOrders.length})` : `Active Delivery (${activeOrders.length})`}</span>
            </button>

            <button
              onClick={() => {
                setTrackingActiveTab('history');
                setSelectedHistoryOrder(null);
                setSearchInput('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition ${
                trackingActiveTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{lang === 'km' ? `ប្រវត្តិទិញទំនិញ (${historyOrders.length})` : `Purchase History (${historyOrders.length})`}</span>
            </button>
          </div>

          {/* Search text box and My Data button removed per user request */}

          {/* Quick order selector tabs (Only for Active tracking mode) */}
          {trackingActiveTab === 'active' && activeOrders.length > 1 && (
            <div className="flex items-center space-x-2 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                {lang === 'km' ? 'ជ្រើសរើស Order៖' : 'Select Order:'}
              </span>
              {activeOrders.slice(0, 6).map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`px-2.5 py-1 text-xs rounded-xl font-mono whitespace-nowrap transition ${
                    selectedOrderId === o.id
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-350'
                  }`}
                >
                  {o.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* CASE A: PURCHASE HISTORY LIST VIEW (NEW, VERY BEAUTIFUL & PREMIUM!) */}
          {trackingActiveTab === 'history' && !selectedHistoryOrder ? (
            <div className="space-y-4">
              
              {/* Statistics Summary Header */}
              {historyOrders.length > 0 && (
                <div className="bg-slate-100/80 dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                  <div className="text-center border-r border-slate-200 dark:border-slate-750">
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-350 block uppercase">
                      {lang === 'km' ? 'កុម្ម៉ង់សរុប' : 'Total Orders'}
                    </span>
                    <span className="text-xl font-black text-slate-850 dark:text-white font-mono mt-1 block">
                      {historyOrders.length} ដង
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 block uppercase">
                      {lang === 'km' ? 'ចំណាយសរុប' : 'Total Spent'}
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                      ${totalHistorySpent.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Purchase History List Card Items */}
              {historyOrders.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <ClipboardList className="w-14 h-14 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {lang === 'km' ? 'មិនទាន់មានប្រវត្តិទិញទំនិញចាស់ៗទេ' : 'No purchase history found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {historyOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-750 shadow-soft p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition"
                    >
                      {/* Left Side: Order Details & Products */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {order.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                          
                          {order.status === 'completed' ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'km' ? 'ជោគជ័យ' : 'Success'}</span>
                            </span>
                          ) : (
                            <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                              {lang === 'km' ? 'បានបោះបង់' : 'Cancelled'}
                            </span>
                          )}
                        </div>

                        {/* List items preview with thumbnails inside a horizontal scroll */}
                        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
                          {order.order_items?.map((it, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-1 rounded-xl flex-shrink-0 text-[11px]"
                            >
                              <img 
                                src={it.product_image} 
                                alt={it.product_name} 
                                className="w-5 h-5 rounded-md object-cover bg-white"
                              />
                              <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                {it.quantity}x {it.product_name}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Evidence Photo Thumbnail (If Driver uploaded one) */}
                        {order.delivery_evidence_image && (
                          <div className="flex items-center space-x-2 pt-1">
                            <span className="text-[10px] text-slate-450 font-bold flex items-center space-x-1">
                              <Camera className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lang === 'km' ? 'រូបភាពភស្តុតាងប្រគល់៖' : 'Delivery Evidence:'}</span>
                            </span>
                            <div 
                              onClick={() => setPreviewImageModal(order.delivery_evidence_image)}
                              className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/30 cursor-pointer hover:scale-105 transition"
                            >
                              <img 
                                src={order.delivery_evidence_image} 
                                alt="Evidence" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Totals & Details Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 gap-2">
                        <div className="text-left sm:text-right">
                          <span className="font-mono text-sm sm:text-base font-black text-slate-800 dark:text-white block">
                            {formatPrice(order.total_amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ≈ {formatDualPrice(order.total_amount).khr}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedHistoryOrder(order)}
                          className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[11px] rounded-xl flex items-center space-x-1 shadow-xs transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{lang === 'km' ? 'មើលលម្អិត' : 'View Detail'}</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <ShoppingBag className="w-14 h-14 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">{lang === 'km' ? 'មិនទាន់មានការដឹកជញ្ជូនកំពុងដំណើរការទេ' : 'No active deliveries found'}</p>
            </div>
          ) : (
            
            // CASE B: SINGLE ORDER DETAIL TRACKING & TIMELINE VIEW (ACTIVE OR SELECTED HISTORY ORDER)
            <div className="space-y-6 animate-fade-in">
              
              {/* Back to History List Button (If viewing selected history order detail) */}
              {trackingActiveTab === 'history' && selectedHistoryOrder && (
                <button
                  onClick={() => setSelectedHistoryOrder(null)}
                  className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs rounded-xl flex items-center space-x-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'km' ? '➔ ត្រឡប់ទៅបញ្ជីប្រវត្តិវិញ' : '➔ Back to History List'}</span>
                </button>
              )}

              {/* 1. Live Order Card Header (Beautiful Emerald Green Gradient per User Request) */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-base sm:text-lg font-black tracking-wider bg-black/20 px-2.5 py-0.5 rounded-xl border border-white/20">
                        {currentOrder.id}
                      </span>
                      {currentOrder.is_in_borey_the_flora && (
                        <span className="bg-emerald-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/30">
                          🏡 បុរី The Flora (Free)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-100 mt-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 inline" />
                      <span>{new Date(currentOrder.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-emerald-100 block">{lang === 'km' ? 'ទឹកប្រាក់សរុប' : 'Total Amount'}</span>
                    <span className="text-xl sm:text-2xl font-black font-mono leading-none">
                      {formatPrice(currentOrder.total_amount)}
                    </span>
                    <span className="text-[11px] text-emerald-100 block mt-0.5">
                      ≈ {formatDualPrice(currentOrder.total_amount).khr}
                    </span>
                  </div>
                </div>

                {/* Current Stage Status Banner */}
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-between border border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs sm:text-sm font-black">
                      {currentOrder.status === 'completed' && (lang === 'km' ? '✅ បានប្រគល់ទំនិញជោគជ័យ (Delivered)' : '✅ Order Delivered Successfully')}
                      {currentOrder.status === 'shipped' && (lang === 'km' ? '🚚 កំពុងធ្វើដំណើរដឹកជូន (Out for Delivery)' : '🚚 Out for Delivery')}
                      {currentOrder.status === 'paid' && (lang === 'km' ? '📦 បានទូទាត់ & កំពុងវេចខ្ចប់ (Packing Items)' : '📦 Paid & Preparing for Shipment')}
                      {currentOrder.status === 'pending' && (lang === 'km' ? '⏱️ បានកុម្ម៉ង់ រង់ចាំការវេចខ្ចប់ (Order Placed)' : '⏱️ Order Placed (Pending Prep)')}
                      {currentOrder.status === 'cancelled' && (lang === 'km' ? '❌ ការកុម្ម៉ង់ត្រូវបានបោះបង់ (Cancelled)' : '❌ Order Cancelled')}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white text-emerald-700 px-2.5 py-0.5 rounded-full shadow-xs">
                    {currentOrder.payment_method.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* 2. 4-Stage Visual Progress (Skip if cancelled) */}
              {currentOrder.status !== 'cancelled' && (
                <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {lang === 'km' ? 'ដំណាក់កាលដឹកជញ្ជូន (Delivery Progress):' : 'Delivery Progress Timeline:'}
                  </div>

                  <div className="relative py-2">
                    {/* Background line (connecting centers of the circles) */}
                    <div className="absolute top-[26px] left-[12.5%] right-[12.5%] h-1 bg-slate-200 dark:bg-slate-700 -z-0 rounded-full" />
                    
                    {/* Active progress line */}
                    <div 
                      className="absolute top-[26px] left-[12.5%] h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 -z-0 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      style={{ 
                        width: currentStage === 4 ? '75%' : (currentStage === 3 ? '50%' : (currentStage === 2 ? '25%' : '0%')) 
                      }}
                    />

                    <div className="grid grid-cols-4 relative z-10 text-center">
                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center space-y-2 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          currentStage > 1 
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40 shadow-md' 
                            : currentStage === 1 
                              ? 'bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950/60 animate-pulse shadow-md scale-110' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className={`text-[11px] sm:text-xs block font-bold ${
                            currentStage >= 1 
                              ? currentStage === 1 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {lang === 'km' ? 'បានកុម្ម៉ង់' : 'Placed'}
                          </span>
                          <span className={`text-[9px] block font-medium ${
                            currentStage >= 1 
                              ? currentStage === 1 ? 'text-sky-500/80 dark:text-sky-400/60' : 'text-emerald-500/80 dark:text-emerald-400/60' 
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {lang === 'km' ? 'រៀបចំរួច' : 'Success'}
                          </span>
                        </div>
                      </div>

                      {/* Step 2: Packing */}
                      <div className="flex flex-col items-center space-y-2 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          currentStage > 2 
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40 shadow-md' 
                            : currentStage === 2 
                              ? 'bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950/60 animate-pulse shadow-md scale-110' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <PackageCheck className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className={`text-[11px] sm:text-xs block font-bold ${
                            currentStage >= 2 
                              ? currentStage === 2 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {lang === 'km' ? 'វេចខ្ចប់' : 'Packing'}
                          </span>
                          <span className={`text-[9px] block font-medium ${
                            currentStage >= 2 
                              ? currentStage === 2 ? 'text-sky-500/80 dark:text-sky-400/60' : 'text-emerald-500/80 dark:text-emerald-400/60' 
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {lang === 'km' ? 'កំពុងរៀបចំ' : 'Preparing'}
                          </span>
                        </div>
                      </div>

                      {/* Step 3: On The Way */}
                      <div className="flex flex-col items-center space-y-2 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          currentStage > 3 
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40 shadow-md' 
                            : currentStage === 3 
                              ? 'bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950/60 animate-pulse shadow-md scale-110' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className={`text-[11px] sm:text-xs block font-bold ${
                            currentStage >= 3 
                              ? currentStage === 3 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {lang === 'km' ? 'កំពុងដឹក' : 'On The Way'}
                          </span>
                          <span className={`text-[9px] block font-medium ${
                            currentStage >= 3 
                              ? currentStage === 3 ? 'text-sky-500/80 dark:text-sky-400/60' : 'text-emerald-500/80 dark:text-emerald-400/60' 
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {lang === 'km' ? 'កំពុងដឹកជូន' : 'Out for Delivery'}
                          </span>
                        </div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center space-y-2 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          currentStage >= 4 
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40 shadow-md scale-110 animate-pulse-slow' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className={`text-[11px] sm:text-xs block font-bold ${
                            currentStage >= 4 
                              ? 'text-emerald-600 dark:text-emerald-400 font-black' 
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {lang === 'km' ? 'បានទទួល' : 'Delivered'}
                          </span>
                          <span className={`text-[9px] block font-medium ${
                            currentStage >= 4 
                              ? 'text-emerald-500/80 dark:text-emerald-400/60' 
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {lang === 'km' ? 'ដល់ដៃអតិថិជន' : 'Success'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* 3. PROOF OF DELIVERY EVIDENCE PHOTO CARD */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border-2 border-emerald-500/30 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {lang === 'km' ? '📸 ភស្តុតាងប្រគល់ទំនិញពីអ្នកដឹក (Proof of Delivery)' : '📸 Proof of Delivery Photo'}
                    </span>
                  </div>
                  {currentOrder.delivery_evidence_image && (
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      ✓ Evidence Uploaded
                    </span>
                  )}
                </div>

                {currentOrder.delivery_evidence_image ? (
                  <div className="space-y-3">
                    <div 
                      onClick={() => setPreviewImageModal(currentOrder.delivery_evidence_image)}
                      className="w-full max-h-64 sm:max-h-72 rounded-2xl overflow-hidden border-2 border-emerald-500/40 relative cursor-pointer group shadow-md"
                    >
                      <img 
                        src={currentOrder.delivery_evidence_image} 
                        alt="Proof of Delivery" 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-4 text-white">
                        <div className="flex items-center space-x-1.5 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{lang === 'km' ? 'រូបភាពថតដោយអ្នកដឹក (Driver Evidence)' : 'Photo Captured by Driver'}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-black/50 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'km' ? 'ចុចពង្រីកមើល' : 'Zoom'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                      <div>
                        <span className="font-bold">{lang === 'km' ? 'ប្រគល់នៅម៉ោង៖ ' : 'Delivered at: '}</span>
                        <span>{currentOrder.delivery_evidence_time ? new Date(currentOrder.delivery_evidence_time).toLocaleString() : 'Verified'}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                        Evidence Sync
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-350 dark:border-slate-700 text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                      {lang === 'km' 
                        ? 'រង់ចាំអ្នកដឹកជញ្ជូន (Driver) ថតរូបភាពទំនិញនៅពេលប្រគល់ជូនដល់មុខផ្ទះ'
                        : 'Waiting for delivery driver to take and upload a proof photo.'}
                    </p>
                  </div>
                )}

                {/* 3.1 CONFIRM RECEIVED ACTION BUTTON */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  {currentOrder.status !== 'completed' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {lang === 'km'
                          ? 'នៅពេលអ្នកដឹកជញ្ជូន (Driver) បានយកទំនិញមកដល់មុខផ្ទះលោកអ្នករួចរាល់ សូមចុចប៊ូតុងខាងក្រោមដើម្បីបញ្ជាក់ការទទួលទំនិញ៖'
                          : 'When the delivery driver arrives and hands over your items, please tap the button below to confirm receipt:'}
                      </p>
                      <button
                        onClick={() => handleConfirmReceived(currentOrder.id)}
                        disabled={isConfirming}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                      >
                        <CheckSquare className="w-5 h-5" />
                        <span>
                          {isConfirming 
                            ? (lang === 'km' ? 'កំពុងបញ្ជាក់...' : 'Confirming...') 
                            : (lang === 'km' ? '✅ ខ្ញុំបានទទួលអីវ៉ាន់រួចរាល់ (Confirm Received)' : '✅ I Have Received My Order')}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                      <div className="font-black flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>
                          {lang === 'km' ? '🎉 អរគុណ! ការកុម្ម៉ង់ត្រូវបានប្រគល់ និងទទួលរួចរាល់ ១០០%' : '🎉 Thank you! Order has been fully delivered & confirmed.'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                        {currentOrder.delivered_at 
                          ? `${lang === 'km' ? 'កាលបរិច្ឆេទទទួល៖ ' : 'Received on: '} ${new Date(currentOrder.delivered_at).toLocaleString()}` 
                          : (lang === 'km' ? 'ទទួលបានទំនិញដោយជោគជ័យ' : 'Delivered successfully')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Delivery & Customer Destination Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {lang === 'km' ? 'ព័ត៌មានអ្នកទទួល (Recipient)' : 'Customer Details'}
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{currentOrder.customer_name}</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentOrder.customer_phone}</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {lang === 'km' ? 'អាសយដ្ឋានដឹកជញ្ជូន (Destination)' : 'Shipping Destination'}
                  </span>
                  <p className="text-slate-900 dark:text-slate-100 font-medium flex items-start space-x-1">
                    <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span>{currentOrder.shipping_address}, {currentOrder.city_province}</span>
                  </p>
                  {currentOrder.is_in_borey_the_flora && (
                    <span className="inline-block text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full mt-1">
                      🏡 បុរី The Flora (Free Delivery)
                    </span>
                  )}
                </div>
              </div>

              {/* 5. Items in this order */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {lang === 'km' ? 'ទំនិញដែលបានកុម្ម៉ង់ (Order Items):' : 'Purchased Items:'}
                </span>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {currentOrder.order_items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={item.product_image} 
                          alt={item.product_name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.product_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.quantity}x • ${item.unit_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ${item.total_price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{lang === 'km' ? 'តម្លៃទំនិញ (Subtotal)៖' : 'Subtotal:'}</span>
                    <span className="font-mono font-bold">${(currentOrder.subtotal || currentOrder.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{lang === 'km' ? 'សេវាដឹកជញ្ជូន (Delivery Fee)៖' : 'Delivery Fee:'}</span>
                    <span className={`font-mono font-bold ${currentOrder.shipping_fee === 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {currentOrder.shipping_fee === 0 ? '$0.00 (Free 🎉)' : `$${(currentOrder.shipping_fee || 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline font-black text-slate-900 dark:text-white text-sm">
                    <span>{lang === 'km' ? 'សរុប (Total Paid)៖' : 'Grand Total:'}</span>
                    <div className="text-right">
                      <span className="text-orange-600 text-base font-mono block">${currentOrder.total_amount.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">≈ {formatDualPrice(currentOrder.total_amount).khr}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <button
            onClick={() => setIsTrackingOpen(false)}
            className="py-2.5 px-6 bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            {t.close}
          </button>
        </div>

      </div>

      {/* Full-Size Image Preview Modal for Customer */}
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
              src={previewImageModal} 
              alt="Full Evidence Preview" 
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
