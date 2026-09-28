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
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      
      {/* 1. STRUCTURED PAGE HEADER BANNER */}
      <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
              Infrastructure Topology
            </span>
            <span className="flex items-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Systems Normal
            </span>
          </div>
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <Server className="w-6 h-6 text-accent" />
            System Architecture &amp; Cloud Engine
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            API-First Microservices, Edge Computing, and Cloud-Native Multi-AZ Infrastructure.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="bg-white text-deep px-3 py-1.5 border border-line text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>LATENCY: 1.2ms</span>
          </span>
        </div>
      </div>

      {/* 2. TOP METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">API Request Throughput</span>
          <span className="text-xl font-bold font-mono text-ink block mt-0.5">{traffic} req/s</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Microservices Uptime</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-0.5">{apiHealth.toFixed(2)}%</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Edge Local Latency</span>
          <span className="text-xl font-bold font-mono text-accent block mt-0.5">1.2ms Ping</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">AWS Cloud Replication</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-0.5">Multi-AZ Active</span>
        </div>
      </div>

      {/* 3. SYSTEM ARCHITECTURE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Microservices & Edge Topology */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Microservices Cluster Card */}
          <div className="bg-surface-accent border border-line p-6 rounded-none shadow-2xs space-y-6">
            <h3 className="type-label text-accent flex items-center gap-2">
              <Server className="w-4 h-4 text-accent" />
              <span>Microservices Cluster Topology</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* API Gateway */}
              <div className="bg-surface-muted border border-line-subtle p-4 text-center rounded-none shadow-2xs group">
                <Globe2 className="w-7 h-7 text-accent mx-auto mb-2" />
                <h4 className="type-card-title text-ink">API Gateway</h4>
                <div className="mt-2 flex justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></span>
                </div>
                <p className="text-2xs text-slate-500 mt-2 font-mono">{traffic} req/s</p>
              </div>

              {/* Auth Service */}
              <div className="bg-surface-muted border border-line-subtle p-4 text-center rounded-none shadow-2xs">
                <Lock className="w-7 h-7 text-indigo-600 mx-auto mb-2" />
                <h4 className="type-card-title text-ink">IAM Auth</h4>
                <p className="text-2xs text-emerald-700 font-bold mt-2">Zero-Trust</p>
                <p className="text-2xs text-slate-500 mt-1 font-mono">2 Active Pods</p>
              </div>

              {/* EHR Core */}
              <div className="bg-surface-muted border border-line-subtle p-4 text-center rounded-none shadow-2xs">
                <Database className="w-7 h-7 text-amber-600 mx-auto mb-2" />
                <h4 className="type-card-title text-ink">EHR Core</h4>
                <p className="text-2xs text-emerald-700 font-bold mt-2">Active</p>
                <p className="text-2xs text-slate-500 mt-1 font-mono">5 Active Pods</p>
              </div>

              {/* Telemetry/IoT */}
              <div className="bg-surface-muted border border-line-subtle p-4 text-center rounded-none shadow-2xs">
                <Radio className="w-7 h-7 text-rose-500 mx-auto mb-2" />
                <h4 className="type-card-title text-ink">IoT Broker</h4>
                <p className="text-2xs text-emerald-700 font-bold mt-2">WebSockets</p>
                <p className="text-2xs text-slate-500 mt-1 font-mono">124 Devices</p>
              </div>
            </div>
          </div>

          {/* Cloud-Native & Edge Computing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-accent border border-line p-5 rounded-none shadow-2xs space-y-3">
              <h3 className="type-label text-ink flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" />
                <span>Edge Processing Nodes</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Critical vitals and local rendering are processed directly at the clinic edge before cloud sync to ensure zero-latency care.
              </p>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center bg-surface-muted p-2.5 border border-line-subtle">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-ink">Clinic Server A (Local)</span>
                  </div>
                  <span className="text-2xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold font-mono">1.2ms Ping</span>
                </div>
                <div className="flex justify-between items-center bg-surface-muted p-2.5 border border-line-subtle">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-ink">Clinic Server B (Local)</span>
                  </div>
                  <span className="text-2xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold font-mono">1.4ms Ping</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-muted border border-line-subtle p-5 rounded-none shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="type-label text-accent flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-accent" />
                  <span>Cloud Replication Engine</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Asynchronous PostgreSQL replication persisting live records to AWS Multi-AZ infrastructure with AES-256 encryption.
                </p>
              </div>

              <div className="pt-4 border-t border-line-subtle flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Async Multi-AZ Sync Active</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: API-First Engine */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-accent border border-line p-5 rounded-none shadow-2xs space-y-4">
            <h3 className="type-label text-ink flex items-center gap-2">
              <Code className="w-4 h-4 text-accent" />
              <span>API Health &amp; Security</span>
            </h3>
            
            <div className="py-4 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-brand bg-surface-accent">
                <div className="text-center">
                  <span className="type-metric block font-mono text-ink">{apiHealth.toFixed(2)}%</span>
                  <span className="text-2xs uppercase font-bold text-accent">API Uptime</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-surface-muted border border-line-subtle">
                <span className="text-slate-600 font-medium">SSL / TLS Protocol:</span>
                <span className="font-bold text-accent font-mono">TLS v1.3</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-surface-muted border border-line-subtle">
                <span className="text-slate-600 font-medium">Database Engine:</span>
                <span className="font-bold text-ink font-mono">Supabase PG16</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-surface-muted border border-line-subtle">
                <span className="text-slate-600 font-medium">PDPA / HIPAA Compliance:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-300">100% Certified</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
