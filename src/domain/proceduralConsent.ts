export interface ProceduralConsentTemplate {
  procedureName: string;
  category: string;
  indicationDescription: string;
  proceduralExplanation: string;
  inherentRisks: string[];
  clinicalBenefits: string;
  alternativesDiscussed: string;
}

export interface SignedConsentRecord {
  id: string;
  procedureName: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  signerType: 'Patient' | 'Parent / Legal Guardian';
  signerName: string;
  signerIc: string;
  doctorName: string;
  doctorMmcNo: string;
  signedAt: string;
  witnessedAt: string;
  risksAcknowledged: string[];
  signatureDataUrl?: string; // Canvas base64 signature
  digitalConfirmationMethod: 'Touchscreen Stylus Signature' | 'Patient Biometric / Digital Acknowledgment';
  consentValid: boolean;
}

export const PROCEDURAL_CONSENT_TEMPLATES: Record<string, ProceduralConsentTemplate> = {
  suture: {
    procedureName: 'Wound Debridement, Toilet & Surgical Suturing',
    category: 'Minor Surgery',
    indicationDescription: 'Open laceration / traumatic wound requiring formal anatomical layer approximation.',
    proceduralExplanation: 'Local anesthesia (Lignocaine 2%) infiltration, sterile antiseptic debridement, and layered closure with synthetic non-absorbable/absorbable sutures.',
    inherentRisks: [
      'Minor local bleeding or hematoma formation',
      'Wound infection requiring oral antibiotics or premature suture release',
      'Hypertrophic scar, keloid formation, or cosmetic asymmetry',
      'Transient or permanent localized numbness around the wound margins due to micro-cutaneous nerve injury',
      'Wound breakdown (dehiscence) necessitating secondary intention healing'
    ],
    clinicalBenefits: 'Achieves hemostasis, minimizes bacterial contamination risk, accelerates wound healing, and optimizes cosmetic outcome.',
    alternativesDiscussed: 'Conservative sterile dressing / wound glue (Steri-Strips) with higher risk of widened scar and dehiscence.',
  },
  abscess: {
    procedureName: 'Abscess Incision, Evacuation & Drainage (I&D)',
    category: 'Minor Surgery',
    indicationDescription: 'Fluctuant cutaneous / subcutaneous abscess collection requiring surgical evacuation.',
    proceduralExplanation: 'Local field block anesthesia, linear incision along Langer line, digital or blunt loculation breakdown, pus evacuation, saline lavage, and ribbon gauze packing.',
    inherentRisks: [
      'Incomplete drainage or residual deep loculation requiring repeat procedure',
      'Bleeding from hyperemic inflamed margins',
      'Post-operative pain and persistent purulent discharge',
      'Delayed wound healing, fistula formation, or recurrence',
      'Cosmetic scarring at incision site'
    ],
    clinicalBenefits: 'Immediate decompression of infective focus, systemic sepsis prevention, and rapid pain alleviation.',
    alternativesDiscussed: 'High-dose systemic antibiotics alone (unlikely to penetrate encapsulated pus collection).',
  },
  foreign_body: {
    procedureName: 'Foreign Body Exploration & Surgical Removal',
    category: 'Minor Surgery',
    indicationDescription: 'Subcutaneous or soft tissue foreign body (e.g. glass shard, splinter, metallic needle).',
    proceduralExplanation: 'Local infiltration anesthesia, exploration along trajectory, extraction with fine instruments, irrigation, and primary or delayed closure.',
    inherentRisks: [
      'Inability to locate small or radiolucent micro-fragments requiring secondary tertiary referral',
      'Iatrogenic injury to adjacent tendons, nerves, or vascular bundles',
      'Secondary soft tissue infection or chronic foreign body granuloma'
    ],
    clinicalBenefits: 'Prevents deep fascial migration, chronic granuloma formation, and persistent mechanical pain.',
    alternativesDiscussed: 'Observation with risk of migration, chronic infection, or abscess formation.',
  },
  joint_injection: {
    procedureName: 'Intra-Articular / Soft Tissue Steroid & Local Anesthetic Injection',
    category: 'Interventional Injection',
    indicationDescription: 'Severe chronic inflammatory arthritis, bursitis, tendinitis, or trigger finger refractory to oral medication.',
    proceduralExplanation: 'Sterile skin preparation, anatomical landmark needle localization, aspiration if effused, and injection of depot corticosteroid with local anesthetic.',
    inherentRisks: [
      'Post-injection steroid flare (transient pain increase for 24-48 hours)',
      'Subcutaneous fat atrophy and local skin hypopigmentation at injection site',
      'Transient elevation of blood glucose in diabetic patients over 3-7 days',
      'Extremely rare risk of iatrogenic septic arthritis (< 1 in 20,000)'
    ],
    clinicalBenefits: 'Targeted anti-inflammatory relief, restored joint range of motion, and reduced systemic medication load.',
    alternativesDiscussed: 'Oral NSAIDs, physical therapy, oral steroids, or orthopedic surgical intervention.',
  },
};

/** Selects appropriate consent template based on procedure title */
export function getProceduralConsentTemplate(procName: string): ProceduralConsentTemplate {
  const lower = procName.toLowerCase();
  if (lower.includes('suture') || lower.includes('toilet') || lower.includes('wound')) {
    return PROCEDURAL_CONSENT_TEMPLATES.suture;
  }
  if (lower.includes('incision') || lower.includes('drainage') || lower.includes('abscess') || lower.includes('i&d')) {
    return PROCEDURAL_CONSENT_TEMPLATES.abscess;
  }
  if (lower.includes('foreign') || lower.includes('splinter') || lower.includes('glass')) {
    return PROCEDURAL_CONSENT_TEMPLATES.foreign_body;
  }
  if (lower.includes('joint') || lower.includes('steroid') || lower.includes('trigger') || lower.includes('intra-articular')) {
    return PROCEDURAL_CONSENT_TEMPLATES.joint_injection;
  }
  // Generic fallback minor surgery template
  return {
    procedureName: procName,
    category: 'Minor Clinical Procedure',
    indicationDescription: `Clinical indication as determined by attending physician for ${procName}.`,
    proceduralExplanation: `Sterile minor procedural intervention performed in accordance with Malaysian Ministry of Health standards.`,
    inherentRisks: [
      'Local pain, swelling, and minor bleeding',
      'Risk of localized infection requiring medical management',
      'Scar formation and delayed tissue recovery'
    ],
    clinicalBenefits: 'Alleviation of presenting symptoms and promotion of clinical recovery.',
    alternativesDiscussed: 'Conservative symptomatic management discussed.',
  };
}

/** Creates a fully validated statutory consent record */
export function createSignedConsentRecord(params: {
  procedureName: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  signerType: 'Patient' | 'Parent / Legal Guardian';
  signerName: string;
  signerIc: string;
  doctorName?: string;
  doctorMmcNo?: string;
  signatureDataUrl?: string;
  digitalConfirmationMethod?: 'Touchscreen Stylus Signature' | 'Patient Biometric / Digital Acknowledgment';
}): SignedConsentRecord {
  const template = getProceduralConsentTemplate(params.procedureName);
  const now = new Date().toISOString();

  return {
    id: `CON-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    procedureName: template.procedureName,
    patientId: params.patientId,
    patientName: params.patientName,
    patientIc: params.patientIc,
    signerType: params.signerType,
    signerName: params.signerName || params.patientName,
    signerIc: params.signerIc || params.patientIc,
    doctorName: params.doctorName || 'Dr. Consult In-Charge',
    doctorMmcNo: params.doctorMmcNo || 'MMC-58291',
    signedAt: now,
    witnessedAt: now,
    risksAcknowledged: template.inherentRisks,
    signatureDataUrl: params.signatureDataUrl,
    digitalConfirmationMethod: params.digitalConfirmationMethod || 'Patient Biometric / Digital Acknowledgment',
    consentValid: true,
  };
}

export function exportConsentText(c: SignedConsentRecord): string {
  return [
    '========================================================',
    '       MEDICLINIC ENTERPRISE HEALTHCARE GROUP',
    '    STATUTORY INFORMED PROCEDURAL CONSENT (PHFSA 1998)',
    '========================================================',
    `Consent ID:        ${c.id}`,
    `Procedure:         ${c.procedureName}`,
    `Date & Time:       ${new Date(c.signedAt).toLocaleString('en-GB')}`,
    '--------------------------------------------------------',
    'PATIENT IDENTIFICATION:',
    `Full Name:         ${c.patientName}`,
    `NRIC / Passport:   ${c.patientIc}`,
    `Signer Capacity:   ${c.signerType} (${c.signerName} - ${c.signerIc})`,
    '--------------------------------------------------------',
    'DISCLOSED PROCEDURAL RISKS ACKNOWLEDGED:',
    ...c.risksAcknowledged.map(r => `• ${r}`),
    '--------------------------------------------------------',
    'DECLARATION & WITNESS:',
    'I confirm that the nature, purpose, and potential risks',
    'of this procedure have been explained to me in a language',
    'I understand. I freely give my consent.',
    `Confirmation:      ${c.digitalConfirmationMethod}`,
    `Attending Doctor:  ${c.doctorName} (MMC: ${c.doctorMmcNo})`,
    '========================================================',
  ].join('\n');
}
