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

const legend = 'pb-3 text-xs font-bold text-accent tracking-wide';
const grid = 'grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4';

export default function DemographicsStep({ fieldErrors, manualForm, setManualForm, clearError, inputBase }: DemographicsStepProps) {
  return (
    <div className="flex flex-col gap-6 font-sans">
      <fieldset className="min-w-0">
        <legend className={legend}>Identity</legend>
        <div className={grid}>
          <div className="col-span-full">
            <FormField id="reg-fullName" plain label="Full name" required error={fieldErrors.fullName}>
              {(f) => (
                <input
                  {...f}
                  type="text"
                  value={manualForm.fullName}
                  onChange={(e) => { setManualForm({ ...manualForm, fullName: e.target.value }); clearError('fullName'); }}
                  placeholder="e.g. MOHD HAFIZ BIN RAZALI"
                  autoComplete="name"
                  className={`${inputBase} font-bold ${fieldBorder(fieldErrors.fullName)}`}
                />
              )}
            </FormField>
          </div>
          <FormField id="reg-icNumber" plain label="IC / passport number" required error={fieldErrors.icNumber} hint={parseNric(manualForm.icNumber) ? 'Date of birth and gender are filled from the NRIC.' : undefined}>
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
                className={`${inputBase} tabular-nums ${fieldBorder(fieldErrors.icNumber)}`}
              />
            )}
          </FormField>
          <FormField id="reg-dob" plain label="Date of birth">
            {(f) => (
              <input
                {...f}
                type="date"
                value={manualForm.dob}
                onChange={(e) => setManualForm({ ...manualForm, dob: e.target.value })}
                className={`${inputBase} tabular-nums ${fieldBorder()}`}
              />
            )}
          </FormField>
          <FormField id="reg-gender" plain label="Gender">
            {(f) => (
              <select
                {...f}
                value={manualForm.gender}
                onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value as 'Male' | 'Female' })}
                className={`${inputBase} ${fieldBorder()}`}
              >
                <option value="Male">Male / Lelaki</option>
                <option value="Female">Female / Perempuan</option>
              </select>
            )}
          </FormField>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className={legend}>Contact</legend>
        <div className={grid}>
          <FormField id="reg-phone" plain label="Phone number" required error={fieldErrors.phone}>
            {(f) => (
              <input
                {...f}
                type="tel"
                value={manualForm.phone}
                onChange={(e) => { setManualForm({ ...manualForm, phone: e.target.value }); clearError('phone'); }}
                placeholder="e.g. 012-3456789"
                autoComplete="tel"
                className={`${inputBase} tabular-nums ${fieldBorder(fieldErrors.phone)}`}
              />
            )}
          </FormField>
          <div className="col-span-full">
            <FormField id="reg-address" plain label="Residential address">
              {(f) => (
                <input
                  {...f}
                  type="text"
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  placeholder="Street, area, postcode"
                  autoComplete="street-address"
                  className={`${inputBase} ${fieldBorder()}`}
                />
              )}
            </FormField>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
