import React from 'react';
import { Stethoscope, ChevronRight, CreditCard, Heart, ShieldAlert, Phone } from 'lucide-react';

interface QuickTasksSectionProps {
  isBM: boolean;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openDoctorBooking: (doctorName: string) => void;
}

export default function QuickTasksSection({ isBM, setIsBookingOpen, openDoctorBooking }: QuickTasksSectionProps) {
  return (
    <section className="py-12 px-4 lg:px-8 bg-surface-muted border-b border-line-subtle">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            {isBM ? 'Bantuan Pantas Pesakit' : 'How Can We Help You Today?'}
          </span>
          <h2 className="type-section-title-lg text-ink">
            {isBM ? 'Pilih Perkhidmatan Kesihatan Anda' : 'Select Your Quick Service Task'}
          </h2>
        </div>
    
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Task Card 1 */}
          <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-brand hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-none bg-surface-accent text-accent flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="type-card-title-lg text-ink group-hover:text-accent transition-colors">
                {isBM ? 'Jumpa Doktor Outpatient' : 'See a doctor'}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isBM ? 'Walk-in terus 24 jam atau tempah masa konsultasi awal.' : 'Walk in anytime 24/7 or schedule your consultation time.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="w-full py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
    
          {/* Task Card 2 */}
          <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-brand hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="type-card-title-lg text-ink group-hover:text-emerald-700 transition-colors">
                {isBM ? 'Semak Insurans / Panel' : 'Check panel coverage'}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isBM ? 'Sahkan kelayakan kad panel korporat tanpa tunai anda.' : 'Verify your cashless corporate panel card & e-GL eligibility.'}
              </p>
            </div>
            <a
              href="#panels"
              className="w-full py-2 px-3 bg-surface-accent hover:bg-surface-strong text-accent border border-line font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <span>{isBM ? 'Semak Panel' : 'Check panel coverage'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
    
          {/* Task Card 3 */}
          <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-sky-600 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-none bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="type-card-title-lg text-ink group-hover:text-sky-600 transition-colors">
                {isBM ? 'Pediatrik & Imunisasi' : 'Child vaccination'}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isBM ? 'Pemeriksaan bayi & suntikan imunisasi KKM berjadual.' : 'Gentle pediatric care & KKM scheduled child vaccinations.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openDoctorBooking('Dr. Michael Wong')}
              className="w-full py-2 px-3 bg-primary hover:bg-primary text-white font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <span>{isBM ? 'Pediatrik' : 'Book paediatrics'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
    
          {/* Task Card 4 */}
          <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-rose-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-none bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="type-card-title-lg text-ink group-hover:text-rose-600 transition-colors">
                {isBM ? 'Kecemasan Ringan 24/7' : 'Urgent minor injuries'}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isBM ? 'Jahitan luka, rawatan lecuran & nebulizer asma serta-merta.' : '24/7 acute wound suturing, dressings & asthma nebulization.'}
              </p>
              <p className="text-xs text-rose-800 font-semibold">
                {isBM ? 'Mengancam nyawa? ' : 'Life-threatening? '}
                <a href="tel:999" className="underline underline-offset-2 font-bold inline-block py-3.5 -my-3.5">{isBM ? 'Hubungi 999' : 'Call 999'}</a>
              </p>
            </div>
            <a
              href="tel:+60355108899"
              className="w-full py-2.5 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isBM ? 'Hubungi Klinik (Rawatan Segera)' : 'Call clinic (urgent care)'}</span>
            </a>
          </div>
    
        </div>
      </div>
    </section>
  );
}
