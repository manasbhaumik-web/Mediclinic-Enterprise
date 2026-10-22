import React from 'react';
import { Activity, Calendar, ChevronRight, Clock, CreditCard, AlertTriangle } from 'lucide-react';

interface HeroSectionProps {
  heroImages: string[];
  heroSlide: number;
  isBM: boolean;
  setHeroSlide: React.Dispatch<React.SetStateAction<number>>;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HeroSection({ heroImages, heroSlide, isBM, setHeroSlide, setIsBookingOpen }: HeroSectionProps) {
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
            <span>{isBM ? 'Diagnosis pintar · Rawatan tepat' : 'Next-gen healthcare · Smart diagnostics'}</span>
            
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
            {isBM ? (
              <>Klinik Pesakit Luar &amp; Rawatan Segera <span className="text-accent">24 Jam di Shah Alam</span></>
            ) : (
              <>24/7 Outpatient &amp; Urgent Care <span className="text-accent">in Shah Alam</span></>
            )}
          </h1>
    
          {/* Supporting line */}
          <p className="text-muted font-semibold text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
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
              className="w-full sm:w-auto px-8 py-4 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-2xl shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer min-h-[44px]"
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
            <div className="bg-surface-accent/90 border border-line rounded-none p-3 flex flex-wrap items-center justify-around gap-4 text-xs text-muted font-bold shadow-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isBM ? 'Buka 24/7 (Hari Ini)' : 'Open 24/7'}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>{isBM ? 'Anggaran Masa Menunggu:' : 'Current estimated wait:'} <strong className="font-mono text-accent">11 min</strong></span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
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
  );
}
