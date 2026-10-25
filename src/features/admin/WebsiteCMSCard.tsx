import React, { useState } from 'react';
import { 
  Globe, LayoutTemplate, Clock, Phone, Users, Stethoscope, 
  HelpCircle, Eye, Save, RotateCcw, Plus, Trash2, CheckCircle2, 
  ExternalLink, Smartphone, Monitor, Tablet, Megaphone, AlertCircle
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import BrandName from '../../components/ui/BrandName';
import { 
  WebsiteCMSConfig, 
  DEFAULT_WEBSITE_CONFIG, 
  validateCmsConfig, 
  FaqItem,
  PublicDoctorProfile,
  PublicServiceItem
} from '../../domain/websiteCms';

type CmsTab = 'hero' | 'hours' | 'doctors' | 'services' | 'panels' | 'faqs';

export default function WebsiteCMSCard() {
  const { settings, updateWebsiteConfig, clinic } = useSettings();
  const [activeTab, setActiveTab] = useState<CmsTab>('hero');
  const [cmsState, setCmsState] = useState<WebsiteCMSConfig>(() => settings.websiteConfig || DEFAULT_WEBSITE_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // FAQ Draft State
  const [newFaqQEn, setNewFaqQEn] = useState('');
  const [newFaqQBm, setNewFaqQBm] = useState('');
  const [newFaqAEn, setNewFaqAEn] = useState('');
  const [newFaqABm, setNewFaqABm] = useState('');

  // TPA Input Draft State
  const [newPanelInput, setNewPanelInput] = useState('');

  const handleSave = () => {
    const validResult = validateCmsConfig(cmsState);
    if (!validResult.valid) {
      setValidationErrors(validResult.errors);
      return;
    }

    setValidationErrors([]);
    updateWebsiteConfig(cmsState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setCmsState(DEFAULT_WEBSITE_CONFIG);
    updateWebsiteConfig(DEFAULT_WEBSITE_CONFIG);
    setValidationErrors([]);
  };

  const handleAddFaq = () => {
    if (!newFaqQEn.trim() || !newFaqAEn.trim()) return;

    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      questionEn: newFaqQEn.trim(),
      questionBm: newFaqQBm.trim() || newFaqQEn.trim(),
      answerEn: newFaqAEn.trim(),
      answerBm: newFaqABm.trim() || newFaqAEn.trim(),
      category: 'General',
    };

    setCmsState(prev => ({
      ...prev,
      faqs: [...prev.faqs, newItem],
    }));

    setNewFaqQEn('');
    setNewFaqQBm('');
    setNewFaqAEn('');
    setNewFaqABm('');
  };

  const handleDeleteFaq = (id: string) => {
    setCmsState(prev => ({
      ...prev,
      faqs: prev.faqs.filter(f => f.id !== id),
    }));
  };

  const handleToggleDoctor = (docId: string) => {
    setCmsState(prev => ({
      ...prev,
      doctors: prev.doctors.map(d => d.id === docId ? { ...d, showOnWebsite: !d.showOnWebsite } : d),
    }));
  };

  const handleAddPanel = () => {
    const trimmed = newPanelInput.trim();
    if (!trimmed || cmsState.tpaPanels.includes(trimmed)) return;
    setCmsState(prev => ({
      ...prev,
      tpaPanels: [...prev.tpaPanels, trimmed],
    }));
    setNewPanelInput('');
  };

  const handleRemovePanel = (panel: string) => {
    setCmsState(prev => ({
      ...prev,
      tpaPanels: prev.tpaPanels.filter(p => p !== panel),
    }));
  };

  return (
    <section className="bg-surface rounded-none border border-line shadow-2xs overflow-hidden">
      {/* HEADER BANNER */}
      <div className="bg-surface-muted px-5 py-3.5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-brand/10 text-accent rounded-none border border-brand/20">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="type-card-title text-ink">Public Website Content Management (CMS)</h3>
              <span className="bg-teal-50 text-accent border border-teal-200 text-2xs font-bold px-2 py-0.5 rounded-none uppercase">
                Patient-Facing Portal
              </span>
            </div>
            <p className="text-2xs text-subtle mt-0.5">
              Customize your clinic's patient-facing home page, doctor roster, services, insurance panels, and operating schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3 py-1.5 bg-surface hover:bg-surface-accent text-accent border border-line text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-accent border border-brand/30 text-xs font-bold flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Public Site
          </a>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="bg-surface border-b border-line px-5 flex items-center gap-1 overflow-x-auto custom-scrollbar">
        {[
          { id: 'hero' as const, label: 'Hero & Branding', icon: LayoutTemplate },
          { id: 'hours' as const, label: 'Hours & Contact', icon: Clock },
          { id: 'doctors' as const, label: 'Resident Physicians', icon: Users },
          { id: 'services' as const, label: 'Services & Tariffs', icon: Stethoscope },
          { id: 'panels' as const, label: 'Insurance Panels', icon: Phone },
          { id: 'faqs' as const, label: 'Patient FAQs', icon: HelpCircle },
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`py-3 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand text-accent bg-primary/5'
                  : 'border-transparent text-subtle hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-5 space-y-6">
        {/* VALIDATION ERRORS */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Please resolve the following before saving:
            </div>
            <ul className="list-disc pl-5 text-2xs space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 1. HERO & BRANDING TAB */}
        {activeTab === 'hero' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Top Announcement Bar */}
            <div className="p-4 bg-surface-accent border border-line-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-accent" />
                  Top Marquee Announcement Banner
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cmsState.announcement.enabled}
                    onChange={(e) => setCmsState(prev => ({
                      ...prev,
                      announcement: { ...prev.announcement, enabled: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {cmsState.announcement.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-subtle uppercase">Announcement (English)</label>
                    <input
                      type="text"
                      value={cmsState.announcement.textEn}
                      onChange={(e) => setCmsState(prev => ({
                        ...prev,
                        announcement: { ...prev.announcement, textEn: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 bg-surface border border-line-subtle text-xs text-ink outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-subtle uppercase">Pengumuman (Bahasa Melayu)</label>
                    <input
                      type="text"
                      value={cmsState.announcement.textBm}
                      onChange={(e) => setCmsState(prev => ({
                        ...prev,
                        announcement: { ...prev.announcement, textBm: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 bg-surface border border-line-subtle text-xs text-ink outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Brand Title & Branch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Public Clinic Brand Name</label>
                <input
                  type="text"
                  value={cmsState.hero.clinicName}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    hero: { ...prev.hero, clinicName: e.target.value }
                  }))}
                  placeholder="e.g. MEDICLINIC ENTERPRISE"
                  className="w-full px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink font-bold focus:ring-1 focus:ring-brand outline-none"
                />
                <p className="text-2xs text-subtle">Appears in header, browser title bar, and hero banner.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Public Branch / Facility Tag</label>
                <input
                  type="text"
                  value={cmsState.hero.branchName}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    hero: { ...prev.hero, branchName: e.target.value }
                  }))}
                  placeholder="e.g. Shah Alam Main Branch"
                  className="w-full px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
                <p className="text-2xs text-subtle">Identifies the specific clinic location for visiting patients.</p>
              </div>
            </div>

            {/* Bilingual Hero Headlines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Hero Headline (English)</label>
                <textarea
                  rows={2}
                  value={cmsState.hero.titleEn}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    hero: { ...prev.hero, titleEn: e.target.value }
                  }))}
                  className="w-full p-2.5 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Tajuk Utama Hero (Bahasa Melayu)</label>
                <textarea
                  rows={2}
                  value={cmsState.hero.titleBm}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    hero: { ...prev.hero, titleBm: e.target.value }
                  }))}
                  className="w-full p-2.5 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>

            {/* Bilingual Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Hero Subtitle (English)</label>
                <textarea
                  rows={2}
                  value={cmsState.hero.subtitleEn}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    hero: { ...prev.hero, subtitleEn: e.target.value }
                  }))}
                  className="w-full p-2.5 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Penerangan Hero (Bahasa Melayu)</label>
                <textarea
                  rows={2}
                  value={cmsState.hero.subtitleBm}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    hero: { ...prev.hero, subtitleBm: e.target.value }
                  }))}
                  className="w-full p-2.5 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. HOURS & CONTACT TAB */}
        {activeTab === 'hours' && (
          <div className="space-y-5 animate-fadeIn">
            {/* 24 Hours Toggle */}
            <div className="p-4 bg-surface-accent border border-line-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink">24-Hour Operating Facility</p>
                <p className="text-2xs text-subtle mt-0.5">Toggle on if your facility offers 24/7 round-the-clock emergency outpatient care.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cmsState.operatingHours.is24Hours}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    operatingHours: { ...prev.operatingHours, is24Hours: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Hotlines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Main Telephone</label>
                <input
                  type="text"
                  value={cmsState.contact.phone}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">24/7 Emergency Hotline</label>
                <input
                  type="text"
                  value={cmsState.contact.emergencyHotline}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    contact: { ...prev.contact, emergencyHotline: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none font-bold text-rose-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">WhatsApp Careline</label>
                <input
                  type="text"
                  value={cmsState.contact.whatsapp}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    contact: { ...prev.contact, whatsapp: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>

            {/* Address & Google Maps */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">Physical Clinic Address</label>
              <textarea
                rows={2}
                value={cmsState.contact.address}
                onChange={(e) => setCmsState(prev => ({
                  ...prev,
                  contact: { ...prev.contact, address: e.target.value }
                }))}
                className="w-full p-2.5 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Transit & Parking Notes (EN)</label>
                <input
                  type="text"
                  value={cmsState.contact.transitNotesEn}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    contact: { ...prev.contact, transitNotesEn: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Nota Transit & Parkir (BM)</label>
                <input
                  type="text"
                  value={cmsState.contact.transitNotesBm}
                  onChange={(e) => setCmsState(prev => ({
                    ...prev,
                    contact: { ...prev.contact, transitNotesBm: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. RESIDENT DOCTORS TAB */}
        {activeTab === 'doctors' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-subtle">
              Select which resident practitioners and clinical formulators appear on your public website showcase.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cmsState.doctors.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 border transition-all flex items-start justify-between gap-3 ${
                    doc.showOnWebsite ? 'border-brand bg-surface ring-1 ring-brand/10' : 'border-line bg-surface-muted/50 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">{doc.name}</p>
                      <span className="text-3xs font-mono px-1.5 py-0.2 bg-teal-50 text-accent border border-teal-200">
                        {doc.specialty}
                      </span>
                    </div>
                    <p className="text-2xs text-accent font-mono mt-0.5">{doc.title}</p>
                    <p className="text-2xs text-subtle mt-1">{doc.roleEn}</p>
                    <div className="flex items-center gap-3 text-3xs text-subtle mt-2 font-mono">
                      <span>{doc.mmcNumber}</span>
                      <span>•</span>
                      <span>{doc.languages}</span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={doc.showOnWebsite}
                      onChange={() => handleToggleDoctor(doc.id)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SERVICES & TARIFFS TAB */}
        {activeTab === 'services' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-subtle">
              Public services displayed on the home page with starting transparent price guidance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cmsState.services.map((svc) => (
                <div key={svc.id} className="p-4 border border-line bg-surface flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-ink">{svc.nameEn}</h4>
                      <span className="font-mono text-accent text-xs font-bold">
                        From RM {svc.priceFromRm.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-2xs text-accent font-medium mt-0.5">{svc.nameBm}</p>
                    <p className="text-2xs text-subtle mt-2 leading-relaxed">{svc.descEn}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-3xs text-subtle">
                    <span className="font-mono uppercase">{svc.category}</span>
                    <span className="text-emerald-700 font-bold">Public Bookable</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. INSURANCE PANELS TAB */}
        {activeTab === 'panels' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-subtle">
              Manage corporate insurance and Third Party Administrator (TPA) Guarantee Letters supported for cashless billing.
            </p>

            {/* Add Panel Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPanelInput}
                onChange={(e) => setNewPanelInput(e.target.value)}
                placeholder="Enter TPA or Corporate Insurance name (e.g. Allianz Corporate)..."
                className="flex-1 px-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink outline-none"
              />
              <button
                type="button"
                onClick={handleAddPanel}
                className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Panel
              </button>
            </div>

            {/* Panel Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {cmsState.tpaPanels.map((panel) => (
                <span
                  key={panel}
                  className="px-3 py-1.5 bg-surface-accent border border-line-subtle text-ink text-xs font-medium flex items-center gap-2 group"
                >
                  <span>{panel}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePanel(panel)}
                    className="text-subtle hover:text-rose-600 cursor-pointer"
                    title={`Remove ${panel}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 6. PATIENT FAQS TAB */}
        {activeTab === 'faqs' && (
          <div className="space-y-5 animate-fadeIn">
            <p className="text-xs text-subtle">
              Build interactive frequently asked questions (FAQs) to answer common patient queries directly on the home page.
            </p>

            {/* FAQ List */}
            <div className="space-y-3">
              {cmsState.faqs.map((faq, index) => (
                <div key={faq.id} className="p-4 border border-line bg-surface relative group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-3xs font-mono text-accent font-bold">FAQ #{index + 1} • {faq.category}</span>
                      <h4 className="text-xs font-bold text-ink">{faq.questionEn}</h4>
                      <p className="text-2xs text-muted font-medium">{faq.questionBm}</p>
                      <p className="text-2xs text-subtle mt-1.5 leading-relaxed">{faq.answerEn}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1.5 text-subtle hover:text-rose-600 border border-line-subtle bg-surface-muted cursor-pointer shrink-0"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New FAQ Form */}
            <div className="p-4 bg-surface-accent border border-line space-y-3">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-accent" />
                Add New Patient FAQ
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newFaqQEn}
                  onChange={(e) => setNewFaqQEn(e.target.value)}
                  placeholder="Question (English)..."
                  className="px-3 py-1.5 bg-surface border border-line-subtle text-xs text-ink outline-none"
                />
                <input
                  type="text"
                  value={newFaqQBm}
                  onChange={(e) => setNewFaqQBm(e.target.value)}
                  placeholder="Soalan (Bahasa Melayu)..."
                  className="px-3 py-1.5 bg-surface border border-line-subtle text-xs text-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea
                  rows={2}
                  value={newFaqAEn}
                  onChange={(e) => setNewFaqAEn(e.target.value)}
                  placeholder="Answer (English)..."
                  className="p-2.5 bg-surface border border-line-subtle text-xs text-ink outline-none"
                />
                <textarea
                  rows={2}
                  value={newFaqABm}
                  onChange={(e) => setNewFaqABm(e.target.value)}
                  placeholder="Jawapan (Bahasa Melayu)..."
                  className="p-2.5 bg-surface border border-line-subtle text-xs text-ink outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddFaq}
                disabled={!newFaqQEn.trim() || !newFaqAEn.trim()}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                Add FAQ Item
              </button>
            </div>
          </div>
        )}

        {/* SAVED TOAST */}
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Public website CMS configuration successfully published!</span>
          </div>
        )}

        {/* ACTION CONTROLS */}
        <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-surface hover:bg-surface-accent text-subtle text-xs font-bold border border-line flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Standard Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 border border-teal-500/30 cursor-pointer shadow-xs transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Publish Website Changes
          </button>
        </div>
      </div>

      {/* LIVE DEVICE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-line w-full max-w-5xl h-[85vh] flex flex-col rounded-none shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Bar */}
            <div className="bg-surface-muted px-4 py-3 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-ink">Live Patient-Facing Website Preview</span>
                <span className="text-3xs font-mono px-2 py-0.5 bg-teal-50 text-accent border border-teal-200">
                  {cmsState.hero.clinicName}
                </span>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center gap-1 border border-line bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 cursor-pointer ${previewViewport === 'desktop' ? 'bg-primary text-white' : 'text-subtle'}`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1.5 cursor-pointer ${previewViewport === 'tablet' ? 'bg-primary text-white' : 'text-subtle'}`}
                  title="Tablet Preview"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 cursor-pointer ${previewViewport === 'mobile' ? 'bg-primary text-white' : 'text-subtle'}`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-xs font-bold text-subtle hover:text-ink cursor-pointer"
              >
                Close Preview (✕)
              </button>
            </div>

            {/* Device Frame */}
            <div className="flex-1 bg-slate-900/10 p-4 overflow-y-auto flex justify-center">
              <div className={`bg-surface border border-line shadow-lg transition-all overflow-y-auto ${
                previewViewport === 'desktop' ? 'w-full' :
                previewViewport === 'tablet' ? 'w-[768px]' : 'w-[375px]'
              }`}>
                {/* Simulated Announcement */}
                {cmsState.announcement.enabled && (
                  <div className="bg-primary text-white py-1.5 px-4 text-center text-xs font-bold">
                    {cmsState.announcement.textEn}
                  </div>
                )}

                {/* Simulated Header */}
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <div>
                    <BrandName name={cmsState.hero.clinicName} className="font-bold text-sm text-ink block" accentClassName="text-accent" />
                    <span className="block text-2xs text-muted">{cmsState.hero.branchName}</span>
                  </div>
                  <span className="text-2xs font-mono font-bold text-accent bg-teal-50 px-2 py-1 border border-teal-200">
                    {cmsState.contact.phone}
                  </span>
                </div>

                {/* Simulated Hero */}
                <div className="p-8 text-center space-y-4 bg-teal-50/20 border-b border-line">
                  <span className="inline-block px-3 py-1 bg-surface-accent border border-line-subtle text-accent text-xs font-bold rounded-full">
                    {cmsState.hero.badgeEn}
                  </span>
                  <h1 className="text-xl md:text-2xl font-bold text-ink max-w-xl mx-auto">
                    {cmsState.hero.titleEn}
                  </h1>
                  <p className="text-xs text-muted max-w-lg mx-auto">
                    {cmsState.hero.subtitleEn}
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <span className="px-4 py-2 bg-primary text-white text-xs font-bold">
                      {cmsState.hero.ctaButtonEn}
                    </span>
                    <span className="px-4 py-2 bg-surface border border-line text-xs font-bold text-ink">
                      {cmsState.hero.secondaryCtaEn}
                    </span>
                  </div>
                </div>

                {/* Simulated Details Grid */}
                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-line text-xs">
                  <div>
                    <span className="font-bold text-ink block mb-1">Operating Hours</span>
                    <p className="text-2xs text-subtle">{cmsState.operatingHours.scheduleEn}</p>
                  </div>
                  <div>
                    <span className="font-bold text-ink block mb-1">Emergency 24/7</span>
                    <p className="text-2xs font-bold text-rose-700">{cmsState.contact.emergencyHotline}</p>
                  </div>
                  <div>
                    <span className="font-bold text-ink block mb-1">Address</span>
                    <p className="text-2xs text-subtle">{cmsState.contact.address}</p>
                  </div>
                </div>

                {/* Simulated Doctors */}
                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-xs text-ink uppercase tracking-wider">Resident Physicians</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cmsState.doctors.filter(d => d.showOnWebsite).map(d => (
                      <div key={d.id} className="p-3 border border-line-subtle bg-surface-muted text-xs">
                        <span className="font-bold text-ink block">{d.name}</span>
                        <span className="text-2xs text-accent font-mono block">{d.specialty} • {d.mmcNumber}</span>
                        <span className="text-3xs text-subtle">{d.languages}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
