import React, { useState, useMemo } from 'react';
import { Appointment, Patient } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { 
  Calendar, Clock, Plus, Search, User, Phone, CheckCircle2, 
  XCircle, AlertCircle, ChevronLeft, ChevronRight, Check, Activity, Filter
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  patientsList: Patient[];
  addAppointment: (app: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
}

export default function AppointmentCalendarModule({
  appointments,
  patientsList,
  addAppointment,
  updateAppointment
}: AppointmentCalendarProps) {
  // Configurable settings
  const [slotDuration, setSlotDuration] = useState(30); // minutes
  const clinicStartTime = 9; // 9 AM
  const clinicEndTime = 18; // 6 PM
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState<Date | null>(null);
  const [modalForm, setModalForm] = useState({
    patientName: '',
    patientPhone: '',
    patientId: '',
    purpose: '',
    notes: ''
  });
  
  // Weekly View logic
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  
  // Generate Time Slots for selected day
  const timeSlots = useMemo(() => {
    const slots = [];
    const totalMinutes = (clinicEndTime - clinicStartTime) * 60;
    const numSlots = totalMinutes / slotDuration;
    
    let baseTime = setMinutes(setHours(currentDate, clinicStartTime), 0);
    
    for (let i = 0; i < numSlots; i++) {
      slots.push(new Date(baseTime));
      baseTime = new Date(baseTime.getTime() + slotDuration * 60000);
    }
    return slots;
  }, [currentDate, slotDuration]);

  // Filter appointments for the currently selected day
  const todayAppointments = useMemo(() => {
    return appointments.filter(app => isSameDay(parseISO(app.appointmentTime), currentDate));
  }, [appointments, currentDate]);

  const scheduledCount = todayAppointments.filter(a => a.status === 'Scheduled').length;
  const completedCount = todayAppointments.filter(a => a.status === 'Completed').length;
  const totalBooked = todayAppointments.length;

  const handleOpenModal = (time: Date) => {
    setSelectedSlotTime(time);
    setModalForm({
      patientName: '',
      patientPhone: '',
      patientId: '',
      purpose: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotTime) return;
    
    await addAppointment({
      patientName: modalForm.patientName,
      patientPhone: modalForm.patientPhone,
      patientId: modalForm.patientId || undefined,
      appointmentTime: selectedSlotTime.toISOString(),
      durationMinutes: slotDuration,
      purpose: modalForm.purpose,
      status: 'Scheduled',
      notes: modalForm.notes
    });
    
    setIsModalOpen(false);
  };

  const handleStatusChange = async (id: string, status: 'Completed' | 'Cancelled' | 'No-Show') => {
    await updateAppointment(id, { status });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Controls Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-muted dark:bg-night-850 p-4 rounded-none shadow-xs border border-line-subtle dark:border-teal-800/40">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-primary/10 dark:bg-teal-900/40 border border-brand/20 flex items-center justify-center rounded-none">
            <Calendar className="w-5 h-5 text-accent dark:text-teal-300" />
          </div>
          <div>
            <h2 className="type-section-title text-ink dark:text-teal-300">Appointment Scheduler</h2>
            <p className="text-xs text-accent dark:text-teal-300 font-mono font-medium">Manage clinical slots, consultation bookings, and queue statuses</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3.5 py-2 rounded-none transition-colors shadow-xs uppercase tracking-wider font-mono flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Today
          </button>
          
          <div className="flex items-center justify-center bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/50 rounded-none p-0.5">
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-1.5 hover:bg-surface-accent dark:hover:bg-night-800 text-accent dark:text-teal-300 rounded-none transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono text-ink dark:text-teal-300 px-3 min-w-[120px] text-center uppercase tracking-wider">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-1.5 hover:bg-surface-accent dark:hover:bg-night-800 text-accent dark:text-teal-300 rounded-none transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/50 px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-accent dark:text-teal-300" />
            <select 
              value={slotDuration} 
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="border-none bg-transparent text-xs font-bold font-mono text-ink dark:text-teal-300 outline-none cursor-pointer pr-1"
            >
              <option value={15} className="dark:bg-night-900">15 Min Slots</option>
              <option value={30} className="dark:bg-night-900">30 Min Slots</option>
              <option value={60} className="dark:bg-night-900">1 Hour Slots</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Week Day Picker & Daily Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line-subtle dark:border-teal-800/40 pb-2">
              <h3 className="type-label text-accent dark:text-teal-300 font-mono">This Week</h3>
              <span className="text-2xs font-mono font-bold text-accent bg-primary/10 dark:bg-teal-900/40 px-1.5 py-0.5 rounded-none">
                {format(startOfCurrentWeek, 'MMM d')} - {format(addDays(startOfCurrentWeek, 6), 'MMM d')}
              </span>
            </div>

            <div className="space-y-1.5">
              {weekDays.map(day => {
                const isSelected = isSameDay(day, currentDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setCurrentDate(day)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-none text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-primary text-white border-brand shadow-xs' 
                        : 'bg-surface dark:bg-night-900 text-ink dark:text-slate-200 border-line-subtle dark:border-teal-800/30 hover:bg-surface-accent dark:hover:bg-night-800'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className={`w-2 h-2 rounded-none ${isToday ? (isSelected ? 'bg-white' : 'bg-primary dark:bg-teal-300') : 'bg-transparent'}`} />
                      <span>{format(day, 'EEEE')}</span>
                    </span>
                    <span className={`font-mono text-2xs ${isSelected ? 'text-teal-100' : 'text-accent dark:text-teal-400'}`}>
                      {format(day, 'MMM d')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Quick Stats Card */}
          <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none p-4 space-y-3 shadow-xs">
            <h4 className="type-label text-accent dark:text-teal-300 font-mono border-b border-line-subtle dark:border-teal-800/40 pb-2">Day Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/30 p-2.5 rounded-none">
                <span className="block text-xl font-bold font-mono text-ink dark:text-teal-300">{totalBooked}</span>
                <span className="text-2xs font-bold uppercase tracking-wider text-accent dark:text-teal-300 font-mono">Booked</span>
              </div>
              <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/30 p-2.5 rounded-none">
                <span className="block text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{completedCount}</span>
                <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-mono">Completed</span>
              </div>
            </div>
            <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/30 p-2 rounded-none flex justify-between items-center px-3">
              <span className="text-xs font-bold text-accent dark:text-teal-300">Pending Slots:</span>
              <span className="font-mono font-bold text-xs text-accent dark:text-teal-300">{timeSlots.length - totalBooked} Available</span>
            </div>
          </div>
        </div>

        {/* Right Main Area: Time Slots for Selected Day */}
        <div className="lg:col-span-3">
          <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none shadow-xs min-h-[600px] flex flex-col">
            
            {/* Header bar */}
            <div className="bg-surface-accent/60 dark:bg-night-900 border-b border-line-subtle dark:border-teal-800/40 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center justify-center gap-2.5">
                <h3 className="type-heading-caps text-ink dark:text-teal-300 font-mono">
                  {format(currentDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                {isSameDay(currentDate, new Date()) && (
                  <span className="bg-primary text-white text-2xs font-bold uppercase px-2 py-0.5 rounded-none font-mono tracking-wider">
                    Today
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-accent dark:text-teal-300 flex items-center justify-center gap-2">
                <Activity className="w-3.5 h-3.5 text-accent dark:text-teal-300" />
                <span>{timeSlots.length} Slots ({slotDuration}m interval)</span>
              </div>
            </div>

            {/* Time Slot List */}
            <div className="p-4 space-y-3.5 flex-1">
              {timeSlots.map(time => {
                // Find if an appointment exists for this slot
                const appointment = todayAppointments.find(a => {
                  const aTime = parseISO(a.appointmentTime);
                  return aTime.getTime() >= time.getTime() && aTime.getTime() < time.getTime() + slotDuration * 60000;
                });

                if (appointment) {
                  return (
                    <div key={time.toISOString()} className="flex items-stretch gap-3 group">
                      <div className="w-20 sm:w-24 text-right pr-2 pt-3 shrink-0">
                        <span className="font-mono text-xs font-bold text-accent dark:text-teal-300 block">
                          {format(time, 'hh:mm a')}
                        </span>
                      </div>
                      
                      <div className={`flex-1 rounded-none p-4 border transition-all relative ${
                        appointment.status === 'Cancelled' ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 border-l-4 border-l-rose-500 opacity-75' :
                        appointment.status === 'Completed' ? 'bg-slate-50 dark:bg-night-950 border-slate-200 dark:border-teal-900/40 border-l-4 border-l-slate-400 opacity-85' :
                        appointment.status === 'No-Show' ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 border-l-4 border-l-amber-500' :
                        'bg-surface dark:bg-night-900 border-brand/30 dark:border-teal-700/50 border-l-4 border-l-brand shadow-2xs'
                      }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                          <div>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <h4 className="type-card-title text-ink dark:text-teal-300">
                                {appointment.patientName}
                              </h4>
                              {appointment.patientId && (
                                <span className="bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 text-2xs font-bold px-1.5 py-0.5 rounded-none uppercase font-mono border border-brand/20">
                                  Reg # {appointment.patientId}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-accent dark:text-teal-300 flex items-center justify-center gap-4 mt-1 font-mono">
                              <span className="flex items-center justify-center gap-1"><Phone className="w-3 h-3 text-accent dark:text-teal-300" /> {appointment.patientPhone}</span>
                              <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3 text-accent dark:text-teal-300" /> {appointment.durationMinutes} min</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center gap-2">
                            <span className={`text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-none font-mono border ${
                              appointment.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                              appointment.status === 'Cancelled' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                              appointment.status === 'No-Show' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                              'bg-white dark:bg-night-850 text-accent dark:text-teal-300 border-line-subtle dark:border-teal-800/40'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>

                        {appointment.purpose && (
                          <p className="text-xs text-ink dark:text-slate-200 font-medium bg-surface-muted/60 dark:bg-night-850/60 p-2 border border-line-subtle/50 dark:border-teal-800/30 rounded-none mt-2">
                            <span className="font-bold text-accent dark:text-teal-300 uppercase text-2xs font-mono mr-1">Purpose:</span>
                            {appointment.purpose}
                          </p>
                        )}
                        
                        {/* Action Status Controls for Scheduled */}
                        {appointment.status === 'Scheduled' && (
                          <div className="mt-3 pt-2.5 border-t border-line-subtle dark:border-teal-800/30 flex flex-wrap gap-2">
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'Completed')} 
                              className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 text-xs font-bold px-3 py-1.5 rounded-none flex items-center justify-center gap-1 transition-colors font-mono"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Arrived
                            </button>
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'No-Show')} 
                              className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 text-xs font-bold px-3 py-1.5 rounded-none flex items-center justify-center gap-1 transition-colors font-mono"
                            >
                              <AlertCircle className="w-3.5 h-3.5" /> No-Show
                            </button>
                            <button 
                              onClick={() => handleStatusChange(appointment.id, 'Cancelled')} 
                              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 text-xs font-bold px-3 py-1.5 rounded-none flex items-center justify-center gap-1 transition-colors font-mono"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel Slot
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Empty Slot Button
                return (
                  <div key={time.toISOString()} className="flex items-center justify-center gap-3 group">
                    <div className="w-20 sm:w-24 text-right pr-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-accent/70 dark:text-teal-400/60 group-hover:text-accent transition-colors">
                        {format(time, 'hh:mm a')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <button 
                        onClick={() => handleOpenModal(time)}
                        className="w-full h-11 border border-dashed border-line dark:border-teal-800/50 bg-surface/60 dark:bg-night-900/40 rounded-none flex items-center justify-center text-accent dark:text-teal-300 hover:bg-surface-accent dark:hover:bg-night-800 hover:border-brand hover:text-accent transition-all group/btn"
                      >
                        <Plus className="w-4 h-4 mr-1.5 text-accent dark:text-teal-300 transition-transform group-hover/btn:scale-110" />
                        <span className="text-xs font-bold uppercase tracking-wider font-mono">Book Slot</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && selectedSlotTime && (
        <div className="fixed inset-0 bg-night-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/60 rounded-none shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-5 border-b border-line-subtle dark:border-teal-800/40 bg-surface-muted dark:bg-night-850 flex justify-between items-center">
              <div>
                <h3 className="type-section-title text-ink dark:text-teal-300">Book New Appointment</h3>
                <p className="text-xs text-accent dark:text-teal-300 font-bold font-mono mt-0.5">
                  {format(selectedSlotTime, 'EEEE, MMMM d, yyyy • hh:mm a')}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-accent dark:text-teal-400 hover:text-accent dark:hover:text-teal-300 transition-colors p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-mono">
                  Patient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.patientName}
                  onChange={e => setModalForm({...modalForm, patientName: e.target.value})}
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface-muted dark:bg-night-850 border border-line dark:border-teal-800/60 rounded-none px-3.5 py-2.5 text-xs text-ink dark:text-slate-100 font-medium focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-mono">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.patientPhone}
                  onChange={e => setModalForm({...modalForm, patientPhone: e.target.value})}
                  placeholder="e.g. +60123456789"
                  className="w-full bg-surface-muted dark:bg-night-850 border border-line dark:border-teal-800/60 rounded-none px-3.5 py-2.5 text-xs text-ink dark:text-slate-100 font-mono focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-mono">
                  Purpose of Visit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.purpose}
                  onChange={e => setModalForm({...modalForm, purpose: e.target.value})}
                  placeholder="e.g. Regular Checkup, Fever, Follow-up"
                  className="w-full bg-surface-muted dark:bg-night-850 border border-line dark:border-teal-800/60 rounded-none px-3.5 py-2.5 text-xs text-ink dark:text-slate-100 font-medium focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-mono">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-surface-muted dark:bg-night-850 border border-line dark:border-teal-800/60 rounded-none px-3.5 py-2.5 text-xs text-ink dark:text-slate-100 font-medium focus:border-brand focus:outline-none resize-none"
                  value={modalForm.notes}
                  onChange={e => setModalForm({...modalForm, notes: e.target.value})}
                  placeholder="Optional clinical notes or symptoms..."
                />
              </div>

              <div className="pt-4 flex gap-2.5 justify-end border-t border-line-subtle dark:border-teal-800/40">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-surface-muted dark:bg-night-850 hover:bg-surface-accent text-accent dark:text-teal-300 border border-line dark:border-teal-800/50 font-bold text-xs px-4 py-2 rounded-none transition-colors uppercase font-mono"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-none transition-colors shadow-xs uppercase font-mono"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

