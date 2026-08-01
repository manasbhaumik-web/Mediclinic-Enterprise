import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, Users, PackageSearch, HeartPulse, Wrench, LayoutDashboard,
  BrainCircuit, CalendarDays, BarChart4, MoveUpRight, Zap, Target, Truck
} from 'lucide-react';

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
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-[0.03]">
          <Activity className="w-64 h-64 text-[#07B2B2]" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-800">
            <BrainCircuit className="w-7 h-7 text-[#07B2B2]" />
            Operational Excellence Engine
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl mt-2">
            AI-driven logistics and resource management. Optimize patient flow, predict inventory shortages, and dynamically allocate clinic resources in real-time.
          </p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Visitor Traffic */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Live Traffic</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{trafficCount}</span>
              <span className="text-xs text-slate-400 font-medium">Patients</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-0.5 rounded">
              <MoveUpRight className="w-3 h-3" />
              12% below capacity
            </p>
          </div>
        </div>

        {/* Queue Management */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Avg Wait Time</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{waitAvg}</span>
              <span className="text-xs text-slate-400 font-medium">Mins</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(waitAvg/30)*100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Staff Shift */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden md:col-span-2">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
          <div className="relative z-10 flex justify-between items-center h-full">
            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Shift Optimization</span>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight">
                Recommended: Add 1 Triage Nurse between 2PM - 5PM.
              </p>
              <p className="text-xs text-slate-500 mt-1">Based on historical surge prediction.</p>
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0">
              Apply Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ML Scheduling & Resources */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                Smart Scheduling Engine
              </h2>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded">ML ACTIVE</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Booking Efficiency Rate</p>
                  <p className="text-[10px] text-slate-500">Minimizing provider idle time</p>
                </div>
                <span className="text-lg font-black text-indigo-600">94.2%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 mb-3">Resource Allocation (Live)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Room 1 (Consult)</p>
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Occupied - Dr. Sarah
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Room 2 (Treatment)</p>
                    <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Prep - Nurse Ali
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                Predictive Maintenance
              </h2>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <HeartPulse className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">ECG Monitor B Calibration Due</p>
                  <p className="text-xs text-amber-700 mt-1">Based on usage cycles, AI predicts sensor drift within 48 hours. Please schedule maintenance.</p>
                  <button className="mt-2 text-[10px] font-bold bg-amber-200 text-amber-800 px-3 py-1 rounded hover:bg-amber-300 transition-colors">
                    Create Service Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory & Analytics */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <PackageSearch className="w-5 h-5 text-teal-500" />
                Automated Inventory Management
              </h2>
              <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded">AUTO-ORDER: ON</span>
            </div>
            <div className="p-5 space-y-5">
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Amoxicillin 250mg</span>
                  <span className="text-slate-500">240 caps left (3 days supply)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Paracetamol 500mg</span>
                  <span className="text-slate-500">850 tabs left (14 days supply)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700 text-red-600 flex items-center gap-1"><Zap className="w-3 h-3"/> Lisinopril 10mg</span>
                  <span className="text-red-500 font-bold">12 units left (Critical)</span>
                </div>
                <div className="w-full bg-red-100 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full animate-pulse" style={{ width: '8%' }}></div>
                </div>
              </div>

              <div className="mt-6 p-4 border border-teal-100 bg-teal-50/30 rounded-xl">
                <p className="text-xs font-bold text-teal-800 mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> AI Purchasing Insights
                </p>
                <p className="text-xs text-teal-700 leading-relaxed">
                  Flu season indicators show a 40% expected rise in respiratory cases next week. Auto-drafted a PO for Lisinopril and Amoxicillin to supplier "PharmaCorp".
                </p>
                <button className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm">
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
