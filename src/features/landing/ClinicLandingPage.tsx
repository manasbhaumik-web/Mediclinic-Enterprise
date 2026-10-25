import React, { useState, useMemo } from 'react';
import logoUrl from '../../assets/logo_transparent.svg';
import ThemeSelector from '../../components/ui/ThemeSelector';
import { Language } from '../../types';
import { 
  Stethoscope, Pill, ShieldCheck, Activity, Heart, Calendar, Clock, 
  MapPin, Phone, CheckCircle2, Star, ArrowRight, LogIn, BarChart3, 
  Users, Building2, ChevronRight, Menu, X, Search, Check, 
  ShieldAlert, Zap, Globe, Award, HelpCircle, Mail, ChevronDown, 
  ArrowUp, CreditCard, Car, Bus, Info, AlertTriangle, Megaphone
} from 'lucide-react';
import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import QuickTasksSection from './QuickTasksSection';
import BenefitsSection from './BenefitsSection';
import ServicesSection from './ServicesSection';
import DoctorsSection from './DoctorsSection';
import PanelsSection from './PanelsSection';
import FaqSection from './FaqSection';
import BookingModal from './BookingModal';
import BrandName from '../../components/ui/BrandName';
import { useSettings } from '../../context/SettingsContext';
import { DEFAULT_WEBSITE_CONFIG, WebsiteCMSConfig } from '../../domain/websiteCms';

interface ClinicLandingPageProps {
  activeLanguage: Language;
  onToggleLanguage: (lang: Language) => void;
  onOpenLogin: () => void;
  onOpenTelemetry: () => void;
  doctorQueueLength?: number;
  cmsOverride?: WebsiteCMSConfig;
}

export default function ClinicLandingPage({
  activeLanguage,
  onToggleLanguage,
  onOpenLogin,
  onOpenTelemetry,
  doctorQueueLength = 3,
  cmsOverride
}: ClinicLandingPageProps) {
  const { settings, clinic } = useSettings();
  const cms: WebsiteCMSConfig = cmsOverride || settings.websiteConfig || DEFAULT_WEBSITE_CONFIG;

  const isBM = activeLanguage === 'BM';

  // Dynamic Identity & Contact from CMS
  const clinicName = cms.hero.clinicName || clinic.name || 'MEDICLINIC ENTERPRISE';
  const branchName = cms.hero.branchName || clinic.branch || 'Shah Alam Main Branch';
  const phone = cms.contact.phone || clinic.phone || '+60 3-5510 8899';
  const emergencyPhone = cms.contact.emergencyHotline || clinic.emergencyPhone || '+60 3-5510 8899';
  const address = cms.contact.address || clinic.address || 'Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor';
  const licenseNo = clinic.licenseNo || 'KKM-2026-SL-8902';

  // Mobile Nav Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Appointment Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  // Filter & Search State for Doctors and Panels
  const [panelSearch, setPanelSearch] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('All');

  // FAQ Accordion Open State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Interactive Panel Eligibility Checker State
  const [selectedPanelCheck, setSelectedPanelCheck] = useState('PMCare TPA');
  const [panelEmpId, setPanelEmpId] = useState('EMP-9821');

  // Review Category Filter State
  const [reviewCategory, setReviewCategory] = useState('All');

  // Hero Background Carousel State
  const [heroSlide, setHeroSlide] = useState(0);
  const heroImages = [
    'hero-slide-1', 'hero-slide-2', 'hero-slide-3', 'hero-slide-4'
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const closeBooking = () => {
    setIsBookingOpen(false);
    setSelectedDoctor(null);
  };

  const openDoctorBooking = (doctorName: string) => {
    setSelectedDoctor(doctorName);
    setIsBookingOpen(true);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic TPA Panels from CMS
  const tpaPanels = useMemo(() => {
    return cms.tpaPanels && cms.tpaPanels.length > 0
      ? cms.tpaPanels
      : DEFAULT_WEBSITE_CONFIG.tpaPanels;
  }, [cms.tpaPanels]);

  const filteredPanels = useMemo(() => {
    return tpaPanels.filter(panel => 
      panel.toLowerCase().includes(panelSearch.toLowerCase())
    );
  }, [tpaPanels, panelSearch]);

  // Dynamic Resident Doctors from CMS
  const doctorsList = useMemo(() => {
    if (cms.doctors && cms.doctors.length > 0) {
      return cms.doctors
        .filter(d => d.showOnWebsite)
        .map((doc, idx) => ({
          id: doc.id.substring(0, 2).toUpperCase() || `D${idx + 1}`,
          name: doc.name,
          title: doc.title,
          role: isBM ? doc.roleBm : doc.roleEn,
          specialty: doc.specialty,
          bgColor: idx % 2 === 0 ? 'bg-primary' : 'bg-sky-600',
          status: isBM ? 'Bertugas - Suite' : 'On Duty - Suite',
          availabilityState: isBM ? 'Sedia Ada Sekarang' : 'Available Now',
          nextSlot: isBM ? 'Slot Seterusnya: 10:15 AM' : 'Next: 10:15 AM',
          languages: doc.languages,
          queueCount: Math.floor(Math.random() * 3) + 1,
          rating: doc.rating || 4.9,
          experience: doc.experience || '10+ Years',
        }));
    }
    return [
      {
        id: 'SJ',
        name: 'Dr. Sarah Tan',
        title: 'MD (UKM), MMC Reg #48291',
        role: isBM ? 'Doktor Perubatan & Keluarga Senior' : 'Senior General Practitioner & Family Physician',
        specialty: 'General Medicine',
        bgColor: 'bg-primary',
        status: isBM ? 'Bertugas - Bilik 101' : 'On Duty - Suite 101',
        availabilityState: isBM ? 'Sedia Ada Sekarang' : 'Available Now',
        nextSlot: isBM ? 'Slot Seterusnya: 10:15 AM' : 'Next: 10:15 AM',
        languages: 'EN, BM, Mandarin',
        queueCount: 2,
        rating: 4.9,
        experience: '12+ Years'
      }
    ];
  }, [cms.doctors, isBM]);

  const filteredDoctors = doctorSpecialty === 'All'
    ? doctorsList
    : doctorsList.filter(d => d.specialty === doctorSpecialty);

  // Dynamic FAQs from CMS
  const faqs = useMemo(() => {
    if (cms.faqs && cms.faqs.length > 0) {
      return cms.faqs.map(f => ({
        q: isBM ? f.questionBm : f.questionEn,
        a: isBM ? f.answerBm : f.answerEn,
      }));
    }
    return DEFAULT_WEBSITE_CONFIG.faqs.map(f => ({
      q: isBM ? f.questionBm : f.questionEn,
      a: isBM ? f.answerBm : f.answerEn,
    }));
  }, [cms.faqs, isBM]);

  const testimonials = [
    {
      name: 'Tengku Amirul Hilmi',
      role: isBM ? 'Pesakit Panel Korporat (Petronas)' : 'Corporate Panel Patient (Petronas)',
      category: 'Corporate Panel',
      comment: isBM 
        ? 'Pendaftaran sangat pantas menggunakan pemproses MyKad. Selesai konsultasi dan pengambilan ubat dalam 15 minit. Sangat cekap!' 
        : 'Super fast registration with MyKad reader. Had my consultation and medicine fulfilled within 15 minutes. Highly efficient clinic!',
      rating: 5,
      date: 'Sept 2026'
    },
    {
      name: 'Dr. Evelyn Tan',
      role: isBM ? 'Pengurus Kesihatan Pekerja' : 'Occupational Health Manager',
      category: 'Occupational Health',
      comment: isBM 
        ? 'MediClinic Enterprise mengendalikan pemeriksaan kesihatan tahunan staf kami dan tuntutan TPA dengan lancar dan telus.' 
        : 'MediClinic Enterprise handles our staff annual health screenings and TPA billing seamlessly. Transparent and reliable service.',
      rating: 5,
      date: 'Aug 2026'
    },
    {
      name: 'Nurul Huda Binti Osman',
      role: isBM ? 'Ibu kepada 2 orang anak (Pediatrik)' : 'Mother of 2 (Pediatric Outpatient)',
      category: 'Pediatrics',
      comment: isBM 
        ? 'Dr. Michael Wong sangat lembut dan mesra ketika memberikan suntikan imunisasi kepada anak saya yang berumur 3 tahun. Fasiliti sangat bersih.' 
        : 'Dr. Michael Wong was extremely gentle with my 3-year-old during her vaccination. Very clean, child-friendly facility.',
      rating: 5,
      date: 'Sept 2026'
    }
  ];

  return (
    <div className="min-h-screen pb-[76px] sm:pb-0 bg-canvas text-ink font-sans selection:bg-primary selection:text-white relative">
      
      {/* 0. ANNOUNCEMENT MARQUEE BANNER FROM CMS */}
      {cms.announcement?.enabled && (
        <div className="bg-primary text-teal-50 text-xs font-semibold py-1.5 px-4 flex items-center justify-between border-b border-brand relative z-50">
          <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap max-w-6xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <Megaphone className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="font-bold text-white tracking-wide">
                {isBM ? cms.announcement.textBm : cms.announcement.textEn}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-xs">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-200" />
                <span>{isBM ? cms.operatingHours.scheduleBm : cms.operatingHours.scheduleEn}</span>
              </span>
            </div>
            <a 
              href={`tel:${phone.replace(/\s+/g, '')}`} 
              className="text-white hover:text-teal-100 font-bold cursor-pointer text-xs py-1 shrink-0 flex items-center justify-center gap-1"
            >
              <Phone className="w-3 h-3 text-emerald-300" />
              <span>{phone}</span>
            </a>
          </div>
        </div>
      )}

      {/* 1. STICKY TOP NAVIGATION HEADER */}
      <LandingHeader 
        isBM={isBM} 
        onToggleLanguage={onToggleLanguage} 
        activeLanguage={activeLanguage} 
        setIsBookingOpen={setIsBookingOpen} 
        onOpenLogin={onOpenLogin} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
        isMobileMenuOpen={isMobileMenuOpen}
        clinicName={clinicName}
        branchName={branchName}
      />

      {/* 2. DYNAMIC HERO SECTION FROM CMS */}
      <HeroSection 
        heroImages={heroImages} 
        heroSlide={heroSlide} 
        isBM={isBM} 
        setHeroSlide={setHeroSlide} 
        setIsBookingOpen={setIsBookingOpen}
        heroBadge={isBM ? cms.hero.badgeBm : cms.hero.badgeEn}
        heroTitle={isBM ? cms.hero.titleBm : cms.hero.titleEn}
        heroSubtitle={isBM ? cms.hero.subtitleBm : cms.hero.subtitleEn}
        ctaText={isBM ? cms.hero.ctaButtonBm : cms.hero.ctaButtonEn}
      />

      {/* 3. QUICK-TASK CARDS SECTION */}
      <QuickTasksSection isBM={isBM} setIsBookingOpen={setIsBookingOpen} openDoctorBooking={openDoctorBooking} />

      {/* 4. WHY PATIENTS CHOOSE US (4 CORE BENEFITS) */}
      <BenefitsSection isBM={isBM} />

      {/* 5. MEDICAL SERVICES BENTO GRID */}
      <ServicesSection isBM={isBM} setIsBookingOpen={setIsBookingOpen} />

      {/* 6. ON-DUTY RESIDENT DOCTORS */}
      <DoctorsSection 
        isBM={isBM} 
        setDoctorSpecialty={setDoctorSpecialty} 
        doctorSpecialty={doctorSpecialty} 
        filteredDoctors={filteredDoctors} 
        openDoctorBooking={openDoctorBooking} 
      />

      {/* 7. PANELS & PRACTICAL INFORMATION SECTION */}
      <PanelsSection 
        isBM={isBM} 
        panelSearch={panelSearch} 
        setPanelSearch={setPanelSearch} 
        filteredPanels={filteredPanels} 
        setSelectedPanelCheck={setSelectedPanelCheck} 
        selectedPanelCheck={selectedPanelCheck} 
        tpaPanels={tpaPanels} 
        panelEmpId={panelEmpId} 
        setPanelEmpId={setPanelEmpId} 
        setIsBookingOpen={setIsBookingOpen} 
      />

      {/* 8. REVIEWS & FAQ SECTION */}
      <FaqSection 
        isBM={isBM} 
        testimonials={testimonials} 
        faqs={faqs} 
        openFaqIndex={openFaqIndex} 
        toggleFaq={toggleFaq} 
      />

      {/* 9. FOOTER WITH DYNAMIC TENANT IDENTITY */}
      <footer id="contact" className="py-12 px-4 lg:px-8 bg-slate-900 text-slate-300 text-xs border-t border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <BrandName name={clinicName} className="text-base font-bold text-white block tracking-tight" accentClassName="text-teal-400" />
            <p className="text-slate-400 leading-relaxed text-xs">
              {branchName}. Certified medical facility equipped with biometric MyKad scanner, live EMR integration, and corporate panel coverage.
            </p>
            <span className="text-xs text-slate-400 font-mono block">KKM Reg #{licenseNo}</span>
          </div>

          <div className="space-y-2">
            <h4 className="type-label text-white">Contact &amp; Emergency</h4>
            <div className="space-y-2 pt-1">
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="block flex items-center gap-2 hover:text-white min-h-[44px]">
                <Phone className="w-3.5 h-3.5 text-teal-400" /> {phone}
              </a>
              <a href={`tel:${emergencyPhone.replace(/\s+/g, '')}`} className="block flex items-center gap-2 hover:text-white min-h-[44px] text-rose-300 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> 24/7 Hotline: {emergencyPhone}
              </a>
              <span className="block flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> {isBM ? cms.operatingHours.scheduleBm : cms.operatingHours.scheduleEn}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="type-label text-white">Location Address</h4>
            <div className="space-y-1 leading-relaxed pt-1">
              <span className="block flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </span>
              <p className="text-3xs text-slate-400 pt-1">
                {isBM ? cms.contact.transitNotesBm : cms.contact.transitNotesEn}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="type-label text-white">Portals &amp; Access</h4>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full py-2.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md min-h-[44px]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Portal Access</span>
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} {clinicName}. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#services" className="hover:text-white inline-flex items-center justify-center min-h-[44px]">Privacy Policy</a>
            <a href="#services" className="hover:text-white inline-flex items-center justify-center min-h-[44px]">Terms of Service</a>
            <a href="#services" className="hover:text-white inline-flex items-center justify-center min-h-[44px]">PDPA 2010 Compliance</a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-2 gap-2 p-3 bg-surface/95 backdrop-blur-md border-t border-line shadow-bar-up">
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="min-h-[48px] rounded-none bg-surface-accent border border-line text-ink text-sm font-bold flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4 text-accent" />
          <span>{isBM ? 'Hubungi' : 'Call'}</span>
        </a>
        <button
          type="button"
          onClick={() => setIsBookingOpen(true)}
          className="min-h-[48px] rounded-none bg-primary hover:bg-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>{isBM ? 'Tempah' : 'Book'}</span>
        </button>
      </div>

      {/* Floating Action Button (tablet & desktop) */}
      <div className="hidden sm:flex fixed bottom-6 right-6 z-40 flex-col gap-3 items-end">
        <button
          type="button"
          onClick={() => setIsBookingOpen(true)}
          className="px-4 py-3 rounded-none bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer ring-2 ring-white/80 min-h-[44px]"
        >
          <Calendar className="w-4 h-4" />
          <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
        </button>
      </div>

      {/* Appointment Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          isBM={isBM}
          selectedDoctor={selectedDoctor}
          onClose={closeBooking}
        />
      )}
    </div>
  );
}
