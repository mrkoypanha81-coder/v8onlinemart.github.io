import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  CreditCard, QrCode, Wallet, Banknote, ShieldCheck, 
  Upload, Sparkles, CheckCircle2, XCircle, Settings, Edit3, 
  Eye, RefreshCw, AlertCircle, Info, Lock, ArrowRight, Image as ImageIcon, Crop
} from 'lucide-react';
import { QrCodeCropperModal } from './QrCodeCropperModal';

export const PaymentManagement = () => {
  const { 
    paymentSettings, 
    updatePaymentSettings, 
    showToast, 
    lang, 
    currency, 
    exchangeRate 
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState('khqr'); // 'khqr' | 'wallet' | 'card' | 'cod'
  const [khqrForm, setKhqrForm] = useState({
    merchantName: paymentSettings.khqr?.merchantName || 'V8 Online Mart',
    merchantId: paymentSettings.khqr?.merchantId || '00020101021238580016A000000704000101',
    qrImage: paymentSettings.khqr?.qrImage || '',
    instruction_kh: paymentSettings.khqr?.instruction_kh || 'សូមស្កែន QR ខាងលើដើម្បីទូទាត់ប្រាក់តាម ABA / Bakong App',
    instruction_en: paymentSettings.khqr?.instruction_en || 'Scan the KHQR code above to pay via ABA / Bakong App'
  });

  const [walletForm, setWalletForm] = useState({
    instruction_kh: paymentSettings.wallet?.instruction_kh || 'ទូទាត់ប្រាក់ភ្លាមៗពីសមតុល្យកាបូបលុយ V8 Wallet របស់លោកអ្នក',
    instruction_en: paymentSettings.wallet?.instruction_en || 'Pay instantly using your V8 Wallet balance'
  });

  const [cardForm, setCardForm] = useState({
    instruction_kh: paymentSettings.card?.instruction_kh || 'ទូទាត់ដោយសុវត្ថិភាពតាម Visa, MasterCard ឬ UnionPay',
    instruction_en: paymentSettings.card?.instruction_en || 'Secure payment via Visa, MasterCard or UnionPay'
  });

  const [codForm, setCodForm] = useState({
    instruction_kh: paymentSettings.cod?.instruction_kh || 'ប្រគល់ប្រាក់សុទ្ធជូនអ្នកដឹកជញ្ជូននៅពេលទទួលបានទំនិញដល់ផ្ទះ',
    instruction_en: paymentSettings.cod?.instruction_en || 'Pay cash to delivery driver upon receiving items at home'
  });

  // QR Code Image Cropper Modal State
  const [cropperImageSrc, setCropperImageSrc] = useState(null);
  const [isQrCropperOpen, setIsQrCropperOpen] = useState(false);

  // Handle KHQR Custom Image Upload with Cropper Popup
  const handleQrImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === 'km' ? 'ទំហំរូបភាពធំពេក! សូមជ្រើសរើសរូបភាពក្រោម 5MB' : 'Image too large! Please choose under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropperImageSrc(event.target.result);
      setIsQrCropperOpen(true);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleTogglePaymentMethod = (methodKey) => {
    const currentStatus = paymentSettings[methodKey]?.enabled;
    const newStatus = !currentStatus;

    updatePaymentSettings(methodKey, {
      ...paymentSettings[methodKey],
      enabled: newStatus
    });

    showToast(
      lang === 'km'
        ? `កំណត់វិធីទូទាត់ ${methodKey.toUpperCase()} ទៅជា៖ ${newStatus ? '🟢 បើកដំណើរការ' : '🔴 បិទដំណើរការ'}`
        : `Payment method ${methodKey.toUpperCase()} updated to: ${newStatus ? 'Enabled' : 'Disabled'}`,
      newStatus ? 'success' : 'info'
    );
  };

  const handleSaveKhqrConfig = (e) => {
    e.preventDefault();
    updatePaymentSettings('khqr', {
      ...paymentSettings.khqr,
      merchantName: khqrForm.merchantName,
      merchantId: khqrForm.merchantId,
      qrImage: khqrForm.qrImage,
      instruction_kh: khqrForm.instruction_kh,
      instruction_en: khqrForm.instruction_en
    });
    showToast(lang === 'km' ? '✅ រក្សាទុកការកំណត់ ABA KHQR ជោគជ័យ!' : '✅ Saved ABA KHQR settings successfully!', 'success');
  };

  const handleSaveWalletConfig = (e) => {
    e.preventDefault();
    updatePaymentSettings('wallet', {
      ...paymentSettings.wallet,
      instruction_kh: walletForm.instruction_kh,
      instruction_en: walletForm.instruction_en
    });
    showToast(lang === 'km' ? '✅ រក្សាទុកការកំណត់ V8 Wallet ជោគជ័យ!' : '✅ Saved V8 Wallet settings successfully!', 'success');
  };

  const handleSaveCardConfig = (e) => {
    e.preventDefault();
    updatePaymentSettings('card', {
      ...paymentSettings.card,
      instruction_kh: cardForm.instruction_kh,
      instruction_en: cardForm.instruction_en
    });
    showToast(lang === 'km' ? '✅ រក្សាទុកការកំណត់ ប័ណ្ណឥណទាន (Card) ជោគជ័យ!' : '✅ Saved Credit Card settings successfully!', 'success');
  };

  const handleSaveCodConfig = (e) => {
    e.preventDefault();
    updatePaymentSettings('cod', {
      ...paymentSettings.cod,
      instruction_kh: codForm.instruction_kh,
      instruction_en: codForm.instruction_en
    });
    showToast(lang === 'km' ? '✅ រក្សាទុកការកំណត់ ប្រាក់សុទ្ធ (COD) ជោគជ័យ!' : '✅ Saved COD settings successfully!', 'success');
  };

  const methodsList = [
    { key: 'khqr', title_kh: 'ABA KHQR (Scan to Pay)', title_en: 'ABA KHQR Scan', icon: QrCode, color: 'from-rose-500 to-rose-700', badgeColor: 'bg-rose-500' },
    { key: 'wallet', title_kh: 'កាបូបលុយ V8 Wallet', title_en: 'V8 E-Wallet', icon: Wallet, color: 'from-emerald-600 to-teal-800', badgeColor: 'bg-emerald-600' },
    { key: 'card', title_kh: 'ប័ណ្ណឥណទាន (Credit Card)', title_en: 'Credit / Debit Card', icon: CreditCard, color: 'from-blue-600 to-indigo-800', badgeColor: 'bg-blue-600' },
    { key: 'cod', title_kh: 'ប្រាក់សុទ្ធ (Cash on Delivery)', title_en: 'Cash on Delivery', icon: Banknote, color: 'from-amber-600 to-orange-700', badgeColor: 'bg-amber-600' }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងការទូទាត់ប្រាក់ (Payment Gateway Suite)' : 'Payment Gateways Suite'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {lang === 'km' ? '💳 គ្រប់គ្រងការបើក/បិទ QR Code & វិធីសាស្ត្រទូទាត់' : 'Payment Methods & KHQR Management'}
          </h2>
          <p className="text-slate-400 text-xs max-w-xl">
            {lang === 'km' 
              ? 'លោកអ្នកអាចបើក ឬបិទ QR Code, V8 Wallet, Credit Card និង COD តាមតម្រូវការជាក់ស្តែង។ ភ្ញៀវនឹងឃើញតែវិធីទូទាត់ដែលបានបើកប៉ុណ្ណោះ។'
              : 'Enable or disable KHQR, V8 Wallet, Credit Card, and Cash on Delivery. Customers will only see enabled methods at checkout.'}
          </p>
        </div>

        {/* Master Status Summary */}
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3 flex-shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold">កំពុងបើកដំណើរការ</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {Object.values(paymentSettings).filter(m => m?.enabled).length} / 4 វិធី
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Quick Toggle Cards Grid (4 Master Switches) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {methodsList.map(item => {
          const isEnabled = paymentSettings[item.key]?.enabled;
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className={`p-4 rounded-3xl border transition-all space-y-3 ${
                isEnabled
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  : 'bg-slate-100/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-850 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-2xl bg-gradient-to-tr ${item.color} text-white shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Master Switch Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePaymentMethod(item.key)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                  title={isEnabled ? 'Click to Disable' : 'Click to Enable'}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transition-transform" />
                </button>
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {lang === 'km' ? item.title_kh : item.title_en}
                  </h4>
                </div>
                <span className={`inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${
                  isEnabled 
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  <span>{isEnabled ? (lang === 'km' ? '🟢 បើកដំណើរការ (Active)' : '🟢 Active') : (lang === 'km' ? '🔴 បិទការទូទាត់ (Disabled)' : '🔴 Disabled')}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Detailed Configuration Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Navigation Switcher */}
        <div className="flex items-center space-x-1.5 p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-x-auto">
          {methodsList.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>{lang === 'km' ? tab.title_kh : tab.title_en}</span>
              {paymentSettings[tab.key]?.enabled ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-rose-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          
          {/* SUB-TAB 1: ABA KHQR CONFIGURATION */}
          {activeSubTab === 'khqr' && (
            <form onSubmit={handleSaveKhqrConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                    <QrCode className="w-5 h-5 text-rose-600" />
                    <span>{lang === 'km' ? 'កំណត់រចនាសម្ព័ន្ធ ABA KHQR (Scan to Pay)' : 'ABA KHQR Configuration'}</span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => handleTogglePaymentMethod('khqr')}
                    className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer border ${
                      paymentSettings.khqr?.enabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {paymentSettings.khqr?.enabled ? '🟢 ON' : '🔴 OFF'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'km' ? 'ឈ្មោះគណនី/ហាង (Merchant Account Name):' : 'Merchant Name'}
                  </label>
                  <input
                    type="text"
                    value={khqrForm.merchantName}
                    onChange={(e) => setKhqrForm({ ...khqrForm, merchantName: e.target.value })}
                    placeholder="V8 ONLINE MART"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'km' ? 'លេខ Merchant ID / Phone:' : 'Merchant ID / Phone'}
                  </label>
                  <input
                    type="text"
                    value={khqrForm.merchantId}
                    onChange={(e) => setKhqrForm({ ...khqrForm, merchantId: e.target.value })}
                    placeholder="012888999"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'km' ? 'រូបភាព QR Code ផ្ទាល់ខ្លួន (Custom QR Upload):' : 'Custom QR Code Image'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrImageUpload}
                      className="hidden"
                      id="khqr-upload-input"
                    />
                    <label
                      htmlFor="khqr-upload-input"
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs flex items-center space-x-2 cursor-pointer shadow-md shadow-rose-600/20 transition active:scale-95"
                    >
                      <Upload className="w-4 h-4 text-white" />
                      <span>{lang === 'km' ? 'ជ្រើសរើសរូបភាព QR ថ្មី (Upload)' : 'Upload Custom QR'}</span>
                    </label>

                    {khqrForm.qrImage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCropperImageSrc(khqrForm.qrImage);
                            setIsQrCropperOpen(true);
                          }}
                          className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold rounded-2xl text-xs flex items-center space-x-1.5 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                        >
                          <Crop className="w-4 h-4 text-emerald-600" />
                          <span>{lang === 'km' ? '✂️ កាត់តម្រឹម QR' : 'Crop QR Image'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setKhqrForm({ ...khqrForm, qrImage: '' })}
                          className="text-xs text-rose-600 hover:underline font-bold cursor-pointer px-2 py-1"
                        >
                          {lang === 'km' ? 'លុបរូបភាព QR ចេញ' : 'Reset QR'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'km' ? 'ការណែនាំទូទាត់ (ភាសាខ្មែរ):' : 'Instruction (Khmer)'}
                  </label>
                  <textarea
                    rows={2}
                    value={khqrForm.instruction_kh}
                    onChange={(e) => setKhqrForm({ ...khqrForm, instruction_kh: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-600/30 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'km' ? '✅ រក្សាទុកការកំណត់ KHQR' : 'Save KHQR Settings'}</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-400 block tracking-wider">
                  👁️ ទិដ្ឋភាពផ្សាយផ្ទាល់ពេលភ្ញៀវ Checkout (Live Preview)
                </span>
                
                <div className="bg-gradient-to-b from-rose-500 to-rose-700 rounded-3xl p-5 text-white shadow-xl space-y-3 relative">
                  <div className="flex justify-between items-center border-b border-white/20 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-white text-rose-600 rounded-xl flex items-center justify-center font-black text-xs">
                        ABA
                      </div>
                      <span className="font-bold text-xs">KHQR Payment</span>
                    </div>
                    <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full">
                      Expires: 09:59
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-4 text-slate-800 text-center space-y-2">
                    <div className="text-xs font-black text-slate-800">
                      Scan to Pay: {khqrForm.merchantName || 'V8 Online Mart'}
                    </div>

                    <div className="w-full min-h-[300px] max-h-[360px] bg-white mx-auto border-2 border-dashed border-rose-400 rounded-2xl flex flex-col items-center justify-center p-3 shadow-xs relative overflow-hidden">
                      {khqrForm.qrImage ? (
                        <img
                          src={khqrForm.qrImage}
                          alt="Custom KHQR"
                          className="w-full h-full max-h-[340px] object-contain rounded-xl"
                        />
                      ) : (
                        <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                          <circle cx="50" cy="50" r="6" fill="#E11D48" />
                        </svg>
                      )}
                    </div>

                    <div className="font-mono font-black text-sm text-slate-900">
                      $12.50 <span className="text-xs text-slate-500 font-normal">(≈ 50,000 ៛)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-rose-100 text-center italic">
                    "{khqrForm.instruction_kh}"
                  </p>
                </div>
              </div>

            </form>
          )}

          {/* SUB-TAB 2: V8 WALLET CONFIGURATION */}
          {activeSubTab === 'wallet' && (
            <form onSubmit={handleSaveWalletConfig} className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'km' ? 'កំណត់ការទូទាត់ប្រាក់តាមកាបូបលុយ V8 Wallet' : 'V8 E-Wallet Settings'}</span>
                </h3>

                <button
                  type="button"
                  onClick={() => handleTogglePaymentMethod('wallet')}
                  className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer border ${
                    paymentSettings.wallet?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {paymentSettings.wallet?.enabled ? '🟢 ON' : '🔴 OFF'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'ការណែនាំទូទាត់ (ភាសាខ្មែរ):' : 'Instruction (Khmer)'}
                </label>
                <textarea
                  rows={3}
                  value={walletForm.instruction_kh}
                  onChange={(e) => setWalletForm({ ...walletForm, instruction_kh: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'km' ? '✅ រក្សាទុកការកំណត់ V8 Wallet' : 'Save Wallet Settings'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 3: CREDIT CARD CONFIGURATION */}
          {activeSubTab === 'card' && (
            <form onSubmit={handleSaveCardConfig} className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>{lang === 'km' ? 'កំណត់ការទូទាត់ប្រាក់តាម ប័ណ្ណឥណទាន (Credit Card)' : 'Credit Card Settings'}</span>
                </h3>

                <button
                  type="button"
                  onClick={() => handleTogglePaymentMethod('card')}
                  className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer border ${
                    paymentSettings.card?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {paymentSettings.card?.enabled ? '🟢 ON' : '🔴 OFF'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'ការណែនាំទូទាត់ (ភាសាខ្មែរ):' : 'Instruction (Khmer)'}
                </label>
                <textarea
                  rows={3}
                  value={cardForm.instruction_kh}
                  onChange={(e) => setCardForm({ ...cardForm, instruction_kh: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="py-3 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'km' ? '✅ រក្សាទុកការកំណត់ Credit Card' : 'Save Credit Card Settings'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 4: CASH ON DELIVERY CONFIGURATION */}
          {activeSubTab === 'cod' && (
            <form onSubmit={handleSaveCodConfig} className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <span>{lang === 'km' ? 'កំណត់ការទូទាត់ប្រាក់តាម ប្រាក់សុទ្ធ (Cash on Delivery)' : 'Cash on Delivery Settings'}</span>
                </h3>

                <button
                  type="button"
                  onClick={() => handleTogglePaymentMethod('cod')}
                  className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer border ${
                    paymentSettings.cod?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {paymentSettings.cod?.enabled ? '🟢 ON' : '🔴 OFF'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'ការណែនាំទូទាត់ (ភាសាខ្មែរ):' : 'Instruction (Khmer)'}
                </label>
                <textarea
                  rows={3}
                  value={codForm.instruction_kh}
                  onChange={(e) => setCodForm({ ...codForm, instruction_kh: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="py-3 px-6 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-600/30 transition flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'km' ? '✅ រក្សាទុកការកំណត់ COD' : 'Save COD Settings'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Interactive QR Code Cropper Modal Popup */}
      <QrCodeCropperModal
        imageSrc={cropperImageSrc}
        isOpen={isQrCropperOpen}
        onClose={() => setIsQrCropperOpen(false)}
        onCropComplete={(croppedDataUrl) => {
          setKhqrForm(prev => ({ ...prev, qrImage: croppedDataUrl }));
          showToast(lang === 'km' ? '✂️ កាត់តម្រឹមរូបភាព QR Code ជោគជ័យ!' : '✂️ QR Code image cropped successfully!', 'success');
        }}
        lang={lang}
      />

    </div>
  );
};
