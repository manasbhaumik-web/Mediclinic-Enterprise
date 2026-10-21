import type { PanelId } from './types';
import { Building2, MapPin, Phone, Clock, ShieldCheck } from 'lucide-react';

interface ClinicDirectoryProps {
  showPanel: (id: PanelId) => boolean;
}

export default function ClinicDirectory({ showPanel }: ClinicDirectoryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* Clinic Facility & License Info (7 Cols) */}
      {showPanel('facility') && (
        <div className="lg:col-span-12 bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-line-subtle pb-4">
            <h3 className="type-card-title text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              Clinic Operating Information & Licensing
            </h3>
            <span className="text-2xs bg-surface border border-line-subtle text-slate-700 px-2.5 py-1 rounded-none font-mono font-bold">
              Reg #KKM-2026-SL-8902
            </span>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Location Address</strong>
                  <span className="leading-relaxed block">Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
                </div>
              </div>
    
              <div className="flex items-start gap-3 text-slate-600 pt-1">
                <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">24/7 Hotline & Ambulance</strong>
                  <span className="leading-relaxed block">+60 3-5510 8899 / emergency@mediclinic.my</span>
                </div>
              </div>
            </div>
    
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-line-subtle pt-4 md:pt-0 md:pl-6">
              <div className="flex items-start gap-3 text-slate-600">
                <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Operating Schedule</strong>
                  <span className="leading-relaxed block">Mon – Sun: 08:00 AM – 10:00 PM</span>
                  <span className="block text-2xs text-emerald-700 font-bold mt-1 uppercase tracking-wider">Open on Public Holidays</span>
                </div>
              </div>
    
              <div className="flex items-start gap-3 text-slate-600 pt-1">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Accreditation</strong>
                  <span className="leading-relaxed block">Malaysian Medical Council (MMC) & KKM PWA Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* On-Duty Clinician Roster (5 Cols) */}
    
    </div>
  );
}
