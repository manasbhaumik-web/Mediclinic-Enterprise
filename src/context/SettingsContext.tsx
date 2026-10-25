import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WebsiteCMSConfig, DEFAULT_WEBSITE_CONFIG } from '../domain/websiteCms';

export interface AISettings {
  enabled: boolean;
  provider: 'gemini' | 'openai' | 'anthropic' | 'on-premise';
  modelName: string;
  apiKey: string;
  endpointUrl: string;
  temperature: number;
  maxTokens: number;
  features: {
    ambientScribe: boolean;
    drugSafety: boolean;
    mewsTriage: boolean;
    claimsPreAudit: boolean;
    stockForecasting: boolean;
  };
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: true,
  provider: 'gemini',
  modelName: 'gemini-1.5-flash',
  apiKey: '',
  endpointUrl: '',
  temperature: 0.2,
  maxTokens: 2048,
  features: {
    ambientScribe: true,
    drugSafety: true,
    mewsTriage: true,
    claimsPreAudit: true,
    stockForecasting: true,
  },
};

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
  aiConfig: AISettings;
  websiteConfig: WebsiteCMSConfig;
}

/** Who this clinic is, as shown in the header. Empty until an administrator fills it in (Settings > Clinic profile). */
export interface ClinicProfile {
  name: string;
  branch: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  licenseNo: string;
  /** When the licence expires, as YYYY-MM-DD; empty when not recorded. */
  licenseExpiry: string;
}

export const EMPTY_CLINIC: ClinicProfile = { name: '', branch: '', address: '', phone: '', emergencyPhone: '', licenseNo: '', licenseExpiry: '' };

const clinicFromRow = (d: Record<string, any>): ClinicProfile => ({
  name: d.clinic_name ?? '', branch: d.branch_name ?? '', address: d.address ?? '', phone: d.phone ?? '',
  emergencyPhone: d.emergency_phone ?? '', licenseNo: d.license_no ?? '', licenseExpiry: d.license_expiry ?? '',
});

interface SettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: GlobalSettings) => void;
  updateAISettings: (newAI: AISettings) => void;
  updateWebsiteConfig: (newCms: WebsiteCMSConfig) => void;
  clinic: ClinicProfile;
  /** Saves the clinic profile only (administrators). Throws the database's message on failure. */
  updateClinic: (profile: ClinicProfile) => Promise<void>;
}

const loadStoredAISettings = (): AISettings => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mediclinic_ai_settings');
      if (stored) {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) };
      }
    }
  } catch (err) {
    console.warn('Failed to parse AI settings from storage', err);
  }
  return DEFAULT_AI_SETTINGS;
};

const loadStoredWebsiteConfig = (): WebsiteCMSConfig => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mediclinic_cms_settings');
      if (stored) {
        return { ...DEFAULT_WEBSITE_CONFIG, ...JSON.parse(stored) };
      }
    }
  } catch (err) {
    console.warn('Failed to parse Website CMS settings from storage', err);
  }
  return DEFAULT_WEBSITE_CONFIG;
};

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
  },
  aiConfig: DEFAULT_AI_SETTINGS,
  websiteConfig: DEFAULT_WEBSITE_CONFIG
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(() => ({
    ...DEFAULT_SETTINGS,
    aiConfig: loadStoredAISettings(),
    websiteConfig: loadStoredWebsiteConfig()
  }));
  const [clinic, setClinic] = useState<ClinicProfile>(EMPTY_CLINIC);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('clinic_settings').select('*').eq('id', 1).single();
      if (data && !error) {
        setSettings(prev => ({
          ...prev,
          billing: {
            taxRate: Number(data.tax_rate),
            consultationFee: Number(data.consultation_fee),
            procedureFee: Number(data.procedure_fee)
          },
          modules: data.active_modules,
          hardware: data.hardware_config
        }));
        setClinic(clinicFromRow(data));
      }
    };
    fetchSettings();

    const channel = supabase.channel('settings_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clinic_settings' }, (payload: any) => {
        const data = payload.new;
        setSettings(prev => ({
          ...prev,
          billing: {
            taxRate: Number(data.tax_rate),
            consultationFee: Number(data.consultation_fee),
            procedureFee: Number(data.procedure_fee)
          },
          modules: data.active_modules,
          hardware: data.hardware_config
        }));
        setClinic(clinicFromRow(data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSettings = async (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    
    if (typeof window !== 'undefined') {
      if (newSettings.aiConfig) {
        try {
          localStorage.setItem('mediclinic_ai_settings', JSON.stringify(newSettings.aiConfig));
        } catch (e) {
          console.warn('Failed to persist AI settings to localStorage', e);
        }
      }
      if (newSettings.websiteConfig) {
        try {
          localStorage.setItem('mediclinic_cms_settings', JSON.stringify(newSettings.websiteConfig));
        } catch (e) {
          console.warn('Failed to persist Website CMS settings to localStorage', e);
        }
      }
    }

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

  const updateAISettings = (newAI: AISettings) => {
    updateSettings({
      ...settings,
      aiConfig: newAI
    });
  };

  const updateWebsiteConfig = (newCms: WebsiteCMSConfig) => {
    updateSettings({
      ...settings,
      websiteConfig: newCms
    });
  };

  const updateClinic = async (profile: ClinicProfile) => {
    const { error } = await supabase.from('clinic_settings').upsert({
      id: 1, clinic_name: profile.name.trim() || null, branch_name: profile.branch.trim() || null, address: profile.address.trim() || null,
      phone: profile.phone.trim() || null, emergency_phone: profile.emergencyPhone.trim() || null, license_no: profile.licenseNo.trim() || null,
      license_expiry: profile.licenseExpiry || null,
    });
    if (error) throw new Error(error.message);
    setClinic(profile);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateAISettings, updateWebsiteConfig, clinic, updateClinic }}>
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
