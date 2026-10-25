/**
 * Multi-Tenant Public Website CMS Domain Types and Defaults
 * Enables clinics to brand and manage their public landing page, hero, doctors,
 * services, accepted insurance panels, and operating schedules without code changes.
 */

export interface FaqItem {
  id: string;
  questionEn: string;
  questionBm: string;
  answerEn: string;
  answerBm: string;
  category: string;
}

export interface HeroConfig {
  clinicName: string;
  branchName: string;
  badgeEn: string;
  badgeBm: string;
  titleEn: string;
  titleBm: string;
  subtitleEn: string;
  subtitleBm: string;
  ctaButtonEn: string;
  ctaButtonBm: string;
  secondaryCtaEn: string;
  secondaryCtaBm: string;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  textEn: string;
  textBm: string;
  linkUrl?: string;
  tone: 'info' | 'urgent' | 'accent';
}

export interface OperatingHoursConfig {
  is24Hours: boolean;
  scheduleEn: string;
  scheduleBm: string;
  holidayNoticeEn: string;
  holidayNoticeBm: string;
}

export interface ContactConfig {
  phone: string;
  emergencyHotline: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  state: string;
  googleMapsUrl: string;
  transitNotesEn: string;
  transitNotesBm: string;
}

export interface PublicDoctorProfile {
  id: string;
  name: string;
  title: string;
  roleEn: string;
  roleBm: string;
  specialty: string;
  experience: string;
  languages: string;
  mmcNumber: string;
  showOnWebsite: boolean;
  rating: number;
}

export interface PublicServiceItem {
  id: string;
  nameEn: string;
  nameBm: string;
  descEn: string;
  descBm: string;
  priceFromRm: number;
  featured: boolean;
  category: string;
}

export interface WebsiteCMSConfig {
  tenantSlug: string;
  customDomain?: string;
  logoUrl?: string;
  hero: HeroConfig;
  announcement: AnnouncementBarConfig;
  operatingHours: OperatingHoursConfig;
  contact: ContactConfig;
  doctors: PublicDoctorProfile[];
  services: PublicServiceItem[];
  tpaPanels: string[];
  faqs: FaqItem[];
}

export const DEFAULT_WEBSITE_CONFIG: WebsiteCMSConfig = {
  tenantSlug: 'default',
  hero: {
    clinicName: 'MEDICLINIC ENTERPRISE',
    branchName: 'Shah Alam Main Branch',
    badgeEn: 'Next-gen healthcare · Smart diagnostics',
    badgeBm: 'Diagnosis pintar · Rawatan tepat',
    titleEn: 'Compassionate Outpatient Care & Smart Clinical Diagnostics',
    titleBm: 'Rawatan Pesakit Luar Prihatin & Diagnosis Klinikal Pintar',
    subtitleEn: 'Comprehensive outpatient clinic with zero-wait AI triage, point-of-care lab screening, and accredited medical doctors available 24/7.',
    subtitleBm: 'Klinik pesakit luar komprehensif dengan triaj AI pantas, saringan makmal segera, dan doktor bertauliah 24 jam sehari.',
    ctaButtonEn: 'Book Appointment',
    ctaButtonBm: 'Tempah Janji Temu',
    secondaryCtaEn: 'View Live Queue',
    secondaryCtaBm: 'Lihat Giliran Langsung',
  },
  announcement: {
    enabled: true,
    textEn: '24/7 Outpatient & Minor Trauma Center open as usual on Public Holidays.',
    textBm: 'Pusat Rawatan 24/7 & Trauma Ringan beroperasi seperti biasa pada Cuti Umum.',
    tone: 'accent',
  },
  operatingHours: {
    is24Hours: true,
    scheduleEn: 'Open 24 Hours, 7 Days a Week (Including Public Holidays)',
    scheduleBm: 'Buka 24 Jam, 7 Hari Seminggu (Termasuk Cuti Umum)',
    holidayNoticeEn: 'Doctor on duty around the clock. Walk-ins always welcome.',
    holidayNoticeBm: 'Doktor bertugas 24 jam. Pesakit terus tanpa temujanji sentiasa dialu-alukan.',
  },
  contact: {
    phone: '+60 3-5510 8899',
    emergencyHotline: '+60 3-5510 8899',
    whatsapp: '+60 12-345 6789',
    email: 'care@mediclinic.my',
    address: 'Level 2, Menara Medical Suite, Persiaran Central, Seksyen 7',
    city: 'Shah Alam',
    postcode: '40000',
    state: 'Selangor',
    googleMapsUrl: 'https://maps.google.com/?q=Shah+Alam+Medical',
    transitNotesEn: 'Next to LRT Shah Alam Line. Free basement parking available for patients.',
    transitNotesBm: 'Bersebelahan laluan LRT Shah Alam. Tempat letak kereta bawah tanah percuma untuk pesakit.',
  },
  doctors: [
    {
      id: 'doc-1',
      name: 'Dr. Sarah Tan',
      title: 'MD (UKM), MMC Reg #48291',
      roleEn: 'Senior General Practitioner & Family Physician',
      roleBm: 'Doktor Perubatan & Keluarga Senior',
      specialty: 'General Medicine',
      experience: '12+ Years',
      languages: 'EN, BM, Mandarin',
      mmcNumber: 'MMC-48291',
      showOnWebsite: true,
      rating: 4.9,
    },
    {
      id: 'doc-2',
      name: 'Pharm. Ahmad Razak',
      title: 'B.Pharm (UM), Registered Pharmacist',
      roleEn: 'Chief Pharmacist & Clinical Formulator',
      roleBm: 'Ketua Pegawai Farmasi Klinikal',
      specialty: 'Pharmacy',
      experience: '10+ Years',
      languages: 'EN, BM',
      mmcNumber: 'PR-18902',
      showOnWebsite: true,
      rating: 4.95,
    },
    {
      id: 'doc-3',
      name: 'Dr. Priya Nair',
      title: 'MBBS (IMU), DCH (Sydney)',
      roleEn: 'Consultant Pediatrician & Neonatal Specialist',
      roleBm: 'Pakar Kanak-kanak & Neonatal Konsultan',
      specialty: 'Pediatrics',
      experience: '14+ Years',
      languages: 'EN, BM, Tamil',
      mmcNumber: 'MMC-39401',
      showOnWebsite: true,
      rating: 4.88,
    },
  ],
  services: [
    {
      id: 'svc-1',
      nameEn: 'General Consultation',
      nameBm: 'Konsultasi Am',
      descEn: 'Comprehensive physical examination and acute ailment treatment.',
      descBm: 'Pemeriksaan fizikal menyeluruh dan rawatan penyakit akut.',
      priceFromRm: 35.0,
      featured: true,
      category: 'Outpatient',
    },
    {
      id: 'svc-2',
      nameEn: 'Minor Surgery & Wound Dressing',
      nameBm: 'Pembedahan Kecil & Balutan Luka',
      descEn: 'Sterile suturing, abscess incision, and wound care management.',
      descBm: 'Jahitan luka steril, pengurusan luka dan pembedahan kecil.',
      priceFromRm: 50.0,
      featured: true,
      category: 'Procedures',
    },
    {
      id: 'svc-3',
      nameEn: 'Full Blood Profile & Screening',
      nameBm: 'Profil Darah & Saringan Kesihatan',
      descEn: 'Complete blood count, lipid profile, and HbA1c screening with 15-min results.',
      descBm: 'Kiraan darah lengkap, profil lipid dan ujian HbA1c siap dalam 15 minit.',
      priceFromRm: 85.0,
      featured: true,
      category: 'Diagnostics',
    },
    {
      id: 'svc-4',
      nameEn: 'Nebulizer Therapy',
      nameBm: 'Rawatan Nebulizer',
      descEn: 'Instant bronchodilator inhalation for asthma and respiratory distress.',
      descBm: 'Rawatan inhalasi bronkodilator segera untuk asma dan kesukaran bernafas.',
      priceFromRm: 45.0,
      featured: true,
      category: 'Procedures',
    },
  ],
  tpaPanels: [
    'PMCare TPA',
    'MiCare Corporate',
    'HealthMetrics',
    'RedAlert Online',
    'Petronas Medical',
    'Maybank Staff',
    'Intel Healthcare',
    'Sime Darby Panel',
    'CelcomDigi Health',
    'AIA Corporate',
    'Great Eastern TPA',
    'Sunway Medical Panel',
  ],
  faqs: [
    {
      id: 'faq-1',
      questionEn: 'Do I need an appointment or are walk-ins accepted?',
      questionBm: 'Adakah saya perlu membuat janji temu atau boleh terus datang?',
      answerEn: 'Walk-in patients are always welcome 24/7. However, booking an online slot guarantees priority queue placement and reduces waiting time.',
      answerBm: 'Pesakit terus sentiasa dialu-alukan 24 jam. Walau bagaimanapun, tempahan slot atas talian menjamin keutamaan giliran dan memendekkan masa menunggu.',
      category: 'General',
    },
    {
      id: 'faq-2',
      questionEn: 'Which corporate insurance & TPA Guarantee Letters (GL) are accepted?',
      questionBm: 'Surat Jaminan (GL) panel dan insurans korporat manakah yang diterima?',
      answerEn: 'We support cashless real-time billing for all major TPAs including PMCare, MiCare, HealthMetrics, RedAlert, AIA, and Petronas Medical. Please bring your corporate badge or MyKad for instant e-GL verification.',
      answerBm: 'Kami menyokong tuntutan tanpa tunai serta-merta untuk semua panel utama seperti PMCare, MiCare, HealthMetrics, RedAlert, AIA, dan Petronas Medical. Sila bawa pas pekerja atau MyKad untuk pengesahan e-GL pantas.',
      category: 'Billing',
    },
    {
      id: 'faq-3',
      questionEn: 'Can I get official Ministry of Health digital Medical Certificates (e-MC)?',
      questionBm: 'Bolehkah saya mendapatkan Sijil Cuti Sakit digital (e-MC) rasmi KKM?',
      answerEn: 'Yes. All Medical Certificates are legally signed by MMC-registered doctors with cryptographic QR code verification for employer validation.',
      answerBm: 'Ya. Semua Sijil Cuti Sakit ditandatangani secara sah oleh doktor berdaftar MMC dengan pengesahan kod QR kriptografi untuk majikan.',
      category: 'Clinical',
    },
  ],
};

/**
 * Validates website CMS configuration before saving
 */
export function validateCmsConfig(config: WebsiteCMSConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.hero.clinicName?.trim()) {
    errors.push('Clinic brand name is required.');
  }

  if (!config.contact.phone?.trim()) {
    errors.push('Primary contact phone is required.');
  }

  if (!config.contact.address?.trim()) {
    errors.push('Physical clinic address is required for patient navigation.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Resolves localized string given user language preference
 */
export function getLocalizedText(
  isBm: boolean,
  textEn: string,
  textBm: string
): string {
  if (isBm && textBm && textBm.trim()) {
    return textBm;
  }
  return textEn || textBm || '';
}
