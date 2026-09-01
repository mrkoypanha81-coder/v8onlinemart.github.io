import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Search, Plus, Filter, Edit, Trash2, PlusCircle, 
  MinusCircle, AlertTriangle, CheckCircle, XCircle, 
  X, Check, Image as ImageIcon, Sparkles, Calendar, 
  Clock, Camera, Upload, ShieldCheck, Tag, Layers, 
  ArrowUpDown, DollarSign, TrendingUp, HelpCircle, Loader2,
  Truck, Building2, Phone, FileText
} from 'lucide-react';
import { compressImageToLimit } from '../../utils/imageCompressor';

// Client-side image compression to prevent QuotaExceededError and huge payloads
const compressAndResizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const InventoryTable = () => {
  const { 
    products, 
    categories, 
    addProduct, 
    editProduct, 
    deleteProduct, 
    adjustStock, 
    formatPrice, 
    exchangeRate = 4000,
    totalCostValue,
    totalInventoryValue,
    totalEstimatedStockProfit,
    lang, 
    t 
  } = useStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'expiring_soon' | 'expired' | 'low_stock' | 'out_of_stock'

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title_en: '',
    title_kh: '',
    description_en: '',
    description_kh: '',
    sku: '',
    currency: 'USD',         // 'USD' ($) | 'KHR' (៛)
    cost_price: '',          // តម្លៃដើម (Admin only)
    price: '',               // តម្លៃលក់ចេញ (Customer storefront)
    original_price: '',      // តម្លៃដើមមុនបញ្ចុះ
    has_discount: false,     // Checkbox: false = Normal Price (No Discount), true = Has Promo Strikethrough
    stock_quantity: '',
    category_id: 'beverages',
    supplier_name: '',       // អ្នកផ្គត់ផ្គង់
    supplier_contact: '',    // លេខទូរស័ព្ទ / ទំនាក់ទំនង
    purchase_invoice_no: '', // លេខវិក្កយបត្រ / PO
    expiry_date: '',
    mfg_date: '',
    batch_no: '',
    images: ['https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80']
  });

  // Calculate Expiry Status helper
  const getExpiryDetails = (expiryDateStr) => {
    if (!expiryDateStr) return { status: 'none', label_kh: 'គ្មានកាលបរិច្ឆេទ', label_en: 'No Expiry', days: null, color: 'text-slate-400 bg-slate-100 border-slate-200' };
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        label_kh: `⛔ ផុតកំណត់ ${Math.abs(diffDays)} ថ្ងៃមុន`,
        label_en: `⛔ Expired (${Math.abs(diffDays)}d ago)`,
        days: diffDays,
        color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
      };
    } else if (diffDays <= 30) {
      return {
        status: 'expiring_soon',
        label_kh: `⚠️ នៅសល់ ${diffDays} ថ្ងៃទៀត`,
        label_en: `⚠️ ${diffDays} days left`,
        days: diffDays,
        color: 'text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      };
    } else {
      return {
        status: 'good',
        label_kh: `🟢 នៅសល់ ${diffDays} ថ្ងៃ`,
        label_en: `🟢 ${diffDays} days left`,
        days: diffDays,
        color: 'text-emerald-800 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      };
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const query = search.toLowerCase().trim();
    const matchSearch = query === '' || 
                        (p.title_en && p.title_en.toLowerCase().includes(query)) || 
                        (p.title_kh && p.title_kh.toLowerCase().includes(query)) || 
                        (p.sku && p.sku.toLowerCase().includes(query)) ||
                        (p.batch_no && p.batch_no.toLowerCase().includes(query));

    const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter;

    let matchStatus = true;
    const expInfo = getExpiryDetails(p.expiry_date);

    if (statusFilter === 'expiring_soon') matchStatus = expInfo.status === 'expiring_soon';
    if (statusFilter === 'expired') matchStatus = expInfo.status === 'expired';
    if (statusFilter === 'low_stock') matchStatus = p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5);
    if (statusFilter === 'out_of_stock') matchStatus = p.stock_quantity === 0;

    return matchSearch && matchCategory && matchStatus;
  });

  // Handle Photo Upload / Camera Snap with auto-compression and server upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setCompressionStats(null); // Clear previous stats

      // 1. Auto-compress client-side to target limit of 1MB while keeping resolution clear
      const compressResult = await compressImageToLimit(file, 1 * 1024 * 1024);

      setCompressionStats({
        original: compressResult.originalFormatted,
        compressed: compressResult.compressedFormatted,
        ratio: compressResult.ratio
      });

      // 2. Try uploading to backend /api/upload-product-image
      let finalImageUrl = compressResult.base64;
      try {
        const response = await fetch('/api/upload-product-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: compressResult.base64,
            fileName: `prod_${Date.now()}`
          })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.url) {
            finalImageUrl = result.url;
          }
        }
      } catch (uploadErr) {
        console.warn('Direct server upload skipped, using compressed data URL', uploadErr);
      }

      setFormData(prev => ({
        ...prev,
        images: [finalImageUrl]
      }));
    } catch (err) {
      console.error('Failed to process image:', err);
      alert(lang === 'km' ? 'មិនអាចដំណើរការរូបភាពបានទេ សូមសាកល្បងម្ដងទៀត' : 'Failed to process image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setCompressionStats(null);
    setFormData({
      title_en: '',
      title_kh: '',
      description_en: '',
      description_kh: '',
      sku: `V8-${Math.floor(1000 + Math.random() * 9000)}`,
      currency: 'USD', // Default USD or KHR
      cost_price: '1.80',
      price: '2.50',
      original_price: '',
      has_discount: false, // Checkbox: false = Normal Price (No Discount), true = Has Promo
      stock_quantity: '20',
      category_id: 'beverages',
      supplier_name: 'Cambrew / Angkor Brewery',
      supplier_contact: '012 888 999',
      purchase_invoice_no: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months default
      mfg_date: new Date().toISOString().split('T')[0],
      batch_no: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      images: ['https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80']
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setCompressionStats(null);
    const hasDiscount = Boolean(product.original_price && parseFloat(product.original_price) > parseFloat(product.price));
    setFormData({
      title_en: product.title_en || '',
      title_kh: product.title_kh || '',
      description_en: product.description_en || '',
      description_kh: product.description_kh || '',
      sku: product.sku || '',
      currency: product.currency || 'USD',
      cost_price: (product.cost_price !== undefined ? product.cost_price : (product.price * 0.7).toFixed(2)).toString(),
      price: (product.price || 0).toString(),
      original_price: (product.original_price || '').toString(),
      has_discount: hasDiscount,
      stock_quantity: (product.stock_quantity || 0).toString(),
      category_id: product.category_id || 'beverages',
      supplier_name: product.supplier_name || '',
      supplier_contact: product.supplier_contact || '',
      purchase_invoice_no: product.purchase_invoice_no || '',
      expiry_date: product.expiry_date || '',
      mfg_date: product.mfg_date || '',
      batch_no: product.batch_no || '',
      images: product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80']
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const category = categories.find(c => c.id === formData.category_id);

    const costNum = parseFloat(formData.cost_price) || 0;
    const priceNum = parseFloat(formData.price) || 0;
    const originalNum = formData.has_discount && formData.original_price ? parseFloat(formData.original_price) : null;
    const itemCurrency = formData.currency || 'USD';

    const productPayload = {
      title_en: (formData.title_en || '').trim() || (formData.title_kh || '').trim() || 'Product',
      title_kh: (formData.title_kh || '').trim() || (formData.title_en || '').trim() || 'ទំនិញ',
      description_en: formData.description_en || '',
      description_kh: formData.description_kh || '',
      sku: (formData.sku || '').trim() || `V8-PRD-${Date.now().toString().slice(-4)}`,
      currency: itemCurrency, // 'USD' | 'KHR'
      cost_price: costNum, // តម្លៃដើម (Admin only)
      price: priceNum,     // តម្លៃលក់ចេញ (Customer / Website)
      original_price: originalNum,
      has_discount: Boolean(formData.has_discount && originalNum && originalNum > priceNum),
      stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
      category_id: formData.category_id,
      category_name_en: category ? category.name_en : 'General',
      category_name_kh: category ? category.name_kh : 'ទូទៅ',
      supplier_name: (formData.supplier_name || '').trim() || 'General Supplier',
      supplier_contact: (formData.supplier_contact || '').trim() || '',
      purchase_invoice_no: (formData.purchase_invoice_no || '').trim() || '',
      expiry_date: formData.expiry_date || null,
      mfg_date: formData.mfg_date || null,
      batch_no: formData.batch_no || null,
      images: formData.images && formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80'],
      discount: originalNum && originalNum > priceNum
        ? Math.round(((originalNum - priceNum) / originalNum) * 100) 
        : 0
    };

    if (editingProduct) {
      editProduct({ ...editingProduct, ...productPayload });
    } else {
      addProduct(productPayload);
    }
    setIsModalOpen(false);
  };

  // Counts for alert filter badges
  const expiringCount = products.filter(p => getExpiryDetails(p.expiry_date).status === 'expiring_soon').length;
  const expiredCount = products.filter(p => getExpiryDetails(p.expiry_date).status === 'expired').length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)).length;

  // Live Modal Margin preview
  const modalCost = parseFloat(formData.cost_price) || 0;
  const modalPrice = parseFloat(formData.price) || 0;
  const modalUnitProfit = modalPrice - modalCost;
  const modalMarginPct = modalPrice > 0 ? ((modalUnitProfit / modalPrice) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
      {/* 1. Header Toolbar & Quick Stats */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                {lang === 'km' ? 'គ្រប់គ្រងស្តុក & តម្លៃទំនិញ (Inventory & Pricing)' : 'Inventory & Pricing Management'}
              </h1>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {products.length} {lang === 'km' ? 'មុខ' : 'Items'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'km' 
                ? 'កំណត់តម្លៃដើម (Cost), តម្លៃលក់ (Sell), ថ្ងៃផុតកំណត់ (Expiry) និងគ្រប់គ្រងស្តុក'
                : 'Manage cost prices (admin only), selling prices, expiration tracking & stock counts'}
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 active:scale-98 text-white px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'km' ? '+ បញ្ចូលទំនិញថ្មី (Add Product)' : '+ Add Product'}</span>
          </button>
        </div>

        {/* Live Warehouse Financial Summary Pill Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">
              {lang === 'km' ? 'ដើមទុនក្នុងស្តុក (Cost)' : 'Inventory Cost'}
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
              ${totalCostValue.toFixed(2)}
            </span>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-bold uppercase">
              {lang === 'km' ? 'តម្លៃលក់សរុប (Retail)' : 'Retail Value'}
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-200 font-mono">
              ${totalInventoryValue.toFixed(2)}
            </span>
          </div>

          <div className="bg-orange-50/70 dark:bg-orange-950/40 p-2.5 rounded-2xl border border-orange-200/70 dark:border-orange-800/60">
            <span className="text-[10px] text-orange-700 dark:text-orange-300 block font-bold uppercase">
              {lang === 'km' ? 'ចំណេញរំពឹងទុក (Est. Profit)' : 'Est. Profit'}
            </span>
            <span className="text-xs sm:text-sm font-black text-orange-700 dark:text-orange-300 font-mono">
              +${totalEstimatedStockProfit.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 2. Filter Status Pills (All, Expiring Soon, Expired, Low Stock) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain touch-pan-x">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition border ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-emerald-700 text-white border-slate-900 dark:border-emerald-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {lang === 'km' ? 'ទាំងអស់' : 'All'} ({products.length})
          </button>

          <button
            onClick={() => setStatusFilter('expiring_soon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition border flex items-center space-x-1.5 ${
              statusFilter === 'expiring_soon'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? '⚠️ ជិតផុតកំណត់ (Expiring Soon)' : '⚠️ Expiring Soon'}</span>
            {expiringCount > 0 && (
              <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {expiringCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition border flex items-center space-x-1.5 ${
              statusFilter === 'expired'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? '⛔ ផុតកំណត់ហើយ (Expired)' : '⛔ Expired'}</span>
            {expiredCount > 0 && (
              <span className="bg-rose-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {expiredCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition border flex items-center space-x-1.5 ${
              statusFilter === 'low_stock'
                ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                : 'bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100'
            }`}
          >
            <span>{lang === 'km' ? '📉 ស្តុកជិតអស់' : '📉 Low Stock'}</span>
            {lowStockCount > 0 && (
              <span className="bg-orange-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>

        {/* 3. Search & Category Select Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកឈ្មោះទំនិញ, SKU, ឬ Batch No...' : 'Search product, SKU or Batch No...'}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter products by category"
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-600 font-bold"
            >
              <option value="all">{t.allCategories}</option>
              {categories.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>
                  {lang === 'km' ? c.name_kh : c.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. PRODUCTS LIST: MOBILE CARDS & DESKTOP TABLE                 */}
      {/* ============================================================== */}
      
      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center text-slate-400 border border-slate-200 dark:border-slate-800">
            {lang === 'km' ? 'មិនមានទំនិញដែលត្រូវនឹងការស្វែងរក' : 'No products found'}
          </div>
        ) : (
          filteredProducts.map((p) => {
            const exp = getExpiryDetails(p.expiry_date);
            const cost = parseFloat(p.cost_price) || 0;
            const price = parseFloat(p.price) || 0;
            const profit = price - cost;
            const marginPct = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;

            return (
              <div 
                key={p.id} 
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                {/* Row 1: Image, Title, SKU */}
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <img src={p.images[0]} alt={p.title_en || p.title_kh} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                      {p.sku}
                    </span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 mt-0.5">
                      {lang === 'km' ? p.title_kh : (p.title_en || p.title_kh)}
                    </h3>
                  </div>
                </div>

                {/* Row 2: Pricing Comparison: Cost vs Sell vs Profit */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'km' ? 'ដើម (Admin)' : 'Cost'}
                    </span>
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 font-mono">
                      {p.currency === 'KHR' ? `${Math.round(cost).toLocaleString()} ៛` : `$${cost.toFixed(2)}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                      {lang === 'km' ? 'លក់ (Sell)' : 'Sell'}
                    </span>
                    <span className="text-xs font-black text-orange-600 dark:text-orange-400 font-mono">
                      {p.currency === 'KHR' ? `${Math.round(price).toLocaleString()} ៛` : `$${price.toFixed(2)}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-bold">
                      {lang === 'km' ? 'ចំណេញ (Margin)' : 'Profit'}
                    </span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      {p.currency === 'KHR' 
                        ? `+${Math.round(profit).toLocaleString()} ៛ (${marginPct}%)`
                        : `+$${profit.toFixed(2)} (${marginPct}%)`}
                    </span>
                  </div>
                </div>

                {/* Row 3: Expiry & Batch Info */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'km' ? 'កាលបរិច្ឆេទផុតកំណត់ (Expiry):' : 'Expiry Date:'}
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border inline-block ${exp.color}`}>
                      {lang === 'km' ? exp.label_kh : exp.label_en} ({p.expiry_date || 'N/A'})
                    </span>
                  </div>
                  {p.batch_no && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Lot:</span>
                      <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">{p.batch_no}</span>
                    </div>
                  )}
                </div>

                {/* Row 3.5: Supplier Info */}
                {p.supplier_name && (
                  <div className="flex items-center space-x-1.5 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                    <Building2 className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{lang === 'km' ? 'អ្នកផ្គត់ផ្គង់៖' : 'Supplier:'} {p.supplier_name}</span>
                    {p.supplier_contact && <span className="text-slate-400 font-normal">({p.supplier_contact})</span>}
                  </div>
                )}

                {/* Row 4: Stock Counter & Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  {/* Stock Adjuster */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => adjustStock(p.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center justify-center font-black"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-black px-1 text-slate-900 dark:text-white">
                      {p.stock_quantity}
                    </span>
                    <button
                      onClick={() => adjustStock(p.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center justify-center font-black"
                    >
                      +
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center space-x-1 border border-emerald-200 dark:border-emerald-800"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{lang === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(lang === 'km' ? 'តើអ្នកចង់លុបទំនិញនេះមែនទេ?' : 'Delete product?')) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-3 py-3.5">Category</th>
                <th className="px-3 py-3.5">
                  <span className="text-slate-700 dark:text-slate-300 block">តម្លៃដើម (Cost)</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">admin only</span>
                </th>
                <th className="px-3 py-3.5">
                  <span className="text-orange-600 dark:text-orange-400 block">តម្លៃលក់ (Sell)</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">storefront</span>
                </th>
                <th className="px-3 py-3.5">
                  <span className="text-emerald-700 dark:text-emerald-300 block">ចំណេញ (Margin)</span>
                </th>
                <th className="px-3 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Expiry Status (កាលបរិច្ឆេទ)</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const exp = getExpiryDetails(p.expiry_date);
                const cost = parseFloat(p.cost_price) || 0;
                const price = parseFloat(p.price) || 0;
                const profit = price - cost;
                const marginPct = price > 0 ? ((profit / price) * 100).toFixed(0) : 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    {/* Product Image & Title */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={p.images[0]} 
                          alt={p.title_en || p.title_kh} 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {lang === 'km' ? p.title_kh : (p.title_en || p.title_kh)}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                            <span>{p.sku}</span>
                            {p.batch_no && (
                              <>
                                <span>•</span>
                                <span>Lot: {p.batch_no}</span>
                              </>
                            )}
                            {p.supplier_name && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">🏬 {p.supplier_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3.5">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                        {lang === 'km' ? p.category_name_kh : p.category_name_en}
                      </span>
                    </td>

                    {/* Cost Price (Admin Only) */}
                    <td className="px-3 py-3.5 font-mono font-bold text-slate-600 dark:text-slate-300">
                      {p.currency === 'KHR' ? `${Math.round(cost).toLocaleString()} ៛` : `$${cost.toFixed(2)}`}
                    </td>

                    {/* Selling Price (Website/Customer) */}
                    <td className="px-3 py-3.5 font-mono font-black text-orange-600 dark:text-orange-400 text-sm">
                      {p.currency === 'KHR' ? `${Math.round(price).toLocaleString()} ៛` : `$${price.toFixed(2)}`}
                      {p.original_price && (
                        <span className="block text-[10px] text-slate-400 line-through">
                          {p.currency === 'KHR' ? `${Math.round(p.original_price).toLocaleString()} ៛` : `$${p.original_price.toFixed(2)}`}
                        </span>
                      )}
                    </td>

                    {/* Profit Margin */}
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                        {p.currency === 'KHR' 
                          ? `+${Math.round(profit).toLocaleString()} ៛ (${marginPct}%)`
                          : `+$${profit.toFixed(2)} (${marginPct}%)`}
                      </span>
                    </td>

                    {/* Stock with inline adjuster */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => adjustStock(p.id, -1)}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className={`font-mono font-black px-1.5 py-0.5 rounded text-xs ${
                          p.stock_quantity <= 5 ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-900 dark:text-white'
                        }`}>
                          {p.stock_quantity}
                        </span>
                        <button
                          onClick={() => adjustStock(p.id, 1)}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-black flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Expiry Badge */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border inline-flex items-center space-x-1 ${exp.color}`}>
                          <span>{lang === 'km' ? exp.label_kh : exp.label_en}</span>
                        </span>
                        {p.expiry_date && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Exp: {p.expiry_date}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(lang === 'km' ? 'តើអ្នកចង់លុបទំនិញនេះមែនទេ?' : 'Delete product?')) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. ADD / EDIT PRODUCT MODAL (With Camera, Auto-Compress, Expiry) */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {editingProduct 
                      ? (lang === 'km' ? 'កែប្រែព័ត៌មានទំនិញ & តម្លៃ' : 'Edit Product & Pricing') 
                      : (lang === 'km' ? 'បញ្ចូលទំនិញថ្មី (Add Product)' : 'Add New Product')}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'km' ? 'ថតរូប Upload រូបភាព និងកំណត់តម្លៃដើម/លក់ចេញ' : 'Photo upload, cost price & selling price setup'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* SECTION 1: Product Photo Upload / Camera Snap */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border-2 border-dashed border-emerald-600/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {lang === 'km' ? '📸 រូបភាពទំនិញ (Product Image Auto-Optimized)' : '📸 Product Image (Auto-Optimized)'}
                  </label>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Camera & Gallery Auto-Compress
                  </span>
                </div>

                {/* Hidden File / Camera Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {/* Image Preview & Buttons */}
                <div className="flex items-center space-x-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-xs relative">
                    <img 
                      src={formData.images[0]} 
                      alt="Product Preview" 
                      className="w-full h-full object-cover"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white px-3 py-2 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'ជ្រើសរូបពីទូរស័ព្ទ / PC' : 'Pick from Gallery'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="bg-slate-800 hover:bg-slate-900 active:scale-98 text-white px-3 py-2 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lang === 'km' ? 'ថតរូបផ្ទាល់ (Camera)' : 'Snap Photo'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={formData.images[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, images: [e.target.value] }))}
                      placeholder="Image URL or Path (/image prodacts/...)"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Auto File Converter Compression Stats */}
                {compressionStats && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-[11px] text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <span>Auto File Converter Active</span>
                        <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded">Success</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">
                        {lang === 'km' 
                          ? `បំប្លែងរូបភាពជោគជ័យ៖ ទំហំដើម ${compressionStats.original} មកនៅត្រឹម ${compressionStats.compressed} (សន្សំសំចៃបាន ${compressionStats.ratio}%)`
                          : `Successfully optimized image size: ${compressionStats.original} → ${compressionStats.compressed} (Saved ${compressionStats.ratio}%)`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: COST PRICE & SELLING PRICE CONFIGURATION (USD & KHR SUPPORT) */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border-2 border-emerald-600/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-600/20 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <h4 className="font-black text-xs text-emerald-950 dark:text-emerald-200">
                      {lang === 'km' ? '💰 កំណត់តម្លៃដើម & តម្លៃលក់ចេញ (Cost & Selling Price)' : '💰 Pricing & Profit Setup'}
                    </h4>
                  </div>

                  {/* Currency Switcher for Product Input */}
                  <div className="flex items-center bg-white dark:bg-slate-850 rounded-xl p-1 border border-emerald-300 dark:border-emerald-700 shadow-xs self-start sm:self-auto">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5 font-mono">
                      {lang === 'km' ? 'រូបិយប័ណ្ណ៖' : 'Currency:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        currency: 'USD',
                        // Convert if switching from KHR
                        cost_price: prev.currency === 'KHR' && prev.cost_price ? (parseFloat(prev.cost_price) / exchangeRate).toFixed(2) : prev.cost_price,
                        price: prev.currency === 'KHR' && prev.price ? (parseFloat(prev.price) / exchangeRate).toFixed(2) : prev.price,
                        original_price: prev.currency === 'KHR' && prev.original_price ? (parseFloat(prev.original_price) / exchangeRate).toFixed(2) : prev.original_price
                      }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                        formData.currency === 'USD' || !formData.currency
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                      }`}
                    >
                      🇺🇸 USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        currency: 'KHR',
                        // Convert if switching from USD
                        cost_price: prev.currency !== 'KHR' && prev.cost_price ? Math.round(parseFloat(prev.cost_price) * exchangeRate).toString() : prev.cost_price,
                        price: prev.currency !== 'KHR' && prev.price ? Math.round(parseFloat(prev.price) * exchangeRate).toString() : prev.price,
                        original_price: prev.currency !== 'KHR' && prev.original_price ? Math.round(parseFloat(prev.original_price) * exchangeRate).toString() : prev.original_price
                      }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                        formData.currency === 'KHR'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                      }`}
                    >
                      🇰🇭 KHR (៛)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Cost Price (តម្លៃដើមទិញចូល) */}
                  <div className="bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <label className="block font-black text-slate-700 dark:text-slate-200 text-xs flex items-center justify-between">
                      <span>{lang === 'km' ? 'តម្លៃដើម (Cost Price) *' : `Cost Price (${formData.currency === 'KHR' ? '៛' : '$'}) *`}</span>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                        Admin Only
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-bold font-mono">
                        {formData.currency === 'KHR' ? '៛' : '$'}
                      </span>
                      <input
                        type="number"
                        step={formData.currency === 'KHR' ? '100' : '0.01'}
                        required
                        value={formData.cost_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                        placeholder={formData.currency === 'KHR' ? '7200' : '1.80'}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-slate-400 font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {formData.currency === 'KHR' 
                        ? `≈ $${((parseFloat(formData.cost_price) || 0) / exchangeRate).toFixed(2)} (អត្រា $1 = ${exchangeRate.toLocaleString()}៛)`
                        : `≈ ${Math.round((parseFloat(formData.cost_price) || 0) * exchangeRate).toLocaleString()} ៛ (អត្រា $1 = ${exchangeRate.toLocaleString()}៛)`}
                    </p>
                  </div>

                  {/* Selling Price (តម្លៃលក់ចេញ) */}
                  <div className="bg-white dark:bg-slate-850 p-3 rounded-xl border-2 border-orange-500/40 dark:border-orange-500/40 space-y-1">
                    <label className="block font-black text-orange-600 dark:text-orange-400 text-xs flex items-center justify-between">
                      <span>{lang === 'km' ? 'តម្លៃលក់ចេញ (Selling Price) *' : `Selling Price (${formData.currency === 'KHR' ? '៛' : '$'}) *`}</span>
                      <span className="text-[9px] bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold">
                        Website ភ្ញៀវ
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-orange-500 font-bold font-mono">
                        {formData.currency === 'KHR' ? '៛' : '$'}
                      </span>
                      <input
                        type="number"
                        step={formData.currency === 'KHR' ? '100' : '0.01'}
                        required
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder={formData.currency === 'KHR' ? '10000' : '2.50'}
                        className="w-full pl-7 pr-3 py-1.5 bg-orange-50/50 dark:bg-slate-800 border border-orange-300 dark:border-orange-600 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 font-mono font-black text-orange-600 dark:text-orange-400"
                      />
                    </div>
                    <p className="text-[10px] text-orange-600 font-medium">
                      {formData.currency === 'KHR' 
                        ? `≈ $${((parseFloat(formData.price) || 0) / exchangeRate).toFixed(2)} (បង្ហាញលើ Website)`
                        : `≈ ${Math.round((parseFloat(formData.price) || 0) * exchangeRate).toLocaleString()} ៛ (បង្ហាញលើ Website)`}
                    </p>
                  </div>

                  {/* Original / Normal Promo Price with No-Discount Checkbox */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    formData.has_discount 
                      ? 'bg-white dark:bg-slate-850 border-amber-300 dark:border-amber-700 shadow-xs' 
                      : 'bg-slate-50/80 dark:bg-slate-850/60 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5 gap-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs truncate">
                        {lang === 'km' ? 'តម្លៃមុនបញ្ចុះ (Normal Price)' : `Original (${formData.currency === 'KHR' ? '៛' : '$'})`}
                      </label>
                      
                      {/* Checkbox: No Discount = Normal Price */}
                      <label className="flex items-center space-x-1.5 cursor-pointer select-none bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition">
                        <input
                          type="checkbox"
                          checked={!formData.has_discount}
                          onChange={(e) => {
                            const isNoDiscount = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              has_discount: !isNoDiscount,
                              original_price: isNoDiscount ? '' : (prev.original_price || (prev.price ? (parseFloat(prev.price) * 1.2).toFixed(prev.currency === 'KHR' ? 0 : 2) : ''))
                            }));
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {lang === 'km' ? 'គ្មានបញ្ចុះតម្លៃ' : 'No Discount'}
                        </span>
                      </label>
                    </div>

                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400 font-bold font-mono">
                        {formData.currency === 'KHR' ? '៛' : '$'}
                      </span>
                      <input
                        type="number"
                        step={formData.currency === 'KHR' ? '100' : '0.01'}
                        disabled={!formData.has_discount}
                        value={formData.has_discount ? formData.original_price : ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                        placeholder={!formData.has_discount 
                          ? (lang === 'km' ? 'លក់តម្លៃធម្មតា (No Discount)' : 'Normal Price (No Discount)') 
                          : (formData.currency === 'KHR' ? '12000' : '3.00')}
                        className={`w-full pl-7 pr-3 py-1.5 border rounded-lg outline-none font-mono transition ${
                          !formData.has_discount 
                            ? 'bg-slate-100/90 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed italic font-medium'
                            : 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-600 focus:ring-2 focus:ring-amber-400 font-bold text-slate-800 dark:text-slate-100'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {!formData.has_discount 
                        ? (lang === 'km' ? '✅ តម្លៃធម្មតា មិនមានបញ្ចុះតម្លៃឡើយ' : 'Normal retail price, no strikethrough')
                        : (lang === 'km' ? '🏷️ សម្រាប់គូសបន្ទាត់ចោលបញ្ចុះតម្លៃ' : 'Strikethrough original price')}
                    </p>
                  </div>
                </div>

                {/* Live Profit Preview Box */}
                <div className="p-3 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      {lang === 'km' ? 'ចំណេញរំពឹងទុកក្នុង ១ ឯកតា:' : 'Unit Profit Margin:'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-200 font-mono">
                      {formData.currency === 'KHR'
                        ? `+${Math.round(modalUnitProfit).toLocaleString()} ៛ (${modalMarginPct}%) ≈ +$${(modalUnitProfit / exchangeRate).toFixed(2)}`
                        : `+$${modalUnitProfit.toFixed(2)} (${modalMarginPct}%) ≈ +${Math.round(modalUnitProfit * exchangeRate).toLocaleString()} ៛`}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Titles (Khmer & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'km' ? 'ឈ្មោះទំនិញជាភាសាខ្មែរ *' : 'Title (Khmer) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_kh}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_kh: e.target.value }))}
                    placeholder="ឧទាហរណ៍៖ ស្រាបៀរអង្គរ កំប៉ុង..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'km' ? 'ឈ្មោះទំនិញជាភាសាអង់គ្លេស' : 'Title (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="e.g. Angkor Premium Beer Can..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* SECTION 4: SKU, Category, Stock Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-emerald-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-emerald-600 font-bold"
                  >
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>
                        {lang === 'km' ? c.name_kh : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Units (ចំនួនស្តុក) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    placeholder="20"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl outline-none focus:border-emerald-600 font-mono font-bold"
                  />
                </div>
              </div>

              {/* SECTION 5: Expiration Date & Batch Tracking */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <h4 className="font-black text-xs text-amber-900 dark:text-amber-300">
                    {lang === 'km' ? '📅 ព័ត៌មានកាលបរិច្ឆេទផុតកំណត់ (Expiration Tracking)' : '📅 Expiration & Lot Information'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Expiration Date */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'km' ? 'កាលបរិច្ឆេទផុតកំណត់ (Expire Date) *' : 'Expire Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  {/* Manufacture Date */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'km' ? 'ថ្ងៃផលិត (Manufactured Date)' : 'MFG Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.mfg_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, mfg_date: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Batch / Lot No */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'km' ? 'លេខកូដឡូតិ៍ (Batch / Lot No)' : 'Batch / Lot No'}
                    </label>
                    <input
                      type="text"
                      value={formData.batch_no}
                      onChange={(e) => setFormData(prev => ({ ...prev, batch_no: e.target.value }))}
                      placeholder="e.g. LOT-2026-08"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: SUPPLIER & PROCUREMENT (អ្នកផ្គត់ផ្គង់ & វិក្កយបត្រ) */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                    <h4 className="font-black text-xs text-indigo-950 dark:text-indigo-200">
                      {lang === 'km' ? '🏬 ព័ត៌មានអ្នកផ្គត់ផ្គង់ (Supplier & Procurement)' : '🏬 Supplier & Procurement Information'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    {lang === 'km' ? 'ប្រភពទំនិញ' : 'Vendor Tracking'}
                  </span>
                </div>

                {/* Quick Suggestion Chips for Popular Suppliers in Cambodia */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    {lang === 'km' ? '⚡ ជ្រើសរើសរហ័ស (Quick Pick Supplier):' : '⚡ Quick Pick Supplier:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Cambrew / Angkor Brewery',
                      'Coca-Cola Beverages Cambodia',
                      'CP Cambodia',
                      'Nestle / F&N Cambodia',
                      'Unilever Cambodia',
                      'Local Farm / ក្នុងស្រុក'
                    ].map((sup, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, supplier_name: sup }))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                          formData.supplier_name === sup
                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {sup}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Supplier Name */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{lang === 'km' ? 'ឈ្មោះអ្នកផ្គត់ផ្គង់ (Supplier) *' : 'Supplier Name *'}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                      placeholder="e.g. Cambrew, CBC, CP..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Contact / Phone */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{lang === 'km' ? 'លេខទូរស័ព្ទ / ទំនាក់ទំនង' : 'Contact Phone'}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_contact: e.target.value }))}
                      placeholder="012 888 999 / Telegram"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Purchase Invoice / Reference */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{lang === 'km' ? 'លេខវិក្កយបត្រទិញចូល (PO / Ref)' : 'Invoice / PO Ref'}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.purchase_invoice_no}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_invoice_no: e.target.value }))}
                      placeholder="INV-2026-081"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer (Sticky & Mobile-friendly) */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-700/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingProduct 
                      ? (lang === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes') 
                      : (lang === 'km' ? 'រក្សាទុកទំនិញថ្មី' : 'Save Product')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
