import { RoomOption } from '../../domain/doctorAssignment';

interface RoomPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (room: string) => void;
  /** The clinic's rooms. When there are none, the doctor types a room name instead. */
  options: RoomOption[];
  onEnter?: () => void;
}

/** Picks the room a patient is called into. A room another doctor is using is shown but cannot be chosen. */
export default function RoomPicker({ id, label, value, onChange, options, onEnter }: RoomPickerProps) {
  const field = 'mt-1 w-full min-h-11 px-3 text-sm border border-line-strong bg-surface text-ink';
  return (
    <label htmlFor={id} className="block">
      <span className="text-2xs font-bold uppercase tracking-wider text-subtle">{label}</span>
      {options.length === 0 ? (
        <input id={id} className={field} value={value} maxLength={60} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.(); }} />
      ) : (
        <select id={id} className={field} value={value} onChange={(e) => onChange(e.target.value)}>
          {!options.some((o) => o.name === value) && <option value="">Choose a room</option>}
          {options.map((o) => (
            <option key={o.name} value={o.name} disabled={!!o.busyWith}>{o.busyWith ? `${o.name} (in use by ${o.busyWith})` : o.name}</option>
          ))}
        </select>
      )}
    </label>
  );
}
