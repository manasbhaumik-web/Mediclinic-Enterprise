

interface BenefitsSectionProps {
  isBM: boolean;
}

export default function BenefitsSection({ isBM }: BenefitsSectionProps) {
  return (
    <section className="py-16 px-4 lg:px-8 bg-surface">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            {isBM ? 'Kelebihan Utama' : 'Why Patients Choose Us'}
          </span>
          <h2 className="type-section-title-lg text-ink">
            {isBM ? 'Penjagaan Kesihatan Berfokuskan Pesakit' : 'Patient-Centered Healthcare Experience'}
          </h2>
          <p className="text-muted text-xs sm:text-sm">
            {isBM ? 'Empat keutamaan kami untuk memastikan rawatan anda mudah, pantas dan tenang.' : 'Four key benefits designed to make your medical visit swift, stress-free, and accessible.'}
          </p>
        </div>
    
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="type-card-title-lg text-ink">
              {isBM ? 'Pendaftaran MyKad Pantas' : 'Fast MyKad check-in'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {isBM 
                ? 'Imbasan cip MyKad dalam 5 saat tanpa sebarang borang manual yang leceh.' 
                : 'Instant 5-second chip scan populates your details without tedious paper forms.'
              }
            </p>
          </div>
    
          <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="type-card-title-lg text-ink">
              {isBM ? 'Farmasi Setempat' : 'On-site pharmacy'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {isBM 
                ? 'Pengambilan ubat berdaftar KKM yang disahkan kod bar secara terus di klinik.' 
                : 'KKM-registered medication dispensed right after your doctor consultation.'
              }
            </p>
          </div>
    
          <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="type-card-title-lg text-ink">
              {isBM ? 'Panel Insurans Tanpa Tunai' : 'Cashless panel billing'}
            </h3>
            <p className="text-xs text-ink text-xs text-muted leading-relaxed">
              {isBM 
                ? 'Tuntutan e-GL terus dengan PMCare, MiCare, HealthMetrics dan 150+ panel.' 
                : 'Direct e-GL authorization with PMCare, MiCare, Petronas, and 150+ panels.'
              }
            </p>
          </div>
    
          <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="type-card-title-lg text-ink">
              {isBM ? 'Akses Perubatan 24/7' : '24/7 access'}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {isBM 
                ? 'Pintu klinik sentiasa terbuka 24 jam sehari untuk sebarang kecemasan ringan.' 
                : 'Always open 24 hours a day, 7 days a week for general & urgent medical needs.'
              }
            </p>
          </div>
    
        </div>
    
      </div>
    </section>
  );
}
