import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser,
} from '../services/googleAuth';
import {
  createSpreadsheet,
  listUserSpreadsheets,
  appendRows,
  updateRange,
  buildNurseTaxLedgerData,
  buildHostEarningsLedgerData,
  buildHousingSanctuaryData,
  buildMarketDemandData,
  buildAdminLicenseReviewData,
  GoogleDriveFile,
} from '../services/googleSheets';
import { BookingRequest, HousingListing, MarketDemandReport, AdminLicenseReview, UserRole } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export type AdminSheetsPreset =
  | 'admin-demand'
  | 'admin-licenses'
  | 'host-revenue'
  | 'housing-comparison'
  | 'nurse-tax';

export interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNightShiftMode: boolean;
  initialPreset?: AdminSheetsPreset;
  bookingRequests?: BookingRequest[];
  listings?: HousingListing[];
  demandReports?: MarketDemandReport[];
  licenseReviews?: AdminLicenseReview[];
  userRole?: UserRole;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  isNightShiftMode,
  initialPreset = 'admin-demand',
  bookingRequests = [],
  listings = [],
  demandReports = [],
  licenseReviews = [],
}) => {
  useBodyScrollLock(isOpen);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync Configuration
  const [activePreset, setActivePreset] = useState<AdminSheetsPreset>(initialPreset);
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new');
  const [newSheetTitle, setNewSheetTitle] = useState<string>('');
  const [existingSheets, setExistingSheets] = useState<GoogleDriveFile[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(false);

  // Execution states
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [syncSuccessResult, setSyncSuccessResult] = useState<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    title: string;
    rowsCount: number;
  } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Reset preset when initialPreset prop changes
  useEffect(() => {
    if (initialPreset) {
      setActivePreset(initialPreset);
    }
  }, [initialPreset, isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showConfirmModal, onClose]);

  // Track auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setHasToken(!!token);
        setAuthError(null);
      },
      () => {
        setCurrentUser(getCurrentUser());
        setHasToken(false);
      }
    );

    getAccessToken().then((tok) => {
      setHasToken(!!tok);
      setCurrentUser(getCurrentUser());
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Update default title when preset changes
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (activePreset === 'admin-demand') {
      setNewSheetTitle(`Nurses Pillow - Demand Without Inventory Report (${todayStr})`);
    } else if (activePreset === 'admin-licenses') {
      setNewSheetTitle(`Nurses Pillow - Clinician License Verification & Audit Trail (${todayStr})`);
    } else if (activePreset === 'host-revenue') {
      setNewSheetTitle(`Nurses Pillow - Host Payouts & 5% Platform Revenue Ledger (${todayStr})`);
    } else if (activePreset === 'housing-comparison') {
      setNewSheetTitle(`Nurses Pillow - Hospital Sanctuaries & Quiet Ratings Database (${todayStr})`);
    } else {
      setNewSheetTitle(`Nurses Pillow - Travel Clinician Stipend & Tax Ledger (${todayStr})`);
    }
  }, [activePreset]);

  // Load existing spreadsheets when targetMode is 'existing'
  useEffect(() => {
    if (targetMode === 'existing' && hasToken) {
      loadDriveSpreadsheets();
    }
  }, [targetMode, hasToken]);

  const loadDriveSpreadsheets = async () => {
    setIsLoadingSheets(true);
    setSyncError(null);
    try {
      const files = await listUserSpreadsheets();
      setExistingSheets(files);
      if (files.length > 0 && !selectedSheetId) {
        setSelectedSheetId(files[0].id);
      }
    } catch (err: any) {
      console.error('Failed to list user spreadsheets', err);
      setSyncError(err.message || 'Could not fetch spreadsheets from Google Drive.');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setHasToken(true);
      }
    } catch (err: any) {
      console.error('Failed Google sign-in', err);
      setAuthError(err.message || 'Google authorization failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setHasToken(false);
      setSyncSuccessResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Derive current payload data based on active preset
  const getCurrentDataPayload = () => {
    if (activePreset === 'admin-demand') {
      return buildMarketDemandData(demandReports);
    } else if (activePreset === 'admin-licenses') {
      return buildAdminLicenseReviewData(licenseReviews);
    } else if (activePreset === 'host-revenue') {
      return buildHostEarningsLedgerData(bookingRequests);
    } else if (activePreset === 'housing-comparison') {
      return buildHousingSanctuaryData(listings);
    } else {
      return buildNurseTaxLedgerData(bookingRequests);
    }
  };

  const currentPayload = getCurrentDataPayload();

  // Execute sync after explicit user confirmation
  const handleExecuteSync = async () => {
    setShowConfirmModal(false);
    setIsSyncing(true);
    setSyncError(null);

    try {
      const { headers, rows } = currentPayload;
      const allRows = [headers, ...rows];

      if (targetMode === 'new') {
        const sheetTabName =
          activePreset === 'admin-demand'
            ? 'Demand Without Inventory'
            : activePreset === 'admin-licenses'
            ? 'License Verification Audit'
            : activePreset === 'host-revenue'
            ? 'Host Revenue & Roster'
            : activePreset === 'housing-comparison'
            ? 'Hospital Sanctuaries'
            : 'Tax & Stipend Ledger';

        const created = await createSpreadsheet(newSheetTitle.trim(), [sheetTabName]);
        await updateRange(created.spreadsheetId, `${sheetTabName}!A1`, allRows);

        setSyncSuccessResult({
          spreadsheetId: created.spreadsheetId,
          spreadsheetUrl: created.spreadsheetUrl,
          title: newSheetTitle.trim(),
          rowsCount: rows.length,
        });
      } else {
        if (!selectedSheetId) {
          throw new Error('Please select an existing spreadsheet from your Google Drive.');
        }
        await appendRows(selectedSheetId, 'A1', allRows);

        const matched = existingSheets.find((s) => s.id === selectedSheetId);
        setSyncSuccessResult({
          spreadsheetId: selectedSheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`,
          title: matched?.name || 'Existing Google Spreadsheet',
          rowsCount: rows.length,
        });
      }
    } catch (err: any) {
      console.error('Sync failed', err);
      setSyncError(err.message || 'Failed to sync data to Google Sheets. Please ensure permissions are granted.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyUrl = () => {
    if (syncSuccessResult?.spreadsheetUrl) {
      navigator.clipboard.writeText(syncSuccessResult.spreadsheetUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] overflow-y-auto p-4 sm:p-6 pt-16 sm:pt-20 bg-black/60 backdrop-blur-xs flex justify-center items-start"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheets-modal-title"
      aria-describedby="sheets-modal-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl my-auto rounded-3xl p-6 sm:p-8 shadow-lg border transition-all duration-200 ease-in-out max-h-[92vh] overflow-y-auto ${
          isNightShiftMode
            ? 'bg-[#0B1626] text-[#E6ECF7] border-[#233550]'
            : 'bg-white text-[#001848] border-[rgba(11,37,89,0.12)]'
        }`}
      >
        {/* Admin Access & Feature Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">
              admin_panel_settings
            </span>
            <span className="font-bold">Administrative Portal • Data Bridge</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-mono font-bold uppercase">
              Admin Access Only
            </span>
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-300">
            Administrative utility for platform oversight and partner data sharing
          </span>
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0F9D58]/15 text-[#0F9D58] flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="sheets-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight">
                  Google Sheets Administrative Data Bridge
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F9D58]/15 text-[#0F9D58] border border-[#0F9D58]/30 uppercase tracking-wide">
                  Live OAuth
                </span>
              </div>
              <p id="sheets-modal-description" className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Export market demand reports, license audit logs, platform revenue, and housing databases directly to Google Sheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white/5 cursor-pointer transition-colors"
            type="button"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Step 1: Auth Status */}
        <div className="mt-5 p-4 rounded-2xl border bg-gray-50/70 dark:bg-black/20 border-gray-200/80 dark:border-gray-800">
          {!hasToken ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Step 1 • Google Workspace Administrator Sign-In
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Connect your Google Account to authorize spreadsheet creation and cell updates in Google Drive.
                </p>
                {authError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1" role="alert">
                    {authError}
                  </p>
                )}
              </div>

              {/* Official Google Material Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button inline-flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-xl shadow-xs text-xs font-semibold cursor-pointer shrink-0 transition-all duration-200 ease-in-out disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#005684]"
              >
                <div className="gsi-material-button-icon flex items-center justify-center">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-bold">
                  {isSigningIn ? 'Connecting...' : 'Sign In with Google'}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google Administrator'}
                    className="w-9 h-9 rounded-full border border-green-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#0F9D58] text-white flex items-center justify-center font-bold text-xs">
                    {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{currentUser?.displayName || 'Google Admin Account'}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0F9D58]/20 text-[#0F9D58]">
                      Authorized
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[260px] sm:max-w-sm">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-gray-500 hover:text-rose-500 focus-visible:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 focus-visible:text-rose-400 font-medium underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Sync Success Banner */}
        {syncSuccessResult && (
          <div
            className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[24px]">
                  check_circle
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    Google Spreadsheet Created &amp; Populated!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-0.5 font-medium">
                    Successfully wrote {syncSuccessResult.rowsCount} rows to"{syncSuccessResult.title}".
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-600/30 text-xs font-bold hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-emerald-500/10 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedUrl ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={syncSuccessResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0F9D58] hover:bg-[#0c8047] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0c8047] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Open in Google Sheets</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Sync Controls */}
        <div className="mt-5 space-y-5">
          {/* Step 2: Choose Dataset */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Step 2 • Select Administrative Dataset to Export
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActivePreset('admin-demand');
                  setSyncSuccessResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ease-in-out ${
                  activePreset === 'admin-demand'
                    ? 'border-[#005684] bg-[#005684]/10 dark:bg-[#005684]/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#005684] dark:text-[#93ccff]">
                    Market Demand Report
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                    Recruitment Targets
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  High-search hospital hubs with low/zero host inventory for targeted outreach.
                </p>
                <div className="mt-2 text-[10px] font-bold text-gray-400">
                  {demandReports.length} Target Hospitals • 8 Fields
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePreset('admin-licenses');
                  setSyncSuccessResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ease-in-out ${
                  activePreset === 'admin-licenses'
                    ? 'border-[#005684] bg-[#005684]/10 dark:bg-[#005684]/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#005684] dark:text-[#93ccff]">
                    License Verification Audit
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#aff0db]/40 text-[#195b4c] dark:text-[#aff0db] text-[10px] font-bold">
                    Nursys Compliance
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  Nursys lookups, license numbers, hospital credentials, and PII purge status.
                </p>
                <div className="mt-2 text-[10px] font-bold text-gray-400">
                  {licenseReviews.length} Review Records • 10 Fields
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePreset('host-revenue');
                  setSyncSuccessResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ease-in-out ${
                  activePreset === 'host-revenue'
                    ? 'border-[#005684] bg-[#005684]/10 dark:bg-[#005684]/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#005684] dark:text-[#93ccff]">
                    Host Revenue &amp; 5% Fee Ledger
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#005684] dark:text-[#93ccff]">
                    account_balance
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  Gross rents, 5% platform take-rate fee, net host payouts, and clinician stay rosters.
                </p>
                <div className="mt-2 text-[10px] font-bold text-gray-400">
                  {bookingRequests.length} Booking Ledgers • 13 Fields
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePreset('housing-comparison');
                  setSyncSuccessResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ease-in-out ${
                  activePreset === 'housing-comparison'
                    ? 'border-[#005684] bg-[#005684]/10 dark:bg-[#005684]/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#005684] dark:text-[#93ccff]">
                    Hospital Sanctuaries Audit
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#005684] dark:text-[#93ccff]">
                    apartment
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  Blackout drapes, sound dB ratings, hospital commute proximity, and calloff protection.
                </p>
                <div className="mt-2 text-[10px] font-bold text-gray-400">
                  {listings.length} Property Sanctuaries • 16 Fields
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePreset('nurse-tax');
                  setSyncSuccessResult(null);
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ease-in-out ${
                  activePreset === 'nurse-tax'
                    ? 'border-[#005684] bg-[#005684]/10 dark:bg-[#005684]/20 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#005684] dark:text-[#93ccff]">
                    Clinician Stipend &amp; Tax Ledger
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
                    M2 Scope
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  Phase 2 lodging expense audit proof, stipend allowances, and assignment rotations.
                </p>
                <div className="mt-2 text-[10px] font-bold text-gray-400">
                  {bookingRequests.length} Rotations • 14 Fields
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Destination Selection */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-black/20 border border-gray-200/80 dark:border-gray-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Step 3 • Choose Destination in Google Drive
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="radio"
                  name="targetMode"
                  value="new"
                  checked={targetMode === 'new'}
                  onChange={() => setTargetMode('new')}
                  className="text-[#0F9D58] focus:ring-[#0F9D58]"
                />
                <span>Create New Google Spreadsheet</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="radio"
                  name="targetMode"
                  value="existing"
                  checked={targetMode === 'existing'}
                  onChange={() => setTargetMode('existing')}
                  className="text-[#0F9D58] focus:ring-[#0F9D58]"
                />
                <span>Append to Existing Google Spreadsheet</span>
              </label>
            </div>

            {targetMode === 'new' ? (
              <div className="pt-2">
                <label htmlFor="sheetTitleInput" className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Spreadsheet Title:
                </label>
                <input
                  id="sheetTitleInput"
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Enter spreadsheet title..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#122035] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#005684]"
                />
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="existingSheetSelect" className="text-[11px] font-semibold text-gray-500">
                    Select Target Google Spreadsheet from your Drive:
                  </label>
                  <button
                    type="button"
                    onClick={loadDriveSpreadsheets}
                    disabled={isLoadingSheets || !hasToken}
                    className="text-[11px] font-bold text-[#005684] dark:text-[#93ccff] cursor-pointer flex items-center gap-1 group"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    <span className="group-hover:underline">Refresh Drive Files</span>
                  </button>
                </div>

                {isLoadingSheets ? (
                  <div className="text-xs text-gray-500 py-2">Loading your Google Spreadsheets...</div>
                ) : existingSheets.length === 0 ? (
                  <div className="text-xs text-amber-600 dark:text-amber-400 py-2">
                    No spreadsheets found in Drive. Try creating a new one or refresh.
                  </div>
                ) : (
                  <select
                    id="existingSheetSelect"
                    value={selectedSheetId}
                    onChange={(e) => setSelectedSheetId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#122035] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#005684]"
                  >
                    {existingSheets.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.name} (ID: {file.id.substring(0, 8)}...)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Step 4: Live Data Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Step 4 • Schema Preview ({currentPayload.rows.length} records • {currentPayload.headers.length} columns)
              </label>
              <span className="text-[11px] text-gray-400">Horizontal scroll enabled</span>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#122035]">
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs border-collapse">
                  <caption className="sr-only">Live Google Sheets Export Preview Table</caption>
                  <thead className="sticky top-0 bg-gray-100 dark:bg-[#182840] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {currentPayload.headers.map((h, i) => (
                        <th key={i} scope="col" className="py-2.5 px-3 font-bold whitespace-nowrap text-[11px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {currentPayload.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={currentPayload.headers.length}
                          className="py-6 text-center text-xs text-gray-400"
                        >
                          No active records in this category. Live entries will appear here.
                        </td>
                      </tr>
                    ) : (
                      currentPayload.rows.slice(0, 5).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-[#162744] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162744]">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="py-2 px-3 whitespace-nowrap text-[11px] text-gray-700 dark:text-gray-200 truncate max-w-[200px]"
                            >
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {syncError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium" role="alert">
              {syncError}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-gray-400">
            Explicit confirmation will be requested before modifying your Google Drive.
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white/5 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!hasToken || isSyncing}
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9D58] hover:bg-[#0c8047] disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-[#005684]"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>
                {isSyncing
                  ? 'Syncing to Sheets...'
                  : targetMode === 'new'
                  ? 'Create & Sync Sheet'
                  : 'Append to Selected Sheet'}
              </span>
            </button>
          </div>
        </div>

        {/* Explicit User Confirmation Dialog (MANDATORY per Workspace guidelines) */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-xs overflow-y-auto p-4 pt-16 flex justify-center items-center"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowConfirmModal(false);
              }
            }}
          >
            <div
              className={`w-full max-w-sm my-auto rounded-[24px] p-6 shadow-[0_12px_32px_rgba(11,37,89,0.12)] border transition-colors ${
                isNightShiftMode
                  ? 'bg-[#0B1626] text-[#E6ECF7] border-[#233550]'
                  : 'bg-white text-[#0B2559] border-[rgba(11,37,89,0.08)]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FB] dark:bg-[#15233a] text-[#0A6FA8] dark:text-[#3E9AD1] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">table_chart</span>
                </div>
                <div>
                  <h3 id="confirm-dialog-title" className="text-base font-semibold leading-tight">
                    Confirm export
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Google Sheets sync
                  </span>
                </div>
              </div>

              <p id="confirm-dialog-desc" className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {targetMode === 'new' ? (
                  <>
                    Create <span className="font-semibold text-[#0B2559] dark:text-white">"{newSheetTitle}"</span> in your Google Drive with {currentPayload.rows.length} records?
                  </>
                ) : (
                  <>
                    Append {currentPayload.rows.length} records to your selected Google Sheet?
                  </>
                )}
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 dark:border-[#233550] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSync}
                  className="px-5 py-2 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]"
                >
                  Sync sheet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
