import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GlobalSettings {
  billing: {
    taxRate: number;
    consultationFee: number;
    procedureFee: number;
  };
  modules: {
    staff: boolean;
    medicine: boolean;
    equipment: boolean;
    billing: boolean;
    reports: boolean;
  };
  hardware: {
    mykadScanner: boolean;
    receiptPrinter: boolean;
    barcodeScanner: boolean;
  };
}

/** Who this clinic is, as shown in the header. Empty until an administrator fills it in (Settings > Clinic profile). */
export interface ClinicProfile {
  name: string;
  branch: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  licenseNo: string;
}

export const EMPTY_CLINIC: ClinicProfile = { name: '', branch: '', address: '', phone: '', emergencyPhone: '', licenseNo: '' };

const clinicFromRow = (d: Record<string, any>): ClinicProfile => ({
  name: d.clinic_name ?? '', branch: d.branch_name ?? '', address: d.address ?? '', phone: d.phone ?? '',
  emergencyPhone: d.emergency_phone ?? '', licenseNo: d.license_no ?? '',
});

interface SettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: GlobalSettings) => void;
  clinic: ClinicProfile;
  /** Saves the clinic profile only (administrators). Throws the database's message on failure. */
  updateClinic: (profile: ClinicProfile) => Promise<void>;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  billing: {
    taxRate: 6, // 6% SST
    consultationFee: 35.00,
    procedureFee: 15.00
  },
  modules: {
    staff: true,
    medicine: true,
    equipment: true,
    billing: true,
    reports: true
  },
  hardware: {
    mykadScanner: true,
    receiptPrinter: true,
    barcodeScanner: false
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [clinic, setClinic] = useState<ClinicProfile>(EMPTY_CLINIC);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('clinic_settings').select('*').eq('id', 1).single();
      if (data && !error) {
        setSettings({
          billing: {
            taxRate: Number(data.tax_rate),
            consultationFee: Number(data.consultation_fee),
            procedureFee: Number(data.procedure_fee)
          },
          modules: data.active_modules,
          hardware: data.hardware_config
        });
        setClinic(clinicFromRow(data));
      }
    };
    fetchSettings();

    const channel = supabase.channel('settings_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clinic_settings' }, (payload: any) => {
        const data = payload.new;
        setSettings({
          billing: {
            taxRate: Number(data.tax_rate),
            consultationFee: Number(data.consultation_fee),
            procedureFee: Number(data.procedure_fee)
          },
          modules: data.active_modules,
          hardware: data.hardware_config
        });
        setClinic(clinicFromRow(data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSettings = async (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    
    try {
      await supabase.from('clinic_settings').upsert({
        id: 1,
        tax_rate: newSettings.billing.taxRate,
        consultation_fee: newSettings.billing.consultationFee,
        procedure_fee: newSettings.billing.procedureFee,
        active_modules: newSettings.modules,
        hardware_config: newSettings.hardware
      });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const updateClinic = async (profile: ClinicProfile) => {
    const { error } = await supabase.from('clinic_settings').upsert({
      id: 1, clinic_name: profile.name.trim() || null, branch_name: profile.branch.trim() || null, address: profile.address.trim() || null,
      phone: profile.phone.trim() || null, emergency_phone: profile.emergencyPhone.trim() || null, license_no: profile.licenseNo.trim() || null,
    });
    if (error) throw new Error(error.message);
    setClinic(profile);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, clinic, updateClinic }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
