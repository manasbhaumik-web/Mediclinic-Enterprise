import React, { useState } from 'react';
import { Activity, ShieldCheck, Database, ArrowRight, HeartPulse, Smartphone, X, FileText, Pill, ChevronRight, Stethoscope, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingModuleProps {
  onNavigate: (view: 'login') => void;
}

export default function LandingModule({ onNavigate }: LandingModuleProps) {
  const [showPatientPortal, setShowPatientPortal] = useState(false);
  const [patientIc, setPatientIc] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    // Simulate login delay
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsLoggedIn(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900 overflow-x-hidden selection:bg-cyan-100 selection:text-cyan-900">
      
      {/* Minimalist Header */}
      <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#07B2B2] p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#058A8A] tracking-tight uppercase leading-none">
                MediClinic
              </h1>
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                Enterprise OS
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowPatientPortal(true)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Patient Portal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="bg-[#058A8A] hover:bg-[#047171] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm shadow-[#058A8A]/20 cursor-pointer"
            >
              Staff Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 pt-32 pb-20 w-full gap-16 relative z-10">
        
        {/* Left Content (Typography focused) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex-1 space-y-8 text-center lg:text-left max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            System v1.1.2
          </div>

          <h2 className="text-5xl md:text-7xl font-black text-[#058A8A] tracking-tighter leading-[1.05]">
            Clinical Excellence, <br/>
            <span className="text-slate-400 font-medium">Simplified.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium">
            An intelligent, end-to-end medical suite. Seamlessly manage patient queues, EMRs, billing, and national health syncs with an interface that gets out of your way.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto bg-[#058A8A] hover:bg-[#047171] text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-xl shadow-[#058A8A]/20 flex items-center justify-center gap-2 cursor-pointer group"
            >
              Access Clinical Suite
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => setShowPatientPortal(true)}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-base font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
              Patient Portal
            </button>
          </div>
          
          <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-slate-400">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> ISO 27001</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> PDPA Compliant</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> MOH NIDCS Sync</span>
          </div>
        </motion.div>

        {/* Right Graphic - Sharp, Crisp Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="flex-1 w-full max-w-lg relative"
        >
          {/* Main Solid Panel */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Live Overview</p>
                <h3 className="text-2xl font-black text-[#058A8A] tracking-tight">Active Queue</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#07B2B2]" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-cyan-50/50 rounded-2xl p-4 flex items-center gap-4 border border-cyan-100 group hover:border-[#07B2B2]/30 transition-colors cursor-default">
                <div className="bg-white p-3 rounded-xl border border-cyan-200 shadow-sm text-[#07B2B2] transition-colors"><Users className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-[#058A8A]">12 Patients Waiting</p>
                  <p className="text-xs text-slate-500 font-medium">Avg wait time: 14 mins</p>
                </div>
              </div>
              
              <div className="bg-cyan-50/50 rounded-2xl p-4 flex items-center gap-4 border border-cyan-100 group hover:border-[#07B2B2]/30 transition-colors cursor-default">
                <div className="bg-white p-3 rounded-xl border border-cyan-200 shadow-sm text-[#07B2B2] transition-colors"><Stethoscope className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-[#058A8A]">Dr. Sarah Jenkins</p>
                  <p className="text-xs text-slate-500 font-medium">Consulting Room 1</p>
                </div>
              </div>

              <div className="bg-cyan-50/50 rounded-2xl p-4 flex items-center gap-4 border border-cyan-100 group hover:border-[#07B2B2]/30 transition-colors cursor-default">
                <div className="bg-white p-3 rounded-xl border border-cyan-200 shadow-sm text-[#07B2B2] transition-colors"><FileText className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-[#058A8A]">Billing & Reports</p>
                  <p className="text-xs text-slate-500 font-medium">All queues synced to server</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Feature Grid - Clean and Minimal */}
      <div className="max-w-7xl mx-auto px-6 pb-24 w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: HeartPulse,
              title: 'Integrated Care',
              desc: 'Intelligent EMR templates, auto-ICD-10 tagging, and cross-department alerts.'
            },
            {
              icon: ShieldCheck,
              title: 'Uncompromised Security',
              desc: 'Bank-grade encryption protocols and full compliance with PDPA frameworks.'
            },
            {
              icon: Database,
              title: 'Centralized Records',
              desc: 'Seamless automated sync with national health boards and insurance claims.'
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
            >
              <div className={`w-12 h-12 bg-cyan-50 group-hover:bg-[#07B2B2] transition-colors duration-300 rounded-xl flex items-center justify-center mb-6 text-[#058A8A] group-hover:text-white`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#058A8A] mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 text-center mt-auto">
        <div className="flex flex-col items-center gap-2">
          <Activity className="w-6 h-6 text-slate-300" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} MediClinic Enterprise OS
          </p>
        </div>
      </footer>

      {/* Patient Portal Modal - Crisp Minimal Overlay */}
      {showPatientPortal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => {
              setShowPatientPortal(false);
              setIsLoggedIn(false);
              setPatientIc('');
            }}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 relative z-10 flex flex-col max-h-[90vh]"
          >
            <div className="p-8 pb-6 relative border-b border-slate-50">
              <button 
                onClick={() => {
                  setShowPatientPortal(false);
                  setIsLoggedIn(false);
                  setPatientIc('');
                }} 
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full p-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-2xl font-black text-[#07B2B2] tracking-tight">
                Patient Portal
              </h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Verify your identity to access records.</p>
            </div>

            {!isLoggedIn ? (
              <form onSubmit={handlePatientLogin} className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                    MyKad / IC Number
                  </label>
                  <input 
                    type="text" 
                    required
                    value={patientIc}
                    onChange={(e) => setPatientIc(e.target.value)}
                    placeholder="e.g. 900101-14-5555"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono text-lg transition-all placeholder:text-slate-400"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-[#058A8A] hover:bg-[#047171] text-white rounded-xl font-bold text-base shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 group"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Verify Identity
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Authenticated As</p>
                    <p className="text-base font-black text-[#07B2B2]">Mock Patient Data</p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest px-1">Recent Documents</h3>
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 transition-colors group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#07B2B2]" />
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#07B2B2]">Medical Certificate</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono font-semibold">10 May 2026</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3 font-medium pl-2">Issued for 2 days. Valid until 12 May.</p>
                    <span className="text-slate-900 text-xs font-bold uppercase tracking-wider pl-2 flex items-center gap-1">Download PDF <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 transition-colors group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-800" />
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#07B2B2]">Prescription Refill</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono font-semibold">10 May 2026</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3 font-medium pl-2">Amoxicillin 250mg, Paracetamol 500mg</p>
                    <span className="text-slate-900 text-xs font-bold uppercase tracking-wider pl-2 flex items-center gap-1">Request <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
