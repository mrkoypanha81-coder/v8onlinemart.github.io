import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Bell, Plus, Trash2, Search, X, Check, AlertCircle, 
  Sparkles, Megaphone, Gift, AlertTriangle, Send, RefreshCw
} from 'lucide-react';

const NOTIFICATION_TYPES = [
  { id: 'info', name_kh: '📢 ការប្រកាស / ព័ត៌មាន', name_en: '📢 Announcement / Info', icon: Megaphone, color: 'text-blue-550 bg-blue-50 dark:bg-blue-950/40' },
  { id: 'discount', name_kh: '🎁 កម្មវិធីបញ្ចុះតម្លៃ / ប្រូម៉ូសិន', name_en: '🎁 Discount / Promo', icon: Gift, color: 'text-amber-550 bg-amber-50 dark:bg-amber-950/40' },
  { id: 'alert', name_kh: '⚠️ ការព្រមាន / សារសំខាន់', name_en: '⚠️ Alert / Important', icon: AlertTriangle, color: 'text-rose-550 bg-rose-50 dark:bg-rose-950/40' },
  { id: 'welcome', name_kh: '🎉 ការស្វាគមន៍ / សមាជិកភាព', name_en: '🎉 Welcome / Membership', icon: Sparkles, color: 'text-emerald-555 bg-emerald-50 dark:bg-emerald-950/40' }
];

const QUICK_TEMPLATES = [
  {
    title_kh: 'ប្រូម៉ូសិនពិសេសចុងសប្តាហ៍!',
    title_en: 'Weekend Special Promotion!',
    message_kh: 'បញ្ចុះតម្លៃ 20% រាល់ការទិញភេសជ្ជៈ និងនំចំណីទូទាំងហាង! ការផ្តល់ជូននេះមានសុពលភាពត្រឹមថ្ងៃអាទិត្យនេះប៉ុណ្ណោះ។',
    message_en: 'Enjoy 20% off all drinks and snacks storewide! This offer is valid until this Sunday only.',
    type: 'discount'
  },
  {
    title_kh: 'សេវាដឹកជញ្ជូនឥតគិតថ្លៃ!',
    title_en: 'Free Delivery Service!',
    message_kh: 'V8 Mini Mart ផ្តល់ជូនការដឹកជញ្ជូនឥតគិតថ្លៃដោយគ្មានលក្ខខណ្ឌសម្រាប់អតិថិជននៅក្នុងបុរី The Flora!',
    message_en: 'V8 Mini Mart provides unconditional free delivery service for all customers within Borey The Flora!',
    type: 'welcome'
  },
  {
    title_kh: 'ហាងផ្លាស់ប្តូរម៉ោងបើកលក់',
    title_en: 'Mart Operating Hours Update',
    message_kh: 'សូមគោរពអតិថិជន! ហាងយើងខ្ញុំនឹងបើកដំណើរការពីម៉ោង ៦:០០ ព្រឹក ដល់ ៩:០០ យប់ ចាប់ពីថ្ងៃស្អែកតទៅ។',
    message_en: 'Dear customers! Our store operating hours will be changed to 6:00 AM - 9:00 PM starting tomorrow.',
    type: 'info'
  }
];

export const NotificationManagement = () => {
  const { 
    notifications = [], 
    addNotification, 
    deleteNotification, 
    lang 
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    title_kh: '',
    title_en: '',
    message_kh: '',
    message_en: '',
    type: 'info'
  });

  const resetForm = () => {
    setFormData({
      title_kh: '',
      title_en: '',
      message_kh: '',
      message_en: '',
      type: 'info'
    });
  };

  const handleApplyTemplate = (tpl) => {
    setFormData({
      title_kh: tpl.title_kh,
      title_en: tpl.title_en,
      message_kh: tpl.message_kh,
      message_en: tpl.message_en,
      type: tpl.type
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title_kh.trim() || !formData.title_en.trim() || !formData.message_kh.trim() || !formData.message_en.trim()) {
      alert(lang === 'km' ? 'សូមបំពេញព័ត៌មានអោយបានគ្រប់គ្រាន់!' : 'Please fill out all fields!');
      return;
    }

    addNotification(formData);
    setIsModalOpen(false);
    resetForm();
  };

  const filteredNotifications = notifications.filter(notif => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      (notif.title_kh || '').toLowerCase().includes(query) ||
      (notif.title_en || '').toLowerCase().includes(query) ||
      (notif.message_kh || '').toLowerCase().includes(query) ||
      (notif.message_en || '').toLowerCase().includes(query);
    const matchesType = filterType === 'all' || notif.type === filterType;
    return matchesQuery && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-450" />
            {lang === 'km' ? 'គ្រប់គ្រងការជូនដំណឹង (Notifications)' : 'Notification Center'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {lang === 'km' ? 'ផ្ញើសារជូនដំណឹង ការបញ្ចុះតម្លៃ និងការប្រកាសផ្សេងៗទៅកាន់វេបសាយភ្ញៀវ' : 'Push notifications, discount deals, and announcements directly to storefront customers.'}
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-950 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-emerald-700/25 transition cursor-pointer select-none active:scale-95 self-start sm:self-center animate-fade-in"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'km' ? 'បង្កើតការជូនដំណឹងថ្មី' : 'Create Notification'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'km' ? 'ស្វែងរកការជូនដំណឹង...' : 'Search notifications...'}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 font-semibold"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-105 dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'km' ? 'ទាំងអស់' : 'All'}
          </button>
          {NOTIFICATION_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === type.id
                  ? 'bg-slate-800 text-white dark:bg-slate-105 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {lang === 'km' ? type.name_kh.split(' ')[1] : type.name_en.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotifications.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 py-16 text-center rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Bell className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-750 dark:text-slate-300">
              {lang === 'km' ? 'មិនមានសារជូនដំណឹងរកឃើញទេ' : 'No notifications found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              {lang === 'km' ? 'បង្កើតសារជូនដំណឹងថ្មីដើម្បីអោយវាបង្ហាញនៅលើ Home Page ភ្ញៀវ' : 'Create a notification to broadcast it live on the storefront.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const currentType = NOTIFICATION_TYPES.find(t => t.id === notif.type) || NOTIFICATION_TYPES[0];
            const Icon = currentType.icon;
            return (
              <div 
                key={notif.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/20 dark:hover:border-emerald-500/15 shadow-2xs hover:shadow-xs transition duration-250 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase ${currentType.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {lang === 'km' ? currentType.name_kh.split(' ').slice(1).join(' ') : currentType.name_en.split(' ').slice(1).join(' ')}
                    </span>
                    
                    <button
                      onClick={() => {
                        if (confirm(lang === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបការជូនដំណឹងនេះ?' : 'Are you sure you want to delete this notification?')) {
                          deleteNotification(notif.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title={lang === 'km' ? 'លុបការជូនដំណឹង' : 'Delete Notification'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Content (Dual Lang) */}
                  <div className="space-y-3.5">
                    {/* Khmer View */}
                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">ភាសាខ្មែរ (KM)</div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{notif.title_kh}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed mt-1">{notif.message_kh}</p>
                    </div>

                    {/* English View */}
                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">English (EN)</div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{notif.title_en}</h4>
                      <p className="text-xs text-slate-655 dark:text-slate-400 font-semibold leading-relaxed mt-1">{notif.message_en}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <span>ID: {notif.id}</span>
                  <span>{new Date(notif.date).toLocaleString(lang === 'km' ? 'km-KH' : 'en-US')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-850 shadow-2xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
                {lang === 'km' ? 'បង្កើតសារជូនដំណឹងថ្មី' : 'Create New Notification'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Template Selection */}
              <div>
                <span className="text-xs font-bold text-slate-505 block mb-2">
                  ✨ {lang === 'km' ? 'គំរូរហ័ស (Quick Templates)' : 'Use Quick Templates'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {QUICK_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-3 py-2 text-left bg-slate-50 hover:bg-emerald-50 dark:bg-slate-850 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition duration-150 cursor-pointer hover:border-emerald-250 dark:hover:border-emerald-800 truncate"
                    >
                      {lang === 'km' ? tpl.title_kh : tpl.title_en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-750 dark:text-slate-300 block mb-2 font-black">
                  {lang === 'km' ? 'ប្រភេទនៃការជូនដំណឹង' : 'Notification Type / Theme'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTIFICATION_TYPES.map(type => {
                    const TplIcon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          formData.type === type.id
                            ? 'border-emerald-600 bg-emerald-50/20 text-emerald-800 dark:text-emerald-450 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/60 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <TplIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{lang === 'km' ? type.name_kh.split(' ').slice(1).join(' ') : type.name_en.split(' ').slice(1).join(' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khmer Fields */}
              <div className="space-y-3 bg-emerald-50/10 dark:bg-emerald-950/5 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/10">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">ព័ត៌មានជាភាសាខ្មែរ (Khmer Version)</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={formData.title_kh}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_kh: e.target.value }))}
                    placeholder="ចំណងជើងការជូនដំណឹង (ឧ. ប្រូម៉ូសិនពិសេស...)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 font-bold"
                  />
                  <textarea
                    required
                    rows="2"
                    value={formData.message_kh}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_kh: e.target.value }))}
                    placeholder="ខ្លឹមសារលម្អិតនៃការជូនដំណឹង (ឧ. ទិញ ១ ថែម ១...)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 resize-none font-semibold"
                  />
                </div>
              </div>

              {/* English Fields */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/10 p-4 rounded-2xl border border-slate-250/20 dark:border-slate-800/40">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">English Version</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="Notification Title (e.g. Special Promotion...)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 font-bold"
                  />
                  <textarea
                    required
                    rows="2"
                    value={formData.message_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_en: e.target.value }))}
                    placeholder="Notification Message Details (e.g. Buy 1 Get 1 Free...)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 resize-none font-semibold"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-105 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-805 text-xs font-bold text-slate-600 dark:text-slate-350 transition cursor-pointer"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-950 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-700/25 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 animate-pulse" />
                  <span>{lang === 'km' ? 'ផ្ញើផ្សាយផ្ទាល់' : 'Broadcast Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
