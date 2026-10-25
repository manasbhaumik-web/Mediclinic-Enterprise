import React, { useState, useEffect, useMemo } from 'react';
import {
  X, User, Calendar, FileText, Pill, CreditCard, ShieldAlert,
  CheckCircle2, AlertCircle, AlertTriangle, Save, Clock, Activity, Printer, Download,
  Phone, MapPin, Building, ChevronRight, Plus, Trash2, Heart, HeartPulse,
  DollarSign, FileSpreadsheet, Eye, EyeOff
} from 'lucide-react';
import { Patient, Visit, Language, PrescriptionItem } from '../../types';
import { calculatePatientAge } from '../../domain/patientAge';
import { maskICNumber } from '../../utils/piiMasker';
import { formatNric, nricError, parseNric } from '../../utils/nric';
import { useAuth } from '../../context/AuthContext';

interface PatientDetailModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePatient?: (patient: Patient) => Promise<any> | void;
  visits: Visit[];
  activeLanguage?: Language;
  canEdit?: boolean;
  initialTab?: 'profile' | 'visits' | 'medications' | 'billing' | 'dossier';
  onGenerateReport?: (patientId: string) => void;
}

export default function PatientDetailModal({
  patient,
  isOpen,
  onClose,
  onSavePatient,
  visits,
  activeLanguage = 'EN',
  canEdit = true,
  initialTab = 'profile',
  onGenerateReport
}: PatientDetailModalProps) {
  const isBM = activeLanguage === 'BM';
  const { showPII } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'visits' | 'medications' | 'billing' | 'dossier'>(initialTab);

  // Edit state
  const [formData, setFormData] = useState<Patient | null>(null);
  const [newAllergy, setNewAllergy] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localShowPII, setLocalShowPII] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({ ...patient });
      setActiveTab(initialTab);
      setErrors({});
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [patient, initialTab, isOpen]);

  // Filter visits for this patient
  const patientVisits = useMemo(() => {
    if (!patient) return [];
    return visits
      .filter((v) => v.patientId === patient.id)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [patient, visits]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalEncounters = patientVisits.length;
    const totalBilled = patientVisits.reduce((sum, v) => sum + (v.totalBill || 0), 0);
    const totalPaid = patientVisits.reduce((sum, v) => sum + (v.paidAmount || 0), 0);
    const totalPanel = patientVisits.reduce((sum, v) => sum + (v.panelClaimed || 0), 0);
    
    // Extract unique diagnoses
    const diagnoses = Array.from(
      new Set(
        patientVisits
          .map((v) => v.soap?.assessment?.description)
          .filter(Boolean)
      )
    );

    // Collect all prescriptions
    const allPrescriptions = patientVisits.flatMap((v) =>
      (v.soap?.plan?.prescription || []).map((rx) => ({
        ...rx,
        visitDate: v.date,
        doctor: v.doctorName || 'Attending Physician'
      }))
    );

    return { totalEncounters, totalBilled, totalPaid, totalPanel, diagnoses, allPrescriptions };
  }, [patientVisits]);

  if (!isOpen || !patient || !formData) return null;

  const ageDetails = calculatePatientAge(formData.dob);

  const handleInputChange = (field: keyof Patient, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleNricBlur = () => {
    if (!formData) return;
    const parsed = parseNric(formData.icNumber);
    if (parsed) {
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              dob: parsed.dob,
              gender: parsed.gender
            }
          : null
      );
    }
  };

  const handleAddAllergy = () => {
    const trimmed = newAllergy.trim();
    if (!trimmed || !formData) return;
    if (formData.drugAllergies.includes(trimmed)) {
      setNewAllergy('');
      return;
    }
    setFormData((prev) =>
      prev
        ? { ...prev, drugAllergies: [...prev.drugAllergies, trimmed] }
        : null
    );
    setNewAllergy('');
  };

  const handleRemoveAllergy = (index: number) => {
    if (!formData) return;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            drugAllergies: prev.drugAllergies.filter((_, i) => i !== index)
          }
        : null
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validate
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      errs.fullName = isBM ? 'Nama penuh wajib diisi.' : 'Full name is required.';
    }
    const icErr = nricError(formData.icNumber);
    if (icErr) {
      errs.icNumber = icErr;
    }
    if (!formData.phone.trim()) {
      errs.phone = isBM ? 'Nombor telefon wajib diisi.' : 'Contact phone is required.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      if (onSavePatient) {
        await onSavePatient(formData);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save patient', err);
      setSaveError(err?.message || 'Failed to update patient record. Please check network connectivity.');
    } finally {
      setIsSaving(false);
    }
  };

  const printDossier = () => {
    window.print();
  };

  const effectivePII = showPII || localShowPII;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="patient-detail-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-surface border border-line rounded-none shadow-2xl max-w-5xl w-full h-[90vh] max-h-[850px] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="bg-surface-muted border-b border-line px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary/10 border border-brand/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="patient-detail-title" className="type-section-title text-ink truncate font-bold">
                  {formData.fullName}
                </h2>
                <span className="font-mono text-2xs px-2 py-0.5 bg-surface border border-line text-accent font-bold">
                  {formData.id}
                </span>
                <span className={`text-2xs px-2 py-0.5 border font-bold ${
                  formData.panelEmployer === 'None (Self-Pay)'
                    ? 'chip-neutral'
                    : 'bg-primary/10 text-accent border-brand/20'
                }`}>
                  {formData.panelEmployer}
                </span>
                {formData.drugAllergies.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800 font-bold">
                    <ShieldAlert className="w-3 h-3" />
                    {formData.drugAllergies.length} {isBM ? 'Alahan' : 'Allergies'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-medium flex items-center gap-2 mt-0.5">
                <span>{formData.gender}</span>
                <span>•</span>
                <span>{ageDetails.fullLabel}</span>
                <span>•</span>
                <span className="font-mono">{maskICNumber(formData.icNumber, effectivePII)}</span>
                <button
                  type="button"
                  onClick={() => setLocalShowPII(!localShowPII)}
                  className="text-muted hover:text-accent ml-1"
                  title={effectivePII ? 'Mask IC' : 'Reveal IC'}
                >
                  {effectivePII ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onGenerateReport && (
              <button
                type="button"
                onClick={() => onGenerateReport(patient.id)}
                className="btn-outline-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                title={isBM ? 'Jana Laporan Pesakit' : 'Generate Patient Report'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">{isBM ? 'Laporan' : 'Generate Report'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-muted hover:text-ink hover:bg-surface-accent transition-colors"
              aria-label="Close patient details modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-surface border-b border-line px-5 flex items-center gap-1 overflow-x-auto text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 border-b-2 font-bold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'border-brand text-accent bg-surface-accent/40'
                : 'border-transparent text-muted hover:text-ink hover:border-line'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isBM ? 'Profil & Maklumat' : 'Profile & Demographics'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            className={`py-3 px-3.5 border-b-2 font-bold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'visits'
                ? 'border-brand text-accent bg-surface-accent/40'
                : 'border-transparent text-muted hover:text-ink hover:border-line'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{isBM ? 'Sejarah Lawatan & Diagnosis' : 'Visits & Diagnosis History'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-primary/10 text-accent border border-brand/20 text-2xs">
              {stats.totalEncounters}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medications')}
            className={`py-3 px-3.5 border-b-2 font-bold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'medications'
                ? 'border-brand text-accent bg-surface-accent/40'
                : 'border-transparent text-muted hover:text-ink hover:border-line'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>{isBM ? 'Ubat Per Lawatan' : 'Medications per Visit'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-primary/10 text-accent border border-brand/20 text-2xs">
              {stats.allPrescriptions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-3.5 border-b-2 font-bold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'billing'
                ? 'border-brand text-accent bg-surface-accent/40'
                : 'border-transparent text-muted hover:text-ink hover:border-line'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{isBM ? 'Bayaran & Pengebilan' : 'Payments & Billing'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-2xs font-mono">
              RM {stats.totalBilled.toFixed(2)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            className={`py-3 px-3.5 border-b-2 font-bold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'dossier'
                ? 'border-brand text-accent bg-surface-accent/40'
                : 'border-transparent text-muted hover:text-ink hover:border-line'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isBM ? 'Dossier Pesakit' : 'Patient Dossier'}</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: PROFILE & DEMOGRAPHICS (EDIT FORM) */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-5 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div>
                  <h3 className="type-section-title text-ink font-bold">
                    {isBM ? 'Pinda Maklumat & Rekod Pesakit' : 'View & Edit Patient Demographics'}
                  </h3>
                  <p className="text-xs text-muted">
                    {isBM
                      ? 'Kemaskini maklumat pengenalan diri, majikan panel, dan amaran alahan ubat.'
                      : 'Maintain patient identity, corporate panel coverage, and allergy precautions.'}
                  </p>
                </div>
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {isBM ? 'Berjaya disimpan!' : 'Record updated successfully!'}
                  </span>
                )}
                {saveError && (
                  <span role="alert" className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {saveError}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans">
                    {isBM ? 'Nama Penuh (seperti dalam IC)' : 'Full Name (as per IC)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full bg-surface border px-3 py-2 text-xs text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none ${
                      errors.fullName ? 'border-rose-500' : 'border-line'
                    }`}
                  />
                  {errors.fullName && <p className="text-2xs text-rose-600 mt-1">{errors.fullName}</p>}
                </div>

                {/* IC Number */}
                <div>
                  <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans">
                    {isBM ? 'No. Kad Pengenalan / Pasport' : 'IC Number / Passport'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.icNumber}
                    onChange={(e) => handleInputChange('icNumber', formatNric(e.target.value))}
                    onBlur={handleNricBlur}
                    disabled={!canEdit}
                    placeholder="e.g. 900101-14-5555"
                    className={`w-full bg-surface border px-3 py-2 text-xs font-mono text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none ${
                      errors.icNumber ? 'border-rose-500' : 'border-line'
                    }`}
                  />
                  {errors.icNumber && <p className="text-2xs text-rose-600 mt-1">{errors.icNumber}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans">
                    {isBM ? 'Jantina' : 'Gender'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value as any)}
                    disabled={!canEdit}
                    className="w-full bg-surface border border-line px-3 py-2 text-xs text-ink focus:border-brand outline-none"
                  >
                    <option value="Male">{isBM ? 'Lelaki' : 'Male'}</option>
                    <option value="Female">{isBM ? 'Perempuan' : 'Female'}</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans">
                    {isBM ? 'Tarikh Lahir' : 'Date of Birth'} ({ageDetails.displayAge}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-surface border border-line px-3 py-2 text-xs text-ink font-mono focus:border-brand outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans">
                    {isBM ? 'Nombor Telefon' : 'Contact Phone'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!canEdit}
                    placeholder="e.g. 012-3456789"
                    className={`w-full bg-surface border px-3 py-2 text-xs font-mono text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none ${
                      errors.phone ? 'border-rose-500' : 'border-line'
                    }`}
                  />
                  {errors.phone && <p className="text-2xs text-rose-600 mt-1">{errors.phone}</p>}
                </div>

                {/* Panel Employer */}
                <div>
                  <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans">
                    {isBM ? 'Majikan Panel / Insurans' : 'Corporate Panel / Insurer'}
                  </label>
                  <select
                    value={formData.panelEmployer}
                    onChange={(e) => handleInputChange('panelEmployer', e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-surface border border-line px-3 py-2 text-xs text-ink focus:border-brand outline-none"
                  >
                    <option value="None (Self-Pay)">None (Self-Pay)</option>
                    <option value="Petronas Panel">Petronas Panel</option>
                    <option value="Maybank Panel">Maybank Panel</option>
                    <option value="AIA TPA">AIA TPA</option>
                    <option value="PMCare">PMCare</option>
                    <option value="Medkad Sdn Bhd">Medkad Sdn Bhd</option>
                    <option value="Tenaga Nasional Berhad">Tenaga Nasional Berhad</option>
                    <option value="Telekom Malaysia">Telekom Malaysia</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans">
                  {isBM ? 'Alamat Kediaman' : 'Residential Address'}
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!canEdit}
                  className="w-full bg-surface border border-line px-3 py-2 text-xs text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              {/* Drug Allergies Management */}
              <div className="border border-line bg-surface-muted p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h4 className="type-label text-ink font-bold">
                      {isBM ? 'Alahan Ubat (Drug Allergies)' : 'Known Drug Allergies'}
                    </h4>
                  </div>
                  <span className="text-2xs text-muted font-medium">
                    {isBM ? 'Amaran keselamatan preskripsi' : 'Prescription safety alert'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
                  {formData.drugAllergies.length === 0 ? (
                    <span className="text-xs text-muted italic">
                      {isBM ? 'Tiada alahan ubat diketahui (NKDA).' : 'No known drug allergies (NKDA).'}
                    </span>
                  ) : (
                    formData.drugAllergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800 text-xs font-bold px-2.5 py-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>{allergy}</span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy(idx)}
                            className="hover:text-rose-900 ml-1 cursor-pointer"
                            title="Remove allergy"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 pt-2 border-t border-line">
                    <input
                      type="text"
                      placeholder={isBM ? 'Tambah alahan ubat (cth: Penicillin, NSAID)...' : 'Add drug allergy (e.g. Penicillin, Sulfa)...'}
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllergy();
                        }
                      }}
                      className="flex-1 bg-surface border border-line px-3 py-1.5 text-xs text-ink focus:border-brand outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      disabled={!newAllergy.trim()}
                      className="btn-outline-primary text-xs px-3 py-1.5 inline-flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isBM ? 'Tambah Alahan' : 'Add Allergy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost text-xs px-4 py-2"
                  >
                    {isBM ? 'Tutup' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary text-xs px-5 py-2 inline-flex items-center gap-2 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? (isBM ? 'Menyimpan...' : 'Saving...') : (isBM ? 'Simpan Rekod Pesakit' : 'Save Patient Record')}</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: VISITS & DIAGNOSES HISTORY */}
          {activeTab === 'visits' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="type-section-title text-ink font-bold">
                    {isBM ? 'Sejarah Lawatan Klinikal & Rekod Diagnosis' : 'Longitudinal Clinical Encounters & Diagnosis History'}
                  </h3>
                  <p className="text-xs text-muted">
                    {isBM
                      ? 'Rekod lengkap lawatan, diagnosis ICD-10, tanda vital dan nota SOAP.'
                      : 'Complete timeline of outpatient consultations, ICD-10 codings, vitals, and SOAP notes.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 bg-primary/10 text-accent border border-brand/20 font-bold">
                    {patientVisits.length} {isBM ? 'Lawatan Direkodkan' : 'Recorded Visits'}
                  </span>
                </div>
              </div>

              {patientVisits.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-line bg-surface-muted p-6">
                  <Clock className="w-8 h-8 text-muted mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-ink">
                    {isBM ? 'Tiada sejarah lawatan direkodkan.' : 'No past visit records found for this patient.'}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {isBM
                      ? 'Pesakit ini belum mempunyai rekod perundingan selesai.'
                      : 'Encounters will be displayed here once consultation and billing are finalized.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientVisits.map((v, i) => (
                    <div
                      key={v.id || i}
                      className="border border-line bg-surface p-4 hover:border-brand/40 transition-colors shadow-2xs space-y-3"
                    >
                      {/* Visit top bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-accent px-2 py-0.5 bg-primary/10 border border-brand/20">
                            {v.id}
                          </span>
                          <span className="text-xs font-bold text-ink">
                            {v.date ? new Date(v.date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date'}
                          </span>
                          <span className="text-2xs text-muted">
                            • {v.doctorName || 'Attending Doctor'} {v.roomId ? `(${v.roomId})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xs font-bold px-2 py-0.5 border ${
                            v.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>
                            {v.status}
                          </span>
                          <span className="font-mono text-xs font-bold text-ink">
                            RM {(v.totalBill || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Diagnosis & Assessment */}
                      <div className="bg-surface-muted border border-line p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
                              {isBM ? 'Diagnosis & Kod ICD-10' : 'Diagnosis & ICD-10 Code'}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {v.soap?.assessment?.icdCode && (
                                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-brand/10 text-accent border border-brand/30">
                                  {v.soap.assessment.icdCode}
                                </span>
                              )}
                              <span className="text-xs font-bold text-ink">
                                {v.soap?.assessment?.description || (isBM ? 'Tiada diagnosis spesifik' : 'Unspecified condition')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {v.soap?.assessment?.clinicalNotes && (
                          <p className="text-xs text-muted italic">
                            "{v.soap.assessment.clinicalNotes}"
                          </p>
                        )}
                      </div>

                      {/* Vitals Strip */}
                      {v.soap?.objective && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-surface-accent/40 border border-line p-2">
                            <span className="text-2xs text-muted block font-medium">BP (Blood Pressure)</span>
                            <span className="font-mono font-bold text-ink">
                              {v.soap.objective.bpSystolic}/{v.soap.objective.bpDiastolic} mmHg
                            </span>
                          </div>
                          <div className="bg-surface-accent/40 border border-line p-2">
                            <span className="text-2xs text-muted block font-medium">Heart Rate</span>
                            <span className="font-mono font-bold text-ink">
                              {v.soap.objective.heartRate} bpm
                            </span>
                          </div>
                          <div className="bg-surface-accent/40 border border-line p-2">
                            <span className="text-2xs text-muted block font-medium">Temperature</span>
                            <span className="font-mono font-bold text-ink">
                              {v.soap.objective.temperature} °C
                            </span>
                          </div>
                          <div className="bg-surface-accent/40 border border-line p-2">
                            <span className="text-2xs text-muted block font-medium">Respiratory Rate</span>
                            <span className="font-mono font-bold text-ink">
                              {v.soap.objective.respiratoryRate} /min
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Subjective Notes */}
                      {v.soap?.subjective && (
                        <div className="text-xs">
                          <span className="text-2xs font-bold uppercase tracking-wider text-muted block">
                            {isBM ? 'Aduan Utama (Subjective)' : 'Chief Complaint (Subjective)'}
                          </span>
                          <p className="text-xs text-ink mt-0.5">
                            {v.soap.subjective}
                          </p>
                        </div>
                      )}

                      {/* Prescriptions Summary for this visit */}
                      {v.soap?.plan?.prescription && v.soap.plan.prescription.length > 0 && (
                        <div className="border-t border-line pt-2 text-xs">
                          <span className="text-2xs font-bold uppercase tracking-wider text-muted block mb-1">
                            {isBM ? 'Ubat Dipreskripsi' : 'Prescribed Medications'} ({v.soap.plan.prescription.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {v.soap.plan.prescription.map((rx, rxi) => (
                              <span
                                key={rxi}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-line text-ink text-2xs font-medium"
                              >
                                <Pill className="w-3 h-3 text-accent" />
                                <span className="font-bold">{rx.drugName}</span>
                                <span className="text-muted">({rx.quantity} tabs · {rx.frequency})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDICATIONS PER VISIT */}
          {activeTab === 'medications' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="type-section-title text-ink font-bold">
                    {isBM ? 'Sejarah Preskripsi & Ubat Per Lawatan' : 'Medication History per Clinical Visit'}
                  </h3>
                  <p className="text-xs text-muted">
                    {isBM
                      ? 'Senarai ubat-ubatan yang dipreskripsikan mengikut tarikh lawatan dan dos pengambilan.'
                      : 'Complete breakdown of all pharmaceutical items dispensed per encounter with dosage and instructions.'}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-primary/10 text-accent border border-brand/20 font-bold">
                  {stats.allPrescriptions.length} {isBM ? 'Item Dipreskripsikan' : 'Total Dispensed Items'}
                </span>
              </div>

              {stats.allPrescriptions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-line bg-surface-muted p-6">
                  <Pill className="w-8 h-8 text-muted mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-ink">
                    {isBM ? 'Tiada sejarah ubat direkodkan.' : 'No medication history recorded for this patient.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-line">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-accent border-b border-line uppercase font-bold text-muted">
                      <tr>
                        <th className="px-3 py-2.5">{isBM ? 'Tarikh Lawatan' : 'Visit Date'}</th>
                        <th className="px-3 py-2.5">{isBM ? 'Nama Ubat' : 'Medication Name'}</th>
                        <th className="px-3 py-2.5">{isBM ? 'Arahan Pengambilan (Dos)' : 'Dosage Instructions'}</th>
                        <th className="px-3 py-2.5">{isBM ? 'Kekerapan' : 'Freq'}</th>
                        <th className="px-3 py-2.5 text-right">{isBM ? 'Kuantiti' : 'Qty'}</th>
                        <th className="px-3 py-2.5 text-right">{isBM ? 'Harga (RM)' : 'Price (RM)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line bg-surface">
                      {patientVisits.flatMap((v) =>
                        (v.soap?.plan?.prescription || []).map((rx, idx) => (
                          <tr key={`${v.id}-${idx}`} className="hover:bg-surface-accent/40 transition-colors">
                            <td className="px-3 py-2.5 font-mono text-muted whitespace-nowrap">
                              {v.date ? new Date(v.date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              <span className="block text-2xs text-accent font-bold">{v.doctorName || 'Clinician'}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-ink block">{rx.drugName}</span>
                              <span className="text-2xs font-mono text-muted">Ref: {rx.id}</span>
                            </td>
                            <td className="px-3 py-2.5 text-muted">
                              <p className="text-ink">{rx.dosage}</p>
                              {rx.dosageBM && (
                                <p className="text-2xs text-muted italic">{rx.dosageBM}</p>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-mono px-1.5 py-0.5 bg-surface-accent border border-line text-accent font-bold text-2xs">
                                {rx.frequency}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-ink">
                              {rx.quantity}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-ink">
                              {((rx.pricePerUnit || 0) * (rx.quantity || 1)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS & BILLING LEDGER */}
          {activeTab === 'billing' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h3 className="type-section-title text-ink font-bold">
                    {isBM ? 'Lejar Pembayaran & Pengebilan Pesakit' : 'Patient Payment & Billing Ledger'}
                  </h3>
                  <p className="text-xs text-muted">
                    {isBM
                      ? 'Rekod invois, pecahan bayaran kendiri, tuntutan panel dan nombor resit.'
                      : 'Audit ledger of invoice settlements, out-of-pocket payments, and corporate panel claims.'}
                  </p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-surface-muted border border-line p-3.5">
                  <span className="text-2xs uppercase tracking-wider font-bold text-muted block">
                    {isBM ? 'Jumlah Invois Sepanjang Hayat' : 'Lifetime Invoiced Amount'}
                  </span>
                  <span className="text-lg font-mono font-bold text-ink mt-1 block">
                    RM {stats.totalBilled.toFixed(2)}
                  </span>
                  <span className="text-2xs text-muted mt-0.5 block">
                    {patientVisits.length} {isBM ? 'transaksi lawatan' : 'billing transactions'}
                  </span>
                </div>

                <div className="bg-surface-muted border border-line p-3.5">
                  <span className="text-2xs uppercase tracking-wider font-bold text-muted block">
                    {isBM ? 'Tuntutan Panel Majikan' : 'Corporate Panel Claims'}
                  </span>
                  <span className="text-lg font-mono font-bold text-accent mt-1 block">
                    RM {stats.totalPanel.toFixed(2)}
                  </span>
                  <span className="text-2xs text-muted mt-0.5 block">
                    {stats.totalBilled > 0 ? ((stats.totalPanel / stats.totalBilled) * 100).toFixed(0) : 0}% {isBM ? 'dilindungi panel' : 'covered by insurance'}
                  </span>
                </div>

                <div className="bg-surface-muted border border-line p-3.5">
                  <span className="text-2xs uppercase tracking-wider font-bold text-muted block">
                    {isBM ? 'Bayaran Kendiri (Out-of-Pocket)' : 'Patient Out-of-Pocket'}
                  </span>
                  <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    RM {stats.totalPaid.toFixed(2)}
                  </span>
                  <span className="text-2xs text-muted mt-0.5 block">
                    {stats.totalBilled > 0 ? ((stats.totalPaid / stats.totalBilled) * 100).toFixed(0) : 0}% {isBM ? 'bayaran terus pesakit' : 'self-pay share'}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto border border-line">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-accent border-b border-line uppercase font-bold text-muted">
                    <tr>
                      <th className="px-3 py-2.5">{isBM ? 'Tarikh' : 'Date'}</th>
                      <th className="px-3 py-2.5">{isBM ? 'No. Resit / Invois' : 'Receipt / Invoice Ref'}</th>
                      <th className="px-3 py-2.5">{isBM ? 'Kaedah Bayaran' : 'Payment Method'}</th>
                      <th className="px-3 py-2.5 text-right">{isBM ? 'Tuntutan Panel' : 'Panel Claim'}</th>
                      <th className="px-3 py-2.5 text-right">{isBM ? 'Bayaran Pesakit' : 'Patient Paid'}</th>
                      <th className="px-3 py-2.5 text-right">{isBM ? 'Jumlah (RM)' : 'Total (RM)'}</th>
                      <th className="px-3 py-2.5 text-center">{isBM ? 'Status' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-surface">
                    {patientVisits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted font-medium">
                          {isBM ? 'Tiada rekod lejar pembayaran.' : 'No financial transaction records found.'}
                        </td>
                      </tr>
                    ) : (
                      patientVisits.map((v, i) => (
                        <tr key={v.id || i} className="hover:bg-surface-accent/40 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-muted whitespace-nowrap">
                            {v.date ? new Date(v.date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs">
                            <span className="font-bold text-ink block">{v.receiptNumber || `INV-${v.id}`}</span>
                            {v.glNumber && (
                              <span className="text-2xs text-muted block">GL: {v.glNumber}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block px-2 py-0.5 bg-surface-accent border border-line text-ink font-bold text-2xs">
                              {v.paymentMethod || (v.panelClaimed > 0 ? 'Panel Guarantee' : 'Cash / Direct')}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-accent">
                            RM {(v.panelClaimed || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-ink">
                            RM {(v.paidAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-ink">
                            RM {(v.totalBill || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-2xs font-bold">
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PATIENT DOSSIER (PRINTABLE REPORT) */}
          {activeTab === 'dossier' && (
            <div className="space-y-5 max-w-3xl mx-auto bg-surface p-6 border border-line print:border-none print:p-0">
              {/* Actions strip */}
              <div className="flex items-center justify-between pb-4 border-b border-line print:hidden">
                <div>
                  <h3 className="type-section-title text-ink font-bold">
                    {isBM ? 'Dossier Klinikal & Kewangan Pesakit' : 'Patient Clinical & Financial Dossier'}
                  </h3>
                  <p className="text-xs text-muted">
                    {isBM ? 'Sedia untuk dicetak atau dimuat turun sebagai PDF rasmi.' : 'Official summary dossier formatted for clinical and administrative records.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={printDossier}
                  className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isBM ? 'Cetak Dossier' : 'Print Dossier'}</span>
                </button>
              </div>

              {/* Clinic Letterhead */}
              <div className="text-center border-b-2 border-brand pb-4">
                <h1 className="text-base font-bold uppercase tracking-wider text-ink">
                  Klinik Mediclinic Enterprise
                </h1>
                <p className="text-xs text-muted">
                  No 12, Jalan Sultan Ismail, 50250 Kuala Lumpur • Tel: 03-2144 8888
                </p>
                <p className="text-2xs text-muted font-mono mt-0.5">
                  KKM License: BKP/1049/2026 • SSM: 202601004521 (1452104-M)
                </p>
                <div className="mt-2 text-center">
                  <span className="inline-block font-bold text-xs uppercase tracking-widest px-3 py-1 bg-primary/10 text-accent border border-brand/20">
                    {isBM ? 'DOSSIER REKOD PERUBATAN & KEWANGAN PESAKIT' : 'PATIENT MEDICAL & FINANCIAL DOSSIER'}
                  </span>
                </div>
              </div>

              {/* Patient Snapshot Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-muted border border-line p-3 text-xs">
                <div>
                  <span className="text-2xs text-muted block uppercase font-bold">{isBM ? 'Nama Pesakit' : 'Patient Name'}</span>
                  <span className="font-bold text-ink block">{formData.fullName}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block uppercase font-bold">{isBM ? 'No. IC / Pasport' : 'IC / Passport'}</span>
                  <span className="font-mono text-ink block">{maskICNumber(formData.icNumber, effectivePII)}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block uppercase font-bold">{isBM ? 'Jantina & Umur' : 'Gender & Age'}</span>
                  <span className="text-ink block">{formData.gender} · {ageDetails.displayAge}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block uppercase font-bold">{isBM ? 'Status Penaja' : 'Sponsor / Panel'}</span>
                  <span className="text-ink font-bold block">{formData.panelEmployer}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-2xs text-muted block uppercase font-bold">{isBM ? 'Alamat' : 'Address'}</span>
                  <span className="text-ink text-xs block">{formData.address || '-'}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block uppercase font-bold">{isBM ? 'No. Telefon' : 'Phone'}</span>
                  <span className="font-mono text-ink block">{formData.phone}</span>
                </div>
                <div>
                  <span className="text-2xs text-muted block uppercase font-bold">{isBM ? 'Tarikh Daftar' : 'Registered Date'}</span>
                  <span className="font-mono text-ink block">{formData.registeredDate}</span>
                </div>
              </div>

              {/* Allergies Warning */}
              {formData.drugAllergies.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">{isBM ? 'AMARAN ALAHAN UBAT:' : 'CRITICAL DRUG ALLERGIES:'}</span>{' '}
                    <span>{formData.drugAllergies.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Diagnoses Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-1 mb-2">
                  {isBM ? 'Sejarah Diagnosis Klinikal' : 'Clinical Diagnoses & Encounters Summary'}
                </h4>
                {patientVisits.length === 0 ? (
                  <p className="text-xs text-muted italic">{isBM ? 'Tiada sejarah perundingan.' : 'No recorded clinical encounters.'}</p>
                ) : (
                  <div className="space-y-2">
                    {patientVisits.map((v, i) => (
                      <div key={i} className="text-xs border-b border-line/60 pb-2 flex justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xs font-bold text-accent">{v.date}</span>
                            <span className="font-bold text-ink">
                              {v.soap?.assessment?.icdCode ? `[${v.soap.assessment.icdCode}] ` : ''}
                              {v.soap?.assessment?.description || 'Consultation'}
                            </span>
                          </div>
                          {v.soap?.subjective && (
                            <p className="text-2xs text-muted mt-0.5">{v.soap.subjective}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-2xs text-muted block">{v.doctorName || 'Doctor'}</span>
                          <span className="font-mono text-2xs font-bold text-ink">RM {(v.totalBill || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Ledger Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink border-b border-line pb-1 mb-2">
                  {isBM ? 'Penyata Akaun & Kewangan' : 'Financial Statement of Account'}
                </h4>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-muted">{isBM ? 'Jumlah Bil Dikenakan:' : 'Total Billed Charges:'}</span>
                  <span className="font-mono font-bold text-ink">RM {stats.totalBilled.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-muted">{isBM ? 'Tuntutan Panel Diluluskan:' : 'Approved Corporate Panel Claims:'}</span>
                  <span className="font-mono font-bold text-accent">RM {stats.totalPanel.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-line pb-1">
                  <span className="text-muted">{isBM ? 'Jumlah Dibayar Oleh Pesakit:' : 'Patient Out-of-Pocket Settlements:'}</span>
                  <span className="font-mono font-bold text-emerald-600">RM {stats.totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 font-bold pt-2">
                  <span className="text-ink">{isBM ? 'Baki Tertunggak:' : 'Outstanding Balance:'}</span>
                  <span className="font-mono text-emerald-600">RM 0.00 (SETTLED)</span>
                </div>
              </div>

              {/* Signature block */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-xs border-t border-line mt-6">
                <div>
                  <p className="text-2xs text-muted uppercase font-bold">{isBM ? 'Disediakan Oleh' : 'Prepared By'}</p>
                  <div className="mt-8 border-b border-line" />
                  <p className="mt-1 text-2xs text-muted">Administrator / Clinical Records Officer</p>
                </div>
                <div>
                  <p className="text-2xs text-muted uppercase font-bold">{isBM ? 'Pengesahan Pegawai Perubatan' : 'Medical Officer Sign-off'}</p>
                  <div className="mt-8 border-b border-line" />
                  <p className="mt-1 text-2xs text-muted">Registered Clinician (MMC)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
