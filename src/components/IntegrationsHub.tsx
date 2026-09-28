import React, { useState, useEffect } from 'react';
import { 
  Network, Database, ShieldCheck, Activity, Pill, Watch, HeartPulse, 
  RefreshCw, CheckCircle2, AlertTriangle, Link2, Server, Smartphone,
  Wifi, ChevronRight, Fingerprint, Plus, Zap, Cpu, Check, Code, Download, Copy, X,
  Shield, FileText, Lock
} from 'lucide-react';
import { convertVisitToFHIRBundle, validateFHIRPayload, FHIRBundleResource, FHIR_CONFIG } from '../lib/hl7FhirEngine';
import { 
  medicalBlockchain, 
  processTPAAutoPreAuth, 
  parseAndIngestLISReport, 
  generateEPrescription, 
  parseBiometricHardwareFrame,
  MedicalBlock,
  TPAClaimPreAuthResponse,
  LISReportIngest,
  EPrescriptionPayload,
  BiometricStreamFrame
} from '../lib/interoperabilityEngine';

export default function IntegrationsHub() {
  const [activeConnections, setActiveConnections] = useState<number>(0);
  const [syncCount, setSyncCount] = useState<number>(14271);

  // Modal States for all 7 Interoperability Engines
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // FHIR State
  const [fhirJsonOutput, setFhirJsonOutput] = useState<string>('');
  const [validationInput, setValidationInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; resourceType?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // TPA Insurance State
  const [policyNo, setPolicyNo] = useState<string>('TPA-884920-MY');
  const [claimAmount, setClaimAmount] = useState<number>(350);
  const [tpaResult, setTpaResult] = useState<TPAClaimPreAuthResponse | null>(null);

  // LIS/RIS State
  const [lisReport, setLisReport] = useState<LISReportIngest | null>(null);

  // e-Rx State
  const [eRxResult, setERxResult] = useState<EPrescriptionPayload | null>(null);

  // Biometric Hardware State
  const [biometricFrame, setBiometricFrame] = useState<BiometricStreamFrame | null>(null);

  // Generate initial samples
  useEffect(() => {
    const sampleVisit = {
      patientId: 'P10084',
      patientName: 'Ahmad Razak bin Ibrahim',
      icNumber: '870518-08-5901',
      phone: '013-4455667',
      gender: 'Male',
      dob: '1987-05-18',
      systolic: 128,
      diastolic: 82,
      icdCode: 'E11.9',
      diagnosis: 'Type 2 Diabetes Mellitus without complications',
      createdAt: new Date().toISOString()
    };
    const bundle = convertVisitToFHIRBundle(sampleVisit);
    setFhirJsonOutput(JSON.stringify(bundle, null, 2));
    setValidationInput(JSON.stringify(bundle, null, 2));

    // Sample TPA
    setTpaResult(processTPAAutoPreAuth({
      policyNumber: 'TPA-884920-MY',
      providerCode: 'MEDICLINIC_SHAH_ALAM',
      patientIc: '870518-08-5901',
      diagnosisICD10: 'E11.9',
      requestedAmount: 350
    }));

    // Sample LIS
    setLisReport(parseAndIngestLISReport({
      patientId: 'P10084',
      testResults: [
        { testName: 'HbA1c (Glycated Hemoglobin)', code: 'HBA1C', val: 7.2, unit: '%', min: 4.0, max: 6.5 },
        { testName: 'Serum Cardiac Troponin-I', code: 'TROP', val: 0.08, unit: 'ng/mL', min: 0.00, max: 0.04 }, // Panic
        { testName: 'Serum Potassium (K)', code: 'K', val: 4.2, unit: 'mmol/L', min: 3.5, max: 5.1 }
      ]
    }));

    // Sample e-Rx
    setERxResult(generateEPrescription('P10084', 'MMC-84920', [
      { drugName: 'Warfarin 5mg', dosage: '5mg once daily', frequency: 'OD', durationDays: 30 },
      { drugName: 'Aspirin 100mg', dosage: '100mg once daily', frequency: 'OD', durationDays: 30 }
    ]));

    // Sample Biometrics
    setBiometricFrame(parseBiometricHardwareFrame({
      hr: 124,
      systolic: 168,
      diastolic: 98,
      spo2: 95
    }));
  }, []);

  // Simulate constant background data flow
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncCount(prev => prev + Math.floor(Math.random() * 5));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Simple animation trigger for initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveConnections(7);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const handleValidatePayload = () => {
    const res = validateFHIRPayload(validationInput);
    setValidationResult(res);
  };

  const handleCopyFHIR = () => {
    navigator.clipboard.writeText(fhirJsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrations = [
    {
      id: 'ehr',
      title: 'HL7 FHIR Sync Engine',
      description: 'Seamless integration with major EHR ecosystems (Epic, Cerner) via standard HL7 Fast Healthcare Interoperability Resources.',
      icon: Database,
      status: 'Connected',
      color: 'teal',
      metrics: '24ms latency • Bi-directional',
      badge: 'EHR / EMR'
    },
    {
      id: 'blockchain',
      title: 'Blockchain Ledger Node',
      description: 'Immutable, decentralized patient medical records ensuring zero tampering and secure multi-provider sharing.',
      icon: Link2,
      status: 'Syncing',
      color: 'teal',
      metrics: 'Block #849201 verified',
      badge: 'Web3 Security'
    },
    {
      id: 'insurance',
      title: 'TPA Auto-Auth Gateway',
      description: 'Direct EDI connection to national insurance providers for instantaneous pre-authorization and claim approvals.',
      icon: ShieldCheck,
      status: 'Connected',
      color: 'teal',
      metrics: '100% SLA uptime',
      badge: 'Financial'
    },
    {
      id: 'labs',
      title: 'LIS & RIS Ingestion',
      description: 'Automated retrieval of Laboratory and Radiology Information Systems with intelligent AI critical-value flagging.',
      icon: Server,
      status: 'Connected',
      color: 'teal',
      metrics: 'Last pull: 2 mins ago',
      badge: 'Diagnostics'
    },
    {
      id: 'pharmacy',
      title: 'e-Prescribing Network',
      description: 'Direct routing to pharmacy chains with real-time inventory checks and patient cost-sharing calculations.',
      icon: Pill,
      status: 'Connected',
      color: 'teal',
      metrics: '1,420 Rx sent today',
      badge: 'Dispensary'
    },
    {
      id: 'wearables',
      title: 'IoT Wearables Bridge',
      description: 'Continuous health tracker ingestion from Apple HealthKit, Fitbit, and continuous glucose monitors.',
      icon: Watch,
      status: 'Connected',
      color: 'teal',
      metrics: '42 active patient streams',
      badge: 'Patient IoT'
    },
    {
      id: 'devices',
      title: 'Biometric Device Bus',
      description: 'Local network IP interfacing for direct vital sign monitors, EKGs, and ultrasound machine data scraping.',
      icon: HeartPulse,
      status: 'Warning',
      color: 'amber',
      metrics: 'EKG Unit B offline',
      badge: 'Hardware'
    }
  ];

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      {/* STRUCTURED CLINICAL HEADER BANNER */}
      <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
              Medical Data Ecosystem
            </span>
            <span className="flex items-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              HL7 / FHIR Gateway
            </span>
          </div>
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <Wifi className="w-6 h-6 text-accent" />
            Interoperability Engine
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            Central nervous system for external medical data. Manage active secure connections to national health registries, IoT wearables, and decentralized blockchain nodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-none border border-line flex items-center gap-4 shadow-2xs">
            <div className="text-left">
              <span className="text-2xs uppercase font-bold text-slate-500 tracking-wider block">Network Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-ink text-xs font-bold">{activeConnections}/7 Nodes</span>
              </div>
            </div>

            <div className="w-px h-7 bg-teal-600/50"></div>

            <div className="text-left">
              <span className="text-2xs uppercase font-bold text-teal-200/80 tracking-wider block">Packets Synced</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RefreshCw className="w-3.5 h-3.5 text-teal-200 animate-spin" />
                <span className="font-mono text-white text-xs font-bold">{syncCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3.5 py-2.5 rounded-none flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        </div>
      </div>

      {/* TOP 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Nodes</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Network className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{activeConnections} / 7</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              <Check className="w-3 h-3" /> 100% Operational
            </span>
          </div>
        </div>

        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Packets Synced</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{syncCount.toLocaleString()}</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              +12.4% flow
            </span>
          </div>
        </div>

        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Latency</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">18 ms</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              Optimal throughput
            </span>
          </div>
        </div>

        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Integrity</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">Zero Tamper</h3>
            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium border border-teal-200">
              Web3 & HL7 Validated
            </span>
          </div>
        </div>
      </div>

      {/* INTEGRATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isWarning = integration.status === 'Warning';
          
          return (
            <div 
              key={integration.id} 
              className="bg-surface-accent rounded-none border border-line shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Card Header */}
              <div className={`p-4 border-b ${isWarning ? 'bg-amber-50 border-amber-200' : 'bg-surface border-teal-100'} flex items-start justify-between transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-none border shadow-sm ${isWarning ? 'bg-white text-amber-600 border-amber-200' : 'bg-white text-accent border-teal-100'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-2xs font-bold uppercase tracking-wider block ${isWarning ? 'text-amber-700' : 'text-accent'}`}>
                      {integration.badge}
                    </span>
                    <h3 className="type-card-title text-ink">{integration.title}</h3>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {integration.description}
                </p>
                
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    {integration.status === 'Connected' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {integration.status === 'Syncing' && (
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                    )}
                    {integration.status === 'Warning' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span className={
                      integration.status === 'Connected' ? 'text-emerald-700 font-bold' : 
                      integration.status === 'Syncing' ? 'text-teal-700 font-bold' : 
                      'text-amber-700 font-bold'
                    }>
                      {integration.status}
                    </span>
                  </div>
                  <span className="text-2xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono">
                    {integration.metrics}
                  </span>
                </div>
              </div>
              
              {/* Card Footer Action */}
              <button 
                type="button"
                onClick={() => setActiveModal(integration.id)}
                className="bg-slate-50 dark:bg-night-800 border-t border-slate-100 dark:border-teal-800 py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-teal-200 hover:text-white hover:bg-primary flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Launch {integration.title}...</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Deploy New Integration Card */}
        <button 
          type="button"
          onClick={() => setActiveModal('ehr')}
          className="bg-surface dark:bg-night-850 rounded-none border-2 border-dashed border-teal-200 dark:border-teal-800 hover:border-brand hover:bg-teal-50/50 transition-all duration-300 flex flex-col items-center justify-center p-6 text-slate-500 group min-h-[220px] cursor-pointer"
        >
          <div className="w-12 h-12 bg-white dark:bg-night-950 rounded-none shadow-sm border border-teal-200 dark:border-teal-800 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all text-accent">
            <Code className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-ink dark:text-teal-300">HL7 FHIR R4 Live Console</span>
          <span className="text-2xs text-slate-500 dark:text-slate-400 mt-1">Convert &amp; Validate FHIR JSON</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS FOR ALL 7 INTEROPERABILITY ENGINE CARDS                  */}
      {/* ========================================================================= */}

      {/* 1. HL7 FHIR R4 ENGINE MODAL */}
      {activeModal === 'ehr' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface-accent dark:bg-night-900 border border-line dark:border-teal-800 max-w-4xl w-full p-6 shadow-2xl space-y-5 text-ink dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-6 h-6 text-accent dark:text-teal-400" />
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300">
                    HL7 FHIR R4 Integration Engine &amp; Validator
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Fast Healthcare Interoperability Resources (v4.0.1) • RESTful JSON Clinical Exchange
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Testing Phase Zero-Trust Safety Disconnection Banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs font-mono font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>FHIR ENGINE MODE: 100% LOCAL ISOLATED SANDBOX</span>
              </div>
              <span className="text-2xs bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 border border-amber-400 font-bold uppercase">
                External Cloud Endpoints Hard-Disconnected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-accent" />
                    Generated Patient FHIR Bundle (R4)
                  </span>
                  <button type="button" onClick={handleCopyFHIR} className="text-2xs font-bold bg-primary hover:bg-primary-hover text-white px-2.5 py-1 flex items-center gap-1 cursor-pointer transition-colors">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="bg-night-950 text-teal-200 text-2xs font-mono p-3 border border-teal-900 rounded-none h-72 overflow-y-auto leading-relaxed shadow-inner">
                  {fhirJsonOutput}
                </pre>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-ink dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  FHIR Schema Payload Validator
                </span>
                <textarea
                  value={validationInput}
                  onChange={(e) => setValidationInput(e.target.value)}
                  className="w-full bg-white dark:bg-night-950 text-slate-800 dark:text-slate-100 font-mono text-2xs p-3 border border-line dark:border-teal-800 rounded-none h-56 focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="Paste FHIR JSON payload here..."
                />
                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={handleValidatePayload} className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Run Schema Validation
                  </button>
                  {validationResult && (
                    <div className={`px-3 py-1.5 border text-xs font-bold font-mono flex items-center gap-1.5 ${
                      validationResult.valid ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {validationResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span>{validationResult.valid ? `Valid ${validationResult.resourceType}` : validationResult.error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-line dark:border-teal-800">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer shadow-sm">
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BLOCKCHAIN LEDGER NODE MODAL */}
      {activeModal === 'blockchain' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface-accent dark:bg-night-900 border border-line dark:border-teal-800 max-w-3xl w-full p-6 shadow-2xl space-y-4 text-ink dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Link2 className="w-6 h-6 text-accent dark:text-teal-400" />
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300">
                    Blockchain Immutable Medical Ledger Node
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Tamper-Proof Proof-of-Work Audit Trail • Cryptographic SHA-256 Record Integrity
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-surface-muted dark:bg-night-800 p-3 border border-line-subtle dark:border-teal-800">
                <span className="text-xs font-bold text-ink dark:text-teal-300">Chain Status: {medicalBlockchain.verifyChainIntegrity().isValid ? '100% VALID & IMMUTABLE' : 'CORRUPTED'}</span>
                <button
                  type="button"
                  onClick={() => {
                    medicalBlockchain.recordAuditBlock('P10084', 'CONSULTATION_SIGN_OFF', 'E11.9', ['Metformin 500mg']);
                    setSyncCount(prev => prev + 1);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-3 py-1.5 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Mine New Block...
                </button>
              </div>

              <div className="space-y-2 h-72 overflow-y-auto pr-1">
                {medicalBlockchain.getChain().map((block) => (
                  <div key={block.index} className="bg-night-950 p-3 border border-teal-900 text-xs font-mono text-teal-200 space-y-1">
                    <div className="flex justify-between font-bold text-teal-300">
                      <span>BLOCK #{block.index}</span>
                      <span>Nonce: {block.nonce}</span>
                    </div>
                    <p className="text-2xs text-slate-400">Timestamp: {block.timestamp}</p>
                    <p className="text-2xs text-slate-300">Hash: <span className="text-emerald-400 font-bold">{block.hash}</span></p>
                    <p className="text-2xs text-slate-400">Prev: {block.previousHash}</p>
                    <div className="pt-1 text-2xs text-teal-100 border-t border-teal-950">
                      Action: {block.data.action} | PII Hash: {block.data.piiAuditHash}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-line dark:border-teal-800">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary text-white font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TPA AUTO-AUTH GATEWAY MODAL */}
      {activeModal === 'insurance' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface-accent dark:bg-night-900 border border-line dark:border-teal-800 max-w-xl w-full p-6 shadow-2xl space-y-4 text-ink dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-line dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-accent dark:text-teal-400" />
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300">TPA Auto-Auth Gateway</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Direct EDI-837 / EDI-270 Insurance Coverage Pre-Clearance</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-teal-200 block mb-1">Policy Number</label>
                  <input
                    type="text"
                    value={policyNo}
                    onChange={(e) => setPolicyNo(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-night-950 border border-line dark:border-teal-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-teal-200 block mb-1">Requested Amount (RM)</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-night-950 border border-line dark:border-teal-800 font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTpaResult(processTPAAutoPreAuth({
                    policyNumber: policyNo,
                    providerCode: 'MEDICLINIC_SHAH_ALAM',
                    patientIc: '870518-08-5901',
                    diagnosisICD10: 'E11.9',
                    requestedAmount: claimAmount
                  }));
                }}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 text-xs shadow-sm cursor-pointer"
              >
                Run EDI-837 Pre-Authorization Clearance
              </button>

              {tpaResult && (
                <div className={`p-4 border font-mono text-xs space-y-1.5 ${tpaResult.approved ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-300'}`}>
                  <div className="font-bold flex justify-between">
                    <span>STATUS: {tpaResult.approved ? 'APPROVED' : 'REJECTED'}</span>
                    <span>REF: {tpaResult.preAuthRefNumber}</span>
                  </div>
                  <p>Insurance Coverage: RM {tpaResult.approvedCoverageAmount.toFixed(2)}</p>
                  <p>Patient Co-Pay: RM {tpaResult.patientCoPayAmount.toFixed(2)}</p>
                  <p className="text-2xs text-teal-700 dark:text-teal-300">Auth Token: {tpaResult.authorizationToken}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-line dark:border-teal-800">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary text-white font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. LIS & RIS DIAGNOSTICS MODAL */}
      {activeModal === 'labs' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface-accent dark:bg-night-900 border border-line dark:border-teal-800 max-w-2xl w-full p-6 shadow-2xl space-y-4 text-ink dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-line dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Server className="w-6 h-6 text-accent dark:text-teal-400" />
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300">LIS &amp; RIS Diagnostics Ingestion</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">HL7 Panic Value Detection &amp; Lab Interfacing</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {lisReport && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between bg-surface-muted dark:bg-night-800 p-2.5 border border-line-subtle dark:border-teal-800 font-mono">
                  <span>REPORT: {lisReport.labReportId}</span>
                  <span className={lisReport.hasPanicAlert ? 'text-rose-600 font-bold animate-pulse' : 'text-emerald-600'}>
                    {lisReport.hasPanicAlert ? 'CRITICAL PANIC ALERT DETECTED' : 'NORMAL RANGE'}
                  </span>
                </div>

                <div className="space-y-2">
                  {lisReport.results.map((r) => (
                    <div key={r.testCode} className={`p-2.5 border flex justify-between items-center ${r.isPanicValue ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200' : 'bg-white dark:bg-night-950 border-slate-200 dark:border-teal-900'}`}>
                      <div>
                        <p className="font-bold">{r.testName} ({r.testCode})</p>
                        <p className="text-2xs opacity-75">Ref: {r.refRangeMin} - {r.refRangeMax} {r.unit}</p>
                      </div>
                      <span className="font-mono text-sm font-bold">{r.value} {r.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-line dark:border-teal-800">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary text-white font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. e-PRESCRIBING NETWORK MODAL */}
      {activeModal === 'pharmacy' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface-accent dark:bg-night-900 border border-line dark:border-teal-800 max-w-xl w-full p-6 shadow-2xl space-y-4 text-ink dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-line dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Pill className="w-6 h-6 text-accent dark:text-teal-400" />
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300">e-Prescribing Pharmacy Network</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Automated Drug-Drug Interaction Safety Scanner</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {eRxResult && (
              <div className="space-y-3 text-xs">
                <div className="bg-night-950 p-3 border border-teal-900 text-teal-200 font-mono space-y-1">
                  <div className="flex justify-between font-bold text-teal-300">
                    <span>e-Rx ID: {eRxResult.rxId}</span>
                    <span>STATUS: {eRxResult.dispenseStatus}</span>
                  </div>
                  <p className="text-2xs text-slate-400">Doctor MMC: {eRxResult.prescriberMMLNo}</p>
                </div>

                {eRxResult.interactionAlerts.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-600" /> DRUG INTERACTION SAFETY WARNING</p>
                    {eRxResult.interactionAlerts.map((a, idx) => (
                      <p key={idx} className="text-2xs font-mono">{a}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-line dark:border-teal-800">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary text-white font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. IoT WEARABLES BRIDGE MODAL */}
      {activeModal === 'wearables' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface-accent dark:bg-night-900 border border-line dark:border-teal-800 max-w-xl w-full p-6 shadow-2xl space-y-4 text-ink dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-line dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Watch className="w-6 h-6 text-accent dark:text-teal-400" />
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300">IoT Wearables &amp; Telemetry Bridge</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Continuous Biometric Health Monitoring Stream</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {biometricFrame && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-night-950 border border-slate-200 dark:border-teal-900">
                  <span className="text-slate-500 block text-2xs font-bold">HEART RATE</span>
                  <span className="text-xl font-bold text-rose-600 font-mono">{biometricFrame.heartRateBp} bpm</span>
                </div>
                <div className="p-3 bg-white dark:bg-night-950 border border-slate-200 dark:border-teal-900">
                  <span className="text-slate-500 block text-2xs font-bold">BLOOD OXYGEN (SpO2)</span>
                  <span className="text-xl font-bold text-emerald-600 font-mono">{biometricFrame.spO2Percent}%</span>
                </div>
                <div className="p-3 bg-white dark:bg-night-950 border border-slate-200 dark:border-teal-900">
                  <span className="text-slate-500 block text-2xs font-bold">BLOOD PRESSURE</span>
                  <span className="text-xl font-bold text-ink dark:text-teal-300 font-mono">{biometricFrame.systolicBp}/{biometricFrame.diastolicBp} mmHg</span>
                </div>
                <div className="p-3 bg-white dark:bg-night-950 border border-slate-200 dark:border-teal-900">
                  <span className="text-slate-500 block text-2xs font-bold">GLUCOSE LEVEL</span>
                  <span className="text-xl font-bold text-amber-600 font-mono">{biometricFrame.glucoseMmol} mmol/L</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-line dark:border-teal-800">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary text-white font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. BIOMETRIC HARDWARE BUS MODAL */}
      {activeModal === 'devices' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface-accent dark:bg-night-900 border border-line dark:border-teal-800 max-w-xl w-full p-6 shadow-2xl space-y-4 text-ink dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-line dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-6 h-6 text-accent dark:text-teal-400" />
                <div>
                  <h3 className="type-heading-caps text-ink dark:text-teal-300">Biometric Hardware Device Bus</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Clinic IP / Serial Device Telemetry Port</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 bg-night-950 text-teal-200 border border-teal-900 flex justify-between">
                <span>PORT COM3: Mindray Vital Monitor</span>
                <span className="text-emerald-400 font-bold">STREAMING (1.2ms)</span>
              </div>
              <div className="p-2.5 bg-night-950 text-teal-200 border border-teal-900 flex justify-between">
                <span>PORT COM4: ECG 12-Lead Machine B</span>
                <span className="text-amber-400 font-bold">CALIBRATION REQ</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-line dark:border-teal-800">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-primary text-white font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
