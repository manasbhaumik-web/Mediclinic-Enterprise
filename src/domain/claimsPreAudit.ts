/**
 * AI-Assisted Corporate Panel Claims Pre-Auditor.
 * Pre-screens outpatient insurance and corporate panel claims before dispatching
 * to TPA gateways (MiCare, HealthMetrics, PMCare, AIA, Great Eastern).
 */

export interface PanelClaimInput {
  id: string;
  panelClaimed: number;
  paidAmount?: number;
  glNumber?: string | null;
  patientName?: string | null;
  panelName?: string | null;
  receiptNo?: string | null;
  status?: string;
}

export type ClaimAuditStatus = 'clean' | 'warning' | 'flagged';

export interface ClaimAuditResult {
  status: ClaimAuditStatus;
  approvalProbability: number; // 0 to 100
  badgeTone: 'ok' | 'warn' | 'bad';
  summary: string;
  findings: string[];
  recommendations: string[];
}

export function auditPanelClaim(claim: PanelClaimInput): ClaimAuditResult {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 0; // 0 (best) to 100 (worst)

  const gl = (claim.glNumber || '').trim();
  const claimed = Number(claim.panelClaimed) || 0;

  // 1. Guarantee Letter Check
  if (!gl || gl.toUpperCase() === 'N/A' || gl === '-') {
    findings.push('Missing Guarantee Letter (GL) Reference');
    recommendations.push('Obtain e-GL or corporate policy authorization number before submitting.');
    riskScore += 50;
  } else if (gl.length < 5) {
    findings.push('Abbreviated GL reference format');
    recommendations.push('Verify complete GL number matches corporate statement.');
    riskScore += 15;
  }

  // 2. Outpatient Allowance Cap Check
  if (claimed > 250) {
    findings.push(`High Claim Value (RM ${claimed.toFixed(2)}) exceeding standard GP limit (RM 250)`);
    recommendations.push('Attach specialist referral letter or clinical justification for high-cost medication.');
    riskScore += 30;
  } else if (claimed > 150) {
    findings.push(`Claim value (RM ${claimed.toFixed(2)}) near outpatient cap`);
    riskScore += 10;
  }

  // 3. Receipt / POS Reference Check
  if (!claim.receiptNo) {
    findings.push('No official POS receipt number linked');
    recommendations.push('Ensure cashier transaction is finalized with official clinic receipt.');
    riskScore += 10;
  }

  // Determine overall status & probability
  let status: ClaimAuditStatus = 'clean';
  let badgeTone: 'ok' | 'warn' | 'bad' = 'ok';
  let summary = 'Claim payload verified clean. High probability of instant TPA adjudication.';

  if (riskScore >= 45) {
    status = 'flagged';
    badgeTone = 'bad';
    summary = 'High Rejection Risk. Mandatory pre-submission corrections required.';
  } else if (riskScore > 0) {
    status = 'warning';
    badgeTone = 'warn';
    summary = 'Review Recommended. Potential panel inquiry or documentation request.';
  }

  const approvalProbability = Math.max(15, Math.min(99, 100 - riskScore));

  return {
    status,
    approvalProbability,
    badgeTone,
    summary,
    findings,
    recommendations,
  };
}
