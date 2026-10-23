import { Microscope, CheckCircle2 } from 'lucide-react';
import { buttonProps, focusRing } from '../../../lib/a11y';
import Input from '../../ui/Input';

interface LabOrdersPanelProps {
  selectedLabs: string[];
  availableLabTests: { id: string; name: string; category: string; estTime: string; }[];
  toggleLabSelection: (testName: string) => void;
  labReason: string;
  setLabReason: React.Dispatch<React.SetStateAction<string>>;
}

export default function LabOrdersPanel({ selectedLabs, availableLabTests, toggleLabSelection, labReason, setLabReason }: LabOrdersPanelProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      
      <div className="bg-surface-muted border border-line p-3 rounded-none flex items-center justify-between">
        <div>
          <h4 className="type-label text-ink flex items-center gap-1.5">
            <Microscope className="w-4 h-4 text-accent" /> Diagnostic Lab &amp; Imaging Requisition
          </h4>
          <p className="text-2xs text-subtle dark:text-slate-400 mt-0.5">Select laboratory investigations to order for this clinical encounter.</p>
        </div>
        <span className="text-xs font-mono font-bold text-accent bg-surface px-2.5 py-1 border border-line">
          {selectedLabs.length} Tests Selected
        </span>
      </div>
    
      {/* LAB SELECTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {availableLabTests.map(test => {
          const isSelected = selectedLabs.includes(test.name);
          return (
            <div
              key={test.id}
              {...buttonProps(() => toggleLabSelection(test.name), isSelected)}
              className={`p-3 border rounded-none cursor-pointer transition-all flex items-center justify-between ${focusRing} ${
                isSelected
                  ? 'bg-surface-accent border-brand text-ink dark:text-white shadow-2xs font-bold'
                  : 'bg-surface border-slate-200 dark:border-teal-800/40 text-muted dark:text-slate-300 hover:border-line'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input 
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by parent row
                  tabIndex={-1}
                  aria-hidden="true"
                  className="w-4 h-4 text-accent rounded-none focus:ring-0 cursor-pointer"
                />
                <div>
                  <strong className="text-xs block">{test.name}</strong>
                  <span className="text-2xs text-subtle dark:text-slate-400 font-medium">
                    Category: {test.category} | TAT: {test.estTime}
                  </span>
                </div>
              </div>
              {isSelected && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
            </div>
          );
        })}
      </div>
    
      {/* CLINICAL INDICATIONS / NOTES FOR LAB */}
      <div>
        <label className="block text-xs font-bold text-ink uppercase mb-1">
          Clinical Rationale &amp; Indications for Investigations
        </label>
        <Input 
          type="text"
          className="w-full text-xs px-3 py-2 border border-line rounded-none bg-surface text-ink dark:text-white"
          value={labReason}
          onChange={e => setLabReason(e.target.value)}
          placeholder="e.g. Evaluate fever origin, rule out urinary tract infection..."
        />
      </div>
    
    </div>
  );
}
