import React, { createContext, useContext, useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';

interface LanguageContextType {
  activeLanguage: Language;
  setActiveLanguage: (lang: Language) => void;
  t: (typeof TRANSLATIONS)[Language];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeLanguage, setActiveLanguage] = useState<Language>('EN');
  return (
    <LanguageContext.Provider value={{ activeLanguage, setActiveLanguage, t: TRANSLATIONS[activeLanguage] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
