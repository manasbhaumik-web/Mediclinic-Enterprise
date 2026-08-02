import React, { useState } from 'react';
import { Mic, MicOff, Copy } from 'lucide-react';
import Button from '../ui/Button';
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
    }, 3000);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500 font-semibold">Record patient complaints, symptoms, and medical history.</p>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if(patientPastVisits.length > 0) {
                setSubjective(patientPastVisits[0].soap.subjective);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Previous
          </button>
          <button 
            onClick={handleVoiceToText}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border ${
              isListening 
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isListening ? 'AI Listening...' : 'AI Voice Dictation'}
          </button>
        </div>
      </div>
      <textarea
        id="soap-subjective-input"
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none shadow-inner resize-y min-h-[180px] leading-relaxed"
        value={subjective}
        onChange={(e) => setSubjective(e.target.value)}
        placeholder="Record symptoms, clinical history, patient complaints, pain scale (0-10), onset duration..."
      />

      {/* Malaysia local templates helper */}
      <div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1.5">
          💡 Clinical Complain Quick-Templates:
        </span>
        <div className="flex flex-col gap-1.5">
          {complainTemplateList.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplySymptomTemplate(tpl)}
              className="text-left py-1 px-2.5 bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-200 text-[11px] text-slate-600 rounded-lg truncate cursor-pointer transition-colors"
            >
              + {tpl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
