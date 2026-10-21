import React from 'react';
import { Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BookingModalProps {
  isBM: boolean;
  selectedDoctor: string;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bookingSubmitted: boolean;
  bookingForm: { fullName: string; icNumber: string; phone: string; service: string; preferredDate: string; preferredTime: string; };
  resetBooking: () => void;
  handleBookingSubmit: (e: React.FormEvent<Element>) => void;
  setBookingForm: React.Dispatch<React.SetStateAction<{ fullName: string; icNumber: string; phone: string; service: string; preferredDate: string; preferredTime: string; }>>;
}

export default function BookingModal({ isBM, selectedDoctor, setIsBookingOpen, bookingSubmitted, bookingForm, resetBooking, handleBookingSubmit, setBookingForm }: BookingModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-line-subtle rounded-none max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-ink">
        
        <div className="flex items-center justify-between border-b border-line-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-surface-accent border border-line-subtle flex items-center justify-center text-accent">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="type-card-title-lg text-ink">
                {isBM ? 'Tempah Janji Temu Doktor' : 'Book Doctor Appointment'}
              </h3>
              {selectedDoctor && (
                <span className="text-xs text-accent font-semibold block">
                  Preferred: {selectedDoctor}
                </span>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsBookingOpen(false)}
            className="w-8 h-8 rounded-none bg-surface-accent text-slate-500 hover:text-ink flex items-center justify-center text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
    
        {bookingSubmitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-none bg-emerald-100 border border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="type-section-title text-ink">{isBM ? 'Janji Temu Disahkan!' : 'Appointment Reserved!'}</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              {isBM ? 'Terima kasih,' : 'Thank you,'} <strong className="text-accent">{bookingForm.fullName}</strong>. {isBM ? 'Rujukan giliran anda ialah' : 'Your queue reference is'} <strong className="text-mono font-bold text-amber-600">#APT-8902</strong>.
            </p>
            <div className="p-4 bg-surface-muted rounded-none border border-line-subtle text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <strong className="text-slate-800">{bookingForm.service}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <strong className="text-accent">{bookingForm.preferredDate || 'Today'} @ {bookingForm.preferredTime}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={resetBooking}
              className="px-6 py-2.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center min-h-[44px]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Full Patient Name *</label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                placeholder="e.g. Ahmad Firdaus Bin Ismail"
                value={bookingForm.fullName}
                onChange={e => setBookingForm({ ...bookingForm, fullName: e.target.value })}
              />
            </div>
    
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">MyKad IC Number *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink font-mono focus:outline-none focus:border-brand"
                  placeholder="YYMMDD-XX-XXXX"
                  value={bookingForm.icNumber}
                  onChange={e => setBookingForm({ ...bookingForm, icNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                  placeholder="+60 12-345 6789"
                  value={bookingForm.phone}
                  onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                />
              </div>
            </div>
    
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Medical Specialty *</label>
              <select
                className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                value={bookingForm.service}
                onChange={e => setBookingForm({ ...bookingForm, service: e.target.value })}
              >
                <option value="General Outpatient Consultation">General Outpatient Consultation</option>
                <option value="Pediatrics & Child Vaccination">Pediatrics &amp; Child Vaccination</option>
                <option value="Executive Health Screening">Executive Health Screening</option>
                <option value="Corporate Panel TPA Visit">Corporate Panel TPA Visit</option>
              </select>
            </div>
    
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Preferred Date</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                  value={bookingForm.preferredDate}
                  onChange={e => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Preferred Time</label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                  value={bookingForm.preferredTime}
                  onChange={e => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                  <option value="08:00 PM">08:00 PM</option>
                </select>
              </div>
            </div>
    
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Protected under Malaysia PDPA Act 2010.</span>
            </div>
    
            <button
              type="submit"
              className="w-full py-3.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-2 inline-flex items-center justify-center min-h-[44px]"
            >
              Confirm Appointment Booking
            </button>
          </form>
        )}
    
      </div>
    </div>
  );
}
