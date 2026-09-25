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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#e0f5f2]/80 dark:bg-[#082830] p-3.5 rounded-none border border-[#b2f5ea] dark:border-teal-800/50 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
            Subjective History &amp; Presenting Complaints
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Record patient history, symptoms timeline, and pain scale.</p>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[11px] font-bold transition-all shadow-xs border bg-white dark:bg-[#0e4857] text-[#0f766e] dark:text-[#5eead4] border-[#b2f5ea] dark:border-teal-700/50 hover:bg-[#e0f5f2] dark:hover:bg-[#12596b] hover:border-[#0d9488] disabled:opacity-40 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#0d9488] dark:text-[#2dd4bf]" />
            Copy Previous
          </button>
          <button 
            type="button"
            onClick={handleVoiceToText}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[11px] font-bold transition-all shadow-xs border cursor-pointer ${
              isListening 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse' 
                : 'bg-[#0f766e] dark:bg-[#0d9488] text-white border-[#0f766e] dark:border-[#0d9488] hover:bg-[#0d9488] dark:hover:bg-[#14b8a6]'
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
          className="w-full bg-white dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/50 focus:border-[#0d9488] focus:ring-3 focus:ring-[#0d9488]/15 rounded-none px-4 py-3.5 text-xs text-[#0f3c4c] dark:text-[#f8fafc] transition-all outline-none shadow-xs resize-y min-h-[190px] leading-relaxed font-sans placeholder:text-slate-400"
          value={subjective}
          onChange={(e) => setSubjective(e.target.value)}
          placeholder="Record presenting symptoms, onset duration, severity, localized area, aggravating factors, and patient medical history..."
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 dark:text-slate-400 font-mono pointer-events-none bg-slate-50/80 dark:bg-[#082830] px-2 py-0.5 rounded-none border border-slate-200 dark:border-teal-800/40">
          {subjective.length} characters
        </div>
      </div>

      {/* Malaysia clinical quick complaint templates */}
      <div className="bg-[#f7fdfd] dark:bg-[#0c3844] border border-[#b2f5ea] dark:border-teal-800/50 rounded-none p-3.5 shadow-xs space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0d9488] dark:text-[#2dd4bf]" />
          <span className="text-[11px] font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider">
            Clinical Symptom Quick-Templates:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {complainTemplateList.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplySymptomTemplate(tpl)}
              className="py-1.5 px-3 bg-white dark:bg-[#0e4857] hover:bg-[#e0f5f2] dark:hover:bg-[#12596b] border border-[#b2f5ea] dark:border-teal-700/50 text-[11px] font-medium text-[#0f766e] dark:text-[#5eead4] rounded-none cursor-pointer transition-all hover:border-[#0d9488] shadow-2xs hover:shadow-xs flex items-center gap-1"
            >
              <span className="text-[#0d9488] dark:text-[#2dd4bf] font-bold">+</span>
              <span>{tpl}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
