import type { PanelId } from './types';
import { Building2, MapPin, Phone, Clock, ShieldCheck } from 'lucide-react';

interface ClinicDirectoryProps {
  showPanel: (id: PanelId) => boolean;
}

export default function ClinicDirectory({ showPanel }: ClinicDirectoryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      {/* Clinic Facility & License Info (12 Cols) */}
      {showPanel('facility') && (
        <div className="lg:col-span-12 bg-surface border border-line rounded-none p-3.5 shadow-none space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <h3 className="type-card-title text-strong flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-indigo-600" />
              Clinic Operating Information & Licensing
            </h3>
            <span className="text-2xs bg-surface-muted border border-line text-muted px-2.5 py-1 rounded-none font-mono font-bold tracking-wider uppercase">
              Reg #KKM-2026-SL-8902
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 text-muted">
                <MapPin className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-strong font-bold mb-0.5 font-mono uppercase tracking-wider text-2xs">Location Address</strong>
                  <span className="leading-relaxed block text-ink">Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-muted pt-1">
                <Phone className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-strong font-bold mb-0.5 font-mono uppercase tracking-wider text-2xs">24/7 Hotline & Emergency Ambulance</strong>
                  <span className="leading-relaxed block font-mono tabular-nums text-ink">+60 3-5510 8899 / emergency@mediclinic.my</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-line-subtle pt-4 md:pt-0 md:pl-6">
              <div className="flex items-start gap-3 text-muted">
                <Clock className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-strong font-bold mb-0.5 font-mono uppercase tracking-wider text-2xs">Operating Schedule</strong>
                  <span className="leading-relaxed block font-mono tabular-nums text-ink">Mon – Sun: 08:00 AM – 10:00 PM</span>
                  <span className="inline-block text-2xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 mt-1 uppercase tracking-wider">
                    Open on Public Holidays
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-muted pt-1">
                <ShieldCheck className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-strong font-bold mb-0.5 font-mono uppercase tracking-wider text-2xs">Accreditation & Regulatory Compliance</strong>
                  <span className="leading-relaxed block text-ink">Malaysian Medical Council (MMC) & KKM Private Healthcare Facilities Act (PWA) Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
