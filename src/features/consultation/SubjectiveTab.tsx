import { Mic, Volume2, CheckCircle2 } from 'lucide-react';
import { parseClinicalDialogue, StructuredSOAPDraft } from '../../domain/aiScribe';
import { SAMPLE_CONSULTATION_PRESETS } from '../../services/aiScribeService';
import React from 'react';
import { Copy, Sparkles, MessageSquare } from 'lucide-react';
import { Visit, Language } from '../../types';

interface SubjectiveTabProps {
  subjective: string;
  setSubjective: React.Dispatch<React.SetStateAction<string>>;
  patientPastVisits: Visit[];
  activeLanguage: Language;
  onApplyAIScribe?: (draft: StructuredSOAPDraft) => void;
}

export default function SubjectiveTab({
  subjective,
  setSubjective,
  patientPastVisits,
  activeLanguage,
  onApplyAIScribe
}: SubjectiveTabProps) {
  const [isListening, setIsListening] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState<string | null>(null);
  // Quick complaint suggestions
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
    <div className="space-y-4 animate-fadeIn">
      {/* Header bar & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-none border border-line">
        <div>
          <h4 className="type-label text-ink flex items-center gap-1.5 font-bold">
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
            title="Copy presenting complaint and symptoms history from patient's previous clinic encounter"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-none text-2xs font-bold transition-all border bg-surface text-accent border-line hover:bg-surface-accent dark:hover:bg-night-600 hover:border-brand disabled:opacity-40 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-accent" />
            Copy Previous
          </button>
        </div>
      </div>

      {/* AI AMBIENT CLINICAL SCRIBE CONTROLS */}
      <div className="bg-surface border border-line p-3.5 rounded-none space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-accent'}`} />
            <h4 className="type-label text-ink font-bold flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-accent" />
              AI Ambient Clinical Scribe (Voice-to-SOAP)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isListening;
                setIsListening(next);
                if (next) {
                  // Simulate live ambient speech synthesis
                  const sample = SAMPLE_CONSULTATION_PRESETS[0];
                  const parsed = parseClinicalDialogue(sample.transcript, activeLanguage);
                  if (onApplyAIScribe) onApplyAIScribe(parsed);
                  else setSubjective(parsed.subjective);
                  setTimeout(() => setIsListening(false), 2500);
                }
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-none border transition-all cursor-pointer flex items-center gap-1.5 ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-primary hover:bg-primary-hover text-white border-brand shadow-2xs'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isListening ? 'Listening Ambient Audio...' : 'Start Ambient Scribe'}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Consultation Audio Simulations */}
        <div className="space-y-1.5">
          <span className="text-2xs font-mono uppercase font-bold text-subtle block">
            Simulate Patient Encounter Speech (1-Click AI Synthesis):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_CONSULTATION_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePreset(p.id);
                  const parsed = parseClinicalDialogue(p.transcript, activeLanguage);
                  if (onApplyAIScribe) {
                    onApplyAIScribe(parsed);
                  } else {
                    setSubjective(parsed.subjective);
                  }
                }}
                className={`text-2xs font-medium px-2.5 py-1 rounded-none border transition-all cursor-pointer flex items-center gap-1 ${
                  activePreset === p.id
                    ? 'bg-surface-accent text-accent border-brand font-bold'
                    : 'bg-surface text-ink border-line hover:bg-surface-accent'
                }`}
              >
                <Volume2 className="w-3 h-3 text-accent" />
                <span>{activeLanguage === 'BM' ? p.labelBM : p.labelEN}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Textarea Input */}
      <div className="relative group">
        <textarea
          id="soap-subjective-input"
          className="w-full bg-surface border border-line focus:border-brand focus:ring-1 focus:ring-brand rounded-none px-4 py-3.5 text-xs text-ink dark:text-slate-50 transition-all outline-none resize-y min-h-[190px] leading-relaxed font-sans placeholder:text-slate-400"
          value={subjective}
          onChange={(e) => setSubjective(e.target.value)}
          placeholder="Record presenting symptoms, onset duration, severity, localized area, aggravating factors, and patient medical history..."
        />
        <div className="absolute bottom-3 right-3 text-2xs text-slate-400 dark:text-slate-400 font-mono tabular-nums pointer-events-none bg-surface px-2 py-0.5 rounded-none border border-line">
          {subjective.length} characters
        </div>
      </div>

      {/* Malaysia clinical quick complaint templates */}
      <div className="bg-surface border border-line rounded-none p-3.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-2xs font-bold text-ink uppercase tracking-wider font-mono">
            Clinical Symptom Quick-Templates:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {complainTemplateList.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplySymptomTemplate(tpl)}
              title={`Click to insert symptom template: "${tpl}"`}
              className="py-1.5 px-3 bg-surface hover:bg-surface-accent dark:hover:bg-night-600 border border-line text-2xs font-medium text-accent rounded-none cursor-pointer transition-all hover:border-brand flex items-center justify-center gap-1"
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
