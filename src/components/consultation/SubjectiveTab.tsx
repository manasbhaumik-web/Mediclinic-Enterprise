import React from 'react';
import { Copy, Sparkles, MessageSquare } from 'lucide-react';
import { Visit, Language } from '../../types';

interface SubjectiveTabProps {
  subjective: string;
  setSubjective: React.Dispatch<React.SetStateAction<string>>;
  patientPastVisits: Visit[];
  activeLanguage: Language;
}

export default function SubjectiveTab({
  subjective,
  setSubjective,
  patientPastVisits,
  activeLanguage
}: SubjectiveTabProps) {
  // Quick complain suggestions
  const complainTemplateList = [
    activeLanguage === 'EN' ? 'Fever and runny nose for 2 days' : 'Demam dan selesema selama 2 hari',
    activeLanguage === 'EN' ? 'Productive cough with white sputum, sore throat' : 'Batuk berkahak putih dengan sakit tekak',
    activeLanguage === 'EN' ? 'Epigastric gastric discomfort, worse after tea' : 'Sakit perut epigastrik, selepas minum teh',
    activeLanguage === 'EN' ? 'Muscle sorenesses and joint stiffness post exercise' : 'Lengu-lengu otot dan sendi selepas bersenam',
    activeLanguage === 'EN' ? 'Acute headache with photophobia and mild dizziness' : 'Sakit kepala akut dengan sensitif cahaya dan pening ringan'
  ];

  const handleApplySymptomTemplate = (txt: string) => {
    setSubjective(prev => prev ? `${prev}. ${txt}` : txt);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header bar & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-accent p-3.5 rounded-none border border-line shadow-xs">
        <div>
          <h4 className="type-label text-ink flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-accent" />
            Subjective History &amp; Presenting Complaints
          </h4>
          <p className="text-2xs text-subtle dark:text-slate-400 font-medium">Record patient history, symptoms timeline, and pain scale.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => {
              if (patientPastVisits.length > 0) {
                setSubjective(patientPastVisits[0].soap.subjective);
              }
            }}
            disabled={patientPastVisits.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-none text-2xs font-bold transition-all shadow-xs border bg-surface text-accent border-line hover:bg-surface-accent dark:hover:bg-night-600 hover:border-brand disabled:opacity-40 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-accent" />
            Copy Previous
          </button>
        </div>
      </div>

      {/* Main Textarea Input */}
      <div className="relative group">
        <textarea
          id="soap-subjective-input"
          className="w-full bg-surface border border-line focus:border-brand focus:ring-3 focus:ring-brand/15 rounded-none px-4 py-3.5 text-xs text-ink dark:text-slate-50 transition-all outline-none shadow-xs resize-y min-h-[190px] leading-relaxed font-sans placeholder:text-slate-400"
          value={subjective}
          onChange={(e) => setSubjective(e.target.value)}
          placeholder="Record presenting symptoms, onset duration, severity, localized area, aggravating factors, and patient medical history..."
        />
        <div className="absolute bottom-3 right-3 text-2xs text-slate-400 dark:text-slate-400 font-mono pointer-events-none bg-slate-50/80 dark:bg-night-850 px-2 py-0.5 rounded-none border border-slate-200 dark:border-teal-800/40">
          {subjective.length} characters
        </div>
      </div>

      {/* Malaysia clinical quick complaint templates */}
      <div className="bg-surface border border-line rounded-none p-3.5 shadow-xs space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-2xs font-bold text-ink uppercase tracking-wider">
            Clinical Symptom Quick-Templates:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {complainTemplateList.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplySymptomTemplate(tpl)}
              className="py-1.5 px-3 bg-surface hover:bg-surface-accent dark:hover:bg-night-600 border border-line text-2xs font-medium text-accent rounded-none cursor-pointer transition-all hover:border-brand shadow-2xs hover:shadow-xs flex items-center justify-center gap-1"
            >
              <span className="text-accent font-bold">+</span>
              <span>{tpl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
