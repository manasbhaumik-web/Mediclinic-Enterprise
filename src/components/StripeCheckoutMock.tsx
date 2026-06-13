import React, { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

interface StripeCheckoutMockProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  invoiceId: string;
}

export default function StripeCheckoutMock({ amount, onSuccess, onCancel, invoiceId }: StripeCheckoutMockProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !name) return;

    setIsProcessing(true);
    
    // Simulate network delay for Stripe processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Auto-return after success
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xl max-w-md w-full mx-auto text-center animate-scaleUp">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Payment Successful</h3>
        <p className="text-slate-500 mt-2 text-sm">Your payment of <strong>RM{amount.toFixed(2)}</strong> has been processed securely.</p>
        <p className="text-xs text-slate-400 mt-4">Redirecting you back to your portal...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-w-md w-full mx-auto animate-fadeIn">
      {/* Stripe Header */}
      <div className="bg-[#635BFF] p-6 text-white flex flex-col justify-center items-center relative">
        <button 
          onClick={onCancel}
          className="absolute left-4 top-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="text-sm font-medium opacity-90 uppercase tracking-widest mt-1">
          Klinik Malaysia
        </div>
        <div className="text-3xl font-bold mt-2">
          RM {amount.toFixed(2)}
        </div>
        <div className="text-xs opacity-75 mt-1 font-mono">
          Ref: {invoiceId}
        </div>
      </div>

      {/* Checkout Form */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-slate-100 p-2 rounded-lg">
            <Lock className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase">Secure Stripe Checkout (Simulation)</span>
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] outline-none"
              placeholder="patient@example.com"
              required
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Card Information</label>
            <div className="border border-slate-300 rounded-md overflow-hidden flex flex-col">
              <div className="relative border-b border-slate-200">
                <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 pl-9 text-sm focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] outline-none"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              <div className="flex">
                <input 
                  type="text" 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-1/2 border-r border-slate-200 px-3 py-2 text-sm focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] outline-none"
                  placeholder="MM / YY"
                  maxLength={5}
                  required
                />
                <input 
                  type="text" 
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-1/2 px-3 py-2 text-sm focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] outline-none"
                  placeholder="CVC"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 mt-2">Name on card</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] outline-none"
              placeholder="Full Name"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full bg-[#635BFF] hover:bg-[#524BDE] text-white font-bold py-3 rounded-md transition-colors mt-6 flex justify-center items-center gap-2 disabled:opacity-75"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Pay RM {amount.toFixed(2)}</span>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Payments are securely encrypted</span>
        </div>
      </div>
    </div>
  );
}
