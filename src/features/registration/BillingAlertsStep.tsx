import FormField, { fieldBorder } from '../../components/ui/FormField';
import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BillingAlertsStepProps {
  fieldErrors: Record<string, string>;
  manualForm: { fullName: string; icNumber: string; gender: 'Male' | 'Female'; dob: string; phone: string; address: string; panelEmployer: string; chiefComplaint: string; temperature: string; bpSystolic: string; bpDiastolic: string; heartRate: string; };
  setManualForm: React.Dispatch<React.SetStateAction<{ fullName: string; icNumber: string; gender: 'Male' | 'Female'; dob: string; phone: string; address: string; panelEmployer: string; chiefComplaint: string; temperature: string; bpSystolic: string; bpDiastolic: string; heartRate: string; }>>;
  setCoverageStatus: React.Dispatch<React.SetStateAction<'unverified' | 'verified' | 'failed'>>;
  clearError: (key: string) => void;
  inputBase: 'w-full bg-surface dark:bg-night-900 border rounded-none px-3 py-2 text-xs text-ink dark:text-slate-100 outline-none';
  handleVerifyCoverage: () => void;
  isVerifyingCoverage: boolean;
  coverageStatus: 'unverified' | 'verified' | 'failed';
  allergyInput: string;
  setAllergyInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddAllergyTag: () => void;
  allergiesList: string[];
  handleRemoveAllergyTag: (index: number) => void;
}

export default function BillingAlertsStep({ fieldErrors, manualForm, setManualForm, setCoverageStatus, clearError, inputBase, handleVerifyCoverage, isVerifyingCoverage, coverageStatus, allergyInput, setAllergyInput, handleAddAllergyTag, allergiesList, handleRemoveAllergyTag }: BillingAlertsStepProps) {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h3 className="type-heading-caps text-ink dark:text-teal-300 font-sans">
          Billing Sponsor & Medical Alerts
        </h3>
        <p className="text-xs text-accent dark:text-teal-300 font-sans mt-0.5">Configure insurance panels and drug allergies</p>
      </div>
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField id="reg-panel" label="Panel / Corporate Sponsor" error={fieldErrors.panel} className="space-y-2">
            {(f) => (
              <div className="flex gap-2">
                <select
                  {...f}
                  value={manualForm.panelEmployer}
                  onChange={(e) => {
                    setManualForm({ ...manualForm, panelEmployer: e.target.value });
                    setCoverageStatus(e.target.value === 'None (Self-Pay)' ? 'verified' : 'unverified');
                    clearError('panel');
                  }}
                  className={`flex-1 ${inputBase} font-sans ${fieldBorder(fieldErrors.panel)}`}
                >
                  <option value="None (Self-Pay)">Self-Pay (No sponsor claim co-pays)</option>
                  <option value="Petronas Panel">Petronas Panel (Cover RM500 limit)</option>
                  <option value="Medkad Sdn Bhd">Medkad Sdn Bhd (Cover RM200 limit)</option>
                  <option value="MiCare TPA">MiCare TPA (Cover RM150, co-pay 10%)</option>
                  <option value="HealthMetrics Malaysia">HealthMetrics Malaysia (Cover RM300, co-pay 15%)</option>
                  <option value="PMCare Corporate">PMCare Corporate (Cover RM250 limit)</option>
                </select>
                {manualForm.panelEmployer !== 'None (Self-Pay)' && (
                  <button
                    type="button"
                    onClick={handleVerifyCoverage}
                    disabled={isVerifyingCoverage || coverageStatus === 'verified'}
                    className={`px-3 py-2 font-sans text-xs font-bold rounded-none uppercase transition-colors flex items-center gap-1 ${
                      coverageStatus === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-primary text-white hover:bg-primary-hover'
                    }`}
                  >
                    {isVerifyingCoverage ? <Loader2 className="w-4 h-4 animate-spin" /> : coverageStatus === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {coverageStatus === 'verified' ? 'Verified' : 'Verify'}
                  </button>
                )}
              </div>
            )}
          </FormField>
        </div>
    
        <div>
          <FormField id="reg-allergy" label="Drug Allergies" hint="Press Enter or choose Add. Add every known allergy, since they are checked when prescribing." className="space-y-2">
            {(f) => (
              <div className="flex gap-2">
                <input
                  {...f}
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="e.g. Penicillin, Aspirin..."
                  autoComplete="off"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergyTag())}
                  className={`flex-1 ${inputBase} font-sans ${fieldBorder()}`}
                />
                <button
                  type="button"
                  onClick={handleAddAllergyTag}
                  className="bg-surface dark:bg-night-900 hover:bg-surface-accent dark:hover:bg-night-800 text-accent dark:text-teal-300 border border-line-subtle dark:border-teal-800/50 font-bold text-xs px-3 py-2 rounded-none font-sans uppercase"
                >
                  + Add
                </button>
              </div>
            )}
          </FormField>
          {allergiesList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {allergiesList.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-sans font-bold px-2.5 py-1 border border-rose-200 dark:border-rose-800/60 rounded-none">
                  {tag}
                  <button type="button" onClick={() => handleRemoveAllergyTag(idx)} aria-label={`Remove allergy ${tag}`} className="text-rose-600 hover:text-rose-800 cursor-pointer text-xs">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
