import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface DrugBatch {
  id?: string;
  batchId: string;
  stock: number;
  expiryDate: string;
}

export interface DrugItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  price: number;
  tenantId?: string;
  
  expiryDate?: string;
  batches?: DrugBatch[];
  consumptionVelocity?: number;
  
  brandName?: string;
  genericName?: string;
  manufacturer?: string;
  strength?: string;
  strengthUnit?: string;
  drugType?: string; 

  packagingType?: string;
  uom?: string; 
  storageConditions?: string;
  
  isControlledDrug?: boolean;
  contraindications?: string;
  pregnancyCategory?: string;
  indications?: string; 
  sideEffects?: string;
  suggestedDosage?: {
    adults?: string;
    children?: string;
  };

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
  tenantId?: string;
}

interface InventoryContextType {
  catalog: DrugItem[];
  inventory: DrugItem[];
  logs: InventoryLog[];
  addDrug: (drug: Omit<DrugItem, 'id'>) => void;
  restockDrug: (id: string, amount: number, expiryDate?: string) => void;
  deleteDrug: (id: string) => void;
  dispenseDrug: (drugName: string, quantity: number) => void;
  disposeDrug: (id: string, amount: number, reason: string) => void;
  useDrugInternally: (id: string, amount: number, reason: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const BRANCH_TENANTS = ['HQ_KL_MAIN', 'BRANCH_PJ_EXPRESS', 'BRANCH_JB_MEDICAL', 'BRANCH_PENANG_CARE'];

const DEFAULT_50_MEDICINE: DrugItem[] = [
  { id: 'DRUG101', name: 'Paracetamol 500mg', category: 'Analgesics', currentStock: 1200, minThreshold: 300, price: 0.60, drugType: 'Tablet', manufacturer: 'Duopharma Biotech', genericName: 'Paracetamol', isControlledDrug: false, indications: 'Pain relief, fever reduction', suggestedDosage: { adults: '1-2 tabs Q4H-Q6H PRN', children: '1/2-1 tab Q6H PRN' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG102', name: 'Ibuprofen 400mg', category: 'Analgesics / NSAID', currentStock: 850, minThreshold: 200, price: 1.20, drugType: 'Tablet', manufacturer: 'Pharmaniaga', genericName: 'Ibuprofen', isControlledDrug: false, indications: 'Inflammation, joint pain, dysmenorrhea', suggestedDosage: { adults: '1 tab TDS after meals' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG103', name: 'Mefenamic Acid 500mg (Ponstan)', category: 'Analgesics / NSAID', currentStock: 600, minThreshold: 150, price: 1.80, drugType: 'Capsule', manufacturer: 'Pfizer', genericName: 'Mefenamic Acid', isControlledDrug: false, indications: 'Toothache, period pain, headache', suggestedDosage: { adults: '1 cap TDS PC' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG104', name: 'Tramadol HCl 50mg', category: 'Analgesics / Opioid', currentStock: 350, minThreshold: 100, price: 3.50, drugType: 'Capsule', manufacturer: 'Duopharma', genericName: 'Tramadol Hydrochloride', isControlledDrug: true, indications: 'Moderate to severe post-op pain', suggestedDosage: { adults: '1 cap Q6H-Q8H PRN' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG105', name: 'Celecoxib 200mg (Celebrex)', category: 'Analgesics / COX-2', currentStock: 420, minThreshold: 100, price: 4.80, drugType: 'Capsule', manufacturer: 'Viatris', genericName: 'Celecoxib', isControlledDrug: false, indications: 'Osteoarthritis, rheumatoid arthritis', suggestedDosage: { adults: '1 cap daily or BD PC' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG106', name: 'Amoxicillin 500mg', category: 'Antibiotics', currentStock: 950, minThreshold: 250, price: 1.50, drugType: 'Capsule', manufacturer: 'Pharmaniaga', genericName: 'Amoxicillin Trihydrate', isControlledDrug: true, indications: 'URTI, otitis media, skin infections', suggestedDosage: { adults: '1 cap TDS for 7 days' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG107', name: 'Augmentin 625mg (Amox/Clav)', category: 'Antibiotics', currentStock: 540, minThreshold: 150, price: 5.50, drugType: 'Tablet', manufacturer: 'GSK', genericName: 'Amoxicillin + Clavulanic Acid', isControlledDrug: true, indications: 'Complicated bacterial infections, sinusitis', suggestedDosage: { adults: '1 tab BD PC for 5-7 days' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG108', name: 'Azithromycin 250mg (Zithromax)', category: 'Antibiotics', currentStock: 380, minThreshold: 100, price: 6.20, drugType: 'Tablet', manufacturer: 'Pfizer', genericName: 'Azithromycin', isControlledDrug: true, indications: 'Atypical pneumonia, bronchitis, STIs', suggestedDosage: { adults: '500mg stat then 250mg daily' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG109', name: 'Ciprofloxacin 500mg', category: 'Antibiotics', currentStock: 490, minThreshold: 120, price: 2.90, drugType: 'Tablet', manufacturer: 'Bayer', genericName: 'Ciprofloxacin', isControlledDrug: true, indications: 'UTI, gastroenteritis, typhoid', suggestedDosage: { adults: '1 tab BD for 5-10 days' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG110', name: 'Doxycycline 100mg', category: 'Antibiotics', currentStock: 620, minThreshold: 150, price: 1.80, drugType: 'Capsule', manufacturer: 'Sun Pharma', genericName: 'Doxycycline Hcl', isControlledDrug: true, indications: 'Acne vulgaris, Lyme disease, rickettsia', suggestedDosage: { adults: '1 cap BD PC with full glass water' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG111', name: 'Cephalexin 250mg', category: 'Antibiotics', currentStock: 700, minThreshold: 200, price: 1.40, drugType: 'Capsule', manufacturer: 'Duopharma', genericName: 'Cephalexin Monohydrate', isControlledDrug: true, indications: 'SSTIs, urinary tract infections', suggestedDosage: { adults: '1-2 caps Q6H for 7 days' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG112', name: 'Metronidazole 400mg (Flagyl)', category: 'Antibiotics', currentStock: 450, minThreshold: 120, price: 1.60, drugType: 'Tablet', manufacturer: 'Sanofi', genericName: 'Metronidazole', isControlledDrug: true, indications: 'Amoebiasis, giardiasis, anaerobic sepsis', suggestedDosage: { adults: '1 tab TDS for 7 days' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG113', name: 'Cetirizine 10mg (Zyrtec)', category: 'Antihistamines', currentStock: 1100, minThreshold: 250, price: 0.80, drugType: 'Tablet', manufacturer: 'UCB Pharma', genericName: 'Cetirizine Dihydrochloride', isControlledDrug: false, indications: 'Allergic rhinitis, chronic urticaria', suggestedDosage: { adults: '1 tab ON (night)' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG114', name: 'Loratadine 10mg (Claritin)', category: 'Antihistamines', currentStock: 980, minThreshold: 200, price: 0.90, drugType: 'Tablet', manufacturer: 'Bayer', genericName: 'Loratadine', isControlledDrug: false, indications: 'Non-drowsy allergy relief, hay fever', suggestedDosage: { adults: '1 tab daily in the morning' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG115', name: 'Chlorpheniramine 4mg (Piriton)', category: 'Antihistamines', currentStock: 1500, minThreshold: 400, price: 0.30, drugType: 'Tablet', manufacturer: 'GSK', genericName: 'Chlorpheniramine Maleate', isControlledDrug: false, indications: 'Acute itch, insect bites, rhinitis', suggestedDosage: { adults: '1 tab TDS-QDS PRN' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG116', name: 'Fexofenadine 180mg (Telfast)', category: 'Antihistamines', currentStock: 520, minThreshold: 100, price: 3.20, drugType: 'Tablet', manufacturer: 'Sanofi', genericName: 'Fexofenadine HCl', isControlledDrug: false, indications: 'Seasonal allergic rhinitis, skin allergy', suggestedDosage: { adults: '1 tab daily in the morning' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG117', name: 'Desloratadine 5mg (Aerius)', category: 'Antihistamines', currentStock: 460, minThreshold: 100, price: 2.90, drugType: 'Tablet', manufacturer: 'Organon', genericName: 'Desloratadine', isControlledDrug: false, indications: 'Perennial allergic rhinitis, hives', suggestedDosage: { adults: '1 tab daily' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG118', name: 'Amlodipine 5mg (Norvasc)', category: 'Antihypertensives', currentStock: 1300, minThreshold: 300, price: 1.10, drugType: 'Tablet', manufacturer: 'Viatris', genericName: 'Amlodipine Besylate', isControlledDrug: false, indications: 'Essential hypertension, angina', suggestedDosage: { adults: '1 tab daily in morning' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG119', name: 'Losartan 50mg (Cozaar)', category: 'Antihypertensives', currentStock: 1150, minThreshold: 250, price: 1.40, drugType: 'Tablet', manufacturer: 'Organon', genericName: 'Losartan Potassium', isControlledDrug: false, indications: 'Hypertension, diabetic nephropathy', suggestedDosage: { adults: '1 tab daily' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG120', name: 'Perindopril Erbumine 4mg', category: 'Antihypertensives', currentStock: 890, minThreshold: 200, price: 2.20, drugType: 'Tablet', manufacturer: 'Servier', genericName: 'Perindopril', isControlledDrug: false, indications: 'Hypertension, heart failure prevention', suggestedDosage: { adults: '1 tab daily in morning' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG121', name: 'Metoprolol Tartrate 50mg', category: 'Antihypertensives', currentStock: 750, minThreshold: 150, price: 1.60, drugType: 'Tablet', manufacturer: 'AstraZeneca', genericName: 'Metoprolol Tartrate', isControlledDrug: false, indications: 'Hypertension, tachycardia, angina', suggestedDosage: { adults: '1 tab BD' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG122', name: 'Telmisartan 40mg (Micardis)', category: 'Antihypertensives', currentStock: 640, minThreshold: 120, price: 2.80, drugType: 'Tablet', manufacturer: 'Boehringer Ingelheim', genericName: 'Telmisartan', isControlledDrug: false, indications: 'Cardiovascular risk reduction, hypertension', suggestedDosage: { adults: '1 tab daily' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG123', name: 'Hydrochlorothiazide 25mg', category: 'Antihypertensives', currentStock: 810, minThreshold: 200, price: 0.70, drugType: 'Tablet', manufacturer: 'Duopharma', genericName: 'Hydrochlorothiazide', isControlledDrug: false, indications: 'Edema, adjunctive hypertension control', suggestedDosage: { adults: '1 tab daily in morning' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG124', name: 'Metformin 500mg (Glucophage)', category: 'Antidiabetics', currentStock: 1600, minThreshold: 400, price: 0.50, drugType: 'Tablet', manufacturer: 'Merck', genericName: 'Metformin HCl', isControlledDrug: false, indications: 'Type 2 Diabetes Mellitus', suggestedDosage: { adults: '1-2 tabs BD-TDS with meals' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG125', name: 'Gliclazide 80mg (Diamicron)', category: 'Antidiabetics', currentStock: 1050, minThreshold: 250, price: 1.10, drugType: 'Tablet', manufacturer: 'Servier', genericName: 'Gliclazide', isControlledDrug: false, indications: 'T2DM blood glucose lowering', suggestedDosage: { adults: '1-2 tabs daily with breakfast' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG126', name: 'Sitagliptin 100mg (Januvia)', category: 'Antidiabetics', currentStock: 580, minThreshold: 100, price: 5.40, drugType: 'Tablet', manufacturer: 'MSD', genericName: 'Sitagliptin Phosphate', isControlledDrug: false, indications: 'T2DM DPP-4 inhibitor monotherapy/add-on', suggestedDosage: { adults: '1 tab daily' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG127', name: 'Empagliflozin 10mg (Jardiance)', category: 'Antidiabetics', currentStock: 490, minThreshold: 100, price: 6.80, drugType: 'Tablet', manufacturer: 'Boehringer Ingelheim', genericName: 'Empagliflozin', isControlledDrug: false, indications: 'T2DM, heart failure, renal protection', suggestedDosage: { adults: '1 tab daily in morning' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG128', name: 'Insulin Glargine 100 U/ml (Lantus)', category: 'Antidiabetics', currentStock: 210, minThreshold: 50, price: 48.00, drugType: 'Injection / Pen', manufacturer: 'Sanofi', genericName: 'Insulin Glargine', isControlledDrug: false, indications: 'Basal insulin control in diabetes', suggestedDosage: { adults: 'Inject SC once daily ON' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG129', name: 'Omeprazole 20mg (Losec)', category: 'Gastrointestinal', currentStock: 1400, minThreshold: 300, price: 1.20, drugType: 'Capsule', manufacturer: 'AstraZeneca', genericName: 'Omeprazole', isControlledDrug: false, indications: 'GERD, peptic ulcer, gastritis', suggestedDosage: { adults: '1 cap daily 30 mins AC' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG130', name: 'Pantoprazole 40mg (Controloc)', category: 'Gastrointestinal', currentStock: 880, minThreshold: 200, price: 2.50, drugType: 'Tablet', manufacturer: 'Takeda', genericName: 'Pantoprazole Sodium', isControlledDrug: false, indications: 'Erosive esophagitis, Zollinger-Ellison', suggestedDosage: { adults: '1 tab daily before breakfast' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG131', name: 'Gaviscon Liquid 150ml', category: 'Gastrointestinal', currentStock: 320, minThreshold: 80, price: 22.50, drugType: 'Syrup / Suspension', manufacturer: 'Reckitt Benckiser', genericName: 'Sodium Alginate + Antacids', isControlledDrug: false, indications: 'Heartburn relief, acid indigestion', suggestedDosage: { adults: '10-20ml PC and at bedtime' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG132', name: 'Metoclopramide 10mg (Maxolon)', category: 'Gastrointestinal', currentStock: 650, minThreshold: 150, price: 0.90, drugType: 'Tablet', manufacturer: 'Sanofi', genericName: 'Metoclopramide HCl', isControlledDrug: false, indications: 'Nausea, vomiting, gastroparesis', suggestedDosage: { adults: '1 tab TDS 30 mins AC' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG133', name: 'Hyoscine Butylbromide 10mg', category: 'Gastrointestinal', currentStock: 790, minThreshold: 150, price: 1.40, drugType: 'Tablet', manufacturer: 'Sanofi', genericName: 'Hyoscine Butylbromide', isControlledDrug: false, indications: 'Abdominal cramps, bowel spasm', suggestedDosage: { adults: '1-2 tabs TDS-QDS' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG134', name: 'Salbutamol 100mcg (Ventolin)', category: 'Respiratory', currentStock: 450, minThreshold: 100, price: 18.50, drugType: 'Inhaler', manufacturer: 'GSK', genericName: 'Salbutamol Sulfate', isControlledDrug: false, indications: 'Acute bronchospasm, asthma rescue', suggestedDosage: { adults: '1-2 puffs Q4H PRN' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG135', name: 'Budesonide 200mcg (Pulmicort)', category: 'Respiratory', currentStock: 280, minThreshold: 60, price: 42.00, drugType: 'Inhaler', manufacturer: 'AstraZeneca', genericName: 'Budesonide', isControlledDrug: false, indications: 'Maintenance therapy for asthma', suggestedDosage: { adults: '1-2 puffs BD' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG136', name: 'Bromhexine 8mg/5ml Elixir', category: 'Respiratory', currentStock: 390, minThreshold: 90, price: 12.80, drugType: 'Syrup', manufacturer: 'Duopharma', genericName: 'Bromhexine HCl', isControlledDrug: false, indications: 'Productive cough, thick phlegm', suggestedDosage: { adults: '10ml TDS' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG137', name: 'Acetylcysteine 600mg (Fluimucil)', category: 'Respiratory', currentStock: 680, minThreshold: 150, price: 3.20, drugType: 'Tablet (Effervescent)', manufacturer: 'Zambon', genericName: 'Acetylcysteine', isControlledDrug: false, indications: 'Mucus dissolution, paracetamol overdose antidote', suggestedDosage: { adults: '1 tab dissolved in water daily ON' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG138', name: 'Montelukast 10mg (Singulair)', category: 'Respiratory', currentStock: 510, minThreshold: 100, price: 4.90, drugType: 'Tablet', manufacturer: 'Organon', genericName: 'Montelukast Sodium', isControlledDrug: false, indications: 'Asthma prevention, allergic rhinitis', suggestedDosage: { adults: '1 tab ON (night)' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG139', name: 'Atorvastatin 20mg (Lipitor)', category: 'Cardiovascular', currentStock: 1500, minThreshold: 300, price: 2.10, drugType: 'Tablet', manufacturer: 'Viatris', genericName: 'Atorvastatin Calcium', isControlledDrug: false, indications: 'Hypercholesterolemia, ASCVD prevention', suggestedDosage: { adults: '1 tab daily ON' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG140', name: 'Simvastatin 20mg (Zocor)', category: 'Cardiovascular', currentStock: 1100, minThreshold: 250, price: 0.90, drugType: 'Tablet', manufacturer: 'Organon', genericName: 'Simvastatin', isControlledDrug: false, indications: 'Primary hyperlipidemia management', suggestedDosage: { adults: '1 tab daily ON' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG141', name: 'Rosuvastatin 10mg (Crestor)', category: 'Cardiovascular', currentStock: 720, minThreshold: 150, price: 3.80, drugType: 'Tablet', manufacturer: 'AstraZeneca', genericName: 'Rosuvastatin Calcium', isControlledDrug: false, indications: 'Intense LDL cholesterol reduction', suggestedDosage: { adults: '1 tab daily ON' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG142', name: 'Aspirin Low Dose 100mg', category: 'Cardiovascular', currentStock: 1800, minThreshold: 400, price: 0.40, drugType: 'Tablet', manufacturer: 'Reckitt', genericName: 'Aspirin + Glycine', isControlledDrug: false, indications: 'Ischemic stroke & MI prophylaxis', suggestedDosage: { adults: '1 tab daily PC' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG143', name: 'Clopidogrel 75mg (Plavix)', category: 'Cardiovascular', currentStock: 640, minThreshold: 120, price: 3.90, drugType: 'Tablet', manufacturer: 'Sanofi', genericName: 'Clopidogrel Bisulfate', isControlledDrug: false, indications: 'Recent MI, stroke, peripheral arterial disease', suggestedDosage: { adults: '1 tab daily' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG144', name: 'Hydrocortisone 1% Cream 15g', category: 'Dermatological', currentStock: 420, minThreshold: 100, price: 8.50, drugType: 'Topical Cream', manufacturer: 'Duopharma', genericName: 'Hydrocortisone', isControlledDrug: false, indications: 'Eczema, contact dermatitis, insect itch', suggestedDosage: { adults: 'Apply thin layer BD-TDS' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG145', name: 'Mupirocin 2% Ointment (Bactroban)', category: 'Dermatological', currentStock: 310, minThreshold: 80, price: 16.20, drugType: 'Topical Ointment', manufacturer: 'GSK', genericName: 'Mupirocin', isControlledDrug: false, indications: 'Impetigo, folliculitis, MRSA skin lesions', suggestedDosage: { adults: 'Apply to affected area TDS for 10 days' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG146', name: 'Clotrimazole 1% Cream (Canesten)', category: 'Dermatological', currentStock: 530, minThreshold: 120, price: 11.50, drugType: 'Topical Cream', manufacturer: 'Bayer', genericName: 'Clotrimazole', isControlledDrug: false, indications: 'Tinea pedis (athlete foot), ringworm, candidiasis', suggestedDosage: { adults: 'Apply BD for 2-4 weeks' }, tenantId: 'BRANCH_PJ_EXPRESS' },
  { id: 'DRUG147', name: 'Calamine Lotion 120ml', category: 'Dermatological', currentStock: 360, minThreshold: 90, price: 6.80, drugType: 'Topical Lotion', manufacturer: 'Duopharma', genericName: 'Calamine + Zinc Oxide', isControlledDrug: false, indications: 'Chickenpox itch, sunburn, urticaria', suggestedDosage: { adults: 'Dab on affected areas PRN' }, tenantId: 'BRANCH_JB_MEDICAL' },
  { id: 'DRUG148', name: 'Vitamin C 1000mg (Redoxon)', category: 'Vitamins & Minerals', currentStock: 890, minThreshold: 200, price: 1.50, drugType: 'Tablet (Effervescent)', manufacturer: 'Bayer', genericName: 'Ascorbic Acid + Zinc', isControlledDrug: false, indications: 'Immune support, antioxidant', suggestedDosage: { adults: '1 tab dissolved in water daily' }, tenantId: 'BRANCH_PENANG_CARE' },
  { id: 'DRUG149', name: 'Vitamin D3 1000 IU', category: 'Vitamins & Minerals', currentStock: 740, minThreshold: 150, price: 1.20, drugType: 'Capsule', manufacturer: 'Blackmores', genericName: 'Cholecalciferol', isControlledDrug: false, indications: 'Bone density, vitamin D deficiency', suggestedDosage: { adults: '1 cap daily PC' }, tenantId: 'HQ_KL_MAIN' },
  { id: 'DRUG150', name: 'Neurobion Forte (Vit B1+B6+B12)', category: 'Vitamins & Minerals', currentStock: 1150, minThreshold: 250, price: 1.80, drugType: 'Tablet', manufacturer: 'P&G Health', genericName: 'Thiamine + Pyridoxine + Cyanocobalamin', isControlledDrug: false, indications: 'Peripheral neuropathy, numbness, nerve pain', suggestedDosage: { adults: '1 tab TDS PC' }, tenantId: 'BRANCH_PJ_EXPRESS' }
];

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<DrugItem[]>(DEFAULT_50_MEDICINE);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const { user } = useAuth();

  const fetchInventory = async () => {
    const { data: invData, error: invErr } = await supabase.from('inventory').select('*, drug_batches(*)');
    if (invData && invData.length > 0 && !invErr) {
      const mapped = invData.map((d: any) => ({
        id: d.id,
        name: d.drug_name,
        category: d.category,
        currentStock: d.stock_level,
        minThreshold: d.min_threshold,
        price: Number(d.price),
        expiryDate: d.expiry_date,
        drugType: d.drug_type,
        manufacturer: d.manufacturer,
        genericName: d.generic_name,
        isControlledDrug: d.is_controlled_drug,
        indications: d.indications,
        sideEffects: d.side_effects,
        suggestedDosage: d.suggested_dosage,
        batches: d.drug_batches?.map((b: any) => ({
          id: b.id,
          batchId: b.batch_number,
          stock: b.stock_level,
          expiryDate: b.expiry_date
        })) || []
      }));
      setCatalog(mapped);
    } else {
      setCatalog(DEFAULT_50_MEDICINE);
    }
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase.from('inventory_logs').select('*, inventory(drug_name)').order('created_at', { ascending: false });
    if (data && !error) {
      setLogs(data.map((l: any) => ({
        id: l.id,
        date: l.created_at,
        drugId: l.inventory_id,
        drugName: l.inventory?.drug_name || 'Unknown',
        type: l.type as any,
        amount: l.amount,
        reason: l.reason
      })));
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchLogs();

    const channel = supabase.channel('inventory_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchInventory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drug_batches' }, fetchInventory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, fetchLogs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addDrug = async (drugData: Omit<DrugItem, 'id'>) => {
    try {
      await supabase.from('inventory').insert([{
        drug_name: drugData.name,
        category: drugData.category,
        stock_level: drugData.currentStock || 0,
        min_threshold: drugData.minThreshold,
        price: drugData.price,
        drug_type: drugData.drugType,
        manufacturer: drugData.manufacturer,
        generic_name: drugData.genericName,
        is_controlled_drug: drugData.isControlledDrug,
        indications: drugData.indications,
        side_effects: drugData.sideEffects,
        suggested_dosage: drugData.suggestedDosage,
        expiry_date: drugData.expiryDate
      }]);
    } catch (err) {
      console.error('Add drug error', err);
    }
  };

  const restockDrug = async (id: string, amount: number, expiryDate?: string) => {
    const drug = catalog.find(d => d.id === id);
    if (!drug) return;
    
    const newBatchId = `B-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newExpiry = expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await supabase.from('drug_batches').insert([{
        inventory_id: id,
        batch_number: newBatchId,
        stock_level: amount,
        expiry_date: newExpiry
      }]);

      await supabase.from('inventory').update({
        stock_level: drug.currentStock + amount
      }).eq('id', id);

      await supabase.from('inventory_logs').insert([{
        inventory_id: id,
        user_id: user?.id,
        type: 'Restock',
        amount: amount,
        reason: `Batch ${newBatchId} received`
      }]);
    } catch (err) {
      console.error('Restock error', err);
    }
  };

  const deleteDrug = async (id: string) => {
    try {
      await supabase.from('inventory').delete().eq('id', id);
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const processFIFODeduction = async (drug: DrugItem, quantityToDeduct: number, reason: string, logType: string) => {
    if (!drug.batches || drug.batches.length === 0) {
      // Just deduct main stock
      await supabase.from('inventory').update({
        stock_level: Math.max(0, drug.currentStock - quantityToDeduct)
      }).eq('id', drug.id);
      
      await supabase.from('inventory_logs').insert([{
        inventory_id: drug.id,
        user_id: user?.id,
        type: logType,
        amount: quantityToDeduct,
        reason: reason
      }]);
      return;
    }

    let remaining = quantityToDeduct;
    const sortedBatches = [...drug.batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    
    for (const batch of sortedBatches) {
      if (remaining <= 0) break;
      
      if (batch.stock > 0) {
        const deductFromBatch = Math.min(batch.stock, remaining);
        remaining -= deductFromBatch;
        
        // Update this batch in Supabase
        await supabase.from('drug_batches').update({
          stock_level: batch.stock - deductFromBatch
        }).eq('id', batch.id);
      }
    }

    // Update main stock
    await supabase.from('inventory').update({
      stock_level: Math.max(0, drug.currentStock - quantityToDeduct)
    }).eq('id', drug.id);

    // Add log
    await supabase.from('inventory_logs').insert([{
      inventory_id: drug.id,
      user_id: user?.id,
      type: logType,
      amount: quantityToDeduct,
      reason: reason
    }]);
  };

  const dispenseDrug = async (drugName: string, quantity: number) => {
    const matchedDrug = catalog.find(drug => 
      drug.name.toLowerCase().includes(drugName.toLowerCase()) || 
      drugName.toLowerCase().includes(drug.name.toLowerCase())
    );

    if (matchedDrug) {
      await processFIFODeduction(matchedDrug, quantity, 'Patient Prescription', 'Dispensed');
    }
  };

  const disposeDrug = async (id: string, amount: number, reason: string) => {
    const drug = catalog.find(d => d.id === id);
    if (drug) await processFIFODeduction(drug, amount, reason, 'Disposal');
  };

  const useDrugInternally = async (id: string, amount: number, reason: string) => {
    const drug = catalog.find(d => d.id === id);
    if (drug) await processFIFODeduction(drug, amount, reason, 'Internal Use');
  };

  return (
    <InventoryContext.Provider value={{ catalog, inventory: catalog, logs, addDrug, restockDrug, deleteDrug, dispenseDrug, disposeDrug, useDrugInternally }}>
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
