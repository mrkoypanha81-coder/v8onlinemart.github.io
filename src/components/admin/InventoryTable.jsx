import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Search, Plus, Filter, Edit, Trash2, PlusCircle, 
  MinusCircle, AlertTriangle, CheckCircle, XCircle, 
  X, Check, Image as ImageIcon, Sparkles, Calendar, 
  Clock, Camera, Upload, ShieldCheck, Tag, Layers, 
  ArrowUpDown, DollarSign, TrendingUp, HelpCircle, Loader2,
  Truck, Building2, Phone, FileText, BarChart2, Printer, Download,
  PieChart, CalendarDays, Eye
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
    products = [], 
    categories = [], 
    addProduct, 
    editProduct, 
    deleteProduct, 
    adjustStock, 
    stockMovements = [],
    priceHistory = [],
    recordStockMovement,
    recordPriceChange,
    exchangeRate = 4000,
    totalCostValue = 0,
    totalInventoryValue = 0,
    totalEstimatedStockProfit = 0,
    orders = [],
    lang = 'km'
  } = useStore();

  const formatPrice = (amountUsd) => {
    const val = parseFloat(amountUsd) || 0;
    return `$${val.toFixed(2)} (${Math.round(val * exchangeRate).toLocaleString()} ៛)`;
  };

  const formatDualPrice = (amountUsd) => {
    const val = parseFloat(amountUsd) || 0;
    return {
      usd: `$${val.toFixed(2)}`,
      khr: `${Math.round(val * exchangeRate).toLocaleString()} ៛`
    };
  };

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'expiring_soon' | 'expired' | 'low_stock' | 'out_of_stock'

  // Report Modal & Period Filter State (Daily, Weekly, Monthly, Yearly)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategory, setReportCategory] = useState('all');
  const [reportSubTab, setReportSubTab] = useState('inventory'); // 'inventory' | 'top_selling' | 'risk_expiring' | 'supplier_po' | 'category_margin'
  const [topSellingSort, setTopSellingSort] = useState('qty'); // 'qty' | 'revenue' | 'profit'

  // Professional Stock Adjustment Modal State
  const [stockAdjustProduct, setStockAdjustProduct] = useState(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState('10');
  const [adjustMode, setAdjustMode] = useState('IN'); // 'IN' | 'OUT'
  const [adjustReason, setAdjustReason] = useState('Purchase'); // 'Purchase' | 'Return' | 'Correction' | 'Damaged' | 'Lost' | 'Supplier Return'
  const [adjustRefNo, setAdjustRefNo] = useState('');
  const [adjustStaff, setAdjustStaff] = useState('Mart Manager (Super Admin)');

  // 7-Tab Product 360° Detail Modal State
  const [detailedProduct, setDetailedProduct] = useState(null);
  const [detailTab, setDetailTab] = useState('basic'); // 'basic' | 'pricing' | 'inventory' | 'batch' | 'supplier' | 'stock_history' | 'sales'

  // Supplier 360° Profile Modal State
  const [selectedSupplierName, setSelectedSupplierName] = useState(null);

  // Filter orders by period (Daily, Weekly, Monthly, Yearly)
  const getFilteredPeriodOrders = () => {
    if (!orders || orders.length === 0) return [];
    
    const targetDate = new Date(reportDate || Date.now());
    
    return orders.filter(order => {
      if (!order.created_at || order.status === 'cancelled') return false;
      const orderDate = new Date(order.created_at);
      if (isNaN(orderDate.getTime())) return false;

      if (reportPeriod === 'daily') {
        return orderDate.getFullYear() === targetDate.getFullYear() &&
               orderDate.getMonth() === targetDate.getMonth() &&
               orderDate.getDate() === targetDate.getDate();
      } else if (reportPeriod === 'weekly') {
        const dayOfWeek = targetDate.getDay() || 7; // 1 (Mon) - 7 (Sun)
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - (dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return orderDate >= startOfWeek && orderDate <= endOfWeek;
      } else if (reportPeriod === 'monthly') {
        return orderDate.getFullYear() === targetDate.getFullYear() &&
               orderDate.getMonth() === targetDate.getMonth();
      } else if (reportPeriod === 'yearly') {
        return orderDate.getFullYear() === targetDate.getFullYear();
      }
      return true;
    });
  };

  const periodOrders = getFilteredPeriodOrders();

  // Calculate Product Sales in Period
  const getProductPeriodSales = (productId) => {
    let soldQty = 0;
    let revenue = 0;
    let costTotal = 0;

    periodOrders.forEach(order => {
      (order.order_items || []).forEach(item => {
        if (item.id === productId || item.product_id === productId || item.sku === productId) {
          const qty = parseInt(item.quantity, 10) || 0;
          const price = parseFloat(item.unit_price) || parseFloat(item.price) || 0;
          const cost = parseFloat(item.cost_price) || (price * 0.7);

          soldQty += qty;
          revenue += (price * qty);
          costTotal += (cost * qty);
        }
      });
    });

    const profit = revenue - costTotal;
    return { soldQty, revenue, costTotal, profit };
  };

  // Period Summary Financial Calculations
  const periodTotalRevenue = periodOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const periodTotalItemsSold = periodOrders.reduce((sum, o) => {
    return sum + (o.order_items || []).reduce((itemSum, item) => itemSum + (parseInt(item.quantity, 10) || 0), 0);
  }, 0);
  const periodTotalCost = periodOrders.reduce((sum, o) => {
    return sum + (o.order_items || []).reduce((itemSum, item) => {
      const qty = parseInt(item.quantity, 10) || 0;
      const cost = parseFloat(item.cost_price) || (parseFloat(item.unit_price) * 0.7);
      return itemSum + (cost * qty);
    }, 0);
  }, 0);
  const periodNetProfit = periodTotalRevenue - periodTotalCost;

  // Export Inventory Report to CSV with dual currency support
  const exportReportCSV = () => {
    const headers = [
      'SKU',
      'Product Title (KH)',
      'Product Title (EN)',
      'Category',
      'Currency',
      'Cost Price (USD)',
      'Selling Price (USD)',
      'Unit Profit (USD)',
      'Margin (%)',
      'Stock Qty',
      'Total Stock Cost (USD)',
      'Total Stock Retail (USD)',
      'Period Sold Qty',
      'Period Revenue (USD)',
      'Supplier',
      'Expiry Date',
      'Expiry Status'
    ];

    const rows = products.map(p => {
      const exp = getExpiryDetails(p.expiry_date);
      const isKHR = p.currency === 'KHR';
      const rawCost = parseFloat(p.cost_price) || 0;
      const rawSell = parseFloat(p.price) || 0;

      const costUsd = isKHR ? (rawCost / exchangeRate) : rawCost;
      const sellUsd = isKHR ? (rawSell / exchangeRate) : rawSell;
      const unitProfitUsd = sellUsd - costUsd;
      const marginPct = sellUsd > 0 ? ((unitProfitUsd / sellUsd) * 100).toFixed(1) : '0.0';
      const stockQty = parseInt(p.stock_quantity, 10) || 0;
      const sales = getProductPeriodSales(p.id);

      return [
        `"${p.sku || ''}"`,
        `"${(p.title_kh || '').replace(/"/g, '""')}"`,
        `"${(p.title_en || '').replace(/"/g, '""')}"`,
        `"${(p.category_name_kh || p.category_id || '').replace(/"/g, '""')}"`,
        `"${p.currency || 'USD'}"`,
        costUsd.toFixed(2),
        sellUsd.toFixed(2),
        unitProfitUsd.toFixed(2),
        `${marginPct}%`,
        stockQty,
        (costUsd * stockQty).toFixed(2),
        (sellUsd * stockQty).toFixed(2),
        sales.soldQty,
        sales.revenue.toFixed(2),
        `"${(p.supplier_name || '').replace(/"/g, '""')}"`,
        `"${p.expiry_date || ''}"`,
        `"${exp.label_kh.replace(/["'\r\n]/g, '')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `V8_Inventory_Report_${reportPeriod}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Counts for alert filter badges
  const expiringCount = products.filter(p => getExpiryDetails(p.expiry_date).status === 'expiring_soon').length;
  const expiredCount = products.filter(p => getExpiryDetails(p.expiry_date).status === 'expired').length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)).length;

  // Filter products
  const filteredProducts = products.filter(p => {
    const query = search.toLowerCase().trim();
    const matchSearch = query === '' || 
                        (p.title_en && p.title_en.toLowerCase().includes(query)) || 
                        (p.title_kh && p.title_kh.toLowerCase().includes(query)) || 
                        (p.sku && p.sku.toLowerCase().includes(query)) ||
                        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
                        (p.batch_no && p.batch_no.toLowerCase().includes(query)) ||
                        (p.supplier_name && p.supplier_name.toLowerCase().includes(query));

    const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter;

    let matchStatus = true;
    const expInfo = getExpiryDetails(p.expiry_date);

    if (statusFilter === 'expiring_soon') matchStatus = expInfo.status === 'expiring_soon';
    if (statusFilter === 'expired') matchStatus = expInfo.status === 'expired';
    if (statusFilter === 'low_stock') matchStatus = p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5);
    if (statusFilter === 'out_of_stock') matchStatus = p.stock_quantity === 0;
    if (statusFilter === 'clearance') matchStatus = Boolean(p.is_clearance || p.is_slow_moving || p.is_promoted);
    if (statusFilter === 'damaged') matchStatus = Boolean(p.is_damaged || p.status === 'damaged');
    if (statusFilter === 'archived') matchStatus = Boolean(p.is_archived || p.status === 'archived');

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
      created_at: editingProduct?.created_at || new Date().toISOString(),
      added_date: editingProduct?.added_date || new Date().toISOString().slice(0, 10),
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

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <BarChart2 className="w-4 h-4 text-blue-200" />
              <span>{lang === 'km' ? '📊 របាយការណ៍ស្តុក (Report)' : '📊 Stock Report'}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 active:scale-98 text-white px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'km' ? '+ បញ្ចូលទំនិញថ្មី (Add Product)' : '+ Add Product'}</span>
            </button>
          </div>
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

        {/* 2. Filter Status Pills (All, Out of Stock, Low Stock, Expiring Soon, Expired, Damaged, Archived) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain touch-pan-x">
          {[
            { id: 'all', label_kh: 'ទាំងអស់ (All)', count: products.length, class: 'bg-slate-900 dark:bg-emerald-700 text-white' },
            { id: 'clearance', label_kh: '🔥 ទំនិញលក់មិនចេញ / ថយថ្លៃ (Clearance)', count: products.filter(p => p.is_clearance || p.is_slow_moving || p.is_promoted).length, class: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm' },
            { id: 'out_of_stock', label_kh: '🔴 ដាច់ស្តុក (Out of Stock)', count: products.filter(p => p.stock_quantity === 0).length, class: 'bg-rose-700 text-white' },
            { id: 'low_stock', label_kh: '🟠 ជិតអស់ស្តុក (Low Stock)', count: lowStockCount, class: 'bg-orange-600 text-white' },
            { id: 'expiring_soon', label_kh: '⚠️ ជិតផុតកំណត់ (Expiring Soon)', count: expiringCount, class: 'bg-amber-600 text-white' },
            { id: 'expired', label_kh: '⛔ ផុតកំណត់ (Expired)', count: expiredCount, class: 'bg-rose-600 text-white' },
            { id: 'damaged', label_kh: '💥 ខូចខាត (Damaged)', count: products.filter(p => p.is_damaged || p.status === 'damaged').length, class: 'bg-purple-600 text-white' },
            { id: 'archived', label_kh: '📦 រក្សាទុក (Archived)', count: products.filter(p => p.is_archived || p.status === 'archived').length, class: 'bg-slate-600 text-white' }
          ].map(pill => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition border flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? `${pill.class} border-transparent shadow-xs`
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{pill.label_kh}</span>
                {pill.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {pill.count}
                  </span>
                )}
              </button>
            );
          })}
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
              <option value="all">{lang === 'km' ? 'គ្រប់ប្រភេទទាំងអស់ (All Categories)' : 'All Categories'}</option>
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

                    {/* Stock with Professional Adjustment Modal Trigger */}
                    <td className="px-3 py-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setStockAdjustProduct(p);
                          setAdjustQtyInput('10');
                          setAdjustMode('IN');
                          setAdjustReason('Purchase');
                          setAdjustRefNo(p.purchase_invoice_no || '');
                        }}
                        className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs inline-flex items-center space-x-1.5 transition cursor-pointer ${
                          p.stock_quantity === 0
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                            : p.stock_quantity <= 5
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-blue-50 hover:text-blue-600'
                        }`}
                        title="Click to open Professional Stock Adjustment Modal"
                      >
                        <span>{p.stock_quantity} Pcs</span>
                        <Plus className="w-3 h-3 text-blue-600" />
                      </button>
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
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* 1. Professional Stock Adjust */}
                        <button
                          type="button"
                          onClick={() => {
                            setStockAdjustProduct(p);
                            setAdjustQtyInput('10');
                            setAdjustMode('IN');
                            setAdjustReason('Purchase');
                            setAdjustRefNo(p.purchase_invoice_no || '');
                          }}
                          className="p-1.5 text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                          title="Stock Adjustment (+/-)"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. 7-Tab Product 360° Detail */}
                        <button
                          type="button"
                          onClick={() => {
                            setDetailedProduct(p);
                            setDetailTab('basic');
                          }}
                          className="p-1.5 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                          title="Product 360° Details & Audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 2.5 1-Click Promote / Clearance Pin to Storefront Top */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !(p.is_clearance || p.is_slow_moving || p.is_promoted);
                            editProduct({
                              ...p,
                              is_clearance: nextState,
                              is_slow_moving: nextState,
                              is_promoted: nextState
                            });
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-black border transition flex items-center space-x-1 cursor-pointer ${
                            p.is_clearance || p.is_slow_moving || p.is_promoted
                              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-600 shadow-xs'
                              : 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/60 hover:bg-orange-100'
                          }`}
                          title={p.is_clearance ? 'បានកំណត់ជាទំនិញថយថ្លៃរំដោះស្តុក (បង្ហាញលើគេបង្អស់)' : 'ចុចដើមី្បកំណត់ជាទំនិញលក់មិនចេញ / ថយថ្លៃរំដោះស្តុក (បង្ហាញលើគេបង្អស់)'}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{p.is_clearance || p.is_slow_moving ? '📌 Pinned Top' : '🔥 Promote Top'}</span>
                        </button>

                        {/* 3. Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* 4. Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(lang === 'km' ? 'តើអ្នកចង់លុបទំនិញនេះមែនទេ?' : 'Delete product?')) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition cursor-pointer"
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
      {/* 4. INVENTORY & STOCK REPORT MODAL (DAILY, WEEKLY, MONTHLY, YEARLY) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-6 animate-fade-in print:p-0 print:bg-white print:static print:z-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl mx-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex-shrink-0 print:hidden">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{lang === 'km' ? '📊 របាយការណ៍ស្តុក & ការលក់ (Inventory Report)' : '📊 Inventory & Stock Movements Report'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {lang === 'km' 
                      ? 'គ្រប់គ្រង ពិនិត្យមើល និងទាញយករាយការណ៍ស្តុក ប្រចាំថ្ងៃ, ប្រចាំសប្តាហ៍, ប្រចាំខែ និងប្រចាំឆ្នាំ'
                      : 'Comprehensive inventory movements, valuation & sales reporting by daily, weekly, monthly & yearly'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={exportReportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'km' ? 'ទាញយក Excel (CSV)' : 'Export CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'km' ? 'បោះពុម្ព (Print)' : 'Print'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Print Header Header (Only visible on paper printout) */}
            <div className="hidden print:block p-6 border-b text-center">
              <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">V8 ONLINE MART</h1>
              <p className="text-sm text-slate-600 font-bold">របាយការណ៍សរុបស្តុកទំនិញ & ការលក់ (Inventory & Sales Report)</p>
              <p className="text-xs text-slate-500 mt-1">
                កាលបរិច្ឆេទរបាយការណ៍៖ {reportDate} ({reportPeriod.toUpperCase()}) | បោះពុម្ពនៅ៖ {new Date().toLocaleString()}
              </p>
            </div>

            {/* Scrollable Report Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-none">
              
              {/* PERIOD SELECTOR TABS & DATE RANGE CONTROLS */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
                
                {/* Segmented Period Tabs (Daily, Weekly, Monthly, Yearly) */}
                <div className="grid grid-cols-4 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black">
                  {[
                    { id: 'daily', label_kh: '📅 ប្រចាំថ្ងៃ', label_en: 'Daily' },
                    { id: 'weekly', label_kh: '📅 ប្រចាំសប្ដាហ៍', label_en: 'Weekly' },
                    { id: 'monthly', label_kh: '📅 ប្រចាំខែ', label_en: 'Monthly' },
                    { id: 'yearly', label_kh: '📅 ប្រចាំឆ្នាំ', label_en: 'Yearly' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReportPeriod(tab.id)}
                      className={`py-2 px-2.5 rounded-lg transition-all text-center cursor-pointer ${
                        reportPeriod === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang === 'km' ? tab.label_kh : tab.label_en}
                    </button>
                  ))}
                </div>

                {/* Date Input Pickers */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                    {lang === 'km' ? 'ជ្រើសរើសកាលបរិច្ឆេទ៖' : 'Select Period Date:'}
                  </span>

                  {reportPeriod === 'daily' && (
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  )}

                  {reportPeriod === 'weekly' && (
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  )}

                  {reportPeriod === 'monthly' && (
                    <input
                      type="month"
                      value={reportDate.slice(0, 7)}
                      onChange={(e) => setReportDate(e.target.value + '-01')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  )}

                  {reportPeriod === 'yearly' && (
                    <select
                      value={reportDate.slice(0, 4)}
                      onChange={(e) => setReportDate(`${e.target.value}-01-01`)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    >
                      {['2026', '2025', '2024', '2023'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* SUB-REPORT TAB SWITCHER BAR */}
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none print:hidden">
                {[
                  { id: 'inventory', label_kh: '📦 របាយការណ៍ស្តុកសរុប', label_en: 'Stock Valuation & Movements' },
                  { id: 'stock_entry_history', label_kh: '📅 ទំនិញបញ្ចូលតាមថ្ងៃ (Stock In)', label_en: 'Stock Entry by Date' },
                  { id: 'top_selling', label_kh: '🛒 ទំនិញលក់ដាច់បំផុត', label_en: 'Top Selling Products' },
                  { id: 'risk_expiring', label_kh: '⚠️ ហានិភ័យ & ជិតផុតកំណត់', label_en: 'Expiring & Stock Risk' },
                  { id: 'supplier_po', label_kh: '🚚 អ្នកផ្គត់ផ្គង់ & ទិញចូល', label_en: 'Supplier Purchases' },
                  { id: 'category_margin', label_kh: '💰 ចំណេញតាមប្រភេទ', label_en: 'Category Profitability' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReportSubTab(tab.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                      reportSubTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lang === 'km' ? tab.label_kh : tab.label_en}
                  </button>
                ))}
              </div>

              {/* KPI FINANCIAL SUMMARY CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* 1. Total Stock Cost Value */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-xs font-black uppercase tracking-wider">
                      {lang === 'km' ? 'ដើមទុនស្តុកសរុប (Cost)' : 'Inventory Cost'}
                    </span>
                    <DollarSign className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      ${totalCostValue.toFixed(2)}
                    </span>
                    <span className="block text-xs font-bold text-slate-500 mt-0.5">
                      ≈ {formatDualPrice(totalCostValue).khr}
                    </span>
                  </div>
                </div>

                {/* 2. Retail Value & Estimated Profit */}
                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                    <span className="text-xs font-black uppercase tracking-wider">
                      {lang === 'km' ? 'តម្លៃលក់សរុប (Retail)' : 'Retail Value'}
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200 font-mono">
                      ${totalInventoryValue.toFixed(2)}
                    </span>
                    <span className="block text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {lang === 'km' ? `ចំណេញរំពឹងទុក៖ +$${totalEstimatedStockProfit.toFixed(2)}` : `Est. Profit: +$${totalEstimatedStockProfit.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* 3. Period Sales Revenue */}
                <div className="bg-blue-50/80 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
                    <span className="text-xs font-black uppercase tracking-wider">
                      {lang === 'km' ? `ការលក់ ${reportPeriod === 'daily' ? 'ប្រចាំថ្ងៃ' : reportPeriod === 'weekly' ? 'សប្តាហ៍' : reportPeriod === 'monthly' ? 'ប្រចាំខែ' : 'ប្រចាំឆ្នាំ'}` : `Period Sales (${reportPeriod})`}
                    </span>
                    <BarChart2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xl sm:text-2xl font-black text-blue-800 dark:text-blue-200 font-mono">
                      ${periodTotalRevenue.toFixed(2)}
                    </span>
                    <span className="block text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                      {lang === 'km' ? `${periodOrders.length} វិក្កយបត្រ | ចំណេញ៖ +$${periodNetProfit.toFixed(2)}` : `${periodOrders.length} Orders | Profit: +$${periodNetProfit.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* 4. Stock Health & Risk */}
                <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                    <span className="text-xs font-black uppercase tracking-wider">
                      {lang === 'km' ? 'ហានិភ័យស្តុក (Risk Alert)' : 'Inventory Risk'}
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">
                        {expiringCount + lowStockCount}
                      </span>
                      <span className="block text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                        {lang === 'km' ? 'មុខទិញជិតអស់/ជិតផុតកំណត់' : 'Low stock / Expiring'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC SUB-TAB CONTENT PANEL */}
              {reportSubTab === 'inventory' && (
                /* TAB 1: ALL INVENTORY MOVEMENT DETAILS */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
                    <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>{lang === 'km' ? 'បញ្ជីមុខទិញ និងចលនាស្តុកសរុប (Inventory Movement Details)' : 'Product Stock Details & Movement'}</span>
                    </h4>

                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={reportSearch}
                          onChange={(e) => setReportSearch(e.target.value)}
                          placeholder={lang === 'km' ? 'ស្វែងរកឈ្មោះទំនិញ / SKU...' : 'Search product / SKU...'}
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">{lang === 'km' ? 'ទំនិញ / SKU' : 'Product / SKU'}</th>
                            <th className="p-3">{lang === 'km' ? 'ប្រភេទ' : 'Category'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'ដើម (Cost)' : 'Unit Cost'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'លក់ (Sell)' : 'Unit Sell'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'ចំណេញ %' : 'Margin %'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'ស្តុកនៅសល់' : 'Stock Qty'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'សរុបដើមទុន' : 'Stock Cost'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? `លក់បាន (${reportPeriod === 'daily' ? 'ថ្ងៃនេះ' : 'គ្រានេះ'})` : 'Period Sold'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'កាលបរិច្ឆេទផុតកំណត់' : 'Expiry Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {products
                            .filter(p => {
                              const q = reportSearch.toLowerCase().trim();
                              return q === '' ||
                                     (p.title_kh && p.title_kh.toLowerCase().includes(q)) ||
                                     (p.title_en && p.title_en.toLowerCase().includes(q)) ||
                                     (p.sku && p.sku.toLowerCase().includes(q));
                            })
                            .map((product, idx) => {
                              const isKHR = product.currency === 'KHR';
                              const rawCost = parseFloat(product.cost_price) || 0;
                              const rawSell = parseFloat(product.price) || 0;
                              const costUsd = isKHR ? (rawCost / exchangeRate) : rawCost;
                              const sellUsd = isKHR ? (rawSell / exchangeRate) : rawSell;
                              const unitProfitUsd = sellUsd - costUsd;
                              const marginPct = sellUsd > 0 ? ((unitProfitUsd / sellUsd) * 100).toFixed(1) : 0;
                              const stockQty = parseInt(product.stock_quantity, 10) || 0;
                              const expInfo = getExpiryDetails(product.expiry_date);
                              const sales = getProductPeriodSales(product.id);
                              const totalCostUsd = costUsd * stockQty;
                              const totalCostRaw = rawCost * stockQty;

                              return (
                                <tr key={product.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                  <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-2.5">
                                      <img
                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100'}
                                        alt={product.title_kh}
                                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                      />
                                      <div>
                                        <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                                          {lang === 'km' ? product.title_kh : product.title_en}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono block">
                                          {product.sku}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-400 font-semibold">
                                    {lang === 'km' ? product.category_name_kh : product.category_name_en}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {isKHR ? (
                                      <div>
                                        <span>{rawCost.toLocaleString()} ៛</span>
                                        <span className="block text-[10px] text-slate-400">($${costUsd.toFixed(2)})</span>
                                      </div>
                                    ) : (
                                      `$${rawCost.toFixed(2)}`
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                    {isKHR ? (
                                      <div>
                                        <span>{rawSell.toLocaleString()} ៛</span>
                                        <span className="block text-[10px] text-slate-400">($${sellUsd.toFixed(2)})</span>
                                      </div>
                                    ) : (
                                      `$${rawSell.toFixed(2)}`
                                    )}
                                  </td>
                                  <td className="p-3 text-center font-mono">
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                      marginPct > 20 
                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                    }`}>
                                      {marginPct}%
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-bold">
                                    <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black ${
                                      stockQty === 0 
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                                        : stockQty <= 5 
                                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                    }`}>
                                      {stockQty}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {isKHR ? (
                                      <div>
                                        <span>{totalCostRaw.toLocaleString()} ៛</span>
                                        <span className="block text-[10px] text-slate-400">($${totalCostUsd.toFixed(2)})</span>
                                      </div>
                                    ) : (
                                      `$${totalCostUsd.toFixed(2)}`
                                    )}
                                  </td>
                                  <td className="p-3 text-center font-mono">
                                    {sales.soldQty > 0 ? (
                                      <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-black text-xs">
                                        {sales.soldQty} ({formatPrice(sales.revenue)})
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">0</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${expInfo.color}`}>
                                      {lang === 'km' ? expInfo.label_kh : expInfo.label_en}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1.5: STOCK ENTRY / PRODUCT ADDED TRACKING BY DATE */}
              {reportSubTab === 'stock_entry_history' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                        <span>{lang === 'km' ? '📅 របាយការណ៍ស្រង់ទិន្នន័យទំនិញបញ្ចូលតាមថ្ងៃ (Stock In Audit)' : 'Stock In Entry Tracking by Date'}</span>
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {lang === 'km' 
                          ? `បង្ហាញបញ្ជីមុខទំនិញដែលបានទិញចូល/បញ្ចូលក្នុងប្រព័ន្ធសម្រាប់កាលបរិច្ឆេទ ${reportDate}`
                          : `Audit list of all stock items added or purchased into inventory for ${reportDate}`}
                      </p>
                    </div>

                    {/* Filter controls inside Stock In tracking */}
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={reportSearch}
                          onChange={(e) => setReportSearch(e.target.value)}
                          placeholder={lang === 'km' ? 'ស្វែងរកឈ្មោះ / SKU / វិក្កយបត្រ PO...' : 'Search Name / SKU / PO Ref...'}
                          className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock Entry Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">{lang === 'km' ? 'ថ្ងៃខែឆ្នាំបញ្ចូល' : 'Date Added'}</th>
                            <th className="p-3">{lang === 'km' ? 'វិក្កយបត្រ PO Ref' : 'Invoice PO #'}</th>
                            <th className="p-3">{lang === 'km' ? 'ទំនិញ / SKU' : 'Product / SKU'}</th>
                            <th className="p-3">{lang === 'km' ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'ស្តុកបញ្ចូល' : 'Stock Qty'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'តម្លៃដើម (Unit Cost)' : 'Unit Cost'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'សរុបដើមទុនចំណាយ' : 'Total Cost'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'តម្លៃលក់ចេញ' : 'Selling Price'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'ថ្ងៃផុតកំណត់' : 'Expiry Date'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {products
                            .filter(p => {
                              const q = reportSearch.toLowerCase().trim();
                              const matchSearch = q === '' ||
                                                  (p.title_kh && p.title_kh.toLowerCase().includes(q)) ||
                                                  (p.title_en && p.title_en.toLowerCase().includes(q)) ||
                                                  (p.sku && p.sku.toLowerCase().includes(q)) ||
                                                  (p.purchase_invoice_no && p.purchase_invoice_no.toLowerCase().includes(q)) ||
                                                  (p.supplier_name && p.supplier_name.toLowerCase().includes(q));

                              const pDate = p.added_date || (p.created_at ? p.created_at.slice(0, 10) : '');
                              let matchDate = true;
                              if (reportPeriod === 'daily' && reportDate) {
                                matchDate = pDate === reportDate || !pDate;
                              } else if (reportPeriod === 'monthly' && reportDate) {
                                matchDate = pDate.slice(0, 7) === reportDate.slice(0, 7) || !pDate;
                              } else if (reportPeriod === 'yearly' && reportDate) {
                                matchDate = pDate.slice(0, 4) === reportDate.slice(0, 4) || !pDate;
                              }

                              return matchSearch && matchDate;
                            })
                            .map((product, idx) => {
                              const isKHR = product.currency === 'KHR';
                              const rawCost = parseFloat(product.cost_price) || 0;
                              const rawSell = parseFloat(product.price) || 0;
                              const costUsd = isKHR ? (rawCost / exchangeRate) : rawCost;
                              const sellUsd = isKHR ? (rawSell / exchangeRate) : rawSell;
                              const stockQty = parseInt(product.stock_quantity, 10) || 0;
                              const totalCostUsd = costUsd * stockQty;
                              const totalCostRaw = rawCost * stockQty;
                              const expInfo = getExpiryDetails(product.expiry_date);

                              return (
                                <tr key={product.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                  <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {product.added_date || (product.created_at ? product.created_at.slice(0, 10) : reportDate)}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    {product.purchase_invoice_no || 'PO-2026-REG'}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-2.5">
                                      <img
                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100'}
                                        alt={product.title_kh}
                                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                      />
                                      <div>
                                        <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                                          {lang === 'km' ? product.title_kh : product.title_en}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono block">
                                          {product.sku}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">
                                    {product.supplier_name || 'General Supplier'}
                                  </td>
                                  <td className="p-3 text-center font-bold">
                                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono font-black text-xs">
                                      +{stockQty} Pcs
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {isKHR ? (
                                      <div>
                                        <span>{rawCost.toLocaleString()} ៛</span>
                                        <span className="block text-[10px] text-slate-400">(${costUsd.toFixed(2)})</span>
                                      </div>
                                    ) : (
                                      `$${rawCost.toFixed(2)}`
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    {isKHR ? (
                                      <div>
                                        <span>{totalCostRaw.toLocaleString()} ៛</span>
                                        <span className="block text-[10px] text-slate-400">(${totalCostUsd.toFixed(2)})</span>
                                      </div>
                                    ) : (
                                      `$${totalCostUsd.toFixed(2)}`
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                    {isKHR ? (
                                      <div>
                                        <span>{rawSell.toLocaleString()} ៛</span>
                                        <span className="block text-[10px] text-slate-400">(${sellUsd.toFixed(2)})</span>
                                      </div>
                                    ) : (
                                      `$${rawSell.toFixed(2)}`
                                    )}
                                  </td>
                                  <td className="p-3 text-center font-mono">
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${expInfo.color}`}>
                                      {lang === 'km' ? expInfo.label_kh : expInfo.label_en}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {reportSubTab === 'top_selling' && (
                /* TAB 2: TOP SELLING PRODUCTS REPORT */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'km' ? '📊 របាយការណ៍ទំនិញលក់ដាច់បំផុត (Top Selling Products)' : 'Top Selling Products Report'}</span>
                    </h4>

                    {/* Sorting selector */}
                    <div className="flex items-center space-x-2 text-xs font-bold">
                      <span className="text-slate-500">{lang === 'km' ? 'តម្រៀបតាម៖' : 'Sort By:'}</span>
                      <select
                        value={topSellingSort}
                        onChange={(e) => setTopSellingSort(e.target.value)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold outline-none cursor-pointer"
                      >
                        <option value="qty">{lang === 'km' ? 'ចំនួនលក់ច្រើនបំផុត (Units Sold)' : 'Units Sold'}</option>
                        <option value="revenue">{lang === 'km' ? 'ប្រាក់ចំណូលសរុប (Total Revenue)' : 'Total Revenue'}</option>
                        <option value="profit">{lang === 'km' ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'Net Profit'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3 text-center">ចំណាត់ថ្នាក់</th>
                            <th className="p-3">{lang === 'km' ? 'ទំនិញ / SKU' : 'Product / SKU'}</th>
                            <th className="p-3">{lang === 'km' ? 'ប្រភេទ' : 'Category'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'ចំនួនលក់បាន' : 'Units Sold'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'ចំណូលលក់ ($ Revenue)' : 'Revenue ($)'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'ដើមទុន ($ COGS)' : 'COGS ($)'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'ចំណេញ ($ Profit)' : 'Profit ($)'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'ស្តុកនៅសល់' : 'Stock Left'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {products
                            .map(p => {
                              const sales = getProductPeriodSales(p.id);
                              return { ...p, ...sales };
                            })
                            .sort((a, b) => {
                              if (topSellingSort === 'revenue') return b.revenue - a.revenue;
                              if (topSellingSort === 'profit') return b.profit - a.profit;
                              return b.soldQty - a.soldQty; // default 'qty'
                            })
                            .map((product, idx) => {
                              const isTop3 = idx < 3;
                              return (
                                <tr key={product.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                  <td className="p-3 text-center">
                                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs mx-auto ${
                                      idx === 0 
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                                        : idx === 1 
                                          ? 'bg-slate-400 text-white' 
                                          : idx === 2 
                                            ? 'bg-amber-700 text-white' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-2.5">
                                      <img
                                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100'}
                                        alt={product.title_kh}
                                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                      />
                                      <div>
                                        <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                                          {lang === 'km' ? product.title_kh : product.title_en}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono block">
                                          {product.sku}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-400 font-semibold">
                                    {lang === 'km' ? product.category_name_kh : product.category_name_en}
                                  </td>
                                  <td className="p-3 text-center font-mono font-black text-blue-700 dark:text-blue-400 text-sm">
                                    {product.soldQty} Pcs
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                    ${product.revenue.toFixed(2)}
                                  </td>
                                  <td className="p-3 text-right font-mono text-slate-500">
                                    ${product.costTotal.toFixed(2)}
                                  </td>
                                  <td className="p-3 text-right font-mono font-black text-emerald-600">
                                    +${product.profit.toFixed(2)}
                                  </td>
                                  <td className="p-3 text-center font-bold">
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                      {product.stock_quantity || 0}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {reportSubTab === 'risk_expiring' && (
                /* TAB 3: EXPIRING & STOCK RISK REPORT */
                <div className="space-y-4">
                  <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'km' ? '⚠️ របាយការណ៍ទំនិញជិតផុតកំណត់ & ហានិភ័យស្តុក (Expiring & Stock Risk)' : 'Expiring & Low Stock Risk Report'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expired Items */}
                    <div className="bg-rose-50/60 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>⛔ ទំនិញផុតកំណត់ហើយ ({products.filter(p => getExpiryDetails(p.expiry_date).status === 'expired').length} មុខ)</span>
                        </span>
                      </div>
                      <div className="divide-y divide-rose-100 dark:divide-rose-900/40">
                        {products
                          .filter(p => getExpiryDetails(p.expiry_date).status === 'expired')
                          .map(p => (
                            <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">{lang === 'km' ? p.title_kh : p.title_en}</span>
                                <span className="text-[10px] text-rose-600 font-semibold">{getExpiryDetails(p.expiry_date).label_kh}</span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-rose-700 block">ស្តុកនៅសល់៖ {p.stock_quantity}</span>
                                <span className="text-[10px] text-slate-500">ខាតបង់៖ ${((parseFloat(p.cost_price) || 0) * p.stock_quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        {products.filter(p => getExpiryDetails(p.expiry_date).status === 'expired').length === 0 && (
                          <p className="text-xs text-slate-400 italic py-2">គ្មានទំនិញផុតកំណត់ទេ 🎉</p>
                        )}
                      </div>
                    </div>

                    {/* Expiring Soon Items */}
                    <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-amber-800 dark:text-amber-300 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>⚠️ ទំនិញជិតផុតកំណត់ ក្នុង 30 ថ្ងៃ ({products.filter(p => getExpiryDetails(p.expiry_date).status === 'expiring_soon').length} មុខ)</span>
                        </span>
                      </div>
                      <div className="divide-y divide-amber-100 dark:divide-amber-900/40">
                        {products
                          .filter(p => getExpiryDetails(p.expiry_date).status === 'expiring_soon')
                          .map(p => (
                            <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">{lang === 'km' ? p.title_kh : p.title_en}</span>
                                <span className="text-[10px] text-amber-700 font-semibold">{getExpiryDetails(p.expiry_date).label_kh}</span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="font-bold text-amber-800 block">ស្តុកនៅសល់៖ {p.stock_quantity}</span>
                                <span className="text-[10px] text-slate-500">អ្នកផ្គត់ផ្គង់៖ {p.supplier_name || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        {products.filter(p => getExpiryDetails(p.expiry_date).status === 'expiring_soon').length === 0 && (
                          <p className="text-xs text-slate-400 italic py-2">គ្មានទំនិញជិតផុតកំណត់ទេ 👍</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reportSubTab === 'supplier_po' && (
                /* TAB 4: SUPPLIER PURCHASES REPORT */
                <div className="space-y-4">
                  <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'km' ? '🚚 របាយការណ៍ទិញចូល & អ្នកផ្គត់ផ្គង់ (Supplier Purchase Orders)' : 'Supplier Purchases Report'}</span>
                  </h4>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[11px] border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">{lang === 'km' ? 'ឈ្មោះអ្នកផ្គត់ផ្គង់' : 'Supplier Name'}</th>
                            <th className="p-3">{lang === 'km' ? 'ទំនាក់ទំនង' : 'Contact'}</th>
                            <th className="p-3 text-center">{lang === 'km' ? 'ចំនួនមុខទំនិញ' : 'Items Supplied'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'សរុបដើមទុនទិញចូល ($ Cost)' : 'Total Invested ($)'}</th>
                            <th className="p-3 text-right">{lang === 'km' ? 'តម្លៃលក់សរុប ($ Retail)' : 'Retail Value ($)'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {Object.entries(
                            products.reduce((acc, p) => {
                              const supp = p.supplier_name || 'General Supplier';
                              if (!acc[supp]) {
                                acc[supp] = { name: supp, contact: p.supplier_contact || '', items: [], totalCost: 0, totalRetail: 0 };
                              }
                              const cost = parseFloat(p.cost_price) || 0;
                              const sell = parseFloat(p.price) || 0;
                              const qty = parseInt(p.stock_quantity, 10) || 0;
                              acc[supp].items.push(p);
                              acc[supp].totalCost += (cost * qty);
                              acc[supp].totalRetail += (sell * qty);
                              return acc;
                            }, {})
                          ).map(([suppName, data], idx) => (
                            <tr key={suppName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                              <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                                <Building2 className="w-4 h-4 text-indigo-600" />
                                <span>{suppName}</span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                                {data.contact || 'N/A'}
                              </td>
                              <td className="p-3 text-center font-bold">
                                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
                                  {data.items.length} មុខ
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                ${data.totalCost.toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                ${data.totalRetail.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {reportSubTab === 'category_margin' && (
                /* TAB 5: CATEGORY PROFITABILITY REPORT */
                <div className="space-y-4">
                  <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'km' ? '💰 របាយការណ៍ចំណេញតាមប្រភេទទំនិញ (Category Profitability)' : 'Category Profitability Report'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(cat => {
                      const catProducts = products.filter(p => p.category_id === cat.id);
                      const catStockQty = catProducts.reduce((sum, p) => sum + (parseInt(p.stock_quantity, 10) || 0), 0);
                      const catCost = catProducts.reduce((sum, p) => sum + ((parseFloat(p.cost_price) || 0) * (p.stock_quantity || 0)), 0);
                      const catRetail = catProducts.reduce((sum, p) => sum + ((parseFloat(p.price) || 0) * (p.stock_quantity || 0)), 0);
                      const catProfit = Math.max(0, catRetail - catCost);
                      const marginPct = catRetail > 0 ? ((catProfit / catRetail) * 100).toFixed(1) : 0;

                      return (
                        <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                              <span>{cat.icon || '🏷️'}</span>
                              <span>{lang === 'km' ? cat.name_kh : cat.name_en}</span>
                            </span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {marginPct}% Margin
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">ចំនួនមុខទំនិញ</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-white">{catProducts.length} មុខ ({catStockQty} Pcs)</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">ដើមទុន ($ Cost)</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-white">${catCost.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">ចំណេញរំពឹងទុក</span>
                              <span className="font-mono font-black text-emerald-600">+${catProfit.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0 print:hidden">
              <span className="text-xs text-slate-500 font-semibold">
                {lang === 'km' ? `សរុបទំនិញទាំងអស់៖ ${products.length} មុខ` : `Total Products: ${products.length} Items`}
              </span>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-5 py-2 rounded-xl font-black text-xs transition cursor-pointer"
              >
                {lang === 'km' ? 'បិទ' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. PROFESSIONAL POS STOCK ADJUSTMENT MODAL                     */}
      {/* ============================================================== */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {lang === 'km' ? '🛠️ កែសម្រួលស្តុក (Stock Adjustment)' : 'Stock Adjustment'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    SKU: {stockAdjustProduct.sku}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStockAdjustProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Product Summary Box */}
            <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
              <img
                src={stockAdjustProduct.images?.[0] || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100'}
                alt={stockAdjustProduct.title_kh}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                  {lang === 'km' ? stockAdjustProduct.title_kh : stockAdjustProduct.title_en}
                </span>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono mt-0.5">
                  <span>{lang === 'km' ? 'ស្តុកបច្ចុប្បន្ន (Current):' : 'Current Stock:'}</span>
                  <span className="font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                    {stockAdjustProduct.stock_quantity || 0} Pcs
                  </span>
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'ប្រភេទនៃការកែសម្រួល (Adjustment Type)' : 'Adjustment Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('IN')}
                    className={`py-2.5 px-4 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      adjustMode === 'IN'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{lang === 'km' ? '➕ ទិញចូល/បន្ថែម (+ Add)' : '+ Stock In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustMode('OUT')}
                    className={`py-2.5 px-4 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      adjustMode === 'OUT'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>{lang === 'km' ? '➖ ដកចេញ/ខូច (- Deduct)' : '- Stock Out'}</span>
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'ចំនួនបន្ថែម/ដកចេញ (Quantity to Adjust)' : 'Adjustment Quantity'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQtyInput}
                  onChange={(e) => setAdjustQtyInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Result Preview Banner */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex items-center justify-between text-blue-900 dark:text-blue-300">
                <span className="font-bold">{lang === 'km' ? 'ស្តុកថ្មីលទ្ធផល (New Stock Result):' : 'New Stock Result:'}</span>
                <span className="font-mono font-black text-sm">
                  {stockAdjustProduct.stock_quantity || 0} {adjustMode === 'IN' ? '+' : '-'} {parseInt(adjustQtyInput, 10) || 0} = {Math.max(0, (stockAdjustProduct.stock_quantity || 0) + (adjustMode === 'IN' ? (parseInt(adjustQtyInput, 10) || 0) : -(parseInt(adjustQtyInput, 10) || 0)))} Pcs
                </span>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'មូលហេតុ (Adjustment Reason)' : 'Reason'}
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Purchase">{lang === 'km' ? '🛍️ ទិញទំនិញចូលថែម (Purchase Restock)' : 'Purchase Restock'}</option>
                  <option value="Return">{lang === 'km' ? '🔄 អតិថិជនសងទំនិញវិញ (Customer Return)' : 'Customer Return'}</option>
                  <option value="Correction">{lang === 'km' ? '🛠️ កែតម្រូវចំនួនស្តុក (Inventory Adjustment / Audit)' : 'Inventory Audit Correction'}</option>
                  <option value="Damaged">{lang === 'km' ? '💥 ទំនិញខូចខាត/បាត់បង់ (Damaged or Lost)' : 'Damaged or Lost'}</option>
                  <option value="Supplier Return">{lang === 'km' ? '🚚 ផ្ទេរ/សងទំនិញទៅអ្នកផ្គត់ផ្គង់ (Return to Supplier)' : 'Return to Supplier'}</option>
                </select>
              </div>

              {/* Reference Invoice No */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'លេខវិក្កយបត្រ PO / Ref (Reference No.)' : 'Reference Invoice / PO No.'}
                </label>
                <input
                  type="text"
                  value={adjustRefNo}
                  onChange={(e) => setAdjustRefNo(e.target.value)}
                  placeholder="PO-2026-089"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Staff Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'km' ? 'អ្នកកែសម្រួល (Staff / Author)' : 'Staff / Author'}
                </label>
                <input
                  type="text"
                  value={adjustStaff}
                  onChange={(e) => setAdjustStaff(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStockAdjustProduct(null)}
                className="py-2.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {lang === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const qty = parseInt(adjustQtyInput, 10) || 0;
                  const delta = adjustMode === 'IN' ? qty : -qty;
                  adjustStock(stockAdjustProduct.id, delta, {
                    type: adjustMode,
                    reason: adjustReason,
                    refNo: adjustRefNo,
                    staffName: adjustStaff
                  });
                  setStockAdjustProduct(null);
                }}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-black text-xs shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{lang === 'km' ? '✅ រក្សាទុកការកែប្រែស្តុក' : 'Confirm Adjustment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ENTERPRISE 7-TAB PRODUCT 360° DETAIL & EDIT MODAL           */}
      {/* ============================================================== */}
      {detailedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <img
                  src={detailedProduct.images?.[0] || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=100'}
                  alt={detailedProduct.title_kh}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-xs"
                />
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white line-clamp-1">
                    {lang === 'km' ? detailedProduct.title_kh : detailedProduct.title_en}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
                    <span>SKU: {detailedProduct.sku}</span>
                    <span>•</span>
                    <span>{lang === 'km' ? detailedProduct.category_name_kh : detailedProduct.category_name_en}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailedProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 7-Tab Navigation Bar */}
            <div className="flex items-center space-x-1.5 px-4 pt-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              {[
                { id: 'basic', label_kh: '① 📝 ព័ត៌មានទូទៅ', label_en: 'Basic Info' },
                { id: 'pricing', label_kh: '② 🏷️ តម្លៃ & Margin', label_en: 'Pricing & Margin' },
                { id: 'inventory', label_kh: '③ 📦 វិធានស្តុក', label_en: 'Inventory Rules' },
                { id: 'batch', label_kh: '④ 🧪 Batch & Expiry', label_en: 'Batch & Expiry' },
                { id: 'supplier', label_kh: '⑤ 🚚 អ្នកផ្គត់ផ្គង់', label_en: 'Supplier Profile' },
                { id: 'stock_history', label_kh: '⑥ 📜 ប្រវត្តិស្តុក (Log)', label_en: 'Stock History' },
                { id: 'sales', label_kh: '⑦ 📊 ប្រវត្តិនៃការលក់', label_en: 'Sales & Profit' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                    detailTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang === 'km' ? tab.label_kh : tab.label_en}
                </button>
              ))}
            </div>

            {/* Tab Body Panel */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* TAB 1: BASIC INFO */}
              {detailTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">ឈ្មោះទំនិញ (ភាសាខ្មែរ):</span>
                      <p className="font-black text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        {detailedProduct.title_kh}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Product Name (English):</span>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        {detailedProduct.title_en}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">SKU Code:</span>
                        <p className="font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                          {detailedProduct.sku}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">Barcode (EAN-13):</span>
                        <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                          {detailedProduct.barcode || detailedProduct.sku}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">រូបភាពទំនិញ (Image):</span>
                      <img
                        src={detailedProduct.images?.[0] || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400'}
                        alt={detailedProduct.title_kh}
                        className="w-full h-36 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-1">ការបរិយាយ (Description):</span>
                      <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                        {detailedProduct.description_kh || detailedProduct.description_en || 'គ្មានការបរិយាយ'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & MARGIN */}
              {detailTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 font-bold block mb-1">តម្លៃដើមទិញចូល (Cost):</span>
                      <span className="text-base font-black font-mono text-slate-900 dark:text-white block">
                        ${(parseFloat(detailedProduct.cost_price) || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ≈ {((parseFloat(detailedProduct.cost_price) || 0) * exchangeRate).toLocaleString()} ៛
                      </span>
                    </div>

                    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold block mb-1">តម្លៃលក់ចេញ (Retail):</span>
                      <span className="text-base font-black font-mono text-emerald-800 dark:text-emerald-200 block">
                        ${(parseFloat(detailedProduct.price) || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600">
                        ≈ {((parseFloat(detailedProduct.price) || 0) * exchangeRate).toLocaleString()} ៛
                      </span>
                    </div>

                    <div className="bg-blue-50/80 dark:bg-blue-950/40 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800">
                      <span className="text-blue-700 dark:text-blue-300 font-bold block mb-1">ចំណេញក្នុង១ទំនិញ:</span>
                      <span className="text-base font-black font-mono text-blue-800 dark:text-blue-200 block">
                        +${(parseFloat(detailedProduct.price || 0) - parseFloat(detailedProduct.cost_price || 0)).toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-amber-50/80 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800">
                      <span className="text-amber-800 dark:text-amber-300 font-bold block mb-1">ភាគរយចំណេញ (Margin):</span>
                      <span className="text-base font-black font-mono text-amber-900 dark:text-amber-200 block">
                        {detailedProduct.price > 0 
                          ? (((parseFloat(detailedProduct.price) - parseFloat(detailedProduct.cost_price)) / parseFloat(detailedProduct.price)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Price Change History */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                      📜 ប្រវត្តិផ្លាស់ប្តូរតម្លៃ (Price Audit History)
                    </span>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                          <tr>
                            <th className="p-2.5">ថ្ងៃខែឆ្នាំ</th>
                            <th className="p-2.5">ដើមចាស់ ➔ ថ្មី</th>
                            <th className="p-2.5">លក់ចាស់ ➔ ថ្មី</th>
                            <th className="p-2.5">អ្នកកែ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {priceHistory.filter(h => h.product_id === detailedProduct.id).map((h, i) => (
                            <tr key={i}>
                              <td className="p-2.5">{h.timestamp.slice(0, 10)}</td>
                              <td className="p-2.5">${h.old_cost} → ${h.new_cost}</td>
                              <td className="p-2.5 text-emerald-600">${h.old_price} → ${h.new_price}</td>
                              <td className="p-2.5">{h.changed_by}</td>
                            </tr>
                          ))}
                          {priceHistory.filter(h => h.product_id === detailedProduct.id).length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-3 text-slate-400 italic text-center">គ្មានប្រវត្តិផ្លាស់ប្តូរតម្លៃទេ</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: INVENTORY RULES */}
              {detailTab === 'inventory' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold block">ស្តុកបច្ចុប្បន្ន (Current Stock):</span>
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {detailedProduct.stock_quantity || 0} Pcs
                    </span>
                  </div>

                  <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                    <span className="text-amber-800 dark:text-amber-300 font-bold block">កម្រិតស្តុកទាបបំផុត (Min / Reorder):</span>
                    <span className="text-2xl font-black font-mono text-amber-900 dark:text-amber-200">
                      {detailedProduct.low_stock_threshold || 5} Pcs
                    </span>
                  </div>

                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold block">ចំនួនណែនាំត្រូវទិញបន្ថែម (Suggested Buy):</span>
                    <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200">
                      +{Math.max(0, 50 - (detailedProduct.stock_quantity || 0))} Pcs
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 4: BATCH & EXPIRY */}
              {detailTab === 'batch' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white">🧪 គ្រប់គ្រង Batch / Lot លម្អិត (Batch Management)</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                        <tr>
                          <th className="p-2.5">Batch No.</th>
                          <th className="p-2.5">ថ្ងៃផលិត (MFG)</th>
                          <th className="p-2.5">ថ្ងៃផុតកំណត់ (EXP)</th>
                          <th className="p-2.5 text-center">ចំនួនស្តុក</th>
                          <th className="p-2.5 text-right">ដើមទុនក្នុង 1 Batch</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-100 dark:border-slate-800">
                          <td className="p-2.5 font-bold text-blue-600">{detailedProduct.batch_no || 'BATCH-2026-A1'}</td>
                          <td className="p-2.5">{detailedProduct.mfg_date || '2026-01-15'}</td>
                          <td className="p-2.5 text-amber-600">{detailedProduct.expiry_date || '2027-01-15'}</td>
                          <td className="p-2.5 text-center font-bold">{detailedProduct.stock_quantity || 0} Pcs</td>
                          <td className="p-2.5 text-right font-bold">${((parseFloat(detailedProduct.cost_price) || 0) * (detailedProduct.stock_quantity || 0)).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: SUPPLIER PROFILE */}
              {detailTab === 'supplier' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 font-bold block">អ្នកផ្គត់ផ្គង់ដើម (Supplier Name):</span>
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {detailedProduct.supplier_name || 'General Supplier'}
                      </span>
                      <span className="block text-xs font-mono text-slate-500 mt-0.5">
                        📞 ទំនាក់ទំនង៖ {detailedProduct.supplier_contact || '012 888 999'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSupplierName(detailedProduct.supplier_name || 'General Supplier')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      👁️ មើល 360° Supplier Profile
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: STOCK HISTORY LOG */}
              {detailTab === 'stock_history' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white">📜 ប្រវត្តិស្តុកចូល/ចេញ/ខូច (Stock Movements Log)</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">ថ្ងៃខែឆ្នាំ</th>
                          <th className="p-2.5">ប្រភេទ</th>
                          <th className="p-2.5 text-center">ចំនួន (Qty)</th>
                          <th className="p-2.5">មូលហេតុ</th>
                          <th className="p-2.5">PO / Invoice Ref</th>
                          <th className="p-2.5">អ្នកកែ (Staff)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {stockMovements.filter(m => m.product_id === detailedProduct.id || m.sku === detailedProduct.sku).map((m, i) => (
                          <tr key={i}>
                            <td className="p-2.5">{m.timestamp.slice(0, 10)}</td>
                            <td className="p-2.5 font-bold">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${m.qty >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {m.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-black">{m.qty > 0 ? `+${m.qty}` : m.qty}</td>
                            <td className="p-2.5 font-sans">{m.reason}</td>
                            <td className="p-2.5 text-indigo-600">{m.ref_no || 'PO-SYS'}</td>
                            <td className="p-2.5 font-sans">{m.staff_name}</td>
                          </tr>
                        ))}
                        {stockMovements.filter(m => m.product_id === detailedProduct.id || m.sku === detailedProduct.sku).length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-3 text-slate-400 italic text-center font-sans">គ្មានប្រវត្តិស្តុកថ្មីៗទេ</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: SALES & PROFIT */}
              {detailTab === 'sales' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                      <span className="text-blue-700 dark:text-blue-300 font-bold block">ចំនួនលក់បានសរុប (Units Sold):</span>
                      <span className="text-2xl font-black font-mono text-blue-900 dark:text-blue-200">
                        {getProductPeriodSales(detailedProduct.id).soldQty} Pcs
                      </span>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold block">ចំណូលលក់បានសរុប (Gross Revenue):</span>
                      <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200">
                        ${getProductPeriodSales(detailedProduct.id).revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEditModal(detailedProduct)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'កែប្រែព័ត៌មានទំនិញនេះ' : 'Edit Product'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailedProduct(null)}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-5 py-2 rounded-xl font-black text-xs transition cursor-pointer"
              >
                {lang === 'km' ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUPPLIER 360° PROFILE MODAL                                 */}
      {/* ============================================================== */}
      {selectedSupplierName && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    🚚 {selectedSupplierName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Supplier Profile 360° Audit
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSupplierName(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Supplier Stats */}
            <div className="grid grid-cols-3 gap-3 text-xs font-sans">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-bold block">ចំនួនមុខទំនិញទិញចូល</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  {products.filter(p => (p.supplier_name || 'General Supplier') === selectedSupplierName).length} មុខ
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-bold block">សរុបដើមទុនបានចំណាយ</span>
                <span className="font-mono font-black text-sm text-emerald-600">
                  ${products.filter(p => (p.supplier_name || 'General Supplier') === selectedSupplierName).reduce((sum, p) => sum + ((parseFloat(p.cost_price) || 0) * (p.stock_quantity || 0)), 0).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-bold block">ជំពាក់ប្រាក់ (Owed Amount)</span>
                <span className="font-mono font-black text-sm text-rose-600">
                  $0.00
                </span>
              </div>
            </div>

            {/* Supplied Items List */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider block">
                📦 បញ្ជីមុខទំនិញផ្គត់ផ្គង់ដោយ {selectedSupplierName}
              </span>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">ទំនិញ</th>
                      <th className="p-2.5 text-center">ស្តុក</th>
                      <th className="p-2.5 text-right">តម្លៃដើម ($)</th>
                      <th className="p-2.5 text-right">សរុប ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.filter(p => (p.supplier_name || 'General Supplier') === selectedSupplierName).map(p => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{p.title_kh || p.title_en}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{p.stock_quantity}</td>
                        <td className="p-2.5 text-right font-mono">${(parseFloat(p.cost_price) || 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">${((parseFloat(p.cost_price) || 0) * (p.stock_quantity || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSupplierName(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                {lang === 'km' ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
