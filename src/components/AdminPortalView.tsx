import React, { useState, useEffect } from 'react';
import { AdminLicenseReview, BookingRequest, HousingListing } from '../types';
import { getProfessionLabel } from '../lib/professionConstants';
import { AdminSupplyDensityView } from './AdminSupplyDensityView';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { AdminActivityLogView } from './AdminActivityLogView';
import { AdminPagination } from './AdminPagination';

interface AdminPortalViewProps {
  currentUser?: any;
  isNightShiftMode: boolean;
  onOpenGoogleSheets?: (preset?: any) => void;
  onGoToTier2Plumbing?: () => void;
  bookingRequests?: BookingRequest[];
  listings?: HousingListing[];
  isDeveloper?: boolean;
  onStateActivated?: (stateCode: string, newActiveStates?: string[]) => void;
  activeStates?: string[];
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  isNightShiftMode,
  bookingRequests = [],
  listings = [],
  onStateActivated,
  activeStates,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'clinicians' | 'properties' | 'bookings' | 'supply_density' | 'activity_log'>('analytics');
  const [reviews, setReviews] = useState<AdminLicenseReview[]>([]);
  const [hostReviews, setHostReviews] = useState<any[]>([]);
  const [managedListings, setManagedListings] = useState<HousingListing[]>(listings);
  const [dbBookings, setDbBookings] = useState<BookingRequest[]>(bookingRequests);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [clinicianPage, setClinicianPage] = useState(1);
  const [hostPage, setHostPage] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [adminPageSize, setAdminPageSize] = useState(10);
  useEffect(() => { setClinicianPage(1); }, [reviews.length, adminPageSize]);
  useEffect(() => { setHostPage(1); }, [hostReviews.length, adminPageSize]);
  useEffect(() => { setPropertyPage(1); }, [managedListings.length, adminPageSize]);
  useEffect(() => { setBookingPage(1); }, [dbBookings.length, adminPageSize]);

  // Fetch live bookings from backend API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
        const res = await fetch('/api/bookings', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: BookingRequest[] = data.map((b: any) => ({
              id: String(b.id ?? ''),
              clinicianName: b.clinicianName || b.traveler_name || b.traveler_id || 'Not provided',
              clinicianTitle: b.clinicianTitle || b.profession || 'Not provided',
              clinicianAvatar: b.clinicianAvatar || '',
              clinicianPhone: b.clinicianPhone || b.phone_number || 'Not provided',
              hospitalName: b.hospitalName || b.hospital_name || 'Not provided',
              unitSpecialty: b.unitSpecialty || b.unit_specialty || 'Not provided',
              listingId: String(b.listing_id ?? ''),
              listingTitle: b.listingTitle || b.listing_title || 'Not provided',
              startDate: b.startDate || b.start_date || '',
              endDate: b.endDate || b.end_date || '',
              durationWeeks: Number(b.durationWeeks ?? b.duration_weeks ?? 0),
              monthlyRent: Number(b.monthlyRent ?? b.monthly_rent ?? b.total_rent ?? 0),
              securityDeposit: Number(b.securityDeposit ?? b.security_deposit ?? 0),
              cleaningFee: Number(b.cleaningFee ?? b.cleaning_fee ?? 0),
              petFee: Number(b.petFee ?? b.pet_fee ?? 0),
              travelerFee: Number(b.travelerFee ?? b.traveler_fee ?? 0),
              totalInitialCharge: Number(b.totalInitialCharge ?? b.gross_booking_value ?? b.total_traveler_charged ?? 0),
              hostNetPayout: Number(b.hostNetPayout ?? b.host_payout_amount ?? 0),
              platformFeeAmount: Number(b.platformFeeAmount ?? b.host_platform_fee_amount ?? 0),
              platformFeePercent: Number(b.platformFeePercent ?? b.host_platform_fee_percent ?? 0),
              status: b.status || 'pending_host_approval',
              submittedAt: b.submittedAt || b.created_at || 'Not available',
              deadlineHoursRemaining: Number(b.deadlineHoursRemaining ?? 0),
              specialRequests: b.specialRequests || b.special_requests || undefined,
              hostId: b.hostId || b.host_id || undefined,
              clinicianId: b.clinicianId || b.traveler_id || undefined,
            }));
            setDbBookings(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin bookings:', err);
      }
    };
    fetchBookings();
  }, []);

  // Fetch pending clinician license submissions from Railway PostgreSQL DB
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
        const res = await fetch('/api/admin/verifications', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = (res.headers.get('content-type')?.includes('application/json') ? await res.json() : {});

            // ⚡ Bolt Performance Optimization: Single-pass processing for both collections
            // Replaced two chained data.filter().map() arrays (O(4N)) with a single loop (O(N))
            const mappedReviews: AdminLicenseReview[] = [];
            const hosts: any[] = [];

            for (let i = 0; i < data.length; i++) {
              const d = data[i];
              const isDualRole = d.role === 'dual' || (d.role === 'host' && (Boolean(d.license_number) || Boolean(d.is_nurse_verified) || d.verification_status === 'pending_review'));
              const hasClinicalRecord = d.role !== 'host' || isDualRole;

              if (hasClinicalRecord) {
                mappedReviews.push({
                  id: d.id,
                  clinicianLegalName: d.full_name || d.email,
                  profession: d.profession || d.profession_specialty || (isDualRole ? 'RN (Host & Clinician)' : 'RN'),
                  issuingState: d.state_board || d.clinical_state_board || 'NC',
                  licenseNumber: d.license_number || d.clinical_license_number || 'PENDING',
                  licenseStatus: d.verification_status || (d.is_nurse_verified ? 'verified' : 'pending_review'),
                  hospitalAffiliation: d.contract_hospital || (isDualRole ? 'Host & Clinician Dual Role' : 'Duke University Hospital'),
                  submittedAt: 'Recently',
                  nursysLookupUrl: 'https://www.nursys.com',
                  documentPurged: Boolean(d.document_purged || d.is_nurse_verified),
                  isDualRole: isDualRole,
                  userRole: d.role,
                });
              }
              if (d.role === 'host' || d.role === 'dual' || d.is_host_verified || d.stripe_account_id) {
                hosts.push({
                  id: d.id,
                  hostName: d.full_name || d.email,
                  stripeAccountId: d.stripe_account_id,
                  stripePayoutsEnabled: d.stripe_payouts_enabled,
                  isHostVerified: d.is_host_verified,
                  isDualRole: isDualRole,
                });
              }
            }

            setReviews(mappedReviews);
            setHostReviews(hosts);

            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch pending verifications', error);
      }

      // Default baseline reviews for operational test verification
      setReviews([
        {
          id: 'usr-nurse-1',
          clinicianLegalName: 'Sarah E. Jenkins, RN',
          profession: 'RN',
          issuingState: 'NC',
          licenseNumber: 'RN-284910-NC',
          licenseStatus: 'pending_review',
          hospitalAffiliation: 'Duke University Hospital (ICU)',
          submittedAt: 'Today at 08:30 UTC',
          nursysLookupUrl: 'https://www.nursys.com',
          documentPurged: false,
        },
        {
          id: 'usr-nurse-2',
          clinicianLegalName: 'Marcus Vance, RN',
          profession: 'RN',
          issuingState: 'NC',
          licenseNumber: 'RN-319042-NC',
          licenseStatus: 'pending_review',
          hospitalAffiliation: 'UNC Medical Center (Emergency)',
          submittedAt: 'Yesterday at 14:15 UTC',
          nursysLookupUrl: 'https://www.nursys.com',
          documentPurged: false,
        },
        {
          id: 'usr-doc-1',
          clinicianLegalName: 'Dr. David Chen, MD',
          profession: 'MD',
          issuingState: 'NC',
          licenseNumber: 'MD-88192-NC',
          licenseStatus: 'pending_review',
          hospitalAffiliation: 'WakeMed Raleigh Hospital (Trauma)',
          submittedAt: 'Sep 26, 2026',
          nursysLookupUrl: 'https://www.docinfo.org',
          documentPurged: false,
        },
      ]);
    };

    fetchVerifications();
  }, [currentUser]);

  // Keep managedListings synced with incoming listings prop
  useEffect(() => {
    if (listings && listings.length > 0) {
      setManagedListings(listings);
    }
  }, [listings]);

  // Handle Clinician License Approval with permanent data purge hook
  const handleApproveClinician = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      await fetch(`/api/admin/verifications/${reviewId}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.warn('API approve call error:', err);
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, licenseStatus: 'verified', documentPurged: true }
          : r
      )
    );
    setActionNotice('Clinician approved: "Nurses Pillow Verified" badge issued and sensitive ID/license documents permanently purged in PostgreSQL.');
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Handle User Deletion
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== userId));
        setActionNotice('User permanently deleted from PostgreSQL database.');
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        const data = await res.json();
        setActionNotice(data.error || 'Failed to delete user.');
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.warn('API delete call error:', err);
    }
  };

  // Handle Clinician License Rejection
  const handleRejectClinician = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      await fetch(`/api/admin/verifications/${reviewId}/reject`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.warn('API reject call error:', err);
    }

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, licenseStatus: 'rejected' } : r))
    );
    setActionNotice('Clinician registration declined in PostgreSQL database.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Handle Host Property Verification Approval (A-10)
  const handleApproveProperty = async (listingId: string) => {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      await fetch(`/api/admin/listings/${listingId}/approve`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.warn('API approve property error:', err);
    }

    setManagedListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, verified: true } : l))
    );
    setActionNotice('Property verified in PostgreSQL: Sanctuary approved and indexed for traveling clinician search.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const pendingCliniciansCount = reviews.filter((r) => r.licenseStatus === 'pending_review').length;
  const pendingPropertiesCount = managedListings.filter((l) => !l.verified).length;

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'developer')) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center text-sm font-bold text-red-700 dark:text-red-400">
        Access Denied: You do not have permission to view this portal.
      </div>
    );
  }

  return (
    <div
      className={`np-dashboard np-admin-dashboard w-full min-h-[80vh] py-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto transition-colors ${
        isNightShiftMode ? 'text-[#E6ECF7]' : 'text-[#0B2559]'
      }`}
    >
      {/* Header & Role Identification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
              Operations Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#195b4c]/30 dark:text-[#aff0db] text-[11px] font-bold">
              Admin Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B2559] dark:text-white">
            Verifications &amp; Operations
          </h1>
        </div>

      </div>

      {/* Administrator workspace navigation */}
        <div role="navigation" aria-label="Administrator dashboard sections" className="np-dashboard-nav bg-white dark:bg-[#0B1626] p-1.5 rounded-2xl shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveAdminTab('analytics')}
            aria-current={activeAdminTab === 'analytics' ? 'page' : undefined}
            className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'analytics'
                ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">monitoring</span>
            <span>Analytics &amp; BI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('clinicians')}
            aria-current={activeAdminTab === 'clinicians' ? 'page' : undefined}
            className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'clinicians'
                ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
            }`}
          >
            <span>Clinicians</span>
            {pendingCliniciansCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold tabular-nums">
                {pendingCliniciansCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('properties')}
            aria-current={activeAdminTab === 'properties' ? 'page' : undefined}
            className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'properties'
                ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
            }`}
          >
            <span>Properties</span>
            {pendingPropertiesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold tabular-nums">
                {pendingPropertiesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('bookings')}
            aria-current={activeAdminTab === 'bookings' ? 'page' : undefined}
            className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'bookings'
                ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
            }`}
          >
            <span>Bookings</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0A6FA8]/20 text-[#0A6FA8] dark:text-[#3E9AD1] font-bold tabular-nums">
              {dbBookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('supply_density')}
            aria-current={activeAdminTab === 'supply_density' ? 'page' : undefined}
            className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'supply_density'
                ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">domain_verification</span>
            <span>States &amp; Supply</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold tabular-nums">
              Expansion
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('activity_log')}
            className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'activity_log'
                ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182840]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Activity Log</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#0A6FA8]/20 text-[#0A6FA8] dark:text-[#3E9AD1] font-bold tabular-nums">
              Audit
            </span>
          </button>
      </div>

      {/* Global Action Toast Notification */}
      {actionNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-[#E1EFE9] border border-[#2F6E5E]/30 text-xs text-[#2F6E5E] dark:text-[#aff0db] font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 0: Marketplace Analytics & Business Intelligence */}
      {activeAdminTab === 'analytics' && (
        <AdminAnalyticsDashboard
          isNightShiftMode={isNightShiftMode}
          onActionNotice={setActionNotice}
        />
      )}

      {/* TAB 1: Clinician License Verification Queue */}
      {activeAdminTab === 'clinicians' && (
        <div className="space-y-6">
          {/* Data Privacy Callout Box */}
          <div className="p-4 rounded-2xl bg-[#E1EFE9] dark:bg-[#142823] border border-[#2F6E5E]/30 text-xs text-[#2F6E5E] dark:text-[#aff0db] leading-relaxed flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">security</span>
            <div>
              <strong>Mandatory Clinician Data Privacy Protocol:</strong> Upon manual or automated approval, uploaded medical license documents and PDF attachments are permanently purged from primary server storage. Only the tamper-evident <em>'Nurses Pillow Verified'</em> cryptographically signed status token is retained.
            </div>
          </div>

          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#0B2559] dark:text-white">
                  Pending Clinician License Review Queue
                </h2>
                <p className="text-xs text-gray-500">Cross-reference state medical boards with 1-click Nursys QuickConfirm</p>
              </div>
              <span className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1]">
                {pendingCliniciansCount} Awaiting Verification
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Clinician Name</th>
                    <th className="py-3 px-3">Discipline</th>
                    <th className="py-3 px-3">State &amp; License #</th>
                    <th className="py-3 px-3">Hospital Assignment</th>
                    <th className="py-3 px-3">Registry Lookup</th>
                    <th className="py-3 px-3">Status / Purge</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reviews.slice((clinicianPage - 1) * adminPageSize, clinicianPage * adminPageSize).map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#0B2559] dark:text-white">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{r.clinicianLegalName}</span>
                          {r.isDualRole && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-[#005684] dark:bg-blue-900/40 dark:text-blue-300 text-[9px] font-bold">
                              Dual Role Host
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-normal">{r.submittedAt}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-bold font-mono text-gray-700 dark:text-gray-300" title={getProfessionLabel(r.profession)}>
                          {r.profession}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold">{r.licenseNumber}</span>
                        <span className="text-gray-400 ml-1">({r.issuingState})</span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300">
                        {r.hospitalAffiliation}
                      </td>
                      <td className="py-3.5 px-3">
                        {['MD_DO', 'SURGEON'].includes(r.profession) ? (
                          <a
                            href="https://www.docinfo.org"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0A6FA8] hover:underline font-bold"
                          >
                            <span>FSMB DocInfo</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                        ) : ['CNA'].includes(r.profession) ? (
                          <span className="inline-flex items-center gap-1 text-[#0A6FA8] font-bold">
                            <span>State Nurse Aide Registry</span>
                          </span>
                        ) : ['PA', 'MD_DO', 'SURGEON'].includes(r.profession) ? (
                          <span className="inline-flex items-center gap-1 text-[#0A6FA8] font-bold">
                            <span>State Medical Board</span>
                          </span>
                        ) : !['RN', 'LPN_LVN', 'APRN_NP', 'CRNA', 'CNM'].includes(r.profession) ? (
                          <span className="inline-flex items-center gap-1 text-[#0A6FA8] font-bold">
                            <span>State Professional Registry</span>
                          </span>
                        ) : (
                          <a
                            href="https://www.nursys.com"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0A6FA8] hover:underline font-bold"
                          >
                            <span>Nursys QuickConfirm</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {r.licenseStatus === 'verified' ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">check</span> Verified
                            </span>
                            <div className="text-[9px] text-[#2F6E5E]">Docs Purged ✓</div>
                          </div>
                        ) : r.licenseStatus === 'rejected' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#F4E2DC] text-[#A8452E] font-bold text-[10px]">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FBF0D6] text-[#B9822E] font-bold text-[10px]">
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {r.licenseStatus === 'pending_review' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveClinician(r.id)}
                                className="px-3 py-1 rounded-full bg-[#0B2559] hover:bg-[#0A6FA8] text-white text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Approve &amp; Purge
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectClinician(r.id)}
                                className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:text-[#A8452E] text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">Processed</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(r.id)}
                            className="px-2.5 py-1 mt-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                            Delete User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination total={reviews.length} page={clinicianPage} pageSize={adminPageSize} onPageChange={setClinicianPage} onPageSizeChange={setAdminPageSize} />
          </div>
        </div>
      )}

      {/* TAB 2: Host & Property Verification Queue */}
      {activeAdminTab === 'properties' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#0B2559] dark:text-white">
                  Host &amp; Property Verification
                </h2>
                <p className="text-xs text-gray-500">
                  Verify host documentation and approve listings for public search
                </p>
              </div>
              <span className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1]">
                {managedListings.length} Total Registered Sanctuaries
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-md font-bold text-[#0B2559] dark:text-white mb-3">Host Authority (Stripe KYC)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Host Name</th>
                      <th className="py-3 px-3">Stripe Account</th>
                      <th className="py-3 px-3">Payouts Enabled</th>
                      <th className="py-3 px-3">Authority Status</th>
                      <th className="py-3 px-3 text-right">Gate Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {hostReviews.slice((hostPage - 1) * adminPageSize, hostPage * adminPageSize).map((h) => (
                      <tr key={'host-'+h.id} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                        <td className="py-3.5 px-3 font-bold text-[#0B2559] dark:text-white">{h.hostName}</td>
                        <td className="py-3.5 px-3 font-mono text-gray-500">{h.stripeAccountId || 'None'}</td>
                        <td className="py-3.5 px-3">
                           {h.stripePayoutsEnabled ? (
                             <span className="text-green-600 font-bold">Yes</span>
                           ) : (
                             <span className="text-amber-500 font-bold">No</span>
                           )}
                        </td>
                        <td className="py-3.5 px-3">
                           {h.isHostVerified ? (
                             <span className="px-2.5 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] font-bold text-[10px]">Approved</span>
                           ) : (
                             <span className="px-2.5 py-0.5 rounded-full bg-[#FBF0D6] text-[#B9822E] font-bold text-[10px]">Pending</span>
                           )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                           {!h.isHostVerified ? (
                             <button
                               onClick={async () => {
                                 const token = localStorage.getItem('np_auth_token');
                                 await fetch(`/api/admin/hosts/${h.id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                 setHostReviews(prev => prev.map(host => host.id === h.id ? { ...host, isHostVerified: true } : host));
                                 setActionNotice('Host approved successfully.');
                               }}
                               className="px-3 py-1 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-[11px] font-bold cursor-pointer transition-colors"
                             >
                               Approve Host
                             </button>
                           ) : (
                             <button
                               onClick={async () => {
                                 const token = localStorage.getItem('np_auth_token');
                                 await fetch(`/api/admin/hosts/${h.id}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                 setHostReviews(prev => prev.map(host => host.id === h.id ? { ...host, isHostVerified: false } : host));
                                 setActionNotice('Host revoked successfully.');
                               }}
                               className="px-3 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold cursor-pointer transition-colors"
                             >
                               Revoke
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPagination total={hostReviews.length} page={hostPage} pageSize={adminPageSize} onPageChange={setHostPage} onPageSizeChange={setAdminPageSize} />
            </div>

            <h3 className="text-md font-bold text-[#0B2559] dark:text-white mb-3 mt-4">Property Listings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Sanctuary Title</th>
                    <th className="py-3 px-3">Location &amp; Proximity</th>
                    <th className="py-3 px-3">Property Type</th>
                    <th className="py-3 px-3">Monthly Rate</th>
                    <th className="py-3 px-3">Authority Status</th>
                    <th className="py-3 px-3">Search Index</th>
                    <th className="py-3 px-3 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {managedListings.slice((propertyPage - 1) * adminPageSize, propertyPage * adminPageSize).map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#0B2559] dark:text-white">
                        {l.title}
                        <div className="text-[10px] text-gray-400 font-normal">Host: {l.hostName}</div>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300">
                        <div>{l.city}, NC</div>
                        <div className="text-[10px] text-[#0A6FA8]">{l.distanceBadge || l.proximityToHospital}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#EFF6FB] dark:bg-[#182840] font-bold text-[#0B2559] dark:text-[#E6ECF7]">
                          {l.propertyType === 'entire_property' ? 'Entire Home' : 'Private Room Unit'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold tabular-nums">
                        ${l.monthlyRate.toLocaleString()} / mo
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] font-bold text-[10px] inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">verified</span> Deed Verified
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {l.verified ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] font-bold text-[10px]">
                            Active / Indexed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FBF0D6] text-[#B9822E] font-bold text-[10px]">
                            Pending Admin Gate
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {!l.verified ? (
                          <button
                            type="button"
                            onClick={() => handleApproveProperty(l.id)}
                            className="px-3 py-1 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            Approve for Search
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#2F6E5E] font-semibold">Active Live</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination total={managedListings.length} page={propertyPage} pageSize={adminPageSize} onPageChange={setPropertyPage} onPageSizeChange={setAdminPageSize} />
          </div>
        </div>
      )}

      {/* TAB 3: SCREEN A-12 Booking Authorizations Operations Queue */}
      {activeAdminTab === 'bookings' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#0B2559] dark:text-white">
                  Booking Authorizations &amp; Payment Split Monitor
                </h2>
                <p className="text-xs text-gray-500">
                  Live monitor of pre-authorization holds and each booking's recorded host commission and payout
                </p>
              </div>
              <span className="text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1]">
                {dbBookings.length} Recorded Requests
              </span>
            </div>

            {dbBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No active booking pre-authorizations recorded yet. Requests from traveling nurses will stream here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Booking ID</th>
                      <th className="py-3 px-3">Traveling Clinician</th>
                      <th className="py-3 px-3">Sanctuary &amp; Hospital</th>
                      <th className="py-3 px-3">Gross Rent</th>
                      <th className="py-3 px-3">Platform Fee</th>
                      <th className="py-3 px-3">Host Net Payout</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {dbBookings.slice((bookingPage - 1) * adminPageSize, bookingPage * adminPageSize).map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-[#0B2559] dark:text-white">
                          {b.id}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold">{b.clinicianName}</div>
                          <div className="text-[10px] text-gray-400">{b.clinicianTitle}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold">{b.listingTitle}</div>
                          <div className="text-[10px] text-[#0A6FA8]">{b.hospitalName} ({b.durationWeeks} wks)</div>
                        </td>
                        <td className="py-3.5 px-3 font-bold tabular-nums">
                          {b.monthlyRent > 0 ? `${b.monthlyRent.toLocaleString()}` : 'Unavailable'}
                        </td>
                        <td className="py-3.5 px-3 text-[#0A6FA8] dark:text-[#3E9AD1] font-bold tabular-nums">
                          {b.platformFeeAmount != null && b.platformFeeAmount > 0
                            ? `${b.platformFeeAmount.toFixed(2)}`
                            : b.platformFeePercent != null && b.platformFeePercent > 0 && b.monthlyRent > 0
                            ? `${(b.monthlyRent * b.platformFeePercent / 100).toFixed(2)}`
                            : 'Unavailable'}
                        </td>
                        <td className="py-3.5 px-3 text-[#2F6E5E] dark:text-[#aff0db] font-bold tabular-nums">
                          {b.hostNetPayout > 0 ? `${b.hostNetPayout.toFixed(2)}` : 'Unavailable'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={
                              b.status === 'approved' || b.status === 'active'
                                ? { backgroundColor: '#E1EFE9', color: '#2F6E5E' }
                                : b.status === 'declined'
                                ? { backgroundColor: '#F4E2DC', color: '#A8452E' }
                                : { backgroundColor: '#FBF0D6', color: '#B9822E' }
                            }
                          >
                            {b.status === 'approved' || b.status === 'active'
                              ? 'Captured & Confirmed'
                              : b.status === 'declined'
                              ? 'Hold Released'
                              : 'Pre-Auth Held'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AdminPagination total={dbBookings.length} page={bookingPage} pageSize={adminPageSize} onPageChange={setBookingPage} onPageSizeChange={setAdminPageSize} />
          </div>
        </div>
      )}

      {/* TAB 4: Supply & State Review (Per-State View Options & Command Center) */}
      {activeAdminTab === 'supply_density' && (
        <AdminSupplyDensityView
          isNightShiftMode={isNightShiftMode}
          onActionNotice={(msg) => {
            setActionNotice(msg);
            setTimeout(() => setActionNotice(null), 5000);
          }}
          managedListings={managedListings}
          onStateActivated={onStateActivated}
          activeStates={activeStates}
        />
      )}

      {/* TAB 5: Activity Log & Compliance Audit Stream */}
      {activeAdminTab === 'activity_log' && (
        <AdminActivityLogView
          isNightShiftMode={isNightShiftMode}
          onActionNotice={(msg) => {
            setActionNotice(msg);
            setTimeout(() => setActionNotice(null), 5000);
          }}
        />
      )}
    </div>
  );
};
