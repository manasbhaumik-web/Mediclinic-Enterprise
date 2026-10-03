import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, Users, PackageSearch, HeartPulse, Wrench, LayoutDashboard,
  BrainCircuit, CalendarDays, BarChart4, MoveUpRight, Zap, Target, Truck, Check, RefreshCw, Plus
} from 'lucide-react';

import ProgressBar from './ui/ProgressBar';
export default function OperationsHub() {
  const [trafficCount, setTrafficCount] = useState(142);
  const [waitAvg, setWaitAvg] = useState(14);

  // Simulate live data changes
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficCount(prev => prev + Math.floor(Math.random() * 3));
      setWaitAvg(prev => Math.max(5, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      {/* STRUCTURED CLINICAL HEADER BANNER */}
      <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
              AI Logistics & Flow
            </span>
            <span className="flex items-center justify-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Real-time Telemetry
            </span>
          </div>
          <h1 className="type-page-title text-ink flex items-center justify-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-accent" />
            Operational Excellence Engine
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            AI-driven logistics and resource management. Optimize patient flow, predict inventory shortages, and dynamically allocate clinic resources in real-time.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            Sync Telemetry
          </button>
          <button className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-none flex items-center justify-center gap-1.5 border border-teal-500/30 transition-all shadow-sm cursor-pointer">
            <Zap className="w-4 h-4 text-amber-300" />
            Apply AI Schedule
          </button>
        </div>
      </div>

      {/* TOP 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Patient Traffic</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{trafficCount}</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium">
              <MoveUpRight className="w-3 h-3" /> 12% under cap
            </span>
          </div>
        </div>

        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Wait Time</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{waitAvg} mins</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium">
              Target &lt;20m
            </span>
          </div>
        </div>

        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking Efficiency</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">94.2%</h3>
            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium border border-teal-200">
              ML Scheduled
            </span>
          </div>
        </div>

        <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Automated Inventory</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <PackageSearch className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">Auto-PO</h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium border border-amber-200">
              2 Low Stock Flags
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ML Scheduling & Resources */}
        <div className="space-y-6">
          <div className="bg-surface-accent rounded-none border border-line shadow-2xs overflow-hidden">
            <div className="border-b border-teal-100 bg-surface p-4 flex items-center justify-between">
              <h2 className="type-card-title text-ink flex items-center justify-center gap-2">
                <CalendarDays className="w-4 h-4 text-accent" />
                Smart Scheduling Engine
              </h2>
              <span className="bg-teal-100 text-teal-800 text-2xs font-bold px-2 py-0.5 rounded border border-teal-200">ML ACTIVE</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-ink">Booking Efficiency Rate</p>
                  <p className="text-2xs text-slate-500">Minimizing provider idle time</p>
                </div>
                <span className="text-lg font-bold text-accent">94.2%</span>
              </div>
              <ProgressBar value={94.2} pill />
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-ink mb-3">Resource Allocation (Live)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface border border-teal-100 rounded-none p-3">
                    <p className="text-2xs text-slate-500 font-bold uppercase mb-1">Room 1 (Consult)</p>
                    <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Occupied - Dr. Sarah
                    </p>
                  </div>
                  <div className="bg-surface border border-teal-100 rounded-none p-3">
                    <p className="text-2xs text-slate-500 font-bold uppercase mb-1">Room 2 (Treatment)</p>
                    <p className="text-xs font-bold text-amber-600 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Prep - Nurse Ali
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-accent rounded-none border border-line shadow-2xs overflow-hidden">
            <div className="border-b border-teal-100 bg-surface p-4 flex items-center justify-between">
              <h2 className="type-card-title text-ink flex items-center justify-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                Predictive Maintenance
              </h2>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-4 p-3.5 bg-amber-50 border border-amber-200 rounded-none">
                <HeartPulse className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">ECG Monitor B Calibration Due</p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">Based on usage cycles, AI predicts sensor drift within 48 hours. Please schedule maintenance.</p>
                  <button className="mt-2 text-2xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded-none transition-colors">
                    Create Service Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory & Analytics */}
        <div className="space-y-6">
          <div className="bg-surface-accent rounded-none border border-line shadow-2xs overflow-hidden h-full">
            <div className="border-b border-teal-100 bg-surface p-4 flex items-center justify-between">
              <h2 className="type-card-title text-ink flex items-center justify-center gap-2">
                <PackageSearch className="w-4 h-4 text-accent" />
                Automated Inventory Management
              </h2>
              <span className="bg-teal-100 text-teal-800 text-2xs font-bold px-2 py-0.5 rounded border border-teal-200">AUTO-ORDER: ON</span>
            </div>
            <div className="p-5 space-y-5">
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-ink">Amoxicillin 250mg</span>
                  <span className="text-slate-500">240 caps left (3 days supply)</span>
                </div>
                <ProgressBar value={30} size="sm" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-ink">Paracetamol 500mg</span>
                  <span className="text-slate-500">850 tabs left (14 days supply)</span>
                </div>
                <ProgressBar value={75} size="sm" tone="success" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-red-600 flex items-center justify-center gap-1"><Zap className="w-3 h-3"/> Lisinopril 10mg</span>
                  <span className="text-red-500 font-bold">12 units left (Critical)</span>
                </div>
                <ProgressBar value={8} size="sm" tone="danger" pulse />
              </div>

              <div className="mt-6 p-4 border border-teal-200 bg-surface rounded-none">
                <p className="text-xs font-bold text-ink mb-1.5 flex items-center justify-center gap-2">
                  <Truck className="w-4 h-4 text-accent" /> AI Purchasing Insights
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Flu season indicators show a 40% expected rise in respiratory cases next week. Auto-drafted a PO for Lisinopril and Amoxicillin to supplier "PharmaCorp".
                </p>
                <button className="w-full mt-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 rounded-none transition-colors shadow-sm">
                  Review & Approve Purchase Order
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
