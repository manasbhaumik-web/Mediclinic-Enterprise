import React, { useState } from 'react';
import { Mic, MicOff, Copy, Sparkles, MessageSquare } from 'lucide-react';
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
  const [isListening, setIsListening] = useState(false);

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

  const handleVoiceToText = () => {
    if (isListening) return;
    setIsListening(true);
    // Simulate 3 seconds of AI listening and transcribing
    setTimeout(() => {
      setSubjective(prev => prev 
        ? `${prev}\n[AI Transcribed]: Patient reports severe throbbing headache localized to frontal lobe, onset 24 hours ago. Denies nausea, photophobia, or aura.`
        : `[AI Transcribed]: Patient reports severe throbbing headache localized to frontal lobe, onset 24 hours ago. Denies nausea, photophobia, or aura.`
      );
      setIsListening(false);
    }, 2800);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header bar & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-accent dark:bg-night-850 p-3.5 rounded-none border border-line dark:border-teal-800/50 shadow-xs">
        <div>
          <h4 className="type-label text-ink dark:text-teal-300 flex items-center justify-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-accent dark:text-teal-400" />
            Subjective History &amp; Presenting Complaints
          </h4>
          <p className="text-2xs text-slate-500 dark:text-slate-400 font-medium">Record patient history, symptoms timeline, and pain scale.</p>
        </div>

        <div className="flex items-center justify-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => {
              if (patientPastVisits.length > 0) {
                setSubjective(patientPastVisits[0].soap.subjective);
              }
            }}
            disabled={patientPastVisits.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-none text-2xs font-bold transition-all shadow-xs border bg-white dark:bg-night-700 text-accent dark:text-teal-300 border-line dark:border-teal-700/50 hover:bg-surface-accent dark:hover:bg-night-600 hover:border-brand disabled:opacity-40 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-accent dark:text-teal-400" />
            Copy Previous
          </button>
          <button 
            type="button"
            onClick={handleVoiceToText}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-2xs font-bold transition-all shadow-xs border cursor-pointer ${
              isListening 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse' 
                : 'bg-primary dark:bg-primary text-white border-primary dark:border-brand hover:bg-primary dark:hover:bg-teal-500'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isListening ? 'Listening for dictation...' : 'Start clinical dictation'}
          </button>
        </div>
      </div>

      {/* Main Textarea Input */}
      <div className="relative group">
        <textarea
          id="soap-subjective-input"
          className="w-full bg-white dark:bg-night-900 border border-line dark:border-teal-800/50 focus:border-brand focus:ring-3 focus:ring-brand/15 rounded-none px-4 py-3.5 text-xs text-ink dark:text-slate-50 transition-all outline-none shadow-xs resize-y min-h-[190px] leading-relaxed font-sans placeholder:text-slate-400"
          value={subjective}
          onChange={(e) => setSubjective(e.target.value)}
          placeholder="Record presenting symptoms, onset duration, severity, localized area, aggravating factors, and patient medical history..."
        />
        <div className="absolute bottom-3 right-3 text-2xs text-slate-400 dark:text-slate-400 font-mono pointer-events-none bg-slate-50/80 dark:bg-night-850 px-2 py-0.5 rounded-none border border-slate-200 dark:border-teal-800/40">
          {subjective.length} characters
        </div>
      </div>

      {/* Malaysia clinical quick complaint templates */}
      <div className="bg-surface dark:bg-night-800 border border-line dark:border-teal-800/50 rounded-none p-3.5 shadow-xs space-y-2">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent dark:text-teal-400" />
          <span className="text-2xs font-bold text-ink dark:text-teal-300 uppercase tracking-wider">
            Clinical Symptom Quick-Templates:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {complainTemplateList.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplySymptomTemplate(tpl)}
              className="py-1.5 px-3 bg-white dark:bg-night-700 hover:bg-surface-accent dark:hover:bg-night-600 border border-line dark:border-teal-700/50 text-2xs font-medium text-accent dark:text-teal-300 rounded-none cursor-pointer transition-all hover:border-brand shadow-2xs hover:shadow-xs flex items-center justify-center gap-1"
            >
              <span className="text-accent dark:text-teal-400 font-bold">+</span>
              <span>{tpl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
