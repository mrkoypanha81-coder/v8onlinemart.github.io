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

  // Registration OTP Verification State
  const [regStep, setRegStep] = useState(1); // 1: info input, 2: otp verification
  const [regGeneratedOtp, setRegGeneratedOtp] = useState('');
  const [regInputOtp, setRegInputOtp] = useState('');
  const [regOtpTimer, setRegOtpTimer] = useState(60);

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

  // OTP Countdown Timer for Registration
  useEffect(() => {
    let interval = null;
    if (authMode === 'register' && regStep === 2 && regOtpTimer > 0) {
      interval = setInterval(() => {
        setRegOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (regOtpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [authMode, regStep, regOtpTimer]);

  if (!isSettingsOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const res = loginCustomer(loginPhone, loginPass);
    if (res && res.success) {
      setLoginPass('');
    }
  };

  // Handle Send Registration OTP
  const handleSendRegOtp = (e) => {
    e.preventDefault();
    const cleanPhone = (formData.phone || '').trim();
    const cleanName = (formData.fullName || '').trim();

    if (!cleanPhone) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter phone number!', 'error');
      return;
    }
    if (!cleanName) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះអតិថិជន!' : 'Please enter your full name!', 'error');
      return;
    }

    const exists = registeredCustomers.some(c => c.phone && c.phone.trim().replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''));
    if (exists) {
      showToast(
        lang === 'km'
          ? `⚠️ លេខទូរស័ព្ទ ${cleanPhone} ធ្លាប់បានចុះឈ្មោះរួចហើយ! សូមចូលគណនី (Login)`
          : `⚠️ Phone number ${cleanPhone} already registered! Please Login.`,
        'warning'
      );
      setAuthMode('login');
      setLoginPhone(cleanPhone);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRegGeneratedOtp(code);
    setRegInputOtp('');
    setRegStep(2);
    setRegOtpTimer(60);

    if (smsSettings.enabled) {
      const smsMsg = lang === 'km'
        ? `📲 កូដ OTP សម្រាប់ផ្ទៀងផ្ទាត់ចុះឈ្មោះគណនី V8 Online Mart របស់លោកអ្នកគឺ៖ ${code} (មានសុពលភាព ៦០ វិនាទី)`
        : `📲 Your V8 Online Mart registration OTP verification code is: ${code} (valid for 60 seconds)`;
      sendSmsNotification(cleanPhone, smsMsg);
    }

    showToast(
      lang === 'km'
        ? `📲 កូដ OTP ផ្ទៀងផ្ទាត់សម្រាប់ចុះឈ្មោះគឺ៖ [${code}]`
        : `📲 Registration OTP Code is: [${code}]`,
      'info'
    );
  };

  // Handle Verify Registration OTP & Submit Account Creation
  const handleVerifyRegOtp = (e) => {
    e.preventDefault();
    const cleanOtp = (regInputOtp || '').trim();
    if (cleanOtp !== regGeneratedOtp) {
      showToast(lang === 'km' ? '❌ កូដ OTP មិនត្រឹមត្រូវទេ!' : '❌ Incorrect OTP code!', 'error');
      return;
    }

    const res = registerCustomer({
      ...formData,
      password: '1234'
    });

    if (res && res.success) {
      setRegStep(1);
      setRegInputOtp('');
      setRegGeneratedOtp('');
      setIsEditingForm(false);
    }
  };

  // Handle Update Profile Details (for already logged-in members)
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
    updateCustomerProfile(formData);
    setIsEditingForm(false);
    showToast(lang === 'km' ? '✅ រក្សាទុកព័ត៌មានអតិថិជនបានជោគជ័យ!' : '✅ Profile updated successfully!');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden relative flex flex-col max-h-[92vh] transition-all duration-300">

        {/* Decorative ambient lighting behind modal header */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Profile Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 flex-shrink-0 relative z-10">
          <div className="flex items-center space-x-4">
            {/* Avatar Squircle with Gradient Ring */}
            <div className="w-15 h-15 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                {customerProfile.isRegistered && customerProfile.phone && customerProfile.avatar ? (
                  <img src={customerProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-2xl">
                    {customerProfile.fullName ? customerProfile.fullName.charAt(0).toUpperCase() : <User className="w-7 h-7 text-white" />}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-left">
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white leading-snug">
                {customerProfile.isRegistered && customerProfile.phone
                  ? customerProfile.fullName
                  : (lang === 'km' ? 'ភ្ញៀវកិត្តិយស' : 'Guest Customer')}
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {customerProfile.isRegistered && customerProfile.phone
                  ? customerProfile.phone
                  : (lang === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'No Phone Registered')}
              </p>

              {/* Tier Badge */}
              <div className="mt-1.5 flex items-center space-x-2">
                {customerProfile.isRegistered && customerProfile.phone ? (
                  <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full inline-flex items-center space-x-1 border shadow-2xs ${
                    (customerProfile.tier || '').toLowerCase() === 'vip'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : (customerProfile.tier || '').toLowerCase() === 'silver'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  }`}>
                    <span>{(customerProfile.tier || '').toLowerCase() === 'vip' ? '🏆 VIP Gold' : (customerProfile.tier || '').toLowerCase() === 'silver' ? '🥈 Silver' : '⭐ Member'}</span>
                  </span>
                ) : (
                  <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-extrabold px-3 py-0.5 rounded-full inline-flex items-center space-x-1">
                    <span>👤</span>
                    <span>{lang === 'km' ? 'ភ្ញៀវទូទៅ' : 'Guest Member'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Actions (Close & Login Pill Button) */}
          <div className="flex items-center space-x-2">
            {(!customerProfile.isRegistered || !customerProfile.phone) && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  showToast(lang === 'km' ? 'សូមបំពេញលេខទូរស័ព្ទ និងលេខសម្ងាត់' : 'Please enter phone & password', 'info');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Lock className="w-4 h-4" />
                <span>{lang === 'km' ? 'ចូលគណនី' : 'Login'}</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 scrollbar-none">

          {/* SECTION 1: V8 Wallet Digital Card */}
          <div className="relative rounded-3xl p-6 text-white shadow-xl glow-emerald overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border border-emerald-400/30 group transition-all duration-300">
            {/* Ambient Watermark Shine */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Wallet className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <span className="font-black text-xs uppercase tracking-wider text-emerald-100 block">
                    V8 Wallet
                  </span>
                  <span className="text-[11px] text-emerald-200/80 block font-medium">
                    {lang === 'km' ? 'កាបូបលុយអេឡិចត្រូនិក' : 'Digital Wallet'}
                  </span>
                </div>
              </div>

              <span className="text-[11px] uppercase font-black tracking-wider px-3 py-1 rounded-full backdrop-blur-md bg-white/15 border border-white/20 text-white">
                {customerProfile.isRegistered && customerProfile.phone ? 'Active' : (lang === 'km' ? 'ភ្ញៀវ' : 'Guest')}
              </span>
            </div>

            {/* Balance Amount and KHR Equivalent */}
            <div className="mt-5 relative z-10 flex items-end justify-between">
              <div>
                <span className="text-xs text-emerald-200/90 font-medium block">
                  {lang === 'km' ? 'សមតុល្យទឹកប្រាក់' : 'Available Balance'}
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm font-sans block mt-0.5">
                  ${(customerProfile.isRegistered && customerProfile.phone ? (parseFloat(customerProfile.balance) || 0) : 0).toFixed(2)}
                </span>
                <span className="text-xs sm:text-sm text-emerald-200/90 font-bold block mt-1">
                  ≈ {formatDualPrice(customerProfile.isRegistered && customerProfile.phone ? (parseFloat(customerProfile.balance) || 0) : 0).khr}
                </span>
              </div>

              {/* Deposit Button */}
              {customerProfile.isRegistered && customerProfile.phone && (
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(true)}
                  className="py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center space-x-1.5 shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'km' ? 'បញ្ចូលលុយ' : 'Deposit'}</span>
                </button>
              )}
            </div>

            {/* Transaction History Link */}
            <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between relative z-10">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsWalletHistoryOpen(true);
                }}
                className="text-emerald-100 hover:text-white font-bold flex items-center space-x-2 transition text-xs sm:text-sm group/link cursor-pointer"
              >
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-300" />
                <span>{lang === 'km' ? 'មើលប្រវត្តិប្រតិបត្តិការ Wallet' : 'View Wallet History'}</span>
                <ArrowRight className="w-4 h-4 opacity-70 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* SECTION 2: Member Auth & Profile Security Section */}
          <div className="bg-slate-50/80 dark:bg-slate-850 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">

            {/* If Logged in */}
            {customerProfile.isRegistered && customerProfile.phone ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-750 pb-3.5">
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {lang === 'km' ? 'ព័ត៌មានអតិថិជន & សុវត្ថិភាព' : 'Profile & Security'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingForm(!isEditingForm);
                      setIsChangingPassword(false);
                    }}
                    className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditingForm ? (lang === 'km' ? 'បិទ' : 'Cancel') : (lang === 'km' ? 'កែប្រែព័ត៌មាន' : 'Edit Profile')}</span>
                  </button>
                </div>

                {/* View Mode */}
                {!isEditingForm && !isChangingPassword && (
                  <div className="space-y-3.5 text-sm sm:text-base">
                    <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                      <span className="text-slate-500 font-semibold">{lang === 'km' ? 'ឈ្មោះអតិថិជន' : 'Full Name'}:</span>
                      <span className="font-extrabold">{customerProfile.fullName}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                      <span className="text-slate-500 font-semibold">{lang === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}:</span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white">{customerProfile.phone}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                      <span className="text-slate-500 font-semibold">{lang === 'km' ? 'លេខសម្ងាត់' : 'Password'}:</span>
                      <span className="font-mono text-emerald-600 font-bold flex items-center space-x-1.5 text-xs sm:text-sm">
                        <Lock className="w-4 h-4" />
                        <span>•••••••• (Protected)</span>
                      </span>
                    </div>

                    {customerProfile.address && (
                      <div className="text-slate-800 dark:text-slate-200 pt-3 border-t border-slate-200/60 dark:border-slate-750">
                        <span className="text-slate-500 font-semibold block mb-1 text-xs sm:text-sm">{lang === 'km' ? 'ទីតាំងដឹកជញ្ជូន' : 'Delivery Address'}:</span>
                        <p className="font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700">
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
                        className="w-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-between transition shadow-2xs"
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4.5 h-4.5 text-emerald-600" />
                          <span>{lang === 'km' ? '📍 បើកមើលទីតាំងលើ Google Maps' : '📍 Open Location on Google Maps'}</span>
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Button to Change Password */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(true)}
                        className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{lang === 'km' ? 'ប្តូរលេខសម្ងាត់ Password' : 'Change Password'}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Change Password Sub-Form */}
                {isChangingPassword && (
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-750">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
                        <KeyRound className="w-4.5 h-4.5 text-emerald-600" />
                        <span>{lang === 'km' ? 'ប្តូរលេខសម្ងាត់ថ្មី' : 'Change Password'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs sm:text-sm font-bold cursor-pointer"
                      >
                        {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                      </button>
                    </div>

                    <div>
                      <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'km' ? 'លេខសម្ងាត់ចាស់ *' : 'Current Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'km' ? 'លេខសម្ងាត់ថ្មី (យ៉ាងតិច 4 ខ្ទង់) *' : 'New Password (min 4 chars) *'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'km' ? 'បញ្ជាក់លេខសម្ងាត់ថ្មី *' : 'Confirm New Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        value={passwords.confirmNewPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/25 cursor-pointer"
                    >
                      <Check className="w-5 h-5" />
                      <span>{lang === 'km' ? 'រក្សាទុកលេខសម្ងាត់ថ្មី' : 'Save New Password'}</span>
                    </button>
                  </form>
                )}

                {/* Edit Profile Form */}
                {isEditingForm && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                      <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'km' ? 'ឈ្មោះអតិថិជន *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'km' ? 'អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery Address'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/25 cursor-pointer"
                    >
                      <Check className="w-5 h-5" />
                      <span>{lang === 'km' ? 'រក្សាទុកការប្រែប្រួល' : 'Save Changes'}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* If Logged Out: Auth Forms (Login / Register / Forgot Password) */
              <div className="space-y-5">

                {/* Segmented Pill Switcher Tabs (Login vs Register) */}
                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-2xl border border-slate-300/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setForgotStep(1); }}
                    className={`py-3 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
                      authMode === 'login' || authMode === 'forgot'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md scale-[1.01]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>{lang === 'km' ? 'ចូលគណនី' : 'Login'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setForgotStep(1); }}
                    className={`py-3 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md scale-[1.01]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{lang === 'km' ? 'ចុះឈ្មោះថ្មី' : 'Register'}</span>
                  </button>
                </div>

                {/* 1. LOGIN FORM */}
                {authMode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="012 345 678"
                          className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white transition shadow-2xs"
                        />
                        <Phone className="w-5 h-5 text-slate-400 absolute right-4 top-4 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          {lang === 'km' ? 'លេខសម្ងាត់ Password *' : 'Secret Password / PIN *'}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setForgotStep(1);
                            setForgotPhone(loginPhone || '');
                          }}
                          className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
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
                          placeholder={lang === 'km' ? 'បញ្ចូលលេខសម្ងាត់របស់អ្នក...' : 'Enter your password...'}
                          className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white transition shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 font-medium">
                        {lang === 'km' ? '💡 គណនីដំបូង Password គឺ៖ 1234' : '💡 Default password for existing demo accounts: 1234'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      <Lock className="w-5 h-5" />
                      <span>{lang === 'km' ? 'ចូលគណនី & ប្រើប្រាស់ Wallet' : 'Login & Unlock Wallet'}</span>
                    </button>
                  </form>
                ) : authMode === 'forgot' ? (
                  /* 2. FORGOT PASSWORD PHONE VERIFICATION FORM */
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-sm sm:text-base text-amber-900 dark:text-amber-300 block">
                          {lang === 'km' ? 'ស្វែងរកលេខសម្ងាត់គណនីឡើងវិញ' : 'Recover Password'}
                        </span>
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          {lang === 'km' ? 'ផ្ទៀងផ្ទាត់តាមលេខទូរស័ព្ទដែលបានចុះឈ្មោះដើម្បីកំណត់លេខសម្ងាត់ថ្មី' : 'Verify with phone number to reset password'}
                        </span>
                      </div>
                    </div>

                    {forgotStep === 1 ? (
                      /* Step 1: Input Registered Phone */
                      <form onSubmit={handleSendForgotOtp} className="space-y-4">
                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                            {lang === 'km' ? 'លេខទូរស័ព្ទដែលបានចុះឈ្មោះ *' : 'Registered Phone Number *'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={forgotPhone}
                            onChange={(e) => setForgotPhone(e.target.value)}
                            placeholder="012 345 678"
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                            autoFocus
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/25 cursor-pointer"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          <span>{lang === 'km' ? 'ផ្ញើកូដផ្ទៀងផ្ទាត់ (Send OTP)' : 'Send Verification OTP'}</span>
                        </button>
                      </form>
                    ) : (
                      /* Step 2: Input OTP and Set New Password */
                      <form onSubmit={handleResetForgotSubmit} className="space-y-4">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-start space-x-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold">
                              {lang === 'km' ? 'បានផ្ញើកូដផ្ទៀងផ្ទាត់រួចរាល់' : 'OTP Code Sent'}
                            </span>
                            <p className="mt-0.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                              {lang === 'km' 
                                ? `កូដ OTP ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់លេខទូរស័ព្ទ ${forgotPhone}។`
                                : `A 6-digit OTP code has been sent to ${forgotPhone}.`}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                            {lang === 'km' ? 'កូដផ្ទៀងផ្ទាត់ ៦ ខ្ទង់ (OTP Code) *' : '6-Digit OTP Code *'}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={inputOtp}
                            onChange={(e) => setInputOtp(e.target.value)}
                            placeholder="123456"
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-mono text-center tracking-widest text-lg font-black text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <div className="flex justify-between items-center mt-2 px-1 text-xs font-semibold">
                            <span className="text-slate-500">
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
                                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                              >
                                {lang === 'km' ? 'ផ្ញើកូដ OTP ម្តងទៀត' : 'Resend OTP'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                            {lang === 'km' ? 'លេខសម្ងាត់ថ្មី *' : 'New Password *'}
                          </label>
                          <input
                            type="password"
                            required
                            minLength={4}
                            value={forgotNewPass}
                            onChange={(e) => setForgotNewPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                            {lang === 'km' ? 'បញ្ជាក់លេខសម្ងាត់ថ្មី *' : 'Confirm New Password *'}
                          </label>
                          <input
                            type="password"
                            required
                            minLength={4}
                            value={forgotConfirmPass}
                            onChange={(e) => setForgotConfirmPass(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setForgotStep(1)}
                            className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {lang === 'km' ? 'ថយក្រោយ' : 'Back'}
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/25"
                          >
                            <Check className="w-5 h-5" />
                            <span>{lang === 'km' ? 'រក្សាទុកលេខសម្ងាត់ថ្មី' : 'Save Password'}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setForgotStep(1); }}
                        className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      >
                        {lang === 'km' ? '← ត្រឡប់ទៅចូលគណនីវិញ' : '← Back to Login'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. REGISTER FORM (OTP VERIFICATION FLOW) */
                  <div className="space-y-4 animate-fade-in">
                    {regStep === 1 ? (
                      /* Step 1: Input Registration Details (Photo, Name, Phone, Address) */
                      <form onSubmit={handleSendRegOtp} className="space-y-4">
                        {/* Photo Upload */}
                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {lang === 'km' ? 'រូបភាព Profile (Max 10MB)' : 'Profile Photo (Max 10MB)'}
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

                          <div className="flex items-center space-x-2.5">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
                            >
                              <Upload className="w-4 h-4 text-emerald-600" />
                              <span>{lang === 'km' ? 'ជ្រើសរូប' : 'Gallery'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => cameraInputRef.current?.click()}
                              className="flex-1 bg-slate-850 hover:bg-slate-900 text-white p-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
                            >
                              <Camera className="w-4 h-4 text-emerald-400" />
                              <span>{lang === 'km' ? 'ថតរូប' : 'Camera'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Full Name */}
                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                            {lang === 'km' ? 'ឈ្មោះអតិថិជន *' : 'Full Name *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder={lang === 'km' ? 'ឧទាហរណ៍៖ សុខ វិបុល' : 'e.g. John Doe'}
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                            {lang === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="012 345 678"
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-sans text-sm sm:text-base text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Address & GPS */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                              {lang === 'km' ? 'ទីតាំង / អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery Address'}
                            </label>

                            <button
                              type="button"
                              onClick={handleGetCurrentLocation}
                              disabled={isGettingLocation}
                              className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                            >
                              <Navigation className={`w-4 h-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
                              <span>{lang === 'km' ? '🎯 ចាប់ទីតាំង GPS' : '🎯 Get GPS'}</span>
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder={lang === 'km' ? 'ផ្ទះលេខ, ផ្លូវ, សង្កាត់, ខណ្ឌ...' : 'House No, Street, Sangkat, Khan...'}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 text-slate-900 dark:text-white resize-none font-sans text-sm sm:text-base"
                          />
                        </div>

                        {/* Submit Button to Request OTP */}
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-600/30 active:scale-98 cursor-pointer"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          <span>{lang === 'km' ? '📩 ផ្ញើកូដ OTP ផ្ទៀងផ្ទាត់' : 'Send OTP Verification'}</span>
                        </button>
                      </form>
                    ) : (
                      /* Step 2: Input 6-Digit OTP Code to Complete Registration */
                      <form onSubmit={handleVerifyRegOtp} className="space-y-4">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-start space-x-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold">
                              {lang === 'km' ? 'បានផ្ញើកូដ OTP ផ្ទៀងផ្ទាត់រួចរាល់' : 'Verification OTP Sent'}
                            </span>
                            <p className="mt-0.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                              {lang === 'km' 
                                ? `កូដ OTP ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់លេខទូរស័ព្ទ ${formData.phone}។`
                                : `A 6-digit OTP code has been sent to ${formData.phone}.`}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5">
                            {lang === 'km' ? 'កូដផ្ទៀងផ្ទាត់ ៦ ខ្ទង់ (OTP Code) *' : '6-Digit OTP Code *'}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={regInputOtp}
                            onChange={(e) => setRegInputOtp(e.target.value)}
                            placeholder="123456"
                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-emerald-600 font-mono text-center tracking-widest text-lg font-black text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <div className="flex justify-between items-center mt-2 px-1 text-xs font-semibold">
                            <span className="text-slate-500">
                              {lang === 'km' ? 'មិនទាន់ទទួលបានកូដ?' : "Didn't receive the code?"}
                            </span>
                            {regOtpTimer > 0 ? (
                              <span className="text-slate-400 font-mono">
                                {lang === 'km' ? `ផ្ញើឡើងវិញក្នុង ${regOtpTimer}ស` : `Resend in ${regOtpTimer}s`}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleSendRegOtp(e)}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                              >
                                {lang === 'km' ? 'ផ្ញើកូដ OTP ម្តងទៀត' : 'Resend OTP'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setRegStep(1)}
                            className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            {lang === 'km' ? 'ថយក្រោយ' : 'Back'}
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/25 cursor-pointer"
                          >
                            <Check className="w-5 h-5" />
                            <span>{lang === 'km' ? '✅ ផ្ទៀងផ្ទាត់ & បង្កើតគណនី' : 'Verify OTP & Create Account'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: App Preferences (Theme Mode, Language, Font Size) */}
          <div className="bg-slate-50/80 dark:bg-slate-850 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              {lang === 'km' ? '⚙️ កំណត់ផ្ទាល់ខ្លួន (App Settings)' : '⚙️ App Preferences'}
            </span>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2.5">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <span>{theme === 'dark' ? (lang === 'km' ? 'មុខងារងងឹត (Dark Mode)' : 'Dark Mode') : (lang === 'km' ? 'មុខងារពន្លឺ (Light Mode)' : 'Light Mode')}</span>
              </span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-xs ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center justify-between pt-3.5 border-t border-slate-200/70 dark:border-slate-750">
              <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2.5">
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'km' ? 'ភាសា' : 'Language'}</span>
              </span>
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
                <button
                  onClick={() => setLang('km')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition cursor-pointer ${lang === 'km' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  ខ្មែរ
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition cursor-pointer ${lang === 'en' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="pt-3.5 border-t border-slate-200/70 dark:border-slate-750 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2.5">
                  <Type className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'km' ? 'ទំហំអក្សរ (Font Size)' : 'Text / Font Size'}</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
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
