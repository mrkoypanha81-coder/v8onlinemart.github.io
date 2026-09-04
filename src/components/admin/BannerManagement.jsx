import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { resolveAssetUrl, handleImageError } from '../../utils/resolveAssetUrl';
import { 
  Image, Plus, Trash2, Edit3, Eye, EyeOff, Upload, 
  Sparkles, Check, X, AlertCircle, ArrowRight, Layers, Crop,
  Camera, Smartphone, Send
} from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';

const GRADIENT_PRESETS = [
  { name: 'V8 Green to Dark Orange', value: 'from-emerald-900 via-emerald-800 to-orange-700' },
  { name: 'Emerald Forest & Night', value: 'from-slate-900 via-emerald-950 to-emerald-800' },
  { name: 'Rich Dark Amber & Orange', value: 'from-orange-700 via-amber-800 to-emerald-950' },
  { name: 'Deep Midnight Navy', value: 'from-slate-950 via-slate-900 to-emerald-900' }
];

export const BannerManagement = () => {
  const { 
    banners = [], 
    addBanner, 
    updateBanner, 
    deleteBanner, 
    toggleBannerStatus,
    lang 
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // View & Crop Modal State
  const [cropperSrc, setCropperSrc] = useState(null);
  const [cropperFileName, setCropperFileName] = useState('promo_banner.jpg');
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title_kh: '',
    title_en: '',
    subtitle_kh: '',
    subtitle_en: '',
    badge_kh: 'បញ្ចុះតម្លៃ 20%',
    badge_en: '20% OFF',
    tag_kh: '⭐ V8 ពិសេសប្រចាំថ្ងៃ',
    tag_en: '⭐ V8 SPECIAL DEALS',
    image: '',
    gradient: GRADIENT_PRESETS[0].value,
    link: '#categories',
    active: true
  });

  const resetForm = () => {
    setFormData({
      title_kh: '',
      title_en: '',
      subtitle_kh: '',
      subtitle_en: '',
      badge_kh: 'បញ្ចុះតម្លៃ 20%',
      badge_en: '20% OFF',
      tag_kh: '⭐ V8 ពិសេសប្រចាំថ្ងៃ',
      tag_en: '⭐ V8 SPECIAL DEALS',
      image: '',
      gradient: GRADIENT_PRESETS[0].value,
      link: '#categories',
      active: true
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingId(banner.id);
    setFormData({
      title_kh: banner.title_kh || '',
      title_en: banner.title_en || '',
      subtitle_kh: banner.subtitle_kh || '',
      subtitle_en: banner.subtitle_en || '',
      badge_kh: banner.badge_kh || '',
      badge_en: banner.badge_en || '',
      tag_kh: banner.tag_kh || '',
      tag_en: banner.tag_en || '',
      image: banner.image || '',
      gradient: banner.gradient || GRADIENT_PRESETS[0].value,
      link: banner.link || '#categories',
      active: banner.active !== false
    });
    setIsModalOpen(true);
  };

  // Image Upload Handler (Max 10MB limit as requested)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      alert(lang === 'km' 
        ? 'ទំហំរូបភាពលើសពី 10MB! សូមជ្រើសរើសរូបភាពដែលមានទំហំតូចជាង 10MB។' 
        : 'Image size exceeds 10MB! Please choose an image under 10MB.');
      return;
    }

    setCropperFileName(file.name || `banner_${Date.now()}.jpg`);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setCropperSrc(loadEvent.target.result);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input value so same image can be re-selected if needed
    e.target.value = '';
  };

  const handleCropFinished = (finalImageUrl) => {
    setFormData(prev => ({
      ...prev,
      image: finalImageUrl,
      // If title is empty, set a friendly default so user can post immediately
      title_kh: prev.title_kh || 'ការបញ្ចុះតម្លៃពិសេស',
      title_en: prev.title_en || 'Special Promotion'
    }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Auto default titles if image is present
    const finalData = {
      ...formData,
      title_kh: formData.title_kh.trim() || (formData.image ? 'ការបញ្ចុះតម្លៃពិសេស' : 'V8 Mini Mart Promotion'),
      title_en: formData.title_en.trim() || (formData.image ? 'Special Promotion' : 'V8 Mini Mart Promotion')
    };

    if (editingId) {
      updateBanner(editingId, finalData);
    } else {
      addBanner(finalData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              {lang === 'km' ? 'គ្រប់គ្រងផ្ទាំងផ្សព្វផ្សាយ (Banners)' : 'Promotional Banners'}
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {banners.length} {lang === 'km' ? 'ផ្ទាំង' : 'Banners'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'km' 
              ? 'បង្ហោះ (Post) រូបភាពផ្សព្វផ្សាយផ្ទាល់ពីទូរស័ព្ទ ឬកុំព្យូទ័របានយ៉ាងងាយស្រួល'
              : 'Post & manage promotional banners directly from your mobile phone or PC'}
          </p>
        </div>

        {/* Mobile-Optimized Big Post Button */}
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 active:scale-98 text-white px-5 py-3 rounded-2xl text-sm font-black flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-700/25"
        >
          <Send className="w-4 h-4" />
          <span>{lang === 'km' ? '+ បង្ហោះផ្ទាំងផ្សព្វផ្សាយថ្មី (Post)' : '+ Post New Banner'}</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {banners.map((b, idx) => (
          <div 
            key={b.id} 
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            {/* Banner Preview Strip */}
            <div 
              className={`relative h-36 sm:h-40 p-4 text-white flex flex-col justify-between overflow-hidden ${
                b.image 
                  ? 'bg-slate-900' 
                  : `bg-gradient-to-r ${b.gradient || 'from-emerald-900 via-emerald-800 to-orange-700'}`
              }`}
            >
              {b.image && (
                <div className="absolute inset-0 z-0">
                  <img src={resolveAssetUrl(b.image)} alt={b.title_en} onError={handleImageError} className="w-full h-full object-cover brightness-95" />
                </div>
              )}

              {/* Tag & Status */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="bg-black/50 backdrop-blur-xs border border-white/20 px-2.5 py-0.5 rounded-full text-xs font-black text-amber-300">
                  {lang === 'km' ? ((b.tag_kh || '').replace(/[\uFFFD]+/g, '') || '⭐ V8 ពិសេស') : (b.tag_en || '⭐ V8 DEAL')}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center space-x-1.5 shadow-sm ${
                  b.active ? 'bg-emerald-600 text-white' : 'bg-slate-800/90 text-slate-300 border border-white/10'
                }`}>
                  <span>{b.active ? (lang === 'km' ? '✅ កំពុងបង្ហាញលើ Website' : '✓ Active on Website') : (lang === 'km' ? '⏸️ បានលាក់ពី Website' : '⏸️ Hidden')}</span>
                </span>
              </div>

              {/* Banner Info */}
              {!b.image && (
                <div className="relative z-10 space-y-1">
                  <h3 className="text-base font-black text-white line-clamp-1">
                    {lang === 'km' ? (b.title_kh || '').replace(/[\uFFFD]+/g, '') : b.title_en}
                  </h3>
                  <p className="text-xs text-emerald-100 line-clamp-1">
                    {lang === 'km' ? (b.subtitle_kh || '').replace(/[\uFFFD]+/g, '') : b.subtitle_en}
                  </p>
                </div>
              )}
            </div>

            {/* Banner Control Toolbar with Checkbox */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <label 
                className={`px-3 py-2 rounded-xl border font-bold flex items-center space-x-2.5 cursor-pointer transition select-none ${
                  b.active 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs' 
                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200/80'
                }`}
                title={b.active ? (lang === 'km' ? 'ដោះ Checkbox ដើម្បីលាក់ពី Website' : 'Uncheck to hide from website') : (lang === 'km' ? 'គូស Checkbox ដើម្បីបង្ហាញលើ Website' : 'Check to show on website')}
              >
                <input
                  type="checkbox"
                  checked={!!b.active}
                  onChange={() => toggleBannerStatus(b.id)}
                  className="w-4 h-4 text-emerald-600 rounded border-emerald-400 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs font-black">
                  {b.active 
                    ? (lang === 'km' ? '☑️ បង្ហាញលើ Website' : '☑️ Show on Website') 
                    : (lang === 'km' ? '☐ លាក់មិនបង្ហាញ' : '☐ Hidden')}
                </span>
              </label>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="p-2 rounded-xl text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 border border-slate-200 transition font-bold flex items-center space-x-1"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{lang === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(lang === 'km' ? 'តើអ្នកពិតជាចង់លុបផ្ទាំងផ្សព្វផ្សាយនេះមែនទេ?' : 'Delete this banner?')) {
                      deleteBanner(b.id);
                    }
                  }}
                  className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL - Full Mobile Sheet Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Sticky Header with Quick Post Button */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {editingId 
                      ? (lang === 'km' ? 'កែប្រែផ្ទាំងផ្សព្វផ្សាយ' : 'Edit Banner')
                      : (lang === 'km' ? '📱 បង្ហោះផ្ទាំងផ្សព្វផ្សាយ (Post Banner)' : '📱 Post New Banner')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'km' ? 'ថតរូប ឬជ្រើសរូបពីទូរស័ព្ទដើម្បីបង្ហោះភ្លាមៗ' : 'Snap photo or pick from phone to post'}
                  </p>
                </div>
              </div>

              {/* Quick One-Tap Post Header Button */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'Post ឥឡូវ' : 'Post Now'}</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form Scrollable Content */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* LIVE PREVIEW BOX */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {lang === 'km' ? '👁️ មើលគំរូជាក់ស្តែងលើទូរស័ព្ទ (Mobile Preview)' : '👁️ Mobile Storefront Preview'}
                </label>
                <div 
                  className={`relative rounded-2xl h-36 sm:h-40 p-4 text-white flex flex-col justify-between overflow-hidden shadow-inner ${
                    formData.image 
                      ? 'bg-slate-900' 
                      : `bg-gradient-to-r ${formData.gradient}`
                  }`}
                >
                  {formData.image ? (
                    <div className="absolute inset-0 z-0 flex items-center justify-center">
                      <img src={resolveAssetUrl(formData.image)} alt="Preview" onError={handleImageError} className="w-full h-full object-cover brightness-95" />
                      {formData.badge_kh && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                            {formData.badge_kh}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300">
                          {formData.tag_kh || '⭐ V8 ពិសេស'}
                        </span>
                        {formData.badge_kh && (
                          <span className="bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                            {formData.badge_kh}
                          </span>
                        )}
                      </div>
                      <div className="relative z-10 space-y-0.5">
                        <h4 className="text-sm font-black text-white line-clamp-1">
                          {formData.title_kh || 'ចំណងជើងផ្ទាំងផ្សព្វផ្សាយ'}
                        </h4>
                        <p className="text-[10px] text-emerald-100 line-clamp-1">
                          {formData.subtitle_kh || 'ព័ត៌មានលម្អិតអំពីការបញ្ចុះតម្លៃ ឬការផ្ដល់ជូន...'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 1. Mobile & PC Image Upload Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-emerald-600/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-sm">
                    {lang === 'km' ? '📸 បង្ហោះរូបភាពពីទូរស័ព្ទ / កុំព្យូទ័រ (Max 10MB)' : '📸 Upload Banner Image (Max 10MB)'}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    📁 Folder: "image promotion"
                  </span>
                </div>

                {/* Hidden File & Camera Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Mobile Friendly Buttons: Camera & Gallery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Photo Gallery / File Picker */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{lang === 'km' ? '🖼️ ជ្រើសរូបពីទូរស័ព្ទ / File' : '🖼️ Pick from Gallery / PC'}</span>
                  </button>

                  {/* Direct Camera Capture for Mobile */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-900 active:scale-98 text-white px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'km' ? '📸 ថតរូបផ្ទាល់ពី Camera' : '📸 Snap Photo with Camera'}</span>
                  </button>
                </div>

                {formData.image && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setCropperSrc(formData.image);
                        setIsCropperOpen(true);
                      }}
                      className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1.5 transition border border-emerald-200"
                    >
                      <Crop className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'km' ? '✂️ មើល & កាត់រូបភាព (Crop)' : '✂️ View & Crop'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="text-rose-600 hover:text-rose-700 font-black text-xs px-2 py-1"
                    >
                      {lang === 'km' ? 'លុបរូបភាពចេញ' : 'Remove'}
                    </button>
                  </div>
                )}

                {/* Direct Image URL */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    {lang === 'km' ? 'ឬ បញ្ចូលតំណភ្ជាប់រូបភាព (Image URL)៖' : 'Or paste image URL:'}
                  </span>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/... or /image promotion/..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600 font-mono text-xs"
                  />
                </div>
              </div>

              {/* 2. Gradient Selection (Fallback if no image) */}
              {!formData.image && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {lang === 'km' ? '🎨 ពណ៌ផ្ទាំងផ្សព្វផ្សាយ (Gradient Theme)' : '🎨 Gradient Theme'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setFormData(prev => ({ ...prev, gradient: preset.value }))}
                        className={`p-2 rounded-xl text-left font-medium flex items-center space-x-2 border transition ${
                          formData.gradient === preset.value
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${preset.value}`} />
                        <span className="truncate text-[11px]">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Titles (Optional if image already has text) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'km' ? 'ចំណងជើងជាភាសាខ្មែរ' : 'Title (Khmer)'}
                  </label>
                  <input
                    type="text"
                    value={formData.title_kh}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_kh: e.target.value }))}
                    placeholder="ឧទាហរណ៍៖ ទំនិញស្រស់ថ្មី បញ្ចុះតម្លៃ 20%"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'km' ? 'ចំណងជើងជាភាសាអង់គ្លេស' : 'Title (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="e.g. Fresh Daily Goods & 20% OFF"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* 4. Subtitles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'km' ? 'ព័ត៌មានលម្អិត (ខ្មែរ)' : 'Subtitle (Khmer)'}
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_kh}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle_kh: e.target.value }))}
                    placeholder="ឧទាហរណ៍៖ ដឹកជញ្ជូនរហ័សទាន់ចិត្តក្នុង ៣០ នាទី"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'km' ? 'ព័ត៌មានលម្អិត (អង់គ្លេស)' : 'Subtitle (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle_en: e.target.value }))}
                    placeholder="e.g. Express 30-min delivery nationwide"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* 5. Badges & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'km' ? 'ស្លាក Tag (Badge)' : 'Tag Label'}
                  </label>
                  <input
                    type="text"
                    value={formData.tag_kh}
                    onChange={(e) => setFormData(prev => ({ ...prev, tag_kh: e.target.value }))}
                    placeholder="⭐ V8 ពិសេសប្រចាំថ្ងៃ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'km' ? 'បញ្ចុះតម្លៃ Tag (Discount Tag)' : 'Discount Tag'}
                  </label>
                  <input
                    type="text"
                    value={formData.badge_kh}
                    onChange={(e) => setFormData(prev => ({ ...prev, badge_kh: e.target.value }))}
                    placeholder="បញ្ចុះតម្លៃ 20%"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* 6. Active Toggle Checkbox */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-black text-xs sm:text-sm text-slate-900 block">
                    {lang === 'km' ? 'បង្ហាញផ្ទាំងផ្សព្វផ្សាយលើ Website ភ្ញៀវ' : 'Show Banner on Storefront'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {lang === 'km' ? 'បើចុច Checkbox ផ្ទាំងនេះនឹងបង្ហាញលើទំព័រដើម Website' : 'Check this box to display banner on customer homepage'}
                  </span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded border-emerald-400 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span className="font-bold text-xs text-emerald-800">
                    {formData.active ? (lang === 'km' ? '☑️ បង្ហាញ' : 'Show') : (lang === 'km' ? '☐ លាក់' : 'Hide')}
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 transition shadow-md shadow-emerald-700/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? (lang === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes') : (lang === 'km' ? 'បង្កើតផ្ទាំងផ្សព្វផ្សាយ' : 'Create Banner')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        imageSrc={cropperSrc}
        fileName={cropperFileName}
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropFinished}
        lang={lang}
      />
    </div>
  );
};

