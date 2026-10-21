import React from 'react';
import { Star, Clock, Calendar } from 'lucide-react';

interface DoctorsSectionProps {
  isBM: boolean;
  setDoctorSpecialty: React.Dispatch<React.SetStateAction<string>>;
  doctorSpecialty: string;
  filteredDoctors: { id: string; name: string; title: string; role: string; specialty: string; bgColor: string; status: string; availabilityState: string; nextSlot: string; languages: string; queueCount: number; rating: number; experience: string; }[];
  openDoctorBooking: (doctorName: string) => void;
}

export default function DoctorsSection({ isBM, setDoctorSpecialty, doctorSpecialty, filteredDoctors, openDoctorBooking }: DoctorsSectionProps) {
  return (
    <section id="doctors" className="py-20 px-4 lg:px-8 bg-surface border-t border-line-subtle">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {isBM ? 'Staf Perubatan Bertauliah' : 'Resident Physicians'}
            </span>
            <h2 className="type-section-title-lg text-ink">
              {isBM ? 'Doktor Perubatan & Pakar Resident' : 'Resident Medical Doctors & Specialists'}
            </h2>
          </div>
    
          {/* Department Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold bg-surface-muted p-1.5 rounded-none border border-line-subtle">
            {['All', 'General Medicine', 'Pediatrics', 'Pharmacy'].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDoctorSpecialty(dept)}
                className={`min-h-[44px] px-3 py-1.5 rounded-none transition-colors cursor-pointer ${
                  doctorSpecialty === dept 
                    ? 'bg-primary text-white shadow-2xs' 
                    : 'text-slate-700 hover:text-ink'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
    
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="ice-mint-card-interactive p-6 text-center space-y-4 group relative">
              
              {/* Availability State Pill */}
              <div className="absolute top-4 right-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-none flex items-center justify-center gap-1 border bg-emerald-100 text-emerald-800 border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {doc.availabilityState}
                </span>
              </div>
    
              <div className={`w-20 h-20 rounded-none ${doc.bgColor} mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-md group-hover:scale-105 transition-transform border border-teal-600`}>
                {doc.id}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-amber-800 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{doc.rating} ({doc.experience})</span>
                </div>
                <h3 className="type-card-title-lg text-ink">{doc.name}</h3>
                <span className="text-xs text-accent font-semibold block">{doc.title}</span>
                <span className="text-xs text-slate-600 block pt-0.5">{doc.role}</span>
                <span className="text-xs text-slate-600 block">Languages: {doc.languages}</span>
              </div>
              
              {/* Live Slot Status Box */}
              <div className="p-3 bg-surface-accent border border-line rounded-none flex items-center justify-between text-xs font-bold text-slate-700 shadow-2xs">
                <span className="flex items-center gap-1.5 text-ink">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>{doc.nextSlot}</span>
                </span>
                <span className="font-mono text-accent bg-white px-2 py-0.5 border border-line-subtle text-xs">
                  {doc.queueCount} {isBM ? 'Menunggu' : 'Queued'}
                </span>
              </div>
    
              <button
                type="button"
                onClick={() => openDoctorBooking(doc.name)}
                className="w-full py-2.5 rounded-none bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs min-h-[44px]"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
              </button>
            </div>
          ))}
    
        </div>
    
      </div>
    </section>
  );
}
