import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import confetti from 'canvas-confetti';
import { 
  Truck, Search, CheckCircle2, Clock, Package, 
  MapPin, Phone, MessageSquare, AlertCircle, RefreshCw, 
  ExternalLink, Printer, User, Filter, ArrowRight, ShieldCheck,
  ChevronRight, Calendar, Sparkles, Navigation, X, AlertTriangle,
  Camera, Upload, Image as ImageIcon, Eye
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

  // Categorize orders for delivery tracking
  const activeDeliveries = orders.filter(o => o.status === 'shipped');
  const preparingOrders = orders.filter(o => o.status === 'paid' || o.status === 'pending');
  const deliveredOrders = orders.filter(o => o.status === 'completed');
  const floraDeliveries = orders.filter(o => o.is_in_borey_the_flora);

  // Filter logic
  const filteredOrders = orders.filter(o => {
    // Search query
    const q = search.toLowerCase();
    const matchSearch = (o.id || '').toLowerCase().includes(q) ||
                        (o.customer_name || '').toLowerCase().includes(q) ||
                        (o.customer_phone || '').toLowerCase().includes(q) ||
                        (o.shipping_address || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    // Filter tab
    if (filterTab === 'preparing') return o.status === 'pending' || o.status === 'paid';
    if (filterTab === 'shipped') return o.status === 'shipped';
    if (filterTab === 'delivered') return o.status === 'completed';
    if (filterTab === 'flora') return o.is_in_borey_the_flora;
    if (filterTab === 'outside') return !o.is_in_borey_the_flora;
    return true;
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

      {/* 2. Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'km' ? 'ស្វែងរកតាមលេខ Order, ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ, ឬអាសយដ្ឋានដឹក...' : 'Search by Order ID, customer, phone, or address...'}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
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
              onClick={() => setFilterTab(tab.id)}
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

      {/* 3. Delivery Orders List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {lang === 'km' ? 'រកមិនឃើញការដឹកជញ្ជូនដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកនេះទេ' : 'No deliveries match your search filter'}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Card Top */}
              <div className="p-5 space-y-3.5">
                
                {/* Header: ID & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-lg border border-orange-200 dark:border-orange-900/50">
                      {order.id}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Customer & Destination */}
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
                    {order.order_items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="truncate max-w-[200px]">{it.quantity}x {it.product_name}</span>
                        <span className="font-mono font-bold">${(it.total_price || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROOF OF DELIVERY PHOTO EVIDENCE SECTION (NEW!) */}
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
                          src={order.delivery_evidence_image} 
                          alt="Delivery Evidence" 
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
                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center space-x-1"
                          >
                            <Camera className="w-3 h-3 text-emerald-600" />
                            <span>ថតថ្មី</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(order.id, false)}
                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center space-x-1"
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
                        className="flex-1 py-2 px-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lang === 'km' ? '📸 ថតរូបផ្ទាល់' : '📸 Snap Photo'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(order.id, false)}
                        className="flex-1 py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition"
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
                
                {/* 1-Click Status Dispatch Actions */}
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

                  {/* Secondary Quick Contact Buttons */}
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 transition"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>ខលភ្ញៀវ</span>
                  </a>

                  <button
                    onClick={() => setSelectedDelivery(order)}
                    className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 transition"
                  >
                    <ExternalLink className="w-3 h-3 text-orange-600" />
                    <span>លម្អិត & Print</span>
                  </button>

                </div>

              </div>

            </div>
          ))
        )}
      </div>

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
                      src={selectedDelivery.delivery_evidence_image} 
                      alt="Delivery Evidence" 
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
