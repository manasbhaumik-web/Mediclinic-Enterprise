import React from 'react';
import logoUrl from '../../assets/logo_transparent.svg';
import ThemeSelector from '../../components/ui/ThemeSelector';
import BrandName from '../../components/ui/BrandName';
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
  clinicName?: string;
  branchName?: string;
}

export default function LandingHeader({ 
  isBM, 
  onToggleLanguage, 
  activeLanguage, 
  setIsBookingOpen, 
  onOpenLogin, 
  setIsMobileMenuOpen, 
  isMobileMenuOpen,
  clinicName,
  branchName
}: LandingHeaderProps) {
  const displayTitle = clinicName || 'MEDICLINIC ENTERPRISE';
  const displayBranch = branchName || (isBM ? 'Pusat Perubatan Pesakit Luar 24/7' : '24/7 Outpatient Medical Clinic');

  return (
    <header className="sticky top-0 z-50 h-[60px] bg-surface-accent/95 backdrop-blur-md border-b border-line px-4 lg:px-8 flex items-center justify-between transition-all shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-none shrink-0 flex items-center justify-center">
          <img src={logoUrl} alt={`${displayTitle} Logo`} className="w-full h-full object-contain" />
        </div>
        <div>
          <BrandName 
            name={displayTitle} 
            className="text-base font-bold tracking-tight text-ink block leading-none" 
            accentClassName="text-accent" 
          />
          <span className="hidden sm:block text-xs text-muted font-medium tracking-wide">
            {displayBranch}
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
          <span>{isBM ? 'Portal Staf →' : 'Staff Portal →'}</span>
        </button>
    
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden min-h-[44px] w-[44px] flex items-center justify-center rounded-none bg-surface-accent border border-line-subtle text-ink cursor-pointer hover:bg-surface-strong transition-colors"
          aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    
      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[60px] left-0 right-0 bg-surface/98 backdrop-blur-xl border-b border-line shadow-2xl p-6 space-y-5 animate-fadeIn z-50">
          <nav className="flex flex-col space-y-3 text-sm font-bold text-ink">
            <a 
              href="#services" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 hover:bg-surface-accent rounded-none flex items-center justify-between"
            >
              <span>{isBM ? 'Perkhidmatan & Rawatan' : 'Services & Treatments'}</span>
              <ChevronRight className="w-4 h-4 text-accent" />
            </a>
            <a 
              href="#doctors" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 hover:bg-surface-accent rounded-none flex items-center justify-between"
            >
              <span>{isBM ? 'Doktor Pakar' : 'Medical Doctors'}</span>
              <ChevronRight className="w-4 h-4 text-accent" />
            </a>
            <a 
              href="#panels" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 hover:bg-surface-accent rounded-none flex items-center justify-between"
            >
              <span>{isBM ? 'Panel Insurans TPA' : 'Insurance & Corporate Panels'}</span>
              <ChevronRight className="w-4 h-4 text-accent" />
            </a>
            <a 
              href="#location" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 hover:bg-surface-accent rounded-none flex items-center justify-between"
            >
              <span>{isBM ? 'Lokasi & Waktu Operasi' : 'Location & Hours'}</span>
              <ChevronRight className="w-4 h-4 text-accent" />
            </a>
            <a 
              href="#faq" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 hover:bg-surface-accent rounded-none flex items-center justify-between"
            >
              <span>FAQ</span>
              <ChevronRight className="w-4 h-4 text-accent" />
            </a>
          </nav>
    
          <div className="pt-4 border-t border-line-subtle space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsBookingOpen(true);
              }}
              className="w-full py-3.5 bg-primary text-white font-bold text-sm rounded-none shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{isBM ? 'Tempah Janji Temu Sekarang' : 'Book Appointment Online'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full py-3 bg-surface-accent border border-line text-ink font-bold text-sm rounded-none flex items-center justify-center gap-2 cursor-pointer hover:bg-surface-strong"
            >
              <LogIn className="w-4 h-4 text-accent" />
              <span>{isBM ? 'Log Masuk Portal Staf' : 'Staff Portal Login'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
