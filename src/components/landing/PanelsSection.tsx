import React from 'react';
import { Search, CreditCard, ShieldCheck, Info, CheckCircle2, MapPin, Car, Bus, AlertTriangle } from 'lucide-react';

interface PanelsSectionProps {
  isBM: boolean;
  panelSearch: string;
  setPanelSearch: React.Dispatch<React.SetStateAction<string>>;
  filteredPanels: string[];
  setSelectedPanelCheck: React.Dispatch<React.SetStateAction<string>>;
  selectedPanelCheck: string;
  tpaPanels: string[];
  panelEmpId: string;
  setPanelEmpId: React.Dispatch<React.SetStateAction<string>>;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PanelsSection({ isBM, panelSearch, setPanelSearch, filteredPanels, setSelectedPanelCheck, selectedPanelCheck, tpaPanels, panelEmpId, setPanelEmpId, setIsBookingOpen }: PanelsSectionProps) {
  return (
    <section id="panels" className="py-16 px-4 lg:px-8 bg-surface-muted border-t border-line-subtle">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Panel Search & Eligibility Checker */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    {isBM ? 'Perlindungan Insurans Korporat' : 'Cashless Corporate Panel Coverage'}
                  </span>
                  <h3 className="type-card-title-lg text-ink">
                    {isBM ? 'Panel TPA & Insurans Diterima' : 'Search Supported Corporate Panels'}
                  </h3>
                </div>
    
                {/* Panel Search Input */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={isBM ? 'Cari nama panel...' : 'Search panel...'}
                    value={panelSearch}
                    onChange={e => setPanelSearch(e.target.value)}
                    className="w-full pl-9.5 pr-3.5 py-2.5 rounded-none bg-surface border border-line-subtle text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
    
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-bold">
                {filteredPanels.map((panel, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => setSelectedPanelCheck(panel)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-none border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                      selectedPanelCheck === panel 
                        ? 'bg-primary text-white border-brand' 
                        : 'bg-surface border-line-subtle text-slate-700 hover:border-brand hover:text-accent'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{panel}</span>
                  </button>
                ))}
                {filteredPanels.length === 0 && (
                  <div className="text-slate-600 text-xs py-2">No matching corporate panel found.</div>
                )}
              </div>
            </div>
    
            {/* Panel Checker Box */}
            <div className="bg-surface border border-line-subtle rounded-none p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-line-subtle pb-3">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-accent" /> {isBM ? 'Semakan Panel' : 'Panel Eligibility Check'}
                </span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  DEMO CHECKER
                </span>
              </div>
    
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    {isBM ? 'Pilih Panel TPA' : 'Selected TPA Panel'}
                  </label>
                  <select
                    value={selectedPanelCheck}
                    onChange={e => setSelectedPanelCheck(e.target.value)}
                    className="w-full p-2.5 rounded-none bg-surface-accent border border-line text-xs font-bold text-ink focus:outline-none"
                  >
                    {tpaPanels.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
    
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    {isBM ? 'No. Staff / Kad Pengenalan' : 'Staff / IC Reference ID'}
                  </label>
                  <input
                    type="text"
                    value={panelEmpId}
                    onChange={e => setPanelEmpId(e.target.value)}
                    placeholder="Enter Staff ID..."
                    className="w-full p-2.5 rounded-none bg-surface-muted border border-line-subtle text-xs font-mono font-bold text-ink focus:outline-none"
                  />
                </div>
    
                <div className="p-3 bg-surface-accent border border-line rounded-none space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Consultation Coverage:</span>
                    <span className="font-bold text-emerald-700">100% Cashless</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Medication Allowance:</span>
                    <span className="font-bold text-accent">RM 250 / Visit</span>
                  </div>
                </div>
    
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-none transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                </button>
              </div>
            </div>
    
          </div>
        </div>
    
        {/* Practical Info: What to Bring & Travel Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* What to bring */}
          <div className="bg-surface border border-line-subtle p-6 rounded-none space-y-4">
            <h3 className="type-card-title-lg text-ink flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              <span>{isBM ? 'Dokumen Perlu Dibawa' : 'What to Bring for Your Visit'}</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>MyKad / MyKid / Passport:</strong> Required for identity verification and fast check-in.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>Corporate Panel Card / e-GL:</strong> Digital Guarantee Letter via TPA app or physical panel card.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>Current Medications / Prescriptions:</strong> Helps doctor cross-check drug interactions.</span>
              </li>
            </ul>
          </div>
    
          {/* Travel Context & Parking */}
          <div className="bg-surface border border-line-subtle p-6 rounded-none space-y-4" id="location">
            <h3 className="type-card-title-lg text-ink flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span>{isBM ? 'Lokasi & Kemudahan Parkir' : 'Location & Transport Access'}</span>
            </h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <p>
                <strong>Address:</strong> Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor.
              </p>
              <div className="flex items-start gap-2">
                <Car className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>Parking:</strong> Underground visitor parking at Bays A &amp; B (First 1 hr free for patients).</span>
              </div>
              <div className="flex items-start gap-2">
                <Bus className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span><strong>Public Transit:</strong> 5 mins taxi from LRT Glenmarie / KTM Shah Alam station.</span>
              </div>
              <p className="text-xs text-slate-600 pt-1 font-semibold">
                Serving patients across Shah Alam, Subang Jaya, Puchong, Klang, and surrounding Klang Valley areas.
              </p>
            </div>
          </div>
    
        </div>
    
        {/* Emergency Safety Warning Callout */}
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-none flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-amber-950 uppercase text-xs tracking-wider">
              {isBM ? 'AMARAN KECEMASAN SERIUS' : 'CRITICAL EMERGENCY SAFETY NOTICE'}
            </strong>
            <span>
              {isBM 
                ? 'Bagi kecemasan yang mengancam nyawa (seperti sakit dada teruk, trauma berat, atau tidak sedarkan diri), sila hubungi 999 atau pergi ke Jabatan Kecemasan Hospital terdekat dengan segera.' 
                : 'For severe life-threatening emergencies (e.g. severe chest pain, major physical trauma, loss of consciousness), please call 999 or proceed immediately to the nearest hospital Emergency Department rather than using online booking.'
              }
            </span>
          </div>
        </div>
    
      </div>
    </section>
  );
}
