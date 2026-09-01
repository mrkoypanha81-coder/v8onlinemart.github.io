import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Settings, X, Type, Moon, Sun, Globe, DollarSign, 
  Store, Shield, Bell, Check, Sparkles, Sliders, RefreshCw, 
  Lock, Smartphone, Info
} from 'lucide-react';

export const AdminSettingsModal = ({ isOpen, onClose }) => {
  const { 
    lang, 
    setLang, 
    theme, 
    toggleTheme, 
    fontSize, 
    setFontSize, 
    currency, 
    setCurrency, 
    exchangeRate,
    showToast,
    smsSettings,
    updateSmsSettings,
    sendSmsNotification
  } = useStore();

  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTestSms = async () => {
    const cleanPhone = (testPhone || '').trim();
    if (!cleanPhone) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទតេស្ត!' : 'Please enter a test phone number!', 'error');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await sendSmsNotification(
        cleanPhone,
        lang === 'km'
          ? '🔔 សារតេស្តផ្ទៀងផ្ទាត់ប្រព័ន្ធ SMS ពីហាង V8 Mini Mart! ប្រព័ន្ធដំណើរការល្អជោគជ័យ។'
          : '🔔 Test SMS from V8 Mini Mart! Your SMS gateway is working successfully.'
      );
      if (res.success) {
        showToast(lang === 'km' ? '✅ សារតេស្តត្រូវបានផ្ញើជោគជ័យ!' : '✅ Test SMS sent successfully!', 'success');
      } else {
        showToast(lang === 'km' ? `❌ បរាជ័យ៖ ${res.error || res.reason || 'Unknown error'}` : `❌ Failed: ${res.error || res.reason || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  const fontOptions = [
    { 
      id: 'small', 
      label_km: 'តូច (Small)', 
      label_en: 'Small (85%)', 
      percent: '85%', 
      desc_km: 'ស័ក្តិសមសម្រាប់មើលទិន្នន័យច្រើនក្នុងតារាង',
      desc_en: 'Compact view for data-dense tables',
      iconScale: 'text-xs',
      preview: 'A⁻' 
    },
    { 
      id: 'normal', 
      label_km: 'មធ្យម (Normal)', 
      label_en: 'Normal (100%)', 
      percent: '100%', 
      desc_km: 'ទំហំស្តង់ដារលំនាំដើមរបស់ប្រព័ន្ធ',
      desc_en: 'Standard default system font size',
      iconScale: 'text-sm',
      preview: 'A' 
    },
    { 
      id: 'large', 
      label_km: 'ធំ (Large)', 
      label_en: 'Large (105%)', 
      percent: '105%', 
      desc_km: 'អក្សរច្បាស់ ងាយស្រួលអានលើអេក្រង់ធំ (105%)',
      desc_en: 'Clear & comfortable readability (105%)',
      iconScale: 'text-base',
      preview: 'A⁺' 
    },
    { 
      id: 'xlarge', 
      label_km: 'ធំបំផុត (Extra Large)', 
      label_en: 'Extra Large (115%)', 
      percent: '115%', 
      desc_km: 'អក្សរធំខ្លាំង ងាយស្រួលពិនិត្យលេខ Orders (115%)',
      desc_en: 'Maximum visibility for fast order checks (115%)',
      iconScale: 'text-lg',
      preview: 'A⁺⁺' 
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {lang === 'km' ? 'ការកំណត់ប្រព័ន្ធ Admin (Admin Settings)' : 'Admin System Settings'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'km' ? 'កំណត់ទំហំអក្សរ, ភាសា, ពណ៌ និងរូបរាងកម្មវិធី' : 'Configure Font Size, Appearance & Preferences'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center shadow-2xs hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* SECTION 1: FONT SIZE CONFIGURATION (ទំហំអក្សរ Size Font) */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-slate-850 dark:to-slate-800 rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {lang === 'km' ? '🔤 កំណត់ទំហំអក្សរប្រព័ន្ធ (Font Size Scaling)' : 'Font Size Scaling'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'km' ? 'ជ្រើសរើសទំហំអក្សរឱ្យត្រូវនឹងភ្នែក និងអេក្រង់របស់អ្នក' : 'Select preferred text size for optimal readability'}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-black rounded-xl shadow-xs">
                {fontOptions.find(f => f.id === fontSize)?.percent || '100%'}
              </span>
            </div>

            {/* 4 Interactive Font Size Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fontOptions.map((item) => {
                const isSelected = fontSize === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFontSize(item.id);
                      showToast(
                        lang === 'km'
                          ? `🔤 បានប្តូរទំហំអក្សរ Admin ទៅជា៖ ${item.label_km}`
                          : `🔤 Admin font size set to: ${item.label_en}`,
                        'success'
                      );
                    }}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between space-y-2 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 scale-[1.02]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className={`font-mono font-black ${item.iconScale} leading-none`}>
                        {item.preview}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>

                    <div>
                      <span className="font-black text-xs block">
                        {lang === 'km' ? item.label_km.split(' ')[0] : item.id.toUpperCase()}
                      </span>
                      <span className={`text-[10px] block opacity-80 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {item.percent}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Real-Time Live Preview Box */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {lang === 'km' ? 'ទិដ្ឋភាពបង្ហាញជាក់ស្តែង (Live Preview)' : 'Live Preview Box'}
              </span>
              <p className="text-slate-900 dark:text-white font-medium">
                {lang === 'km' 
                  ? 'ហាងទំនិញ V8 Mini Mart — ប្រព័ន្ធគ្រប់គ្រងស្តុក & អតិថិជន VIP Gold ជំនាន់ថ្មី ($89.75)'
                  : 'V8 Mini Mart Enterprise Suite — Live Inventory & VIP Customer Tracking ($89.75)'}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                ✓ {lang === 'km' ? 'ទំហំអក្សរនឹងផ្លាស់ប្តូរភ្លាមៗទូទាំងវេបសាយ' : 'Applied instantly across all admin views & tables'}
              </span>
            </div>
          </div>

          {/* SECTION 2: THEME & COLOR PREFERENCES */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{lang === 'km' ? 'រូបរាង & ពណ៌ (Theme Mode)' : 'Appearance & Theme'}</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white border-amber-500 text-slate-900 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-white/50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-xs block text-slate-900 dark:text-white">
                    {lang === 'km' ? 'មុខងារពន្លឺ (Light)' : 'Light Mode'}
                  </span>
                  <span className="text-[10px] text-slate-400">Default Bright</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-xs block text-slate-900 dark:text-white">
                    {lang === 'km' ? 'មុខងារងងឹត (Dark)' : 'Dark Mode'}
                  </span>
                  <span className="text-[10px] text-slate-400">Night Comfort</span>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 3: LANGUAGE & CURRENCY */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>{lang === 'km' ? 'ភាសា & រូបិយប័ណ្ណ (Language & Currency)' : 'Language & Currency'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Language Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'km' ? 'ភាសាប្រព័ន្ធ (Language)' : 'System Language'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setLang('km')}
                    className={`py-2 rounded-lg font-black transition cursor-pointer ${
                      lang === 'km' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    🇰🇭 ខ្មែរ (Khmer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`py-2 rounded-lg font-black transition cursor-pointer ${
                      lang === 'en' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'km' ? 'រូបិយប័ណ្ណចម្បង (Currency)' : 'Primary Currency'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`py-2 rounded-lg font-black transition cursor-pointer ${
                      currency === 'USD' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('KHR')}
                    className={`py-2 rounded-lg font-black transition cursor-pointer ${
                      currency === 'KHR' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    KHR (៛)
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {lang === 'km' ? 'អត្រាប្តូរប្រាក់ស្តង់ដារ៖' : 'Exchange Rate:'}
              </span>
              <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                1 USD = {exchangeRate?.toLocaleString() || '4,000'} KHR
              </span>
            </div>
          </div>

          {/* SECTION 3.5: SMS GATEWAY CONFIGURATION */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-450" />
                <span>{lang === 'km' ? 'ប្រព័ន្ធផ្ញើ SMS (SMS Gateway)' : 'SMS Gateway Settings'}</span>
              </h4>
              
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  updateSmsSettings({ enabled: !smsSettings.enabled });
                  showToast(
                    lang === 'km'
                      ? (smsSettings.enabled ? '❌ បានបិទប្រព័ន្ធ SMS' : '✅ បានបើកប្រព័ន្ធ SMS')
                      : (smsSettings.enabled ? '❌ SMS Gateway Disabled' : '✅ SMS Gateway Enabled'),
                    'info'
                  );
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition duration-200 cursor-pointer ${
                  smsSettings.enabled ? 'bg-emerald-600' : 'bg-slate-350 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                    smsSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Config Fields (Visible only if enabled) */}
            <div className={`space-y-3.5 transition-all duration-300 ${smsSettings.enabled ? 'opacity-100 max-h-[500px]' : 'opacity-50 pointer-events-none'}`}>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'km' ? 'តំណភ្ជាប់ API Gateway (API URL)' : 'Gateway API URL'}
                </label>
                <input
                  type="text"
                  value={smsSettings.url || ''}
                  onChange={(e) => updateSmsSettings({ url: e.target.value })}
                  placeholder="e.g. https://api.sms-provider.com/send"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 font-semibold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'km' ? 'Authorization Header (Token)' : 'Authorization Header'}
                </label>
                <input
                  type="text"
                  value={smsSettings.authHeader || ''}
                  onChange={(e) => updateSmsSettings({ authHeader: e.target.value })}
                  placeholder="e.g. Bearer eyJ... or API key"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 font-semibold font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    {lang === 'km' ? 'ឈ្មោះអ្នកផ្ញើ (Sender ID)' : 'Sender ID / Brand'}
                  </label>
                  <input
                    type="text"
                    value={smsSettings.senderId || ''}
                    onChange={(e) => updateSmsSettings({ senderId: e.target.value })}
                    placeholder="e.g. V8MiniMart"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 font-black uppercase"
                  />
                </div>

                {/* Test SMS block */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    {lang === 'km' ? 'សាកល្បងផ្ញើសារ (Test SMS)' : 'Test SMS Recipient'}
                  </label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="e.g. 012345678"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 font-semibold font-mono"
                    />
                    <button
                      type="button"
                      disabled={isSendingTest || !smsSettings.enabled}
                      onClick={handleSendTestSms}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
                    >
                      {isSendingTest ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{lang === 'km' ? 'ផ្ញើតេស្ត' : 'Send'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: STORE IDENTITY & HOTLINE */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'km' ? 'ព័ត៌មានហាងទំនិញ (Store Identity)' : 'Store Information'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">{lang === 'km' ? 'ឈ្មោះហាង៖' : 'Store Name:'}</span>
                <span className="font-black text-slate-900 dark:text-white text-xs">V8 Mini Mart Express</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">{lang === 'km' ? 'លេខទូរស័ព្ទ / Delivery:' : 'Hotline:'}</span>
                <span className="font-black font-mono text-emerald-600 text-xs">010 828 282 / 012 828 282</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-400">
            {lang === 'km' ? 'ការកំណត់ទាំងអស់រក្សាទុកស្វ័យប្រវត្ត' : 'All preferences saved automatically'}
          </span>
          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            {lang === 'km' ? 'រួចរាល់ (Done)' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
