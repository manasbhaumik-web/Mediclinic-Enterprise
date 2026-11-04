import React, { useState, useMemo } from 'react';
import { useClinicDoctors } from '../../hooks/useClinicSetup';
import { useLanguage } from '../../context/LanguageContext';
import { doctorName as nameOfDoctor } from '../../domain/doctorAssignment';
import { formatNric } from '../../utils/nric';
import { Appointment, Patient, UserRole } from '../../types';
import { PageHeading, StatStrip } from '../../components/ui/StationChrome';
import { Clock, Plus, Phone, XCircle, ChevronLeft, ChevronRight, Globe, LogIn, ShieldAlert } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  patientsList: Patient[];
  addAppointment: (app: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  checkInAppointment: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  userRole?: UserRole;
  /** Opens another page; used to send a failed check-in to registration. */
  onNavigateTab?: (tab: string) => void;
}

export default function AppointmentCalendarModule({
  appointments,
  patientsList,
  addAppointment,
  updateAppointment,
  checkInAppointment,
  userRole,
  onNavigateTab
}: AppointmentCalendarProps) {
  const isAdmin = userRole === 'admin';
  const { activeLanguage, t } = useLanguage();
  const isBM = activeLanguage === 'BM';
  const doctors = useClinicDoctors();
  const doctorName = (id?: string) => nameOfDoctor(doctors, id);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const handleCheckIn = async (app: Appointment) => {
    setCheckingIn(app.id);
    const r = await checkInAppointment(app.id);
    setCheckingIn(null);
    setNotice('error' in r
      ? { tone: 'error', text: r.error }
      : { tone: 'ok', text: `${app.patientName} is checked in and waiting for triage.` });
  };
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
    patientIc: '',
    doctorId: '',
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
    if (isAdmin) return;
    setSelectedSlotTime(time);
    setModalForm({
      patientName: '',
      patientPhone: '',
      patientId: '',
      patientIc: '',
      doctorId: '',
      purpose: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotTime) return;

    // One live booking per doctor and start time (the database enforces the same rule).
    if (modalForm.doctorId && appointments.some((a) => a.status === 'Scheduled' && a.doctorId === modalForm.doctorId
        && new Date(a.appointmentTime).getTime() === selectedSlotTime.getTime())) {
      setNotice({ tone: 'error', text: `${doctorName(modalForm.doctorId) ?? 'That doctor'} already has a booking at ${format(selectedSlotTime, 'h:mm a')}. Choose another doctor or time.` });
      setIsModalOpen(false);
      return;
    }

    await addAppointment({
      doctorId: modalForm.doctorId || undefined,
      patientName: modalForm.patientName,
      patientPhone: modalForm.patientPhone,
      patientId: modalForm.patientId || undefined,
      patientIc: modalForm.patientIc || undefined,
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

  const onlineCount = todayAppointments.filter((a) => a.source === 'online').length;
  const openSlots = Math.max(0, timeSlots.length - totalBooked);
  const bookingsOn = (day: Date) => appointments.filter((a) => isSameDay(parseISO(a.appointmentTime), day)).length;
  const controlField = 'w-full min-h-11 px-3 bg-surface border border-line text-sm text-ink rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent';
  const labelClass = 'block text-xs font-semibold text-ink mb-1.5';

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeading eyebrow={isBM ? 'Meja hadapan' : 'Front desk'} title={isBM ? 'Temu janji' : 'Appointments'}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setCurrentDate(new Date())} className="btn-secondary min-h-11 px-4 text-sm">
            {isBM ? 'Hari ini' : 'Today'}
          </button>
          <div className="flex items-center border border-line bg-surface">
            <button type="button" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="w-11 h-11 flex items-center justify-center text-accent hover:bg-surface-strong cursor-pointer" aria-label={isBM ? 'Minggu sebelumnya' : 'Previous week'}>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="min-w-[7rem] text-center text-sm font-bold text-ink px-2">{format(currentDate, 'MMM yyyy')}</span>
            <button type="button" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="w-11 h-11 flex items-center justify-center text-accent hover:bg-surface-strong cursor-pointer" aria-label={isBM ? 'Minggu seterusnya' : 'Next week'}>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div role="group" aria-label={isBM ? 'Tempoh slot' : 'Slot length'} className="flex border border-line bg-surface">
            {([[15, '15 min'], [30, '30 min'], [60, isBM ? '1 jam' : '1 hour']] as [number, string][]).map(([mins, label], i) => (
              <button
                key={mins}
                type="button"
                aria-pressed={slotDuration === mins}
                onClick={() => setSlotDuration(mins)}
                className={`min-h-11 px-3.5 text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${i > 0 ? 'border-l border-line' : ''} ${slotDuration === mins ? 'bg-primary text-white font-bold' : 'text-muted font-semibold hover:bg-surface-strong hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </PageHeading>

      {isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 text-sm bg-surface-accent border border-line text-ink">
          <ShieldAlert className="w-4 h-4 shrink-0 text-accent" aria-hidden="true" />
          <span>
            {isBM
              ? 'Paparan Pentadbir: Jadual temu janji adalah untuk bacaan sahaja. Tempahan temu janji pesakit dikhaskan untuk kakitangan kaunter penyambut tetamu.'
              : 'Administrator notice: appointment scheduling is read-only. Clinical appointment bookings are reserved for front desk receptionists.'}
          </span>
        </div>
      )}

      {notice && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 px-4 py-3 text-sm font-medium border ${notice.tone === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100' : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100'}`}>
          <span>{notice.text}</span>
          <span className="flex items-center gap-3 shrink-0">
            {notice.tone === 'error' && /register|MyKad/i.test(notice.text) && onNavigateTab && userRole !== 'admin' && (
              <button type="button" onClick={() => onNavigateTab('registration')} className="font-bold underline cursor-pointer">{isBM ? 'Buka pendaftaran' : 'Open registration'}</button>
            )}
            <button type="button" onClick={() => setNotice(null)} className="font-bold underline cursor-pointer">{isBM ? 'Tutup' : 'Dismiss'}</button>
          </span>
        </div>
      )}

      <StatStrip
        label={isBM ? 'Ringkasan harian' : 'Day summary'}
        stats={[
          { label: isBM ? 'Ditempah' : 'Booked', value: totalBooked, note: isBM ? 'Temu janji hari ini' : 'Appointments today' },
          { label: isBM ? 'Selesai' : 'Completed', value: completedCount, note: isBM ? 'Sudah dilihat' : 'Seen and closed' },
          { label: isBM ? 'Slot kosong' : 'Open slots', value: openSlots, note: isBM ? 'Masih tersedia' : 'Still available' },
          { label: isBM ? 'Tempahan dalam talian' : 'Booked online', value: onlineCount, note: isBM ? 'Dari laman web klinik' : 'From the clinic website' },
        ]}
      />

      <section className="flex flex-wrap bg-surface border border-line">
        {/* DAY SCHEDULE */}
        <article className="flex-[999_1_36rem] min-w-0 flex flex-col" aria-labelledby="appointments-day">
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-line">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id="appointments-day" className="text-xl font-bold tracking-tight text-ink">{format(currentDate, 'EEEE, d MMMM yyyy')}</h2>
              {isSameDay(currentDate, new Date()) && <span className="px-2.5 py-0.5 bg-surface-strong text-accent text-xs font-bold">{isBM ? 'Hari ini' : 'Today'}</span>}
            </div>
            <span className="text-xs text-muted">{timeSlots.length} {isBM ? 'slot' : 'slots'} · {slotDuration} {isBM ? 'minit sela' : 'minute interval'}</span>
          </div>

          <div className="px-6 pt-4 pb-6 flex flex-col gap-3">
            {timeSlots.map((time) => {
              // Every booking that starts in this slot (different doctors can share a time)
              const slotAppointments = todayAppointments.filter((a) => {
                const aTime = parseISO(a.appointmentTime);
                return aTime.getTime() >= time.getTime() && aTime.getTime() < time.getTime() + slotDuration * 60000;
              });
              const hasBooking = slotAppointments.length > 0;

              return (
                <div key={time.toISOString()} className="flex gap-4 items-start">
                  <span className={`shrink-0 w-[4.5rem] pt-3.5 text-right text-sm font-bold tabular-nums ${hasBooking ? 'text-accent' : 'text-muted'}`}>
                    {format(time, 'hh:mm a')}
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {hasBooking ? slotAppointments.map((appointment) => (
                      <div key={appointment.id} className="border border-line bg-surface">
                        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-ink">{appointment.patientName}</span>
                              {doctorName(appointment.doctorId) && <span className="px-2 py-0.5 bg-surface-strong text-accent text-xs font-bold">{doctorName(appointment.doctorId)}</span>}
                              {appointment.source === 'online' && (
                                <span className="chip-info px-2 py-0.5 text-xs font-bold" title="Booked on the clinic website">
                                  <Globe className="w-3 h-3" aria-hidden="true" />Online{appointment.bookingRef ? ` · ${appointment.bookingRef}` : ''}
                                </span>
                              )}
                              {appointment.patientId && <span className="chip-brand px-2 py-0.5 text-xs font-bold">Reg # {appointment.patientId}</span>}
                            </div>
                            <p className="mt-1.5 text-sm text-muted flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums">
                              <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" aria-hidden="true" />{appointment.patientPhone}</span>
                              <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{appointment.durationMinutes} min</span>
                            </p>
                            {appointment.purpose && (
                              <p className="mt-2 text-sm leading-relaxed text-ink">
                                <strong className="text-accent">{isBM ? 'Tujuan' : 'Purpose'}</strong> {appointment.purpose}
                              </p>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-bold border ${
                            appointment.status === 'Completed' ? 'chip-ok' :
                            appointment.status === 'Cancelled' ? 'chip-danger' :
                            appointment.status === 'No-Show' ? 'chip-warn' :
                            'chip-brand'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>

                        {appointment.status === 'Scheduled' && (
                          <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-line-subtle bg-surface-muted">
                            <button type="button" onClick={() => void handleCheckIn(appointment)} disabled={checkingIn === appointment.id} className="btn-primary px-4 text-sm">
                              <LogIn className="w-4 h-4" aria-hidden="true" /> {checkingIn === appointment.id ? 'Checking in…' : 'Check in'}
                            </button>
                            <button type="button" onClick={() => handleStatusChange(appointment.id, 'No-Show')} className="btn-secondary px-4 text-sm">
                              {isBM ? 'Tandakan tidak hadir' : 'Mark no-show'}
                            </button>
                            <button type="button" onClick={() => handleStatusChange(appointment.id, 'Cancelled')} className="btn-secondary px-4 text-sm !text-rose-800 !border-rose-200">
                              {isBM ? 'Batal' : 'Cancel'}
                            </button>
                          </div>
                        )}
                      </div>
                    )) : isAdmin ? (
                      <div className="min-h-11 flex items-center px-4 text-sm text-muted border border-line-subtle bg-surface-muted">{isBM ? 'Slot tersedia' : 'Available slot'}</div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenModal(time)}
                        className="w-full min-h-11 border border-dashed border-line-strong bg-surface text-accent text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-accent hover:border-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        {isBM ? 'Tempah slot ini' : 'Book this slot'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* THIS WEEK */}
        <aside className="flex-[1_1_18rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="appointments-week-title">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 id="appointments-week-title" className="text-base font-bold text-ink">{isBM ? 'Minggu ini' : 'This week'}</h2>
            <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">
              {format(startOfCurrentWeek, 'd')} to {format(addDays(startOfCurrentWeek, 6), 'd MMM')}
            </span>
          </div>
          <ol>
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, currentDate);
              return (
                <li key={day.toISOString()}>
                  <button
                    type="button"
                    onClick={() => setCurrentDate(day)}
                    aria-current={isSelected ? 'date' : undefined}
                    className={`w-full min-h-11 px-5 flex items-center justify-between gap-2 text-left border-b border-line-subtle cursor-pointer transition-colors hover:bg-surface-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${isSelected ? 'bg-surface-accent shadow-[inset_3px_0_0_var(--color-primary)]' : ''}`}
                  >
                    <span className={`text-sm text-ink ${isSelected ? 'font-bold' : 'font-semibold'}`}>{format(day, 'EEEE')}</span>
                    <span className="flex items-center gap-2.5 text-xs text-muted tabular-nums">
                      {format(day, 'd MMM')}
                      <span className="min-w-7 px-1.5 py-0.5 text-center bg-surface-strong text-accent font-bold">{bookingsOn(day)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-auto px-5 py-4 border-t border-line text-xs text-muted leading-relaxed">
            {isBM ? 'Nombor ialah jumlah tempahan setiap hari.' : 'The number is how many bookings each day has.'}
          </p>
        </aside>
      </section>

      {/* New Appointment Modal */}
      {isModalOpen && selectedSlotTime && (
        <div role="dialog" aria-modal="true" aria-labelledby="new-appt-title" onKeyDown={(e) => { if (e.key === 'Escape') setIsModalOpen(false); }} className="fixed inset-0 bg-night-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-line max-w-xl w-full">
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-line">
              <div>
                <h2 id="new-appt-title" className="text-xl font-bold tracking-tight text-ink">{isBM ? 'Tempah temu janji' : 'Book an appointment'}</h2>
                <p className="mt-1 text-sm text-muted">{format(selectedSlotTime, 'EEEE, d MMMM yyyy')} · {format(selectedSlotTime, 'hh:mm a')}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="shrink-0 w-11 h-11 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-strong cursor-pointer" aria-label="Close booking dialog">
                <XCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="p-6 flex flex-col gap-5">
              <fieldset className="min-w-0">
                <legend className="pb-3 text-xs font-bold text-accent tracking-wide">{isBM ? 'Pesakit' : 'Patient'}</legend>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
                  <div className="col-span-full">
                    <label htmlFor="appt-patient-name" className={labelClass}>{isBM ? 'Nama pesakit' : 'Patient name'} <span className="text-rose-600">*</span></label>
                    <input id="appt-patient-name" type="text" required value={modalForm.patientName} onChange={(e) => setModalForm({ ...modalForm, patientName: e.target.value })} placeholder="e.g. John Doe" autoComplete="off" className={controlField} />
                  </div>
                  <div>
                    <label htmlFor="appt-patient-phone" className={labelClass}>{isBM ? 'No. telefon' : 'Phone number'} <span className="text-rose-600">*</span></label>
                    <input id="appt-patient-phone" type="text" required value={modalForm.patientPhone} onChange={(e) => setModalForm({ ...modalForm, patientPhone: e.target.value })} placeholder="e.g. +60123456789" autoComplete="off" className={`${controlField} tabular-nums`} />
                  </div>
                  <div>
                    <label htmlFor="appt-ic" className={labelClass}>{isBM ? 'No. MyKad' : 'MyKad number'}</label>
                    <input id="appt-ic" type="text" inputMode="numeric" value={modalForm.patientIc} onChange={(e) => setModalForm({ ...modalForm, patientIc: formatNric(e.target.value) })} placeholder="900101-14-5555" autoComplete="off" className={`${controlField} tabular-nums`} />
                    <p className="mt-1 text-xs text-muted">{isBM ? 'Diperlukan untuk mendaftar masuk pesakit.' : 'Needed to check the patient in.'}</p>
                  </div>
                </div>
              </fieldset>

              <fieldset className="min-w-0">
                <legend className="pb-3 text-xs font-bold text-accent tracking-wide">{isBM ? 'Lawatan' : 'Visit'}</legend>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="appt-doctor" className={labelClass}>{isBM ? 'Doktor' : 'Doctor'}</label>
                    <select id="appt-doctor" value={modalForm.doctorId} onChange={(e) => setModalForm({ ...modalForm, doctorId: e.target.value })} className={controlField}>
                      <option value="">{isBM ? 'Mana-mana doktor yang ada' : 'Any available doctor'}</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.department ? ` (${d.department})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="appt-purpose" className={labelClass}>{isBM ? 'Tujuan lawatan' : 'Purpose of visit'} <span className="text-rose-600">*</span></label>
                    <input id="appt-purpose" type="text" required value={modalForm.purpose} onChange={(e) => setModalForm({ ...modalForm, purpose: e.target.value })} placeholder="e.g. Regular check-up, fever, follow-up" autoComplete="off" className={controlField} />
                  </div>
                  <div>
                    <label htmlFor="appt-notes" className={labelClass}>{isBM ? 'Nota tambahan' : 'Additional notes'}</label>
                    <textarea id="appt-notes" rows={3} value={modalForm.notes} onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })} placeholder="Optional clinical notes or symptoms" className="w-full px-3 py-2.5 bg-surface border border-line text-sm leading-normal text-ink rounded-none outline-none resize-y focus:border-brand focus:ring-2 focus:ring-accent" />
                  </div>
                </div>
              </fieldset>

              <div className="flex flex-wrap justify-end gap-3 pt-5 border-t border-line">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary min-h-12 px-5 text-sm">{isBM ? 'Batal' : 'Cancel'}</button>
                <button type="submit" className="btn-primary min-h-12 px-6 text-sm">{isBM ? 'Sahkan tempahan' : 'Confirm booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
