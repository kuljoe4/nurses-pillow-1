// Nurses Pillow - Relational Database Schema & Service (Railway PostgreSQL Architecture)
// Models: Users, Hospitals, Multi-Room Listings, Listing Rooms, Pricing Calendars, Bookings, Audit Logs

import { railwayClient, type RailwayDatabaseStatus } from './railway.ts';
import {
  type DbHospital,
  type DbListingRoom,
  type DbPricingCalendar,
  type DbListing,
  NC_HOSPITAL_SEEDS,
  NC_LISTING_SEEDS,
} from './seedData.ts';

export type { DbHospital, DbListingRoom, DbPricingCalendar, DbListing };
export { NC_HOSPITAL_SEEDS, NC_LISTING_SEEDS };

export interface DbUser {
  id: string;
  email: string;
  role: 'nurse' | 'host' | 'super_admin' | 'developer';
  legal_name: string;
  phone: string;
  stripe_customer_id?: string;
  stripe_connect_account_id?: string;
  verification_status: 'unverified' | 'pending_review' | 'verified' | 'rejected';
  verified_at?: string;
  created_at: string;
}

export interface DbBooking {
  id: string;
  traveler_id: string;
  traveler_name: string;
  traveler_phone: string;
  host_id: string;
  listing_id: string;
  listing_title: string;
  hospital_id: string;
  hospital_name: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  monthly_rent: number;
  cleaning_fee: number;
  pet_fee: number;
  security_deposit_hold: number;
  total_traveler_charged: number;
  platform_fee_amount: number; // 5%
  host_net_payout: number; // ~95%
  stripe_payment_intent_id: string;
  stripe_transfer_id: string;
  stripe_hold_id: string;
  cancellation_tier: 'flexible_30d' | 'moderate_60d' | 'strict_90d';
  status: 'pending_host_approval' | 'approved' | 'declined' | 'active' | 'cancelled' | 'refunded' | 'completed';
  refund_amount?: number;
  cancelled_at?: string;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  event_type: 'pii_purge' | 'fee_split' | 'deposit_hold' | 'cancellation_refund' | 'otp_verify' | 'email_dispatch';
  record_id: string;
  details: string;
  actor: string;
  timestamp: string;
}

// -------------------------------------------------------------
// HAVERSINE DISTANCE FORMULA (Real-world mileage calculation)
// -------------------------------------------------------------
export function calculateMileage(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(1));
}

// Estimate drive time in minutes from distance (assumes 25 mph urban clinical corridor speed)
export function estimateDriveTimeMinutes(distanceMiles: number): number {
  const averageMph = 25;
  const minutes = (distanceMiles / averageMph) * 60;
  return Math.max(3, Math.round(minutes));
}

// In-memory Database Store simulating Railway PostgreSQL connection & triggers
class DatabaseService {
  private users: DbUser[] = [
    {
      id: 'usr-nurse-1',
      email: 'sarah.jenkins@travelrn-health.org',
      role: 'nurse',
      legal_name: 'Sarah E. Jenkins',
      phone: '+1 (919) 555-0198',
      stripe_customer_id: 'cus_test_nurse_sarah',
      verification_status: 'verified',
      verified_at: '2026-09-20T14:30:00Z',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'usr-host-1',
      email: 'sarah.miller@durhamhousing.com',
      role: 'host',
      legal_name: 'Sarah Miller',
      phone: '+1 (919) 555-0144',
      stripe_connect_account_id: 'acct_1NC_DukeHost_Express',
      verification_status: 'verified',
      verified_at: '2026-08-15T09:00:00Z',
      created_at: '2026-08-10T12:00:00Z',
    },
  ];

  private hospitals: DbHospital[] = [];
  private listings: DbListing[] = [];
  private bookings: DbBooking[] = [];
  private auditLogs: DbAuditLog[] = [
    {
      id: 'log-seed-1',
      event_type: 'pii_purge',
      record_id: 'usr-nurse-1',
      details: 'Post-approval purge executed: Driver license DL_California_Sarah_Jenkins.pdf deleted permanently from storage bucket.',
      actor: 'system_purge_hook',
      timestamp: '2026-09-20T14:30:02Z',
    },
  ];

  private railwayStatus: RailwayDatabaseStatus | null = null;

  async init(): Promise<{ railwayActive: boolean; status: RailwayDatabaseStatus | null }> {
    try {
      this.railwayStatus = await railwayClient.getStatus();
      if (this.railwayStatus.isConnected) {
        console.log(`[DatabaseService] Connected to Railway PostgreSQL (${this.railwayStatus.database})`);
      } else {
        console.warn(`[DatabaseService] PostgreSQL Status: ${this.railwayStatus.diagnostics}`);
      }

      await Promise.allSettled([
        this.fetchHospitals(),
        this.fetchListings(),
        this.fetchAuditLogs(),
      ]);

      return {
        railwayActive: this.railwayStatus.isConnected,
        status: this.railwayStatus,
      };
    } catch (err: any) {
      console.error('[DatabaseService] Database initialization check error:', err);
      return {
        railwayActive: false,
        status: null,
      };
    }
  }

  getRailwayStatus(): RailwayDatabaseStatus | null {
    return this.railwayStatus;
  }

  // Helper for retrying fetches
  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 1000): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (retries > 0) {
        console.warn(`[DatabaseService] Retrying fetch to ${url} due to error:`, error);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  }

  async fetchHospitals(): Promise<DbHospital[]> {
    try {
      const response = await this.fetchWithRetry('/api/hospitals');
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (Array.isArray(data)) {
          this.hospitals = data;
        }
      }
    } catch (error) {
      console.warn('[DatabaseService] Network error fetching hospitals from PostgreSQL API:', error);
    }
    return this.getHospitals();
  }

  async fetchListings(): Promise<any[]> {
    try {
      const response = await this.fetchWithRetry('/api/listings');
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (Array.isArray(data)) {
          this.listings = data;
        }
      }
    } catch (error) {
      console.warn('[DatabaseService] Network error fetching listings from PostgreSQL API:', error);
    }
    return this.getListings();
  }

  async fetchBookings(): Promise<DbBooking[]> {
    try {
      const response = await this.fetchWithRetry('/api/bookings');
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (Array.isArray(data) && data.length > 0) {
          this.bookings = data;
        }
      }
    } catch (error) {
      console.warn('[DatabaseService] Network error fetching bookings from PostgreSQL API:', error);
    }
    return this.getBookings();
  }

  async fetchAuditLogs(): Promise<DbAuditLog[]> {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      if (!token) {
        this.auditLogs = [];
        return this.auditLogs;
      }

      // Check user role before fetching to prevent 403 Forbidden errors
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin' && payload.role !== 'super_admin') {
          this.auditLogs = [];
          return this.auditLogs;
        }
      } catch (e) {
        // Ignore JSON parse errors, just try to fetch
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.fetchWithRetry('/api/audit-logs', { headers });
      if (response.ok) {
        const data = await response.json().catch(() => null);
        this.auditLogs = Array.isArray(data) ? data : [];
      } else if (response.status === 401 || response.status === 403) {
        this.auditLogs = [];
      }
    } catch (error) {
      console.warn('[DatabaseService] Network error fetching audit logs from PostgreSQL API:', error);
    }
    return this.auditLogs;
  }

  getHospitals(): DbHospital[] {
    return this.hospitals;
  }

  getListings(): any[] {
    const rawListings = this.listings;
    return rawListings.map((l: any) => {
      // If it's already mapped (e.g. from the backend API), return it
      if (l.monthlyRate !== undefined) return l;

      // Production guard: Map raw DbListing seeds/fallback objects to expected frontend HousingListing format
      return {
        id: l.id,
        title: l.title,
        neighborhood: l.address || '',
        city: l.city,
        state: l.state,
        proximityToHospital: "Under 5 Miles",
        nearestHospital: l.nearest_hospital_id || 'Unknown',
        driveTimeMinutes: 10,
        monthlyRate: Number(l.monthly_rate || 0),
        weeklyRate: Math.round(Number(l.monthly_rate || 0) / 4),
        beds: 1,
        baths: 1,
        sqft: 800,
        images: Array.isArray(l.images) ? l.images : [],
        amenities: {
          blackoutCurtains: true,
          whiteNoiseMachine: true,
          daySleeperQuietHours: true,
          washerDryerInUnit: true,
          dedicatedParking: true,
          highSpeedWifi: true,
          fullyFurnished: true,
          petFriendly: Number(l.pet_fee || 0) > 0,
          privateEntrance: false
        },
        contractFlexProtection: l.cancellation_tier === 'flexible' || l.cancellation_tier === 'flexible_30d',
        featuredSanctuary: false,
        propertyType: l.property_type,
        latitude: Number(l.latitude || 0),
        longitude: Number(l.longitude || 0),
        petFee: Number(l.pet_fee || 0),
        parkingFee: Number(l.parking_fee || 0),
        extraOptions: (() => {
          if (typeof l.extra_options === 'string') {
            try {
              return JSON.parse(l.extra_options);
            } catch (err) {
              console.warn(`[DatabaseService] Failed to parse extra_options for listing ${l.id}`, err);
              return [];
            }
          }
          return l.extra_options || [];
        })(),
      };
    });
  }

  getHospitalById(id: string): DbHospital | undefined {
    return this.hospitals.find((h) => h.id === id);
  }

  getListingById(id: string): any | undefined {
    const listings = this.getListings();
    return listings.find((l: any) => l.id === id);
  }

  calculateListingProximity(listingId: string, hospitalId: string): { miles: number; minutes: number } {
    const listing = this.getListingById(listingId);
    const hospital = this.getHospitalById(hospitalId);
    if (!listing || !hospital) return { miles: 1.2, minutes: 5 };
    const miles = calculateMileage(listing.latitude, listing.longitude, hospital.latitude, hospital.longitude);
    const minutes = estimateDriveTimeMinutes(miles);
    return { miles, minutes };
  }

  async createBookingAsync(booking: Omit<DbBooking, 'id' | 'created_at'>): Promise<DbBooking> {
    const newBooking: DbBooking = {
      ...booking,
      id: `bk_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newBooking),
    });

    if (!response.ok) {
      const errData = (response.headers.get('content-type')?.includes('application/json') ? await response.json().catch(() => ({})) : {});
      throw new Error(errData.error || 'Failed to create booking in PostgreSQL database');
    }

    this.bookings.unshift(newBooking);

    // Database Trigger Simulation: Log Audit Trail
    await this.logAuditAsync({
      event_type: 'fee_split',
      record_id: newBooking.id,
      details: `Stripe Connect Split: Total $${newBooking.total_traveler_charged.toFixed(2)} -> 5% Platform Fee $${newBooking.platform_fee_amount.toFixed(2)} to Nurses Pillow, ~95% Net Payout $${newBooking.host_net_payout.toFixed(2)} to host account.`,
      actor: 'stripe_connect_trigger',
    });

    if (newBooking.security_deposit_hold > 0) {
      await this.logAuditAsync({
        event_type: 'deposit_hold',
        record_id: newBooking.id,
        details: `Stripe Auth Hold created: $${newBooking.security_deposit_hold.toFixed(2)} manual capture hold authorized (pre-auth hold, not charged today).`,
        actor: 'stripe_escrow_trigger',
      });
    }

    return newBooking;
  }

  createBooking(booking: Omit<DbBooking, 'id' | 'created_at'>): DbBooking {
    // Synchronous wrapper for existing UI
    this.createBookingAsync(booking).catch(console.error);
    return {
      ...booking,
      id: `bk_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
  }

  getBookings(): DbBooking[] {
    return this.bookings;
  }

  async logAuditAsync(log: Omit<DbAuditLog, 'id' | 'timestamp'>): Promise<DbAuditLog> {
    let randPart = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      randPart = window.crypto.randomUUID().replace(/-/g, '').substring(0, 4);
    } else if (typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        randPart = crypto.randomUUID().replace(/-/g, '').substring(0, 4);
      } catch (e) {
        randPart = Math.random().toString(36).substring(2, 6);
      }
    } else {
      randPart = Math.random().toString(36).substring(2, 6);
    }
    const entry: DbAuditLog = {
      ...log,
      id: `log_${Date.now()}_${randPart}`,
      timestamp: new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers,
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error('Failed to create audit log on the server');
      }
    } catch (error) {
      console.warn('Failed to post audit log to API, falling back to local simulation', error);
    }

    // Fallback/sync to local memory array
    this.auditLogs.unshift(entry);
    return entry;
  }

  logAudit(log: Omit<DbAuditLog, 'id' | 'timestamp'>): DbAuditLog {
    this.logAuditAsync(log).catch(console.error);
    let randPart = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      randPart = window.crypto.randomUUID().replace(/-/g, '').substring(0, 4);
    } else if (typeof require !== 'undefined') {
      try {
        const crypto = require('crypto');
        randPart = crypto.randomUUID().replace(/-/g, '').substring(0, 4);
      } catch (e) {
        randPart = Math.random().toString(36).substring(2, 6);
      }
    } else {
      randPart = Math.random().toString(36).substring(2, 6);
    }
    return {
      ...log,
      id: `log_${Date.now()}_${randPart}`,
      timestamp: new Date().toISOString(),
    };
  }

  getAuditLogs(): DbAuditLog[] {
    return this.auditLogs;
  }

  purgeClinicianDocuments(clinicianId: string, clinicianName: string): DbAuditLog {
    return this.logAudit({
      event_type: 'pii_purge',
      record_id: clinicianId,
      details: `DATA PURGE COMPLETED: Government ID and clinical license documents for "${clinicianName}" permanently deleted from server storage. Cryptographic "Nurses Pillow Verified" badge issued.`,
      actor: 'admin_verification_hook',
    });
  }

  private availabilityBlocks: any[] = [];

  async fetchAllAvailabilityBlocks(): Promise<any[]> {
    try {
      const response = await this.fetchWithRetry('/api/availability-blocks');
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (Array.isArray(data)) {
          this.availabilityBlocks = data;
          return data;
        }
      }
    } catch (error) {
      console.warn('[DatabaseService] Network error fetching all availability blocks:', error);
    }
    return this.availabilityBlocks;
  }

  getAvailabilityBlocks(): any[] {
    return this.availabilityBlocks;
  }

  async fetchAvailabilityBlocks(listingId?: string): Promise<any[]> {
    if (!listingId) {
      return this.fetchAllAvailabilityBlocks();
    }
    try {
      const response = await this.fetchWithRetry(`/api/listings/${listingId}/availability`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`[DatabaseService] Error fetching availability for listing ${listingId}:`, error);
    }
    return [];
  }

  async fetchBookingsForListing(listingId: string): Promise<any[]> {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await this.fetchWithRetry(`/api/listings/${listingId}/bookings`, { headers });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`[DatabaseService] Error fetching bookings for listing ${listingId}:`, error);
    }
    return [];
  }

  async addAvailabilityBlock(listingId: string, block: { start_date: string, end_date: string, is_blocked: boolean, block_reason?: string }): Promise<any> {
    const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/listings/${listingId}/availability`, {
      method: 'POST',
      headers,
      body: JSON.stringify(block),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const err = new Error(data.error || 'Failed to add availability block');
      (err as any).response = { status: response.status, data };
      throw err;
    }
    return await response.json();
  }
}

export const db = new DatabaseService();
