import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DrugItem {
  id: string;
  name: string; // Brand Name / Trade Name
  category: string;
  currentStock: number;
  minThreshold: number;
  price: number; // Selling Price
  
  // Predictive Supply Chain (AI)
  expiryDate?: string;
  consumptionVelocity?: number; // Estimated units sold per week
  
  // 1. Core Drug Identification
  brandName?: string;
  genericName?: string;
  manufacturer?: string;
  // 2. Strength & Form
  strength?: string;
  strengthUnit?: string;
  drugType?: string; // Dosage Form e.g. Tablet, Syrup, Injection

  // 3. Inventory & Packaging Controls
  packagingType?: string;
  uom?: string; // Unit of Measurement for dispensing
  storageConditions?: string;
  
  // 4. Clinical & Safety Flags
  isControlledDrug?: boolean;
  contraindications?: string;
  pregnancyCategory?: string;
  indications?: string; // Used for which disease
  sideEffects?: string;
  suggestedDosage?: {
    adults?: string;
    children?: string;
  };

  // 5. Pricing & Billing Details
  costPrice?: number;
  taxRate?: number;
  isInsuranceClaimable?: boolean;
}

export interface InventoryLog {
  id: string;
  date: string;
  drugId: string;
  drugName: string;
  type: 'Disposal' | 'Internal Use' | 'Dispensed';
  amount: number;
  reason: string;
}

interface InventoryContextType {
  catalog: DrugItem[];
  logs: InventoryLog[];
  addDrug: (drug: Omit<DrugItem, 'id'>) => void;
  restockDrug: (id: string, amount: number) => void;
  deleteDrug: (id: string) => void;
  dispenseDrug: (drugName: string, quantity: number) => void;
  disposeDrug: (id: string, amount: number, reason: string) => void;
  useDrugInternally: (id: string, amount: number, reason: string) => void;
}

const DEFAULT_CATALOG: DrugItem[] = [
  { 
    id: 'DRG-001', 
    name: 'Paracetamol 500mg', 
    category: 'Analgesics', 
    currentStock: 1200, 
    minThreshold: 500, 
    price: 0.50,
    expiryDate: '2026-08-15', // Expiring relatively soon
    consumptionVelocity: 350,
    drugType: 'Tablet',
    manufacturer: 'PharmaCorp',
    genericName: 'Paracetamol',
    isControlledDrug: false,
    indications: 'Fever, mild to moderate pain, headache.',
    sideEffects: 'Rarely nausea or rash. Liver damage in severe overdose.',
    suggestedDosage: { adults: '1-2 tablets every 4-6 hours', children: 'Not recommended for <12 yrs in this strength' }
  },
  { 
    id: 'DRG-002', 
    name: 'Amoxicillin 250mg', 
    category: 'Antibiotics', 
    currentStock: 45, 
    minThreshold: 100, 
    price: 1.20,
    expiryDate: '2027-11-20',
    consumptionVelocity: 80,
    drugType: 'Capsule',
    manufacturer: 'MediLife',
    genericName: 'Amoxicillin',
    isControlledDrug: false,
    indications: 'Bacterial infections (respiratory, ear, throat).',
    sideEffects: 'Diarrhea, stomach upset, rash, allergic reactions.',
    suggestedDosage: { adults: '1 capsule every 8 hours', children: 'Depends on body weight, usually syrup form' }
  },
  { 
    id: 'DRG-003', 
    name: 'Lisinopril 10mg', 
    category: 'Cardiovascular', 
    currentStock: 300, 
    minThreshold: 200, 
    price: 2.50,
    expiryDate: '2028-01-10',
    consumptionVelocity: 150,
    drugType: 'Tablet',
    manufacturer: 'CardioMeds',
    genericName: 'Lisinopril',
    isControlledDrug: false,
    indications: 'Hypertension, heart failure.',
    sideEffects: 'Dry cough, dizziness, elevated potassium.',
    suggestedDosage: { adults: '1 tablet daily', children: 'Consult pediatrician' }
  },
  { 
    id: 'DRG-004', 
    name: 'Salbutamol Inhaler', 
    category: 'Respiratory', 
    currentStock: 15, 
    minThreshold: 50, 
    price: 15.00,
    expiryDate: '2026-07-05', // Expiring very soon!
    consumptionVelocity: 25,
    drugType: 'Inhaler',
    manufacturer: 'BreatheEasy',
    genericName: 'Salbutamol / Albuterol',
    isControlledDrug: false,
    indications: 'Asthma, COPD, bronchospasm relief.',
    sideEffects: 'Tremor, increased heart rate, headache.',
    suggestedDosage: { adults: '1-2 puffs every 4-6 hours PRN', children: '1-2 puffs every 4-6 hours PRN (with spacer)' }
  },
  { 
    id: 'DRG-005', 
    name: 'Diazepam 5mg', 
    category: 'Psychotropics', 
    currentStock: 200, 
    minThreshold: 100, 
    price: 3.00,
    expiryDate: '2029-05-15',
    consumptionVelocity: 10,
    drugType: 'Tablet',
    manufacturer: 'NeuroPharma',
    genericName: 'Diazepam',
    isControlledDrug: true, // Controlled
    indications: 'Severe anxiety, muscle spasms, alcohol withdrawal.',
    sideEffects: 'Drowsiness, fatigue, muscle weakness, dependence.',
    suggestedDosage: { adults: '1 tablet 2-4 times daily', children: 'Contraindicated unless directed by specialist' }
  }
];

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<DrugItem[]>(DEFAULT_CATALOG);
  const [logs, setLogs] = useState<InventoryLog[]>([]);

  const addDrug = (drugData: Omit<DrugItem, 'id'>) => {
    const newDrug: DrugItem = {
      id: `M${Math.floor(Math.random() * 900) + 100}`,
      ...drugData
    };
    setCatalog(prev => [...prev, newDrug]);
  };

  const restockDrug = (id: string, amount: number) => {
    setCatalog(prev => prev.map(drug => 
      drug.id === id ? { ...drug, currentStock: drug.currentStock + amount } : drug
    ));
  };

  const deleteDrug = (id: string) => {
    setCatalog(prev => prev.filter(drug => drug.id !== id));
  };

  const dispenseDrug = (drugName: string, quantity: number) => {
    let matchedDrug: DrugItem | undefined;
    setCatalog(prev => prev.map(drug => {
      const isMatch = drug.name.toLowerCase().includes(drugName.toLowerCase()) || 
                      drugName.toLowerCase().includes(drug.name.toLowerCase());
      
      if (isMatch) {
        matchedDrug = drug;
        return { ...drug, currentStock: Math.max(0, drug.currentStock - quantity) };
      }
      return drug;
    }));

    if (matchedDrug) {
      setLogs(prev => [{
        id: `L${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        drugId: matchedDrug!.id,
        drugName: matchedDrug!.name,
        type: 'Dispensed',
        amount: quantity,
        reason: 'Patient Prescription'
      }, ...prev]);
    }
  };

  const logDeduction = (id: string, amount: number, reason: string, type: 'Disposal' | 'Internal Use') => {
    let drugName = '';
    setCatalog(prev => prev.map(drug => {
      if (drug.id === id) {
        drugName = drug.name;
        return { ...drug, currentStock: Math.max(0, drug.currentStock - amount) };
      }
      return drug;
    }));

    if (drugName) {
      setLogs(prev => [{
        id: `L${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        drugId: id,
        drugName,
        type,
        amount,
        reason
      }, ...prev]);
    }
  };

  const disposeDrug = (id: string, amount: number, reason: string) => {
    logDeduction(id, amount, reason, 'Disposal');
  };

  const useDrugInternally = (id: string, amount: number, reason: string) => {
    logDeduction(id, amount, reason, 'Internal Use');
  };

  return (
    <InventoryContext.Provider value={{ catalog, logs, addDrug, restockDrug, deleteDrug, dispenseDrug, disposeDrug, useDrugInternally }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
