import React, { useState } from 'react';
import logoUrl from '../assets/logo_transparent.svg';
import { Language } from '../types';
import { 
  Stethoscope, Pill, ShieldCheck, Activity, Heart, Calendar, Clock, 
  MapPin, Phone, CheckCircle2, Star, ArrowRight, LogIn, BarChart3, 
  Users, Building2, ChevronRight, Menu, X, Search, Check, 
  ShieldAlert, Zap, Globe, Award, HelpCircle, Mail, ChevronDown, 
  ArrowUp, CreditCard, Car, Bus, Info, AlertTriangle
} from 'lucide-react';

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
    <div className="min-h-screen pb-[76px] sm:pb-0 bg-surface text-ink font-sans selection:bg-primary selection:text-white relative">
      
      {/* ========================================================================= */}
      {/* 0. STICKY TOP REAL-TIME TICKER & PULSE BANNER                             */}
      {/* ========================================================================= */}
      <div className="bg-primary text-teal-50 text-xs font-semibold py-1.5 px-4 flex items-center justify-between border-b border-brand relative z-50">
        <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center justify-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-bold text-white tracking-wide">
              {isBM ? 'KLINIK BEROPERASI 24/7' : '24/7 CLINIC LIVE STATUS'}
            </span>
            <span className="hidden sm:inline bg-teal-900/80 text-teal-50 text-xs font-mono px-1.5 py-0.5 rounded border border-teal-700">
              [DEMO TELEMETRY]
            </span>
          </div>
          <div className="hidden md:flex items-center justify-center gap-6 text-xs">
            <span className="flex items-center justify-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-teal-200" /> Suite 101: <strong className="text-white">Dr. Sarah Tan</strong> ({isBM ? 'Bertugas' : 'On Duty'})</span>
            <span className="flex items-center justify-center gap-1.5"><Pill className="w-3.5 h-3.5 text-emerald-300" /> {isBM ? 'Bekalan Farmasi:' : 'Pharmacy Inventory:'} <strong className="text-white">100% Ready</strong></span>
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
      <header className="sticky top-0 z-50 h-[60px] bg-surface-accent/95 backdrop-blur-md border-b border-line px-4 lg:px-8 flex items-center justify-between transition-all shadow-xs">
        <div className="flex items-center justify-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-none shrink-0 flex items-center justify-center">
            <img src={logoUrl} alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-ink block leading-none">
              MEDICLINIC <span className="text-accent">ENTERPRISE</span>
            </span>
            <span className="hidden sm:block text-xs text-slate-600 font-medium tracking-wide">
              {isBM ? 'Pusat Perubatan Pesakit Luar 24/7 Shah Alam' : '24/7 Outpatient Medical Clinic Shah Alam'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center justify-center gap-6 text-xs font-bold text-slate-700 whitespace-nowrap">
          <a href="#services" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Perkhidmatan' : 'Services'}</a>
          <a href="#doctors" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Doktor' : 'Doctors'}</a>
          <a href="#panels" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Panel Insurans' : 'Panel Coverage'}</a>
          <a href="#location" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Lokasi & Arah' : 'Location'}</a>
          <a href="#faq" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">FAQ</a>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center justify-center gap-2.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => onToggleLanguage(activeLanguage === 'EN' ? 'BM' : 'EN')}
            aria-label={activeLanguage === 'EN' ? 'Tukar ke Bahasa Malaysia' : 'Switch to English'}
            className="min-h-[44px] px-3 text-xs font-bold rounded-none border border-line-subtle bg-surface hover:bg-surface-accent text-accent transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            title="Toggle Bahasa Malaysia / English"
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{activeLanguage === 'EN' ? 'BM' : 'EN'}</span>
          </button>

          {/* Primary Header CTA */}
          <button
            type="button"
            onClick={() => setIsBookingOpen(true)}
            className="hidden sm:flex whitespace-nowrap min-h-[44px] px-4 text-xs font-bold rounded-none bg-primary hover:bg-primary-hover text-white shadow-md shadow-teal-500/20 items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
          </button>

          {/* Staff Login Button */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="hidden lg:flex min-h-[44px] px-3 text-xs font-bold rounded-none bg-surface-accent hover:bg-surface-strong text-ink border border-line items-center gap-1 transition-all cursor-pointer"
            title="Portal Staff Login"
          >
            <LogIn className="w-3.5 h-3.5 text-accent" />
            <span>{isBM ? 'Staf' : 'Staff'}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-none bg-surface border border-line-subtle text-slate-700 hover:text-ink cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute inset-x-0 top-full z-40 max-h-[calc(100vh-60px)] overflow-y-auto bg-surface-muted border-b border-line-subtle p-6 space-y-4 shadow-xl animate-fadeIn">
          <nav className="flex flex-col space-y-3 font-semibold text-sm text-slate-700">
            <a 
              href="#services" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-3 rounded-none hover:bg-surface hover:text-accent flex items-center justify-between min-h-[44px]"
            >
              <span>{isBM ? 'Perkhidmatan Perubatan' : 'Medical Services'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#doctors" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-3 rounded-none hover:bg-surface hover:text-accent flex items-center justify-between min-h-[44px]"
            >
              <span>{isBM ? 'Doktor & Pakar' : 'Resident Doctors'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#panels" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-3 rounded-none hover:bg-surface hover:text-accent flex items-center justify-between min-h-[44px]"
            >
              <span>{isBM ? 'Panel Insurans Korporat' : 'Corporate Insurance Panels'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#location" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-3 rounded-none hover:bg-surface hover:text-accent flex items-center justify-between min-h-[44px]"
            >
              <span>{isBM ? 'Lokasi & Peta' : 'Location & Directions'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#faq" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-3 rounded-none hover:bg-surface hover:text-accent flex items-center justify-between min-h-[44px]"
            >
              <span>FAQ</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </nav>
          
          <div className="pt-4 border-t border-line-subtle flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); setIsBookingOpen(true); }}
              className="w-full py-3 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md min-h-[44px]"
            >
              <Calendar className="w-4 h-4" />
              <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); onOpenLogin(); }}
              className="w-full py-3 rounded-none bg-surface-accent hover:bg-surface-strong text-ink border border-line font-bold text-xs flex items-center justify-center gap-2 min-h-[44px]"
            >
              <LogIn className="w-4 h-4 text-accent" />
              <span>{isBM ? 'Log Masuk Staf' : 'Staff login'}</span>
            </button>
          </div>
        </div>
      )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-14 px-4 lg:px-8 bg-surface overflow-hidden border-b border-line-subtle">
        
        {/* Animated Sliding Background Image Carousel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {heroImages.map((slideClass, idx) => (
            <div
              key={slideClass}
              className={`hero-slide ${slideClass} ${
                idx === heroSlide ? 'opacity-35 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto relative z-10 space-y-7">
          
          {/* Centered Hero Content Header */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            
            <div className="inline-flex items-center justify-center gap-2 bg-surface-accent border border-line-subtle pl-3.5 pr-1 py-0.5 rounded-full text-xs font-bold text-accent shadow-2xs">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span>{isBM ? 'Diagnosis pintar · Rawatan tepat' : 'Next-gen healthcare · Smart diagnostics'}</span>
              
              {/* Slide Dots Indicator (24px hit area around each dot) */}
              <div className="flex items-center justify-center ml-1 border-l border-teal-300/60 pl-1">
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHeroSlide(i)}
                    className="w-6 h-6 flex items-center justify-center cursor-pointer"
                    aria-label={`Show slide ${i + 1}`}
                    aria-current={i === heroSlide}
                  >
                    <span className={`block h-1.5 rounded-full transition-all ${i === heroSlide ? 'bg-primary w-3' : 'bg-teal-400 w-1.5'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Plain-language headline: what the clinic is and where */}
            <h1 className="type-display text-ink">
              {isBM ? (
                <>Klinik Pesakit Luar &amp; Rawatan Segera <span className="text-accent">24 Jam di Shah Alam</span></>
              ) : (
                <>24/7 Outpatient &amp; Urgent Care <span className="text-accent">in Shah Alam</span></>
              )}
            </h1>

            {/* Supporting line */}
            <p className="text-slate-700 font-semibold text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              {isBM 
                ? 'Nikmati rawatan mesra 24/7 tanpa janji temu, pendaftaran pantas MyKad, dan kelulusan panel TPA korporat 100% tanpa tunai.'
                : 'Experience seamless 24/7 walk-in care, instant MyKad check-in, and 100% cashless corporate TPA panel approval.'
              }
            </p>

            {/* Standardized Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer min-h-[44px]"
              >
                <Calendar className="w-4 h-4" />
                <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <a
                href="#doctors"
                className="w-full sm:w-auto px-7 py-4 rounded-none bg-surface hover:bg-surface-accent text-ink border border-line-subtle font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs min-h-[44px]"
              >
                <Clock className="w-4 h-4 text-accent" />
                <span>{isBM ? 'Semak Masa Menunggu' : 'Check live wait time'}</span>
              </a>
            </div>

            {/* Compact Status Strip */}
            <div className="pt-3 max-w-3xl mx-auto">
              <div className="bg-surface-accent/90 border border-line rounded-none p-3 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-700 font-bold shadow-xs">
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{isBM ? 'Buka 24/7 (Hari Ini)' : 'Open 24/7'}</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>{isBM ? 'Anggaran Masa Menunggu:' : 'Current estimated wait:'} <strong className="font-mono text-accent">11 min</strong></span>
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center justify-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBM ? '150+ Panel Korporat Cashless' : 'Cashless corporate panels available'}</span>
                </span>
              </div>
            </div>

            {/* Life-threatening emergency guidance */}
            <p className="max-w-3xl mx-auto flex items-start sm:items-center justify-center gap-2 text-sm text-rose-800 font-semibold text-left sm:text-center">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                {isBM ? 'Kecemasan yang mengancam nyawa? ' : 'Life-threatening emergency? '}
                <a href="tel:999" className="underline underline-offset-2 font-bold hover:text-rose-950 inline-block py-3.5 -my-3.5">{isBM ? 'Hubungi 999' : 'Call 999'}</a>
                {isBM ? ' atau pergi ke Jabatan Kecemasan hospital terdekat.' : ' or go to the nearest hospital A&E.'}
              </span>
            </p>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. QUICK-TASK CARDS SECTION                                               */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 lg:px-8 bg-surface-muted border-b border-line-subtle">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {isBM ? 'Bantuan Pantas Pesakit' : 'How Can We Help You Today?'}
            </span>
            <h2 className="type-section-title-lg text-ink">
              {isBM ? 'Pilih Perkhidmatan Kesihatan Anda' : 'Select Your Quick Service Task'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Task Card 1 */}
            <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-brand hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-surface-accent text-accent flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="type-card-title-lg text-ink group-hover:text-accent transition-colors">
                  {isBM ? 'Jumpa Doktor Outpatient' : 'See a doctor'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Walk-in terus 24 jam atau tempah masa konsultasi awal.' : 'Walk in anytime 24/7 or schedule your consultation time.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
              >
                <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Card 2 */}
            <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-brand hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="type-card-title-lg text-ink group-hover:text-emerald-700 transition-colors">
                  {isBM ? 'Semak Insurans / Panel' : 'Check panel coverage'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Sahkan kelayakan kad panel korporat tanpa tunai anda.' : 'Verify your cashless corporate panel card & e-GL eligibility.'}
                </p>
              </div>
              <a
                href="#panels"
                className="w-full py-2 px-3 bg-surface-accent hover:bg-surface-strong text-accent border border-line font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
              >
                <span>{isBM ? 'Semak Panel' : 'Check panel coverage'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Task Card 3 */}
            <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-sky-600 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="type-card-title-lg text-ink group-hover:text-sky-600 transition-colors">
                  {isBM ? 'Pediatrik & Imunisasi' : 'Child vaccination'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Pemeriksaan bayi & suntikan imunisasi KKM berjadual.' : 'Gentle pediatric care & KKM scheduled child vaccinations.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openDoctorBooking('Dr. Michael Wong')}
                className="w-full py-2 px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
              >
                <span>{isBM ? 'Pediatrik' : 'Book paediatrics'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Card 4 */}
            <div className="bg-surface border border-line-subtle p-5 rounded-none shadow-xs hover:border-rose-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="type-card-title-lg text-ink group-hover:text-rose-600 transition-colors">
                  {isBM ? 'Kecemasan Ringan 24/7' : 'Urgent minor injuries'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Jahitan luka, rawatan lecuran & nebulizer asma serta-merta.' : '24/7 acute wound suturing, dressings & asthma nebulization.'}
                </p>
                <p className="text-xs text-rose-800 font-semibold">
                  {isBM ? 'Mengancam nyawa? ' : 'Life-threatening? '}
                  <a href="tel:999" className="underline underline-offset-2 font-bold inline-block py-3.5 -my-3.5">{isBM ? 'Hubungi 999' : 'Call 999'}</a>
                </p>
              </div>
              <a
                href="tel:+60355108899"
                className="w-full py-2.5 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isBM ? 'Hubungi Klinik (Rawatan Segera)' : 'Call clinic (urgent care)'}</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. WHY PATIENTS CHOOSE US (4 CORE BENEFITS)                               */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {isBM ? 'Kelebihan Utama' : 'Why Patients Choose Us'}
            </span>
            <h2 className="type-section-title-lg text-ink">
              {isBM ? 'Penjagaan Kesihatan Berfokuskan Pesakit' : 'Patient-Centered Healthcare Experience'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isBM ? 'Empat keutamaan kami untuk memastikan rawatan anda mudah, pantas dan tenang.' : 'Four key benefits designed to make your medical visit swift, stress-free, and accessible.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="type-card-title-lg text-ink">
                {isBM ? 'Pendaftaran MyKad Pantas' : 'Fast MyKad check-in'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Imbasan cip MyKad dalam 5 saat tanpa sebarang borang manual yang leceh.' 
                  : 'Instant 5-second chip scan populates your details without tedious paper forms.'
                }
              </p>
            </div>

            <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="type-card-title-lg text-ink">
                {isBM ? 'Farmasi Setempat' : 'On-site pharmacy'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Pengambilan ubat berdaftar KKM yang disahkan kod bar secara terus di klinik.' 
                  : 'KKM-registered medication dispensed right after your doctor consultation.'
                }
              </p>
            </div>

            <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="type-card-title-lg text-ink">
                {isBM ? 'Panel Insurans Tanpa Tunai' : 'Cashless panel billing'}
              </h3>
              <p className="text-xs text-ink text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Tuntutan e-GL terus dengan PMCare, MiCare, HealthMetrics dan 150+ panel.' 
                  : 'Direct e-GL authorization with PMCare, MiCare, Petronas, and 150+ panels.'
                }
              </p>
            </div>

            <div className="bg-surface-muted border border-line-subtle p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-primary text-white rounded-none flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="type-card-title-lg text-ink">
                {isBM ? 'Akses Perubatan 24/7' : '24/7 access'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Pintu klinik sentiasa terbuka 24 jam sehari untuk sebarang kecemasan ringan.' 
                  : 'Always open 24 hours a day, 7 days a week for general & urgent medical needs.'
                }
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MEDICAL SERVICES BENTO GRID                                            */}
      {/* ========================================================================= */}
      <section id="services" className="py-20 px-4 lg:px-8 bg-surface-muted border-t border-line-subtle">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent bg-surface-accent px-3.5 py-1 rounded-full border border-line-subtle">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span>{isBM ? 'Perkhidmatan Perubatan Outpatient' : 'Comprehensive Outpatient Services'}</span>
              </span>
              <h2 className="type-section-title-lg text-ink">
                {isBM ? 'Rawatan Perubatan & Pakar Kami' : 'Doctor Consultations & Urgent Care'}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {isBM 
                  ? 'Menyediakan rawatan am, pesakit luar, penjagaan kanak-kanak, pemeriksaan kesihatan korporat, dan prosedur kecemasan ringan 24 jam.'
                  : 'Delivering expert general practice, pediatric care, corporate health screenings, and round-the-clock minor emergency procedures.'
                }
              </p>
            </div>
          </div>

          {/* Asymmetric Bento Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* FEATURED HERO CARD (Spans 7 Cols on Desktop) */}
            <div className="lg:col-span-7 bg-surface border border-line rounded-none p-7 shadow-xs space-y-6 relative overflow-hidden group hover:border-brand transition-all">
              <div className="h-1 bg-primary absolute top-0 left-0 right-0" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-none bg-primary text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-accent block">
                      {isBM ? 'Suite Konsultasi Utama' : 'Primary Consultation Suite'}
                    </span>
                    <h3 className="type-card-title-lg text-ink group-hover:text-accent transition-colors">
                      {isBM ? 'Konsultasi Doktor Am' : 'General practice consultations'}
                    </h3>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center justify-center gap-1.5 text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Suite 101 Active
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-normal relative z-10">
                {isBM 
                  ? 'Diagnosis dan rawatan penyakit harian, serta penjagaan berterusan untuk penyakit kronik, oleh doktor berdaftar MMC.'
                  : 'Diagnosis and treatment for everyday illnesses, plus ongoing care for long-term conditions, by MMC-registered doctors.'
                }
              </p>

              {/* Key Clinical Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10 text-xs font-semibold text-slate-800">
                <div className="flex items-center justify-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>{isBM ? 'Demam Akut & Selsema Viral' : 'Acute Fever & Viral Flu'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>{isBM ? 'Kawalan Darah Tinggi & Kencing Manis' : 'Hypertension & Diabetes Care'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>{isBM ? 'Batuk, Selsema & Sakit Tekak' : 'Cough, Cold & Sore Throat'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-surface-muted p-2.5 rounded-none border border-line-subtle">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>{isBM ? 'Masalah Perut & Gastrik' : 'Stomach & Gastric Complaints'}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-line relative z-10">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="px-5 py-2.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                </button>
              </div>

            </div>

            {/* CARD 2: PHARMACY (Spans 5 Cols) */}
            <div className="lg:col-span-5 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-brand hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-primary absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <Pill className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-none border border-emerald-200">
                    KKM Approved
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="type-card-title-lg text-ink group-hover:text-emerald-700 transition-colors">
                    {isBM ? 'Farmasi & Dispensari Bekalan Ubat' : 'On-Site Pharmacy & Dispensing'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isBM 
                      ? 'Farmasi berlesen dengan bekalan ubat sah KKM, semakan alahan ubat automatik, dan ubat khas kanak-kanak.' 
                      : 'Licensed dispensary supplying KKM-approved pharmaceuticals, automated antibiotic fulfillment, and child allergy checks.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 3: PEDIATRICS (Spans 4 Cols) */}
            <div className="lg:col-span-4 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-sky-600 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-sky-600 absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-none border border-sky-200">
                    Child Friendly
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="type-card-title-lg text-ink group-hover:text-sky-600 transition-colors">
                    {isBM ? 'Pediatrik & Imunisasi Kanak-Kanak' : 'Child Vaccination & Paediatrics'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isBM 
                      ? 'Rawatan mesra kanak-kanak, pemantauan tumbesaran, dan jadual suntikan vaksin imunisasi KKM.' 
                      : 'Gentle healthcare for infants and children, growth tracking, and mandatory KKM childhood vaccination schedules.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 4: CORPORATE PANEL (Spans 4 Cols) */}
            <div className="lg:col-span-4 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-indigo-600 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-indigo-600 absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-none border border-indigo-200">
                    150+ Panels
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="type-card-title-lg text-ink group-hover:text-indigo-700 transition-colors">
                    {isBM ? 'Semak Insurans Panel Tanpa Tunai' : 'Check your cashless medical coverage'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isBM 
                      ? 'Tuntutan bil tanpa tunai untuk PMCare, MiCare, HealthMetrics, Petronas, dan Maybank dengan e-GL serta-merta.' 
                      : 'Cashless medical billing for PMCare, MiCare, HealthMetrics, Petronas, and Maybank staff with real-time e-GL dispatch.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 5: HEALTH SCREENING (Spans 4 Cols) */}
            <div className="lg:col-span-4 bg-surface border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-brand hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-primary absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-surface-accent border border-line-subtle flex items-center justify-center text-accent shadow-2xs group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-none border border-teal-200">
                    Full Profiling
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="type-card-title-lg text-ink group-hover:text-accent transition-colors">
                    {isBM ? 'Pemeriksaan Kesihatan Eksekutif' : 'Executive Health Screening'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isBM 
                      ? 'Ujian darah penuh, ECG jantung 12-lead, profil kolesterol, dan ujian fungsi buah pinggang & hati.' 
                      : 'Full-body blood profiling, 12-lead ECG cardiac screening, lipid panels, and kidney/liver functionality testing.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 6: 24/7 EMERGENCY & SURGERY (Spans Full Width 12 Cols Banner) */}
            <div className="lg:col-span-12 bg-rose-50/90 border border-rose-200 rounded-none p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 hover:border-rose-400 transition-all group">
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-none bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-none border border-rose-200">
                      24/7 Urgent Care
                    </span>
                  </div>
                  <h3 className="type-card-title-lg text-ink">
                    {isBM ? 'Rawatan Kecemasan 24 Jam & Pembedahan Kecil' : '24-Hour Urgent Care & Minor Surgical Procedures'}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    {isBM 
                      ? 'Penjagaan serta-merta untuk jahitan luka kecederaan, cuci lecuran, nebulizer asma, dan suntikan kancing gigi.' 
                      : 'Immediate care for acute wound suturing, burn dressing, abscess drainage, asthma nebulization, foreign body removal, and tetanus prophylaxis.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0 w-full md:w-auto">
                <a
                  href="tel:+60355108899"
                  className="w-full md:w-auto px-6 py-3 rounded-none bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                >
                  <Phone className="w-4 h-4" />
                  <span>{isBM ? 'Hubungi Klinik: +60 3-5510 8899' : 'Call clinic: +60 3-5510 8899'}</span>
                </a>
                <span className="text-xs text-rose-800 font-semibold text-center md:text-right">
                  {isBM ? 'Mengancam nyawa? ' : 'Life-threatening? '}
                  <a href="tel:999" className="underline underline-offset-2 font-bold inline-block py-3.5 -my-3.5">{isBM ? 'Hubungi 999' : 'Call 999'}</a>
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ON-DUTY RESIDENT DOCTORS                                               */}
      {/* ========================================================================= */}
      <section id="doctors" className="py-20 px-4 lg:px-8 bg-surface border-t border-line-subtle">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {isBM ? 'Staf Perubatan Bertauliah' : 'Resident Physicians'}
              </span>
              <h2 className="type-section-title-lg text-ink">
                {isBM ? 'Doktor Perubatan & Pakar Resident' : 'Resident Medical Doctors & Specialists'}
              </h2>
            </div>

            {/* Department Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold bg-surface-muted p-1.5 rounded-none border border-line-subtle">
              {['All', 'General Medicine', 'Pediatrics', 'Pharmacy'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDoctorSpecialty(dept)}
                  className={`min-h-[44px] px-3 py-1.5 rounded-none transition-colors cursor-pointer ${
                    doctorSpecialty === dept 
                      ? 'bg-primary text-white shadow-2xs' 
                      : 'text-slate-700 hover:text-ink'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {filteredDoctors.map((doc) => (
              <div key={doc.id} className="ice-mint-card-interactive p-6 text-center space-y-4 group relative">
                
                {/* Availability State Pill */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-none flex items-center justify-center gap-1 border bg-emerald-100 text-emerald-800 border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {doc.availabilityState}
                  </span>
                </div>

                <div className={`w-20 h-20 rounded-none ${doc.bgColor} mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-md group-hover:scale-105 transition-transform border border-teal-600`}>
                  {doc.id}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-amber-800 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{doc.rating} ({doc.experience})</span>
                  </div>
                  <h3 className="type-card-title-lg text-ink">{doc.name}</h3>
                  <span className="text-xs text-accent font-semibold block">{doc.title}</span>
                  <span className="text-xs text-slate-600 block pt-0.5">{doc.role}</span>
                  <span className="text-xs text-slate-600 block">Languages: {doc.languages}</span>
                </div>
                
                {/* Live Slot Status Box */}
                <div className="p-3 bg-surface-accent border border-line rounded-none flex items-center justify-between text-xs font-bold text-slate-700 shadow-2xs">
                  <span className="flex items-center justify-center gap-1.5 text-ink">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>{doc.nextSlot}</span>
                  </span>
                  <span className="font-mono text-accent bg-white px-2 py-0.5 border border-line-subtle text-xs">
                    {doc.queueCount} {isBM ? 'Menunggu' : 'Queued'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openDoctorBooking(doc.name)}
                  className="w-full py-2.5 rounded-none bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs min-h-[44px]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                </button>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PANELS & PRACTICAL INFORMATION SECTION                                 */}
      {/* ========================================================================= */}
      <section id="panels" className="py-16 px-4 lg:px-8 bg-surface-muted border-t border-line-subtle">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Panel Search & Eligibility Checker */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">
                      {isBM ? 'Perlindungan Insurans Korporat' : 'Cashless Corporate Panel Coverage'}
                    </span>
                    <h3 className="type-card-title-lg text-ink">
                      {isBM ? 'Panel TPA & Insurans Diterima' : 'Search Supported Corporate Panels'}
                    </h3>
                  </div>

                  {/* Panel Search Input */}
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={isBM ? 'Cari nama panel...' : 'Search panel...'}
                      value={panelSearch}
                      onChange={e => setPanelSearch(e.target.value)}
                      className="w-full pl-9.5 pr-3.5 py-2.5 rounded-none bg-surface border border-line-subtle text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-bold">
                  {filteredPanels.map((panel, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => setSelectedPanelCheck(panel)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-none border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                        selectedPanelCheck === panel 
                          ? 'bg-primary text-white border-brand' 
                          : 'bg-surface border-line-subtle text-slate-700 hover:border-brand hover:text-accent'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{panel}</span>
                    </button>
                  ))}
                  {filteredPanels.length === 0 && (
                    <div className="text-slate-600 text-xs py-2">No matching corporate panel found.</div>
                  )}
                </div>
              </div>

              {/* Panel Checker Box */}
              <div className="bg-surface border border-line-subtle rounded-none p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-line-subtle pb-3">
                  <span className="text-xs font-bold text-ink flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-accent" /> {isBM ? 'Semakan Panel' : 'Panel Eligibility Check'}
                  </span>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    DEMO CHECKER
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                      {isBM ? 'Pilih Panel TPA' : 'Selected TPA Panel'}
                    </label>
                    <select
                      value={selectedPanelCheck}
                      onChange={e => setSelectedPanelCheck(e.target.value)}
                      className="w-full p-2.5 rounded-none bg-surface-accent border border-line text-xs font-bold text-ink focus:outline-none"
                    >
                      {tpaPanels.map((p, i) => (
                        <option key={i} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                      {isBM ? 'No. Staff / Kad Pengenalan' : 'Staff / IC Reference ID'}
                    </label>
                    <input
                      type="text"
                      value={panelEmpId}
                      onChange={e => setPanelEmpId(e.target.value)}
                      placeholder="Enter Staff ID..."
                      className="w-full p-2.5 rounded-none bg-surface-muted border border-line-subtle text-xs font-mono font-bold text-ink focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-surface-accent border border-line rounded-none space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Consultation Coverage:</span>
                      <span className="font-bold text-emerald-700">100% Cashless</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Medication Allowance:</span>
                      <span className="font-bold text-accent">RM 250 / Visit</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(true)}
                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-none transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Practical Info: What to Bring & Travel Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* What to bring */}
            <div className="bg-surface border border-line-subtle p-6 rounded-none space-y-4">
              <h3 className="type-card-title-lg text-ink flex items-center justify-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <span>{isBM ? 'Dokumen Perlu Dibawa' : 'What to Bring for Your Visit'}</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>MyKad / MyKid / Passport:</strong> Required for identity verification and fast check-in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Corporate Panel Card / e-GL:</strong> Digital Guarantee Letter via TPA app or physical panel card.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Current Medications / Prescriptions:</strong> Helps doctor cross-check drug interactions.</span>
                </li>
              </ul>
            </div>

            {/* Travel Context & Parking */}
            <div className="bg-surface border border-line-subtle p-6 rounded-none space-y-4" id="location">
              <h3 className="type-card-title-lg text-ink flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <span>{isBM ? 'Lokasi & Kemudahan Parkir' : 'Location & Transport Access'}</span>
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <p>
                  <strong>Address:</strong> Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor.
                </p>
                <div className="flex items-start gap-2">
                  <Car className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Parking:</strong> Underground visitor parking at Bays A &amp; B (First 1 hr free for patients).</span>
                </div>
                <div className="flex items-start gap-2">
                  <Bus className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Public Transit:</strong> 5 mins taxi from LRT Glenmarie / KTM Shah Alam station.</span>
                </div>
                <p className="text-xs text-slate-600 pt-1 font-semibold">
                  Serving patients across Shah Alam, Subang Jaya, Puchong, Klang, and surrounding Klang Valley areas.
                </p>
              </div>
            </div>

          </div>

          {/* Emergency Safety Warning Callout */}
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-none flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-amber-950 uppercase text-xs tracking-wider">
                {isBM ? 'AMARAN KECEMASAN SERIUS' : 'CRITICAL EMERGENCY SAFETY NOTICE'}
              </strong>
              <span>
                {isBM 
                  ? 'Bagi kecemasan yang mengancam nyawa (seperti sakit dada teruk, trauma berat, atau tidak sedarkan diri), sila hubungi 999 atau pergi ke Jabatan Kecemasan Hospital terdekat dengan segera.' 
                  : 'For severe life-threatening emergencies (e.g. severe chest pain, major physical trauma, loss of consciousness), please call 999 or proceed immediately to the nearest hospital Emergency Department rather than using online booking.'
                }
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. REVIEWS & FAQ SECTION                                                  */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 px-4 lg:px-8 bg-surface border-t border-line-subtle">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Patient Reviews */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {isBM ? 'Maklum Balas Pesakit' : 'Patient Reviews'}
              </span>
              <h2 className="type-section-title-lg text-ink">
                {isBM ? 'Apa Kata Pesakit Kami' : 'What Our Patients Say'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div key={idx} className="ice-mint-card p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      &ldquo;{t.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line-subtle flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-ink">{t.name}</div>
                      <div className="text-xs text-accent">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-6 pt-6 border-t border-line-subtle">
            <div className="text-center space-y-2">
              <h2 className="type-section-title-lg text-ink">
                {isBM ? 'Soalan Lazim (FAQ)' : 'Frequently Asked Questions'}
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="ice-mint-card transition-all">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none min-h-[44px]"
                    >
                      <span className="text-xs font-bold text-ink flex items-center justify-center gap-2">
                        <HelpCircle className="w-4 h-4 text-accent shrink-0" />
                        {faq.q}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-line-subtle pt-3 animate-fadeIn">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer id="contact" className="py-12 px-4 lg:px-8 bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
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
              <span className="block flex items-center justify-center gap-2"><Mail className="w-3.5 h-3.5 text-teal-400" /> emergency@mediclinic.my</span>
              <span className="block flex items-center justify-center gap-2"><Clock className="w-3.5 h-3.5 text-teal-400" /> 24 Hours / 7 Days Open</span>
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

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
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
          className="w-11 h-11 rounded-none bg-surface border border-line-subtle text-slate-700 hover:text-accent hover:border-brand shadow-md flex items-center justify-center transition-all cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 10. APPOINTMENT BOOKING MODAL                                              */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface border border-line-subtle rounded-none max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-ink">
            
            <div className="flex items-center justify-between border-b border-line-subtle pb-4">
              <div className="flex items-center justify-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-surface-accent border border-line-subtle flex items-center justify-center text-accent">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="type-card-title-lg text-ink">
                    {isBM ? 'Tempah Janji Temu Doktor' : 'Book Doctor Appointment'}
                  </h3>
                  {selectedDoctor && (
                    <span className="text-xs text-accent font-semibold block">
                      Preferred: {selectedDoctor}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="w-8 h-8 rounded-none bg-surface-accent text-slate-500 hover:text-ink flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingSubmitted ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-none bg-emerald-100 border border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="type-section-title text-ink">{isBM ? 'Janji Temu Disahkan!' : 'Appointment Reserved!'}</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  {isBM ? 'Terima kasih,' : 'Thank you,'} <strong className="text-accent">{bookingForm.fullName}</strong>. {isBM ? 'Rujukan giliran anda ialah' : 'Your queue reference is'} <strong className="text-mono font-bold text-amber-600">#APT-8902</strong>.
                </p>
                <div className="p-4 bg-surface-muted rounded-none border border-line-subtle text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service:</span>
                    <strong className="text-slate-800">{bookingForm.service}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date &amp; Time:</span>
                    <strong className="text-accent">{bookingForm.preferredDate || 'Today'} @ {bookingForm.preferredTime}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetBooking}
                  className="px-6 py-2.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center min-h-[44px]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                    placeholder="e.g. Ahmad Firdaus Bin Ismail"
                    value={bookingForm.fullName}
                    onChange={e => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">MyKad IC Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink font-mono focus:outline-none focus:border-brand"
                      placeholder="YYMMDD-XX-XXXX"
                      value={bookingForm.icNumber}
                      onChange={e => setBookingForm({ ...bookingForm, icNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                      placeholder="+60 12-345 6789"
                      value={bookingForm.phone}
                      onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Medical Specialty *</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                    value={bookingForm.service}
                    onChange={e => setBookingForm({ ...bookingForm, service: e.target.value })}
                  >
                    <option value="General Outpatient Consultation">General Outpatient Consultation</option>
                    <option value="Pediatrics & Child Vaccination">Pediatrics &amp; Child Vaccination</option>
                    <option value="Executive Health Screening">Executive Health Screening</option>
                    <option value="Corporate Panel TPA Visit">Corporate Panel TPA Visit</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                      value={bookingForm.preferredDate}
                      onChange={e => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Preferred Time</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-none bg-surface-muted border border-line-subtle text-ink focus:outline-none focus:border-brand"
                      value={bookingForm.preferredTime}
                      onChange={e => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="08:00 PM">08:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Protected under Malaysia PDPA Act 2010.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-2 inline-flex items-center justify-center min-h-[44px]"
                >
                  Confirm Appointment Booking
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
