import React from 'react';
import logoUrl from '../../assets/logo_transparent.svg';
import ThemeSelector from '../../components/ui/ThemeSelector';
import { Globe, Calendar, LogIn, X, Menu, ChevronRight } from 'lucide-react';
import { Language } from '../../types';

interface LandingHeaderProps {
  isBM: boolean;
  onToggleLanguage: (lang: Language) => void;
  activeLanguage: Language;
  setIsBookingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenLogin: () => void;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileMenuOpen: boolean;
}

export default function LandingHeader({ isBM, onToggleLanguage, activeLanguage, setIsBookingOpen, onOpenLogin, setIsMobileMenuOpen, isMobileMenuOpen }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 h-[60px] bg-surface-accent/95 backdrop-blur-md border-b border-line px-4 lg:px-8 flex items-center justify-between transition-all shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-none shrink-0 flex items-center justify-center">
          <img src={logoUrl} alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-ink block leading-none">
            MEDICLINIC <span className="text-accent">ENTERPRISE</span>
          </span>
          <span className="hidden sm:block text-xs text-muted font-medium tracking-wide">
            {isBM ? 'Pusat Perubatan Pesakit Luar 24/7 Shah Alam' : '24/7 Outpatient Medical Clinic Shah Alam'}
          </span>
        </div>
      </div>
    
      {/* Desktop Navigation Links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-muted whitespace-nowrap">
        <a href="#services" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Perkhidmatan' : 'Services'}</a>
        <a href="#doctors" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Doktor' : 'Doctors'}</a>
        <a href="#panels" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Panel Insurans' : 'Panel Coverage'}</a>
        <a href="#location" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">{isBM ? 'Lokasi & Arah' : 'Location'}</a>
        <a href="#faq" className="py-3 hover:text-accent transition-colors inline-flex items-center justify-center min-h-[44px]">FAQ</a>
      </nav>
    
      {/* Header Actions */}
      <div className="flex items-center gap-2.5">
        {/* Colour theme */}
        <ThemeSelector variant="light" className="hidden sm:flex" />
    
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
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded-none bg-surface border border-line-subtle text-muted hover:text-ink cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    
    {/* Mobile Menu Drawer */}
    {isMobileMenuOpen && (
      <div className="lg:hidden absolute inset-x-0 top-full z-40 max-h-[calc(100vh-60px)] overflow-y-auto bg-surface-muted border-b border-line-subtle p-6 space-y-4 shadow-2xl animate-fadeIn">
        <nav className="flex flex-col space-y-3 font-semibold text-sm text-muted">
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
  );
}
