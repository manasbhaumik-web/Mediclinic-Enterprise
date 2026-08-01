import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { TPAConfig, ICD10Code } from '../types';

interface AuxiliaryContextType {
  tpaList: TPAConfig[];
  icd10Catalog: ICD10Code[];
  isLoading: boolean;
  refreshAuxiliary: () => Promise<void>;
}

const AuxiliaryContext = createContext<AuxiliaryContextType>({
  tpaList: [],
  icd10Catalog: [],
  isLoading: true,
  refreshAuxiliary: async () => {},
});

export const AuxiliaryProvider = ({ children }: { children: ReactNode }) => {
  const [tpaList, setTpaList] = useState<TPAConfig[]>([]);
  const [icd10Catalog, setIcd10Catalog] = useState<ICD10Code[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuxiliary = async () => {
    try {
      const [tpaRes, icdRes] = await Promise.all([
        supabase.from('tpa_config').select('*'),
        supabase.from('icd10_catalog').select('*')
      ]);

      if (tpaRes.data) {
        setTpaList(tpaRes.data.map((d: any) => ({
          name: d.name,
          coverageLimit: d.coverage_limit,
          coPayRequired: d.co_pay_required,
          coPayPercentage: d.co_pay_percentage
        })));
      }

      if (icdRes.data) {
        setIcd10Catalog(icdRes.data.map((d: any) => ({
          code: d.code,
          desc: d.description,
          category: d.category
        })));
      }
    } catch (error) {
      console.error('Failed to load auxiliary catalogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxiliary();
  }, []);

  return (
    <AuxiliaryContext.Provider value={{ tpaList, icd10Catalog, isLoading, refreshAuxiliary: fetchAuxiliary }}>
      {children}
    </AuxiliaryContext.Provider>
  );
};

export const useAuxiliary = () => useContext(AuxiliaryContext);
