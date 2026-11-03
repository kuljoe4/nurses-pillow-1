import { getAccessToken } from './googleAuth';
import { BookingRequest, HousingListing, AdminLicenseReview, MarketDemandReport } from '../types';

export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetMetadata {
  spreadsheetId: string;
  properties: {
    title: string;
    locale?: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
  spreadsheetUrl: string;
}

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive.
 */
export async function createSpreadsheet(
  title: string,
  sheetTitles: string[] = ['Sheet1']
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token not found. Please sign in with Google.');
  }

  const payload = {
    properties: {
      title,
    },
    sheets: sheetTitles.map((st) => ({
      properties: {
        title: st,
        gridProperties: {
          rowCount: 100,
          columnCount: 20,
        },
      },
    })),
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {});
    throw new Error(err.error?.message || `Failed to create spreadsheet: ${res.statusText}`);
  }

  const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Lists user's Google Spreadsheets from Google Drive API v3.
 */
export async function listUserSpreadsheets(): Promise<GoogleDriveFile[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token not found. Please sign in with Google.');
  }

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=${fields}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {});
    throw new Error(err.error?.message || `Failed to list spreadsheets: ${res.statusText}`);
  }

  const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
  return data.files || [];
}

/**
 * Appends row values to a specific sheet range using Google Sheets API v4.
 */
export async function appendRows(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token not found. Please sign in with Google.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {});
    throw new Error(err.error?.message || `Failed to append rows to sheet: ${res.statusText}`);
  }

  return (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {}) as any;
}

/**
 * Updates a cell range directly.
 */
export async function updateRange(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token not found. Please sign in with Google.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {});
    throw new Error(err.error?.message || `Failed to update sheet range: ${res.statusText}`);
  }

  return (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {}) as any;
}

/**
 * Fetches sheet metadata and list of sheet tabs.
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<SheetMetadata> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token not found. Please sign in with Google.');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {});
    throw new Error(err.error?.message || `Failed to fetch spreadsheet details: ${res.statusText}`);
  }

  return (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {}) as any;
}

/**
 * Reads values from a spreadsheet range.
 */
export async function getSpreadsheetValues(
  spreadsheetId: string,
  range: string
): Promise<(string | number)[][]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Workspace access token not found. Please sign in with Google.');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(
      range
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = (res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {});
    throw new Error(err.error?.message || `Failed to read sheet values: ${res.statusText}`);
  }

  const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});
  return data.values || [];
}

/**
 * Prepares data for Nurse Tax & Stipend Ledger Export
 */
export function buildNurseTaxLedgerData(bookings: BookingRequest[]): {
  headers: string[];
  rows: (string | number)[][];
} {
  const headers = [
    'Reservation ID',
    'Clinical Facility / Hospital',
    'Specialty / Unit',
    'Check-In Date',
    'Check-Out Date',
    'Duration (Weeks)',
    'Monthly Rent ($)',
    'Cleaning Fee ($)',
    'Traveler Platform Fee ($)',
    'Total Initial Out-of-Pocket ($)',
    'GSA Lodging Stipend Comparison ($/mo)',
    'Tax Deductibility Status',
    'Night Shift Daytime Sleep Quiet Clause',
  ];

  const rows = bookings.map((b) => [
    b.id,
    b.hospitalName,
    b.unitSpecialty,
    b.startDate,
    b.endDate,
    b.durationWeeks,
    b.monthlyRent,
    b.cleaningFee,
    b.securityDeposit,
    b.travelerFee,
    b.totalInitialCharge,
    2200, // GSA monthly lodging baseline average
    '100% Eligible (Travel Nurse Tax Home Away)',
    'Certified <35dB (08:00 AM - 05:00 PM)',
  ]);

  return { headers, rows };
}

/**
 * Prepares data for Host Revenue & Roster Export
 */
export function buildHostEarningsLedgerData(bookings: BookingRequest[]): {
  headers: string[];
  rows: (string | number)[][];
} {
  const headers = [
    'Booking Ref',
    'Clinician Name',
    'Clinical Credential',
    'Affiliated Medical Center',
    'Stay Start Date',
    'Stay End Date',
    'Duration (Weeks)',
    'Gross Booking Value ($)',
    'Host Platform Fee (5%) ($)',
    'Net Host Payout ($)',
    'Payment Status',
    'Stripe Connect Direct Payout',
    'Special Night Shift Requests',
  ];

  const rows = bookings.map((b) => [
    b.id,
    b.clinicianName,
    b.clinicianTitle,
    b.hospitalName,
    b.startDate,
    b.endDate,
    b.durationWeeks,
    b.monthlyRent,
    b.monthlyRent * 0.05,
    b.hostNetPayout || b.monthlyRent * 0.95,
    b.status === 'approved' ? 'PAID / ESCROWED' : 'PENDING APPROVAL',
    'Automated to Bank Account',
    b.specialRequests || 'Standard Quiet Daytime Environment',
  ]);

  return { headers, rows };
}

/**
 * Prepares data for Housing Sanctuaries Comparison
 */
export function buildHousingSanctuaryData(listings: HousingListing[]): {
  headers: string[];
  rows: (string | number)[][];
} {
  const headers = [
    'Sanctuary Name',
    'Neighborhood / City',
    'Nearest Medical Center',
    'Distance / Proximity',
    'Drive Commute (mins)',
    'Room Specs',
    'Monthly Rate ($)',
    'Weekly Rate ($)',
    '100% Blackout Drapes',
    'White Noise / Sound Shield',
    'Day-Sleeper Quiet Hours',
    'In-Unit Scrub Laundry',
    'Dedicated Off-Street Parking',
    'Contract Flex Calloff Protection',
    'Clinician Rating',
    'Host Verification Tier',
  ];

  const rows = listings.map((l) => [
    l.title,
    `${l.neighborhood}, ${l.city}, ${l.state}`,
    l.nearestHospital,
    l.proximityToHospital,
    l.driveTimeMinutes,
    `${l.beds} Bed, ${l.baths} Bath (${l.sqft} sqft)`,
    l.monthlyRate,
    l.weeklyRate,
    l.amenities.blackoutCurtains ? 'YES - 100% Zero-Bleed' : 'Standard',
    l.amenities.whiteNoiseMachine ? 'YES - LectroFan Sound Machine' : 'No',
    l.amenities.daySleeperQuietHours ? 'YES - 08:00 to 17:00 Enforced' : 'Standard',
    l.amenities.washerDryerInUnit ? 'YES - High Temp Scrub Cycle' : 'Shared',
    l.amenities.dedicatedParking ? 'YES - Guaranteed Off-Street' : 'Street',
    l.contractFlexProtection ? 'Guaranteed (2-Week Calloff Coverage)' : 'Standard',
    `${l.nurseRating} ★ (${l.reviewsCount} reviews)`,
    l.hostType || 'Verified Healthcare Host',
  ]);

  return { headers, rows };
}

/**
 * Prepares data for Super-Admin Demand-Without-Inventory Market Report
 */
export function buildMarketDemandData(reports: MarketDemandReport[]): {
  headers: string[];
  rows: (string | number)[][];
} {
  const headers = [
    'Target Hospital',
    'Health System',
    'Metro Location & ZIP',
    '30-Day Clinician Search Volume',
    'Current Active Host Listings',
    'Supply Deficit Severity',
    'Host Recruitment Priority',
    'Target Host Acquisition Incentive',
  ];

  const rows = reports.map((r) => [
    r.hospitalName,
    r.healthSystem,
    r.cityState,
    r.clinicianSearchCount30d,
    r.activeHostListings,
    r.activeHostListings === 0 ? 'ZERO INVENTORY (100% DEFICIT)' : `${r.activeHostListings} Listings Available`,
    r.priorityRecruitmentTier,
    r.priorityRecruitmentTier === 'CRITICAL' ? '$500 New Host Sign-on Bonus' : '$250 Referral Credit',
  ]);

  return { headers, rows };
}

/**
 * Prepares data for Super-Admin License Verification & Audit Trail
 */
export function buildAdminLicenseReviewData(reviews: AdminLicenseReview[]): {
  headers: string[];
  rows: (string | number)[][];
} {
  const headers = [
    'Audit Ref ID',
    'Clinician Legal Name',
    'Profession Specialization',
    'Issuing State Board',
    'License Number',
    'Verification Status',
    'Hospital Affiliation',
    'Submission Timestamp',
    'Nursys Lookup Verification URL',
    'PII Ephemeral Document Purged',
  ];

  const rows = reviews.map((r) => [
    r.id,
    r.clinicianLegalName,
    r.profession,
    r.issuingState,
    r.licenseNumber,
    r.licenseStatus.toUpperCase(),
    r.hospitalAffiliation,
    r.submittedAt,
    r.nursysLookupUrl,
    r.documentPurged ? 'YES (Auto-Purged <24h)' : 'PENDING PURGE',
  ]);

  return { headers, rows };
}
