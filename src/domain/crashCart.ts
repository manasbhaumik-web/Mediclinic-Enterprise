/**
 * Emergency Crash Cart & Resuscitation Equipment Readiness Domain
 * Regulatory Standard: Private Healthcare Facilities and Services Act 1998 (PHFSA 1998 Part V)
 */

export interface EmergencyDrugItem {
  name: string;
  requiredQty: number;
  availableQty: number;
  expiryDate: string;
  isExpired: boolean;
}

export interface CrashCartInspectionRecord {
  id: string;
  inspectedAt: string;
  shift: 'Morning (08:00)' | 'Evening (16:00)' | 'Post-Resuscitation Restock';
  inspectorNurse: string;
  inspectorMmcSupervisor?: string;
  tamperSealNumber: string;
  isSealIntact: boolean;
  
  // Airway & Breathing
  oxygenPsi: number;
  isOxygenCompliant: boolean; // >= 1000 PSI
  ambuBagAdultTested: boolean;
  ambuBagPediatricTested: boolean;
  suctionMachineVacuumTested: boolean;

  // Circulation & Defibrillation
  aedPowerOnTested: boolean;
  aedBatteryOk: boolean;
  aedAdultPadsExpiry: string;
  aedPediatricPadsExpiry: string;

  // Emergency Drug Tray
  drugs: EmergencyDrugItem[];

  // Readiness Verdict
  isFullyReady: boolean;
  criticalDefects: string[];
}

export const MANDATORY_CRASH_CART_DRUGS = [
  { name: 'Adrenaline (Epinephrine) 1:1000 (1mg/ml)', requiredQty: 5 },
  { name: 'Atropine Sulphate 0.5mg/ml', requiredQty: 5 },
  { name: 'Hydrocortisone Sodium Succinate 100mg', requiredQty: 2 },
  { name: 'Dextrose 50% 50ml Vial', requiredQty: 2 },
  { name: 'Salbutamol 5mg/2.5ml Respirator Solution', requiredQty: 5 },
  { name: 'Normal Saline 0.9% 500ml Infusion Bottle', requiredQty: 2 }
];

export function evaluateCrashCartReadiness(params: {
  oxygenPsi: number;
  isSealIntact: boolean;
  ambuBagAdultTested: boolean;
  ambuBagPediatricTested: boolean;
  suctionMachineVacuumTested: boolean;
  aedPowerOnTested: boolean;
  aedBatteryOk: boolean;
  aedAdultPadsExpiry: string;
  aedPediatricPadsExpiry: string;
  drugs: { name: string; availableQty: number; expiryDate: string }[];
  currentDate?: Date;
}): { isFullyReady: boolean; criticalDefects: string[]; isOxygenCompliant: boolean } {
  const defects: string[] = [];
  const now = params.currentDate || new Date();

  // 1. Oxygen Check (>= 1000 PSI)
  const isOxygenCompliant = params.oxygenPsi >= 1000;
  if (!isOxygenCompliant) {
    defects.push(`Oxygen cylinder pressure critical (${params.oxygenPsi} PSI < 1000 PSI minimum)`);
  }

  // 2. Airway & Suction
  if (!params.ambuBagAdultTested) defects.push('Adult Ambu Bag valve check unverified');
  if (!params.ambuBagPediatricTested) defects.push('Pediatric Ambu Bag valve check unverified');
  if (!params.suctionMachineVacuumTested) defects.push('Suction machine vacuum draw unverified');

  // 3. Defibrillation
  if (!params.aedPowerOnTested || !params.aedBatteryOk) {
    defects.push('AED / Defibrillator self-test failed or low battery');
  }

  const adultPadExp = new Date(params.aedAdultPadsExpiry);
  if (isNaN(adultPadExp.getTime()) || adultPadExp < now) {
    defects.push('AED adult electrode pads expired');
  }

  const pedsPadExp = new Date(params.aedPediatricPadsExpiry);
  if (isNaN(pedsPadExp.getTime()) || pedsPadExp < now) {
    defects.push('AED pediatric electrode pads expired');
  }

  // 4. Drug Tray Expiry & Quantities
  for (const req of MANDATORY_CRASH_CART_DRUGS) {
    const found = params.drugs.find(d => d.name === req.name);
    if (!found || found.availableQty < req.requiredQty) {
      defects.push(`Missing or deficient drug: ${req.name} (${found?.availableQty || 0}/${req.requiredQty})`);
    } else {
      const drugExp = new Date(found.expiryDate);
      if (isNaN(drugExp.getTime()) || drugExp < now) {
        defects.push(`Expired emergency drug: ${req.name} (Expired on ${found.expiryDate})`);
      }
    }
  }

  // 5. Seal Integrity
  if (!params.isSealIntact) {
    defects.push('Tamper-evident break-away seal broken without documented post-resuscitation audit');
  }

  return {
    isFullyReady: defects.length === 0,
    criticalDefects: defects,
    isOxygenCompliant
  };
}

export function createCrashCartInspectionRecord(params: {
  shift: 'Morning (08:00)' | 'Evening (16:00)' | 'Post-Resuscitation Restock';
  inspectorNurse: string;
  inspectorMmcSupervisor?: string;
  tamperSealNumber: string;
  isSealIntact: boolean;
  oxygenPsi: number;
  ambuBagAdultTested: boolean;
  ambuBagPediatricTested: boolean;
  suctionMachineVacuumTested: boolean;
  aedPowerOnTested: boolean;
  aedBatteryOk: boolean;
  aedAdultPadsExpiry: string;
  aedPediatricPadsExpiry: string;
  drugs: { name: string; availableQty: number; expiryDate: string }[];
  currentDate?: Date;
}): CrashCartInspectionRecord {
  const evalResult = evaluateCrashCartReadiness({
    oxygenPsi: params.oxygenPsi,
    isSealIntact: params.isSealIntact,
    ambuBagAdultTested: params.ambuBagAdultTested,
    ambuBagPediatricTested: params.ambuBagPediatricTested,
    suctionMachineVacuumTested: params.suctionMachineVacuumTested,
    aedPowerOnTested: params.aedPowerOnTested,
    aedBatteryOk: params.aedBatteryOk,
    aedAdultPadsExpiry: params.aedAdultPadsExpiry,
    aedPediatricPadsExpiry: params.aedPediatricPadsExpiry,
    drugs: params.drugs,
    currentDate: params.currentDate
  });

  const now = (params.currentDate || new Date()).toISOString();

  const formattedDrugs: EmergencyDrugItem[] = params.drugs.map(d => {
    const dDate = new Date(d.expiryDate);
    return {
      name: d.name,
      requiredQty: MANDATORY_CRASH_CART_DRUGS.find(m => m.name === d.name)?.requiredQty || 1,
      availableQty: d.availableQty,
      expiryDate: d.expiryDate,
      isExpired: !isNaN(dDate.getTime()) && dDate < (params.currentDate || new Date())
    };
  });

  return {
    id: `CART-${Date.now()}`,
    inspectedAt: now,
    shift: params.shift,
    inspectorNurse: params.inspectorNurse,
    inspectorMmcSupervisor: params.inspectorMmcSupervisor || 'Dr. Medical Director',
    tamperSealNumber: params.tamperSealNumber,
    isSealIntact: params.isSealIntact,
    oxygenPsi: params.oxygenPsi,
    isOxygenCompliant: evalResult.isOxygenCompliant,
    ambuBagAdultTested: params.ambuBagAdultTested,
    ambuBagPediatricTested: params.ambuBagPediatricTested,
    suctionMachineVacuumTested: params.suctionMachineVacuumTested,
    aedPowerOnTested: params.aedPowerOnTested,
    aedBatteryOk: params.aedBatteryOk,
    aedAdultPadsExpiry: params.aedAdultPadsExpiry,
    aedPediatricPadsExpiry: params.aedPediatricPadsExpiry,
    drugs: formattedDrugs,
    isFullyReady: evalResult.isFullyReady,
    criticalDefects: evalResult.criticalDefects
  };
}

export function exportCrashCartLogText(r: CrashCartInspectionRecord): string {
  return [
    '========================================================================',
    '       MEDICLINIC ENTERPRISE HEALTHCARE GROUP',
    '    DAILY EMERGENCY CRASH CART AUDIT (PHFSA 1998 PART V REGULATION)',
    '========================================================================',
    `Audit Record ID:    ${r.id}`,
    `Date & Time:        ${new Date(r.inspectedAt).toLocaleString('en-GB')}`,
    `Shift:              ${r.shift}`,
    `Inspector (Staff):  ${r.inspectorNurse}`,
    `Clinical Supervisor:${r.inspectorMmcSupervisor}`,
    `Tamper Seal ID:     ${r.tamperSealNumber} (Intact: ${r.isSealIntact ? 'YES' : 'BROKEN'})`,
    '------------------------------------------------------------------------',
    'RESUSCITATION EQUIPMENT READINESS STATUS:',
    `Medical Oxygen:     ${r.oxygenPsi} PSI (Minimum 1000 PSI) -> [${r.isOxygenCompliant ? 'PASS' : 'FAIL'}]`,
    `Suction Machine:    Vacuum Verified -> [${r.suctionMachineVacuumTested ? 'PASS' : 'FAIL'}]`,
    `Ambu Bag (Adult):   Valve & Seal -> [${r.ambuBagAdultTested ? 'PASS' : 'FAIL'}]`,
    `Ambu Bag (Pediatric): Valve & Seal -> [${r.ambuBagPediatricTested ? 'PASS' : 'FAIL'}]`,
    `AED Defibrillator:  Power-On & Battery -> [${r.aedPowerOnTested && r.aedBatteryOk ? 'PASS' : 'FAIL'}]`,
    `AED Adult Pads:     Expiry: ${r.aedAdultPadsExpiry}`,
    `AED Pediatric Pads: Expiry: ${r.aedPediatricPadsExpiry}`,
    '------------------------------------------------------------------------',
    'EMERGENCY RESUSCITATION DRUG TRAY:',
    ...r.drugs.map(d => `• ${d.name}: ${d.availableQty}/${d.requiredQty} [Exp: ${d.expiryDate}] ${d.isExpired ? '*** EXPIRED ***' : '✓ OK'}`),
    '------------------------------------------------------------------------',
    `FINAL READINESS VERDICT: [${r.isFullyReady ? '✓ OPERATIONAL / AUDIT READY' : '⚠ COMPROMISED / DEFECTS PRESENT'}]`,
    ...(r.criticalDefects.length > 0 ? ['CRITICAL DEFECTS IDENTIFIED:', ...r.criticalDefects.map(def => `  - ${def}`)] : []),
    '========================================================================',
  ].join('\n');
}
