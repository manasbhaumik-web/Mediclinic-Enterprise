import { FileText, Share } from 'lucide-react';
import Input from '../../ui/Input';

interface CertificatesAndReferralPanelProps {
  mcGenerated: boolean;
  mcDays: number | '';
  setMcDays: React.Dispatch<React.SetStateAction<number | ''>>;
  mcReason: string;
  setMcReason: React.Dispatch<React.SetStateAction<string>>;
  setMcGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  referralGenerated: boolean;
  referralDetails: { hospital: string; department: string; reason: string; };
  setReferralDetails: React.Dispatch<React.SetStateAction<{ hospital: string; department: string; reason: string; }>>;
  setReferralGenerated: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CertificatesAndReferralPanel({ mcGenerated, mcDays, setMcDays, mcReason, setMcReason, setMcGenerated, referralGenerated, referralDetails, setReferralDetails, setReferralGenerated }: CertificatesAndReferralPanelProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* MEDICAL CERTIFICATE ISSUANCE CARD */}
        <div className="border border-line bg-surface p-4 rounded-none space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-800/30 pb-2">
            <h4 className="type-label text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" /> Digital Medical Certificate (MC)
            </h4>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-none border ${
              mcGenerated ? 'chip-ok' : 'bg-slate-100 text-subtle border-slate-200'
            }`}>
              {mcGenerated ? 'ISSUED' : 'NOT ISSUED'}
            </span>
          </div>
    
          <div className="space-y-2">
            <div>
              <label className="block text-2xs font-bold text-subtle uppercase mb-1">Duration (Days)</label>
              <Input 
                type="number"
                min="1"
                max="14"
                value={mcDays}
                onChange={e => setMcDays(parseInt(e.target.value) || 1)}
                className="w-full text-xs p-2 border border-slate-300 rounded-none font-bold"
              />
            </div>
    
            <div>
              <label className="block text-2xs font-bold text-subtle uppercase mb-1">Clinical Diagnosis / Reason</label>
              <Input 
                type="text"
                value={mcReason}
                onChange={e => setMcReason(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-none"
              />
            </div>
          </div>
    
          <button
            type="button"
            onClick={() => setMcGenerated(true)}
            className={`w-full py-2 text-xs font-bold uppercase rounded-none border transition-colors cursor-pointer ${
              mcGenerated
                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                : 'bg-primary text-white border-primary hover:bg-primary-hover'
            }`}
          >
            {mcGenerated ? '✓ Medical Certificate (MC) Created & Attached' : 'Create medical certificate'}
          </button>
        </div>
    
        {/* SPECIALIST REFERRAL LETTER CARD */}
        <div className="border border-line bg-surface p-4 rounded-none space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-800/30 pb-2">
            <h4 className="type-label text-ink flex items-center gap-2">
              <Share className="w-4 h-4 text-accent" /> Specialist Referral Note
            </h4>
            <span className={`text-2xs font-bold px-2 py-0.5 rounded-none border ${
              referralGenerated ? 'chip-info' : 'bg-slate-100 text-subtle border-slate-200'
            }`}>
              {referralGenerated ? 'ATTACHED' : 'NONE'}
            </span>
          </div>
    
          <div className="space-y-2">
            <div>
              <label className="block text-2xs font-bold text-subtle uppercase mb-1">Target Hospital / Clinic</label>
              <Input 
                type="text"
                value={referralDetails.hospital}
                onChange={e => setReferralDetails({ ...referralDetails, hospital: e.target.value })}
                placeholder="e.g. Hospital Kuala Lumpur / Pantai Hospital"
                className="w-full text-xs p-2 border border-slate-300 rounded-none"
              />
            </div>
    
            <div>
              <label className="block text-2xs font-bold text-subtle uppercase mb-1">Specialty Department</label>
              <Input 
                type="text"
                value={referralDetails.department}
                onChange={e => setReferralDetails({ ...referralDetails, department: e.target.value })}
                placeholder="e.g. ENT / General Medicine / Cardiology"
                className="w-full text-xs p-2 border border-slate-300 rounded-none"
              />
            </div>
          </div>
    
          <button
            type="button"
            onClick={() => setReferralGenerated(true)}
            className={`w-full py-2 text-xs font-bold uppercase rounded-none border transition-colors cursor-pointer ${
              referralGenerated
                ? 'bg-primary text-white border-teal-700 hover:bg-primary'
                : 'bg-surface text-ink dark:text-slate-200 border-line hover:bg-surface-accent'
            }`}
          >
            {referralGenerated ? '✓ Specialist Referral Created & Attached' : 'Create referral draft'}
          </button>
        </div>
    
      </div>
    
    </div>
  );
}
