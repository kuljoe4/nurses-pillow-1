import { describe, it, expect } from 'vitest';
import {
  isLicensedProfession,
  isCertifiedOrAllied,
  getCredentialConfig,
  STATE_BOARD_REGISTRY_LINKS,
  NATIONAL_REGISTRIES,
} from '../registryLinks';

describe('registryLinks and Credential Configuration', () => {
  it('correctly classifies licensed professions', () => {
    expect(isLicensedProfession('Registered Nurse (RN)')).toBe(true);
    expect(isLicensedProfession('Nurse Practitioner (NP)')).toBe(true);
    expect(isLicensedProfession('Physician (MD/DO)')).toBe(true);
    expect(isLicensedProfession('Physical Therapist (PT)')).toBe(true);
    expect(isLicensedProfession('RN')).toBe(true);
  });

  it('correctly classifies certified and allied health professions', () => {
    expect(isCertifiedOrAllied('Certified Nursing Assistant (CNA)')).toBe(true);
    expect(isCertifiedOrAllied('Surgical Tech (CST)')).toBe(true);
    expect(isCertifiedOrAllied('Radiology Tech (ARRT)')).toBe(true);
    expect(isCertifiedOrAllied('Paramedic / EMT')).toBe(true);
    expect(isCertifiedOrAllied('Phlebotomist')).toBe(true);
    expect(isCertifiedOrAllied('CNA')).toBe(true);
  });

  it('returns state board link and Nursys national registry for RN', () => {
    const config = getCredentialConfig('Registered Nurse (RN)', 'NC');
    expect(config.requiresLicenseNumber).toBe(true);
    expect(config.requiresDocumentUpload).toBe(false);
    expect(config.nationalRegistryLink).toEqual(NATIONAL_REGISTRIES.Nursys);
    expect(config.stateBoardLink).toEqual(STATE_BOARD_REGISTRY_LINKS['NC']);
  });

  it('returns appropriate verification requirements for CNA', () => {
    const config = getCredentialConfig('Certified Nursing Assistant (CNA)', 'NC');
    expect(config.requiresDocumentUpload).toBe(true);
    expect(config.requiresLicenseNumber).toBe(false);
    expect(config.stateBoardName).toContain('Nurse Aide Registry');
  });

  it('returns DocInfo national registry link for Physicians', () => {
    const config = getCredentialConfig('Physician (MD/DO)', 'CA');
    expect(config.requiresLicenseNumber).toBe(true);
    expect(config.nationalRegistryLink).toEqual(NATIONAL_REGISTRIES.FSMB);
    expect(config.stateBoardLink).toEqual(STATE_BOARD_REGISTRY_LINKS['CA']);
  });

  it('contains valid state board links for core active states', () => {
    expect(STATE_BOARD_REGISTRY_LINKS['NC']).toBeDefined();
    expect(STATE_BOARD_REGISTRY_LINKS['MD']).toBeDefined();
    expect(STATE_BOARD_REGISTRY_LINKS['CT']).toBeDefined();
    expect(STATE_BOARD_REGISTRY_LINKS['ND']).toBeDefined();
    expect(STATE_BOARD_REGISTRY_LINKS['KS']).toBeDefined();
  });
});
