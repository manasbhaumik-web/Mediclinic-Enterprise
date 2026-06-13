import React, { useState, useEffect } from 'react';
import { 
  Server, Database, Network, Cloud, Cpu, Activity, ServerCrash, 
  Wifi, Zap, Lock, Code, Globe2, Radio, Smartphone
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
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Network className="w-8 h-8 text-[#07B2B2]" />
            System Architecture
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            API-First Microservices, Edge Computing, and Cloud-Native Infrastructure.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-emerald-100 text-[#07B2B2] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200">
            <Wifi className="w-4 h-4" /> ALL SYSTEMS NORMAL
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Microservices & Edge Topology */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Microservices Infrastructure */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#07B2B2] via-white to-white"></div>
            
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-[#07B2B2] relative z-10">
              <Server className="w-5 h-5" />
              Microservices Cluster
            </h3>
            
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* API Gateway */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center shadow-sm relative group">
                <div className="absolute inset-0 bg-[#07B2B2] opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"></div>
                <Globe2 className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">API Gateway</h4>
                <div className="mt-2 flex justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150"></span>
                </div>
                <p className="text-[9px] text-slate-500 mt-2 font-mono">{traffic} req/s</p>
              </div>

              {/* Auth Service */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center shadow-sm">
                <Lock className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">IAM Auth</h4>
                <p className="text-[10px] text-emerald-600 font-bold mt-2">Zero-Trust</p>
                <p className="text-[9px] text-slate-500 mt-1 font-mono">Scaling: 2 Pods</p>
              </div>

              {/* EHR Core */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center shadow-sm relative">
                <Database className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">EHR Core</h4>
                <p className="text-[10px] text-emerald-600 font-bold mt-2">Active</p>
                <p className="text-[9px] text-slate-500 mt-1 font-mono">Scaling: 5 Pods</p>
              </div>

              {/* Telemetry/IoT */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center shadow-sm">
                <Radio className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">IoT Broker</h4>
                <p className="text-[10px] text-emerald-600 font-bold mt-2">WebSockets</p>
                <p className="text-[9px] text-slate-500 mt-1 font-mono">124 Devices</p>
              </div>
            </div>
          </div>

          {/* Cloud-Native & Edge Computing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-800">
                <Cpu className="w-5 h-5 text-indigo-500" />
                Edge Processing Nodes
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Critical patient vitals and local AR rendering are processed directly at the clinic edge before cloud sync to ensure zero-latency care.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">Clinic Server A (Local)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">1.2ms Ping</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">Clinic Server B (Local)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">1.4ms Ping</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-indigo-800">
                <Cloud className="w-5 h-5 text-indigo-600" />
                Cloud Sync Status
              </h3>
              <div className="flex items-center justify-center h-24">
                <div className="text-center">
                  <Zap className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-bounce" />
                  <p className="text-indigo-900 font-black text-xl">Async Sync Active</p>
                  <p className="text-xs text-indigo-600 font-medium mt-1">Data persisting to AWS Multi-AZ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: API-First & Mobile */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* API-First Architecture */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-800">
              <Code className="w-5 h-5 text-[#07B2B2]" />
              API-First Engine
            </h3>
            
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#07B2B2] relative">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-800">{apiHealth.toFixed(2)}%</span>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Uptime</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs p-2 border-b border-slate-100">
                <span className="font-mono text-slate-600">GET /api/v2/patients</span>
                <span className="text-emerald-500 font-bold">24ms</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 border-b border-slate-100">
                <span className="font-mono text-slate-600">POST /api/v2/telemetry</span>
                <span className="text-emerald-500 font-bold">12ms</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 border-b border-slate-100">
                <span className="font-mono text-slate-600">GET /api/v2/billing/claims</span>
                <span className="text-emerald-500 font-bold">45ms</span>
              </div>
            </div>
            
            <div className="mt-4">
              <button className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-2">
                <Code className="w-4 h-4" /> Open Swagger Docs
              </button>
            </div>
          </div>

          {/* Mobile-First Design & Multi-Platform */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-800">
              <Smartphone className="w-5 h-5 text-slate-600" />
              Multi-Platform
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Application is fully responsive via Tailwind CSS. Accessible natively via PWA on iPad, iPhone, and Android for roving nurses.
            </p>
            <div className="flex justify-around items-center opacity-60">
              <Smartphone className="w-6 h-6 text-slate-800" />
              <div className="w-8 h-1 bg-slate-300 rounded"></div>
              <Server className="w-8 h-8 text-slate-800" />
              <div className="w-8 h-1 bg-slate-300 rounded"></div>
              <Globe2 className="w-8 h-8 text-slate-800" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
