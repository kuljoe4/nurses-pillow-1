import { HealthcareProfessionEnum, HEALTHCARE_PROFESSIONS } from './professionConstants';

export interface RegistryLinkInfo {
  name: string;
  url: string;
  isCompactState: boolean;
  notes: string;
}

// Map known state boards to official primary-source verification portals
export const STATE_BOARD_REGISTRY_LINKS: Record<string, RegistryLinkInfo> = {
  'North Carolina (NCBON - Compact)': {
    name: 'North Carolina Board of Nursing (NCBON)',
    url: 'https://www.ncbon.com/licensure-listing-verify-a-license',
    isCompactState: true,
    notes: 'NC participates in the Nurse Licensure Compact (eNLC) and Nursys QuickConfirm.',
  },
  'Maryland (MBON - Compact)': {
    name: 'Maryland Board of Nursing (MBON)',
    url: 'https://mbon.maryland.gov/Pages/licensure-verification.aspx',
    isCompactState: true,
    notes: 'Maryland participates in the Nurse Licensure Compact (eNLC).',
  },
  'Connecticut (CT DPH)': {
    name: 'Connecticut Department of Public Health (eLicense)',
    url: 'https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx',
    isCompactState: false,
    notes: 'Connecticut individual state license verification portal.',
  },
  'North Dakota (NDBON - Compact)': {
    name: 'North Dakota Board of Nursing (NDBON)',
    url: 'https://www.ndbon.org/Verify/index.asp',
    isCompactState: true,
    notes: 'North Dakota participates in the Nurse Licensure Compact (eNLC).',
  },
  'Kansas (KSBN - Compact)': {
    name: 'Kansas State Board of Nursing (KSBN)',
    url: 'https://ksbn.kansas.gov/licensing/license-verification/',
    isCompactState: true,
    notes: 'Kansas participates in the Nurse Licensure Compact (eNLC).',
  },
  'California (BRN)': {
    name: 'California Board of Registered Nursing (Breeze / BRN)',
    url: 'https://search.dca.ca.gov/',
    isCompactState: false,
    notes: 'California BreEZe public license search.',
  },
  'Texas (BON - Compact)': {
    name: 'Texas Board of Nursing (BON)',
    url: 'https://www.bon.texas.gov/forms/rninq.asp',
    isCompactState: true,
    notes: 'Texas participates in the Nurse Licensure Compact (eNLC).',
  },
  'New York (NYSED)': {
    name: 'New York State Education Department (NYSED)',
    url: 'https://www.op.nysed.gov/verification-search',
    isCompactState: false,
    notes: 'New York State Office of the Professions registry.',
  },
  'Florida (FBN - Compact)': {
    name: 'Florida Board of Nursing (MQA)',
    url: 'https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthcareProviders',
    isCompactState: true,
    notes: 'Florida Medical Quality Assurance public lookup.',
  },
  'Washington (NCQAC)': {
    name: 'Washington Nursing Care Quality Assurance Commission',
    url: 'https://doh.wa.gov/licenses-permits-and-certificates/provider-credential-search',
    isCompactState: true,
    notes: 'Washington Department of Health Provider Credential Search.',
  },
  'Illinois (IDFPR)': {
    name: 'Illinois Department of Financial & Professional Regulation',
    url: 'https://ilesonline.idfpr.illinois.gov/DFPR/Lookup/LicenseLookup.aspx',
    isCompactState: false,
    notes: 'Illinois professional licensing search portal.',
  },
  'Massachusetts (BORN)': {
    name: 'Massachusetts Board of Registration in Nursing',
    url: 'https://checkahealthlicense.mass.gov/',
    isCompactState: false,
    notes: 'Massachusetts Health Professions License Verification.',
  },
  'Colorado (DORA - Compact)': {
    name: 'Colorado Division of Professions and Occupations (DORA)',
    url: 'https://dpo.colorado.gov/',
    isCompactState: true,
    notes: 'Colorado Nurse Licensure Compact member state.',
  },
  'Arizona (AZBN - Compact)': {
    name: 'Arizona State Board of Nursing (AZBN)',
    url: 'https://azbn.gov/license-verification',
    isCompactState: true,
    notes: 'Arizona Nurse Licensure Compact member state.',
  },
};

// Also index by 2-letter state codes for direct state lookups
const STATE_CODE_MAPPING: Record<string, string> = {
  NC: 'North Carolina (NCBON - Compact)',
  MD: 'Maryland (MBON - Compact)',
  CT: 'Connecticut (CT DPH)',
  ND: 'North Dakota (NDBON - Compact)',
  KS: 'Kansas (KSBN - Compact)',
  CA: 'California (BRN)',
  TX: 'Texas (BON - Compact)',
  NY: 'New York (NYSED)',
  FL: 'Florida (FBN - Compact)',
  WA: 'Washington (NCQAC)',
  IL: 'Illinois (IDFPR)',
  MA: 'Massachusetts (BORN)',
  CO: 'Colorado (DORA - Compact)',
  AZ: 'Arizona (AZBN - Compact)',
};

for (const [code, fullName] of Object.entries(STATE_CODE_MAPPING)) {
  if (STATE_BOARD_REGISTRY_LINKS[fullName]) {
    STATE_BOARD_REGISTRY_LINKS[code] = STATE_BOARD_REGISTRY_LINKS[fullName];
  }
}

// National primary source registries
export const NATIONAL_REGISTRIES = {
  nursys: {
    name: 'Nursys QuickConfirm (Multi-State eNLC Compact Licensure)',
    url: 'https://www.nursys.com/',
    description: 'Official national database for 40+ participating compact states for RN and LPN/LVN verification.',
  },
  fsmb: {
    name: 'Federation of State Medical Boards (FSMB DocInfo)',
    url: 'https://www.docinfo.org/',
    description: 'National physician and PA licensing registry database across all 50 states.',
  },
  nremt: {
    name: 'National Registry of Emergency Medical Technicians (NREMT)',
    url: 'https://www.nremt.org/',
    description: 'National certification lookup for Emergency Medical Technicians and Paramedics.',
  },
  nabp: {
    name: 'National Association of Boards of Pharmacy (NABP)',
    url: 'https://nabp.pharmacy/',
    description: 'Official national registry verification for Pharmacists and Pharmacy Technicians.',
  },
  Nursys: {
    name: 'Nursys QuickConfirm (Multi-State eNLC Compact Licensure)',
    url: 'https://www.nursys.com/',
    description: 'Official national database for 40+ participating compact states for RN and LPN/LVN verification.',
  },
  FSMB: {
    name: 'Federation of State Medical Boards (FSMB DocInfo)',
    url: 'https://www.docinfo.org/',
    description: 'National physician and PA licensing registry database across all 50 states.',
  },
  NREMT: {
    name: 'National Registry of Emergency Medical Technicians (NREMT)',
    url: 'https://www.nremt.org/',
    description: 'National certification lookup for Emergency Medical Technicians and Paramedics.',
  },
  NABP: {
    name: 'National Association of Boards of Pharmacy (NABP)',
    url: 'https://nabp.pharmacy/',
    description: 'Official national registry verification for Pharmacists and Pharmacy Technicians.',
  },
};

/**
 * Determine if a profession requires an active state license number (RN, MD, NP, PA, etc.)
 * vs a state registry certificate / document (CNA, EMT, medical assistant, etc.)
 */
export function isLicensedProfession(professionCodeOrLabel: string | undefined): boolean {
  if (!professionCodeOrLabel) return true; // Default to licensed flow
  const str = professionCodeOrLabel.toLowerCase();

  // Certified / allied checks take precedence
  if (
    str.includes('cna') ||
    str.includes('aide') ||
    str.includes('assistant') ||
    str.includes('tech') ||
    str.includes('emt') ||
    str.includes('paramedic') ||
    str.includes('phlebotomist') ||
    str.includes('medical assistant')
  ) {
    return false;
  }

  const licensedList: HealthcareProfessionEnum[] = [
    'RN',
    'LPN_LVN',
    'APRN_NP',
    'CRNA',
    'CNM',
    'MD_DO',
    'SURGEON',
    'PA',
    'PHARMACIST',
    'PT_OT',
    'DENTISTRY',
    'OPTOMETRY',
    'PODIATRY_CHIROPRACTIC',
  ];
  if (licensedList.includes(professionCodeOrLabel as HealthcareProfessionEnum)) {
    return true;
  }

  return (
    str.includes('nurse') ||
    str.includes('rn') ||
    str.includes('physician') ||
    str.includes('doctor') ||
    str.includes('practitioner') ||
    str.includes('therapist') ||
    str.includes('pharmacist')
  );
}

/**
 * Determine if a profession is certified / allied health registry-based
 */
export function isCertifiedOrAllied(professionCodeOrLabel: string | undefined): boolean {
  if (!professionCodeOrLabel) return false;
  return !isLicensedProfession(professionCodeOrLabel);
}

export interface CredentialConfig {
  credentialLabel: string;
  credentialPlaceholder: string;
  isDocumentRequired: boolean;
  requiresDocumentUpload: boolean;
  requiresLicenseNumber: boolean;
  documentHelpText: string;
  authorityLabel: string;
  stateBoardName?: string;
  stateBoardLink?: RegistryLinkInfo;
  nationalRegistryLink?: { name: string; url: string; description: string };
  primaryRegistryLink: { name: string; url: string; description: string };
}

export function getCredentialConfig(professionCodeOrLabel: string | undefined, stateBoardNameOrCode?: string): CredentialConfig {
  const isLicensed = isLicensedProfession(professionCodeOrLabel);
  const str = (professionCodeOrLabel || '').toLowerCase();
  const isNursing = str.includes('rn') || str.includes('nurse') || ['RN', 'LPN_LVN', 'APRN_NP', 'CRNA', 'CNM'].includes(professionCodeOrLabel as any);
  const isPhysician = str.includes('physician') || str.includes('md') || str.includes('doctor') || ['MD_DO', 'SURGEON', 'PA'].includes(professionCodeOrLabel as any);
  const isPharmacy = str.includes('pharmac') || ['PHARMACIST', 'PHARMACY_TECHNICIAN'].includes(professionCodeOrLabel as any);
  const isEMT = str.includes('emt') || str.includes('paramedic') || professionCodeOrLabel === 'EMT_PARAMEDIC';

  // Primary registry link
  let primaryNationalRegistry = NATIONAL_REGISTRIES.nursys;
  if (isPhysician) {
    primaryNationalRegistry = NATIONAL_REGISTRIES.fsmb;
  } else if (isPharmacy) {
    primaryNationalRegistry = NATIONAL_REGISTRIES.nabp;
  } else if (isEMT) {
    primaryNationalRegistry = NATIONAL_REGISTRIES.nremt;
  }

  let stateBoardInfo: RegistryLinkInfo | undefined;
  if (stateBoardNameOrCode) {
    stateBoardInfo = STATE_BOARD_REGISTRY_LINKS[stateBoardNameOrCode];
    if (!stateBoardInfo) {
      // Check partial match
      const foundKey = Object.keys(STATE_BOARD_REGISTRY_LINKS).find(k => k.toLowerCase().includes(stateBoardNameOrCode.toLowerCase()));
      if (foundKey) stateBoardInfo = STATE_BOARD_REGISTRY_LINKS[foundKey];
    }
  }

  let primaryRegistry = stateBoardInfo
    ? { name: stateBoardInfo.name, url: stateBoardInfo.url, description: stateBoardInfo.notes }
    : primaryNationalRegistry;

  if (isLicensed) {
    return {
      credentialLabel: isNursing
        ? 'Nursing License Number'
        : isPhysician
        ? 'Medical License Number'
        : 'State Professional License Number',
      credentialPlaceholder: isNursing
        ? 'e.g. RN-9482015-NC or 458921'
        : isPhysician
        ? 'e.g. ME-129482 or MD-88410'
        : 'e.g. LIC-928410',
      isDocumentRequired: false,
      requiresDocumentUpload: false,
      requiresLicenseNumber: true,
      documentHelpText: 'Optional: Uploading a license card or PDF verification speeds up approval.',
      authorityLabel: isNursing ? 'Issuing State Board of Nursing' : 'Issuing State Licensing Board',
      stateBoardName: stateBoardInfo?.name || (isNursing ? 'State Board of Nursing' : 'State Licensing Board'),
      stateBoardLink: stateBoardInfo,
      nationalRegistryLink: primaryNationalRegistry,
      primaryRegistryLink: primaryRegistry,
    };
  }

  // Certified / Allied health
  const isCna = str.includes('cna') || str.includes('aide') || professionCodeOrLabel === 'CNA';
  return {
    credentialLabel: isCna
      ? 'Nurse Aide Registry / Certification #'
      : 'State Registry / National Certification #',
    credentialPlaceholder: isCna
      ? 'e.g. CNA-109482 or NA-884210'
      : isEMT
      ? 'e.g. NREMT-984210'
      : 'e.g. CERT-498210',
    isDocumentRequired: true,
    requiresDocumentUpload: true,
    requiresLicenseNumber: false,
    documentHelpText: 'Required: Upload an official certification document, registry card, or employer credential.',
    authorityLabel: isCna ? 'State Nurse Aide Registry' : 'Issuing State or Certifying Agency',
    stateBoardName: isCna ? 'State Nurse Aide Registry' : 'Issuing State or Certifying Agency',
    stateBoardLink: stateBoardInfo,
    nationalRegistryLink: primaryNationalRegistry,
    primaryRegistryLink: primaryRegistry,
  };
}
