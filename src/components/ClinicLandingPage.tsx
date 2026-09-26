import React, { useState } from 'react';
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
      bgColor: 'bg-[#0d9488]',
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
      bgColor: 'bg-[#0f766e]',
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
      bgColor: 'bg-[#0284c7]',
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
    <div className="min-h-screen bg-[#f7fdfd] text-[#0f3c4c] font-sans selection:bg-[#0d9488] selection:text-white relative">
      
      {/* ========================================================================= */}
      {/* 0. STICKY TOP REAL-TIME TICKER & PULSE BANNER                             */}
      {/* ========================================================================= */}
      <div className="bg-[#0f766e] text-teal-50 text-[11px] font-semibold py-1.5 px-4 flex items-center justify-between border-b border-[#0d9488] relative z-50">
        <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-extrabold text-white tracking-wide">
              {isBM ? 'KLINIK BEROPERASI 24/7' : '24/7 CLINIC LIVE STATUS'}
            </span>
            <span className="bg-teal-900/80 text-teal-200 text-[9px] font-mono px-1.5 py-0.5 rounded border border-teal-700">
              [DEMO TELEMETRY]
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-teal-200" /> Suite 101: <strong className="text-white">Dr. Sarah Tan</strong> ({isBM ? 'Bertugas' : 'On Duty'})</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-200" /> {isBM ? 'Purata Masa Menunggu:' : 'Est. Wait Time:'} <strong className="text-white font-mono">11 mins</strong></span>
            <span className="flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-emerald-300" /> {isBM ? 'Bekalan Farmasi:' : 'Pharmacy Inventory:'} <strong className="text-emerald-300">100% Ready</strong></span>
          </div>
          <a 
            href="tel:+60355108899" 
            className="text-emerald-300 hover:text-white font-extrabold cursor-pointer text-[10px] shrink-0 flex items-center gap-1"
          >
            <Phone className="w-3 h-3 text-emerald-300" />
            <span>+60 3-5510 8899</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVIGATION HEADER                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 h-[60px] bg-[#e0f5f2]/95 backdrop-blur-md border-b border-[#b2f5ea] px-4 lg:px-8 flex items-center justify-between transition-all shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none shrink-0 flex items-center justify-center">
            <img src="./logo_transparent.svg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#0f3c4c] block leading-none">
              MEDICLINIC <span className="text-[#0d9488]">ENTERPRISE</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              {isBM ? 'Pusat Perubatan Pesakit Luar 24/7 Shah Alam' : '24/7 Outpatient Medical Clinic Shah Alam'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700">
          <a href="#services" className="hover:text-[#0d9488] transition-colors">{isBM ? 'Perkhidmatan' : 'Services'}</a>
          <a href="#doctors" className="hover:text-[#0d9488] transition-colors">{isBM ? 'Doktor' : 'Doctors'}</a>
          <a href="#panels" className="hover:text-[#0d9488] transition-colors">{isBM ? 'Panel Insurans' : 'Panel Coverage'}</a>
          <a href="#location" className="hover:text-[#0d9488] transition-colors">{isBM ? 'Lokasi & Arah' : 'Location'}</a>
          <a href="#faq" className="hover:text-[#0d9488] transition-colors">FAQ</a>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => onToggleLanguage(activeLanguage === 'EN' ? 'BM' : 'EN')}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-none border border-[#ccfbf1] bg-[#f7fdfd] hover:bg-[#e6f4f1] text-[#0d9488] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            title="Toggle Bahasa Malaysia / English"
          >
            <Globe className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>{activeLanguage === 'EN' ? 'BM' : 'EN'}</span>
          </button>

          {/* Primary Header CTA */}
          <button
            type="button"
            onClick={() => setIsBookingOpen(true)}
            className="px-4 py-2 text-xs font-black rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
          </button>

          {/* Staff Login Button */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-3 py-2 text-xs font-bold rounded-none bg-[#e0f5f2] hover:bg-[#d5f0eb] text-[#0f3c4c] border border-[#b2f5ea] flex items-center gap-1 transition-all cursor-pointer"
            title="Portal Staff Login"
          >
            <LogIn className="w-3.5 h-3.5 text-[#0d9488]" />
            <span className="hidden sm:inline">{isBM ? 'Staf' : 'Staff'}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-none bg-[#f7fdfd] border border-[#ccfbf1] text-slate-700 hover:text-[#0f3c4c] cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-[#f0fdfa] border-b border-[#ccfbf1] p-6 space-y-4 shadow-xl animate-fadeIn">
          <nav className="flex flex-col space-y-3 font-semibold text-sm text-slate-700">
            <a 
              href="#services" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-[#f7fdfd] hover:text-[#0d9488] flex items-center justify-between"
            >
              <span>{isBM ? 'Perkhidmatan Perubatan' : 'Medical Services'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#doctors" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-[#f7fdfd] hover:text-[#0d9488] flex items-center justify-between"
            >
              <span>{isBM ? 'Doktor & Pakar' : 'Resident Doctors'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#panels" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-[#f7fdfd] hover:text-[#0d9488] flex items-center justify-between"
            >
              <span>{isBM ? 'Panel Insurans Korporat' : 'Corporate Insurance Panels'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#location" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-[#f7fdfd] hover:text-[#0d9488] flex items-center justify-between"
            >
              <span>{isBM ? 'Lokasi & Peta' : 'Location & Directions'}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#faq" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-[#f7fdfd] hover:text-[#0d9488] flex items-center justify-between"
            >
              <span>FAQ</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </nav>
          
          <div className="pt-4 border-t border-[#ccfbf1] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); setIsBookingOpen(true); }}
              className="w-full py-3 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <Calendar className="w-4 h-4" />
              <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-14 px-4 lg:px-8 bg-[#f7fdfd] overflow-hidden border-b border-[#ccfbf1]">
        
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-[url('/hero_banner.jpg')] bg-cover bg-center opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f7fdfd]/90 via-[#f7fdfd]/70 to-[#f7fdfd] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 space-y-7">
          
          {/* Centered Hero Content Header */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            
            <div className="inline-flex items-center gap-2 bg-[#e6f4f1] border border-[#ccfbf1] px-3.5 py-1 rounded-full text-xs font-bold text-[#0d9488]">
              <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
              <span>{isBM ? 'Klinik Outpatient & Kecemasan 24 Jam Shah Alam' : 'Shah Alam 24/7 Outpatient & Urgent Care Clinic'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0f3c4c] tracking-tight leading-[1.12]">
              {isBM ? (
                <>Jumpa doktor hari ini—<span className="text-[#0d9488]">24 jam sehari.</span></>
              ) : (
                <>See a doctor today—<span className="text-[#0d9488]">24 hours a day.</span></>
              )}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
              {isBM 
                ? 'Jumpa terus (walk in), tempah awal, atau semak perlindungan perubatan korporat anda dalam beberapa minit.'
                : 'Walk in, book ahead, or check your corporate medical coverage in minutes.'
              }
            </p>

            {/* Standardized Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white font-black text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <a
                href="#live-queue"
                className="w-full sm:w-auto px-7 py-4 rounded-none bg-[#f7fdfd] hover:bg-[#e0f5f2] text-[#0f3c4c] border border-[#ccfbf1] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Clock className="w-4 h-4 text-[#0d9488]" />
                <span>{isBM ? 'Semak Masa Menunggu' : 'Check live wait time'}</span>
              </a>
            </div>

            {/* Compact Status Strip */}
            <div className="pt-3 max-w-3xl mx-auto">
              <div className="bg-[#e0f5f2]/90 border border-[#b2f5ea] rounded-none p-3 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-700 font-bold shadow-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{isBM ? 'Buka 24/7 (Hari Ini)' : 'Open 24/7'}</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                  <span>{isBM ? 'Anggaran Masa Menunggu:' : 'Current estimated wait:'} <strong className="font-mono text-[#0d9488]">11 min</strong></span>
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBM ? '150+ Panel Korporat Cashless' : 'Cashless corporate panels available'}</span>
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. QUICK-TASK CARDS SECTION                                               */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 lg:px-8 bg-[#f0fdfa] border-b border-[#ccfbf1]">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-[#0d9488]">
              {isBM ? 'Bantuan Pantas Pesakit' : 'How Can We Help You Today?'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f3c4c]">
              {isBM ? 'Pilih Perkhidmatan Kesihatan Anda' : 'Select Your Quick Service Task'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Task Card 1 */}
            <div className="bg-[#f7fdfd] border border-[#ccfbf1] p-5 rounded-none shadow-xs hover:border-[#0d9488] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-[#e6f4f1] text-[#0d9488] flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-[#0f3c4c] group-hover:text-[#0d9488] transition-colors">
                  {isBM ? 'Jumpa Doktor Outpatient' : 'See a doctor'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Walk-in terus 24 jam atau tempah masa konsultasi awal.' : 'Walk in anytime 24/7 or schedule your consultation time.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-2 px-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Card 2 */}
            <div className="bg-[#f7fdfd] border border-[#ccfbf1] p-5 rounded-none shadow-xs hover:border-[#0d9488] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-[#0f3c4c] group-hover:text-emerald-700 transition-colors">
                  {isBM ? 'Semak Insurans / Panel' : 'Check panel coverage'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Sahkan kelayakan kad panel korporat tanpa tunai anda.' : 'Verify your cashless corporate panel card &amp; e-GL eligibility.'}
                </p>
              </div>
              <a
                href="#panels"
                className="w-full py-2 px-3 bg-[#e0f5f2] hover:bg-[#d5f0eb] text-[#0d9488] border border-[#b2f5ea] font-extrabold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{isBM ? 'Semak Panel' : 'Check panel coverage'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Task Card 3 */}
            <div className="bg-[#f7fdfd] border border-[#ccfbf1] p-5 rounded-none shadow-xs hover:border-[#0284c7] hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-[#0f3c4c] group-hover:text-[#0284c7] transition-colors">
                  {isBM ? 'Pediatrik & Imunisasi' : 'Child vaccination'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Pemeriksaan bayi & suntikan imunisasi KKM berjadual.' : 'Gentle pediatric care &amp; KKM scheduled child vaccinations.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openDoctorBooking('Dr. Michael Wong')}
                className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{isBM ? 'Pediatrik' : 'Book paediatrics'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Card 4 */}
            <div className="bg-[#f7fdfd] border border-[#ccfbf1] p-5 rounded-none shadow-xs hover:border-rose-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-none bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-[#0f3c4c] group-hover:text-rose-600 transition-colors">
                  {isBM ? 'Kecemasan Ringan 24/7' : 'Urgent minor injuries'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isBM ? 'Jahitan luka, rawatan lecuran & nebulizer asma serta-merta.' : '24/7 acute wound suturing, dressings &amp; asthma nebulization.'}
                </p>
              </div>
              <a
                href="tel:+60355108899"
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-none flex items-center justify-center gap-1 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isBM ? 'Panggil Kecemasan' : 'Call emergency'}</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. WHY PATIENTS CHOOSE US (4 CORE BENEFITS)                               */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 lg:px-8 bg-[#f7fdfd]">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0d9488]">
              {isBM ? 'Kelebihan Utama' : 'Why Patients Choose Us'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0f3c4c]">
              {isBM ? 'Penjagaan Kesihatan Berfokuskan Pesakit' : 'Patient-Centered Healthcare Experience'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              {isBM ? 'Empat keutamaan kami untuk memastikan rawatan anda mudah, pantas dan tenang.' : 'Four key benefits designed to make your medical visit swift, stress-free, and accessible.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-[#0d9488] text-white rounded-none flex items-center justify-center font-extrabold text-sm">
                1
              </div>
              <h3 className="text-base font-black text-[#0f3c4c]">
                {isBM ? 'Pendaftaran MyKad Pantas' : 'Fast MyKad check-in'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Imbasan cip MyKad dalam 5 saat tanpa sebarang borang manual yang leceh.' 
                  : 'Instant 5-second chip scan populates your details without tedious paper forms.'
                }
              </p>
            </div>

            <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-[#0d9488] text-white rounded-none flex items-center justify-center font-extrabold text-sm">
                2
              </div>
              <h3 className="text-base font-black text-[#0f3c4c]">
                {isBM ? 'Farmasi Setempat' : 'On-site pharmacy'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Pengambilan ubat berdaftar KKM yang disahkan kod bar secara terus di klinik.' 
                  : 'KKM-registered medication dispensed right after your doctor consultation.'
                }
              </p>
            </div>

            <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-[#0d9488] text-white rounded-none flex items-center justify-center font-extrabold text-sm">
                3
              </div>
              <h3 className="text-base font-black text-[#0f3c4c]">
                {isBM ? 'Panel Insurans Tanpa Tunai' : 'Cashless panel billing'}
              </h3>
              <p className="text-xs text-slate-[#0f3c4c] text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Tuntutan e-GL terus dengan PMCare, MiCare, HealthMetrics dan 150+ panel.' 
                  : 'Direct e-GL authorization with PMCare, MiCare, Petronas, and 150+ panels.'
                }
              </p>
            </div>

            <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-6 rounded-none space-y-3 shadow-2xs">
              <div className="w-10 h-10 bg-[#0d9488] text-white rounded-none flex items-center justify-center font-extrabold text-sm">
                4
              </div>
              <h3 className="text-base font-black text-[#0f3c4c]">
                {isBM ? 'Akses Perubatan 24/7' : '24/7 access'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBM 
                  ? 'Pintu klinik sentiasa terbuka 24 jam sehari untuk sebarang kecemasan ringan.' 
                  : 'Always open 24 hours a day, 7 days a week for general &amp; urgent medical needs.'
                }
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MEDICAL SERVICES BENTO GRID                                            */}
      {/* ========================================================================= */}
      <section id="services" className="py-20 px-4 lg:px-8 bg-[#f0fdfa] border-t border-[#ccfbf1]">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#0d9488] bg-[#e6f4f1] px-3.5 py-1 rounded-full border border-[#ccfbf1]">
                <Activity className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>{isBM ? 'Perkhidmatan Perubatan Outpatient' : 'Comprehensive Outpatient Services'}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0f3c4c] tracking-tight">
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
            <div className="lg:col-span-7 bg-[#f7fdfd] border border-[#b2f5ea] rounded-none p-7 shadow-xs space-y-6 relative overflow-hidden group hover:border-[#0d9488] transition-all">
              <div className="h-1 bg-[#0d9488] absolute top-0 left-0 right-0" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-none bg-[#0d9488] text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0d9488] block">
                      {isBM ? 'Suite Konsultasi Utama' : 'Primary Consultation Suite'}
                    </span>
                    <h3 className="text-xl font-black text-[#0f3c4c] group-hover:text-[#0d9488] transition-colors">
                      {isBM ? 'Konsultasi Rawatan Am & Kecemasan Ringan' : 'Doctor consultations and urgent care, open 24/7'}
                    </h3>
                  </div>
                </div>

                <span className="hidden sm:inline-flex text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none border border-emerald-200">
                  🟢 Suite 101 Active
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-normal relative z-10">
                {isBM 
                  ? 'Konsultasi diagnostik menyeluruh, pengurusan demam & penyakit akut, pemeriksaan tekanan darah/gula, serta prosedur surgeri kecil oleh doktor bertauliah MMC.'
                  : 'Comprehensive diagnostic consultations, acute illness management, chronic condition monitoring, and minor surgical procedures by senior MMC-registered physicians.'
                }
              </p>

              {/* Key Clinical Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10 text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2 bg-[#f0fdfa] p-2.5 rounded-none border border-[#ccfbf1]">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0" />
                  <span>{isBM ? 'Demam Akut & Selsema Viral' : 'Acute Fever & Viral Flu'}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#f0fdfa] p-2.5 rounded-none border border-[#ccfbf1]">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0" />
                  <span>{isBM ? 'Kawalan Darah Tinggi & Kencing Manis' : 'Hypertension & Diabetes Care'}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#f0fdfa] p-2.5 rounded-none border border-[#ccfbf1]">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0" />
                  <span>{isBM ? 'Jahitan Luka & Cuci Luka 24/7' : '24/7 Wound Suturing & Dressing'}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#f0fdfa] p-2.5 rounded-none border border-[#ccfbf1]">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0" />
                  <span>{isBM ? 'Rawatan Nebulizer Asma' : 'Asthma Nebulizer Treatment'}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#b2f5ea] relative z-10">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="px-5 py-2.5 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
                </button>
              </div>

            </div>

            {/* CARD 2: PHARMACY (Spans 5 Cols) */}
            <div className="lg:col-span-5 bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-[#0d9488] hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-[#0d9488] absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <Pill className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-none border border-emerald-200">
                    KKM Approved
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#0f3c4c] group-hover:text-emerald-700 transition-colors">
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
            <div className="lg:col-span-4 bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-[#0284c7] hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-[#0284c7] absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284c7] shadow-2xs group-hover:scale-105 transition-transform">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-none border border-sky-200">
                    Child Friendly
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#0f3c4c] group-hover:text-[#0284c7] transition-colors">
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
            <div className="lg:col-span-4 bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-indigo-600 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-indigo-600 absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-none border border-indigo-200">
                    150+ Panels
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#0f3c4c] group-hover:text-indigo-700 transition-colors">
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
            <div className="lg:col-span-4 bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-6 shadow-xs flex flex-col justify-between hover:border-[#0d9488] hover:shadow-md transition-all group relative overflow-hidden">
              <div className="h-1 bg-[#0d9488] absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-none bg-[#e6f4f1] border border-[#ccfbf1] flex items-center justify-center text-[#0d9488] shadow-2xs group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-none border border-teal-200">
                    Full Profiling
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[#0f3c4c] text-base font-black group-hover:text-[#0d9488] transition-colors">
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-none bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-none border border-rose-200">
                      24/7 Urgent Care
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#0f3c4c]">
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

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                <a
                  href="tel:+60355108899"
                  className="w-full md:w-auto px-6 py-3 rounded-none bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>+60 3-5510 8899</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ON-DUTY RESIDENT DOCTORS                                               */}
      {/* ========================================================================= */}
      <section id="doctors" className="py-20 px-4 lg:px-8 bg-[#f7fdfd] border-t border-[#ccfbf1]">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-[#0d9488]">
                {isBM ? 'Staf Perubatan Bertauliah' : 'Resident Physicians'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f3c4c]">
                {isBM ? 'Doktor Perubatan & Pakar Resident' : 'Resident Medical Doctors & Specialists'}
              </h2>
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-2 text-xs font-bold bg-[#f0fdfa] p-1.5 rounded-none border border-[#ccfbf1]">
              {['All', 'General Medicine', 'Pediatrics', 'Pharmacy'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDoctorSpecialty(dept)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    doctorSpecialty === dept 
                      ? 'bg-[#0d9488] text-white shadow-2xs' 
                      : 'text-slate-700 hover:text-[#0f3c4c]'
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
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-none flex items-center gap-1 border bg-emerald-100 text-emerald-800 border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {doc.availabilityState}
                  </span>
                </div>

                <div className={`w-20 h-20 rounded-none ${doc.bgColor} mx-auto flex items-center justify-center text-white text-2xl font-black shadow-md group-hover:scale-105 transition-transform border border-teal-600`}>
                  {doc.id}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{doc.rating} ({doc.experience})</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#0f3c4c]">{doc.name}</h3>
                  <span className="text-xs text-[#0d9488] font-semibold block">{doc.title}</span>
                  <span className="text-[11px] text-slate-500 block pt-0.5">{doc.role}</span>
                  <span className="text-[10px] text-slate-400 block">Languages: {doc.languages}</span>
                </div>
                
                {/* Live Slot Status Box */}
                <div className="p-3 bg-[#e0f5f2] border border-[#b2f5ea] rounded-none flex items-center justify-between text-[11px] font-bold text-slate-700 shadow-2xs">
                  <span className="flex items-center gap-1.5 text-[#0f3c4c]">
                    <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                    <span>{doc.nextSlot}</span>
                  </span>
                  <span className="font-mono text-[#0d9488] bg-white px-2 py-0.5 border border-[#ccfbf1] text-[10px]">
                    {doc.queueCount} {isBM ? 'Menunggu' : 'Queued'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openDoctorBooking(doc.name)}
                  className="w-full py-2.5 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
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
      <section id="panels" className="py-16 px-4 lg:px-8 bg-[#f0fdfa] border-t border-[#ccfbf1]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Panel Search & Eligibility Checker */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-xs font-black uppercase tracking-widest text-[#0d9488]">
                      {isBM ? 'Perlindungan Insurans Korporat' : 'Cashless Corporate Panel Coverage'}
                    </span>
                    <h3 className="text-xl font-extrabold text-[#0f3c4c]">
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
                      className="w-full pl-9.5 pr-3.5 py-2.5 rounded-none bg-[#f7fdfd] border border-[#ccfbf1] text-xs text-[#0f3c4c] placeholder-slate-400 focus:outline-none focus:border-[#0d9488]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-bold">
                  {filteredPanels.map((panel, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => setSelectedPanelCheck(panel)}
                      className={`px-3 py-1.5 rounded-none border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                        selectedPanelCheck === panel 
                          ? 'bg-[#0d9488] text-white border-[#0d9488]' 
                          : 'bg-[#f7fdfd] border-[#ccfbf1] text-slate-700 hover:border-[#0d9488] hover:text-[#0d9488]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{panel}</span>
                    </button>
                  ))}
                  {filteredPanels.length === 0 && (
                    <div className="text-slate-500 text-xs py-2">No matching corporate panel found.</div>
                  )}
                </div>
              </div>

              {/* Panel Checker Box */}
              <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#ccfbf1] pb-3">
                  <span className="text-xs font-black text-[#0f3c4c] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0d9488]" /> {isBM ? 'Semakan Panel' : 'Panel Eligibility Check'}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    DEMO CHECKER
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      {isBM ? 'Pilih Panel TPA' : 'Selected TPA Panel'}
                    </label>
                    <select
                      value={selectedPanelCheck}
                      onChange={e => setSelectedPanelCheck(e.target.value)}
                      className="w-full p-2.5 rounded-none bg-[#e0f5f2] border border-[#b2f5ea] text-xs font-bold text-[#0f3c4c] focus:outline-none"
                    >
                      {tpaPanels.map((p, i) => (
                        <option key={i} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      {isBM ? 'No. Staff / Kad Pengenalan' : 'Staff / IC Reference ID'}
                    </label>
                    <input
                      type="text"
                      value={panelEmpId}
                      onChange={e => setPanelEmpId(e.target.value)}
                      placeholder="Enter Staff ID..."
                      className="w-full p-2.5 rounded-none bg-[#f0fdfa] border border-[#ccfbf1] text-xs font-mono font-bold text-[#0f3c4c] focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-[#e0f5f2] border border-[#b2f5ea] rounded-none space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Consultation Coverage:</span>
                      <span className="font-bold text-emerald-700">100% Cashless</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Medication Allowance:</span>
                      <span className="font-bold text-[#0d9488]">RM 250 / Visit</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(true)}
                    className="w-full py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs rounded-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
            <div className="bg-[#f7fdfd] border border-[#ccfbf1] p-6 rounded-none space-y-4">
              <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0d9488]" />
                <span>{isBM ? 'Dokumen Perlu Dibawa' : 'What to Bring for Your Visit'}</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  <span><strong>MyKad / MyKid / Passport:</strong> Required for identity verification and fast check-in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  <span><strong>Corporate Panel Card / e-GL:</strong> Digital Guarantee Letter via TPA app or physical panel card.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  <span><strong>Current Medications / Prescriptions:</strong> Helps doctor cross-check drug interactions.</span>
                </li>
              </ul>
            </div>

            {/* Travel Context & Parking */}
            <div className="bg-[#f7fdfd] border border-[#ccfbf1] p-6 rounded-none space-y-4" id="location">
              <h3 className="text-base font-black text-[#0f3c4c] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0d9488]" />
                <span>{isBM ? 'Lokasi & Kemudahan Parkir' : 'Location & Transport Access'}</span>
              </h3>
              <div className="space-y-2.5 text-xs text-slate-700">
                <p>
                  <strong>Address:</strong> Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor.
                </p>
                <div className="flex items-start gap-2">
                  <Car className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  <span><strong>Parking:</strong> Underground visitor parking at Bays A &amp; B (First 1 hr free for patients).</span>
                </div>
                <div className="flex items-start gap-2">
                  <Bus className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  <span><strong>Public Transit:</strong> 5 mins taxi from LRT Glenmarie / KTM Shah Alam station.</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 font-semibold">
                  📍 Serving patients across Shah Alam, Subang Jaya, Puchong, Klang, and surrounding Klang Valley areas.
                </p>
              </div>
            </div>

          </div>

          {/* Emergency Safety Warning Callout */}
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-none flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-black block text-amber-950 uppercase text-[11px] tracking-wide">
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
      <section id="faq" className="py-20 px-4 lg:px-8 bg-[#f7fdfd] border-t border-[#ccfbf1]">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Patient Reviews */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#0d9488]">
                {isBM ? 'Maklum Balas Pesakit' : 'Patient Reviews'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f3c4c]">
                {isBM ? 'Apa Kata Pesakit Kami' : 'What Our Patients Say'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div key={idx} className="ice-mint-card p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      &ldquo;{t.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#ccfbf1] flex items-center justify-between text-[11px]">
                    <div>
                      <div className="font-extrabold text-[#0f3c4c]">{t.name}</div>
                      <div className="text-[10px] text-[#0d9488]">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-6 pt-6 border-t border-[#ccfbf1]">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#0f3c4c]">
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
                      className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <span className="text-xs font-extrabold text-[#0f3c4c] flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#0d9488] shrink-0" />
                        {faq.q}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#0d9488]' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-[#ccfbf1] pt-3 animate-fadeIn">
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
            <span className="text-base font-black text-white block tracking-tight">MEDICLINIC ENTERPRISE</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Shah Alam&apos;s premier 24/7 outpatient medical facility equipped with biometric MyKad scanner, EMR integration, and corporate panel coverage.
            </p>
            <span className="text-[10px] text-slate-500 font-mono block">KKM Reg #KKM-2026-SL-8902</span>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Contact &amp; Emergency</h4>
            <div className="space-y-2 pt-1">
              <a href="tel:+60355108899" className="block flex items-center gap-2 hover:text-white"><Phone className="w-3.5 h-3.5 text-teal-400" /> +60 3-5510 8899</a>
              <span className="block flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-teal-400" /> emergency@mediclinic.my</span>
              <span className="block flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-teal-400" /> 24 Hours / 7 Days Open</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Location Address</h4>
            <div className="space-y-1 leading-relaxed pt-1">
              <span className="block flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Portals &amp; Access</h4>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full py-2.5 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Portal Access</span>
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <span>&copy; 2026 MediClinic Enterprise. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#services" className="hover:text-white">Privacy Policy</a>
            <a href="#services" className="hover:text-white">Terms of Service</a>
            <a href="#services" className="hover:text-white">PDPA Compliance</a>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
        <button
          type="button"
          onClick={() => setIsBookingOpen(true)}
          className="px-4 py-3 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black shadow-2xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer ring-2 ring-white/80"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">{isBM ? 'Tempah Janji Temu' : 'Book appointment'}</span>
        </button>

        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-10 h-10 rounded-none bg-[#f7fdfd] border border-[#ccfbf1] text-slate-700 hover:text-[#0d9488] hover:border-[#0d9488] shadow-md flex items-center justify-center transition-all cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 10. APPOINTMENT BOOKING MODAL                                              */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-[#0f3c4c]">
            
            <div className="flex items-center justify-between border-b border-[#ccfbf1] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-[#e6f4f1] border border-[#ccfbf1] flex items-center justify-center text-[#0d9488]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0f3c4c]">
                    {isBM ? 'Tempah Janji Temu Doktor' : 'Book Doctor Appointment'}
                  </h3>
                  {selectedDoctor && (
                    <span className="text-[11px] text-[#0d9488] font-semibold block">
                      Preferred: {selectedDoctor}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="w-8 h-8 rounded-none bg-[#e6f4f1] text-slate-500 hover:text-[#0f3c4c] flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingSubmitted ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-none bg-emerald-100 border border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-[#0f3c4c]">{isBM ? 'Janji Temu Disahkan!' : 'Appointment Reserved!'}</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  {isBM ? 'Terima kasih,' : 'Thank you,'} <strong className="text-[#0d9488]">{bookingForm.fullName}</strong>. {isBM ? 'Rujukan giliran anda ialah' : 'Your queue reference is'} <strong className="text-mono font-bold text-amber-600">#APT-8902</strong>.
                </p>
                <div className="p-4 bg-[#f0fdfa] rounded-none border border-[#ccfbf1] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service:</span>
                    <strong className="text-slate-800">{bookingForm.service}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date &amp; Time:</span>
                    <strong className="text-[#0d9488]">{bookingForm.preferredDate || 'Today'} @ {bookingForm.preferredTime}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetBooking}
                  className="px-6 py-2.5 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 rounded-none bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f3c4c] focus:outline-none focus:border-[#0d9488]"
                    placeholder="e.g. Ahmad Firdaus Bin Ismail"
                    value={bookingForm.fullName}
                    onChange={e => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">MyKad IC Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2.5 rounded-none bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f3c4c] font-mono focus:outline-none focus:border-[#0d9488]"
                      placeholder="YYMMDD-XX-XXXX"
                      value={bookingForm.icNumber}
                      onChange={e => setBookingForm({ ...bookingForm, icNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2.5 rounded-none bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f3c4c] focus:outline-none focus:border-[#0d9488]"
                      placeholder="+60 12-345 6789"
                      value={bookingForm.phone}
                      onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Medical Specialty *</label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-none bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f3c4c] focus:outline-none focus:border-[#0d9488]"
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
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      className="w-full px-3.5 py-2.5 rounded-none bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f3c4c] focus:outline-none focus:border-[#0d9488]"
                      value={bookingForm.preferredDate}
                      onChange={e => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Preferred Time</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-none bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f3c4c] focus:outline-none focus:border-[#0d9488]"
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

                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0d9488]" />
                  <span>Protected under Malaysia PDPA Act 2010.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-none bg-[#0d9488] hover:bg-[#0f766e] text-white font-black text-xs shadow-md transition-all cursor-pointer mt-2"
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
