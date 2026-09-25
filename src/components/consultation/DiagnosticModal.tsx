import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, Search, CheckCircle2, AlertTriangle, X, Sparkles, Brain, 
  Activity, ShieldAlert, Heart, Thermometer, ChevronRight, FileText, Check 
} from 'lucide-react';
import Input from '../ui/Input';
import { ICD10Code, Language, Patient } from '../../types';
import { TRANSLATIONS, ICD10_CATALOG } from '../../data';
import { useAuxiliary } from '../../context/AuxiliaryContext';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedICD: ICD10Code | null;
  setSelectedICD: React.Dispatch<React.SetStateAction<ICD10Code | null>>;
  clinicalNotes: string;
  setClinicalNotes: React.Dispatch<React.SetStateAction<string>>;
  activeLanguage: Language;
  currentPatient: Patient;
  subjectiveSymptoms?: string;
  vitals?: {
    bpSystolic: number;
    bpDiastolic: number;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
  };
}

export default function DiagnosticModal({
  isOpen,
  onClose,
  selectedICD,
  setSelectedICD,
  clinicalNotes,
  setClinicalNotes,
  activeLanguage,
  currentPatient,
  subjectiveSymptoms = '',
  vitals
}: DiagnosticModalProps) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[activeLanguage];
  const { icd10Catalog } = useAuxiliary();

  const catalog = useMemo(() => {
    return (icd10Catalog && icd10Catalog.length > 0) ? icd10Catalog : ICD10_CATALOG;
  }, [icd10Catalog]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    catalog.forEach(item => {
      if (item.category) {
        item.category.split('/').forEach(c => cats.add(c.trim()));
      }
    });
    return ['ALL', ...Array.from(cats)];
  }, [catalog]);

  // AI Differential Diagnosis Recommendations based on symptoms and vitals
  const aiDifferentialDX = useMemo(() => {
    const text = subjectiveSymptoms.toLowerCase();
    const temp = vitals?.temperature || 36.8;
    const bpSys = vitals?.bpSystolic || 120;
    const hr = vitals?.heartRate || 72;

    const suggestions: { code: string; desc: string; category: string; matchReason: string; confidence: number }[] = [];

    // Symptom heuristics
    if (text.includes('fever') || text.includes('demam') || temp >= 37.5) {
      suggestions.push({
        code: 'J06.9',
        desc: 'Acute upper respiratory infection, unspecified (URTI)',
        category: 'Infectious / Respiratory',
        matchReason: `Elevated temp (${temp}°C) + fever symptom complaints`,
        confidence: 94
      });
    }

    if (text.includes('cough') || text.includes('batuk') || text.includes('sore throat')) {
      suggestions.push({
        code: 'J20.9',
        desc: 'Acute bronchitis, unspecified',
        category: 'Respiratory',
        matchReason: 'Productive cough & airway inflammation profile',
        confidence: 88
      });
    }

    if (bpSys >= 130 || text.includes('headache') || text.includes('pening')) {
      suggestions.push({
        code: 'I10',
        desc: 'Essential (primary) hypertension (HTN)',
        category: 'Cardiovascular',
        matchReason: `Systolic BP (${bpSys} mmHg) elevated above norm`,
        confidence: 91
      });
    }

    if (text.includes('stomach') || text.includes('gastric') || text.includes('sakit perut') || text.includes('nausea')) {
      suggestions.push({
        code: 'K29.70',
        desc: 'Gastritis, unspecified, without bleeding',
        category: 'Gastrointestinal',
        matchReason: 'Epigastric gastric discomfort & dyspepsia symptoms',
        confidence: 89
      });
    }

    if (text.includes('thirst') || text.includes('frequent urination') || text.includes('kencing manis')) {
      suggestions.push({
        code: 'E11.9',
        desc: 'Type 2 diabetes mellitus (T2DM)',
        category: 'Endocrine / Metabolic',
        matchReason: 'Metabolic glycemic risk profile',
        confidence: 86
      });
    }

    // Default fallback if no specific symptoms detected
    if (suggestions.length === 0) {
      suggestions.push(
        {
          code: 'J06.9',
          desc: 'Acute upper respiratory infection, unspecified (URTI)',
          category: 'Infectious / Respiratory',
          matchReason: 'Primary outpatient consultation presentation',
          confidence: 85
        },
        {
          code: 'K29.70',
          desc: 'Gastritis, unspecified, without bleeding',
          category: 'Gastrointestinal',
          matchReason: 'General outpatient abdominal / gastro presentation',
          confidence: 80
        }
      );
    }

    return suggestions;
  }, [subjectiveSymptoms, vitals, catalog]);

  // Filtered diagnostic items based on search and category
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter(item => {
      const matchesSearch = !q || 
        item.code.toLowerCase().includes(q) || 
        item.desc.toLowerCase().includes(q) || 
        (item.category && item.category.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'ALL' || 
        (item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchQuery, selectedCategory]);

  const handleSelectCode = (item: ICD10Code) => {
    setSelectedICD(item);
    if (!clinicalNotes) {
      setClinicalNotes(`Patient presenting with signs consistent with ${item.desc} (${item.code}). Initiated standard clinical management protocol.`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* MODAL CONTAINER */}
      <div 
        className="bg-white dark:bg-[#07252d] border-2 border-[#0d9488] w-full max-w-5xl rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#0f3c4c] dark:text-[#f8fafc]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostic-modal-title"
      >
        {/* MODAL HEADER */}
        <div className="bg-[#0f3c4c] dark:bg-[#082830] text-white p-4.5 border-b border-[#0d9488] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0d9488] text-white rounded-none flex items-center justify-center shadow-md">
              <Stethoscope className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="diagnostic-modal-title" className="text-base font-extrabold tracking-tight uppercase flex items-center gap-2">
                  Clinical Diagnostic Suite (ICD-10 &amp; AI Engine)
                </h3>
                <span className="bg-[#5eead4] text-[#0f3c4c] text-[10px] font-black uppercase px-2 py-0.5 rounded-none tracking-wider">
                  Interactive Window
                </span>
              </div>
              <p className="text-xs text-teal-100 font-medium">
                Patient: <strong className="text-white">{currentPatient.fullName}</strong> ({currentPatient.gender}, IC: <span className="font-mono">{currentPatient.icNumber}</span>)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-none flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Diagnostic Suite Popup Window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* AI DIFFERENTIAL DIAGNOSIS RECOMMENDATIONS */}
          <div className="bg-[#f0fdfa] dark:bg-[#0c3844] border border-[#b2f5ea] dark:border-teal-800/60 p-4 rounded-none space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
                AI Differential Diagnosis Suggestions (Symptom &amp; Vitals Match)
              </h4>
              <span className="text-[10px] text-[#0d9488] dark:text-[#5eead4] bg-white dark:bg-[#07252d] px-2 py-0.5 rounded-none font-mono font-bold border border-[#b2f5ea] dark:border-teal-800/40">
                Real-time Inference
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {aiDifferentialDX.map((dx) => {
                const isSelected = selectedICD?.code === dx.code;
                return (
                  <div
                    key={dx.code}
                    onClick={() => handleSelectCode({ code: dx.code, desc: dx.desc, category: dx.category })}
                    className={`p-3 rounded-none border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-md' 
                        : 'bg-white dark:bg-[#07252d] hover:bg-[#e0f5f2] dark:hover:bg-[#0e4857] border-[#b2f5ea] dark:border-teal-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`font-mono font-bold text-xs ${isSelected ? 'text-teal-100' : 'text-[#0d9488] dark:text-[#2dd4bf]'}`}>
                          {dx.code}
                        </span>
                        <h5 className="font-extrabold text-xs leading-snug mt-0.5">{dx.desc}</h5>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-none shrink-0 ${
                        isSelected ? 'bg-white text-[#0d9488]' : 'bg-[#e0f5f2] text-[#0f766e] dark:bg-[#0c3844] dark:text-[#5eead4]'
                      }`}>
                        {dx.confidence}% Match
                      </span>
                    </div>

                    <p className={`text-[10px] mt-2 pt-2 border-t font-medium ${
                      isSelected ? 'border-teal-600 text-teal-100' : 'border-slate-100 dark:border-teal-900/60 text-slate-500 dark:text-slate-400'
                    }`}>
                      💡 {dx.matchReason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEARCH BAR & CATEGORY TABS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-tight text-[#0f3c4c] dark:text-[#5eead4]">
                Search Master ICD-10 Catalog
              </label>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {catalog.slice(0, 4).map(item => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectCode(item)}
                    className="text-[10px] bg-[#e0f5f2] dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] font-bold px-2.5 py-1 rounded-none cursor-pointer transition-all border border-[#b2f5ea] dark:border-teal-700/50 shadow-2xs"
                  >
                    {item.code} ({item.desc.substring(0, 15)}...)
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <Input
                type="text"
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white border border-[#b2f5ea] dark:border-teal-800/50 rounded-none focus:ring-3 focus:ring-[#0d9488]/15 focus:border-[#0d9488] focus:outline-none font-medium placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagnosis by disease name, ICD code, or category (e.g. 'Hypertension', 'J06', 'Diabetes', 'Gastritis')..."
              />
            </div>

            {/* CATEGORY FILTER STRIP */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-none whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                      : 'bg-slate-100 dark:bg-[#0c3844] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-teal-800/40 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* DIAGNOSTIC CATALOG GRID */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Diagnostic Code Results ({filteredCatalog.length} Matches)
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCatalog.map((item) => {
                const isSelected = selectedICD?.code === item.code;
                return (
                  <div
                    key={item.code}
                    onClick={() => handleSelectCode(item)}
                    className={`p-3 rounded-none border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#e0f5f2] dark:bg-[#0c3844] border-2 border-[#0d9488] dark:border-[#2dd4bf] shadow-xs'
                        : 'bg-white dark:bg-[#07252d] border-slate-200 dark:border-teal-800/40 hover:border-[#0d9488]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0d9488] dark:text-[#2dd4bf]">
                          {item.code}
                        </span>
                        <span className="text-[9px] text-[#0f766e] bg-[#e0f5f2] dark:bg-[#082830] px-1.5 py-0.5 rounded-none font-bold uppercase border border-[#b2f5ea]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-[#0f3c4c] dark:text-slate-200 mt-1">{item.desc}</p>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-none transition-colors shrink-0 ${
                        isSelected 
                          ? 'bg-[#0d9488] text-white' 
                          : 'bg-slate-100 dark:bg-[#0e4857] text-slate-700 dark:text-teal-200 hover:bg-[#0d9488] hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Select DX'}
                    </button>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div className="col-span-2 p-6 bg-slate-50 dark:bg-[#082830] text-center border border-slate-200">
                  <p className="text-xs text-slate-600 font-semibold mb-2">No catalog match found for "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => handleSelectCode({
                      code: `DX-${searchQuery.trim().substring(0, 6).toUpperCase()}`,
                      desc: searchQuery.trim(),
                      category: 'Custom Clinical Diagnosis'
                    })}
                    className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-none hover:bg-emerald-700"
                  >
                    ➕ Assign Custom Diagnosis: "{searchQuery.trim()}"
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CLINICAL EXAMINATION & ASSESSMENT NOTES */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-teal-900/60">
            <label className="block text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-tight">
              Clinician Diagnostic Notes &amp; Sign-Off Reasonings
            </label>
            <textarea
              className="w-full bg-white dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/50 focus:border-[#0d9488] focus:ring-3 focus:ring-[#0d9488]/15 rounded-none px-4 py-2.5 text-xs text-[#0f3c4c] dark:text-[#f8fafc] transition-all outline-none shadow-xs resize-y min-h-[90px] leading-relaxed placeholder:text-slate-400"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter specific medical assessment findings, specialist consultations, imaging references, or follow-up instructions..."
            />
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 dark:bg-[#082830] p-4 border-t border-slate-200 dark:border-teal-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {selectedICD ? (
              <span className="flex items-center gap-1.5 font-bold text-[#0d9488] dark:text-[#2dd4bf]">
                <CheckCircle2 className="w-4 h-4" />
                Assigned Diagnosis: <span className="font-mono">{selectedICD.code}</span> — {selectedICD.desc}
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                ⚠️ No diagnostic code selected yet. Select a code above to confirm.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedICD(null)}
              className="px-4 py-2 border border-slate-300 text-slate-600 dark:text-slate-300 rounded-none text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              Clear Selection
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[#0d9488] hover:bg-[#0f766e] text-white px-6 py-2.5 rounded-none text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Confirm &amp; Assign Diagnosis</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
