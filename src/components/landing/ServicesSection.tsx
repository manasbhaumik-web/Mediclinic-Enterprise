import React from 'react';
import { Activity, Stethoscope, CheckCircle2, Calendar, Pill, Heart, CreditCard, Clock, Phone } from 'lucide-react';

interface ServicesSectionProps {
  isBM: boolean;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ServicesSection({ isBM, setIsBookingOpen }: ServicesSectionProps) {
  return (
    <section id="services" className="py-20 px-4 lg:px-8 bg-surface-muted border-t border-line-subtle">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent bg-surface-accent px-3.5 py-1 rounded-full border border-line-subtle">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span>{isBM ? 'Perkhidmatan Perubatan Outpatient' : 'Comprehensive Outpatient Services'}</span>
            </span>
            <h2 className="type-section-title-lg text-ink">
              {isBM ? 'Rawatan Perubatan & Pakar Kami' : 'Doctor Consultations & Urgent Care'}
            </h2>
            <p className="text-muted text-xs sm:text-sm leading-relaxed">
              {isBM 
                ? 'Menyediakan rawatan am, pesakit luar, penjagaan kanak-kanak, pemeriksaan kesihatan korporat, dan prosedur kecemasan ringan 24 jam.'
                : 'Delivering expert general practice, pediatric care, corporate health screenings, and round-the-clock minor emergency procedures.'
              }
            </p>
          </div>
        </div>
    
        {/* Asymmetric Bento Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* FEATURED HERO CARD (Spans 7 Cols on Desktop) */}
          <div className="lg:col-span-7 bg-surface border border-line rounded-none p-7 shadow-xs space-y-6 relative overflow-hidden group hover:border-brand transition-all">
            <div className="h-1 bg-primary absolute top-0 left-0 right-0" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-none bg-primary text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent block">
                    {isBM ? 'Suite Konsultasi Utama' : 'Primary Consultation Suite'}
                  </span>
                  <h3 className="type-card-title-lg text-ink group-hover:text-accent transition-colors">
                    {isBM ? 'Konsultasi Doktor Am' : 'General practice consultations'}
                  </h3>
                </div>
              </div>
    
              <span className="hidden sm:inline-flex items-center justify-center gap-1.5 text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Suite 101 Active
              </span>
            </div>
    
            <p className="text-xs text-muted leading-relaxed font-normal relative z-10">
              {isBM 
                ? 'Diagnosis dan rawatan penyakit harian, serta penjagaan berterusan untuk penyakit kronik, oleh doktor berdaftar MMC.'
                : 'Diagnosis and treatment for everyday illnesses, plus ongoing care for long-term conditions, by MMC-registered doctors.'
              }
            </p>
    
            {/* Key Clinical Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10 text-xs font-semibold text-strong">
              <div className="flex items-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>{isBM ? 'Demam Akut & Selsema Viral' : 'Acute Fever & Viral Flu'}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>{isBM ? 'Kawalan Darah Tinggi & Kencing Manis' : 'Hypertension & Diabetes Care'}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>{isBM ? 'Batuk, Selsema & Sakit Tekak' : 'Cough, Cold & Sore Throat'}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>{isBM ? 'Masalah Perut & Gastrik' : 'Stomach & Gastric Complaints'}</span>
              </div>
            </div>
    
            {/* Action Footer */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-line relative z-10">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="px-5 py-2.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                <Calendar className="w-4 h-4" />
                <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
              </button>
            </div>
    
          </div>
    
          {/* CARD 2: PHARMACY (Spans 5 Cols) */}
          <div className="lg:col-span-5 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-brand hover:shadow-md transition-all group relative overflow-hidden">
            <div className="h-1 bg-primary absolute top-0 left-0 right-0" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-none border border-emerald-200">
                  KKM Approved
                </span>
              </div>
    
              <div className="space-y-1.5">
                <h3 className="type-card-title-lg text-ink group-hover:text-emerald-700 transition-colors">
                  {isBM ? 'Farmasi & Dispensari Bekalan Ubat' : 'On-Site Pharmacy & Dispensing'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {isBM 
                    ? 'Farmasi berlesen dengan bekalan ubat sah KKM, semakan alahan ubat automatik, dan ubat khas kanak-kanak.' 
                    : 'Licensed dispensary supplying KKM-approved pharmaceuticals, automated antibiotic fulfillment, and child allergy checks.'
                  }
                </p>
              </div>
            </div>
          </div>
    
          {/* CARD 3: PEDIATRICS (Spans 4 Cols) */}
          <div className="lg:col-span-4 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-sky-600 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="h-1 bg-sky-600 absolute top-0 left-0 right-0" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-none border border-sky-200">
                  Child Friendly
                </span>
              </div>
    
              <div className="space-y-1.5">
                <h3 className="type-card-title-lg text-ink group-hover:text-sky-600 transition-colors">
                  {isBM ? 'Pediatrik & Imunisasi Kanak-Kanak' : 'Child Vaccination & Paediatrics'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {isBM 
                    ? 'Rawatan mesra kanak-kanak, pemantauan tumbesaran, dan jadual suntikan vaksin imunisasi KKM.' 
                    : 'Gentle healthcare for infants and children, growth tracking, and mandatory KKM childhood vaccination schedules.'
                  }
                </p>
              </div>
            </div>
          </div>
    
          {/* CARD 4: CORPORATE PANEL (Spans 4 Cols) */}
          <div className="lg:col-span-4 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-teal-600 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="h-1 bg-teal-600 absolute top-0 left-0 right-0" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-none border border-teal-200">
                  150+ Panels
                </span>
              </div>
    
              <div className="space-y-1.5">
                <h3 className="type-card-title-lg text-ink group-hover:text-teal-700 transition-colors">
                  {isBM ? 'Semak Insurans Panel Tanpa Tunai' : 'Check your cashless medical coverage'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {isBM 
                    ? 'Tuntutan bil tanpa tunai untuk PMCare, MiCare, HealthMetrics, Petronas, dan Maybank dengan e-GL serta-merta.' 
                    : 'Cashless medical billing for PMCare, MiCare, HealthMetrics, Petronas, and Maybank staff with real-time e-GL dispatch.'
                  }
                </p>
              </div>
            </div>
          </div>
    
          {/* CARD 5: HEALTH SCREENING (Spans 4 Cols) */}
          <div className="lg:col-span-4 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-brand hover:shadow-md transition-all group relative overflow-hidden">
            <div className="h-1 bg-primary absolute top-0 left-0 right-0" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-surface-accent border border-line-subtle flex items-center justify-center text-accent shadow-2xs group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-none border border-teal-200">
                  Full Profiling
                </span>
              </div>
    
              <div className="space-y-1.5">
                <h3 className="type-card-title-lg text-ink group-hover:text-accent transition-colors">
                  {isBM ? 'Pemeriksaan Kesihatan Eksekutif' : 'Executive Health Screening'}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {isBM 
                    ? 'Ujian darah penuh, ECG jantung 12-lead, profil kolesterol, dan ujian fungsi buah pinggang & hati.' 
                    : 'Full-body blood profiling, 12-lead ECG cardiac screening, lipid panels, and kidney/liver functionality testing.'
                  }
                </p>
              </div>
            </div>
          </div>
    
          {/* CARD 6: 24/7 EMERGENCY & SURGERY (Spans Full Width 12 Cols Banner) */}
          <div className="lg:col-span-12 bg-rose-50/90 border border-rose-200 rounded-none p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 hover:border-rose-400 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-none border border-rose-200">
                    24/7 Urgent Care
                  </span>
                </div>
                <h3 className="type-card-title-lg text-ink">
                  {isBM ? 'Rawatan Kecemasan 24 Jam & Pembedahan Kecil' : '24-Hour Urgent Care & Minor Surgical Procedures'}
                </h3>
                <p className="text-xs text-muted max-w-2xl leading-relaxed">
                  {isBM 
                    ? 'Penjagaan serta-merta untuk jahitan luka kecederaan, cuci lecuran, nebulizer asma, dan suntikan kancing gigi.' 
                    : 'Immediate care for acute wound suturing, burn dressing, abscess drainage, asthma nebulization, foreign body removal, and tetanus prophylaxis.'
                  }
                </p>
              </div>
            </div>
    
            <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0 w-full md:w-auto">
              <a
                href="tel:+60355108899"
                className="w-full md:w-auto px-6 py-3 rounded-none bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                <Phone className="w-4 h-4" />
                <span>{isBM ? 'Hubungi Klinik: +60 3-5510 8899' : 'Call clinic: +60 3-5510 8899'}</span>
              </a>
              <span className="text-xs text-rose-800 font-semibold text-center md:text-right">
                {isBM ? 'Mengancam nyawa? ' : 'Life-threatening? '}
                <a href="tel:999" className="underline underline-offset-2 font-bold inline-block py-3.5 -my-3.5">{isBM ? 'Hubungi 999' : 'Call 999'}</a>
              </span>
            </div>
          </div>
    
        </div>
    
      </div>
    </section>
  );
}
