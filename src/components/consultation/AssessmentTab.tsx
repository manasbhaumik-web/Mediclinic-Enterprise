import React, { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
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
    <div className="space-y-4 animate-fadeIn">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight">
            {t.icd10Search} <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Button 
              type="button"
              onClick={() => setSelectedICD(catalog.find(i=>i.code==='J06.9') || { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified (URTI)', category: 'Infectious / Respiratory' })} 
              className="text-[9px] bg-[#e0f5f2] hover:bg-[#0d9488] hover:text-white text-[#0d9488] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border border-[#ccfbf1]"
            >
              URTI (J06.9)
            </Button>
            <Button 
              type="button"
              onClick={() => setSelectedICD(catalog.find(i=>i.code==='I10') || { code: 'I10', desc: 'Essential (primary) hypertension (HTN)', category: 'Cardiovascular' })} 
              className="text-[9px] bg-[#e0f5f2] hover:bg-[#0d9488] hover:text-white text-[#0d9488] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border border-[#ccfbf1]"
            >
              HTN (I10)
            </Button>
            <Button 
              type="button"
              onClick={() => setSelectedICD(catalog.find(i=>i.code==='E11.9') || { code: 'E11.9', desc: 'Type 2 diabetes mellitus (T2DM)', category: 'Endocrine / Metabolic' })} 
              className="text-[9px] bg-[#e0f5f2] hover:bg-[#0d9488] hover:text-white text-[#0d9488] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border border-[#ccfbf1]"
            >
              T2DM (E11.9)
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Input
            type="text"
            id="icd10-catalog-search"
            className="w-full text-xs px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] focus:outline-none"
            value={searchICDQuery}
            onChange={(e) => setSearchICDQuery(e.target.value)}
            placeholder="Search standard diagnose (e.g., 'Cold', 'J06', 'Hypertension', 'Diabetes', 'Gastritis', 'Fever')..."
          />
          
          {searchICDQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-[220px] overflow-y-auto divide-y divide-slate-100">
              {icdSuggestions.map((item) => (
                <Button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setSelectedICD(item);
                    setSearchICDQuery('');
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-teal-50/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="pr-2">
                    <span className="font-mono font-bold text-[#0d9488] block text-[11px]">{item.code}</span>
                    <span className="text-slate-800 font-medium block text-xs">{item.desc}</span>
                  </div>
                  <span className="text-[9px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-bold uppercase shrink-0 border border-teal-200">
                    {item.category}
                  </span>
                </Button>
              ))}

              {/* Allow assigning typed custom diagnosis if not in catalog */}
              <Button
                type="button"
                onClick={() => {
                  setSelectedICD({
                    code: `DX-${searchICDQuery.trim().substring(0, 6).toUpperCase()}`,
                    desc: searchICDQuery.trim(),
                    category: 'Clinical Diagnosis'
                  });
                  setSearchICDQuery('');
                }}
                className="w-full text-left px-3 py-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>➕ Assign Custom Diagnosis: "{searchICDQuery.trim()}"</span>
                <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded uppercase font-mono">Custom DX</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Assessment display selection indicator */}
      {selectedICD ? (
        <div id="selected-icd-indicator" className="bg-cyan-50 border border-[#0D9488]/20 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] bg-[#0D9488] text-white px-1.5 py-0.5 rounded font-mono font-bold">
              ICD-Code: {selectedICD.code}
            </span>
            <Button
              type="button"
              onClick={() => setSelectedICD(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold shrink-0 cursor-pointer"
            >
              Remove
            </Button>
          </div>
          <strong className="text-xs text-slate-800 uppercase block">{selectedICD.desc}</strong>
          <span className="text-[10px] text-slate-500 block mt-1">Category Grouping: {selectedICD.category}</span>
        </div>
      ) : (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Please search and assign an ICD-10 clinically coded diagnosis to complete assessment.</span>
        </div>
      )}

      {/* Clinician notes description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1">
          Assessment / Clinical Sign-off Summary (Procedures/Investigations)
        </label>
        <textarea
          id="soap-notes-clinical-desc"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none shadow-inner resize-y min-h-[120px] leading-relaxed"
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="Enter medical assessment summary, specialist reports references, follow-up parameters, or procedural logs..."
        />
      </div>
    </div>
  );
}
