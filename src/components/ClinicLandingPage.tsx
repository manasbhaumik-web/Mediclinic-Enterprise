import React, { useState } from 'react';
import logoUrl from '../assets/logo_transparent.svg';
import ThemeSelector from './ui/ThemeSelector';
import { Language } from '../types';
import { 
  Stethoscope, Pill, ShieldCheck, Activity, Heart, Calendar, Clock, 
  MapPin, Phone, CheckCircle2, Star, ArrowRight, LogIn, BarChart3, 
  Users, Building2, ChevronRight, Menu, X, Search, Check, 
  ShieldAlert, Zap, Globe, Award, HelpCircle, Mail, ChevronDown, 
  ArrowUp, CreditCard, Car, Bus, Info, AlertTriangle
} from 'lucide-react';
import LandingHeader from './landing/LandingHeader';
import HeroSection from './landing/HeroSection';
import QuickTasksSection from './landing/QuickTasksSection';
import BenefitsSection from './landing/BenefitsSection';
import ServicesSection from './landing/ServicesSection';
import DoctorsSection from './landing/DoctorsSection';
import PanelsSection from './landing/PanelsSection';
import FaqSection from './landing/FaqSection';
import BookingModal from './landing/BookingModal';

interface ClinicLandingPageProps {
  activeLanguage: Language;
  onToggleLanguage: (lang: Language) => void;
  onOpenLogin: () => void;
  onOpenTelemetry: () => void;
  doctorQueueLength?: number;
}

export default function ClinicLandingPage({
  activeLanguage,
  onToggleLanguage,
  onOpenLogin,
  onOpenTelemetry,
  doctorQueueLength = 3
}: ClinicLandingPageProps) {
  // Mobile Nav Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Appointment Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
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

  // Hero Background Carousel State (Custom AI Generated Images)
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

  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    icNumber: '',
    phone: '',
    service: 'General Outpatient Consultation',
    preferredDate: '',
    preferredTime: '10:00 AM'
  });

  const isBM = activeLanguage === 'BM';

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitted(true);
  };

  const resetBooking = () => {
    setBookingSubmitted(false);
    setIsBookingOpen(false);
    setSelectedDoctor(null);
    setBookingForm({
      fullName: '',
      icNumber: '',
      phone: '',
      service: 'General Outpatient Consultation',
      preferredDate: '',
      preferredTime: '10:00 AM'
    });
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

  const tpaPanels = [
    'PMCare TPA', 'MiCare Corporate', 'HealthMetrics', 'RedAlert Online', 
    'Petronas Medical', 'Maybank Staff', 'Intel Healthcare', 'Sime Darby Panel', 
    'CelcomDigi Health', 'AIA Corporate', 'Great Eastern TPA', 'Sunway Medical Panel'
  ];

  const filteredPanels = tpaPanels.filter(panel => 
    panel.toLowerCase().includes(panelSearch.toLowerCase())
  );

  const doctorsList = [
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
    },
    {
      id: 'AR',
      name: 'Pharm. Ahmad Razak',
      title: 'B.Pharm (UM), Registered Pharmacist',
      role: isBM ? 'Ketua Pegawai Farmasi Klinikal' : 'Chief Pharmacist & Clinical Formulator',
      specialty: 'Pharmacy',
      bgColor: 'bg-primary',
      status: isBM ? 'Aktif - Farmasi' : 'Active - Dispensary',
      availabilityState: isBM ? 'Di Farmasi' : 'In Dispensary',
      nextSlot: isBM ? 'Serahan < 4m' : 'Fulfillment < 4m',
      languages: 'EN, BM',
      queueCount: 1,
      rating: 4.95,
      experience: '10+ Years'
    },
    {
      id: 'MW',
      name: 'Dr. Michael Wong',
      title: 'MBBS (Malaya), MMed Pediatrics',
      role: isBM ? 'Kanak-Kanak & Pakar Pediatrik' : 'Consultant Pediatrician',
      specialty: 'Pediatrics',
      bgColor: 'bg-sky-600',
      status: isBM ? 'Bertugas - Bilik 204' : 'On Duty - Suite 204',
      availabilityState: isBM ? 'Sedia Ada Sekarang' : 'Available Now',
      nextSlot: isBM ? 'Slot Seterusnya: 10:30 AM' : 'Next: 10:30 AM',
      languages: 'EN, BM, Cantonese',
      queueCount: 0,
      rating: 5.0,
      experience: '15+ Years'
    }
  ];

  const filteredDoctors = doctorSpecialty === 'All' 
    ? doctorsList 
    : doctorsList.filter(doc => doc.specialty === doctorSpecialty);

  const faqs = [
    {
      q: isBM ? 'Adakah saya perlu membuat janji temu atau boleh terus walked-in?' : 'Do I need an appointment or can I walk in for consultations?',
      a: isBM 
        ? 'Kedatangan terus (walk-in) dialu-alukan 24 jam sehari, 7 hari seminggu. Menempah janji temu secara dalam talian memastikan masa giliran anda diperuntukkan lebih awal, mengurangkan masa menunggu di ruang legar.' 
        : 'Walk-ins are welcomed 24 hours a day, 7 days a week. Booking an appointment online reserves your visit in advance, helping reduce your waiting room time.'
    },
    {
      q: isBM ? 'Apakah panel insurans korporat dan TPA yang diterima?' : 'Which corporate insurance and TPA panels are accepted?',
      a: isBM 
        ? 'Kami menyokong tuntutan tanpa tunai (cashless) untuk panel utama termasuk PMCare, MiCare, HealthMetrics, RedAlert, Petronas, Maybank, Intel, dan AIA. Pengesahan panel dilakukan serta-merta menggunakan MyKad atau Kad Panel anda.' 
        : 'We support cashless billing for major Malaysia TPAs including PMCare, MiCare, HealthMetrics, RedAlert, Petronas, Maybank Staff, Intel, and AIA. You can verify your panel directly at registration using your MyKad or Panel Card.'
    },
    {
      q: isBM ? 'Bagaimanakah pendaftaran MyKad pantas berfungsi?' : 'How does the fast MyKad check-in work?',
      a: isBM 
        ? 'Semasa mendaftar, imbasan pembaca MyKad selamat kami mengisi maklumat profil secara automatik serta mengesahkan kelayakan panel insurans dalam masa kurang daripada 5 saat.' 
        : 'During check-in, our encrypted smart reader instantly populates your patient profile, verifying identity and retrieving active panel coverage in under 5 seconds.'
    },
    {
      q: isBM ? 'Apakah prosedur kecemasan ringan dan pembedahan kecil yang disediakan?' : 'What minor surgical and emergency procedures are available?',
      a: isBM 
        ? 'Bilik rawatan kecemasan 24/7 kami mengendalikan balutan luka, jahitan laceration, rawatan nebulizer asma, pembersihan bisul, dan suntikan kancing gigi (tetanus).' 
        : 'Our 24/7 emergency suite handles acute laceration suturing, wound dressing, asthma nebulization, abscess drainage, foreign body removal, and tetanus prophylaxis.'
    }
  ];

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

  const filteredTestimonials = reviewCategory === 'All'
    ? testimonials
    : testimonials.filter(t => t.category === reviewCategory);

  return (
    <div className="min-h-screen pb-[76px] sm:pb-0 bg-canvas text-ink font-sans selection:bg-primary selection:text-white relative">
      
      {/* ========================================================================= */}
      {/* 0. STICKY TOP REAL-TIME TICKER & PULSE BANNER                             */}
      {/* ========================================================================= */}
      <div className="bg-primary text-teal-50 text-xs font-semibold py-1.5 px-4 flex items-center justify-between border-b border-brand relative z-50">
        <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-bold text-white tracking-wide">
              {isBM ? 'KLINIK BEROPERASI 24/7' : '24/7 CLINIC LIVE STATUS'}
            </span>
            <span className="hidden sm:inline bg-teal-900/80 text-teal-50 text-xs font-mono px-1.5 py-0.5 rounded-none border border-teal-700">
              [DEMO TELEMETRY]
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs">
            <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-teal-200" /> Suite 101: <strong className="text-white">Dr. Sarah Tan</strong> ({isBM ? 'Bertugas' : 'On Duty'})</span>
            <span className="flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-emerald-300" /> {isBM ? 'Bekalan Farmasi:' : 'Pharmacy Inventory:'} <strong className="text-white">100% Ready</strong></span>
          </div>
          <a 
            href="tel:+60355108899" 
            className="text-white hover:text-teal-100 font-bold cursor-pointer text-xs py-1 shrink-0 flex items-center justify-center gap-1"
          >
            <Phone className="w-3 h-3 text-emerald-300" />
            <span>+60 3-5510 8899</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVIGATION HEADER                                             */}
      {/* ========================================================================= */}
      <LandingHeader isBM={isBM} onToggleLanguage={onToggleLanguage} activeLanguage={activeLanguage} setIsBookingOpen={setIsBookingOpen} onOpenLogin={onOpenLogin} setIsMobileMenuOpen={setIsMobileMenuOpen} isMobileMenuOpen={isMobileMenuOpen} />

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <HeroSection heroImages={heroImages} heroSlide={heroSlide} isBM={isBM} setHeroSlide={setHeroSlide} setIsBookingOpen={setIsBookingOpen} />

      {/* ========================================================================= */}
      {/* 3. QUICK-TASK CARDS SECTION                                               */}
      {/* ========================================================================= */}
      <QuickTasksSection isBM={isBM} setIsBookingOpen={setIsBookingOpen} openDoctorBooking={openDoctorBooking} />

      {/* ========================================================================= */}
      {/* 4. WHY PATIENTS CHOOSE US (4 CORE BENEFITS)                               */}
      {/* ========================================================================= */}
      <BenefitsSection isBM={isBM} />

      {/* ========================================================================= */}
      {/* 5. MEDICAL SERVICES BENTO GRID                                            */}
      {/* ========================================================================= */}
      <ServicesSection isBM={isBM} setIsBookingOpen={setIsBookingOpen} />

      {/* ========================================================================= */}
      {/* 6. ON-DUTY RESIDENT DOCTORS                                               */}
      {/* ========================================================================= */}
      <DoctorsSection isBM={isBM} setDoctorSpecialty={setDoctorSpecialty} doctorSpecialty={doctorSpecialty} filteredDoctors={filteredDoctors} openDoctorBooking={openDoctorBooking} />

      {/* ========================================================================= */}
      {/* 7. PANELS & PRACTICAL INFORMATION SECTION                                 */}
      {/* ========================================================================= */}
      <PanelsSection isBM={isBM} panelSearch={panelSearch} setPanelSearch={setPanelSearch} filteredPanels={filteredPanels} setSelectedPanelCheck={setSelectedPanelCheck} selectedPanelCheck={selectedPanelCheck} tpaPanels={tpaPanels} panelEmpId={panelEmpId} setPanelEmpId={setPanelEmpId} setIsBookingOpen={setIsBookingOpen} />

      {/* ========================================================================= */}
      {/* 8. REVIEWS & FAQ SECTION                                                  */}
      {/* ========================================================================= */}
      <FaqSection isBM={isBM} testimonials={testimonials} faqs={faqs} openFaqIndex={openFaqIndex} toggleFaq={toggleFaq} />

      {/* ========================================================================= */}
      {/* 9. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer id="contact" className="py-12 px-4 lg:px-8 bg-slate-900 text-slate-300 text-xs border-t border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <span className="text-base font-bold text-white block tracking-tight">MEDICLINIC ENTERPRISE</span>
            <p className="text-slate-400 leading-relaxed text-xs">
              Shah Alam&apos;s premier 24/7 outpatient medical facility equipped with biometric MyKad scanner, EMR integration, and corporate panel coverage.
            </p>
            <span className="text-xs text-slate-400 font-mono block">KKM Reg #KKM-2026-SL-8902</span>
          </div>

          <div className="space-y-2">
            <h4 className="type-label text-white">Contact &amp; Emergency</h4>
            <div className="space-y-2 pt-1">
              <a href="tel:+60355108899" className="block flex items-center justify-center gap-2 hover:text-white min-h-[44px]"><Phone className="w-3.5 h-3.5 text-teal-400" /> +60 3-5510 8899</a>
              <span className="block flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-teal-400" /> emergency@mediclinic.my</span>
              <span className="block flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-teal-400" /> 24 Hours / 7 Days Open</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="type-label text-white">Location Address</h4>
            <div className="space-y-1 leading-relaxed pt-1">
              <span className="block flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
              </span>
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
          <span>&copy; 2026 MediClinic Enterprise. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#services" className="hover:text-white inline-flex items-center justify-center min-h-[44px]">Privacy Policy</a>
            <a href="#services" className="hover:text-white inline-flex items-center justify-center min-h-[44px]">Terms of Service</a>
            <a href="#services" className="hover:text-white inline-flex items-center justify-center min-h-[44px]">PDPA Compliance</a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-2 gap-2 p-3 bg-surface/95 backdrop-blur-md border-t border-line shadow-bar-up">
        <a
          href="tel:+60355108899"
          className="min-h-[48px] rounded-none bg-surface-accent border border-line text-ink text-sm font-bold flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4 text-accent" />
          <span>{isBM ? 'Hubungi Klinik' : 'Call clinic'}</span>
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

        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-11 h-11 rounded-none bg-surface border border-line-subtle text-muted hover:text-accent hover:border-brand shadow-md flex items-center justify-center transition-all cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 10. APPOINTMENT BOOKING MODAL                                              */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <BookingModal isBM={isBM} selectedDoctor={selectedDoctor} setIsBookingOpen={setIsBookingOpen} bookingSubmitted={bookingSubmitted} bookingForm={bookingForm} resetBooking={resetBooking} handleBookingSubmit={handleBookingSubmit} setBookingForm={setBookingForm} />
      )}

    </div>
  );
}
