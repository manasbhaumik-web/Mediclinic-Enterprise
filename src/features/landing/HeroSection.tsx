import React from 'react';
import { Activity, Calendar, ChevronRight, Clock, CreditCard, AlertTriangle } from 'lucide-react';

interface HeroSectionProps {
  heroImages: string[];
  heroSlide: number;
  isBM: boolean;
  setHeroSlide: React.Dispatch<React.SetStateAction<number>>;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  ctaText?: string;
}

export default function HeroSection({ 
  heroImages, 
  heroSlide, 
  isBM, 
  setHeroSlide, 
  setIsBookingOpen,
  heroTitle,
  heroSubtitle,
  heroBadge,
  ctaText
}: HeroSectionProps) {
  const displayBadge = heroBadge || (isBM ? 'Diagnosis pintar · Rawatan tepat' : 'Next-gen healthcare · Smart diagnostics');
  const displayTitle = heroTitle || (isBM 
    ? 'Klinik Pesakit Luar & Rawatan Segera 24 Jam di Shah Alam'
    : '24/7 Outpatient & Urgent Care in Shah Alam');
  const displaySubtitle = heroSubtitle || (isBM
    ? 'Nikmati rawatan mesra 24/7 tanpa janji temu, pendaftaran pantas MyKad, dan kelulusan panel TPA korporat 100% tanpa tunai.'
    : 'Experience seamless 24/7 walk-in care, instant MyKad check-in, and 100% cashless corporate TPA panel approval.');
  const displayCta = ctaText || (isBM ? 'Tempah Janji Temu' : 'Book appointment');

  return (
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
            <span>{displayBadge}</span>
            
            {/* Slide Dots Indicator (24px hit area around each dot) */}
            <div className="flex items-center ml-1 border-l border-teal-300/60 pl-1">
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
            {displayTitle}
          </h1>
    
          {/* Supporting line */}
          <p className="text-muted font-semibold text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            {displaySubtitle}
          </p>
    
          {/* Standardized Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-2xl shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer min-h-[44px]"
            >
              <Calendar className="w-4 h-4" />
              <span>{displayCta}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
    
            <a
              href="#doctors"
              className="w-full sm:w-auto px-7 py-4 rounded-none bg-surface hover:bg-surface-accent text-ink border border-line-subtle font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs min-h-[44px]"
            >
              <Clock className="w-4 h-4 text-accent" />
              <span>{isBM ? 'Jadual Doktor' : 'Doctor schedules'}</span>
            </a>
          </div>
          
          {/* Micro Telemetry Indicators */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {isBM ? 'Purata masa menunggu < 10 min' : 'Average wait time < 10 mins'}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              {isBM ? '12+ Panel TPA Diterima' : '12+ Panel TPAs Accepted'}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              {isBM ? 'Triaj Kecemasan Diutamakan' : 'Emergency Triage Prioritized'}
            </span>
          </div>
          
        </div>
        
      </div>
    </section>
  );
}
