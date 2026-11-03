export type HealthcareProfessionEnum =
  | 'RN'
  | 'LPN_LVN'
  | 'APRN_NP'
  | 'CRNA'
  | 'CNM'
  | 'CNA'
  | 'MD_DO'
  | 'PA'
  | 'SURGEON'
  | 'PHARMACIST'
  | 'PHARMACY_TECHNICIAN'
  | 'DENTISTRY'
  | 'PT_OT'
  | 'RESPIRATORY_THERAPIST'
  | 'IMAGING_SURGICAL_TECH'
  | 'LAB_PROFESSIONAL'
  | 'SPEECH_HEARING'
  | 'MENTAL_BEHAVIORAL_HEALTH'
  | 'EMT_PARAMEDIC'
  | 'NUTRITION_DIETETICS'
  | 'OPTOMETRY'
  | 'PODIATRY_CHIROPRACTIC'
  | 'REHAB_CLINICAL_SERVICES'
  | 'MEDICAL_ASSISTANT'
  | 'OTHER_ALLIED_HEALTH';

export interface ProfessionMapping {
  enumValue: HealthcareProfessionEnum;
  label: string;
  category: 'Nursing' | 'Advanced Practice Nursing' | 'Physicians & Surgeons' | 'Allied Health' | 'Therapy & Rehabilitation' | 'Pharmacy & Dental' | 'Other Healthcare Professionals';
}

export const HEALTHCARE_PROFESSIONS: ProfessionMapping[] = [
  { enumValue: 'RN', label: 'Registered Nurse (RN)', category: 'Nursing' },
  { enumValue: 'LPN_LVN', label: 'Licensed Practical/Vocational Nurse (LPN/LVN)', category: 'Nursing' },
  { enumValue: 'CNA', label: 'Certified Nursing Assistant (CNA)', category: 'Nursing' },
  { enumValue: 'APRN_NP', label: 'Nurse Practitioner (NP) / APRN', category: 'Advanced Practice Nursing' },
  { enumValue: 'CRNA', label: 'Certified Registered Nurse Anesthetist (CRNA)', category: 'Advanced Practice Nursing' },
  { enumValue: 'CNM', label: 'Certified Nurse-Midwife (CNM)', category: 'Advanced Practice Nursing' },
  { enumValue: 'MD_DO', label: 'Physician (MD/DO)', category: 'Physicians & Surgeons' },
  { enumValue: 'SURGEON', label: 'Surgeon', category: 'Physicians & Surgeons' },
  { enumValue: 'PA', label: 'Physician Assistant (PA)', category: 'Physicians & Surgeons' },
  { enumValue: 'RESPIRATORY_THERAPIST', label: 'Respiratory Therapist (RT)', category: 'Allied Health' },
  { enumValue: 'IMAGING_SURGICAL_TECH', label: 'Imaging / Surgical Technologist', category: 'Allied Health' },
  { enumValue: 'LAB_PROFESSIONAL', label: 'Medical Lab Professional', category: 'Allied Health' },
  { enumValue: 'EMT_PARAMEDIC', label: 'EMT / Paramedic', category: 'Allied Health' },
  { enumValue: 'MEDICAL_ASSISTANT', label: 'Medical Assistant (MA)', category: 'Allied Health' },
  { enumValue: 'PT_OT', label: 'Physical / Occupational Therapist', category: 'Therapy & Rehabilitation' },
  { enumValue: 'SPEECH_HEARING', label: 'Speech & Hearing Professional', category: 'Therapy & Rehabilitation' },
  { enumValue: 'MENTAL_BEHAVIORAL_HEALTH', label: 'Mental / Behavioral Health Professional', category: 'Therapy & Rehabilitation' },
  { enumValue: 'REHAB_CLINICAL_SERVICES', label: 'Other Rehab Clinical Services', category: 'Therapy & Rehabilitation' },
  { enumValue: 'PHARMACIST', label: 'Pharmacist', category: 'Pharmacy & Dental' },
  { enumValue: 'PHARMACY_TECHNICIAN', label: 'Pharmacy Technician', category: 'Pharmacy & Dental' },
  { enumValue: 'DENTISTRY', label: 'Dentist / Dental Professional', category: 'Pharmacy & Dental' },
  { enumValue: 'NUTRITION_DIETETICS', label: 'Dietitian / Nutritionist', category: 'Other Healthcare Professionals' },
  { enumValue: 'OPTOMETRY', label: 'Optometrist / Eye Care Professional', category: 'Other Healthcare Professionals' },
  { enumValue: 'PODIATRY_CHIROPRACTIC', label: 'Podiatrist / Chiropractor', category: 'Other Healthcare Professionals' },
  { enumValue: 'OTHER_ALLIED_HEALTH', label: 'Other Allied Health Professional', category: 'Other Healthcare Professionals' }
];

export const getProfessionLabel = (enumValue: string | undefined): string => {
  if (!enumValue) return 'Healthcare Professional';
  const mapping = HEALTHCARE_PROFESSIONS.find(p => p.enumValue === enumValue);
  return mapping ? mapping.label : enumValue;
};

export const getProfessionOptionsGroupedByCategory = () => {
  const groups = HEALTHCARE_PROFESSIONS.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = [];
    }
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, ProfessionMapping[]>);

  return Object.entries(groups).map(([category, professions]) => ({
    category,
    professions
  }));
};
