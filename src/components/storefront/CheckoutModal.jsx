import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import confetti from 'canvas-confetti';
import { 
  X, CheckCircle2, QrCode, Banknote, 
  Truck, ArrowLeft, ArrowRight, ShieldCheck, MapPin, 
  Phone, User, Printer, ShoppingBag, Clock, Sparkles, AlertCircle, Home, Wallet
} from 'lucide-react';

export const CheckoutModal = () => {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    cart, 
    cartSubtotal, 
    shippingFee, 
    cartTotal, 
    isInBoreyTheFlora,
    setIsInBoreyTheFlora,
    STANDARD_DELIVERY_KHR = 6000,
    formatPrice, 
    formatDualPrice,
    checkoutOrder, 
    customerProfile,
    deductCredit,
    setIsTrackingOpen,
    setActiveTrackingOrderId,
    confirmOrderDelivery,
    lang, 
    t 
  } = useStore();

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success Confirmation
  const [formData, setFormData] = useState({
    name: customerProfile?.fullName || 'Sokha Meng',
    phone: customerProfile?.phone || '012 888 777',
    address: customerProfile?.address || 'No 45, Street 271, Sangkat Toul Tumpoung',
    city: 'Phnom Penh',
    notes: customerProfile?.googleMapsUrl ? `Maps: ${customerProfile.googleMapsUrl}` : 'Please call before arrival'
  });

  useEffect(() => {
    if (customerProfile && customerProfile.isRegistered) {
      setFormData(prev => ({
        ...prev,
        name: customerProfile.fullName || prev.name,
        phone: customerProfile.phone || prev.phone,
        address: customerProfile.address || prev.address,
        notes: customerProfile.googleMapsUrl ? `Maps: ${customerProfile.googleMapsUrl}` : prev.notes
      }));
    }
  }, [customerProfile, isCheckoutOpen]);

  const [paymentMethod, setPaymentMethod] = useState('khqr'); // 'khqr' | 'card' | 'cod'
  const [cardData, setCardData] = useState({
    number: '•••• •••• •••• 4242',
    name: 'SOKHA MENG',
    expiry: '12/28',
    cvv: '888'
  });
  const [qrTimer, setQrTimer] = useState(600); // 10 minutes countdown for KHQR
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // KHQR Timer countdown
  useEffect(() => {
    let timer;
    if (step === 2 && paymentMethod === 'khqr' && qrTimer > 0) {
      timer = setInterval(() => setQrTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, paymentMethod, qrTimer]);

  if (!isCheckoutOpen) return null;

  const { usd, khr } = formatDualPrice(cartTotal);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      setErrorMessage(lang === 'km' ? 'សូមបំពេញព័ត៌មានដឹកជញ្ជូនឱ្យបានគ្រប់គ្រាន់' : 'Please fill all required shipping fields');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleExecuteCheckout = (isSimulatedPay = false) => {
    setIsProcessing(true);
    setErrorMessage('');

    setTimeout(() => {
      const result = checkoutOrder(formData, paymentMethod);
      setIsProcessing(false);

      if (result.success) {
        setCompletedOrder(result.order);
        setStep(3);
        // Trigger celebratory confetti!
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
        setErrorMessage(result.message);
      }
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-black text-lg text-slate-900">{t.checkout}</h3>
            <p className="text-xs text-slate-500">V8 Mini Mart Express Checkout</p>
          </div>
          {step !== 3 && (
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Multi-Step Wizard Indicator */}
        <div className="px-6 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Step 1 */}
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step > 1 ? 'bg-emerald-500 text-white' : (step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200')
              }`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs hidden sm:inline">{lang === 'km' ? 'ព័ត៌មានដឹកជញ្ជូន' : 'Shipping'}</span>
            </div>

            <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

            {/* Step 2 */}
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step > 2 ? 'bg-emerald-500 text-white' : (step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200')
              }`}>
                {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-xs hidden sm:inline">{lang === 'km' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment'}</span>
            </div>

            <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 3 */}
            <div className={`flex items-center space-x-2 ${step === 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200'
              }`}>
                {step === 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <span className="text-xs hidden sm:inline">{lang === 'km' ? 'វិក្កយបត្រជោគជ័យ' : 'Confirmation'}</span>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: SHIPPING INFO ================= */}
          {step === 1 && (
            <form onSubmit={handleNextToPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1.5">
                    {t.customerName} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-4 top-[14px] text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 text-sm font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1.5">
                    {t.customerPhone} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-4 top-[14px] text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 text-sm font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 outline-none font-mono transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-800 mb-1.5">
                  {t.address} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-4 top-[14px] text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 text-sm font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* BOREY THE FLORA FREE DELIVERY CHECKBOX */}
              <div 
                onClick={() => setIsInBoreyTheFlora(!isInBoreyTheFlora)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isInBoreyTheFlora 
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <label className="flex items-start space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInBoreyTheFlora}
                    onChange={(e) => setIsInBoreyTheFlora(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 mt-0.5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                        <span>🏡 {lang === 'km' ? 'ខ្ញុំនៅក្នុងបុរី The Flora' : 'I live in Borey The Flora'}</span>
                      </span>
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        isInBoreyTheFlora 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isInBoreyTheFlora ? (lang === 'km' ? '✨ Free Delivery' : '✨ Free Delivery') : '+6,000 ៛'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {isInBoreyTheFlora
                        ? (lang === 'km' ? '🎉 ដឹកជញ្ជូនឥតគិតថ្លៃ (Free 0 ៛) ដល់មុខផ្ទះក្នុងបុរី The Flora' : '🎉 Free delivery (0 KHR) to your home in Borey The Flora')
                        : (lang === 'km' ? '🚚 សេវាដឹកជញ្ជូន 6,000 ៛ សម្រាប់ទីតាំងក្រៅបុរី The Flora' : '🚚 Standard delivery fee 6,000 KHR for locations outside Borey The Flora')}
                    </p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1.5">
                    {t.cityProvince}
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3.5 text-sm font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 outline-none transition-all"
                  >
                    <option value="Phnom Penh">Phnom Penh (រាជធានីភ្នំពេញ)</option>
                    <option value="Kandal">Kandal (ខេត្តកណ្តាល)</option>
                    <option value="Siem Reap">Siem Reap (ខេត្តសៀមរាប)</option>
                    <option value="Battambang">Battambang (ខេត្តបាត់ដំបង)</option>
                    <option value="Sihanoukville">Sihanoukville (ខេត្តព្រះសីហនុ)</option>
                    <option value="Kampot">Kampot (ខេត្តកំពត)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1.5">
                    {t.orderNotes}
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Gate code, landmark, etc."
                    className="w-full px-4 py-3.5 text-sm font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Order Items Preview summary & Clear Breakdown with Remarks */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Order Summary ({cart.length} items):</span>
                  <span className="text-[11px] text-slate-500 font-mono">{formatPrice(cartSubtotal)}</span>
                </div>

                <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-slate-600 divide-y divide-slate-100">
                  {cart.map(item => (
                    <div key={item.id} className="pt-1 flex justify-between items-center">
                      <span className="truncate max-w-[260px]">
                        {item.quantity}x {lang === 'km' ? item.product_title_kh : item.product_title_en}
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotal, Shipping, and Total lines */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{lang === 'km' ? 'តម្លៃទំនិញ (Subtotal)៖' : 'Items Subtotal:'}</span>
                    <span className="font-bold font-mono text-slate-800">{formatPrice(cartSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">{lang === 'km' ? 'សេវាដឹកជញ្ជូន (Delivery Fee)៖' : 'Delivery Fee:'}</span>
                    <span className={`font-black font-mono ${isInBoreyTheFlora ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isInBoreyTheFlora 
                        ? (lang === 'km' ? '0 ៛ (Free 🎉)' : '0 KHR (Free 🎉)') 
                        : formatPrice(shippingFee)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black text-slate-900">
                    <span className="text-xs sm:text-sm">{lang === 'km' ? 'សរុបត្រូវទូទាត់ (Total Payable)៖' : 'Total Payable:'}</span>
                    <div className="text-right">
                      <span className="text-base sm:text-lg text-emerald-600 font-mono block leading-none">{formatPrice(cartTotal)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">≈ {formatDualPrice(cartTotal).khr}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Remarks Box */}
                <div className="p-2.5 rounded-xl bg-emerald-50/85 border border-emerald-200 text-[11px] text-emerald-950 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="leading-relaxed">
                    <span className="font-black">{lang === 'km' ? '📌 កំណត់សម្គាល់ (Remarks)៖ ' : '📌 Remarks: '}</span>
                    <span>
                      {isInBoreyTheFlora
                        ? (lang === 'km' ? 'អតិថិជននៅក្នុងបុរី The Flora ទទួលបានការដឹកជញ្ជូនឥតគិតថ្លៃ (Free Delivery 0 ៛)។ តម្លៃទំនិញ និងតម្លៃសរុបស្មើគ្នា ១០០%!' : 'Customers in Borey The Flora get 100% Free Delivery (0 KHR). Total payable equals items price!')
                        : (lang === 'km' ? 'ទីតាំងក្រៅបុរី The Flora គិតថ្លៃសេវាដឹកជញ្ជូន 6,000 ៛។' : 'Standard 6,000 KHR delivery fee applied for outside Borey The Flora.')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition active:scale-98"
                >
                  <span>{t.continueToPayment}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: PAYMENT METHOD (KHQR / CARD / COD) ================= */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Payment Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('khqr')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                    paymentMethod === 'khqr'
                      ? 'border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-rose-600" />
                  <span className="text-[11px]">ABA KHQR</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                    paymentMethod === 'wallet'
                      ? 'border-emerald-650 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <span className="text-[11px]">{lang === 'km' ? 'កាបូបលុយ V8' : 'V8 Wallet'}</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-[11px]">Cash on Delivery</span>
                </button>
              </div>

              {/* 1. ABA KHQR Dynamic Payment Card */}
              {paymentMethod === 'khqr' && (
                <div className="bg-gradient-to-b from-rose-500 to-rose-700 rounded-3xl p-5 text-white shadow-xl space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-white/20 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-white text-rose-600 rounded-xl flex items-center justify-center font-black text-xs shadow-xs">
                        ABA
                      </div>
                      <span className="font-bold text-sm tracking-wide">KHQR Payment</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/80 block">Expires in</span>
                      <span className="font-mono text-xs font-bold text-amber-200 flex items-center space-x-1">
                        <Clock className="w-3 h-3 inline" />
                        <span>{formatTimer(qrTimer)}</span>
                      </span>
                    </div>
                  </div>

                  {/* KHQR Mock Frame */}
                  <div className="bg-white rounded-2xl p-4 text-slate-800 text-center space-y-3 shadow-inner">
                    <div className="text-xs font-bold text-slate-600">Scan to Pay V8 Mini Mart</div>
                    <div className="w-48 h-48 bg-white mx-auto border-2 border-dashed border-rose-400 rounded-2xl flex flex-col items-center justify-center p-2 relative shadow-xs">
                      {/* Stylized QR Code SVG */}
                      <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="white" />
                        <rect x="5" y="5" width="30" height="30" rx="4" fill="#E11D48" />
                        <rect x="10" y="10" width="20" height="20" fill="white" />
                        <rect x="14" y="14" width="12" height="12" fill="#E11D48" />
                        
                        <rect x="65" y="5" width="30" height="30" rx="4" fill="#E11D48" />
                        <rect x="70" y="10" width="20" height="20" fill="white" />
                        <rect x="74" y="14" width="12" height="12" fill="#E11D48" />

                        <rect x="5" y="65" width="30" height="30" rx="4" fill="#E11D48" />
                        <rect x="10" y="70" width="20" height="20" fill="white" />
                        <rect x="14" y="74" width="12" height="12" fill="#E11D48" />

                        {/* Pixelated dots */}
                        <circle cx="45" cy="15" r="3" fill="#1E293B" />
                        <circle cx="55" cy="20" r="2.5" fill="#1E293B" />
                        <circle cx="48" cy="32" r="3" fill="#1E293B" />
                        <circle cx="20" cy="48" r="3" fill="#1E293B" />
                        <circle cx="35" cy="50" r="2.5" fill="#1E293B" />
                        <circle cx="50" cy="50" r="4" fill="#E11D48" />
                        <circle cx="65" cy="50" r="3" fill="#1E293B" />
                        <circle cx="80" cy="48" r="2.5" fill="#1E293B" />
                        <circle cx="50" cy="68" r="3" fill="#1E293B" />
                        <circle cx="65" cy="72" r="3" fill="#1E293B" />
                        <circle cx="80" cy="70" r="4" fill="#1E293B" />
                        <circle cx="55" cy="85" r="3" fill="#1E293B" />
                        <circle cx="75" cy="88" r="3" fill="#1E293B" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 px-2 py-0.5 rounded-md border border-rose-500 shadow-xs text-[9px] font-black text-rose-600">
                          V8 KHQR
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xl font-black text-slate-900 font-mono">{formatPrice(cartTotal)}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">≈ {formatDualPrice(cartTotal).khr}</div>
                    </div>
                  </div>

                  {/* Simulate Scan Button */}
                  <button
                    onClick={() => handleExecuteCheckout(true)}
                    disabled={isProcessing}
                    className="w-full py-3 bg-white hover:bg-rose-50 text-rose-700 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isProcessing ? 'Processing...' : t.simulatePaid}</span>
                  </button>
                </div>
              )}



              {/* 3. Cash on Delivery (COD) */}
              {paymentMethod === 'cod' && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-3 animate-fade-in">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <Truck className="w-5 h-5" />
                    <span>Pay Cash Upon Delivery</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    You can pay cash or scan ABA KHQR directly with the delivery driver upon receiving your items.
                  </p>
                  <button
                    onClick={() => handleExecuteCheckout(false)}
                    disabled={isProcessing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition"
                  >
                    {isProcessing ? 'Processing...' : t.confirmOrder}
                  </button>
                </div>
              )}

              {/* 4. V8 Wallet Payment */}
              {paymentMethod === 'wallet' && (
                <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-800 rounded-3xl text-white space-y-4 animate-fade-in relative overflow-hidden shadow-lg">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-white/20 pb-3">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-5 h-5 text-emerald-300" />
                      <span className="font-bold text-sm tracking-wide">V8 Wallet Payment</span>
                    </div>
                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full border border-white/15">
                      Secure Balance
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                      <span className="text-[10px] text-emerald-250 block font-bold uppercase tracking-wider">Your Balance</span>
                      <span className="text-xl font-black font-mono block">${(parseFloat(customerProfile.balance) || 0).toFixed(2)}</span>
                      <span className="text-[9px] text-emerald-300 block font-mono">≈ {formatDualPrice(parseFloat(customerProfile.balance) || 0).khr}</span>
                    </div>

                    <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                      <span className="text-[10px] text-emerald-250 block font-bold uppercase tracking-wider">Order Total</span>
                      <span className="text-xl font-black font-mono block text-amber-300">${parseFloat(cartTotal).toFixed(2)}</span>
                      <span className="text-[9px] text-emerald-300 block font-mono">≈ {formatDualPrice(cartTotal).khr}</span>
                    </div>
                  </div>

                  {customerProfile.balance >= cartTotal ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/35 rounded-xl text-xs flex items-start space-x-2 text-emerald-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                        <span>Sufficient balance. You can pay securely with your wallet credit.</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          deductCredit(cartTotal);
                          handleExecuteCheckout(false);
                        }}
                        disabled={isProcessing}
                        className="w-full py-3.5 bg-white hover:bg-slate-50 text-emerald-800 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <span>{isProcessing ? 'Processing...' : (lang === 'km' ? 'ទូទាត់តាមកាបូបលុយ V8' : 'Pay with V8 Wallet')}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-rose-500/20 border border-rose-500/35 rounded-xl text-xs flex items-start space-x-2 text-rose-100">
                        <AlertCircle className="w-4 h-4 text-rose-300 mt-0.5 flex-shrink-0" />
                        <span>Insufficient balance in your V8 Wallet. Please select another method or recharge your credit balance.</span>
                      </div>
                      
                      <div className="text-[10px] text-slate-300 italic text-center">
                        To recharge, please open the sidebar drawer profile menu and click "Deposit".
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Back button */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.back}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: ORDER SUCCESS CONFIRMATION & RECEIPT ================= */}
          {step === 3 && completedOrder && (
            <div className="space-y-6 text-center animate-fade-in">
              {/* Success Badge */}
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{t.orderSuccess}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{t.orderSuccessDesc}</p>
              </div>

              {/* Printable Invoice Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left text-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-mono text-xs font-black text-emerald-600">{completedOrder.id}</span>
                    <div className="text-[11px] text-slate-400">{new Date(completedOrder.created_at).toLocaleString()}</div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase text-[10px]">
                    {completedOrder.payment_method.toUpperCase()} • {completedOrder.payment_status.toUpperCase()}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Customer</span>
                    <span className="font-bold">{completedOrder.customer_name}</span>
                    <div className="font-mono text-[11px] text-slate-500">{completedOrder.customer_phone}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Delivery Location</span>
                    <span className="line-clamp-2">{completedOrder.shipping_address}, {completedOrder.city_province}</span>
                    {completedOrder.is_in_borey_the_flora && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                        🏡 បុរី The Flora (Free Delivery)
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Purchased Items</span>
                  {completedOrder.order_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="truncate max-w-[280px]">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="font-bold font-mono text-slate-800">${item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Breakdown & Total */}
                <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal:</span>
                    <span className="font-bold font-mono">${(completedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee:</span>
                    <span className={`font-bold font-mono ${completedOrder.shipping_fee === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {completedOrder.shipping_fee === 0 ? '$0.00 (Free 🎉)' : `$${(completedOrder.shipping_fee || 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <div className="text-right">
                      <span className="text-emerald-600 text-base">${completedOrder.total_amount.toFixed(2)}</span>
                      <div className="text-[10px] font-normal text-slate-400">≈ {formatDualPrice(completedOrder.total_amount).khr}</div>
                    </div>
                  </div>
                </div>

                {/* Photo Evidence on Invoice if available */}
                {completedOrder.delivery_evidence_image && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-xs">📸 រូបភាពភស្តុតាងប្រគល់ទំនិញ (Proof of Delivery)</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">Verified</span>
                    </div>
                    <div className="w-full max-h-48 rounded-xl overflow-hidden border border-emerald-300">
                      <img src={completedOrder.delivery_evidence_image} alt="Proof of Delivery" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Remarks on Receipt */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-start space-x-2">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">{lang === 'km' ? 'កំណត់សម្គាល់៖ ' : 'Remarks: '}</span>
                    <span>{completedOrder.delivery_remarks || (completedOrder.is_in_borey_the_flora ? 'ដឹកជញ្ជូនឥតគិតថ្លៃក្នុងបុរី The Flora' : 'សេវាដឹកជញ្ជូន 6,000 ៛')}</span>
                  </div>
                </div>
              </div>

              {/* Order Status & Track Order Button */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Live Order Tracking:</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active Delivery
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="text-emerald-600">1. Order Placed ✅</span>
                  <span className="text-emerald-600">2. Processing 📦</span>
                  <span className="text-slate-400">3. Out for Delivery 🚚</span>
                  <span className="text-slate-400">4. Delivered ✨</span>
                </div>

                <button
                  onClick={() => {
                    setActiveTrackingOrderId(completedOrder.id);
                    setIsCheckoutOpen(false);
                    setIsTrackingOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>{lang === 'km' ? '🚚 តាមដានការដឹកជញ្ជូនទំនិញផ្ទាល់ (Track Order)' : '🚚 Track Live Delivery Status'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.printInvoice}</span>
                </button>

                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setStep(1);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t.continueShopping}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
