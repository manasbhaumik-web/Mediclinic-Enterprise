import { UserCheck } from 'lucide-react';
import FormField, { fieldBorder } from '../../components/ui/FormField';
import { parseNric, formatNric } from '../../utils/nric';

interface DemographicsStepProps {
  existingPatientId: string;
  fieldErrors: Record<string, string>;
  manualForm: { fullName: string; icNumber: string; gender: 'Male' | 'Female'; dob: string; phone: string; address: string; panelEmployer: string; chiefComplaint: string; temperature: string; bpSystolic: string; bpDiastolic: string; heartRate: string; };
  setManualForm: React.Dispatch<React.SetStateAction<{ fullName: string; icNumber: string; gender: 'Male' | 'Female'; dob: string; phone: string; address: string; panelEmployer: string; chiefComplaint: string; temperature: string; bpSystolic: string; bpDiastolic: string; heartRate: string; }>>;
  clearError: (key: string) => void;
  inputBase: string;
}

export default function DemographicsStep({ existingPatientId, fieldErrors, manualForm, setManualForm, clearError, inputBase }: DemographicsStepProps) {
  return (
    <div className="space-y-3 font-sans">
      <div>
        <h3 className="type-heading-caps text-ink font-sans">
          Patient Demographics
        </h3>
        {existingPatientId && (
          <div className="mt-2 inline-flex items-center justify-center gap-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-none text-xs font-sans font-bold border border-emerald-300 dark:border-emerald-800">
            <UserCheck className="w-4 h-4" /> Existing Record Found - Auto-populated
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <FormField id="reg-fullName" label="Full Name" required error={fieldErrors.fullName}>
            {(f) => (
              <input
                {...f}
                type="text"
                value={manualForm.fullName}
                onChange={(e) => { setManualForm({ ...manualForm, fullName: e.target.value }); clearError('fullName'); }}
                placeholder="e.g. MOHD HAFIZ BIN RAZALI"
                autoComplete="off"
                className={`${inputBase} font-bold font-sans ${fieldBorder(fieldErrors.fullName)}`}
              />
            )}
          </FormField>
        </div>
        <div>
          <FormField id="reg-icNumber" label="IC / Passport Number" required error={fieldErrors.icNumber} hint={parseNric(manualForm.icNumber) ? 'Date of birth and gender are filled from the NRIC.' : undefined}>
            {(f) => (
              <input
                {...f}
                type="text"
                value={manualForm.icNumber}
                onChange={(e) => {
                  const icNumber = formatNric(e.target.value);
                  const fromNric = parseNric(icNumber);
                  setManualForm({ ...manualForm, icNumber, ...(fromNric ? { dob: fromNric.dob, gender: fromNric.gender } : {}) });
                  clearError('icNumber');
                }}
                placeholder="YYMMDD-XX-XXXX"
                autoComplete="off"
                className={`${inputBase} font-mono ${fieldBorder(fieldErrors.icNumber)}`}
              />
            )}
          </FormField>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <FormField id="reg-gender" label="Gender">
            {(f) => (
              <select
                {...f}
                value={manualForm.gender}
                onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'Male' | 'Female' })}
                className={`${inputBase} font-sans ${fieldBorder()}`}
              >
                <option value="Male">Male / Lelaki</option>
                <option value="Female">Female / Perempuan</option>
              </select>
            )}
          </FormField>
        </div>
        <div>
          <FormField id="reg-dob" label="Date of Birth">
            {(f) => (
              <input
                {...f}
                type="date"
                value={manualForm.dob}
                onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })}
                className={`${inputBase} font-mono ${fieldBorder()}`}
              />
            )}
          </FormField>
        </div>
        <div>
          <FormField id="reg-phone" label="Phone Number" required error={fieldErrors.phone}>
            {(f) => (
              <input
                {...f}
                type="tel"
                value={manualForm.phone}
                onChange={(e) => { setManualForm({ ...manualForm, phone: e.target.value }); clearError('phone'); }}
                placeholder="e.g. 012-3456789"
                autoComplete="off"
                className={`${inputBase} font-mono ${fieldBorder(fieldErrors.phone)}`}
              />
            )}
          </FormField>
        </div>
      </div>
    
      <div>
        <FormField id="reg-address" label="Residential Address">
          {(f) => (
            <input
              {...f}
              type="text"
              value={manualForm.address}
              onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
              placeholder="Enter full residential address..."
              autoComplete="off"
              className={`${inputBase} font-sans ${fieldBorder()}`}
            />
          )}
        </FormField>
      </div>
    </div>
  );
}
