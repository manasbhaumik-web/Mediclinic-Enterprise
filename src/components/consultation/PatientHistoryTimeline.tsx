import React from 'react';
import { History, Search, FileText, Download } from 'lucide-react';
import Button from '../ui/Button';
import { Visit } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PatientHistoryTimelineProps {
  patientPastVisits: Visit[];
}

export default function PatientHistoryTimeline({ patientPastVisits }: PatientHistoryTimelineProps) {
  
  // Transform past visits into chart data (oldest to newest)
  const chartData = [...patientPastVisits].reverse().map(visit => ({
    date: new Date(visit.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    sys: visit.soap.objective.bpSystolic,
    dia: visit.soap.objective.bpDiastolic,
    hr: visit.soap.objective.heartRate,
    temp: visit.soap.objective.temperature
  }));

  return (
    <div className="md:col-span-1 bg-slate-50 border-r border-slate-200 p-4 h-full overflow-y-auto flex flex-col gap-4">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
        <History className="w-4 h-4 text-slate-400" />
        Longitudinal Clinical History
      </h3>

      {/* Vitals Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 text-center">
            Vitals Trend (BP & Heart Rate)
          </h4>
          <div className="h-40 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{fontSize: 9}} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{fontSize: 9}} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ fontSize: '10px', borderRadius: '4px', border: '1px solid #E2E8F0', padding: '4px 8px' }}
                  itemStyle={{ padding: 0 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} />
                <Line yAxisId="left" type="monotone" dataKey="sys" name="Systolic" stroke="#ef4444" strokeWidth={2} dot={{r: 2}} activeDot={{r: 4}} />
                <Line yAxisId="left" type="monotone" dataKey="dia" name="Diastolic" stroke="#f97316" strokeWidth={2} dot={{r: 2}} activeDot={{r: 4}} />
                <Line yAxisId="left" type="monotone" dataKey="hr" name="HR" stroke="#06b6d4" strokeWidth={2} dot={{r: 2}} activeDot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="relative border-l-2 border-slate-200 ml-2 space-y-5">
        {patientPastVisits.length === 0 ? (
          <p className="text-xs text-slate-400 ml-4 italic">No past visits recorded. First time patient.</p>
        ) : (
          patientPastVisits.map((visit, idx) => (
            <div key={idx} className="relative pl-4 group">
              <div className="absolute w-3 h-3 bg-white border-2 border-[#0D9488] rounded-full -left-[7.5px] top-1 group-hover:scale-125 transition-transform" />
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group-hover:border-[#0D9488]/40 transition-colors">
                
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                    {new Date(visit.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                
                <h4 className="text-[11px] font-bold text-[#0D9488] uppercase tracking-wide leading-tight mt-1">
                  {visit.soap.assessment.icdCode} - {visit.soap.assessment.description}
                </h4>
                
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1.5 items-start">
                    <span className="text-[9px] font-bold text-slate-400 w-3 shrink-0">S:</span>
                    <p className="text-[10px] text-slate-600 leading-tight line-clamp-2" title={visit.soap.subjective}>{visit.soap.subjective}</p>
                  </div>
                  <div className="flex gap-1.5 items-start">
                    <span className="text-[9px] font-bold text-slate-400 w-3 shrink-0">O:</span>
                    <p className="text-[10px] text-slate-600 leading-tight font-mono">
                      BP:{visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} HR:{visit.soap.objective.heartRate} T:{visit.soap.objective.temperature}
                    </p>
                  </div>
                  <div className="flex gap-1.5 items-start">
                    <span className="text-[9px] font-bold text-slate-400 w-3 shrink-0">P:</span>
                    <p className="text-[10px] text-slate-600 leading-tight line-clamp-2">
                      {visit.soap.plan.prescription.map(m=>m.drugName).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button className="text-[9px] font-bold text-slate-500 hover:text-[#0D9488] flex items-center gap-1 cursor-pointer transition-colors">
                    <Search className="w-3 h-3" /> View Full
                  </button>
                  {visit.mcIssued && (
                    <button className="text-[9px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer transition-colors">
                      <FileText className="w-3 h-3" /> MC
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
