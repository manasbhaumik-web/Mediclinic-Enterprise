import React, { useMemo, useState } from 'react';
import { DoorOpen, Plus, Stethoscope } from 'lucide-react';
import { useBookingServices, useClinicDoctors, useClinicSetupActions, useConsultationRooms } from '../../hooks/useClinicSetup';

/**
 * Admin set-up for two things that route patients: the consultation rooms doctors call patients into, and which
 * online booking services are limited to one specialty (a doctor's department).
 */
export default function RoomsAndServicesCard() {
  const rooms = useConsultationRooms();
  const doctors = useClinicDoctors();
  const services = useBookingServices();
  const actions = useClinicSetupActions();

  const [newRoom, setNewRoom] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const departments = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.department).filter((d): d is string => !!d))).sort(),
    [doctors],
  );

  const report = (r: { ok: true } | { ok: false; error: string }, okText: string) =>
    setNotice('error' in r ? { tone: 'error', text: r.error } : { tone: 'ok', text: okText });

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRoom.trim();
    if (!name) return;
    const r = await actions.addRoom(name, (rooms.length ? rooms[rooms.length - 1].sortOrder : 0) + 1);
    report(r, `${name} added.`);
    if (r.ok) setNewRoom('');
  };

  const renameRoom = async (id: string, current: string) => {
    const name = (drafts[id] ?? current).trim();
    if (!name || name === current) { setDrafts(({ [id]: _drop, ...rest }) => rest); return; }
    report(await actions.updateRoom(id, { name }), 'Room renamed.');
    setDrafts(({ [id]: _drop, ...rest }) => rest);
  };

  const field = 'min-h-10 px-3 text-sm border border-line-strong bg-surface text-ink';

  return (
    <section className="bg-surface rounded-none border border-line shadow-2xs overflow-hidden">
      <div className="bg-surface-muted px-5 py-3 border-b border-line-subtle flex items-center gap-2">
        <DoorOpen className="w-4 h-4 text-accent" aria-hidden="true" />
        <h3 className="type-card-title text-ink">Consultation Rooms & Specialty Services</h3>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {notice && (
          <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`lg:col-span-2 p-3 text-xs font-medium border ${notice.tone === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {notice.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Consultation rooms</h4>
            <p className="text-2xs text-subtle mt-0.5">Doctors choose one of these when they call a patient. A room already in use cannot be chosen. A room that is switched off is hidden from doctors.</p>
          </div>
          <ul className="space-y-2">
            {rooms.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <input
                  aria-label={`Name of ${r.name}`}
                  className={`${field} flex-1 min-w-0 ${r.active ? '' : 'opacity-60'}`}
                  value={drafts[r.id] ?? r.name}
                  maxLength={60}
                  onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                  onBlur={() => void renameRoom(r.id, r.name)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                  <input type="checkbox" checked={r.active} onChange={(e) => void actions.updateRoom(r.id, { active: e.target.checked }).then((x) => report(x, e.target.checked ? `${r.name} is in use.` : `${r.name} is switched off.`))} />
                  In use
                </label>
              </li>
            ))}
            {rooms.length === 0 && <li className="text-xs text-muted">No rooms yet. Doctors can type any room name until you add one.</li>}
          </ul>
          <form onSubmit={addRoom} className="flex gap-2">
            <input className={`${field} flex-1 min-w-0`} placeholder="New room, for example Treatment Room" value={newRoom} maxLength={60} onChange={(e) => setNewRoom(e.target.value)} aria-label="New room name" />
            <button type="submit" disabled={!newRoom.trim()} className="min-h-10 px-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />Add
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-accent" aria-hidden="true" />Online services and specialty</h4>
            <p className="text-2xs text-subtle mt-0.5">Limit a service to one specialty so patients are offered, and the booking accepts, only those doctors. The specialty is the doctor&apos;s department in Staff Directory.</p>
          </div>
          <ul className="space-y-2">
            {(services.data ?? []).map((s) => (
              <li key={s.service} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_12rem_auto] items-center gap-2">
                <span className={`text-sm text-ink min-w-0 break-words ${s.active ? '' : 'opacity-60'}`}>{s.service}</span>
                <select
                  aria-label={`Specialty for ${s.service}`}
                  className={`${field} w-full`}
                  value={s.department ?? ''}
                  onChange={(e) => void actions.updateService(s.service, { department: e.target.value || null }).then((x) => report(x, 'Service updated.'))}
                >
                  <option value="">Any doctor</option>
                  {s.department && !departments.includes(s.department) && <option value={s.department}>{s.department}</option>}
                  {departments.map((d) => <option key={d} value={d}>{d} only</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                  <input type="checkbox" checked={s.active} onChange={(e) => void actions.updateService(s.service, { active: e.target.checked }).then((x) => report(x, 'Service updated.'))} />
                  Offered
                </label>
              </li>
            ))}
            {services.isPending && <li className="text-xs text-muted">Loading…</li>}
          </ul>
          <p className="text-2xs text-subtle">A service switched off here is still shown on the public page until it is removed from the site&apos;s list; the booking itself will refuse it.</p>
        </div>
      </div>
    </section>
  );
}
