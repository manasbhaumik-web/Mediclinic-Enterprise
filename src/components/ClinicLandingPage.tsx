import React, { useState } from 'react';
import { Language } from '../types';
import { 
  Stethoscope, Pill, ShieldCheck, Activity, Heart, Calendar, Clock, 
  MapPin, Phone, CheckCircle2, Star, ArrowRight, LogIn, BarChart3, 
  Users, Building2, ChevronRight, Menu, X, Search, Check, 
  ShieldAlert, Zap, Globe, Award, HelpCircle, Mail, ChevronDown, MessageSquare, ArrowUp, CreditCard
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

  // Feature Showcase Tab State
  const [activeFeatureTab, setActiveFeatureTab] = useState<'emr' | 'mykad' | 'tpa' | 'dispensary'>('emr');

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
      role: 'Senior General Practitioner & Family Physician',
      specialty: 'General Medicine',
      bgColor: 'bg-[#0D9488]',
      status: 'On Duty - Suite 101',
      availabilityState: 'Available Now',
      nextSlot: 'Next: 10:15 AM',
      queueCount: 2,
      rating: 4.9,
      experience: '12+ Years'
    },
    {
      id: 'AR',
      name: 'Pharm. Ahmad Razak',
      title: 'B.Pharm (UM), Registered Pharmacist',
      role: 'Chief Pharmacist & Clinical Formulator',
      specialty: 'Pharmacy',
      bgColor: 'bg-[#0F766E]',
      status: 'Active - Dispensary',
      availabilityState: 'In Dispensary',
      nextSlot: 'Fulfillment < 4m',
      queueCount: 1,
      rating: 4.95,
      experience: '10+ Years'
    },
    {
      id: 'MW',
      name: 'Dr. Michael Wong',
      title: 'MBBS (Malaya), MMed Pediatrics',
      role: 'Consultant Pediatrician',
      specialty: 'Pediatrics',
      bgColor: 'bg-[#2563EB]',
      status: 'On Duty - Suite 204',
      availabilityState: 'Available Now',
      nextSlot: 'Next: 10:30 AM',
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
      q: 'Do I need an appointment or can I walk in for general consultations?',
      a: 'Walk-ins are welcomed 24 hours a day, 7 days a week. Booking an online reservation reserves your queue token in advance, reducing your waiting room time to an average of 11 minutes.'
    },
    {
      q: 'Which corporate insurance and TPA panels are accepted?',
      a: 'We support cashless billing for major Malaysia TPAs including PMCare, MiCare, HealthMetrics, RedAlert, Petronas, Maybank Staff, Intel, and AIA. You can verify your panel directly at registration using your IC or e-Guarantee Letter.'
    },
    {
      q: 'How does the Biometric MyKad scanner registration work?',
      a: 'During check-in, placing your MyKad on our encrypted smart reader instantly populates your EMR profile, verifying patient identity and retrieving active panel coverage in under 5 seconds.'
    },
    {
      q: 'What minor surgical and emergency procedures are available?',
      a: 'Our 24/7 outpatient emergency suite handles acute laceration suturing, wound dressing, asthma nebulization, abscess drainage, foreign body removal, and tetanus prophylaxis.'
    }
  ];

  const testimonials = [
    {
      name: 'Tengku Amirul Hilmi',
      role: 'Corporate Panel Patient (Petronas)',
      category: 'Corporate Panel',
      comment: 'Super fast registration with MyKad reader. Had my consultation and medicine fulfilled within 15 minutes. Highly efficient clinic!',
      rating: 5,
      date: 'Sept 2026'
    },
    {
      name: 'Dr. Evelyn Tan',
      role: 'Occupational Health Manager',
      category: 'Occupational Health',
      comment: 'Mediclinic Enterprise handles our staff annual health screenings and TPA billing seamlessly. The live operations telemetry is top notch.',
      rating: 5,
      date: 'Aug 2026'
    },
    {
      name: 'Nurul Huda Binti Osman',
      role: 'Mother of 2 (Pediatric Outpatient)',
      category: 'Pediatrics',
      comment: 'Dr. Michael Wong was extremely gentle with my 3-year-old during her vaccination. Very clean, child-friendly facility.',
      rating: 5,
      date: 'Sept 2026'
    }
  ];

  const filteredTestimonials = reviewCategory === 'All'
    ? testimonials
    : testimonials.filter(t => t.category === reviewCategory);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#16302B] font-sans selection:bg-[#0D9488] selection:text-white relative">
      
      {/* ========================================================================= */}
      {/* 0. STICKY TOP REAL-TIME TICKER BANNER (Primary Brand Teal #0F766E)         */}
      {/* ========================================================================= */}
      <div className="bg-[#0F766E] text-teal-50 text-[11px] font-semibold py-1.5 px-4 flex items-center justify-between border-b border-[#0D9488] relative z-50">
        <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06B6D4] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06B6D4]"></span>
            </span>
            <span className="font-extrabold text-white tracking-wide">OPERATIONS TELEMETRY LIVE</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-teal-200" /> Suite 101: <strong className="text-white">Dr. Sarah Tan</strong> (On Duty)</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-200" /> Avg Queue Wait: <strong className="text-white font-mono">11 mins</strong></span>
            <span className="flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-emerald-300" /> Dispensary Stock: <strong className="text-emerald-300">100% Ready</strong></span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-teal-200" /> TPA Claim Gateway: <strong className="text-teal-200">Online 99.9%</strong></span>
          </div>
          <button 
            type="button" 
            onClick={onOpenTelemetry} 
            className="underline text-teal-200 hover:text-white font-bold cursor-pointer text-[10px] shrink-0 flex items-center gap-1"
          >
            <span>Live Telemetry</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STICKY TOP NAVIGATION HEADER                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#D1E7E2] px-4 lg:px-8 py-3 flex items-center justify-between transition-all shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none shrink-0 flex items-center justify-center">
            <img src="./logo_transparent.svg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#16302B] block leading-none">
              MEDICLINIC <span className="text-[#0F766E]">ENTERPRISE</span>
            </span>
            <span className="text-[10px] text-[#46605B] font-medium tracking-wide">
              24/7 Smart Medical Suite &amp; Outpatient Center
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#46605B]">
          <a href="#services" className="hover:text-[#0F766E] transition-colors">Medical Care</a>
          <a href="#features" className="hover:text-[#0F766E] transition-colors">Smart Features</a>
          <a href="#doctors" className="hover:text-[#0F766E] transition-colors">Physicians</a>
          <a href="#panels" className="hover:text-[#0F766E] transition-colors">Panels</a>
          <a href="#faq" className="hover:text-[#0F766E] transition-colors">FAQ</a>
          <button 
            type="button"
            onClick={onOpenTelemetry} 
            className="hover:bg-[#E6FFFA] transition-colors flex items-center gap-1.5 text-[#0F766E] cursor-pointer bg-[#EFFCF9] px-3 py-1 rounded-none border border-[#99F6E4] font-bold text-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Live Telemetry</span>
          </button>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => onToggleLanguage(activeLanguage === 'EN' ? 'BM' : 'EN')}
            className="px-2.5 py-1.5 text-[11px] font-bold rounded-none border border-[#D1E7E2] bg-[#EFFCF9] hover:bg-[#E6FFFA] text-[#0F766E] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>{activeLanguage === 'EN' ? 'BM' : 'EN'}</span>
          </button>

          {/* Staff Login Button (Primary Action Teal #0D9488) */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-4.5 py-2 text-xs font-extrabold rounded-none bg-[#0D9488] hover:bg-[#115E59] text-white shadow-md shadow-teal-700/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-none bg-white border border-[#D1E7E2] text-[#16302B] hover:text-[#0F766E] cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] z-40 bg-[#E6FFFA] border-b border-[#99F6E4] p-6 space-y-4 shadow-xl animate-fadeIn">
          <nav className="flex flex-col space-y-3 font-semibold text-sm text-[#16302B]">
            <a 
              href="#services" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-white hover:text-[#0F766E] flex items-center justify-between"
            >
              <span>Medical Care Services</span>
              <ChevronRight className="w-4 h-4 text-[#46605B]" />
            </a>
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-white hover:text-[#0F766E] flex items-center justify-between"
            >
              <span>Smart Features Showcase</span>
              <ChevronRight className="w-4 h-4 text-[#46605B]" />
            </a>
            <a 
              href="#doctors" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-white hover:text-[#0F766E] flex items-center justify-between"
            >
              <span>Resident Physicians</span>
              <ChevronRight className="w-4 h-4 text-[#46605B]" />
            </a>
            <a 
              href="#panels" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-white hover:text-[#0F766E] flex items-center justify-between"
            >
              <span>Corporate Insurance Panels</span>
              <ChevronRight className="w-4 h-4 text-[#46605B]" />
            </a>
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); onOpenTelemetry(); }}
              className="w-full text-left px-3 py-2 rounded-none hover:bg-white text-[#0D9488] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Operations Telemetry
              </span>
              <ChevronRight className="w-4 h-4 text-[#0D9488]" />
            </button>
            <a 
              href="#faq" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="px-3 py-2 rounded-none hover:bg-white hover:text-[#0F766E] flex items-center justify-between"
            >
              <span>FAQ &amp; Patient Help</span>
              <ChevronRight className="w-4 h-4 text-[#46605B]" />
            </a>
          </nav>
          
          <div className="pt-4 border-t border-[#99F6E4] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); setIsBookingOpen(true); }}
              className="w-full py-3 rounded-none bg-[#0D9488] hover:bg-[#115E59] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment Online</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-10 pb-14 px-4 lg:px-8 bg-[#F8FAFC] overflow-hidden">
        
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-[url('/hero_banner.jpg')] bg-cover bg-center opacity-40 pointer-events-none" />
        
        {/* Soft Teal Tint Overlay */}
        <div className="absolute inset-0 bg-[#F8FAFC]/60 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-7">
          
          {/* Centered Hero Content Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            
            {/* Hero Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#E6FFFA] border border-[#99F6E4] rounded-full text-[#0F766E] text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></span>
              <span>24/7 Outpatient Telemetry &amp; EMR Integrated Center</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#16302B] tracking-tight leading-[1.12]">
              Authoritative <span className="text-[#0F766E]">Outpatient Care</span> &amp; 24/7 Smart Health
            </h1>

            <p className="text-[#46605B] text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-normal">
              Experience seamless outpatient care backed by integrated EMR telemetry, instant panel claim verification, biometric MyKad registration, and zero-wait queue tracking.
            </p>

            {/* Primary Action Buttons (Teal CTA + Secondary Blue Info + Emergency Red) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              
              {/* Primary Action Button (#0D9488 -> Hover #115E59) */}
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-none bg-[#0D9488] hover:bg-[#115E59] text-white font-black text-xs shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment Online</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Secondary Outlined Button (#EFFCF9 -> Text #0F766E) */}
              <a
                href="#services"
                className="w-full sm:w-auto px-6 py-3.5 rounded-none bg-[#EFFCF9] hover:bg-[#E6FFFA] text-[#0F766E] border border-[#99F6E4] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Stethoscope className="w-4 h-4 text-[#0F766E]" />
                <span>View Medical Services</span>
              </a>

              {/* Contrasting Information Blue Button (#2563EB) */}
              <button
                type="button"
                onClick={onOpenTelemetry}
                className="w-full sm:w-auto px-6 py-3.5 rounded-none bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Live Telemetry</span>
              </button>

              {/* Emergency Button (#B91C1C) */}
              <a
                href="tel:+60355108899"
                className="w-full sm:w-auto px-5 py-3.5 rounded-none bg-[#B91C1C] hover:bg-[#991B1B] text-white font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Emergency</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 max-w-4xl mx-auto">
              <div className="bg-[#E6FFFA] border border-[#99F6E4] rounded-none p-2.5 text-center shadow-2xs transition-colors hover:bg-[#d5f5ee]">
                <span className="block text-xl font-black font-mono text-[#0F766E]">24/7</span>
                <span className="text-[10px] text-[#46605B] font-bold uppercase tracking-wider">Emergency Suite</span>
              </div>
              <div className="bg-[#E6FFFA] border border-[#99F6E4] rounded-none p-2.5 text-center shadow-2xs transition-colors hover:bg-[#d5f5ee]">
                <span className="block text-xl font-black font-mono text-[#2563EB]">11m</span>
                <span className="text-[10px] text-[#46605B] font-bold uppercase tracking-wider">Avg Wait Time</span>
              </div>
              <div className="bg-[#E6FFFA] border border-[#99F6E4] rounded-none p-2.5 text-center shadow-2xs transition-colors hover:bg-[#d5f5ee]">
                <span className="block text-xl font-black font-mono text-[#15803D]">150+</span>
                <span className="text-[10px] text-[#46605B] font-bold uppercase tracking-wider">Corporate Panels</span>
              </div>
              <div className="bg-[#E6FFFA] border border-[#99F6E4] rounded-none p-2.5 text-center shadow-2xs transition-colors hover:bg-[#d5f5ee]">
                <span className="block text-xl font-black font-mono text-[#B45309]">99.4%</span>
                <span className="text-[10px] text-[#46605B] font-bold uppercase tracking-wider">Patient Rating</span>
              </div>
            </div>

          </div>

          {/* Docked Floating Soft Teal Telemetry Bar */}
          <div className="bg-[#E6FFFA] p-3.5 shadow-md border border-[#99F6E4] transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              
              <div className="flex items-center gap-2.5 p-2.5 rounded-none bg-white border border-[#D1E7E2]">
                <div className="w-9 h-9 rounded-none bg-[#EFFCF9] flex items-center justify-center text-[#0F766E] border border-[#99F6E4] shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-[#16302B]">Attending Physician</h4>
                  <span className="text-[10px] text-[#0D9488] font-semibold block">Dr. Sarah Tan (Suite 101)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-none bg-white border border-[#D1E7E2]">
                <div className="w-9 h-9 rounded-none bg-[#DCFCE7] flex items-center justify-center text-[#15803D] border border-green-300 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-[#16302B]">Waiting Room Queue</h4>
                  <span className="text-[10px] text-[#15803D] font-mono font-bold block">{doctorQueueLength} Patients Queued</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-none bg-white border border-[#D1E7E2]">
                <div className="w-9 h-9 rounded-none bg-[#EFFCF9] flex items-center justify-center text-[#0D9488] border border-[#99F6E4] shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-[#16302B]">Dispensary Stock</h4>
                  <span className="text-[10px] text-[#0D9488] font-bold block">On-Site Stock Ready</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full h-full py-3 px-3.5 rounded-none bg-[#0D9488] hover:bg-[#115E59] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>Reserve Queue Token</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE FEATURE SHOWCASE TAB WIDGET                                 */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 px-4 lg:px-8 bg-white border-t border-[#D1E7E2]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-[#16302B]">Enterprise Medical System Showcase</h2>
            <p className="text-[#46605B] text-xs sm:text-sm">
              Explore how integrated EMR, biometric identity, automated panel billing, and pharmacy compounding streamline outpatient operations.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-[#F8FAFC] border border-[#D1E7E2] p-1.5 max-w-3xl mx-auto flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFeatureTab('emr')}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs cursor-pointer transition-all ${
                activeFeatureTab === 'emr'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#46605B] hover:text-[#0F766E] border border-[#D1E7E2]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Real-Time EMR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFeatureTab('mykad')}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs cursor-pointer transition-all ${
                activeFeatureTab === 'mykad'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#46605B] hover:text-[#0F766E] border border-[#D1E7E2]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Biometric MyKad</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFeatureTab('tpa')}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs cursor-pointer transition-all ${
                activeFeatureTab === 'tpa'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#46605B] hover:text-[#0F766E] border border-[#D1E7E2]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Cashless TPA</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFeatureTab('dispensary')}
              className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs cursor-pointer transition-all ${
                activeFeatureTab === 'dispensary'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#46605B] hover:text-[#0F766E] border border-[#D1E7E2]'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Compounding Pharmacy</span>
            </button>
          </div>

          {/* Active Tab Showcase Content */}
          <div className="bg-[#E6FFFA] border border-[#99F6E4] p-8 shadow-xs">
            {activeFeatureTab === 'emr' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fadeIn">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[#0F766E] text-xs font-bold uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-[#06B6D4]" /> Real-Time Telemetry Feed
                  </div>
                  <h3 className="text-2xl font-black text-[#16302B]">Live Clinical EMR &amp; Queue Analytics</h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Instantly monitor patient flow velocity, consultation room status, vital signs telemetry, and ICD-10 diagnostic trends with zero delay.
                  </p>
                  <ul className="space-y-2 text-xs text-[#16302B] font-medium">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Automated triage priority calculation</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Real-time Doctor queue sync</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> ICD-10 diagnostic code lookup</li>
                  </ul>
                  <button
                    type="button"
                    onClick={onOpenTelemetry}
                    className="px-6 py-3 rounded-none bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Inspect Public Telemetry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white border border-[#D1E7E2] p-6 shadow-md space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#D1E7E2] pb-3 font-sans">
                    <span className="font-black text-[#16302B] text-xs">EMR Telemetry Live Widget</span>
                    <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] border border-green-300 px-2 py-0.5 font-bold">ONLINE</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between items-center">
                    <span>Patient Token:</span>
                    <span className="font-bold text-[#0F766E]">#APT-8902</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between items-center">
                    <span>Consultation Suite:</span>
                    <span className="font-bold text-[#16302B]">Suite 101 (Dr. Tan)</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between items-center">
                    <span>Estimated Waiting:</span>
                    <span className="font-bold text-[#2563EB]">8 Minutes</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'mykad' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fadeIn">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[#0F766E] text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488]" /> Biometric Authentication
                  </div>
                  <h3 className="text-2xl font-black text-[#16302B]">Encrypted MyKad Scanner Verification</h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Eliminate manual entry errors. Placed on our biometric reader, the MyKad chip populates official name, IC number, address, and panel eligibility automatically.
                  </p>
                  <ul className="space-y-2 text-xs text-[#16302B] font-medium">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> 5-second instant biometric scan</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> PDPA 2010 compliant encryption</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Direct MyKad IC validation</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(true)}
                    className="px-6 py-3 rounded-none bg-[#0D9488] hover:bg-[#115E59] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Try Registration Demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white border border-[#D1E7E2] p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D1E7E2] pb-3">
                    <span className="font-black text-[#16302B] text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0D9488]" /> Biometric MyKad Pass
                    </span>
                    <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] border border-green-300 px-2 py-0.5 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
                      VERIFIED CHIP SCAN
                    </span>
                  </div>
                  
                  {/* Digital MyKad Pass Simulation */}
                  <div className="p-4 bg-[#E6FFFA] border border-[#99F6E4] space-y-3 relative overflow-hidden shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-6 bg-amber-300 rounded border border-amber-500/50 relative overflow-hidden flex items-center justify-center">
                          <div className="w-full h-[1px] bg-amber-600/40 my-0.5"></div>
                        </div>
                        <span className="text-[10px] font-mono font-black text-[#16302B] tracking-wider">MYKAD READ-ONLY</span>
                      </div>
                      <span className="text-[9px] font-bold text-[#0F766E] bg-white px-2 py-0.5 border border-[#D1E7E2]">KAD PENGENALAN</span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-11 h-11 bg-[#0F766E] text-white rounded-none flex items-center justify-center font-extrabold text-xs shadow-xs border border-teal-800">
                        AF
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#16302B]">Ahmad Firdaus Bin Ismail</div>
                        <div className="text-[11px] font-mono text-[#0D9488] font-bold">890214-10-5421</div>
                        <div className="text-[10px] text-[#46605B] font-medium">Panel: Petronas Corporate Health</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#99F6E4] flex items-center justify-between text-[10px] text-[#46605B]">
                      <span>Token ID: <strong className="font-mono text-[#16302B]">#MK-8902</strong></span>
                      <span className="text-[#15803D] font-extrabold bg-[#DCFCE7] px-2 py-0.5 border border-green-300">E-GL AUTHORIZED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'tpa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fadeIn">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[#0F766E] text-xs font-bold uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-[#0D9488]" /> Corporate TPA Integration
                  </div>
                  <h3 className="text-2xl font-black text-[#16302B]">Instant Cashless e-Guarantee Letters</h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Say goodbye to upfront payments. Our system connects directly with PMCare, MiCare, HealthMetrics, and RedAlert API servers for instant approval.
                  </p>
                  <ul className="space-y-2 text-xs text-[#16302B] font-medium">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Cashless outpatient claim dispatch</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Instant GL balance verification</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Co-payment auto-calculation</li>
                  </ul>
                  <a
                    href="#panels"
                    className="px-6 py-3 rounded-none bg-[#EFFCF9] hover:bg-[#E6FFFA] text-[#0F766E] border border-[#99F6E4] font-extrabold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>View Supported Panels</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="bg-white border border-[#D1E7E2] p-6 shadow-md space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#D1E7E2] pb-3 font-sans">
                    <span className="font-black text-[#16302B] text-xs">TPA Panel e-GL Status</span>
                    <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] border border-green-300 px-2 py-0.5 font-bold">APPROVED</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between">
                    <span>Panel:</span>
                    <span className="font-bold text-[#16302B]">PMCare Corporate</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between">
                    <span>e-GL Ref:</span>
                    <span className="font-bold text-[#0D9488]">#GL-2026-9021</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between">
                    <span>Consultation Limit:</span>
                    <span className="font-bold text-[#15803D]">RM 250.00 Covered</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'dispensary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fadeIn">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[#0F766E] text-xs font-bold uppercase tracking-wider">
                    <Pill className="w-4 h-4 text-[#0D9488]" /> Licensed Compounding
                  </div>
                  <h3 className="text-2xl font-black text-[#16302B]">On-Site Pharmacy &amp; Barcode Dispensing</h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Equipped with automated prescription fulfillment, drug allergy cross-referencing, and barcode verification for 100% medication safety.
                  </p>
                  <ul className="space-y-2 text-xs text-[#16302B] font-medium">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> KKM registered pharmaceutical inventory</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Drug interaction safety alerts</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#0D9488]" /> Pediatric dosage calculator</li>
                  </ul>
                  <a
                    href="#services"
                    className="px-6 py-3 rounded-none bg-[#EFFCF9] hover:bg-[#E6FFFA] text-[#0F766E] border border-[#99F6E4] font-extrabold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Explore Dispensary Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="bg-white border border-[#D1E7E2] p-6 shadow-md space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#D1E7E2] pb-3 font-sans">
                    <span className="font-black text-[#16302B] text-xs">Dispensary Fulfillment</span>
                    <span className="text-[10px] bg-[#E6FFFA] text-[#0F766E] border border-[#99F6E4] px-2 py-0.5 font-bold">DISPENSED</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between">
                    <span>Rx 1:</span>
                    <span className="font-bold text-[#16302B]">Paracetamol 500mg (20 Tab)</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between">
                    <span>Rx 2:</span>
                    <span className="font-bold text-[#16302B]">Amoxicillin 500mg (15 Cap)</span>
                  </div>
                  <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex justify-between">
                    <span>Safety Check:</span>
                    <span className="font-bold text-[#15803D]">No Allergy Detected</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. REDESIGNED MEDICAL SERVICES BENTO GRID                                 */}
      {/* ========================================================================= */}
      <section id="services" className="py-20 px-4 lg:px-8 bg-[#F8FAFC] border-t border-[#D1E7E2]">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header Section with Live Status Badge */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#0F766E] bg-[#E6FFFA] px-3.5 py-1 rounded-full border border-[#99F6E4]">
                <Activity className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Comprehensive Outpatient Suite</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#16302B] tracking-tight">
                Our Medical Specialties &amp; Services
              </h2>
              <p className="text-[#46605B] text-xs sm:text-sm leading-relaxed">
                Delivering expert general practice, pediatric care, corporate health screenings, and round-the-clock minor emergency procedures.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-extrabold text-[#15803D] bg-[#DCFCE7] px-3 py-1.5 border border-green-300 flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
                <span>All 6 Clinical Suites Active</span>
              </span>
            </div>
          </div>

          {/* Asymmetric Bento Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* FEATURED HERO CARD (Spans 7 Cols on Desktop) */}
            <div className="lg:col-span-7 bg-white border border-[#D1E7E2] rounded-none p-7 shadow-sm space-y-6 relative overflow-hidden group hover:border-[#0D9488] transition-all">
              <div className="h-1 bg-[#0D9488] absolute top-0 left-0 right-0" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-none bg-[#0D9488] text-white flex items-center justify-center shadow-md shadow-teal-700/20">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E] block">Primary Clinical Suite</span>
                    <h3 className="text-xl font-black text-[#16302B] group-hover:text-[#0D9488] transition-colors">
                      General Outpatient &amp; Acute Care Suite
                    </h3>
                  </div>
                </div>

                <span className="hidden sm:inline-flex text-[10px] font-mono font-bold bg-[#DCFCE7] text-[#15803D] px-2.5 py-1 border border-green-300">
                  🟢 Suite 101 Active
                </span>
              </div>

              <p className="text-xs text-[#46605B] leading-relaxed font-normal relative z-10">
                Comprehensive diagnostic consultations, acute illness management, chronic disease monitoring, and minor outpatient surgical procedures delivered by senior MMC-registered physicians.
              </p>

              {/* Key Clinical Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10 text-xs font-semibold text-[#16302B]">
                <div className="flex items-center gap-2 bg-[#E6FFFA] p-2.5 border border-[#99F6E4]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span>Acute Fever &amp; Viral Influenza</span>
                </div>
                <div className="flex items-center gap-2 bg-[#E6FFFA] p-2.5 border border-[#99F6E4]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span>Hypertension &amp; Diabetes EMR Sync</span>
                </div>
                <div className="flex items-center gap-2 bg-[#E6FFFA] p-2.5 border border-[#99F6E4]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span>24/7 Laceration Suturing &amp; Dressing</span>
                </div>
                <div className="flex items-center gap-2 bg-[#E6FFFA] p-2.5 border border-[#99F6E4]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span>Asthma Nebulization Suite</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#D1E7E2] relative z-10">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#115E59] text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Outpatient Consultation</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenTelemetry}
                  className="text-xs text-[#2563EB] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect Live Telemetry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* CARD 2: PHARMACY & COMPOUNDING (Spans 5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-[#D1E7E2] p-6 shadow-xs flex flex-col justify-between hover:border-[#0D9488] transition-all group relative overflow-hidden">
              <div className="h-1 bg-[#0F766E] absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 bg-[#DCFCE7] border border-green-300 flex items-center justify-center text-[#15803D] shadow-2xs group-hover:scale-105 transition-transform">
                    <Pill className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 border border-green-300">
                    FIFO Barcode Verified
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#16302B] group-hover:text-[#0F766E] transition-colors">
                    Pharmacy &amp; Compounding
                  </h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Licensed dispensary supplying KKM-approved pharmaceuticals, automated antibiotic fulfillment, and custom pediatric formulations.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">KKM Reg #8902</span>
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">Pediatric Syrups</span>
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">Allergy Safety</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D1E7E2] mt-4 flex items-center justify-between text-xs font-bold text-[#0F766E]">
                <span>On-Site Dispensary Open</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 3: PEDIATRICS & IMMUNIZATION (Spans 4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-[#D1E7E2] p-6 shadow-xs flex flex-col justify-between hover:border-[#2563EB] transition-all group relative overflow-hidden">
              <div className="h-1 bg-[#2563EB] absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-2xs group-hover:scale-105 transition-transform">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 border border-blue-200">
                    Child Friendly Suite
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#16302B] group-hover:text-[#2563EB] transition-colors">
                    Pediatrics &amp; Immunization
                  </h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Gentle healthcare for infants and children, growth tracking, and mandatory KKM childhood vaccination schedules.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">KKM Vaccines</span>
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">Growth Chart</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D1E7E2] mt-4 flex items-center justify-between text-xs font-bold text-[#2563EB]">
                <span>Pediatric Vaccination Info</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 4: CORPORATE PANEL & TPA BILLING (Spans 4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-[#D1E7E2] p-6 shadow-xs flex flex-col justify-between hover:border-[#0F766E] transition-all group relative overflow-hidden">
              <div className="h-1 bg-[#0F766E] absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 bg-[#EFFCF9] border border-[#99F6E4] flex items-center justify-center text-[#0F766E] shadow-2xs group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0F766E] bg-[#EFFCF9] px-2 py-0.5 border border-[#99F6E4]">
                    150+ Corporate TPAs
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#16302B] group-hover:text-[#0F766E] transition-colors">
                    Corporate Panel &amp; TPA Billing
                  </h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Cashless medical billing for PMCare, MiCare, HealthMetrics, Petronas, and Maybank staff with real-time e-GL dispatch.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">Instant e-GL</span>
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">Zero Upfront Cash</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D1E7E2] mt-4 flex items-center justify-between text-xs font-bold text-[#0F766E]">
                <span>Check Panel Eligibility</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 5: EXECUTIVE HEALTH SCREENING (Spans 4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-[#D1E7E2] p-6 shadow-xs flex flex-col justify-between hover:border-[#0D9488] transition-all group relative overflow-hidden">
              <div className="h-1 bg-[#0D9488] absolute top-0 left-0 right-0" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 bg-[#EFFCF9] border border-[#99F6E4] flex items-center justify-center text-[#0D9488] shadow-2xs group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0F766E] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">
                    Full Lab Profile
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[#16302B] text-base font-black group-hover:text-[#0D9488] transition-colors">
                    Executive Health Screening
                  </h3>
                  <p className="text-xs text-[#46605B] leading-relaxed">
                    Full-body blood profiling, 12-lead ECG cardiac screening, lipid panels, and kidney/liver functionality testing with EMR reports.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">38 Parameters</span>
                  <span className="text-[10px] font-bold text-[#46605B] bg-[#E6FFFA] px-2 py-0.5 border border-[#99F6E4]">12-Lead ECG</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D1E7E2] mt-4 flex items-center justify-between text-xs font-bold text-[#0D9488]">
                <span>View Screening Packages</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CARD 6: 24/7 EMERGENCY & SURGERY (Emergency Soft Background #FEE2E2 & Red #B91C1C) */}
            <div className="lg:col-span-12 bg-[#FEE2E2] border border-red-300 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#B91C1C] transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#B91C1C] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B91C1C] bg-white px-2 py-0.5 border border-red-300">
                      24/7 Emergency Suite
                    </span>
                    <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 border border-green-300">
                      Trauma Bed Ready
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#16302B]">
                    24-Hour Emergency &amp; Minor Surgical Procedures
                  </h3>
                  <p className="text-xs text-[#46605B] max-w-2xl leading-relaxed">
                    Immediate care for acute wound suturing, burn dressing, abscess drainage, asthma nebulization, foreign body removal, and tetanus prophylaxis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                <a
                  href="tel:+60355108899"
                  className="w-full md:w-auto px-6 py-3 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Emergency: +60 3-5510 8899</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CORPORATE TPA PANEL PARTNERS                                          */}
      {/* ========================================================================= */}
      <section id="panels" className="py-16 px-4 lg:px-8 bg-[#E6FFFA] border-t border-[#99F6E4]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            
            {/* Left Col: Panel Search & Badges */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-xs font-black uppercase tracking-widest text-[#0F766E]">Cashless Corporate Medical Coverage</span>
                  <h3 className="text-xl font-extrabold text-[#16302B]">Recognized TPA &amp; Insurance Panels</h3>
                </div>

                {/* Panel Search Input */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-[#46605B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search panel..."
                    value={panelSearch}
                    onChange={e => setPanelSearch(e.target.value)}
                    className="w-full pl-9.5 pr-3.5 py-2.5 bg-white border border-[#D1E7E2] text-xs text-[#16302B] placeholder-[#46605B] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#99F6E4]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs font-bold">
                {filteredPanels.map((panel, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => setSelectedPanelCheck(panel)}
                    className={`px-3.5 py-2 border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                      selectedPanelCheck === panel 
                        ? 'bg-[#0D9488] text-white border-[#0D9488]' 
                        : 'bg-white border-[#D1E7E2] text-[#46605B] hover:border-[#0D9488] hover:text-[#0F766E]'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{panel}</span>
                  </button>
                ))}
                {filteredPanels.length === 0 && (
                  <div className="text-[#46605B] text-xs py-2">No matching corporate panel found.</div>
                )}
              </div>
            </div>

            {/* Right Col: Interactive Panel Cashless Estimator Card */}
            <div className="bg-white border border-[#D1E7E2] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#D1E7E2] pb-3">
                <span className="text-xs font-black text-[#16302B] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0D9488]" /> Cashless Benefit Check
                </span>
                <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 border border-green-300">
                  INSTANT API
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#46605B] block mb-1">Selected TPA Gateway</label>
                  <select
                    value={selectedPanelCheck}
                    onChange={e => setSelectedPanelCheck(e.target.value)}
                    className="w-full p-2.5 bg-[#EFFCF9] border border-[#99F6E4] text-xs font-bold text-[#16302B] focus:outline-none"
                  >
                    {tpaPanels.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#46605B] block mb-1">Staff / IC Reference ID</label>
                  <input
                    type="text"
                    value={panelEmpId}
                    onChange={e => setPanelEmpId(e.target.value)}
                    placeholder="Enter Staff ID..."
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#D1E7E2] text-xs font-mono font-bold text-[#16302B] focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#46605B]">Consultation Coverage:</span>
                    <span className="font-extrabold text-[#15803D]">100% Cashless</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#46605B]">Medication Allowance:</span>
                    <span className="font-extrabold text-[#0D9488]">RM 250 / Visit</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#46605B]">Co-Pay Required:</span>
                    <span className="font-extrabold text-[#16302B] font-mono">RM 0.00</span>
                  </div>
                </div>

                {/* Secondary Blue Action for Panel Eligibility Check */}
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reserve Cashless Token</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ON-DUTY SPECIALIST DOCTORS                                             */}
      {/* ========================================================================= */}
      <section id="doctors" className="py-20 px-4 lg:px-8 bg-[#F8FAFC] border-t border-[#D1E7E2]">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-[#0F766E]">Expert Clinical Staff</span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#16302B]">Resident Medical Doctors &amp; Specialists</h2>
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-2 text-xs font-bold bg-white p-1.5 border border-[#D1E7E2]">
              {['All', 'General Medicine', 'Pediatrics', 'Pharmacy'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDoctorSpecialty(dept)}
                  className={`px-3 py-1.5 transition-colors cursor-pointer ${
                    doctorSpecialty === dept 
                      ? 'bg-[#0D9488] text-white shadow-2xs font-extrabold' 
                      : 'text-[#46605B] hover:text-[#0F766E]'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {filteredDoctors.map((doc) => (
              <div key={doc.id} className="bg-white border border-[#D1E7E2] hover:border-[#0D9488] p-6 text-center space-y-4 group relative shadow-xs transition-all">
                
                {/* Availability State Pill (Positive Status #15803D) */}
                <div className="absolute top-4 right-4">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] border border-green-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
                    {doc.availabilityState}
                  </span>
                </div>

                <div className={`w-20 h-20 ${doc.bgColor} mx-auto flex items-center justify-center text-white text-2xl font-black shadow-md group-hover:scale-105 transition-transform border border-teal-700`}>
                  {doc.id}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[#B45309] text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{doc.rating} ({doc.experience})</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#16302B]">{doc.name}</h3>
                  <span className="text-xs text-[#0D9488] font-semibold block">{doc.title}</span>
                  <span className="text-[11px] text-[#46605B] block pt-0.5">{doc.role}</span>
                </div>
                
                {/* Live Slot & Queue Status Box */}
                <div className="p-3 bg-[#E6FFFA] border border-[#99F6E4] flex items-center justify-between text-[11px] font-bold text-[#16302B] shadow-2xs">
                  <span className="flex items-center gap-1.5 text-[#16302B]">
                    <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>{doc.nextSlot}</span>
                  </span>
                  <span className="font-mono text-[#0F766E] bg-white px-2 py-0.5 border border-[#D1E7E2] text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0D9488]" />
                    <span>{doc.queueCount} Ahead (Wait &lt; 8m)</span>
                  </span>
                </div>

                {/* Primary Action Button (#0D9488) */}
                <button
                  type="button"
                  onClick={() => openDoctorBooking(doc.name)}
                  className="w-full py-2.5 bg-[#0D9488] hover:bg-[#115E59] text-white text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reserve Slot with {doc.name.split(' ')[1]}</span>
                </button>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. VERIFIED PATIENT REVIEWS & TRUST SHOWCASE                             */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 lg:px-8 bg-[#E6FFFA] border-t border-[#99F6E4]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-[#16302B]">Trusted by Over 45,000 Outpatients</h2>
            <p className="text-[#46605B] text-xs sm:text-sm">
              Read authentic feedback from individuals, families, and corporate HR managers who rely on our 24/7 medical services.
            </p>
          </div>

          {/* Review Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
            {['All', 'Corporate Panel', 'Occupational Health', 'Pediatrics'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setReviewCategory(cat)}
                className={`px-3.5 py-1.5 transition-all cursor-pointer border ${
                  reviewCategory === cat
                    ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-2xs font-extrabold'
                    : 'bg-white border-[#D1E7E2] text-[#46605B] hover:text-[#0F766E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTestimonials.map((t, idx) => (
              <div key={idx} className="bg-white border border-[#D1E7E2] p-6 space-y-4 relative flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                      ))}
                    </div>
                    <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] border border-green-300 px-2.5 py-0.5 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#15803D]" /> KKM Verified Patient
                    </span>
                  </div>
                  <p className="text-xs text-[#16302B] italic leading-relaxed">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-[#D1E7E2] flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-xs text-[#16302B]">{t.name}</div>
                    <div className="text-[10px] text-[#0D9488] font-medium">{t.role}</div>
                  </div>
                  <span className="text-[10px] font-mono text-[#46605B] font-semibold">{t.date}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. ACCESSIBLE FAQ ACCORDION SECTION                                      */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 px-4 lg:px-8 bg-[#F8FAFC] border-t border-[#D1E7E2]">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-[#16302B]">Frequently Asked Questions</h2>
            <p className="text-[#46605B] text-xs sm:text-sm">
              Quick answers regarding insurance coverage, walk-in procedures, MyKad check-ins, and emergency services.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-white border border-[#D1E7E2] transition-all">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span className="text-sm font-extrabold text-[#16302B] flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-[#0D9488] shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#46605B] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#0D9488]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#46605B] leading-relaxed border-t border-[#D1E7E2] pt-3 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TELEMETRY BANNER CALLOUT                                               */}
      {/* ========================================================================= */}
      <section id="telemetry" className="py-16 px-4 lg:px-8 bg-[#E6FFFA] border-t border-[#99F6E4]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-white border border-[#99F6E4] shadow-xs relative overflow-hidden">
          
          <div className="space-y-2 text-center md:text-left relative z-10">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] flex items-center justify-center md:justify-start gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#06B6D4]" /> Real-Time Operations Intelligence
            </span>
            <h2 className="text-2xl font-black text-[#16302B]">Public Operations &amp; Queue Telemetry Dashboard</h2>
            <p className="text-xs text-[#46605B] max-w-xl leading-relaxed">
              Inspect hourly patient traffic, diagnostic distributions, TPA claim metrics, and live waiting queue counts before visiting.
            </p>
          </div>
          
          <button
            type="button"
            onClick={onOpenTelemetry}
            className="px-7 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0 relative z-10"
          >
            <Activity className="w-4 h-4" />
            <span>Open Telemetry Dashboard</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER (Primary Brand Teal #0F766E Visual Anchor)                   */}
      {/* ========================================================================= */}
      <footer id="contact" className="py-16 px-4 lg:px-8 bg-[#0F766E] text-teal-50 text-xs border-t border-[#0D9488]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          <div className="space-y-3">
            <span className="text-base font-black text-white block tracking-tight">MEDICLINIC ENTERPRISE</span>
            <p className="text-teal-100 leading-relaxed text-[11px]">
              Shah Alam&apos;s premier 24/7 outpatient medical facility equipped with biometric MyKad scanner, EMR integration, and corporate panel coverage.
            </p>
            <span className="text-[10px] text-teal-200 font-mono block">KKM Reg #KKM-2026-SL-8902</span>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Contact &amp; Emergency</h4>
            <div className="space-y-2 pt-1">
              <span className="block flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-teal-200" /> +60 3-5510 8899</span>
              <span className="block flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-teal-200" /> emergency@mediclinic.my</span>
              <span className="block flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-teal-200" /> 24 Hours / 7 Days Open</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Location Address</h4>
            <div className="space-y-1 leading-relaxed pt-1">
              <span className="block flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-200 shrink-0 mt-0.5" />
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
                className="w-full py-2.5 bg-[#0D9488] hover:bg-[#115E59] text-white font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md border border-teal-400/30"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Portal Access</span>
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-teal-600/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-teal-200">
          <span>&copy; 2026 MediClinic Enterprise. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#services" className="hover:text-white">Privacy Policy</a>
            <a href="#services" className="hover:text-white">Terms of Service</a>
            <a href="#services" className="hover:text-white">PDPA Compliance</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 11. FLOATING QUICK-ACTION ASSISTANT WIDGET                                */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
        <button
          type="button"
          onClick={() => setIsBookingOpen(true)}
          className="px-4 py-3 bg-[#0D9488] hover:bg-[#115E59] text-white text-xs font-black shadow-2xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer ring-2 ring-white/80"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Book Doctor</span>
        </button>

        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-10 h-10 bg-white border border-[#D1E7E2] text-[#16302B] hover:text-[#0F766E] hover:border-[#0D9488] shadow-md flex items-center justify-center transition-all cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 12. APPOINTMENT BOOKING MODAL                                              */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-[#D1E7E2] rounded-none max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-[#16302B]">
            
            <div className="flex items-center justify-between border-b border-[#D1E7E2] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-[#EFFCF9] border border-[#99F6E4] flex items-center justify-center text-[#0F766E]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#16302B]">
                    Book Doctor Appointment
                  </h3>
                  {selectedDoctor && (
                    <span className="text-[11px] text-[#0D9488] font-semibold block">
                      Preferred: {selectedDoctor}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="w-8 h-8 rounded-none bg-[#EFFCF9] text-[#46605B] hover:text-[#16302B] flex items-center justify-center text-sm cursor-pointer border border-[#D1E7E2]"
              >
                ✕
              </button>
            </div>

            {bookingSubmitted ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-none bg-[#DCFCE7] border border-green-300 text-[#15803D] mx-auto flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-[#16302B]">Appointment Reserved!</h4>
                <p className="text-xs text-[#46605B] leading-relaxed max-w-xs mx-auto">
                  Thank you, <strong className="text-[#0D9488]">{bookingForm.fullName}</strong>. Your queue token reference is <strong className="text-mono font-bold text-[#B45309]">#APT-8902</strong>.
                </p>
                <div className="p-4 bg-[#E6FFFA] border border-[#99F6E4] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#46605B]">Service:</span>
                    <strong className="text-[#16302B]">{bookingForm.service}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#46605B]">Date &amp; Time:</span>
                    <strong className="text-[#0D9488]">{bookingForm.preferredDate || 'Today'} @ {bookingForm.preferredTime}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetBooking}
                  className="px-6 py-2.5 rounded-none bg-[#0D9488] hover:bg-[#115E59] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#46605B] mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D1E7E2] text-[#16302B] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#99F6E4]"
                    placeholder="e.g. Ahmad Firdaus Bin Ismail"
                    value={bookingForm.fullName}
                    onChange={e => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#46605B] mb-1">MyKad IC Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D1E7E2] text-[#16302B] font-mono focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#99F6E4]"
                      placeholder="YYMMDD-XX-XXXX"
                      value={bookingForm.icNumber}
                      onChange={e => setBookingForm({ ...bookingForm, icNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#46605B] mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D1E7E2] text-[#16302B] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#99F6E4]"
                      placeholder="+60 12-345 6789"
                      value={bookingForm.phone}
                      onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#46605B] mb-1">Medical Specialty *</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D1E7E2] text-[#16302B] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#99F6E4]"
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
                    <label className="block text-[10px] uppercase font-bold text-[#46605B] mb-1">Preferred Date</label>
                    <input
                      type="date"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D1E7E2] text-[#16302B] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#99F6E4]"
                      value={bookingForm.preferredDate}
                      onChange={e => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#46605B] mb-1">Preferred Time</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D1E7E2] text-[#16302B] focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#99F6E4]"
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

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0D9488] hover:bg-[#115E59] text-white font-black text-xs shadow-md transition-all cursor-pointer mt-2"
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
