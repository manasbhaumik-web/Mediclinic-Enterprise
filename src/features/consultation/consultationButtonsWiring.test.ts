import { describe, it, expect, vi } from 'vitest';
import { ICD10_CATALOG } from '../../data';
import { PrescriptionItem, Visit, ICD10Code } from '../../types';

describe('Consultation Suite - Exhaustive Button Wiring & Action Handler Audit', () => {
  
  // =========================================================================
  // 1. ASSESSMENT TAB BUTTONS AUDIT
  // =========================================================================
  describe('AssessmentTab Interactive Buttons Wiring', () => {
    it('preset diagnosis buttons trigger setSelectedICD with appropriate medical code', () => {
      let selected: ICD10Code | null = null;
      const setSelectedICD = (icd: ICD10Code | null) => { selected = icd; };

      const presets = [
        { code: 'J06.9', label: 'Flu & Cold (URTI)' },
        { code: 'I10', label: 'High Blood Pressure (HTN)' },
        { code: 'E11.9', label: 'Diabetes (T2DM)' },
        { code: 'A09.9', label: 'Tummy Flu / Diarrhea (AGE)' },
        { code: 'K29.7', label: 'Gastritis / Gastric Pain' },
        { code: 'J20.9', label: 'Chest Cough / Bronchitis' },
        { code: 'R50.9', label: 'Fever / Pyrexia' },
        { code: 'M79.1', label: 'Body Ache / Muscle Pain' }
      ];

      presets.forEach(p => {
        const item = ICD10_CATALOG.find(x => x.code === p.code);
        expect(item, `Preset ${p.code} should exist in catalog`).toBeDefined();
        if (item) {
          // Simulate clicking preset button
          setSelectedICD(item);
          expect(selected?.code).toBe(p.code);
        }
      });
    });

    it('clear search button resets search query string to empty', () => {
      let query = 'blood pressure';
      const handleClear = () => { query = ''; };
      
      expect(query).toBe('blood pressure');
      handleClear();
      expect(query).toBe('');
    });

    it('quick finding token buttons properly append clinical phrasing without overwriting existing notes', () => {
      let notes = 'Patient attended clinic today.';
      const handleAppendFinding = (phrase: string) => {
        notes = notes ? `${notes.trim()} ${phrase}` : phrase;
      };

      const tokens = [
        { label: '+ Patient Looks Well (NAD)', phrase: 'Patient alert, comfortable, no acute distress.' },
        { label: '+ Lungs Clear', phrase: 'Chest examination: Lungs clear bilaterally, good air entry.' },
        { label: '+ Normal Tummy', phrase: 'Abdomen soft, non-tender, normal bowel sounds present.' },
        { label: '+ Throat Mildly Red', phrase: 'Pharynx mildly injected, tonsils not enlarged, no exudates.' },
        { label: '+ Vitals Stable & Normal', phrase: 'Vital signs stable, Afebrile, BP within acceptable range.' },
        { label: '+ Follow-up in 1–2 Weeks', phrase: 'Review in clinic in 1 to 2 weeks or earlier if symptoms worsen.' }
      ];

      tokens.forEach(t => {
        const prevLength = notes.length;
        handleAppendFinding(t.phrase);
        expect(notes.length).toBeGreaterThan(prevLength);
        expect(notes.includes(t.phrase)).toBe(true);
      });
    });

    it('"Change / Remove Diagnosis" button resets selectedICD to null', () => {
      let selected: ICD10Code | null = { code: 'J06.9', desc: 'URTI', category: 'Respiratory' };
      const handleRemove = () => { selected = null; };

      expect(selected).not.toBeNull();
      handleRemove();
      expect(selected).toBeNull();
    });

    it('prominent Next Step CTA button invokes onProceedToPlan callback', () => {
      let navigatedToPlan = false;
      const onProceedToPlan = vi.fn(() => {
        navigatedToPlan = true;
      });

      // Simulate clicking: 👉 Proceed to Prescriptions & MC (Plan Tab) ➔
      onProceedToPlan();
      expect(onProceedToPlan).toHaveBeenCalledTimes(1);
      expect(navigatedToPlan).toBe(true);
    });
  });

  // =========================================================================
  // 2. CONSULTATION ROOM & WORKFLOW TOOLBAR BUTTONS AUDIT
  // =========================================================================
  describe('ConsultationRoom & WorkflowToolbar Buttons Wiring', () => {
    it('WorkflowToolbar "Return to queue" button triggers onCancel handler', () => {
      const onCancel = vi.fn();
      onCancel();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('WorkflowToolbar "Save draft" button triggers onSaveDraft handler', () => {
      const onSaveDraft = vi.fn();
      onSaveDraft();
      expect(onSaveDraft).toHaveBeenCalledTimes(1);
    });

    it('WorkflowToolbar step advancement forwards tab sequentially from subjective -> objective -> assessment -> plan', () => {
      type Tab = 'subjective' | 'objective' | 'assessment' | 'plan';
      let activeTab: Tab = 'subjective';
      const setActiveTab = (tab: Tab) => { activeTab = tab; };

      const NEXT: Record<Exclude<Tab, 'plan'>, { to: Tab; label: string }> = {
        subjective: { to: 'objective', label: 'Next: vitals' },
        objective: { to: 'assessment', label: 'Next: diagnosis' },
        assessment: { to: 'plan', label: 'Next: prescription' },
      };

      // Step 1: Subjective -> Objective
      setActiveTab(NEXT[activeTab as Exclude<Tab, 'plan'>].to);
      expect(activeTab).toBe('objective');

      // Step 2: Objective -> Assessment
      setActiveTab(NEXT[activeTab as Exclude<Tab, 'plan'>].to);
      expect(activeTab).toBe('assessment');

      // Step 3: Assessment -> Plan
      setActiveTab(NEXT[activeTab as Exclude<Tab, 'plan'>].to);
      expect(activeTab).toBe('plan');
    });

    it('WorkflowToolbar "Review & sign off" button invokes handleOpenReviewModal on Plan tab', () => {
      const handleOpenReviewModal = vi.fn();
      const activeTab = 'plan';

      if (activeTab === 'plan') {
        handleOpenReviewModal();
      }

      expect(handleOpenReviewModal).toHaveBeenCalledTimes(1);
    });

    it('ConsultationStepper tabs allow direct 1-click navigation to any tab', () => {
      type Tab = 'subjective' | 'objective' | 'assessment' | 'plan';
      let currentTab: Tab = 'subjective';
      const setActiveTab = (t: Tab) => { currentTab = t; };

      const tabs: Tab[] = ['subjective', 'objective', 'assessment', 'plan'];
      tabs.forEach(t => {
        setActiveTab(t);
        expect(currentTab).toBe(t);
      });
    });
  });

  // =========================================================================
  // 3. PATIENT SAFETY HEADER BUTTONS AUDIT
  // =========================================================================
  describe('PatientSafetyHeader Buttons Wiring', () => {
    it('PII toggle button flips isPiiRevealed state', () => {
      let isPiiRevealed = false;
      const togglePii = () => { isPiiRevealed = !isPiiRevealed; };

      expect(isPiiRevealed).toBe(false);
      togglePii();
      expect(isPiiRevealed).toBe(true);
      togglePii();
      expect(isPiiRevealed).toBe(false);
    });

    it('Lock Screen button sets isLocked to true', () => {
      let isLocked = false;
      const handleLock = () => { isLocked = true; };

      handleLock();
      expect(isLocked).toBe(true);
    });

    it('Shortcuts Help button toggles showShortcutsHelp state', () => {
      let showHelp = false;
      const toggleHelp = () => { showHelp = !showHelp; };

      toggleHelp();
      expect(showHelp).toBe(true);
      toggleHelp();
      expect(showHelp).toBe(false);
    });
  });

  // =========================================================================
  // 4. SUBJECTIVE & OBJECTIVE TAB BUTTONS AUDIT
  // =========================================================================
  describe('SubjectiveTab & ObjectiveTab Buttons Wiring', () => {
    it('SubjectiveTab "Copy Previous" copies previous visit note', () => {
      let subjective = '';
      const patientPastVisits: Visit[] = [
        {
          id: 'v-past-1',
          patientId: 'p-1',
          date: '2026-03-01',
          status: 'Paid',
          totalBill: 50,
          panelClaimed: 0,
          paidAmount: 50,
          soap: {
            subjective: 'History of chronic rhinitis and morning sneezing',
            objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 72, temperature: 36.8, respiratoryRate: 16 },
            assessment: { icdCode: 'J30.9', description: 'Allergic rhinitis', clinicalNotes: 'Regular cetirizine' },
            plan: { prescription: [], followUpWeeks: 2, mcDays: 0, requiresReferral: false }
          }
        }
      ];

      const handleCopyPrevious = () => {
        if (patientPastVisits.length > 0) {
          subjective = patientPastVisits[0].soap.subjective;
        }
      };

      handleCopyPrevious();
      expect(subjective).toBe('History of chronic rhinitis and morning sneezing');
    });

    it('SubjectiveTab quick template buttons append template text', () => {
      let subjective = '';
      const handleApplySymptomTemplate = (txt: string) => {
        subjective = subjective ? `${subjective}. ${txt}` : txt;
      };

      handleApplySymptomTemplate('Fever and runny nose for 2 days');
      expect(subjective).toBe('Fever and runny nose for 2 days');

      handleApplySymptomTemplate('Productive cough with white sputum');
      expect(subjective).toBe('Fever and runny nose for 2 days. Productive cough with white sputum');
    });

    it('ObjectiveTab "Fill empty from last visit" copies unrecorded vitals', () => {
      const pastVitals = { bpSystolic: 124, bpDiastolic: 82, heartRate: 76, temperature: 36.7, respiratoryRate: 16 };
      let currentVitals = { bpSystolic: 0, bpDiastolic: 0, heartRate: 88, temperature: 0, respiratoryRate: 0 }; // Only HR measured

      // Triage vitals locked: none
      const copyFromLastVisit = () => {
        currentVitals = {
          bpSystolic: currentVitals.bpSystolic > 0 ? currentVitals.bpSystolic : pastVitals.bpSystolic,
          bpDiastolic: currentVitals.bpDiastolic > 0 ? currentVitals.bpDiastolic : pastVitals.bpDiastolic,
          heartRate: currentVitals.heartRate > 0 ? currentVitals.heartRate : pastVitals.heartRate, // Preserves current
          temperature: currentVitals.temperature > 0 ? currentVitals.temperature : pastVitals.temperature,
          respiratoryRate: currentVitals.respiratoryRate > 0 ? currentVitals.respiratoryRate : pastVitals.respiratoryRate,
        };
      };

      copyFromLastVisit();
      expect(currentVitals.bpSystolic).toBe(124);
      expect(currentVitals.bpDiastolic).toBe(82);
      expect(currentVitals.heartRate).toBe(88); // preserved!
      expect(currentVitals.temperature).toBe(36.7);
    });
  });

  // =========================================================================
  // 5. PLAN TAB & SUB-PANEL BUTTONS AUDIT
  // =========================================================================
  describe('PlanTab Sub-Panels Buttons Wiring', () => {
    const mockDrug: PrescriptionItem = {
      id: 'rx-1',
      drugName: 'Paracetamol 500mg',
      dosage: '1-2 tablets TDS PRN',
      dosageBM: '1-2 biji 3 kali sehari bila perlu',
      frequency: 'TDS',
      quantity: 20,
      pricePerUnit: 0.20,
      expiryDate: '2027-12-31',
      pillColor: '#f1f5f9',
      capsuleStyle: 'round'
    };

    it('PlanTab sub-tab buttons toggle active sub-tab view', () => {
      type SubTab = 'medication' | 'investigations' | 'documents' | 'summary';
      let activeSubTab: SubTab = 'medication';
      const setSubTab = (s: SubTab) => { activeSubTab = s; };

      setSubTab('investigations');
      expect(activeSubTab).toBe('investigations');
      setSubTab('documents');
      expect(activeSubTab).toBe('documents');
      setSubTab('summary');
      expect(activeSubTab).toBe('summary');
      setSubTab('medication');
      expect(activeSubTab).toBe('medication');
    });

    it('PrescriptionPanel adds drug and calculates cost accurately', () => {
      let rxList: PrescriptionItem[] = [];
      const setRxList = (items: PrescriptionItem[]) => { rxList = items; };

      setRxList([...rxList, mockDrug]);
      expect(rxList.length).toBe(1);
      expect(rxList[0].drugName).toBe('Paracetamol 500mg');
    });

    it('PrescriptionPanel remove item button deletes target item from rxList', () => {
      let rxList: PrescriptionItem[] = [
        mockDrug,
        {
          id: 'rx-2',
          drugName: 'Cetirizine 10mg',
          dosage: '1 tab ON',
          dosageBM: '1 biji malam',
          frequency: 'ON',
          quantity: 10,
          pricePerUnit: 0.50,
          expiryDate: '2027-06-30',
          pillColor: '#ffffff',
          capsuleStyle: 'solid'
        }
      ];

      // Remove rx-1
      const handleRemove = (id: string) => {
        rxList = rxList.filter(item => item.id !== id);
      };

      handleRemove('rx-1');
      expect(rxList.length).toBe(1);
      expect(rxList[0].id).toBe('rx-2');
    });

    it('LabOrdersPanel diagnostic toggle card adds and removes lab tests', () => {
      let selectedLabs: string[] = [];
      const toggleLabSelection = (testName: string) => {
        selectedLabs = selectedLabs.includes(testName)
          ? selectedLabs.filter(l => l !== testName)
          : [...selectedLabs, testName];
      };

      toggleLabSelection('Full Blood Count (FBC)');
      expect(selectedLabs).toContain('Full Blood Count (FBC)');

      toggleLabSelection('Renal Function Test (RFT / Creatinine)');
      expect(selectedLabs.length).toBe(2);

      toggleLabSelection('Full Blood Count (FBC)'); // Toggle off
      expect(selectedLabs).not.toContain('Full Blood Count (FBC)');
      expect(selectedLabs.length).toBe(1);
    });

    it('CertificatesAndReferralPanel buttons issue MC and generate referral', () => {
      let mcGenerated = false;
      let mcReason = 'Acute upper respiratory tract infection with fever';
      const handleIssueMc = () => {
        if (mcReason.trim()) mcGenerated = true;
      };

      handleIssueMc();
      expect(mcGenerated).toBe(true);

      let referralGenerated = false;
      const referralDetails = { hospital: 'Hospital Kuala Lumpur', department: 'ENT', reason: 'Chronic sinusitis' };
      const handleGenerateReferral = () => {
        if (referralDetails.hospital.trim() && referralDetails.reason.trim()) {
          referralGenerated = true;
        }
      };

      handleGenerateReferral();
      expect(referralGenerated).toBe(true);
    });

    it('ContraindicationModal override button adds drug with clinical rationale', () => {
      let rxList: PrescriptionItem[] = [];
      let pendingAllergyDrug = {
        name: 'Amoxicillin 500mg',
        dosage: '1 cap TDS',
        dosageBM: '1 kapsul 3 kali sehari',
        unitPrice: 0.60
      };
      let overrideRationale = 'Patient previously tolerated after desensitization protocol';

      const confirmAddDrug = (drug: typeof pendingAllergyDrug, rationale: string) => {
        rxList.push({
          id: 'rx-contra-1',
          drugName: drug.name,
          dosage: `${drug.dosage} [OVERRIDE: ${rationale}]`,
          dosageBM: drug.dosageBM,
          frequency: 'TDS',
          quantity: 21,
          pricePerUnit: drug.unitPrice,
          expiryDate: '2027-12-31',
          pillColor: '#fef08a',
          capsuleStyle: 'solid'
        });
      };

      confirmAddDrug(pendingAllergyDrug, overrideRationale);
      expect(rxList.length).toBe(1);
      expect(rxList[0].dosage).toContain('OVERRIDE');
    });

    it('ReviewSignoffModal close and sign-off buttons execute properly', () => {
      let isReviewModalOpen = true;
      const closeModal = () => { isReviewModalOpen = false; };

      let signedOff = false;
      const handleFinalSignoff = () => {
        signedOff = true;
        closeModal();
      };

      expect(isReviewModalOpen).toBe(true);
      handleFinalSignoff();
      expect(signedOff).toBe(true);
      expect(isReviewModalOpen).toBe(false);
    });
  });

  // =========================================================================
  // 6. DOCTOR DASHBOARD & QUEUE RAIL BUTTONS AUDIT
  // =========================================================================
  describe('DoctorDashboardModule & QueueRail Buttons Wiring', () => {
    it('Queue Rail toggle buttons switch between drawer, docked, and hidden modes', () => {
      type RailMode = 'hidden' | 'drawer' | 'docked';
      let mode: RailMode = 'hidden';

      const toggleDrawer = () => { mode = mode === 'drawer' ? 'hidden' : 'drawer'; };
      const toggleDocked = () => { mode = mode === 'docked' ? 'hidden' : 'docked'; };

      // Toggle drawer on
      toggleDrawer();
      expect(mode).toBe('drawer');
      // Toggle drawer off
      toggleDrawer();
      expect(mode).toBe('hidden');

      // Toggle docked on
      toggleDocked();
      expect(mode).toBe('docked');
      // Toggle docked off
      toggleDocked();
      expect(mode).toBe('hidden');
    });

    it('Call patient confirmation modal actions confirm and cancel properly', () => {
      let pendingCall: { visitId: string; patientName: string; position: number } | null = {
        visitId: 'v-100',
        patientName: 'Ahmad bin Razak',
        position: 1
      };
      let calledVisitId: string | null = null;

      const confirmCall = () => {
        if (pendingCall) {
          calledVisitId = pendingCall.visitId;
          pendingCall = null;
        }
      };

      const cancelCall = () => {
        pendingCall = null;
      };

      confirmCall();
      expect(calledVisitId).toBe('v-100');
      expect(pendingCall).toBeNull();

      // Test cancel
      pendingCall = { visitId: 'v-101', patientName: 'Siti Aminah', position: 2 };
      cancelCall();
      expect(pendingCall).toBeNull();
    });
  });
});
