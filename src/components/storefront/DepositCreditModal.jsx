import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, CheckCircle2, QrCode, CreditCard, DollarSign, 
  ArrowRight, Landmark, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DepositCreditModal = ({ isOpen, onClose }) => {
  const { 
    lang, 
    formatPrice, 
    formatDualPrice,
    depositCredit,
    showToast
  } = useStore();

  const [amount, setAmount] = useState('10.00');
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Input/Pay, 2: Success Receipt
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });

  if (!isOpen) return null;

  const presets = ['5.00', '10.00', '20.00', '50.00', '100.00'];

  const handlePresetSelect = (val) => {
    setAmount(val);
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount) || floatAmount <= 0) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ!' : 'Please enter a valid amount!', 'error');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      depositCredit(floatAmount);
      setIsProcessing(false);
      setStep(2);
      
      // Trigger confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error(err);
      }

      showToast(
        lang === 'km' 
          ? `បញ្ចូលទឹកប្រាក់ $${floatAmount.toFixed(2)} ជោគជ័យ!` 
          : `Deposited $${floatAmount.toFixed(2)} successfully!`, 
        'success'
      );
    }, 1500);
  };

  const handleClose = () => {
    setStep(1);
    setAmount('10.00');
    setCardData({ number: '', expiry: '', cvv: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
              {lang === 'km' ? 'បញ្ចូលលុយទៅកាបូប V8' : 'Deposit V8 Credit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Secure Wallet Recharge</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh] space-y-5">
          {step === 1 ? (
            <form onSubmit={handleDepositSubmit} className="space-y-5">
              
              {/* Amount Inputs */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {lang === 'km' ? 'ចំនួនទឹកប្រាក់ត្រូវបញ្ចូល' : 'Deposit Amount'}
                </label>
                
                {/* Preset Chips */}
                <div className="grid grid-cols-5 gap-1.5">
                  {presets.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePresetSelect(val)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                        amount === val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ${parseInt(val)}
                    </button>
                  ))}
                </div>

                {/* Custom Amount input */}
                <div className="relative mt-2">
                  <div className="absolute left-3 top-3.5 text-slate-400 font-mono font-bold">$</div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full pl-8 pr-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 outline-none transition-all font-mono"
                  />
                  <div className="absolute right-3 top-3.5 text-[10px] text-slate-400 font-mono">
                    ≈ {formatDualPrice(parseFloat(amount) || 0).khr}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {lang === 'km' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('khqr')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'khqr'
                        ? 'border-rose-600 bg-rose-50/50 text-rose-700 ring-2 ring-rose-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-rose-600" />
                    <span className="text-[10px]">ABA KHQR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px]">Credit Card</span>
                  </button>
                </div>
              </div>

              {/* ABA KHQR Code Generation */}
              {paymentMethod === 'khqr' && (
                <div className="bg-rose-500 text-white rounded-2xl p-4 text-center space-y-3.5 animate-fade-in shadow-md">
                  <div className="bg-white p-3.5 rounded-xl inline-block shadow-inner mx-auto">
                    {/* Simulated dynamic QR code with exact amount */}
                    <div className="w-40 h-40 border border-slate-200 flex flex-col items-center justify-center p-2 relative bg-white">
                      <div className="absolute top-1 left-1 bg-rose-600 text-white text-[7px] font-bold px-1 rounded">KHQR</div>
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded">
                        <QrCode className="w-24 h-24 text-slate-850 animate-pulse" />
                        <span className="text-[9px] font-bold text-slate-700 font-mono mt-1">${parseFloat(amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-black flex items-center justify-center space-x-1.5">
                      <Landmark className="w-4 h-4" />
                      <span>ABA PAY KHQR Code</span>
                    </p>
                    <p className="text-[11px] text-rose-100">
                      Scan this KHQR with your ABA Mobile app to complete deposit instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Credit Card inputs */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-350 dark:border-slate-700 rounded-xl font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Expiry</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-350 dark:border-slate-700 rounded-xl font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-350 dark:border-slate-700 rounded-xl font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition active:scale-98 cursor-pointer"
              >
                <span>{isProcessing ? 'Processing Payment...' : (lang === 'km' ? `💳 បញ្ជាក់ការទូទាត់ $${parseFloat(amount || 0).toFixed(2)}` : `💳 Confirm Recharge $${parseFloat(amount || 0).toFixed(2)}`)}</span>
                {!isProcessing && <ArrowRight className="w-4 h-4" />}
              </button>

            </form>
          ) : (
            
            // Step 2: Success Receipt
            <div className="space-y-6 text-center animate-fade-in py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {lang === 'km' ? 'បញ្ចូលទឹកប្រាក់ជោគជ័យ' : 'Recharge Successful'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your V8 Wallet credit has been updated.
                </p>
              </div>

              {/* Receipt Details */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl p-5 text-left text-xs space-y-3 font-mono text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-bold text-slate-900 dark:text-white">TXN-{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-bold uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-750 pb-2">
                  <span>Date:</span>
                  <span className="font-bold">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-black text-slate-900 dark:text-white">
                  <span>Amount Recharge:</span>
                  <span className="text-emerald-600">${parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-slate-900 dark:bg-slate-850 hover:bg-slate-850 text-white font-bold text-sm rounded-2xl shadow-md transition cursor-pointer"
              >
                {lang === 'km' ? 'រួចរាល់' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
