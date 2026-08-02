import React, { useState, useMemo } from 'react';
import { Appointment, Patient } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { 
  Calendar, Clock, Plus, Search, User, Phone, CheckCircle2, 
  XCircle, AlertCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';

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
  // Configurable settings (Admin could change these later)
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
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-teal-600" />
          <h2 className="text-xl font-extrabold text-slate-800">Appointment Calendar</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-1.5 hover:bg-slate-200 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm font-bold text-slate-700 px-3 w-32 text-center">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-1.5 hover:bg-slate-200 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <select 
            value={slotDuration} 
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 px-2 py-2"
          >
            <option value={15}>15 Min Slots</option>
            <option value={30}>30 Min Slots</option>
            <option value={60}>1 Hour Slots</option>
          </select>
        </div>
      </div>

      {/* Main Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Week Picker & Overview */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="bg-slate-50 py-3">
              <h3 className="text-sm font-bold text-slate-700">This Week</h3>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1">
                {weekDays.map(day => {
                  const isSelected = isSameDay(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setCurrentDate(day)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all ${
                        isSelected ? 'bg-teal-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isToday ? (isSelected ? 'bg-white' : 'bg-teal-500') : 'bg-transparent'}`} />
                        {format(day, 'EEEE')}
                      </span>
                      <span className={isSelected ? 'text-teal-100' : 'text-slate-400'}>
                        {format(day, 'MMM d')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Area: Time Slots for Selected Day */}
        <div className="lg:col-span-3">
          <Card className="min-h-[600px]">
            <CardHeader className="bg-white border-b py-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {format(currentDate, 'EEEE, MMMM d, yyyy')}
                {isSameDay(currentDate, new Date()) && (
                  <span className="bg-teal-100 text-teal-800 text-[10px] uppercase px-2 py-0.5 rounded-full ml-2">Today</span>
                )}
              </h3>
            </CardHeader>
            <div className="p-4 space-y-3">
              {timeSlots.map(time => {
                // Find if an appointment exists for this exact slot
                const appointment = todayAppointments.find(a => {
                  const aTime = parseISO(a.appointmentTime);
                  // Allow matching if the appointment starts within this slot's duration
                  return aTime.getTime() >= time.getTime() && aTime.getTime() < time.getTime() + slotDuration * 60000;
                });

                if (appointment) {
                  return (
                    <div key={time.toISOString()} className="flex items-stretch gap-4 group">
                      <div className="w-20 text-right pt-2 shrink-0">
                        <span className="text-xs font-bold text-slate-500">{format(time, 'h:mm a')}</span>
                      </div>
                      <div className={`flex-1 rounded-xl p-4 border shadow-sm transition-all relative ${
                        appointment.status === 'Cancelled' ? 'bg-red-50 border-red-100 opacity-60' :
                        appointment.status === 'Completed' ? 'bg-slate-100 border-slate-200 opacity-70' :
                        appointment.status === 'No-Show' ? 'bg-orange-50 border-orange-200' :
                        'bg-teal-50 border-teal-200 shadow-[0_4px_12px_rgba(13,148,136,0.1)]'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              {appointment.patientName}
                              {appointment.patientId && (
                                <span className="bg-teal-100 text-teal-800 text-[9px] px-1.5 py-0.5 rounded uppercase">Registered</span>
                              )}
                            </h4>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {appointment.patientPhone}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {appointment.durationMinutes} min</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-1 rounded shadow-sm">
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 font-medium">{appointment.purpose}</p>
                        
                        {/* Actions (Only show if Scheduled) */}
                        {appointment.status === 'Scheduled' && (
                          <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStatusChange(appointment.id, 'Completed')} className="bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Arrived
                            </button>
                            <button onClick={() => handleStatusChange(appointment.id, 'No-Show')} className="bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors">
                              <AlertCircle className="w-3.5 h-3.5" /> No-Show
                            </button>
                            <button onClick={() => handleStatusChange(appointment.id, 'Cancelled')} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Empty Slot
                return (
                  <div key={time.toISOString()} className="flex items-center gap-4 group">
                    <div className="w-20 text-right shrink-0">
                      <span className="text-xs font-bold text-slate-400">{format(time, 'h:mm a')}</span>
                    </div>
                    <div className="flex-1">
                      <button 
                        onClick={() => handleOpenModal(time)}
                        className="w-full h-12 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-300 hover:shadow-sm transition-all"
                      >
                        <Plus className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Book Slot</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* New Appointment Modal */}
      {isModalOpen && selectedSlotTime && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Book Appointment</h3>
                <p className="text-xs text-teal-600 font-bold">{format(selectedSlotTime, 'EEEE, MMMM d • h:mm a')}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAppointment} className="p-6 space-y-4">
              <Input
                label="Patient Name"
                required
                value={modalForm.patientName}
                onChange={e => setModalForm({...modalForm, patientName: e.target.value})}
                placeholder="e.g. John Doe"
              />
              <Input
                label="Phone Number"
                required
                value={modalForm.patientPhone}
                onChange={e => setModalForm({...modalForm, patientPhone: e.target.value})}
                placeholder="e.g. +60123456789"
              />
              <Input
                label="Purpose of Visit"
                required
                value={modalForm.purpose}
                onChange={e => setModalForm({...modalForm, purpose: e.target.value})}
                placeholder="e.g. Medical Checkup, Follow-up"
              />
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Additional Notes</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none resize-none"
                  value={modalForm.notes}
                  onChange={e => setModalForm({...modalForm, notes: e.target.value})}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Confirm Booking</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
