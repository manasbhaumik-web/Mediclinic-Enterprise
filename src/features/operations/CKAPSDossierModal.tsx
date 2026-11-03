import React, { useState, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, ShieldCheck, Download, Printer,
  FileText, Award, AlertOctagon, Check, Building2, Stethoscope,
  ClipboardCheck, Clock
} from 'lucide-react';
import {
  CKAPSFacilityProfile,
  DEFAULT_FACILITY_PROFILE,
  evaluateCKAPSReadiness,
  generateCKAPSDossierMarkdown,
} from '../../domain/ckapsDossier';

interface CKAPSDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_PROFILE = 'mediclinic_ckaps_profile_v1';

export default function CKAPSDossierModal({ isOpen, onClose }: CKAPSDossierModalProps) {
  const [activeTab, setActiveTab] = useState<'audit_readiness' | 'statutory_evidence' | 'pic_declaration' | 'dossier_preview'>('audit_readiness');

  // Facility Profile State
  const [profile, setProfile] = useState<CKAPSFacilityProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
    return saved ? JSON.parse(saved) : DEFAULT_FACILITY_PROFILE;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form edit states
  const [picName, setPicName] = useState(profile.personInChargeName);
  const [picMmc, setPicMmc] = useState(profile.personInChargeMmcNo);
  const [apcYear, setApcYear] = useState(String(profile.personInChargeApcYear));
  const [indemnityPolicy, setIndemnityPolicy] = useState(profile.personInChargeIndemnityPolicy);
  const [indemnityExpiry, setIndemnityExpiry] = useState(profile.personInChargeIndemnityExpiry);

  // Evaluated Dossier
  const dossier = useMemo(() => {
    const evaluated = evaluateCKAPSReadiness();
    return {
      ...evaluated,
      profile,
    };
  }, [profile]);

  // Dossier Markdown Text
  const dossierMarkdown = useMemo(() => {
    return generateCKAPSDossierMarkdown(dossier);
  }, [dossier]);

  // Save profile updates
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CKAPSFacilityProfile = {
      ...profile,
      personInChargeName: picName.trim(),
      personInChargeMmcNo: picMmc.trim(),
      personInChargeApcYear: parseInt(apcYear, 10) || 2026,
      personInChargeIndemnityPolicy: indemnityPolicy.trim(),
      personInChargeIndemnityExpiry: indemnityExpiry.trim(),
    };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    setToastMessage('✓ Person In-Charge Statutory Declaration updated successfully!');
    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('dossier_preview');
  };

  // Download Markdown Dossier
  const handleDownloadMarkdown = () => {
    const blob = new Blob([dossierMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MOH_CKAPS_Form_B_Dossier_${profile.ckapsRegistrationNo.replace(/[^a-zA-Z0-9]/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Dossier
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>MOH CKAPS Form B Regulatory Inspection Dossier</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 40px; color: #111; line-height: 1.5; font-size: 12px; }
            h1 { font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; }
            h2 { font-size: 14px; text-transform: uppercase; margin-top: 24px; }
            h3 { font-size: 12px; text-transform: uppercase; color: #444; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background: #f0f0f0; }
            .score-box { border: 2px solid #0f766e; background: #f0fdfa; padding: 12px; margin: 16px 0; font-weight: bold; }
            hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
          </style>
        </head>
        <body>
          <pre style="white-space: pre-wrap; font-family: monospace;">${dossierMarkdown}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-canvas border border-line w-full max-w-4xl max-h-[92vh] flex flex-col rounded-none overflow-hidden text-ink">
        {/* Header */}
        <div className="px-6 py-4 bg-canvas-subtle border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 border border-brand/20 text-brand">
              <Award className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-ink">
                  MOH CKAPS Form B Regulatory Inspection Dossier
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                  {dossier.grade}
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Private Healthcare Facilities &amp; Services Act 1998 (Act 586) &bull; Biennial License Renewal Audit Packager
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-medium border border-line hover:bg-canvas-subtle text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
              title="Print Dossier"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pack</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-2.5 py-1 text-xs font-medium border border-line hover:bg-canvas-subtle text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
              title="Download Markdown Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-subtle border border-transparent hover:border-line transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="bg-brand text-white px-6 py-2 text-xs font-medium flex items-center gap-2 border-b border-brand-accent animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-canvas px-6 gap-2">
          <button
            onClick={() => setActiveTab('audit_readiness')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'audit_readiness'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Audit Readiness Score</span>
          </button>
          <button
            onClick={() => setActiveTab('statutory_evidence')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'statutory_evidence'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>8 Regulatory Pillars Evidence</span>
          </button>
          <button
            onClick={() => setActiveTab('pic_declaration')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pic_declaration'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Person In-Charge (PIC) Signer</span>
          </button>
          <button
            onClick={() => setActiveTab('dossier_preview')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'dossier_preview'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Compiled Form B Dossier</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AUDIT READINESS */}
          {activeTab === 'audit_readiness' && (
            <div className="space-y-6">
              {/* Executive Score Card */}
              <div className="p-5 border border-line bg-canvas-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand" />
                    <h3 className="text-sm font-bold text-ink">
                      Facility Inspection Readiness Assessment
                    </h3>
                  </div>
                  <p className="text-xs text-ink-muted max-w-xl leading-relaxed">
                    Composite score aggregated across all 8 mandatory clinical operational areas regulated under Act 586, Atomic Energy Act 304, Poison Act 1952, and OSHA 1994.
                  </p>
                </div>

                <div className="flex items-baseline gap-4 p-3 bg-canvas border border-line shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-ink-muted uppercase block tabular-nums">Weighted Score</span>
                    <span className="text-3xl font-extrabold tabular-nums text-brand tracking-tight">
                      {dossier.overallScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="border-l border-line pl-3">
                    <span className="text-[10px] text-ink-muted uppercase block tabular-nums">Classification</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 inline-block mt-0.5">
                      {dossier.grade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Zero Tolerance Critical Defects Check */}
              <div className="border border-line p-4 bg-canvas space-y-2">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-ink">
                    MOH Inspection Zero-Tolerance Check
                  </span>
                </div>
                {dossier.criticalDefects.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Zero critical statutory defects detected. Facility complies with all Form B operating conditions.</span>
                  </p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {dossier.criticalDefects.map((defect, i) => (
                      <p key={i} className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{defect}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* 8 Statutory Pillars Summary Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-ink">
                  Statutory Pillars Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dossier.pillars.map((pillar) => (
                    <div key={pillar.id} className="p-3 border border-line bg-canvas flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-ink">{pillar.pillarName}</span>
                          <span className="text-[10px] text-ink-muted">({pillar.weightPercent}%)</span>
                        </div>
                        <p className="text-[11px] text-ink-muted">{pillar.governingAct}</p>
                        <span className="text-[10px] text-brand font-medium block">
                          {pillar.evidenceCount} verified records on file
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold tabular-nums text-ink block">{pillar.score}%</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                          pillar.status === 'compliant'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                        }`}>
                          {pillar.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATUTORY EVIDENCE */}
          {activeTab === 'statutory_evidence' && (
            <div className="space-y-4">
              <div className="border border-line bg-canvas-subtle p-4">
                <h3 className="text-xs font-bold text-ink">
                  Regulatory Evidence Registers (Act 586 Inspections)
                </h3>
                <p className="text-xs text-ink-muted mt-1">
                  MOH CKAPS auditors review these specific electronic registers during the on-site physical facility inspection.
                </p>
              </div>

              <div className="space-y-3">
                {dossier.pillars.map((p, idx) => (
                  <div key={p.id} className="p-3 border border-line bg-canvas space-y-2">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand tabular-nums">0{idx + 1}.</span>
                        <span className="text-xs font-bold text-ink">{p.pillarName}</span>
                      </div>
                      <span className="text-[10px] tabular-nums text-ink-muted">{p.governingAct}</span>
                    </div>

                    <p className="text-xs text-ink-muted">{p.summary}</p>

                    <div className="bg-canvas-subtle p-2 border border-line text-[11px] space-y-1">
                      <span className="font-semibold text-ink block">Verified Audit Findings:</span>
                      {p.findings.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-ink-muted">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PIC DECLARATION */}
          {activeTab === 'pic_declaration' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="border border-line bg-canvas-subtle p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold uppercase text-ink">
                    Person In-Charge (PIC) Statutory Responsibility (Act 586 § 14)
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Under the Private Healthcare Facilities and Services Act 1998, the designated Person In-Charge must hold a valid MMC Annual Practising Certificate (APC) and is legally responsible for clinical governance, safety standards, and all statutory registers maintained within the facility.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Facility Legal Name</label>
                  <input
                    type="text"
                    value={profile.facilityName}
                    disabled
                    className="w-full text-xs p-2 border border-line bg-canvas-subtle text-ink font-medium rounded-none opacity-80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">CKAPS Registration No (Form B)</label>
                  <input
                    type="text"
                    value={profile.ckapsRegistrationNo}
                    disabled
                    className="w-full text-xs p-2 border border-line bg-canvas-subtle text-ink tabular-nums rounded-none opacity-80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Person In-Charge Full Name</label>
                  <input
                    type="text"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">MMC Registration Number</label>
                  <input
                    type="text"
                    value={picMmc}
                    onChange={(e) => setPicMmc(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">APC Year</label>
                  <input
                    type="number"
                    value={apcYear}
                    onChange={(e) => setApcYear(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Medical Indemnity Policy No</label>
                  <input
                    type="text"
                    value={indemnityPolicy}
                    onChange={(e) => setIndemnityPolicy(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Indemnity Expiry Date</label>
                  <input
                    type="date"
                    value={indemnityExpiry}
                    onChange={(e) => setIndemnityExpiry(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Update Dossier Declaration</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: DOSSIER PREVIEW */}
          {activeTab === 'dossier_preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    Generated Form B Inspection Dossier Preview
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Ready for binding and official submission during CKAPS inspection visits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 text-xs font-semibold border border-line bg-canvas hover:bg-canvas-subtle text-ink flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Dossier</span>
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.MD)</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border border-line bg-canvas tabular-nums text-xs text-ink max-h-[50vh] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {dossierMarkdown}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-canvas-subtle border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-brand" />
            <span>Kementerian Kesihatan Malaysia &bull; Cawangan Kawalan Amalan Perubatan Swasta (CKAPS)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold border border-line bg-canvas hover:bg-canvas-subtle text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
