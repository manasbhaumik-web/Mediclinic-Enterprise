import React, { useState, useMemo } from 'react';
import { AlertTriangle, Stethoscope, Search, CheckCircle2 } from 'lucide-react';
import Input from '../ui/Input';
import { ICD10Code, Language } from '../../types';
import { TRANSLATIONS, ICD10_CATALOG } from '../../data';
import { useAuxiliary } from '../../context/AuxiliaryContext';

interface AssessmentTabProps {
  selectedICD: ICD10Code | null;
  setSelectedICD: React.Dispatch<React.SetStateAction<ICD10Code | null>>;
  clinicalNotes: string;
  setClinicalNotes: React.Dispatch<React.SetStateAction<string>>;
  activeLanguage: Language;
}

export default function AssessmentTab({
  selectedICD,
  setSelectedICD,
  clinicalNotes,
  setClinicalNotes,
  activeLanguage
}: AssessmentTabProps) {
  const t = TRANSLATIONS[activeLanguage];
  const { icd10Catalog } = useAuxiliary();

  const catalog = useMemo(() => {
    return (icd10Catalog && icd10Catalog.length > 0) ? icd10Catalog : ICD10_CATALOG;
  }, [icd10Catalog]);

  const [searchICDQuery, setSearchICDQuery] = useState('');

  // Filter ICD suggestions starting from 1 character for instant search responsiveness
  const icdSuggestions = useMemo(() => {
    const q = searchICDQuery.trim().toLowerCase();
    if (!q) return [];
    return catalog.filter(
      (i) => i.code.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [searchICDQuery, catalog]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header bar */}
      <div className="bg-[#e0f5f2] dark:bg-[#082830] p-3.5 rounded-none border border-[#b2f5ea] dark:border-teal-800/50 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
            Assessment &amp; Clinical Diagnostic Classification
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Select standardized ICD-10 diagnostic code for sign-off.</p>
        </div>
      </div>

      {/* ICD-10 Search & Quick Pills */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-tight">
            Search ICD-10 Diagnostic Catalog <span className="text-rose-500">*</span>
          </label>
          
          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5">
            <button 
              type="button"
              onClick={() => setSelectedICD(catalog.find(i => i.code === 'J06.9') || { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified (URTI)', category: 'Infectious / Respiratory' })} 
              className="text-[10px] bg-[#e0f5f2] dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] font-bold px-2.5 py-1 rounded-none cursor-pointer transition-all border border-[#b2f5ea] dark:border-teal-700/50 shadow-2xs"
            >
              URTI (J06.9)
            </button>
            <button 
              type="button"
              onClick={() => setSelectedICD(catalog.find(i => i.code === 'I10') || { code: 'I10', desc: 'Essential (primary) hypertension (HTN)', category: 'Cardiovascular' })} 
              className="text-[10px] bg-[#e0f5f2] dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] font-bold px-2.5 py-1 rounded-none cursor-pointer transition-all border border-[#b2f5ea] dark:border-teal-700/50 shadow-2xs"
            >
              HTN (I10)
            </button>
            <button 
              type="button"
              onClick={() => setSelectedICD(catalog.find(i => i.code === 'E11.9') || { code: 'E11.9', desc: 'Type 2 diabetes mellitus (T2DM)', category: 'Endocrine / Metabolic' })} 
              className="text-[10px] bg-[#e0f5f2] dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] font-bold px-2.5 py-1 rounded-none cursor-pointer transition-all border border-[#b2f5ea] dark:border-teal-700/50 shadow-2xs"
            >
              T2DM (E11.9)
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <Input
              type="text"
              id="icd10-catalog-search"
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white border border-[#b2f5ea] dark:border-teal-800/50 rounded-none focus:ring-3 focus:ring-[#0d9488]/15 focus:border-[#0d9488] focus:outline-none font-medium placeholder:text-slate-400"
              value={searchICDQuery}
              onChange={(e) => setSearchICDQuery(e.target.value)}
              placeholder="Search diagnosis by keyword or code (e.g., 'Fever', 'J06', 'Hypertension', 'Diabetes', 'Gastritis')..."
            />
          </div>
          
          {searchICDQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#082830] border border-[#b2f5ea] dark:border-teal-700/50 rounded-none shadow-xl z-20 max-h-[240px] overflow-y-auto divide-y divide-slate-100 dark:divide-teal-800/40">
              {icdSuggestions.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setSelectedICD(item);
                    setSearchICDQuery('');
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#e0f5f2]/60 dark:hover:bg-[#0e4857] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="pr-2">
                    <span className="font-mono font-bold text-[#0d9488] dark:text-[#2dd4bf] block text-[11px]">{item.code}</span>
                    <span className="text-[#0f3c4c] dark:text-[#f8fafc] font-semibold block text-xs">{item.desc}</span>
                  </div>
                  <span className="text-[9px] text-[#0f766e] dark:text-[#5eead4] bg-[#e0f5f2] dark:bg-[#0c3844] px-2 py-0.5 rounded-none font-bold uppercase shrink-0 border border-[#b2f5ea] dark:border-teal-800/40">
                    {item.category}
                  </span>
                </button>
              ))}

              {/* Allow assigning typed custom diagnosis if not in catalog */}
              <button
                type="button"
                onClick={() => {
                  setSelectedICD({
                    code: `DX-${searchICDQuery.trim().substring(0, 6).toUpperCase()}`,
                    desc: searchICDQuery.trim(),
                    category: 'Clinical Diagnosis'
                  });
                  setSearchICDQuery('');
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>➕ Assign Custom Diagnosis: "{searchICDQuery.trim()}"</span>
                <span className="text-[9px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded-none uppercase font-mono">Custom DX</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assessment display selection indicator */}
      {selectedICD ? (
        <div id="selected-icd-indicator" className="bg-[#e0f5f2] dark:bg-[#082830] border-2 border-[#0d9488] dark:border-[#2dd4bf] p-4 rounded-none shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] bg-[#0d9488] text-white px-2.5 py-0.5 rounded-none font-mono font-bold tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Assigned ICD-10 Code: {selectedICD.code}
            </span>
            <button
              type="button"
              onClick={() => setSelectedICD(null)}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold shrink-0 cursor-pointer transition-colors"
            >
              Change / Remove
            </button>
          </div>
          <strong className="text-sm font-extrabold text-[#0f3c4c] dark:text-[#f8fafc] uppercase block">{selectedICD.desc}</strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-1">Classification Category: {selectedICD.category}</span>
        </div>
      ) : (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-none border border-rose-200 dark:border-rose-800/50 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>Please search and select a diagnostic classification code (ICD-10) to complete clinical sign-off.</span>
        </div>
      )}

      {/* Clinician notes description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-tight">
          Clinical Sign-Off Notes &amp; Examination Summary
        </label>
        <textarea
          id="soap-notes-clinical-desc"
          className="w-full bg-white dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/50 focus:border-[#0d9488] focus:ring-3 focus:ring-[#0d9488]/15 rounded-none px-4 py-3.5 text-xs text-[#0f3c4c] dark:text-[#f8fafc] transition-all outline-none shadow-xs resize-y min-h-[130px] leading-relaxed placeholder:text-slate-400"
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="Enter medical assessment summary, specialist report references, diagnostic reasoning, follow-up advice..."
        />
      </div>
    </div>
  );
}
