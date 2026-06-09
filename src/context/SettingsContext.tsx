import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const updateSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings);
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
