import React, { useState } from 'react';
import { Language } from '../types';
import { 
  Stethoscope, Pill, ShieldCheck, Activity, Heart, Calendar, Clock, 
  MapPin, Phone, CheckCircle2, Star, ArrowRight, LogIn, BarChart3, 
  Users, Building2, UserCheck, ChevronRight, Award, HelpCircle, Mail
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
  // Appointment Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
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
    setBookingForm({
      fullName: '',
      icNumber: '',
      phone: '',
      service: 'General Outpatient Consultation',
      preferredDate: '',
      preferredTime: '10:00 AM'
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-[#0D9488] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION HEADER                                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D9488] to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white block leading-none">
              MEDICLINIC <span className="text-[#0D9488]">ENTERPRISE</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              24/7 Smart Medical Suite &amp; Outpatient Center
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#services" className="hover:text-teal-400 transition-colors">Medical Services</a>
          <a href="#doctors" className="hover:text-teal-400 transition-colors">Specialists</a>
          <a href="#panels" className="hover:text-teal-400 transition-colors">TPA Panels</a>
          <button onClick={onOpenTelemetry} className="hover:text-teal-400 transition-colors flex items-center gap-1 text-teal-400 cursor-pointer">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Live Telemetry</span>
          </button>
          <a href="#contact" className="hover:text-teal-400 transition-colors">Contact</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <button
            type="button"
            onClick={() => onToggleLanguage(activeLanguage === 'EN' ? 'BM' : 'EN')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
          >
            🌐 {activeLanguage === 'EN' ? 'BM' : 'EN'}
          </button>

          {/* Public Telemetry Button */}
          <button
            type="button"
            onClick={onOpenTelemetry}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Operations Telemetry</span>
          </button>

          {/* Staff Login Button */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#0D9488] hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-20 px-4 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KKM Licensed &amp; MMC Accredited Medical Facility</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Next-Generation <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400">Smart Healthcare</span> &amp; 24/7 Outpatient Care
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Experience seamless, hassle-free medical consultations powered by integrated EMR, instant panel claim verifications, biometric MyKad registration, and zero wait time queue tracking.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0D9488] to-teal-500 hover:from-teal-600 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment Online</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenTelemetry}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span>View Live Clinic Telemetry</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-center">
                <span className="block text-xl font-black font-mono text-teal-400">24/7</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Emergency Open</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-center">
                <span className="block text-xl font-black font-mono text-cyan-400">11m</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Avg Wait Time</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-center">
                <span className="block text-xl font-black font-mono text-emerald-400">150+</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">TPA Corporate Panels</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-center">
                <span className="block text-xl font-black font-mono text-amber-400">99.4%</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Patient Rating</span>
              </div>
            </div>
          </div>

          {/* Right Hero Card / Live Status Widget (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Clinic Status: Active Shift</span>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                Live EMR Feed
              </span>
            </div>

            {/* Status Item 1: Doctors On-Duty */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Attending Physicians</h4>
                  <span className="text-[10px] text-slate-400">Dr. Sarah Jenkins (GP Suite 1)</span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AVAILABLE
              </span>
            </div>

            {/* Status Item 2: Waiting Queue Volume */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Current Waiting Queue</h4>
                  <span className="text-[10px] text-slate-400">Low wait volume estimated</span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {doctorQueueLength} Patients
              </span>
            </div>

            {/* Status Item 3: Pharmacy Stock */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dispensary Stock</h4>
                  <span className="text-[10px] text-slate-400">Compounding suite active</span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                STOCK READY
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Instant Queue Reservation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MEDICAL SERVICES GRID                                                  */}
      {/* ========================================================================= */}
      <section id="services" className="py-16 px-4 lg:px-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">Comprehensive Clinical Care</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">Our Medical Specialties &amp; Services</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Providing holistic general medicine, pediatrics, corporate healthcare, and minor surgical procedures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Service 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">General Outpatient Consultation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comprehensive diagnosis and treatment for acute illnesses, fever, influenza, hypertension, diabetes, and gastritis.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Pharmacy &amp; Compounding</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                On-site licensed dispensary supplying Ministry of Health (KKM) approved pharmaceuticals, antibiotics, and pediatric syrups.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Pediatrics &amp; Child Vaccination</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gentle healthcare for infants and young children, developmental milestone tracking, and mandatory immunization schedules.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Corporate Panel &amp; TPA Billing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cashless medical coverage for employees under PMCare, MiCare, HealthMetrics, RedAlert, Petronas, Maybank, and Intel.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Executive Health Screening</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full-body blood profiling, ECG cardiac screening, lipid panel, kidney &amp; liver function testing with instant digital reports.
              </p>
            </div>

            {/* Service 6 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5 transition-all space-y-3 group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">24/7 Minor Emergency &amp; Surgery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Round-the-clock emergency wound suturing, dressing, abscess drainage, asthma nebulization, and tetanus prophylaxis.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CORPORATE TPA PANEL PARTNERS                                          */}
      {/* ========================================================================= */}
      <section id="panels" className="py-12 px-4 lg:px-8 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">Seamless Cashless Coverage</span>
            <h3 className="text-lg font-bold text-white">Recognized Corporate &amp; TPA Insurance Panels</h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold font-mono">
            {['PMCare TPA', 'MiCare Corporate', 'HealthMetrics', 'RedAlert Online', 'Petronas Medical', 'Maybank Staff', 'Intel Healthcare', 'Sime Darby Panel', 'CelcomDigi Health'].map((panel, idx) => (
              <div key={idx} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:border-teal-500/40 hover:text-teal-300 transition-colors">
                💳 {panel}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ON-DUTY SPECIALIST DOCTORS                                             */}
      {/* ========================================================================= */}
      <section id="doctors" className="py-16 px-4 lg:px-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">Expert Clinical Team</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Meet Our Resident Medical Doctors</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Doctor 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg">
                SJ
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dr. Sarah Jenkins</h3>
                <span className="text-xs text-teal-400 font-medium block">MD (UKM), MMC Reg #48291</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Senior General Practitioner &amp; Family Physician</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-teal-600 hover:text-white text-teal-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Book Consultation
              </button>
            </div>

            {/* Doctor 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg">
                AR
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pharm. Ahmad Razak</h3>
                <span className="text-xs text-amber-400 font-medium block">B.Pharm (UM), Registered Pharmacist</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Chief Pharmacist &amp; Clinical Formulator</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-amber-600 hover:text-white text-amber-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Request Counseling
              </button>
            </div>

            {/* Doctor 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg">
                MW
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dr. Michael Wong</h3>
                <span className="text-xs text-emerald-400 font-medium block">MBBS (Malaya), MMed Pediatrics</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Consultant Pediatrician</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Book Consultation
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. LIVE TELEMETRY DASHBOARD CALLOUT BANNER                                */}
      {/* ========================================================================= */}
      <section id="telemetry" className="py-12 px-4 lg:px-8 bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-slate-900/80 border border-teal-500/30 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-400 flex items-center justify-center md:justify-start gap-1.5">
              <BarChart3 className="w-4 h-4" /> Real-Time Clinic Intelligence
            </span>
            <h2 className="text-2xl font-black text-white">Public Operations &amp; Queue Telemetry Dashboard</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Inspect hourly patient flow trends, ICD-10 diagnostic breakdown, TPA claim distribution, and real-time waiting queue status before visiting.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenTelemetry}
            className="px-6 py-3.5 rounded-xl bg-[#0D9488] hover:bg-teal-500 text-white font-extrabold text-xs shadow-xl shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <Activity className="w-4 h-4" />
            <span>Open Telemetry Dashboard</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER & CONTACT DIRECTORY                                             */}
      {/* ========================================================================= */}
      <footer id="contact" className="py-12 px-4 lg:px-8 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <span className="text-base font-extrabold text-white block">MEDICLINIC ENTERPRISE</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Shah Alam&apos;s leading 24/7 outpatient medical center equipped with EMR, biometrics, and cashless corporate panel integration.
            </p>
            <span className="text-[10px] text-slate-500 font-mono block">KKM Reg #KKM-2026-SL-8902</span>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px]">Contact &amp; Emergency</h4>
            <div className="space-y-1">
              <span className="block flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-teal-400" /> +60 3-5510 8899</span>
              <span className="block flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-teal-400" /> emergency@mediclinic.my</span>
              <span className="block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-400" /> 24 Hours / 7 Days Open</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px]">Location Address</h4>
            <div className="space-y-1 leading-relaxed">
              <span className="block flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px]">Portals &amp; Access</h4>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Portal Access</span>
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <span>&copy; 2026 MediClinic Enterprise. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#services" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#services" className="hover:text-slate-300">Terms of Service</a>
            <a href="#services" className="hover:text-slate-300">PDPA Compliance</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 8. APPOINTMENT BOOKING MODAL                                              */}
      {/* ========================================================================= */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Book Doctor Appointment Online
              </h3>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Appointment Reserved!</h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                  Thank you, <strong className="text-teal-300">{bookingForm.fullName}</strong>. Your queue token reference is <strong className="text-mono font-bold text-amber-400">#APT-8902</strong>.
                </p>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-left text-xs space-y-1">
                  <div>Service: <strong className="text-slate-200">{bookingForm.service}</strong></div>
                  <div>Date &amp; Time: <strong className="text-teal-300">{bookingForm.preferredDate || 'Today'} @ {bookingForm.preferredTime}</strong></div>
                </div>
                <button
                  type="button"
                  onClick={resetBooking}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                    placeholder="e.g. Ahmad Firdaus Bin Ismail"
                    value={bookingForm.fullName}
                    onChange={e => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">MyKad IC Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-teal-500"
                      placeholder="YYMMDD-XX-XXXX"
                      value={bookingForm.icNumber}
                      onChange={e => setBookingForm({ ...bookingForm, icNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                      placeholder="+60 12-345 6789"
                      value={bookingForm.phone}
                      onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Medical Specialty *</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
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
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                      value={bookingForm.preferredDate}
                      onChange={e => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Preferred Time</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-teal-500 hover:from-teal-600 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer mt-2"
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
