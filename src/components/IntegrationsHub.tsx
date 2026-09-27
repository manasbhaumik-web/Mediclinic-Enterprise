import React, { useState, useEffect } from 'react';
import { 
  Network, Database, ShieldCheck, Activity, Pill, Watch, HeartPulse, 
  RefreshCw, CheckCircle2, AlertTriangle, Link2, Server, Smartphone,
  Wifi, ChevronRight, Fingerprint, Plus, Zap, Cpu, Check, Code, Download, Copy, X
} from 'lucide-react';
import { convertVisitToFHIRBundle, validateFHIRPayload, FHIRBundleResource } from '../lib/hl7FhirEngine';

export default function IntegrationsHub() {
  const [activeConnections, setActiveConnections] = useState<number>(0);
  const [syncCount, setSyncCount] = useState<number>(14271);
  const [showFHIRModal, setShowFHIRModal] = useState<boolean>(false);
  const [fhirJsonOutput, setFhirJsonOutput] = useState<string>('');
  const [validationInput, setValidationInput] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; resourceType?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate initial sample FHIR bundle
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
      <div className="bg-[#e6f4f1] text-[#0f3c4c] p-5 rounded-none shadow-2xs border border-[#99f6e4] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#0d9488]/10 text-[#0d9488] text-[11px] font-bold px-2.5 py-0.5 rounded-none border border-[#0d9488]/20 uppercase tracking-wide">
              Medical Data Ecosystem
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#0d9488] bg-teal-50 px-2 py-0.5 rounded-none border border-[#99f6e4] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              HL7 / FHIR Gateway
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-[#0f3c4c] flex items-center gap-2.5">
            <Wifi className="w-6 h-6 text-[#0d9488]" />
            Interoperability Engine
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            Central nervous system for external medical data. Manage active secure connections to national health registries, IoT wearables, and decentralized blockchain nodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-none border border-[#99f6e4] flex items-center gap-4 shadow-2xs">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Network Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[#0f3c4c] text-xs font-black">{activeConnections}/7 Nodes</span>
              </div>
            </div>

            <div className="w-px h-7 bg-teal-600/50"></div>

            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-teal-200/80 tracking-wider block">Packets Synced</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RefreshCw className="w-3.5 h-3.5 text-teal-200 animate-spin" />
                <span className="font-mono text-white text-xs font-bold">{syncCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold px-3.5 py-2.5 rounded-md flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        </div>
      </div>

      {/* TOP 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Nodes</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Network className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">{activeConnections} / 7</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              <Check className="w-3 h-3" /> 100% Operational
            </span>
          </div>
        </div>

        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Packets Synced</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">{syncCount.toLocaleString()}</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              +12.4% flow
            </span>
          </div>
        </div>

        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Latency</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">18 ms</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              Optimal throughput
            </span>
          </div>
        </div>

        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Integrity</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">Zero Tamper</h3>
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
              className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Card Header */}
              <div className={`p-4 border-b ${isWarning ? 'bg-amber-50 border-amber-200' : 'bg-[#f7fdfd] border-teal-100'} flex items-start justify-between transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border shadow-sm ${isWarning ? 'bg-white text-amber-600 border-amber-200' : 'bg-white text-[#0d9488] border-teal-100'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${isWarning ? 'text-amber-700' : 'text-[#0d9488]'}`}>
                      {integration.badge}
                    </span>
                    <h3 className="font-bold text-sm tracking-tight text-[#0f3c4c]">{integration.title}</h3>
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
                  <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono">
                    {integration.metrics}
                  </span>
                </div>
              </div>
              
              {/* Card Footer Action */}
              <button 
                type="button"
                onClick={() => {
                  if (integration.id === 'ehr') {
                    setShowFHIRModal(true);
                  }
                }}
                className="bg-slate-50 border-t border-slate-100 py-2.5 px-4 text-xs font-bold text-slate-700 hover:text-white hover:bg-[#0d9488] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>{integration.id === 'ehr' ? 'Launch FHIR R4 Engine...' : 'Configure Connection'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Deploy New Integration Card */}
        <button 
          type="button"
          onClick={() => setShowFHIRModal(true)}
          className="bg-[#f7fdfd] dark:bg-[#082830] rounded-none border-2 border-dashed border-teal-200 dark:border-teal-800 hover:border-[#0d9488] hover:bg-teal-50/50 transition-all duration-300 flex flex-col items-center justify-center p-6 text-slate-500 group min-h-[220px] cursor-pointer"
        >
          <div className="w-12 h-12 bg-white dark:bg-[#061f26] rounded-full shadow-sm border border-teal-200 dark:border-teal-800 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#0d9488] group-hover:text-white transition-all text-[#0d9488]">
            <Code className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4]">HL7 FHIR R4 Live Console</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Convert &amp; Validate FHIR JSON</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE HL7 FHIR R4 ENGINE & SCHEMA VALIDATOR MODAL                    */}
      {/* ========================================================================= */}
      {showFHIRModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-[#e6f4f1] dark:bg-[#07252d] border border-[#99f6e4] dark:border-teal-800 max-w-4xl w-full p-6 shadow-2xl space-y-5 text-[#0f3c4c] dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#99f6e4] dark:border-teal-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-6 h-6 text-[#0d9488] dark:text-[#2dd4bf]" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#0f3c4c] dark:text-[#5eead4]">
                    HL7 FHIR R4 Integration Engine &amp; Validator
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Fast Healthcare Interoperability Resources (v4.0.1) • RESTful JSON Clinical Exchange
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFHIRModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid 2 Columns: Live Generated Bundle vs Schema Validator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Left Column: Live FHIR Bundle Export */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-[#0d9488]" />
                    Generated Patient FHIR Bundle (R4)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyFHIR}
                    className="text-[10px] font-extrabold bg-[#0d9488] hover:bg-[#0f766e] text-white px-2.5 py-1 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="bg-[#061f26] text-teal-200 text-[11px] font-mono p-3 border border-teal-900 rounded-none h-72 overflow-y-auto leading-relaxed shadow-inner">
                  {fhirJsonOutput}
                </pre>
                <p className="text-[10px] text-slate-500 font-medium">
                  Includes Patient resource, Blood Pressure Observation LOINC 85354-9, and ICD-10 Condition.
                </p>
              </div>

              {/* Right Column: Schema Validator Sandbox */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                    FHIR Schema Payload Validator
                  </span>
                </div>

                <textarea
                  value={validationInput}
                  onChange={(e) => setValidationInput(e.target.value)}
                  className="w-full bg-white dark:bg-[#061f26] text-slate-800 dark:text-slate-100 font-mono text-[11px] p-3 border border-[#99f6e4] dark:border-teal-800 rounded-none h-56 focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                  placeholder="Paste FHIR JSON payload here..."
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleValidatePayload}
                    className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Run Schema Validation
                  </button>

                  {validationResult && (
                    <div className={`px-3 py-1.5 border text-xs font-bold font-mono flex items-center gap-1.5 ${
                      validationResult.valid 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                    }`}>
                      {validationResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span>{validationResult.valid ? `Valid ${validationResult.resourceType} Resource` : validationResult.error}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#99f6e4] dark:border-teal-800">
              <button
                type="button"
                onClick={() => setShowFHIRModal(false)}
                className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Close FHIR Console
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
