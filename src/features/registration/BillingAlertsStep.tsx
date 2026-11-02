import FormField, { fieldBorder } from '../../components/ui/FormField';
import { Loader2, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { ClinicDoctor } from '../../domain/doctorAssignment';

interface BillingAlertsStepProps {
  fieldErrors: Record<string, string>;
  manualForm: { fullName: string; icNumber: string; gender: 'Male' | 'Female'; dob: string; phone: string; address: string; panelEmployer: string; chiefComplaint: string; temperature: string; bpSystolic: string; bpDiastolic: string; heartRate: string; };
  setManualForm: React.Dispatch<React.SetStateAction<{ fullName: string; icNumber: string; gender: 'Male' | 'Female'; dob: string; phone: string; address: string; panelEmployer: string; chiefComplaint: string; temperature: string; bpSystolic: string; bpDiastolic: string; heartRate: string; }>>;
  setCoverageStatus: React.Dispatch<React.SetStateAction<'unverified' | 'verified' | 'failed'>>;
  clearError: (key: string) => void;
  inputBase: string;
  handleVerifyCoverage: () => void;
  isVerifyingCoverage: boolean;
  coverageStatus: 'unverified' | 'verified' | 'failed';
  allergyInput: string;
  setAllergyInput: React.Dispatch<React.SetStateAction<string>>;
  handleAddAllergyTag: () => void;
  allergiesList: string[];
  handleRemoveAllergyTag: (index: number) => void;
  doctors: ClinicDoctor[];
  /** Staff id of the doctor the patient should see, or '' for whoever is free. */
  assignedDoctorId: string;
  onAssignedDoctorChange: (id: string) => void;
}

const legend = 'pb-3 text-xs font-bold text-accent tracking-wide';

export default function BillingAlertsStep({ fieldErrors, manualForm, setManualForm, setCoverageStatus, clearError, inputBase, handleVerifyCoverage, isVerifyingCoverage, coverageStatus, allergyInput, setAllergyInput, handleAddAllergyTag, allergiesList, handleRemoveAllergyTag, doctors, assignedDoctorId, onAssignedDoctorChange }: BillingAlertsStepProps) {
  return (
    <div className="flex flex-col gap-6 font-sans">
      <fieldset className="min-w-0">
        <legend className={legend}>Billing sponsor</legend>
        <FormField id="reg-panel" plain label="Panel / corporate sponsor" error={fieldErrors.panel} hint="Coverage is checked with the sponsor before the visit is routed to triage." className="max-w-2xl">
          {(f) => (
            <div className="flex flex-wrap gap-2">
              <select
                {...f}
                value={manualForm.panelEmployer}
                onChange={(e) => {
                  setManualForm({ ...manualForm, panelEmployer: e.target.value });
                  setCoverageStatus(e.target.value === 'None (Self-Pay)' ? 'verified' : 'unverified');
                  clearError('panel');
                }}
                className={`flex-[1_1_16rem] ${inputBase} ${fieldBorder(fieldErrors.panel)}`}
              >
                <option value="None (Self-Pay)">Self-pay (no sponsor claim)</option>
                <option value="Petronas Panel">Petronas Panel (cover RM500 limit)</option>
                <option value="Medkad Sdn Bhd">Medkad Sdn Bhd (cover RM200 limit)</option>
                <option value="MiCare TPA">MiCare TPA (cover RM150, co-pay 10%)</option>
                <option value="HealthMetrics Malaysia">HealthMetrics Malaysia (cover RM300, co-pay 15%)</option>
                <option value="PMCare Corporate">PMCare Corporate (cover RM250 limit)</option>
              </select>
              {manualForm.panelEmployer !== 'None (Self-Pay)' && (
                <button
                  type="button"
                  onClick={handleVerifyCoverage}
                  disabled={isVerifyingCoverage || coverageStatus === 'verified'}
                  className={coverageStatus === 'verified' ? 'chip-ok min-h-11 px-5 text-sm font-bold' : 'btn-primary px-5 text-sm'}
                >
                  {isVerifyingCoverage ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : coverageStatus === 'verified' ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <ShieldCheck className="w-4 h-4" aria-hidden="true" />}
                  {coverageStatus === 'verified' ? 'Verified' : 'Verify coverage'}
                </button>
              )}
            </div>
          )}
        </FormField>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={legend}>Drug allergies</legend>
        <FormField id="reg-allergy" plain label="Add an allergy" hint="Press Enter or choose Add. Add every known allergy, since they are checked when prescribing." className="max-w-2xl">
          {(f) => (
            <div className="flex flex-wrap gap-2">
              <input
                {...f}
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                placeholder="e.g. Penicillin, aspirin"
                autoComplete="off"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergyTag())}
                className={`flex-[1_1_16rem] ${inputBase} ${fieldBorder()}`}
              />
              <button type="button" onClick={handleAddAllergyTag} className="btn-secondary px-5 text-sm">Add</button>
            </div>
          )}
        </FormField>
        {allergiesList.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {allergiesList.map((tag, idx) => (
              <li key={idx} className="inline-flex items-center gap-1 pl-3 bg-rose-50 border border-rose-200 text-rose-900 text-sm font-bold dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
                {tag}
                <button type="button" onClick={() => handleRemoveAllergyTag(idx)} aria-label={`Remove allergy ${tag}`} className="w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60">
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={legend}>Doctor</legend>
        <FormField id="reg-doctor" plain label="Doctor to see" hint="Leave as 'Any available doctor' unless the patient needs a particular doctor or specialist." className="max-w-2xl">
          {(f) => (
            <select {...f} value={assignedDoctorId} onChange={(e) => onAssignedDoctorChange(e.target.value)} className={`${inputBase} ${fieldBorder()}`}>
              <option value="">Any available doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.department ? ` (${d.department})` : ''}</option>)}
            </select>
          )}
        </FormField>
      </fieldset>
    </div>
  );
}
