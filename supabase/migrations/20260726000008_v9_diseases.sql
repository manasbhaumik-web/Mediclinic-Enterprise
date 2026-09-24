-- v9: Create diseases / ICD10 catalog table and insert 50 disease diagnoses

CREATE TABLE IF NOT EXISTS diseases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read diseases" ON diseases 
  FOR SELECT USING (true);

INSERT INTO diseases (code, description, category) VALUES
  ('J06.9', 'Acute upper respiratory infection, unspecified (Common Cold / URTI / Flu)', 'Infectious / Respiratory'),
  ('I10', 'Essential (primary) hypertension (HTN / High Blood Pressure)', 'Cardiovascular'),
  ('E11.9', 'Type 2 diabetes mellitus without complications (T2DM / Diabetes)', 'Endocrine / Metabolic'),
  ('K30', 'Dyspepsia / Acute Gastritis / Indigestion', 'Gastrointestinal'),
  ('A09.9', 'Gastroenteritis and colitis of infectious origin (Diarrhea / Food Poisoning)', 'Infectious'),
  ('M79.1', 'Myalgia (General Muscle Pain / Back Pain / Body Ache)', 'Musculoskeletal'),
  ('L20.9', 'Atopic dermatitis, unspecified (Eczema / Skin Rash / Allergy)', 'Dermatological'),
  ('Z02.7', 'Issue of medical certificate (General Health Screening & MC)', 'Administrative'),
  ('R50.9', 'Fever, unspecified (Pyrexia / Viral Fever)', 'General Symptoms'),
  ('J45.909', 'Unspecified asthma, uncomplicated (Asthma / Wheezing)', 'Respiratory'),
  ('G43.909', 'Migraine, unspecified, not intractable (Severe Headache / Migraine)', 'Neurological'),
  ('J30.9', 'Allergic rhinitis, unspecified (Sinusitis / Runny Nose)', 'Respiratory'),
  ('K21.9', 'Gastro-esophageal reflux disease without esophagitis (GERD / Acid Reflux)', 'Gastrointestinal'),
  ('A90', 'Dengue fever (classical dengue / Viral hemorrhagic fever)', 'Infectious'),
  ('H10.9', 'Unspecified conjunctivitis (Pink Eye / Eye Infection)', 'Ophthalmological'),
  ('N39.0', 'Urinary tract infection, site not specified (UTI / Dysuria)', 'Urological'),
  ('B01.9', 'Varicella without complication (Chickenpox)', 'Infectious'),
  ('E78.5', 'Hyperlipidemia, unspecified (High Cholesterol / Dyslipidemia)', 'Endocrine / Metabolic'),
  ('J02.9', 'Acute pharyngitis, unspecified (Sore Throat / Tonsillitis)', 'Respiratory'),
  ('M54.5', 'Low back pain (Lumbago / Mechanical Back Ache)', 'Musculoskeletal'),
  ('K29.7', 'Gastritis, unspecified (Stomach Ulcer / Epigastric Pain)', 'Gastrointestinal'),
  ('J20.9', 'Acute bronchitis, unspecified (Chest Cough / Bronchial Inflammation)', 'Respiratory'),
  ('L50.9', 'Urticaria, unspecified (Hives / Allergic Skin Reaction)', 'Dermatological'),
  ('F41.1', 'Generalized anxiety disorder (Anxiety / Stress Reaction)', 'Psychiatric'),
  ('F32.9', 'Major depressive disorder, single episode, unspecified (Depression)', 'Psychiatric'),
  ('H66.90', 'Otitis media, unspecified (Middle Ear Infection / Otalgia)', 'ENT'),
  ('H60.90', 'Otitis externa, unspecified (Swimmer’s Ear / Outer Ear Canal Infection)', 'ENT'),
  ('N18.9', 'Chronic kidney disease, unspecified (CKD / Renal Impairment)', 'Nephrology'),
  ('I25.10', 'Atherosclerotic heart disease of native coronary artery (Ischemic Heart Disease / CAD)', 'Cardiovascular'),
  ('I48.91', 'Unspecified atrial fibrillation (Arrhythmia / Palpitations)', 'Cardiovascular'),
  ('E03.9', 'Hypothyroidism, unspecified (Low Thyroid Hormone)', 'Endocrine / Metabolic'),
  ('E05.90', 'Thyrotoxicosis, unspecified without thyrotoxic crisis (Hyperthyroidism)', 'Endocrine / Metabolic'),
  ('K58.9', 'Irritable bowel syndrome without diarrhea (IBS / Abdominal Bloating)', 'Gastrointestinal'),
  ('M17.9', 'Osteoarthritis of knee, unspecified (Knee Joint Degeneration / Arthralgia)', 'Musculoskeletal'),
  ('M10.9', 'Gout, unspecified (Gouty Arthritis / Uric Acid Flare)', 'Musculoskeletal'),
  ('N20.1', 'Calculus of ureter (Kidney Stones / Renal Colic)', 'Urological'),
  ('L70.0', 'Acne vulgaris (Facial Acne / Papules)', 'Dermatological'),
  ('B35.3', 'Tinea pedis (Athlete’s Foot / Fungal Foot Infection)', 'Dermatological / Infectious'),
  ('B37.0', 'Candidal stomatitis (Oral Thrush / Fungal Stomatitis)', 'Infectious'),
  ('B02.9', 'Zoster without complications (Shingles / Herpes Zoster)', 'Infectious'),
  ('G44.209', 'Tension-type headache, unspecified (Tension Headache / Stress Headache)', 'Neurological'),
  ('H57.9', 'Unspecified disorder of eye and adnexa (Eye Strain / Dry Eye Syndrome)', 'Ophthalmological'),
  ('R42', 'Dizziness and giddiness (Vertigo / Motion Sickness)', 'Neurological'),
  ('R11.2', 'Nausea with vomiting, unspecified (Emesis / Motion Sickness)', 'Gastrointestinal'),
  ('R05.9', 'Cough, unspecified (Persistent Cough / Throat Irritation)', 'Respiratory'),
  ('Z00.00', 'Encounter for general adult medical examination without abnormal findings (Pre-employment / Annual Checkup)', 'Administrative'),
  ('Z23', 'Encounter for immunization (Vaccination / Flu Shot)', 'Administrative'),
  ('S93.409', 'Sprain of unspecified ligament of ankle (Ankle Sprain)', 'Trauma / Orthopedics'),
  ('S61.409', 'Unspecified open wound of hand (Laceration / Cut Wound)', 'Trauma'),
  ('T78.40', 'Allergy, unspecified (Food Allergy / Environmental Allergy)', 'Immunological')
ON CONFLICT (code) DO UPDATE SET 
  description = EXCLUDED.description,
  category = EXCLUDED.category;
