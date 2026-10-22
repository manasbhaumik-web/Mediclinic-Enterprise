import React, { useEffect, useRef, useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

type Section = 'guide' | 'shortcuts' | 'legend' | 'contact';

interface Guide { title: string; summary: string; steps: string[] }

/** What each screen is for and how to use it. Keyed by the tab ids of the clinic shell and the admin console. */
const GUIDES: Record<string, Guide> = {
  dashboard: { title: 'Dashboard', summary: 'Today at a glance for your role: queues, counts and what needs attention.', steps: ['Open a queue from the side navigation to start work.', 'The bell in the header lists what needs your attention.', 'Figures update as visits move between stations.'] },
  registration: { title: 'Patient registration', summary: 'Register a patient and add them to the queue.', steps: ['Search first so you do not create a duplicate record.', 'Fill in identity, contact and any drug allergies. Allergies warn the doctor later.', 'Save to put the patient in the queue for triage.'] },
  triage: { title: 'Triage', summary: 'Record vitals and the reason for the visit before the doctor.', steps: ['Pick the waiting patient.', 'Enter blood pressure, pulse, temperature and the main complaint.', 'Complete triage to pass the patient to the doctor.'] },
  queue: { title: 'Doctor queue', summary: 'Patients waiting for you, in order.', steps: ['Select a patient to open the consultation room.', 'Allergy and safety flags are shown at the top of the record.'] },
  consultation: { title: 'Consultation', summary: 'Write the visit note and the plan, then sign off.', steps: ['Fill in the symptoms, findings and the diagnosis.', 'Add medicines from the stock list. Pick an item that is in stock so the pharmacy can dispense it exactly.', 'Review and sign off to send the visit on to the pharmacy and billing.'] },
  dispensary: { title: 'Dispensary', summary: 'Dispense a visit\'s prescriptions from stock.', steps: ['Every line needs a decision: dispense it, or skip it with a reason.', 'Stock is taken from the batch that expires soonest. Expired stock is never used.', 'A controlled drug also needs a second person to sign its register entry before the visit can move on.', 'If any line fails (for example not enough stock), nothing is changed. Fix it and confirm again.'] },
  inventory: { title: 'Inventory & pharmacy', summary: 'Stock by batch, alerts, orders and the controlled-drug register.', steps: ['Stock changes only through Receive, Adjust and Dispense. Nothing is edited directly.', 'Use Alerts for low stock and near-expiry batches, and start an order from there.', 'Drugs are retired, not deleted, so history stays.'] },
  billing: { title: 'Billing', summary: 'Charge the visit and take payment.', steps: ['Open a visit from the billing queue.', 'Check the items and any panel or insurer details.', 'Confirm payment to close the visit.'] },
  appointments: { title: 'Appointments', summary: 'Book and manage appointments.', steps: ['Pick a date and a doctor, then choose a free slot.', 'Open an appointment to change or cancel it.'] },
  reports: { title: 'Reports', summary: 'Clinic figures for a chosen period.', steps: ['Choose the date range first.', 'Use the export options to download what you need.'] },
  'my-leave': { title: 'My leave', summary: 'Request leave, see your balance and clock in or out.', steps: ['Choose a leave type and dates, then submit. A manager approves or rejects it.', 'Your balance comes from approved requests only.', 'Clock in and out here if your account is linked to your staff record.'] },
  staff: { title: 'Staff directory', summary: 'People, roles and logins.', steps: ['Add a person or import a list.', 'Invite a login and set the access role from here.', 'The Payroll tab lists each person with their salary payment status.'] },
  medicine: { title: 'Inventory & pharmacy', summary: 'The same stock screens the pharmacist uses, with administrator rights.', steps: ['Only an administrator can put a drug in the controlled register.', 'Retire a drug when its stock is zero and it is on no open order.'] },
  equipment: { title: 'Equipment & assets', summary: 'Asset register, service and calibration records, and what is due.', steps: ['Record work (service, calibration, inspection, repair) with who did it and the result. That is what moves the next due dates.', 'A failed result takes the device out of service until a passing service or repair.', 'Decommission instead of deleting; the history stays.'] },
  leave: { title: 'Leave & attendance', summary: 'Approve leave, record attendance and set entitlement rules.', steps: ['Approve or reject requests. You cannot approve your own.', 'Unpaid leave flows into the payroll run.', 'Entitlement rules start unverified; check them against your policy and the law.'] },
  payroll: { title: 'Payroll', summary: 'Monthly payroll runs, rates and payslips.', steps: ['Statutory rates start unverified. Confirm them before a real run.', 'Review each payslip before approving the run.', 'Export the bank and statutory files from the finished run.'] },
  settings: { title: 'Settings', summary: 'Clinic profile, fees, tax and modules.', steps: ['The Clinic profile feeds the header and clinic-info popover.', 'Turning a module off hides it from the admin console.'] },
};

const FALLBACK: Guide = { title: 'This screen', summary: 'Use the side navigation to move between areas.', steps: ['Buttons that change records ask for a reason or a confirmation where it matters.', 'If something is refused, the message says why. Read it before trying again.'] };

const ROLE_INTRO: Record<string, string> = {
  doctor: 'You see the doctor queue and the consultation room. Prescribe from the stock list so the pharmacy can dispense exactly what you chose.',
  pharmacist: 'You dispense prescriptions and manage stock, batches, orders and the controlled-drug register.',
  'clinic-assistant': 'You register patients, record triage and handle billing and appointments.',
  admin: 'You manage staff, stock, equipment, payroll, leave, settings and reports from the admin console.',
  hr: 'You manage staff, leave, attendance and payroll.',
};

const LEGEND: { label: string; text: string; tone: string }[] = [
  { label: 'Green', text: 'Fine, completed or in stock.', tone: 'bg-emerald-500' },
  { label: 'Amber', text: 'Needs attention soon: low stock, due soon, pending.', tone: 'bg-amber-400' },
  { label: 'Red', text: 'Act now: overdue, out of service, expired, or an error.', tone: 'bg-rose-500' },
  { label: 'Blue', text: 'For information.', tone: 'bg-sky-400' },
  { label: 'Red number on the bell', text: 'How many items need your attention.', tone: 'bg-rose-600' },
];

const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: '?', does: 'Open this help (when you are not typing in a field)' },
  { keys: 'Esc', does: 'Close this help, a menu or a dialog' },
  { keys: 'Tab / Shift+Tab', does: 'Move between buttons and fields' },
  { keys: 'Enter / Space', does: 'Press the focused button' },
];

/** Opens the help panel and listens for "?" anywhere outside a text field. */
export function useHelp() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return { open, setOpen, show: () => setOpen(true), hide: () => setOpen(false) };
}

/** Header button. */
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open help"
      title="Help (press ?)"
      className="flex items-center justify-center w-10 h-10 bg-chrome-deep hover:bg-chrome-line border border-teal-300/40 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none"
    >
      <CircleHelp className="w-4 h-4 text-teal-100" />
    </button>
  );
}

/** Sticky footer shown on every screen. */
export function AppFooter({ online, onHelp }: { online: boolean; onHelp: () => void }) {
  const { clinic } = useSettings();
  return (
    <footer className="sticky bottom-0 z-20 shrink-0 h-10 bg-chrome text-white border-t border-white/20 px-4 sm:px-6 flex items-center justify-between text-xs font-sans">
      <span className="flex items-center gap-3 min-w-0">
        <span className="flex items-center gap-1.5 shrink-0" role="status">
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-hidden="true" />
          <span className="font-semibold">{online ? 'Online' : 'Offline'}</span>
        </span>
        <span className="truncate text-teal-50 hidden sm:inline">© {new Date().getFullYear()} {clinic.name || 'Mediclinic Enterprise'}</span>
      </span>
      <span className="flex items-center gap-3 shrink-0">
        <span className="hidden md:inline text-teal-50">Press <kbd className="px-1.5 py-0.5 border border-teal-300/40 bg-chrome-deep font-mono text-2xs">?</kbd> for help</span>
        <button
          type="button"
          onClick={onHelp}
          className="flex items-center gap-1.5 px-3 py-1 bg-chrome-deep hover:bg-chrome-line border border-teal-300/40 font-bold cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none"
        >
          <CircleHelp className="w-3.5 h-3.5" /> Help
        </button>
      </span>
    </footer>
  );
}

/** Slide-in help: what this screen does, shortcuts, what the colours mean, and who to contact. */
export default function HelpCenter({ open, onClose, role, activeTab }: { open: boolean; onClose: () => void; role: string | null | undefined; activeTab: string }) {
  const { clinic } = useSettings();
  const [section, setSection] = useState<Section>('guide');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  const guide = GUIDES[activeTab] ?? FALLBACK;
  const tab = (s: Section, label: string) => (
    <button
      role="tab"
      aria-selected={section === s}
      onClick={() => setSection(s)}
      className={`px-3 py-2 text-xs font-bold border-b-2 cursor-pointer ${section === s ? 'border-primary text-accent' : 'border-transparent text-slate-500 hover:text-ink'}`}
    >{label}</button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label="Help" className="w-full max-w-md h-full bg-surface text-ink border-l border-line shadow-2xl flex flex-col animate-fadeIn">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line-subtle">
          <h2 className="type-heading-caps text-ink flex items-center gap-2"><CircleHelp className="w-4 h-4 text-accent" />Help</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close help" className="p-1 text-slate-500 hover:text-ink cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div role="tablist" className="flex border-b border-line-subtle px-2">
          {tab('guide', 'This screen')}{tab('shortcuts', 'Keys')}{tab('legend', 'Colours')}{tab('contact', 'Contact')}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed">
          {section === 'guide' && (
            <>
              <div>
                <h3 className="text-sm font-bold text-ink">{guide.title}</h3>
                <p className="text-slate-600 mt-1">{guide.summary}</p>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">{guide.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              {role && ROLE_INTRO[role] && (
                <div className="bg-surface-accent border border-line-subtle p-3">
                  <p className="font-bold text-ink mb-1">Your role</p>
                  <p className="text-slate-600">{ROLE_INTRO[role]}</p>
                </div>
              )}
              <div className="text-slate-600">
                <p className="font-bold text-ink mb-1">Good to know</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Settings for theme, privacy mask and language are in the menu under your name.</li>
                  <li>When a change is refused, the message explains why. Nothing is half-saved.</li>
                  <li>Records with history are never deleted; they are retired or decommissioned.</li>
                </ul>
              </div>
            </>
          )}
          {section === 'shortcuts' && (
            <table className="w-full"><tbody>
              {SHORTCUTS.map((s) => (
                <tr key={s.keys} className="border-b border-line-subtle">
                  <td className="py-2 pr-3 whitespace-nowrap"><kbd className="px-1.5 py-0.5 border border-line bg-surface-accent font-mono text-2xs">{s.keys}</kbd></td>
                  <td className="py-2 text-slate-700">{s.does}</td>
                </tr>
              ))}
            </tbody></table>
          )}
          {section === 'legend' && (
            <ul className="space-y-2">
              {LEGEND.map((l) => (
                <li key={l.label} className="flex items-start gap-3"><span className={`mt-1 w-3 h-3 shrink-0 ${l.tone}`} aria-hidden="true" /><span><b className="text-ink">{l.label}.</b> <span className="text-slate-600">{l.text}</span></span></li>
              ))}
            </ul>
          )}
          {section === 'contact' && (
            <div className="space-y-3 text-slate-700">
              {clinic.emergencyPhone && <p><b className="text-ink">Emergency hotline:</b> {clinic.emergencyPhone}</p>}
              {clinic.phone && <p><b className="text-ink">Clinic phone:</b> {clinic.phone}</p>}
              <p>For access problems, a forgotten password or a wrong role, ask your clinic administrator. Administrators can change roles and logins under Staff.</p>
              <p>For something that looks like a fault in the system, note the screen, what you pressed and the message shown, and tell your administrator.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
