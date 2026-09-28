import { Visit, Patient } from '../types';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export type SortRule = 'urgency' | 'wait' | 'arrival';
export type AcuityFilter = 'all' | 'high' | 'sla';

export interface TriageDetails {
  level: 'High' | 'Medium' | 'Low';
  stripColor: string;
  badgeBg: string;
  icon: typeof AlertCircle;
  iconColor: string;
}

export function getChiefComplaintLabel(subjective?: string): string {
  if (!subjective) return 'General Outpatient Consultation';
  const text = subjective.trim();
  const lower = text.toLowerCase();
  
  if (lower.includes('fever') && (lower.includes('throat') || lower.includes('sore'))) return 'Fever + sore throat';
  if (lower.includes('epigastric') || lower.includes('reflux') || lower.includes('gastritis') || lower.includes('heartburn')) return 'Epigastric pain / reflux';
  if (lower.includes('back') || lower.includes('lumbago') || lower.includes('myalgia')) return 'Low back pain / myalgia';
  if (lower.includes('cough') || lower.includes('urti') || lower.includes('cold') || lower.includes('flu')) return 'Cough & cold / URTI';
  if (lower.includes('hypertension') || lower.includes('bp') || lower.includes('diabetes')) return 'Chronic disease follow-up';
  if (lower.includes('asthma') || lower.includes('breath') || lower.includes('wheezing')) return 'Asthma / Dyspnea flare';
  if (lower.includes('rash') || lower.includes('eczema') || lower.includes('skin')) return 'Skin rash / Allergy';
  if (lower.includes('diarrhea') || lower.includes('vomiting') || lower.includes('food poison')) return 'Gastroenteritis / Diarrhea';
  
  if (text.length > 36) return text.substring(0, 33) + '...';
  return text;
}

export function getRankingRationale(
  pt?: Patient, 
  visit?: Visit, 
  rankIndex: number = 0, 
  activeRule: SortRule = 'urgency'
): string {
  if (!pt || !visit) return '';
  const allergies = pt.drugAllergies?.length || 0;
  const waitMins = visit.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;
  const temp = visit.soap?.objective?.temperature || 0;

  if (activeRule === 'urgency') {
    const reasons: string[] = [];
    if (allergies > 0) reasons.push(`Drug Allergy (${pt.drugAllergies.join(', ')})`);
    if (temp >= 38.0) reasons.push(`Fever (${temp}°C)`);
    if (waitMins >= 20) reasons.push(`SLA Risk (${waitMins}m wait)`);
    else if (waitMins > 0) reasons.push(`${waitMins}m wait`);

    if (reasons.length === 0) reasons.push('Standard Outpatient Triage');
    return `Why Rank #${rankIndex + 1}: ${reasons.join(' + ')}`;
  } else if (activeRule === 'wait') {
    return `Why Rank #${rankIndex + 1}: Longest wait priority (${waitMins}m wait)`;
  } else {
    return `Why Rank #${rankIndex + 1}: Registration arrival order (${visit.date || 'Today'})`;
  }
}

export function getTriageDetails(pt?: Patient, visit?: Visit): TriageDetails {
  const allergies = pt?.drugAllergies?.length || 0;
  const waitMins = visit?.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;
  const temp = visit?.soap?.objective?.temperature || 0;
  
  if (allergies > 0 || waitMins >= 30 || temp >= 38.0) {
    return {
      level: 'High',
      stripColor: 'border-l-2 border-l-rose-500 dark:border-l-rose-400',
      badgeBg: 'bg-rose-100 text-rose-950 dark:bg-rose-900/90 dark:text-rose-100 border border-rose-300 dark:border-rose-600 font-bold',
      icon: AlertCircle,
      iconColor: 'text-rose-700 dark:text-rose-200'
    };
  } else if (waitMins >= 15 || temp >= 37.3) {
    return {
      level: 'Medium',
      stripColor: 'border-l-2 border-l-amber-500 dark:border-l-amber-400',
      badgeBg: 'bg-amber-100 text-amber-950 dark:bg-amber-900/90 dark:text-amber-100 border border-amber-300 dark:border-amber-600 font-bold',
      icon: Clock,
      iconColor: 'text-amber-700 dark:text-amber-200'
    };
  } else {
    return {
      level: 'Low',
      stripColor: 'border-l-2 border-l-emerald-500 dark:border-l-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/90 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-600 font-bold',
      icon: CheckCircle2,
      iconColor: 'text-emerald-700 dark:text-emerald-200'
    };
  }
}

export function sortQueue(
  queue: Visit[],
  sortRule: SortRule,
  patientsMap: Record<string, Patient>,
  pinnedVisitIds: Record<string, boolean> = {}
): Visit[] {
  let list = [...queue];
  if (sortRule === 'urgency') {
    list.sort((a, b) => {
      const ptA = patientsMap[a.patientId];
      const ptB = patientsMap[b.patientId];
      const allergiesA = ptA?.drugAllergies?.length || 0;
      const allergiesB = ptB?.drugAllergies?.length || 0;
      const waitA = a.registeredTime ? Math.floor((Date.now() - a.registeredTime) / 60000) : 0;
      const waitB = b.registeredTime ? Math.floor((Date.now() - b.registeredTime) / 60000) : 0;
      if (allergiesA > 0 && allergiesB === 0) return -1;
      if (allergiesB > 0 && allergiesA === 0) return 1;
      return waitB - waitA;
    });
  } else if (sortRule === 'wait') {
    list.sort((a, b) => {
      const waitA = a.registeredTime ? Math.floor((Date.now() - a.registeredTime) / 60000) : 0;
      const waitB = b.registeredTime ? Math.floor((Date.now() - b.registeredTime) / 60000) : 0;
      return waitB - waitA;
    });
  } else {
    list.sort((a, b) => (a.registeredTime || 0) - (b.registeredTime || 0));
  }

  // Pinned items prioritization
  if (Object.keys(pinnedVisitIds).some(id => pinnedVisitIds[id])) {
    list.sort((a, b) => (pinnedVisitIds[b.id] ? 1 : 0) - (pinnedVisitIds[a.id] ? 1 : 0));
  }
  return list;
}

export function filterQueue(
  queue: Visit[],
  acuityFilter: AcuityFilter,
  searchQuery: string,
  patientsMap: Record<string, Patient>
): Visit[] {
  let filtered = [...queue];

  // Acuity / SLA Filter
  if (acuityFilter === 'high') {
    filtered = filtered.filter(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0);
  } else if (acuityFilter === 'sla') {
    filtered = filtered.filter(v => (v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0) >= 20);
  }

  // Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(v => {
      const pt = patientsMap[v.patientId];
      const nameMatch = pt?.fullName.toLowerCase().includes(q) || false;
      const idMatch = pt?.id.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
      const complaintMatch = (v.soap?.subjective || '').toLowerCase().includes(q);
      return nameMatch || idMatch || complaintMatch;
    });
  }

  return filtered;
}
