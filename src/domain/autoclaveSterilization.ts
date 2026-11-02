export type AutoclaveCycleProgram = '134C_Porous_2.1bar' | '121C_Rubber_1.1bar';

export interface SterilePack {
  packId: string; // e.g. "SET-SUT-20261101-01"
  packType: 'SutureSet' | 'IncisionDrainageSet' | 'BiopsyExcisionSet' | 'DressingForcepsSet' | 'DentalExtractionSet';
  sterilizedAt: string; // ISO
  expiryDate: string; // YYYY-MM-DD (typically 30 days)
  isUsed: boolean;
  usedInVisitId?: string;
}

export interface AutoclaveCycleRecord {
  id: string;
  cycleNumber: string; // e.g. "CYCLE-20261101-01"
  timestamp: string;
  autoclaveUnitId: string; // e.g. "AUTOCLAVE-01 (Tuttnauer 2540M)"
  program: AutoclaveCycleProgram;
  achievedTemperatureC: number;
  achievedPressureBar: number;
  holdingTimeMinutes: number;
  chemicalIndicatorPassed: boolean; // Class 4/5/6 strip pass
  biologicalSporeTestValid: boolean; // Geobacillus stearothermophilus weekly verification
  operatorNurseId: string;
  operatorNurseName: string;
  isCycleCompliant: boolean;
  nonComplianceReason?: string;
  packsGenerated: SterilePack[];
}

export function validateAutoclaveCycle(params: {
  program: AutoclaveCycleProgram;
  achievedTemperatureC: number;
  achievedPressureBar: number;
  holdingTimeMinutes: number;
  chemicalIndicatorPassed: boolean;
  biologicalSporeTestValid: boolean;
}): { isCompliant: boolean; error?: string } {
  if (!params.chemicalIndicatorPassed) {
    return { isCompliant: false, error: 'Chemical indicator Class 5/6 tape failed color transition.' };
  }
  if (!params.biologicalSporeTestValid) {
    return { isCompliant: false, error: 'Weekly biological spore test (Geobacillus stearothermophilus) unverified or overdue.' };
  }

  if (params.program === '134C_Porous_2.1bar') {
    if (params.achievedTemperatureC < 134) {
      return { isCompliant: false, error: `Temperature ${params.achievedTemperatureC}°C below required 134°C.` };
    }
    if (params.achievedPressureBar < 2.05) {
      return { isCompliant: false, error: `Pressure ${params.achievedPressureBar} bar below required 2.1 bar threshold.` };
    }
    if (params.holdingTimeMinutes < 3.5) {
      return { isCompliant: false, error: `Hold time ${params.holdingTimeMinutes}m below statutory 3.5 min holding phase.` };
    }
  } else if (params.program === '121C_Rubber_1.1bar') {
    if (params.achievedTemperatureC < 121) {
      return { isCompliant: false, error: `Temperature ${params.achievedTemperatureC}°C below required 121°C.` };
    }
    if (params.achievedPressureBar < 1.05) {
      return { isCompliant: false, error: `Pressure ${params.achievedPressureBar} bar below required 1.1 bar threshold.` };
    }
    if (params.holdingTimeMinutes < 15) {
      return { isCompliant: false, error: `Hold time ${params.holdingTimeMinutes}m below required 15 min holding phase.` };
    }
  }

  return { isCompliant: true };
}

export function logAutoclaveCycle(params: {
  cycleNumber: string;
  autoclaveUnitId: string;
  program: AutoclaveCycleProgram;
  achievedTemperatureC: number;
  achievedPressureBar: number;
  holdingTimeMinutes: number;
  chemicalIndicatorPassed: boolean;
  biologicalSporeTestValid: boolean;
  operatorNurseId: string;
  operatorNurseName: string;
  packTypes: SterilePack['packType'][];
  customDate?: string;
}): AutoclaveCycleRecord {
  const evalResult = validateAutoclaveCycle(params);
  const now = params.customDate ? new Date(params.customDate) : new Date();
  
  // Calculate 30-day expiry for pouches
  const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const packs: SterilePack[] = evalResult.isCompliant
    ? params.packTypes.map((type, idx) => ({
        packId: `PACK-${type.substring(0, 3).toUpperCase()}-${params.cycleNumber.replace('CYCLE-', '')}-${(idx + 1).toString().padStart(2, '0')}`,
        packType: type,
        sterilizedAt: now.toISOString(),
        expiryDate,
        isUsed: false
      }))
    : [];

  return {
    id: `cycle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    cycleNumber: params.cycleNumber,
    timestamp: now.toISOString(),
    autoclaveUnitId: params.autoclaveUnitId,
    program: params.program,
    achievedTemperatureC: params.achievedTemperatureC,
    achievedPressureBar: params.achievedPressureBar,
    holdingTimeMinutes: params.holdingTimeMinutes,
    chemicalIndicatorPassed: params.chemicalIndicatorPassed,
    biologicalSporeTestValid: params.biologicalSporeTestValid,
    operatorNurseId: params.operatorNurseId,
    operatorNurseName: params.operatorNurseName,
    isCycleCompliant: evalResult.isCompliant,
    nonComplianceReason: evalResult.error,
    packsGenerated: packs
  };
}

export function verifyPackForProcedure(
  pack: SterilePack,
  referenceDate = new Date()
): { isValid: boolean; reason?: string } {
  if (pack.isUsed) {
    return { isValid: false, reason: `Instrument pack ${pack.packId} was already used in visit ${pack.usedInVisitId || 'UNKNOWN'}.` };
  }
  const expiryTime = new Date(pack.expiryDate + 'T23:59:59').getTime();
  if (expiryTime < referenceDate.getTime()) {
    return { isValid: false, reason: `Instrument pack ${pack.packId} expired on ${pack.expiryDate}. Resterilization required.` };
  }
  return { isValid: true };
}
