import React, { useState, useMemo } from 'react';
import { AlertTriangle, Stethoscope, Search, CheckCircle2, X, PlusCircle, Sparkles, ChevronRight, Check } from 'lucide-react';
import Input from '../../components/ui/Input';
import { ICD10Code, Language } from '../../types';
import { TRANSLATIONS, ICD10_CATALOG } from '../../data';
import { useAuxiliary } from '../../context/AuxiliaryContext';

interface AssessmentTabProps {
  selectedICD: ICD10Code | null;
  setSelectedICD: React.Dispatch<React.SetStateAction<ICD10Code | null>>;
  clinicalNotes: string;
  setClinicalNotes: React.Dispatch<React.SetStateAction<string>>;
  activeLanguage: Language;
  onProceedToPlan?: () => void;
}

// Layman synonym dictionary: maps common human words to relevant ICD-10 codes
const LAYMAN_SYNONYMS: Record<string, string[]> = {
  cold: ['J06.9', 'J00', 'J30.9', 'R05.9'],
  flu: ['J06.9', 'R50.9', 'Z23'],
  influenza: ['J06.9'],
  cough: ['R05.9', 'J06.9', 'J20.9', 'J45.909'],
  batuk: ['R05.9', 'J06.9'],
  sugar: ['E11.9', 'E10'],
  diabetes: ['E11.9'],
  'kencing manis': ['E11.9'],
  'blood pressure': ['I10', 'I25.10'],
  bp: ['I10'],
  pressure: ['I10'],
  hypertension: ['I10'],
  'darah tinggi': ['I10'],
  tummy: ['K29.7', 'K30', 'A09.9', 'K21.9', 'R11.2'],
  belly: ['K29.7', 'K30', 'A09.9'],
  stomach: ['K29.7', 'K30', 'K21.9'],
  perut: ['K29.7', 'K30', 'A09.9'],
  diarrhea: ['A09.9', 'K58.9'],
  cirit: ['A09.9'],
  gastric: ['K29.7', 'K30', 'K21.9'],
  gastritis: ['K29.7', 'K30'],
  fever: ['R50.9', 'A90', 'B01.9'],
  demam: ['R50.9', 'A90'],
  throat: ['J02.9', 'J06.9'],
  'sore throat': ['J02.9', 'J06.9'],
  headache: ['G43.909', 'G44.209'],
  migraine: ['G43.909'],
  asthma: ['J45.909'],
  semput: ['J45.909'],
  dengue: ['A90'],
  vomit: ['R11.2', 'A09.9'],
  muntah: ['R11.2', 'A09.9'],
  dizzy: ['R42'],
  giddy: ['R42'],
  pening: ['R42'],
  pain: ['M79.1', 'M54.5', 'R07.9'],
  sakit: ['M79.1', 'M54.5'],
  back: ['M54.5', 'M79.1'],
  rash: ['L20.9', 'L50.9', 'T78.40'],
  gatal: ['L20.9', 'L50.9'],
  allergy: ['T78.40', 'L20.9'],
  mc: ['Z02.7'],
};

export default function AssessmentTab({
  selectedICD,
  setSelectedICD,
  clinicalNotes,
  setClinicalNotes,
  activeLanguage,
  onProceedToPlan,
}: AssessmentTabProps) {
  const t = TRANSLATIONS[activeLanguage];
  const { icd10Catalog } = useAuxiliary();

  const catalog = useMemo(() => {
    return icd10Catalog && icd10Catalog.length > 0 ? icd10Catalog : ICD10_CATALOG;
  }, [icd10Catalog]);

  const [searchICDQuery, setSearchICDQuery] = useState('');

  // Smart ICD search: matches code, description, category, and layman synonyms
  const icdSuggestions = useMemo(() => {
    const raw = searchICDQuery.trim().toLowerCase();
    if (!raw) return [];

    // Collect matching codes from layman synonyms
    const matchedCodes = new Set<string>();
    for (const [synonym, codes] of Object.entries(LAYMAN_SYNONYMS)) {
      if (raw.includes(synonym) || synonym.includes(raw)) {
        codes.forEach((c) => matchedCodes.add(c.toLowerCase()));
      }
    }

    return catalog
      .filter((i) => {
        const codeLower = i.code.toLowerCase();
        const descLower = i.desc.toLowerCase();
        const catLower = i.category.toLowerCase();
        const matchesDirect = codeLower.includes(raw) || descLower.includes(raw) || catLower.includes(raw);
        const matchesSynonym = matchedCodes.has(codeLower);
        return matchesDirect || matchesSynonym;
      })
      .sort((a, b) => {
        // Prioritize synonym hits or code match
        const aSyn = matchedCodes.has(a.code.toLowerCase());
        const bSyn = matchedCodes.has(b.code.toLowerCase());
        if (aSyn && !bSyn) return -1;
        if (!aSyn && bSyn) return 1;
        return 0;
      });
  }, [searchICDQuery, catalog]);

  // High-frequency presets with plain-English sub-labels
  const quickPrescriptions = [
    {
      group: 'Common Conditions (1-Click Select)',
      items: [
        {
          code: 'J06.9',
          label: 'Flu & Cold (URTI)',
          desc: 'Acute upper respiratory infection, unspecified (Common Cold / URTI / Flu)',
          category: 'Infectious / Respiratory',
        },
        {
          code: 'I10',
          label: 'High Blood Pressure (HTN)',
          desc: 'Essential (primary) hypertension (HTN / High Blood Pressure)',
          category: 'Cardiovascular',
        },
        {
          code: 'E11.9',
          label: 'Diabetes (T2DM)',
          desc: 'Type 2 diabetes mellitus without complications (T2DM / Diabetes)',
          category: 'Endocrine / Metabolic',
        },
        {
          code: 'A09.9',
          label: 'Tummy Flu / Diarrhea (AGE)',
          desc: 'Gastroenteritis and colitis of infectious origin (Diarrhea / Food Poisoning)',
          category: 'Infectious / GI',
        },
        {
          code: 'K29.7',
          label: 'Gastritis / Gastric Pain',
          desc: 'Gastritis, unspecified (Stomach Ulcer / Epigastric Pain)',
          category: 'Gastrointestinal',
        },
        {
          code: 'J20.9',
          label: 'Chest Cough / Bronchitis',
          desc: 'Acute bronchitis, unspecified (Chest Cough / Bronchial Inflammation)',
          category: 'Respiratory',
        },
        {
          code: 'R50.9',
          label: 'Fever / Pyrexia',
          desc: 'Fever, unspecified (Pyrexia / Viral Fever)',
          category: 'General Symptoms',
        },
        {
          code: 'M79.1',
          label: 'Body Ache / Muscle Pain',
          desc: 'Myalgia (General Muscle Pain / Back Pain / Body Ache)',
          category: 'Musculoskeletal',
        },
      ],
    },
  ];

  // Quick normal findings tokens with plain-English button text
  const clinicalFindingTokens = [
    { label: '+ Patient Looks Well (NAD)', phrase: 'NAD (Patient alert, conscious, no acute distress)' },
    { label: '+ Lungs Clear', phrase: 'Chest clear bilaterally, good equal air entry, no rhonchi/wheeze' },
    { label: '+ Normal Tummy', phrase: 'Abdomen soft, non-tender, no organomegaly or guarding' },
    { label: '+ Throat Mildly Red', phrase: 'Pharynx mildly injected, tonsils not enlarged, no exudate' },
    { label: '+ Vitals Stable & Normal', phrase: 'Afebrile, vital signs within normal clinical limits' },
    { label: '+ Follow-up in 1–2 Weeks', phrase: 'Medication titrated/prescribed; advise follow-up review in 1–2 weeks' },
  ];

  const handleAppendFinding = (phrase: string) => {
    setClinicalNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return phrase;
      return `${trimmed}\n• ${phrase}`;
    });
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Assessment Header Status Strip */}
      <div className="bg-surface p-3.5 rounded-none border border-line flex flex-wrap items-center justify-between gap-3 shadow-none">
        <div>
          <h4 className="type-label text-ink flex items-center gap-1.5 font-bold">
            <Stethoscope className="w-4 h-4 text-accent" />
            Assessment &amp; Diagnostic Classification (ICD-10)
          </h4>
          <p className="text-xs text-muted mt-0.5">
            Pick what is wrong with the patient for billing, panel claims, and prescription safety.
          </p>
        </div>

        <div>
          {selectedICD ? (
            <span className="text-2xs font-mono tabular-nums font-bold px-2.5 py-1 border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Diagnosis Confirmed: {selectedICD.code}
            </span>
          ) : (
            <span className="text-2xs font-mono font-bold px-2.5 py-1 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Required for Sign-Off
            </span>
          )}
        </div>
      </div>

      {/* 2. ICD-10 Search & Plain-English Quick-Pick Pills */}
      <div className="space-y-3 bg-surface-muted/30 p-4 border border-line rounded-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="icd10-catalog-search" className="block text-xs font-bold text-ink uppercase tracking-tight flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-accent" />
            <span>Search Diagnosis by Keyword or Symptom</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-2xs font-mono text-muted">
            Try typing: "cold", "flu", "sugar", "blood pressure", "tummy", "fever"
          </span>
        </div>

        {/* Full-width Instant Search Input with Synonyms */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
            <Input
              type="text"
              id="icd10-catalog-search"
              className="w-full text-xs pl-9 pr-9 py-2.5 bg-surface text-ink border border-line rounded-none focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none font-medium placeholder:text-muted"
              value={searchICDQuery}
              onChange={(e) => setSearchICDQuery(e.target.value)}
              placeholder="Type common words (e.g., 'cold', 'flu', 'sugar', 'blood pressure', 'tummy', 'cough', 'fever')..."
            />
            {searchICDQuery && (
              <button
                type="button"
                onClick={() => setSearchICDQuery('')}
                className="absolute right-2.5 p-1 text-muted hover:text-ink cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List with Smart Suggestions */}
          {searchICDQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-surface border-2 border-primary rounded-none z-30 max-h-[260px] overflow-y-auto divide-y divide-line shadow-xl">
              {icdSuggestions.length === 0 ? (
                <div className="p-3 text-xs text-muted font-mono text-center">
                  No exact match for "{searchICDQuery}". You can assign it as a custom diagnosis below.
                </div>
              ) : (
                icdSuggestions.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setSelectedICD(item);
                      setSearchICDQuery('');
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-surface-accent flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="pr-2 min-w-0">
                      <span className="font-mono tabular-nums font-bold text-accent block text-2xs">{item.code}</span>
                      <span className="text-ink font-semibold block text-xs truncate">{item.desc}</span>
                    </div>
                    <span className="text-2xs text-accent bg-surface-accent px-2 py-0.5 rounded-none font-bold uppercase shrink-0 border border-line font-mono">
                      {item.category}
                    </span>
                  </button>
                ))
              )}

              {/* Allow assigning custom diagnosis if needed */}
              <button
                type="button"
                onClick={() => {
                  setSelectedICD({
                    code: `DX-${searchICDQuery.trim().substring(0, 6).toUpperCase()}`,
                    desc: searchICDQuery.trim(),
                    category: 'Clinical Diagnosis',
                  });
                  setSearchICDQuery('');
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between cursor-pointer transition-colors border-t border-line"
              >
                <span>➕ Assign Custom Diagnosis: "{searchICDQuery.trim()}"</span>
                <span className="text-2xs bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded-none uppercase font-mono">
                  Custom DX
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Categorized Clinical Quick-Pick Presets with Plain-English Sub-labels */}
        <div className="pt-2 border-t border-line-subtle space-y-2">
          <span className="text-2xs font-mono uppercase font-bold tracking-wider text-muted block">
            Common Outpatient Diagnoses (1-Click Select):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {quickPrescriptions[0].items.map((item) => {
              const isSelected = selectedICD?.code === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedICD(item)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-none cursor-pointer transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-none'
                      : 'bg-surface hover:bg-surface-accent text-ink border-line'
                  }`}
                  title={`${item.desc} [${item.code}]`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                  <span className={`text-2xs font-mono tabular-nums ${isSelected ? 'text-white/80' : 'text-muted'}`}>
                    ({item.code})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Primary Assigned ICD-10 Diagnosis Spotlight Tile */}
      {selectedICD ? (
        <div id="selected-icd-indicator" className="bg-surface border border-line p-4 rounded-none shadow-none space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xs bg-primary text-white px-2.5 py-0.5 rounded-none font-mono tabular-nums font-bold tracking-wide flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ICD-10: {selectedICD.code}
              </span>
              <span className="text-2xs text-accent bg-surface-accent px-2 py-0.5 rounded-none font-mono font-bold uppercase border border-line">
                {selectedICD.category}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedICD(null)}
              className="text-muted hover:text-rose-600 text-xs font-bold font-mono uppercase tracking-wider shrink-0 cursor-pointer transition-colors"
            >
              Change / Remove Diagnosis
            </button>
          </div>

          <strong className="text-base font-bold text-ink uppercase block leading-snug">
            {selectedICD.desc}
          </strong>

          <div className="pt-2 border-t border-line-subtle flex items-center justify-between text-2xs text-muted font-mono">
            <span>Verified for Prescription Routing &amp; Panel e-GL Claims</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold uppercase">Ready for Sign-Off ✓</span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-none border border-amber-300 dark:border-amber-800 text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Diagnosis Required: Click a button above or type "cold", "flu", "bp", or "sugar".</span>
          </div>
          <span className="font-mono text-2xs uppercase tracking-wider font-bold px-2 py-0.5 border border-amber-300 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 shrink-0">
            Pending DX
          </span>
        </div>
      )}

      {/* 4. Clinician Examination Summary & Diagnostic Reasoning */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="soap-notes-clinical-desc" className="block text-xs font-bold text-ink uppercase tracking-tight flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Clinical Examination Summary &amp; Diagnostic Reasoning</span>
          </label>
          <span className="text-2xs font-mono text-muted">
            {clinicalNotes.length} Characters · Examination Notes
          </span>
        </div>

        {/* Quick Insert Clinical Phrasing Tokens with Plain English Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-surface-muted/20 border border-line rounded-none">
          <span className="text-2xs font-mono uppercase font-bold text-muted mr-1">Quick Add:</span>
          {clinicalFindingTokens.map((token, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAppendFinding(token.phrase)}
              className="text-2xs bg-surface hover:bg-surface-accent text-ink border border-line px-2.5 py-1 rounded-none cursor-pointer font-sans transition-colors flex items-center gap-1"
              title={`Append "${token.phrase}" to notes`}
            >
              <PlusCircle className="w-3 h-3 text-accent" />
              <span>{token.label}</span>
            </button>
          ))}
        </div>

        <textarea
          id="soap-notes-clinical-desc"
          className="w-full bg-surface border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-none px-4 py-3 text-xs text-ink transition-all outline-none resize-y min-h-[130px] leading-relaxed placeholder:text-muted font-sans"
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="Enter physical examination findings, diagnostic reasoning, follow-up advice..."
        />
      </div>

      {/* 5. PROMINENT NEXT STEP CTA (FOOLPROOF CLINICAL ACTION) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onProceedToPlan}
          title="Proceed to Prescriptions & MC — Prescribe medications, requisition diagnostic labs, and generate medical certificates"
          className="w-full py-3.5 px-5 text-sm font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 border rounded-none cursor-pointer transition-all shadow-none bg-primary hover:bg-deep text-white border-primary focus:ring-2 focus:ring-accent"
        >
          <span>👉 Proceed to Prescriptions &amp; MC (Plan Tab) ➔</span>
        </button>
        {!selectedICD && (
          <p className="text-2xs text-amber-700 dark:text-amber-400 font-mono text-center mt-1.5 font-bold">
            Note: You can proceed to write prescriptions now, but remember to confirm an ICD-10 diagnosis before final sign-off.
          </p>
        )}
      </div>
    </div>
  );
}
