import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ICD10Code, Language } from '../../types';
import { TRANSLATIONS } from '../../data';
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

  const [searchICDQuery, setSearchICDQuery] = useState('');
  const [icdSuggestions, setIcdSuggestions] = useState<ICD10Code[]>([]);

  // Filter ICD suggestions
  useEffect(() => {
    if (searchICDQuery.trim() === '') {
      setIcdSuggestions([]);
    } else if (searchICDQuery.trim().length > 1) {
      const filtered = icd10Catalog.filter(
        (i) => i.code.toLowerCase().includes(searchICDQuery.toLowerCase()) || i.desc.toLowerCase().includes(searchICDQuery.toLowerCase())
      );
      setIcdSuggestions(filtered);
    }
  }, [searchICDQuery, icd10Catalog]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight">
            {t.icd10Search} <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Button onClick={() => setSelectedICD(icd10Catalog.find(i=>i.code==='J06.9')||null)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded cursor-pointer transition-colors">URTI (J06.9)</Button>
            <Button onClick={() => setSelectedICD(icd10Catalog.find(i=>i.code==='I10')||null)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded cursor-pointer transition-colors">HTN (I10)</Button>
            <Button onClick={() => setSelectedICD(icd10Catalog.find(i=>i.code==='E11.9')||null)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded cursor-pointer transition-colors">T2DM (E11.9)</Button>
          </div>
        </div>
        <div className="relative">
          <Input
            type="text"
            id="icd10-catalog-search"
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 focus:outline-none"
            value={searchICDQuery}
            onChange={(e) => setSearchICDQuery(e.target.value)}
            placeholder="Search standard diagnose (e.g., 'Cold', 'J06', 'Hypertension', 'Diabetes', 'Gastritis')..."
          />
          
          {icdSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-[160px] overflow-y-auto">
              {icdSuggestions.map((item) => (
                <Button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setSelectedICD(item);
                    setSearchICDQuery('');
                    setIcdSuggestions([]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-mono font-bold text-[#0D9488]">{item.code}</span>
                    <span className="text-slate-700 ml-2">{item.desc}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                    {item.category}
                  </span>
                </Button>
              ))}
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
          className="w-full text-xs min-h-[80px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 focus:outline-none"
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="Enter medical assessment summary, specialist reports references, follow-up parameters, or procedural logs..."
        />
      </div>
    </div>
  );
}
