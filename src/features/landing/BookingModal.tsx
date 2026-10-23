import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react';
import {
  BOOKING_SERVICES, BookingErrors, bookableDays, dayLabel, groupSlots, slotLabel, validateBookingDetails, whenLabel,
} from '../../domain/booking';
import { formatNric } from '../../utils/nric';
import {
  BookingDoctor, BookingReceipt, bookAppointment, cancelBooking, fetchBookingDoctors, fetchBookingSlots,
} from '../../lib/publicBooking';

interface BookingModalProps {
  isBM: boolean;
  /** Doctor chosen on the page; selected here when the name matches a doctor on the roster. */
  selectedDoctor: string | null;
  onClose: () => void;
}

const T = {
  en: {
    book: 'Book an appointment', manage: 'Manage a booking', preferred: 'Preferred',
    details: 'Your details', name: 'Full name (as on MyKad) *', ic: 'MyKad number *', phone: 'Phone number *',
    visit: 'Your visit', service: 'Service', doctor: 'Doctor', chooseDoctor: 'Choose a doctor',
    when: 'Date and time', pickDay: 'Date', pickTime: 'Available times', noSlots: 'No times left on this day. Please try another date.',
    chooseFirst: 'Choose a doctor to see available times.', loading: 'Loading…', morning: 'Morning', afternoon: 'Afternoon',
    notes: 'Anything the doctor should know (optional)', notesHint: 'Symptoms or reason for visit',
    pdpa: 'Your details are used only for this booking and are protected under the Malaysia PDPA 2010.',
    confirm: 'Confirm booking', booking: 'Booking…',
    doneTitle: 'Appointment confirmed', doneLead: 'Your slot is held. Please arrive 10 minutes early with your MyKad.',
    ref: 'Booking reference', withDoctor: 'Doctor', onWhen: 'When', forService: 'Service',
    keepRef: 'Keep this reference. You need it, with your phone number, to cancel.', done: 'Done',
    refLabel: 'Booking reference', refPh: 'MC-XXXXXX', phoneUsed: 'Phone number used when booking',
    cancel: 'Cancel booking', cancelling: 'Cancelling…', cancelled: 'Your booking has been cancelled.',
    notFound: 'No upcoming booking matches that reference and phone number.',
    walkIn: 'Walk-ins are always welcome. Booking only saves you the wait.',
  },
  bm: {
    book: 'Tempah janji temu', manage: 'Urus tempahan', preferred: 'Pilihan',
    details: 'Maklumat anda', name: 'Nama penuh (seperti MyKad) *', ic: 'Nombor MyKad *', phone: 'Nombor telefon *',
    visit: 'Lawatan anda', service: 'Perkhidmatan', doctor: 'Doktor', chooseDoctor: 'Pilih doktor',
    when: 'Tarikh dan masa', pickDay: 'Tarikh', pickTime: 'Masa yang ada', noSlots: 'Tiada masa kosong pada hari ini. Sila cuba tarikh lain.',
    chooseFirst: 'Pilih doktor untuk melihat masa yang ada.', loading: 'Memuatkan…', morning: 'Pagi', afternoon: 'Petang',
    notes: 'Apa-apa yang perlu doktor tahu (pilihan)', notesHint: 'Simptom atau sebab lawatan',
    pdpa: 'Maklumat anda hanya digunakan untuk tempahan ini dan dilindungi di bawah PDPA Malaysia 2010.',
    confirm: 'Sahkan tempahan', booking: 'Menempah…',
    doneTitle: 'Janji temu disahkan', doneLead: 'Slot anda telah ditempah. Sila tiba 10 minit lebih awal dengan MyKad anda.',
    ref: 'Rujukan tempahan', withDoctor: 'Doktor', onWhen: 'Bila', forService: 'Perkhidmatan',
    keepRef: 'Simpan rujukan ini. Anda memerlukannya, bersama nombor telefon, untuk membatalkan.', done: 'Selesai',
    refLabel: 'Rujukan tempahan', refPh: 'MC-XXXXXX', phoneUsed: 'Nombor telefon semasa menempah',
    cancel: 'Batalkan tempahan', cancelling: 'Membatalkan…', cancelled: 'Tempahan anda telah dibatalkan.',
    notFound: 'Tiada tempahan akan datang sepadan dengan rujukan dan nombor telefon itu.',
    walkIn: 'Pesakit tanpa temu janji sentiasa dialu-alukan. Tempahan hanya menjimatkan masa menunggu.',
  },
} as const;

const input = 'w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand';
const label = 'block text-xs uppercase font-bold text-subtle mb-1';

export default function BookingModal({ isBM, selectedDoctor, onClose }: BookingModalProps) {
  const t = isBM ? T.bm : T.en;
  const [tab, setTab] = useState<'book' | 'manage'>('book');

  // ---- book
  const [form, setForm] = useState({ name: '', ic: '', phone: '', service: BOOKING_SERVICES[0].value as string, notes: '' });
  const [doctors, setDoctors] = useState<BookingDoctor[] | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const days = useMemo(() => bookableDays(new Date()), []);
  const [day, setDay] = useState(days[0]);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState('');
  const [errors, setErrors] = useState<BookingErrors>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);

  useEffect(() => {
    let live = true;
    fetchBookingDoctors().then((d) => {
      if (!live) return;
      setDoctors(d);
      const wanted = selectedDoctor?.toLowerCase().replace(/^dr\.?\s*/, '');
      const match = wanted ? d.find((x) => x.name.toLowerCase().replace(/^dr\.?\s*/, '') === wanted) : undefined;
      if (match) setDoctorId(match.id);
    }).catch((e: Error) => { if (live) { setDoctors([]); setServerError(e.message); } });
    return () => { live = false; };
  }, [selectedDoctor]);

  useEffect(() => {
    setSlot('');
    if (!doctorId) { setSlots(null); return; }
    let live = true;
    setSlots(null);
    fetchBookingSlots(doctorId, day).then((s) => { if (live) setSlots(s); })
      .catch((e: Error) => { if (live) { setSlots([]); setServerError(e.message); } });
    return () => { live = false; };
  }, [doctorId, day]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validateBookingDetails(form, isBM);
    setErrors(errs);
    if (Object.keys(errs).length > 0 || !doctorId || !slot) {
      if (!doctorId || !slot) setServerError(isBM ? 'Sila pilih doktor dan masa.' : 'Please choose a doctor and a time.');
      return;
    }
    setBusy(true);
    try {
      setReceipt(await bookAppointment({ ...form, doctorId, slot }));
    } catch (err) {
      setServerError((err as Error).message);
      // the slot may have just been taken: refresh the list
      fetchBookingSlots(doctorId, day).then((s) => { setSlots(s); setSlot(''); }).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  // ---- manage
  const [mRef, setMRef] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mBusy, setMBusy] = useState(false);
  const [mResult, setMResult] = useState<'' | 'cancelled' | 'notfound' | string>('');
  const cancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setMBusy(true); setMResult('');
    try {
      setMResult((await cancelBooking(mRef, mPhone)) ? 'cancelled' : 'notfound');
    } catch (err) {
      setMResult((err as Error).message);
    } finally {
      setMBusy(false);
    }
  };

  const grouped = slots ? groupSlots(slots) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 overflow-y-auto animate-fadeIn" role="dialog" aria-modal="true" aria-label={t.book}>
      <div className="bg-surface border border-line-subtle rounded-none max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-ink my-4">
        <div className="flex items-center justify-between border-b border-line-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-surface-accent border border-line-subtle flex items-center justify-center text-accent"><Calendar className="w-4 h-4" /></div>
            <h3 className="type-card-title-lg text-ink">{tab === 'book' ? t.book : t.manage}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 bg-surface-accent text-subtle hover:text-ink flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {!receipt && (
          <div className="flex border border-line" role="tablist">
            {(['book', 'manage'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`flex-1 min-h-11 text-xs font-bold cursor-pointer ${tab === k ? 'bg-primary text-white' : 'bg-surface text-muted hover:bg-surface-accent'}`}>
                {k === 'book' ? t.book : t.manage}
              </button>
            ))}
          </div>
        )}

        {receipt ? (
          <div className="py-2 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center"><CheckCircle2 className="w-7 h-7" /></div>
            <h4 className="type-section-title text-ink">{t.doneTitle}</h4>
            <p className="text-xs text-muted max-w-xs mx-auto">{t.doneLead}</p>
            <div className="p-4 bg-surface-accent border border-line-subtle text-left text-xs space-y-2">
              <Row k={t.ref} v={<strong className="font-mono text-base text-accent">{receipt.reference}</strong>} />
              <Row k={t.withDoctor} v={<strong>{receipt.doctor}</strong>} />
              <Row k={t.onWhen} v={<strong>{whenLabel(receipt.appointmentTime, isBM)}</strong>} />
              <Row k={t.forService} v={<strong>{receipt.service}</strong>} />
            </div>
            <p className="text-2xs text-subtle">{t.keepRef}</p>
            <button type="button" onClick={onClose} className="px-6 min-h-11 bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer">{t.done}</button>
          </div>
        ) : tab === 'book' ? (
          <form onSubmit={submit} className="space-y-4 text-xs" noValidate>
            <fieldset className="space-y-3 min-w-0">
              <legend className="type-label text-ink mb-1">{t.details}</legend>
              <div>
                <label htmlFor="bk-name" className={label}>{t.name}</label>
                <input id="bk-name" className={input} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
                {errors.name && <p role="alert" className="mt-1 text-rose-700">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bk-ic" className={label}>{t.ic}</label>
                  <input id="bk-ic" className={`${input} font-mono`} inputMode="numeric" placeholder="900101-14-5555" value={form.ic}
                    onChange={(e) => setForm({ ...form, ic: formatNric(e.target.value) })} aria-invalid={!!errors.ic} />
                  {errors.ic && <p role="alert" className="mt-1 text-rose-700">{errors.ic}</p>}
                </div>
                <div>
                  <label htmlFor="bk-phone" className={label}>{t.phone}</label>
                  <input id="bk-phone" className={input} type="tel" autoComplete="tel" placeholder="+60 12-345 6789" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={!!errors.phone} />
                  {errors.phone && <p role="alert" className="mt-1 text-rose-700">{errors.phone}</p>}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3 min-w-0">
              <legend className="type-label text-ink mb-1">{t.visit}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bk-service" className={label}>{t.service}</label>
                  <select id="bk-service" className={input} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    {BOOKING_SERVICES.map((s) => <option key={s.value} value={s.value}>{isBM ? s.bm : s.en}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="bk-doctor" className={label}>{t.doctor}</label>
                  <select id="bk-doctor" className={input} value={doctorId} onChange={(e) => setDoctorId(e.target.value)} disabled={!doctors}>
                    <option value="">{doctors ? t.chooseDoctor : t.loading}</option>
                    {(doctors ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}{d.department ? ` (${d.department})` : ''}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3 min-w-0">
              <legend className="type-label text-ink mb-1">{t.when}</legend>
              <div>
                <p className={label}>{t.pickDay}</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1" role="listbox" aria-label={t.pickDay}>
                  {days.map((k) => {
                    const l = dayLabel(k, isBM);
                    return (
                      <button key={k} type="button" role="option" aria-selected={day === k} onClick={() => setDay(k)}
                        className={`shrink-0 w-14 min-h-14 border text-center cursor-pointer ${day === k ? 'bg-primary text-white border-primary' : 'bg-surface text-ink border-line hover:bg-surface-accent'}`}>
                        <span className="block text-2xs uppercase">{l.weekday}</span>
                        <span className="block text-sm font-bold">{l.day}</span>
                        <span className="block text-2xs">{l.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className={label}>{t.pickTime}</p>
                {!doctorId ? <p className="text-muted">{t.chooseFirst}</p>
                  : slots === null ? <p className="text-muted flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{t.loading}</p>
                  : slots.length === 0 ? <p className="text-muted">{t.noSlots}</p>
                  : grouped.map((g) => (
                    <div key={g.key} className="mb-2">
                      <p className="text-2xs text-subtle uppercase mb-1">{g.key === 'morning' ? t.morning : t.afternoon}</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {g.slots.map((s) => (
                          <button key={s} type="button" aria-pressed={slot === s} onClick={() => setSlot(s)}
                            className={`min-h-11 border font-mono font-bold cursor-pointer ${slot === s ? 'bg-primary text-white border-primary' : 'bg-surface text-ink border-line hover:bg-surface-accent'}`}>
                            {slotLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              <div>
                <label htmlFor="bk-notes" className={label}>{t.notes}</label>
                <textarea id="bk-notes" rows={2} maxLength={300} className={`${input} resize-none`} placeholder={t.notesHint} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </fieldset>

            {serverError && <p role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 font-medium">{serverError}</p>}
            <p className="text-subtle flex items-start gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />{t.pdpa}</p>
            <button type="submit" disabled={busy} className="w-full min-h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}{busy ? t.booking : t.confirm}
            </button>
            <p className="text-2xs text-subtle text-center">{t.walkIn}</p>
          </form>
        ) : (
          <form onSubmit={cancel} className="space-y-4 text-xs">
            <div>
              <label htmlFor="mg-ref" className={label}>{t.refLabel}</label>
              <input id="mg-ref" className={`${input} font-mono uppercase`} placeholder={t.refPh} value={mRef} onChange={(e) => setMRef(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="mg-phone" className={label}>{t.phoneUsed}</label>
              <input id="mg-phone" className={input} type="tel" value={mPhone} onChange={(e) => setMPhone(e.target.value)} required />
            </div>
            {mResult === 'cancelled' && <p role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">{t.cancelled}</p>}
            {mResult === 'notfound' && <p role="alert" className="p-3 bg-amber-50 border border-amber-200 text-amber-900 font-medium">{t.notFound}</p>}
            {mResult && mResult !== 'cancelled' && mResult !== 'notfound' && <p role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 font-medium">{mResult}</p>}
            <button type="submit" disabled={mBusy || !mRef.trim() || !mPhone.trim()} className="w-full min-h-12 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs cursor-pointer">
              {mBusy ? t.cancelling : t.cancel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><span className="text-subtle">{k}</span><span className="text-right">{v}</span></div>;
}
