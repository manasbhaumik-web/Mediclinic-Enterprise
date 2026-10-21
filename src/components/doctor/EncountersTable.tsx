import { Calendar, Search, Filter } from 'lucide-react';

interface EncountersTableProps {
  filteredEncounters: { id: string; date: string; patientName: string; icdCode: string; paymentMethod: string; durationMin: number; totalFee: number; }[];
  reportSearchQuery: string;
  setReportSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  reportPaymentFilter: string;
  setReportPaymentFilter: React.Dispatch<React.SetStateAction<string>>;
  displayEncounters: { id: string; date: string; patientName: string; icdCode: string; paymentMethod: string; durationMin: number; totalFee: number; }[];
  aggregateFees: number;
}

export default function EncountersTable({ filteredEncounters, reportSearchQuery, setReportSearchQuery, reportPaymentFilter, setReportPaymentFilter, displayEncounters, aggregateFees }: EncountersTableProps) {
  return (
    <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 rounded-none overflow-hidden space-y-0 shadow-xs">
      {/* Filter Bar */}
      <div className="p-4 bg-surface-muted dark:bg-night-850 border-b border-line-subtle dark:border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="type-card-title text-ink dark:text-teal-300">Detailed Encounter &amp; Fee Ledger</h3>
          <span className="text-xs font-mono bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none font-bold">
            {filteredEncounters.length} Record{filteredEncounters.length !== 1 ? 's' : ''}
          </span>
        </div>
    
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-accent" />
            <input
              type="text"
              placeholder="Search patient, ICD code..."
              value={reportSearchQuery}
              onChange={(e) => setReportSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 text-xs font-bold text-ink dark:text-teal-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand w-48 sm:w-56 rounded-none"
            />
          </div>
    
          {/* Payment Method Filter */}
          <div className="flex items-center justify-center gap-1.5 bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 px-2.5 py-1.5 rounded-none">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <select
              value={reportPaymentFilter}
              onChange={(e) => setReportPaymentFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-ink dark:text-teal-100 focus:outline-none rounded-none cursor-pointer"
            >
              <option value="all">All Payment Routes</option>
              <option value="Panel">Corporate Panel</option>
              <option value="Cash">Direct Cash/QR</option>
              <option value="Insurance">Insurance (Medisave)</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>
        </div>
      </div>
    
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-surface-accent dark:bg-night-850 text-accent dark:text-teal-300 border-b border-line dark:border-teal-800/40 uppercase tracking-wider font-bold font-mono">
              <th className="px-4 py-3">Encounter ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Patient Name</th>
              <th className="px-4 py-3">ICD-10 Diagnostic Code</th>
              <th className="px-4 py-3">Payment Route</th>
              <th className="px-4 py-3 text-center">Consult Time</th>
              <th className="px-4 py-3 text-right">Total Fee (RM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-accent dark:divide-teal-800/30">
            {filteredEncounters.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-slate-400 italic">
                  No encounter records match your search criteria.
                </td>
              </tr>
            ) : (
              filteredEncounters.map((visit) => (
                <tr key={visit.id} className="hover:bg-surface-muted dark:hover:bg-night-850/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-accent dark:text-teal-300">{visit.id}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 font-medium">{visit.date}</td>
                  <td className="px-4 py-3 font-bold text-ink dark:text-white">
                    {visit.patientName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-surface-muted dark:bg-night-850 text-accent dark:text-teal-300 px-2 py-0.5 font-mono text-2xs font-bold rounded-none border border-line-subtle dark:border-teal-800/40">
                      {visit.icdCode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-2xs font-bold font-mono uppercase rounded-none border ${
                      visit.paymentMethod === 'Panel'
                        ? 'bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border-line dark:border-teal-800/40'
                        : visit.paymentMethod === 'Insurance'
                        ? 'bg-teal-900/10 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700'
                        : visit.paymentMethod === 'Credit Card'
                        ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                        : 'bg-surface-accent dark:bg-night-850 text-accent dark:text-teal-300 border-line-subtle dark:border-teal-800/40'
                    }`}>
                      {visit.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300 font-medium">
                    {visit.durationMin} mins
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-ink dark:text-teal-300">
                    RM {visit.totalFee.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    
      {/* Table Footer */}
      <div className="p-3 bg-surface-muted dark:bg-night-850 border-t border-line-subtle dark:border-teal-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
        <span className="font-mono">
          Showing {filteredEncounters.length} of {displayEncounters.length} encounters
        </span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink dark:text-teal-200">Subtotal Fees:</span>
          <span className="font-mono font-bold text-accent dark:text-teal-300 text-sm">RM {aggregateFees.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
