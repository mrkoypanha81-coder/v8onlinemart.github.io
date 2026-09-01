import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Users, Plus, Trash2, Edit2, Shield, Phone, 
  Search, X, Key, ShieldAlert, ShieldCheck, Eye, EyeOff, Sparkles
} from 'lucide-react';

export const MemberManagement = () => {
  const { 
    members = [], 
    addMember, 
    updateMember, 
    deleteMember, 
    lang 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  
  // Granular permissions checkboxes
  const [permOverview, setPermOverview] = useState(false);
  const [permInventory, setPermInventory] = useState(false);
  const [permOrders, setPermOrders] = useState(false);
  const [permDeliveries, setPermDeliveries] = useState(false);
  const [permBanners, setPermBanners] = useState(false);
  const [permNotifications, setPermNotifications] = useState(false);
  const [permCustomers, setPermCustomers] = useState(false);
  const [permMembers, setPermMembers] = useState(false);
  
  const [error, setError] = useState('');
  const [showPins, setShowPins] = useState({}); // toggle PIN visibility for individual rows

  // Filter members based on search query
  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    return (m.name || '').toLowerCase().includes(q) || (m.phone || '').includes(q);
  });

  // Role counters based on granular permissions
  const totalCount = members.length;
  const overviewAccessCount = members.filter(m => m.permissions?.overview).length;
  const inventoryAccessCount = members.filter(m => m.permissions?.inventory).length;
  const ordersAccessCount = members.filter(m => m.permissions?.orders).length;
  const deliveriesAccessCount = members.filter(m => m.permissions?.deliveries).length;

  const resetForm = () => {
    setName('');
    setPhone('');
    setPin('');
    setPermOverview(false);
    setPermInventory(false);
    setPermOrders(false);
    setPermDeliveries(false);
    setPermBanners(false);
    setPermNotifications(false);
    setPermCustomers(false);
    setPermMembers(false);
    setError('');
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setName(member.name);
    setPhone(member.phone);
    setPin(member.pin);
    
    const p = member.permissions || {};
    setPermOverview(!!p.overview);
    setPermInventory(!!p.inventory);
    setPermOrders(!!p.orders);
    setPermDeliveries(!!p.deliveries);
    setPermBanners(!!p.banners);
    setPermNotifications(!!p.notifications);
    setPermCustomers(!!p.customers);
    setPermMembers(!!p.members);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះបុគ្គលិក!' : 'Please enter full name!');
      return;
    }
    if (!phone.trim()) {
      setError(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter phone number!');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setError(lang === 'km' ? 'លេខកូដ PIN ត្រូវតែមានយ៉ាងតិច ៤ខ្ទង់!' : 'PIN must be at least 4 digits!');
      return;
    }
    if (!permOverview && !permInventory && !permOrders && !permDeliveries && !permBanners && !permNotifications && !permCustomers && !permMembers) {
      setError(lang === 'km' ? 'សូមជ្រើសរើសមុខងារចូលប្រើប្រាស់យ៉ាងហោចណាស់មួយ!' : 'Please select at least one UI access privilege!');
      return;
    }

    const memberData = {
      name: name.trim(),
      phone: phone.trim().replace(/\s+/g, ''),
      pin: pin.trim(),
      permissions: {
        overview: permOverview,
        inventory: permInventory,
        orders: permOrders,
        deliveries: permDeliveries,
        banners: permBanners,
        notifications: permNotifications,
        customers: permCustomers,
        members: permMembers
      }
    };

    if (editingMember) {
      updateMember({
        ...editingMember,
        ...memberData
      });
    } else {
      // Check duplicate phone
      const duplicate = members.some(m => m.phone.replace(/\s+/g, '') === memberData.phone);
      if (duplicate) {
        setError(lang === 'km' ? 'លេខទូរស័ព្ទនេះមានរួចហើយ!' : 'Phone number already exists!');
        return;
      }
      addMember(memberData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (memberId) => {
    const confirmMsg = lang === 'km' 
      ? 'តើអ្នកពិតជាចង់លុបគណនីបុគ្គលិកនេះមែនទេ?' 
      : 'Are you sure you want to delete this member?';
    if (window.confirm(confirmMsg)) {
      deleteMember(memberId);
    }
  };

  const togglePinVisibility = (id) => {
    setShowPins(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Stats Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="space-y-1 text-left">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'km' ? 'ការគ្រប់គ្រងគណនីសមាជិក / បុគ្គលិក' : 'Member & Staff Management'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'km' ? 'បង្កើតគណនីបុគ្គលិក និងកំណត់សិទ្ធិចូលប្រើប្រាស់មុខងារផ្សេងៗ' : 'Create member accounts and assign layout access privileges'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-5 py-3 rounded-2xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'km' ? 'បន្ថែមសមាជិកថ្មី' : 'Add New Member'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-soft text-left">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{lang === 'km' ? 'សមាជិកសរុប' : 'Total Members'}</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{totalCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-soft border-l-4 border-l-rose-500 text-left">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{lang === 'km' ? 'សិទ្ធិមើលស្តុក (Inventory)' : 'Inventory Access'}</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">{inventoryAccessCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-soft border-l-4 border-l-orange-500 text-left">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{lang === 'km' ? 'សិទ្ធិមើលការបញ្ជាទិញ (Orders)' : 'Orders Access'}</div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono mt-1">{ordersAccessCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-soft border-l-4 border-l-blue-500 text-left">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{lang === 'km' ? 'សិទ្ធិមើលការដឹក (Delivery)' : 'Delivery Tracker Access'}</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">{deliveriesAccessCount}</div>
        </div>
      </div>

      {/* 2. Control Row: Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft p-4 flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'km' ? 'ស្វែងរកឈ្មោះ ឬលេខទូរស័ព្ទ...' : 'Search by name or phone...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-600 transition"
          />
        </div>
      </div>

      {/* 3. Members List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-355 font-black uppercase text-xs border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-4 px-5 whitespace-nowrap">ID</th>
                <th className="py-4 px-5 whitespace-nowrap">{lang === 'km' ? 'ឈ្មោះ' : 'Member Name'}</th>
                <th className="py-4 px-5 whitespace-nowrap">{lang === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</th>
                <th className="py-4 px-5 whitespace-nowrap">{lang === 'km' ? 'លេខកូដ PIN' : 'Security PIN'}</th>
                <th className="py-4 px-5 whitespace-nowrap">{lang === 'km' ? 'តួនាទី / សិទ្ធិប្រើប្រាស់' : 'Assigned UI Permissions'}</th>
                <th className="py-4 px-5 whitespace-nowrap text-right">{lang === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-250">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-medium">
                    {lang === 'km' ? 'រកមិនឃើញគណនីបុគ្គលិកទេ' : 'No member accounts found'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4.5 px-5 font-mono text-xs text-slate-500 font-bold whitespace-nowrap">
                      {member.id}
                    </td>
                    <td className="py-4.5 px-5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {member.name}
                    </td>
                    <td className="py-4.5 px-5 font-mono font-bold whitespace-nowrap">
                      {member.phone}
                    </td>
                    <td className="py-4.5 px-5 whitespace-nowrap">
                      <div className="flex items-center space-x-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>{showPins[member.id] ? member.pin : '••••'}</span>
                        <button 
                          onClick={() => togglePinVisibility(member.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showPins[member.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4.5 px-5">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {member.permissions?.overview && (
                          <span className="bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Overview
                          </span>
                        )}
                        {member.permissions?.inventory && (
                          <span className="bg-rose-100 dark:bg-rose-950/70 text-rose-705 dark:text-rose-300 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Inventory
                          </span>
                        )}
                        {member.permissions?.orders && (
                          <span className="bg-orange-105 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Orders
                          </span>
                        )}
                        {member.permissions?.deliveries && (
                          <span className="bg-blue-105 dark:bg-blue-950/70 text-blue-705 dark:text-blue-355 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Delivery Tracker
                          </span>
                        )}
                        {member.permissions?.banners && (
                          <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Banners
                          </span>
                        )}
                        {member.permissions?.notifications && (
                          <span className="bg-purple-100 dark:bg-purple-950/70 text-purple-705 dark:text-purple-300 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Notifications
                          </span>
                        )}
                        {member.permissions?.customers && (
                          <span className="bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            Customers
                          </span>
                        )}
                        {member.permissions?.members && (
                          <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center space-x-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            <span>Members</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="p-2 text-slate-455 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 text-slate-455 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add / Edit Member Modal Container */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-slate-900 dark:text-slate-105">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-white">
                  {editingMember 
                    ? (lang === 'km' ? 'កែប្រែគណនីបុគ្គលិក' : 'Edit Member Details') 
                    : (lang === 'km' ? 'បន្ថែមបុគ្គលិកថ្មី' : 'Create Staff Member')
                  }
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-455 dark:text-rose-400 text-xs flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-350">{lang === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sokha Chan"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-355 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>{lang === 'km' ? 'លេខទូរស័ព្ទ (Phone)' : 'Phone Number'}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012345678"
                  disabled={!!editingMember}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 transition disabled:opacity-50"
                />
              </div>

              {/* Security PIN */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-355 flex items-center">
                  <Key className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>{lang === 'km' ? 'លេខកូដ PIN ចូលប្រព័ន្ធ' : 'Login security PIN'}</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 transition font-mono tracking-widest"
                />
              </div>

              {/* Granular Checkbox Roles */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-left">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1">
                  {lang === 'km' ? 'កំណត់មុខងារ UI ប្រើប្រាស់ (Checkboxes):' : 'Configure UI Feature Access:'}
                </label>
                
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                  
                  {/* Overview Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permOverview}
                      onChange={(e) => setPermOverview(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'ទិដ្ឋភាពរួម' : 'Overview'}
                      </span>
                    </div>
                  </label>

                  {/* Inventory Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permInventory}
                      onChange={(e) => setPermInventory(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'ស្តុក & Expire' : 'Inventory'}
                      </span>
                    </div>
                  </label>

                  {/* Orders Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permOrders}
                      onChange={(e) => setPermOrders(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'ការបញ្ជាទិញ' : 'Orders'}
                      </span>
                    </div>
                  </label>

                  {/* Delivery Tracker Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permDeliveries}
                      onChange={(e) => setPermDeliveries(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'តាមដានការដឹក' : 'Delivery Tracker'}
                      </span>
                    </div>
                  </label>

                  {/* Banners Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permBanners}
                      onChange={(e) => setPermBanners(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'ផ្ទាំងផ្សាយ' : 'Banners'}
                      </span>
                    </div>
                  </label>

                  {/* Notifications Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permNotifications}
                      onChange={(e) => setPermNotifications(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
                      </span>
                    </div>
                  </label>

                  {/* Customers Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permCustomers}
                      onChange={(e) => setPermCustomers(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'អតិថិជន' : 'Customers'}
                      </span>
                    </div>
                  </label>

                  {/* Members Checkbox */}
                  <label className="flex items-center space-x-2.5 cursor-pointer group py-1.5 px-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-xl transition">
                    <input
                      type="checkbox"
                      checked={permMembers}
                      onChange={(e) => setPermMembers(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-750 focus:ring-emerald-500 bg-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-255 group-hover:text-emerald-500 transition block">
                        {lang === 'km' ? 'សមាជិក / បុគ្គលិក' : 'Members'}
                      </span>
                    </div>
                  </label>

                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  {editingMember 
                    ? (lang === 'km' ? 'រក្សាទុក' : 'Save Changes') 
                    : (lang === 'km' ? 'បង្កើតថ្មី' : 'Create Account')
                  }
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
