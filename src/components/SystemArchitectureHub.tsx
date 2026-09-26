import React, { useState, useEffect } from 'react';
import { 
  Server, Database, Network, Cloud, Cpu, Activity, ServerCrash, 
  Wifi, Zap, Lock, Code, Globe2, Radio, Smartphone, CheckCircle2, ShieldCheck
} from 'lucide-react';

export default function SystemArchitectureHub() {
  const [traffic, setTraffic] = useState(2450);
  const [apiHealth, setApiHealth] = useState(99.99);

  useEffect(() => {
    const interval = setInterval(() => {
      setTraffic(prev => Math.floor(Math.random() * 500) + 2000);
      setApiHealth(prev => 99.9 + (Math.random() * 0.09));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* 1. STRUCTURED PAGE HEADER BANNER */}
      <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#e6f4f1] border border-[#ccfbf1] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#0d9488] tracking-widest">
            <Activity className="w-3 h-3 text-[#0d9488]" />
            <span>Enterprise Infrastructure &amp; System Topology</span>
          </div>
          <h2 className="text-2xl font-black text-[#0f3c4c] tracking-tight">System Architecture &amp; Cloud Engine</h2>
          <p className="text-xs text-slate-600 font-medium max-w-xl">
            API-First Microservices, Edge Computing, and Cloud-Native Infrastructure.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <span className="bg-[#e0f5f2] text-[#0d9488] px-3.5 py-2 rounded-none text-xs font-black flex items-center gap-1.5 border border-[#b2f5ea] shadow-2xs">
            <Wifi className="w-4 h-4 text-[#0d9488]" />
            <span>ALL SYSTEMS NORMAL</span>
          </span>
        </div>
      </div>

      {/* 2. TOP METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">API Request Throughput</span>
          <span className="text-xl font-black font-mono text-[#0f3c4c] block mt-0.5">{traffic} req/s</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Microservices Uptime</span>
          <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">{apiHealth.toFixed(2)}%</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Edge Local Latency</span>
          <span className="text-xl font-black font-mono text-[#0d9488] block mt-0.5">1.2ms Ping</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">AWS Cloud Replication</span>
          <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">Multi-AZ Active</span>
        </div>
      </div>

      {/* 3. SYSTEM ARCHITECTURE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Microservices & Edge Topology */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Microservices Cluster Card */}
          <div className="bg-[#e6f4f1] border border-[#99f6e4] p-6 rounded-none shadow-2xs space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0d9488] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#0d9488]" />
              <span>Microservices Cluster Topology</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* API Gateway */}
              <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-4 text-center rounded-none shadow-2xs group">
                <Globe2 className="w-7 h-7 text-[#0d9488] mx-auto mb-2" />
                <h4 className="text-xs font-black text-[#0f3c4c]">API Gateway</h4>
                <div className="mt-2 flex justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">{traffic} req/s</p>
              </div>

              {/* Auth Service */}
              <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-4 text-center rounded-none shadow-2xs">
                <Lock className="w-7 h-7 text-indigo-600 mx-auto mb-2" />
                <h4 className="text-xs font-black text-[#0f3c4c]">IAM Auth</h4>
                <p className="text-[10px] text-emerald-700 font-extrabold mt-2">Zero-Trust</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">2 Active Pods</p>
              </div>

              {/* EHR Core */}
              <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-4 text-center rounded-none shadow-2xs">
                <Database className="w-7 h-7 text-amber-600 mx-auto mb-2" />
                <h4 className="text-xs font-black text-[#0f3c4c]">EHR Core</h4>
                <p className="text-[10px] text-emerald-700 font-extrabold mt-2">Active</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">5 Active Pods</p>
              </div>

              {/* Telemetry/IoT */}
              <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-4 text-center rounded-none shadow-2xs">
                <Radio className="w-7 h-7 text-rose-500 mx-auto mb-2" />
                <h4 className="text-xs font-black text-[#0f3c4c]">IoT Broker</h4>
                <p className="text-[10px] text-emerald-700 font-extrabold mt-2">WebSockets</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">124 Devices</p>
              </div>
            </div>
          </div>

          {/* Cloud-Native & Edge Computing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#e6f4f1] border border-[#99f6e4] p-5 rounded-none shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0f3c4c] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0d9488]" />
                <span>Edge Processing Nodes</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Critical vitals and local rendering are processed directly at the clinic edge before cloud sync to ensure zero-latency care.
              </p>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center bg-[#f0fdfa] p-2.5 border border-[#ccfbf1]">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#0d9488]" />
                    <span className="text-xs font-bold text-[#0f3c4c]">Clinic Server A (Local)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold font-mono">1.2ms Ping</span>
                </div>
                <div className="flex justify-between items-center bg-[#f0fdfa] p-2.5 border border-[#ccfbf1]">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#0d9488]" />
                    <span className="text-xs font-bold text-[#0f3c4c]">Clinic Server B (Local)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold font-mono">1.4ms Ping</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-5 rounded-none shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0d9488] flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#0d9488]" />
                  <span>Cloud Replication Engine</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Asynchronous PostgreSQL replication persisting live records to AWS Multi-AZ infrastructure with AES-256 encryption.
                </p>
              </div>

              <div className="pt-4 border-t border-[#ccfbf1] flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Async Multi-AZ Sync Active</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: API-First Engine */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#e6f4f1] border border-[#99f6e4] p-5 rounded-none shadow-2xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0f3c4c] flex items-center gap-2">
              <Code className="w-4 h-4 text-[#0d9488]" />
              <span>API Health &amp; Security</span>
            </h3>
            
            <div className="py-4 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#0d9488] bg-[#e6f4f1]">
                <div className="text-center">
                  <span className="block text-2xl font-black font-mono text-[#0f3c4c]">{apiHealth.toFixed(2)}%</span>
                  <span className="text-[9px] uppercase font-bold text-[#0d9488]">API Uptime</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-[#f0fdfa] border border-[#ccfbf1]">
                <span className="text-slate-600 font-medium">SSL / TLS Protocol:</span>
                <span className="font-extrabold text-[#0d9488] font-mono">TLS v1.3</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#f0fdfa] border border-[#ccfbf1]">
                <span className="text-slate-600 font-medium">Database Engine:</span>
                <span className="font-extrabold text-[#0f3c4c] font-mono">Supabase PG16</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#f0fdfa] border border-[#ccfbf1]">
                <span className="text-slate-600 font-medium">PDPA / HIPAA Compliance:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-300">100% Certified</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
