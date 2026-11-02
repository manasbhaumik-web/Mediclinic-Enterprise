import { describe, it, expect } from 'vitest';
import { auditPanelClaim } from './claimsPreAudit';

describe('AI Claims Pre-Audit Engine', () => {
  it('flags clean status with 99% approval probability for compliant claim', () => {
    const claim = {
      id: 'TRX-1001',
      panelClaimed: 85.0,
      paidAmount: 10.0,
      glNumber: 'GL-MICARE-2026-9912',
      patientName: 'Ahmad Faiz',
      panelName: 'MiCare',
      receiptNo: 'REC-2026-0042',
    };

    const audit = auditPanelClaim(claim);
    expect(audit.status).toBe('clean');
    expect(audit.approvalProbability).toBe(99);
    expect(audit.findings.length).toBe(0);
    expect(audit.badgeTone).toBe('ok');
  });

  it('flags missing GL number as high rejection risk', () => {
    const claim = {
      id: 'TRX-1002',
      panelClaimed: 95.0,
      glNumber: '',
      patientName: 'Tan Wei Ming',
      receiptNo: 'REC-2026-0043',
    };

    const audit = auditPanelClaim(claim);
    expect(audit.status).toBe('flagged');
    expect(audit.approvalProbability).toBeLessThan(60);
    expect(audit.findings).toContain('Missing Guarantee Letter (GL) Reference');
    expect(audit.badgeTone).toBe('bad');
  });

  it('generates warning on high claim value (> RM 250)', () => {
    const claim = {
      id: 'TRX-1003',
      panelClaimed: 295.0,
      glNumber: 'GL-AIA-88219',
      receiptNo: 'REC-2026-0044',
    };

    const audit = auditPanelClaim(claim);
    expect(audit.status).toBe('warning');
    expect(audit.findings.some(f => f.includes('High Claim Value'))).toBe(true);
    expect(audit.badgeTone).toBe('warn');
  });
});
