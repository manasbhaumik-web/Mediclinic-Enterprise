/**
 * Speech Recognition and Ambient Audio Service for Doctor Consultations.
 * Interacts with browser Web Speech API with fallback mock simulations for testing.
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  isListening: boolean;
  error: string | null;
}

export const SAMPLE_CONSULTATION_PRESETS = [
  {
    id: 'urti-fever',
    labelEN: 'Flu & Fever (URTI)',
    labelBM: 'Demam & Selesema (URTI)',
    transcript: 'Doctor, saya demam panas sejak semalam suhu 38.5, batuk berkahak tekak rasa pedih dan perit bila telan makanan.',
  },
  {
    id: 'gastritis',
    labelEN: 'Gastric & Epigastric Pain',
    labelBM: 'Sakit Gastrik & Pedih Ulu Hati',
    transcript: 'I have had burning epigastric stomach pain since morning after drinking black coffee, feeling bloated and slightly nauseous.',
  },
  {
    id: 'migraine',
    labelEN: 'Severe Headache & Giddiness',
    labelBM: 'Sakit Kepala & Pening',
    transcript: 'Kepala saya rasa berdenyut-denyut di bahagian dahi dan pening berpusing bila berdiri, mata sensitif kepada cahaya.',
  },
  {
    id: 'backpain',
    labelEN: 'Musculoskeletal Back Strain',
    labelBM: 'Ketegangan Otot & Sakit Pinggang',
    transcript: 'Doctor, pinggang saya sakit sangat selepas angkat kotak berat semalam, rasa tegang dan susah nak tunduk.',
  },
];

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}
