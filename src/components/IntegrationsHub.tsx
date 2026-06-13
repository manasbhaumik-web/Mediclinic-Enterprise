import React, { useState, useEffect } from 'react';
import { 
  Network, Database, ShieldCheck, Activity, Pill, Watch, HeartPulse, 
  RefreshCw, CheckCircle2, AlertTriangle, Link2, Server, Smartphone,
  Wifi, ChevronRight, Fingerprint
} from 'lucide-react';

export default function IntegrationsHub() {
  const [activeConnections, setActiveConnections] = useState<number>(0);
  const [syncCount, setSyncCount] = useState<number>(14250);

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
    return () => clearTimeout(timer);
  }, []);

  const integrations = [
    {
      id: 'ehr',
      title: 'HL7 FHIR Sync Engine',
      description: 'Seamless integration with major EHR ecosystems (Epic, Cerner) via standard HL7 Fast Healthcare Interoperability Resources.',
      icon: Database,
      status: 'Connected',
      color: 'blue',
      metrics: '24ms latency • Bi-directional',
      badge: 'EHR / EMR'
    },
    {
      id: 'blockchain',
      title: 'Blockchain Ledger Node',
      description: 'Immutable, decentralized patient medical records ensuring zero tampering and secure multi-provider sharing.',
      icon: Link2,
      status: 'Syncing',
      color: 'indigo',
      metrics: 'Block #849201 verified',
      badge: 'Web3 Security'
    },
    {
      id: 'insurance',
      title: 'TPA Auto-Auth Gateway',
      description: 'Direct EDI connection to national insurance providers for instantaneous pre-authorization and claim approvals.',
      icon: ShieldCheck,
      status: 'Connected',
      color: 'emerald',
      metrics: '100% SLA uptime',
      badge: 'Financial'
    },
    {
      id: 'labs',
      title: 'LIS & RIS Ingestion',
      description: 'Automated retrieval of Laboratory and Radiology Information Systems with intelligent AI critical-value flagging.',
      icon: Server,
      status: 'Connected',
      color: 'cyan',
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
      color: 'rose',
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

  const getColorClasses = (color: string, status: string) => {
    if (status === 'Warning') return 'bg-amber-50 border-amber-200 text-amber-700';
    
    const classes: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      rose: 'bg-rose-50 border-rose-200 text-rose-700',
      amber: 'bg-amber-50 border-amber-200 text-amber-700',
    };
    return classes[color] || classes.blue;
  };

  const getIconColor = (color: string) => {
    const classes: Record<string, string> = {
      blue: 'text-blue-600',
      indigo: 'text-indigo-600',
      emerald: 'text-emerald-600',
      cyan: 'text-cyan-600',
      teal: 'text-teal-600',
      rose: 'text-rose-600',
      amber: 'text-amber-600',
    };
    return classes[color] || 'text-blue-600';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER DASHBOARD */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl shadow-xl border border-slate-800 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Network className="w-64 h-64" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Wifi className="w-7 h-7 text-emerald-400" />
              Interoperability Engine
            </h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Central nervous system for external medical data. Manage active secure connections to national health registries, IoT wearables, and decentralized blockchain nodes.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/50 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Network Status</span>
              <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">{activeConnections}/7 Nodes</span>
              </div>
            </div>
            
            <div className="w-px h-10 bg-slate-800"></div>
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Packets Synced</span>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                <span className="font-mono text-indigo-300 font-bold">{syncCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTEGRATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {integrations.map((integration, index) => (
          <div 
            key={integration.id} 
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Card Header */}
            <div className={`p-4 border-b flex items-start justify-between ${getColorClasses(integration.color, integration.status)} transition-colors`}>
              <div className="flex items-center gap-3">
                <div className="bg-white/80 backdrop-blur p-2 rounded-lg shadow-sm">
                  <integration.icon className={`w-5 h-5 ${getIconColor(integration.color)}`} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-80 block mb-0.5">{integration.badge}</span>
                  <h3 className="font-bold text-sm tracking-tight leading-tight">{integration.title}</h3>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-xs text-slate-500 leading-relaxed flex-1">
                {integration.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {integration.status === 'Connected' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {integration.status === 'Syncing' && (
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  )}
                  {integration.status === 'Warning' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className={
                    integration.status === 'Connected' ? 'text-emerald-700 font-bold' : 
                    integration.status === 'Syncing' ? 'text-indigo-700 font-bold' : 
                    'text-amber-700 font-bold'
                  }>
                    {integration.status}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  {integration.metrics}
                </span>
              </div>
            </div>
            
            {/* Card Footer Hover Action */}
            <button className="bg-slate-50 border-t border-slate-100 py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-between transition-colors opacity-0 group-hover:opacity-100 h-0 group-hover:h-auto overflow-hidden">
              Configure Connection <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add New Integration Placeholder */}
        <button className="bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-6 text-slate-400 group min-h-[220px]">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <span className="text-2xl font-light text-slate-400 leading-none pb-1">+</span>
          </div>
          <span className="text-xs font-bold text-slate-500">Deploy New Integration</span>
          <span className="text-[10px] text-slate-400 mt-1">Marketplace / Custom API</span>
        </button>

      </div>
    </div>
  );
}
