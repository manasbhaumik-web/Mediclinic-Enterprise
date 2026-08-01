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

interface SettingsContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: GlobalSettings) => void;
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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
