import type { UserRole } from '../types';
import { ROLE_LABEL, ROLE_LABEL_BM } from './roles';

/** Banner wording shared by the dashboard and every other staff page. */
export const ROLE_BANNER: Record<UserRole, { label: string; subtitle: string }> = {
  doctor: { label: 'Doctor dashboard', subtitle: 'Your consultation queue, patient flow and diagnosis trends.' },
  pharmacist: { label: 'Pharmacy dashboard', subtitle: 'Prescriptions awaiting fulfilment, stock levels and fast-moving medicines.' },
  receptionist: { label: 'Reception dashboard', subtitle: 'Register patients, manage appointments and see who is waiting for triage.' },
  'clinic-assistant': { label: 'Assistant dashboard', subtitle: 'Patients waiting for triage and clinical readings.' },
  cashier: { label: 'Cashier dashboard', subtitle: 'Visits ready for payment, collections and receipts.' },
  admin: { label: 'Administrator dashboard', subtitle: 'Clinic-wide operations, finance, compliance and administration.' },
  hr: { label: 'HR dashboard', subtitle: 'Staff, shifts and workforce administration.' },
};

export const ROLE_BANNER_BM: Record<UserRole, { label: string; subtitle: string }> = {
  doctor: { label: 'Papan Pemuka Doktor', subtitle: 'Barisan perundingan anda, aliran pesakit dan trend diagnosis.' },
  pharmacist: { label: 'Papan Pemuka Farmasi', subtitle: 'Preskripsi menunggu pendispensan, tahap stok dan ubat cepat laris.' },
  receptionist: { label: 'Papan Pemuka Kaunter', subtitle: 'Daftar pesakit, urus temu janji dan pantau giliran saringan triaj.' },
  'clinic-assistant': { label: 'Papan Pemuka Pembantu Klinik', subtitle: 'Pesakit menunggu saringan triaj dan tanda vital klinikal.' },
  cashier: { label: 'Papan Pemuka Juruwang', subtitle: 'Lawatan sedia untuk pembayaran, kutipan hasil dan resit.' },
  admin: { label: 'Papan Pemuka Pentadbir', subtitle: 'Operasi seluruh klinik, kewangan, pematuhan KKM dan pentadbiran.' },
  hr: { label: 'Papan Pemuka Sumber Manusia', subtitle: 'Kakitangan, jadual syif dan pentadbiran tenaga kerja.' },
};

/** Banner wording for someone holding several roles: the labels together and each role's description. */
export function bannerFor(roles: readonly UserRole[], lang: string = 'EN'): { label: string; subtitle: string } {
  const dict = lang === 'BM' ? ROLE_BANNER_BM : ROLE_BANNER;
  const labelDict = lang === 'BM' ? ROLE_LABEL_BM : ROLE_LABEL;
  const held = roles.filter((r) => dict[r]);
  if (held.length <= 1) return dict[held[0] ?? 'admin'];
  return { 
    label: held.map((r) => labelDict[r] || ROLE_LABEL[r]).join(' · '), 
    subtitle: held.map((r) => dict[r].subtitle).join(' ') 
  };
}

export function getGreeting(date = new Date(), lang: string = 'EN'): string {
  const hour = date.getHours();
  if (lang === 'BM') {
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 14) return 'Selamat Tengah Hari';
    if (hour < 19) return 'Selamat Petang';
    return 'Selamat Malam';
  }
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
