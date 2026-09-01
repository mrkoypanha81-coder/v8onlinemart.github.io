import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  X, User, Phone, MapPin, Navigation, Camera, Upload,
  Check, Edit3, Sun, Moon, Globe,
  ExternalLink, LogOut, CheckCircle2, AlertCircle, ArrowRight, Wallet, PlusCircle, Settings,
  Lock, KeyRound, Eye, EyeOff, ShieldCheck, Type
} from 'lucide-react';
import { DepositCreditModal } from './DepositCreditModal';

export const SettingsModal = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    lang,
    setLang,
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
    customerProfile,
    registeredCustomers = [],
    loginCustomer,
    registerCustomer,
    updateCustomerProfile,
    changeCustomerPassword,
    resetCustomerPasswordWithPhone,
    logoutCustomer,
    showToast,
    formatDualPrice,
    setIsWalletHistoryOpen,
    sendSmsNotification,
    smsSettings
  } = useStore();

  // Auth Modes when logged out: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState('login');
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);

  // Change Password Toggle for Logged-In Members
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Forgot Password Verification State
  const [forgotStep, setForgotStep] = useState(1); // 1: phone input, 2: otp & new pass
  const [forgotPhone, setForgotPhone] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);

  // Registration & Profile Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    googleMapsUrl: '',
    avatar: '',
    latitude: null,
    longitude: null
  });

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Sync form data when customerProfile changes
  useEffect(() => {
    setFormData({
      fullName: customerProfile.fullName || '',
      phone: customerProfile.phone || '',
      password: '',
      confirmPassword: '',
      address: customerProfile.address || '',
      googleMapsUrl: customerProfile.googleMapsUrl || '',
      avatar: customerProfile.avatar || '',
      latitude: customerProfile.latitude || null,
      longitude: customerProfile.longitude || null
    });
    if (!customerProfile.isRegistered) {
      setIsEditingForm(true);
    } else {
      setIsEditingForm(false);
    }
  }, [customerProfile, isSettingsOpen]);

  // OTP Countdown Timer for Forgot Password
  useEffect(() => {
    let interval = null;
    if (authMode === 'forgot' && forgotStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [authMode, forgotStep, otpTimer]);

  if (!isSettingsOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const res = loginCustomer(loginPhone, loginPass);
    if (res && res.success) {
      setLoginPass('');
    }
  };

  // Handle Register / Update Submit
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!formData.phone.trim()) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter phone number!', 'error');
      return;
    }
    if (!formData.fullName.trim()) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះអតិថិជន!' : 'Please enter your full name!', 'error');
      return;
    }

    if (!customerProfile.isRegistered) {
      // New Account Registration
      if (!formData.password || formData.password.length < 4) {
        showToast(lang === 'km' ? 'លេខសម្ងាត់ត្រូវមានយ៉ាងតិច 4 ខ្ទង់!' : 'Password must be at least 4 characters!', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast(lang === 'km' ? 'ការផ្ទៀងផ្ទាត់លេខសម្ងាត់មិនត្រូវគ្នាទេ!' : 'Passwords do not match!', 'error');
        return;
      }
      const res = registerCustomer(formData);
      if (res && res.alreadyRegistered) {
        setAuthMode('login');
        setLoginPhone(formData.phone);
      }
    } else {
      // Profile Details Update (for already logged-in members)
      updateCustomerProfile(formData);
      setIsEditingForm(false);
      showToast(lang === 'km' ? '✅ រក្សាទុកព័ត៌មានអតិថិជនបានជោគជ័យ!' : '✅ Profile updated successfully!');
    }
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      showToast(lang === 'km' ? 'ការផ្ទៀងផ្ទាត់លេខសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ!' : 'New passwords do not match!', 'error');
      return;
    }
    const res = changeCustomerPassword(passwords.currentPassword, passwords.newPassword);
    if (res && res.success) {
      setIsChangingPassword(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    }
  };

  // Handle Send Forgot Password OTP
  const handleSendForgotOtp = (e) => {
    e.preventDefault();
    const cleanPhone = (forgotPhone || '').trim();
    if (!cleanPhone) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter your phone number!', 'error');
      return;
    }

    const exists = registeredCustomers.some(c => c.phone && c.phone.trim().replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''));
    if (!exists) {
      showToast(
        lang === 'km'
          ? `❌ លេខទូរស័ព្ទ ${cleanPhone} មិនទាន់បានចុះឈ្មោះក្នុងប្រព័ន្ធទេ! សូមចុះឈ្មោះថ្មី`
          : `❌ Phone number ${cleanPhone} is not registered yet! Please create an account.`,
        'error'
      );
      return;
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setInputOtp('');
    setForgotStep(2);
    setOtpTimer(60);

    // Send OTP SMS
    if (smsSettings.enabled) {
      const smsMsg = lang === 'km'
        ? `📲 កូដ OTP សម្រាប់ផ្ទៀងផ្ទាត់ប្តូរលេខសម្ងាត់ V8 Mini Mart របស់លោកអ្នកគឺ៖ ${code} (មានសុពលភាពរយៈពេល ១០ នាទី)`
        : `📲 Your V8 Mini Mart password reset OTP code is: ${code} (valid for 10 minutes)`;
      sendSmsNotification(cleanPhone, smsMsg);
    }

    showToast(
      lang === 'km'
        ? `📲 កូដ OTP ផ្ទៀងផ្ទាត់លេខសម្ងាត់គឺ៖ [${code}]`
        : `📲 Password Reset OTP Code is: [${code}]`,
      'info'
    );
  };

  // Handle Verify OTP & Set New Password
  const handleResetForgotSubmit = (e) => {
    e.preventDefault();
    const cleanOtp = (inputOtp || '').trim();
    if (cleanOtp !== generatedOtp) {
      showToast(lang === 'km' ? '❌ កូដ OTP មិនត្រឹមត្រូវទេ!' : '❌ Incorrect OTP code!', 'error');
      return;
    }
    if (!forgotNewPass || forgotNewPass.length < 4) {
      showToast(lang === 'km' ? 'លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 4 ខ្ទង់!' : 'New password must be at least 4 characters!', 'error');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      showToast(lang === 'km' ? 'ការផ្ទៀងផ្ទាត់លេខសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ!' : 'New passwords do not match!', 'error');
      return;
    }

    const res = resetCustomerPasswordWithPhone(forgotPhone, forgotNewPass);
    if (res && res.success) {
      setAuthMode('login');
      setForgotStep(1);
      setForgotPhone('');
      setForgotNewPass('');
      setForgotConfirmPass('');
      setInputOtp('');
    }
  };

  // Photo Upload Handler (Max 10MB limit)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast(lang === 'km' ? 'ទំហំរូបភាពលើសពី 10MB!' : 'Image size exceeds 10MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setFormData(prev => ({
        ...prev,
        avatar: loadEvent.target.result
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Google Maps GPS Location Fetcher
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast(lang === 'km' ? 'ឧបករណ៍របស់អ្នកមិនគាំទ្រ GPS ទេ' : 'Geolocation is not supported.', 'error');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          googleMapsUrl: mapsUrl,
          address: prev.address || `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
        }));
        setIsGettingLocation(false);
        showToast(lang === 'km' ? '📍 ចាប់ទីតាំង GPS បានជោគជ័យ!' : '📍 GPS Location captured!');
      },
      (error) => {
        setIsGettingLocation(false);
        console.error('Error fetching location', error);
        showToast(lang === 'km'
          ? 'មិនអាចចាប់ទីតាំង GPS បានទេ សូមបើកសិទ្ធិ Location លើទូរស័ព្ទរបស់អ្នក។'
          : 'Could not get GPS location. Please allow location access.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col max-h-[90vh]">

        {/* Top Profile Header (Mockup Design) */}
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40 flex-shrink-0 relative">
          <div className="flex items-center space-x-3.5">
            {/* Avatar Squircle */}
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-md shadow-emerald-500/10 border border-emerald-400/20 overflow-hidden">
              {customerProfile.isRegistered && customerProfile.phone && customerProfile.avatar ? (
                <img src={customerProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>

            {/* Profile Info */}
            <div className="text-left">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {customerProfile.isRegistered && customerProfile.phone
                  ? customerProfile.fullName
                  : (lang === 'km' ? 'ភ្ញៀវកិត្តិយស (Guest)' : 'Guest Client')}
              </h3>

              <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                {customerProfile.isRegistered && customerProfile.phone
                  ? customerProfile.phone
                  : (lang === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'Not registered yet')}
              </span>

              {/* Tier Badge */}
              <div className="mt-1">
                {customerProfile.isRegistered && customerProfile.phone ? (
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 border ${(customerProfile.tier || '').toLowerCase() === 'vip'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60'
                      : (customerProfile.tier || '').toLowerCase() === 'silver'
                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60'
                    }`}>
                    {(customerProfile.tier || '').toLowerCase() === 'vip' ? '🏆 VIP Gold'
                      : (customerProfile.tier || '').toLowerCase() === 'silver' ? '🥈 Silver'
                        : '👤 Member'}
                  </span>
                ) : (
                  <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 border border-amber-200/60 dark:border-amber-900/60">
                    👤 {lang === 'km' ? 'ភ្ញៀវទូទៅ' : 'General Guest'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Actions (Close & Login Pill Button) */}
          <div className="flex flex-col items-end justify-between h-full space-y-4">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-850 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* If Logged Out: Pill Button "ចូលគណនី" */}
            {(!customerProfile.isRegistered || !customerProfile.phone) && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  showToast(lang === 'km' ? '🔑 សូមបំពេញលេខទូរស័ព្ទ និងលេខសម្ងាត់' : '🔑 Please fill phone & password', 'info');
                }}
                className="border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm flex items-center space-x-1 hover:bg-emerald-50 dark:hover:bg-slate-850 transition active:scale-95 cursor-pointer shadow-2xs"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'km' ? 'ចូលគណនី' : 'Login'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* SECTION 1: V8 Wallet Balance Card (Mockup Green Design) */}
          <div className="bg-[#0c7a52] rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-200" />
                <span className="font-black text-xs sm:text-sm tracking-wide">
                  {lang === 'km' ? 'កាបូបលុយ V8 Wallet' : 'V8 Wallet Balance'}
                </span>
              </div>
            </div>

            {/* Balance Amount and Khmer exchange rate */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                  ${(customerProfile.isRegistered && customerProfile.phone ? (parseFloat(customerProfile.balance) || 0) : 0).toFixed(2)}
                </span>
              </div>

              <span className="bg-emerald-600/80 px-3 py-1 rounded-lg text-xs font-mono text-emerald-100 font-bold flex items-center">
                ≈ {formatDualPrice(customerProfile.isRegistered && customerProfile.phone ? (parseFloat(customerProfile.balance) || 0) : 0).khr.replace('៛', '')} ៛
              </span>
            </div>

            {/* Divider line */}
            <div className="border-t border-white/20 my-2 pt-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsWalletHistoryOpen(true);
                }}
                className="flex items-center space-x-1.5 text-xs text-white/95 hover:text-white font-bold hover:underline transition cursor-pointer"
              >
                <span>💵 📜</span>
                <span>{lang === 'km' ? 'មើលប្រវត្តិប្រតិបត្តិការ Wallet' : 'View Wallet Transaction History'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: Customer Profile & Security Section */}
          <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-4 sm:p-5 border border-emerald-600/30 dark:border-emerald-500/20 shadow-xs space-y-4">

            {/* If Logged in */}
            {customerProfile.isRegistered && customerProfile.phone ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      {lang === 'km' ? 'ព័ត៌មានអតិថិជន & សុវត្ថិភាព' : 'Member Profile & Security'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingForm(!isEditingForm);
                      setIsChangingPassword(false);
                    }}
                    className="text-xs font-black text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingForm ? (lang === 'km' ? 'បិទ' : 'Cancel') : (lang === 'km' ? 'កែប្រែ' : 'Edit')}</span>
                  </button>
                </div>

                {/* View Mode */}
                {!isEditingForm && !isChangingPassword && (
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                      <span className="text-slate-400 font-bold">{lang === 'km' ? 'ឈ្មោះ' : 'Name'}:</span>
                      <span className="font-bold">{customerProfile.fullName}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                      <span className="text-slate-400 font-bold">{lang === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone'}:</span>
                      <span className="font-mono font-bold">{customerProfile.phone}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                      <span className="text-slate-400 font-bold">{lang === 'km' ? 'សុវត្ថិភាព Password' : 'Password'}:</span>
                      <span className="font-mono text-emerald-600 font-bold flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>•••••••• (Protected)</span>
                      </span>
                    </div>

                    {customerProfile.address && (
                      <div className="text-slate-700 dark:text-slate-200 pt-2 border-t border-slate-100 dark:border-slate-750">
                        <span className="text-slate-400 font-bold block mb-1">{lang === 'km' ? 'ទីតាំងដឹកជញ្ជូន' : 'Address'}:</span>
                        <p className="font-medium text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {customerProfile.address}
                        </p>
                      </div>
                    )}

                    {/* Google Maps Link */}
                    {customerProfile.googleMapsUrl && (
                      <a
                        href={customerProfile.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-2xl font-bold text-xs flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>{lang === 'km' ? '📍 បើកមើលលើ Google Maps' : '📍 Open in Google Maps'}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Button to Change Password */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(true)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{lang === 'km' ? '🔒 ប្តូរលេខសម្ងាត់ Password' : '🔒 Change Password'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Change Password Sub-Form */}
                {isChangingPassword && (
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <KeyRound className="w-4 h-4 text-indigo-600" />
                        <span>{lang === 'km' ? 'ប្តូរលេខសម្ងាត់ថ្មី' : 'Change Secret Password'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                      </button>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'លេខសម្ងាត់ចាស់ (Current Password) *' : 'Current Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'លេខសម្ងាត់ថ្មី (New Password) *' : 'New Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="យ៉ាងតិច 4 ខ្ទង់..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm New Password) *' : 'Confirm New Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={passwords.confirmNewPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'km' ? 'រក្សាទុកលេខសម្ងាត់ថ្មី' : 'Save New Password'}</span>
                    </button>
                  </form>
                )}

                {/* Edit Profile Details Form */}
                {isEditingForm && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'ឈ្មោះអតិថិជន *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'ទីតាំង / អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery Address'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 text-slate-900 dark:text-white resize-none text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* If Logged Out: Display Login or Register Tabs */
              <div className="space-y-4">
                {/* Auth Mode Switcher */}
                <div className="grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setForgotStep(1); }}
                    className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${authMode === 'login' || authMode === 'forgot'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{authMode === 'forgot' ? (lang === 'km' ? '🔐 ភ្លេចលេខសម្ងាត់' : '🔐 Forgot Pass') : (lang === 'km' ? '🔑 ចូលគណនី (Login)' : '🔑 Login')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setForgotStep(1); }}
                    className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${authMode === 'register'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? '📝 ចុះឈ្មោះថ្មី (Register)' : '📝 Register'}</span>
                  </button>
                </div>

                {/* 1. LOGIN FORM */}
                {authMode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="012 345 678"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          {lang === 'km' ? 'លេខសម្ងាត់ Password *' : 'Secret Password / PIN *'}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setForgotStep(1);
                            setForgotPhone(loginPhone || '');
                          }}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {lang === 'km' ? 'ភ្លេចលេខសម្ងាត់?' : 'Forgot Password?'}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPass}
                          onChange={(e) => setLoginPass(e.target.value)}
                          placeholder="បញ្ចូលលេខសម្ងាត់ Password..."
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {lang === 'km' ? 'គណនីមានស្រាប់ Password ដំបូងគឺ៖ 1234' : 'Default password for existing demo accounts: 1234'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{lang === 'km' ? '🔑 ផ្ទៀងផ្ទាត់ & ចូលគណនី (Login & Unlock Wallet)' : 'Login & Unlock Wallet'}</span>
                    </button>
                  </form>
                ) : authMode === 'forgot' ? (
                  /* 2. FORGOT PASSWORD PHONE VERIFICATION FORM */
                  <div className="space-y-3.5 text-xs animate-fade-in">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center space-x-2.5">
                      <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-300 block">
                          {lang === 'km' ? 'ស្វែងរកលេខសម្ងាត់គណនីឡើងវិញ' : 'Recover Account Password'}
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400">
                          {lang === 'km' ? 'ផ្ទៀងផ្ទាត់តាមលេខទូរស័ព្ទដែលបានចុះឈ្មោះដើម្បីកំណត់លេខសម្ងាត់ថ្មី' : 'Verify with your registered phone number to set a new password'}
                        </span>
                      </div>
                    </div>

                    {forgotStep === 1 ? (
                      /* Step 1: Input Registered Phone */
                      <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {lang === 'km' ? 'លេខទូរស័ព្ទដែលបានចុះឈ្មោះ *' : 'Registered Phone Number *'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={forgotPhone}
                            onChange={(e) => setForgotPhone(e.target.value)}
                            placeholder="ឧទាហរណ៍៖ 010828282"
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                            autoFocus
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{lang === 'km' ? '📩 ផ្ញើកូដផ្ទៀងផ្ទាត់ (Send OTP Verification)' : 'Send Verification OTP'}</span>
                        </button>
                      </form>
                    ) : (
                      /* Step 2: Input OTP and Set New Password */
                      <form onSubmit={handleResetForgotSubmit} className="space-y-3">
                        {/* Secure OTP Alert Banner */}
                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-start space-x-2.5 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-450 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold">
                              {lang === 'km' ? 'បានផ្ញើកូដផ្ទៀងផ្ទាត់រួចរាល់' : 'Verification OTP Sent'}
                            </span>
                            <p className="mt-0.5 text-slate-500 dark:text-slate-400 text-[10px] font-semibold leading-relaxed">
                              {lang === 'km' 
                                ? `កូដ OTP ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់លេខទូរស័ព្ទ ${forgotPhone} រួចរាល់ហើយ។ សូមពិនិត្យមើលសារទូរស័ព្ទរបស់អ្នក។`
                                : `A 6-digit OTP code has been sent to your phone number ${forgotPhone}. Please check your phone messages.`}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {lang === 'km' ? 'កូដផ្ទៀងផ្ទាត់ ៦ ខ្ទង់ (OTP Code) *' : '6-Digit OTP Code *'}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={inputOtp}
                            onChange={(e) => setInputOtp(e.target.value)}
                            placeholder="6-digit code..."
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-center tracking-widest text-base font-black text-slate-900 dark:text-white"
                            autoFocus
                          />
                          {/* Resend OTP Link/Timer */}
                          <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-semibold">
                            <span className="text-slate-500 dark:text-slate-400">
                              {lang === 'km' ? 'មិនទាន់ទទួលបានកូដ?' : "Didn't receive the code?"}
                            </span>
                            {otpTimer > 0 ? (
                              <span className="text-slate-400 font-mono">
                                {lang === 'km' ? `ផ្ញើឡើងវិញក្នុង ${otpTimer}ស` : `Resend in ${otpTimer}s`}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleSendForgotOtp(e)}
                                className="text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer font-bold"
                              >
                                {lang === 'km' ? 'ផ្ញើកូដ OTP ម្តងទៀត' : 'Resend OTP Code'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {lang === 'km' ? 'លេខសម្ងាត់ថ្មី (New Password) *' : 'New Password *'}
                          </label>
                          <div className="relative">
                            <input
                              type={showForgotNewPass ? 'text' : 'password'}
                              required
                              minLength={4}
                              value={forgotNewPass}
                              onChange={(e) => setForgotNewPass(e.target.value)}
                              placeholder="យ៉ាងតិច 4 ខ្ទង់..."
                              className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showForgotNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {lang === 'km' ? 'បញ្ជាក់លេខសម្ងាត់ថ្មី (Confirm Password) *' : 'Confirm Password *'}
                          </label>
                          <input
                            type="password"
                            required
                            minLength={4}
                            value={forgotConfirmPass}
                            onChange={(e) => setForgotConfirmPass(e.target.value)}
                            placeholder="បញ្ចូលលេខសម្ងាត់ថ្មីម្តងទៀត..."
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setForgotStep(1)}
                            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                          >
                            {lang === 'km' ? 'ថយក្រោយ' : 'Back'}
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>{lang === 'km' ? '✅ ផ្ទៀងផ្ទាត់ & រក្សាទុកលេខសម្ងាត់' : 'Verify & Save Password'}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="text-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setForgotStep(1); }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                      >
                        {lang === 'km' ? '← ត្រឡប់ទៅចូលគណនីវិញ (Back to Login)' : '← Back to Login'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. REGISTER FORM */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                    {/* Photo Upload */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                        {lang === 'km' ? '📸 រូបភាព Profile (Max 10MB)' : '📸 Profile Photo (Max 10MB)'}
                      </label>

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

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'km' ? 'ជ្រើសរូប' : 'Gallery'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 bg-slate-850 hover:bg-slate-900 text-white p-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{lang === 'km' ? 'ថតរូប' : 'Camera'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'ឈ្មោះអតិថិជន *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder={lang === 'km' ? 'ឧទាហរណ៍៖ សុខ វិបុល' : 'e.g. John Doe'}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="012 345 678"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'បង្កើតលេខសម្ងាត់ Password (យ៉ាងតិច 4 ខ្ទង់) *' : 'Create Secret Password / PIN *'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={4}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="លេខសម្ងាត់ការពារគណនី..."
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'km' ? 'ផ្ទៀងផ្ទាត់លេខសម្ងាត់ម្តងទៀត *' : 'Confirm Secret Password *'}
                      </label>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="វាយលេខសម្ងាត់ម្តងទៀត..."
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    {/* Address & GPS */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                          {lang === 'km' ? 'ទីតាំង / អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery Address'}
                        </label>

                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          disabled={isGettingLocation}
                          className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                        >
                          <Navigation className={`w-3 h-3 ${isGettingLocation ? 'animate-spin' : ''}`} />
                          <span>{lang === 'km' ? '🎯 ចាប់ទីតាំង GPS' : '🎯 Get GPS'}</span>
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder={lang === 'km' ? 'ផ្ទះលេខ, ផ្លូវ, សង្កាត់, ខណ្ឌ...' : 'House No, Street, Sangkat, Khan...'}
                        className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-600 text-slate-900 dark:text-white resize-none text-xs"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{lang === 'km' ? '✨ ចុះឈ្មោះ & ការពារ Wallet (Create Protected Account)' : 'Create Protected Account'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: App Preferences (Theme Mode, Language) */}
          <div className="bg-slate-50 dark:bg-slate-850 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              {lang === 'km' ? '⚙️ កំណត់ផ្ទាល់ខ្លួន (Settings)' : '⚙️ App Preferences'}
            </span>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>{theme === 'dark' ? (lang === 'km' ? 'មុខងារងងឹត (Dark)' : 'Dark Mode') : (lang === 'km' ? 'មុខងារពន្លឺ (Light)' : 'Light Mode')}</span>
              </span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-slate-750">
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'km' ? 'ភាសា' : 'Language'}</span>
              </span>
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setLang('km')}
                  className={`px-3 py-1 rounded-lg font-black transition cursor-pointer ${lang === 'km' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                  ខ្មែរ
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-lg font-black transition cursor-pointer ${lang === 'en' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="pt-3 border-t border-slate-200/70 dark:border-slate-750 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
                  <Type className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'km' ? 'ទំហំអក្សរ (Font Size)' : 'Text / Font Size'}</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {fontSize === 'small' ? (lang === 'km' ? 'តូច (85%)' : 'Small (85%)')
                    : fontSize === 'large' ? (lang === 'km' ? 'ធំ (105%)' : 'Large (105%)')
                      : fontSize === 'xlarge' ? (lang === 'km' ? 'ធំបំផុត (115%)' : 'Extra Large (115%)')
                        : (lang === 'km' ? 'មធ្យម (100%)' : 'Normal (100%)')}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-750">
                {[
                  { id: 'small', label_km: 'តូច', label_en: 'Small', iconScale: 'text-xs', preview: 'A⁻' },
                  { id: 'normal', label_km: 'មធ្យម', label_en: 'Normal', iconScale: 'text-sm', preview: 'A' },
                  { id: 'large', label_km: 'ធំ', label_en: 'Large', iconScale: 'text-base', preview: 'A⁺' },
                  { id: 'xlarge', label_km: 'ធំបំផុត', label_en: 'XL', iconScale: 'text-lg', preview: 'A⁺⁺' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFontSize(item.id);
                      showToast(
                        lang === 'km'
                          ? `🔤 បានប្តូរទំហំអក្សរទៅជា៖ ${item.label_km}`
                          : `🔤 Font size set to: ${item.label_en}`,
                        'info'
                      );
                    }}
                    className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center space-y-0.5 cursor-pointer ${fontSize === item.id
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <span className={`font-mono font-black ${item.iconScale} leading-none`}>
                      {item.preview}
                    </span>
                    <span className="text-[10px] font-bold">
                      {lang === 'km' ? item.label_km : item.label_en}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: Log Out Button (If Logged In) */}
          {customerProfile.isRegistered && customerProfile.phone && (
            <button
              onClick={() => {
                logoutCustomer();
                setIsSettingsOpen(false);
                showToast(lang === 'km' ? '🔒 បានចាកចេញ & ចាក់សោរ Wallet!' : '🔒 Logged out & wallet locked!');
              }}
              className="w-full py-3.5 px-4 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center space-x-2 border border-rose-200/70 dark:border-rose-950 transition cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'km' ? 'ចាកចេញពីគណនី (Log Out)' : 'Log Out Account'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Deposit Credit Modal Overlay */}
      <DepositCreditModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
};
