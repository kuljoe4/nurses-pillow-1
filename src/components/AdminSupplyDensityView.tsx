import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { ALL_US_STATES, STATE_NAMES, STATE_COORDINATES, getStateName, getStateCoordinates, isStateActive } from '../lib/constants/states';
import { HousingListing } from '../types';
import { AdminPagination } from './AdminPagination';
import { AdminResponsiveTableLabels } from './AdminResponsiveTableLabels';

interface AdminSupplyDensityViewProps {
  isNightShiftMode: boolean;
  onActionNotice?: (msg: string) => void;
  managedListings?: HousingListing[];
  onStateActivated?: (stateCode: string, newActiveStates?: string[]) => void;
  activeStates?: string[];
}

// Map Pan Synchronizer
const PanToStateLocation: React.FC<{ coords: { lat: number; lng: number }; zoom: number }> = ({ coords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(coords);
      map.setZoom(zoom);
    }
  }, [map, coords.lat, coords.lng, zoom]);
  return null;
};

export const AdminSupplyDensityView: React.FC<AdminSupplyDensityViewProps> = ({
  isNightShiftMode,
  onActionNotice,
  managedListings = [],
  onStateActivated,
  activeStates: propActiveStates,
}) => {
  const [territoryViewMode, setTerritoryViewMode] = useState<'all' | 'single' | 'compare'>('all');
  const [demandPage, setDemandPage] = useState(1);
  const [waitlistPage, setWaitlistPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [supplyPageSize, setSupplyPageSize] = useState(10);
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [stateSearchQuery, setStateSearchQuery] = useState<string>('');
  const [stateFilterTab, setStateFilterTab] = useState<'all' | 'active' | 'waitlist'>('all');
  const [mapMode, setMapMode] = useState<'pins' | 'demand'>('pins');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 38.5,
    lng: -88.0,
    zoom: 4,
  });

  const [territoriesData, setTerritoriesData] = useState<any>(null);
  const [demandMarkets, setDemandMarkets] = useState<any[]>([]);
  const [waitlistListings, setWaitlistListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
  const [selectedMarketForBriefing, setSelectedMarketForBriefing] = useState<any>(null);

  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [stateToActivate, setStateToActivate] = useState<any>(null);
  const [complianceChecks, setComplianceChecks] = useState({
    marketplaceTax: false,
    lodgingTax: false,
    legalCounsel: false,
  });
  const [isActivatingState, setIsActivatingState] = useState(false);

  // Expandable Drawer / Inspection state for decluttering dense rows
  const [inspectedListing, setInspectedListing] = useState<any | null>(null);
  const [inspectedMarket, setInspectedMarket] = useState<any | null>(null);

  const [rejectionModalListing, setRejectionModalListing] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('Property outside currently active operating jurisdictions.');

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    onActionNotice?.(text);
    setTimeout(() => {
      setToastMessage(prev => prev?.text === text ? null : prev);
    }, 4500);
  };

  // Fetch territories data
  const fetchTerritoryData = async () => {
    try {
      const res = await fetch('/api/admin/territories');
      if (res.ok) {
        const data = await res.json();
        setTerritoriesData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch territory data:', err);
    }
  };

  // Fetch real waitlist listings from PostgreSQL
  const fetchWaitlistListings = async (st?: string) => {
    try {
      const url = st && st !== 'ALL'
        ? `/api/admin/listings/waitlist?state=${st}`
        : '/api/admin/listings/waitlist';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWaitlistListings(data);
      }
    } catch (err) {
      console.warn('Failed to fetch waitlist listings:', err);
    }
  };

  // Fetch demand markets
  const fetchDemandMarkets = async (stateFilter?: string) => {
    try {
      const url = stateFilter && stateFilter !== 'ALL'
        ? `/api/admin/demand-markets?state=${stateFilter}`
        : '/api/admin/demand-markets';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDemandMarkets(data);
      }
    } catch (err) {
      console.warn('Failed to fetch demand markets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerritoryData();
    fetchDemandMarkets();
    fetchWaitlistListings();
  }, []);

  useEffect(() => {
    fetchDemandMarkets(selectedState);
    fetchWaitlistListings(selectedState);
    if (selectedState !== 'ALL') {
      const coords = getStateCoordinates(selectedState);
      setMapCenter(coords);
    } else {
      setMapCenter({ lat: 38.5, lng: -88.0, zoom: 4 });
    }
  }, [selectedState]);

  // Handle state activation with 3-point compliance check
  const handleConfirmActivateState = async () => {
    if (!stateToActivate) return;
    setIsActivatingState(true);
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/admin/territories/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          stateCode: stateToActivate.stateCode,
          complianceChecklist: {
            marketplaceTaxReviewed: complianceChecks.marketplaceTax,
            lodgingTaxVerified: complianceChecks.lodgingTax,
            legalCounselSignedOff: complianceChecks.legalCounsel,
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Success! State ${stateToActivate.stateName} (${stateToActivate.stateCode}) is now live. All waitlist listings published!`, 'success');
        setIsActivateModalOpen(false);
        setStateToActivate(null);
        setComplianceChecks({ marketplaceTax: false, lodgingTax: false, legalCounsel: false });
        await fetchTerritoryData();
        await fetchDemandMarkets(selectedState);
        await fetchWaitlistListings(selectedState);
        if (onStateActivated) {
          onStateActivated(data.activatedState, data.activeStates);
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to activate territory.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error activating territory.', 'error');
    } finally {
      setIsActivatingState(false);
    }
  };

  // Handle real waitlist actions integrated with PostgreSQL
  const handleExecuteWaitlistAction = async (listingId: string, action: string, reason?: string) => {
    setActionLoadingId(listingId);
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch(`/api/admin/listings/${listingId}/waitlist-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, rejectionReason: reason })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Action executed successfully.', 'success');
        setRejectionModalListing(null);
        await fetchTerritoryData();
        await fetchDemandMarkets(selectedState);
        await fetchWaitlistListings(selectedState);
        if (action === 'activate_and_approve' && onStateActivated && data.listing?.state) {
          onStateActivated(data.listing.state);
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'Could not complete waitlist action.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing action.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeStatesList = (propActiveStates && propActiveStates.length > 0
    ? propActiveStates
    : territoriesData?.activeStates || ['NC', 'MD', 'CT', 'ND', 'KS']).map((s: string) => s.toUpperCase());

  // State Profile for selected state
  const currentTerritory = territoriesData?.territories?.find((t: any) => t.stateCode === selectedState);
  const isSelectedStateActive = selectedState === 'ALL' || activeStatesList.includes(selectedState.toUpperCase());

  // State metrics
  const activeCount = selectedState === 'ALL'
    ? territoriesData?.macroStats?.totalLiveListings || managedListings.length
    : (currentTerritory?.activeListingsCount || managedListings.filter(l => l.state === selectedState).length || 0);

  const hostsCount = selectedState === 'ALL'
    ? territoriesData?.macroStats?.totalVerifiedHosts || 8
    : (currentTerritory?.verifiedHostsCount || 2);

  const waitlistCount = selectedState === 'ALL'
    ? territoriesData?.macroStats?.preLaunchWaitlistCount || waitlistListings.length
    : (currentTerritory?.waitlistCount || waitlistListings.filter(w => w.state === selectedState).length);

  const proximityAvg = selectedState === 'ALL'
    ? territoriesData?.macroStats?.averageHospitalProximityMiles || 2.3
    : (currentTerritory?.averageHospitalDistanceMiles || 1.8);

  const demandGap = selectedState === 'ALL'
    ? territoriesData?.macroStats?.overallDemandGapRatio || 28
    : (currentTerritory?.demandGapRatio || 45);

  // Build full 50-state list
  const allStatesArray = Object.entries(ALL_US_STATES).map(([code, name]) => {
    const territoryInfo = territoriesData?.territories?.find((t: any) => t.stateCode === code);
    const isActive = activeStatesList.includes(code.toUpperCase());
    const wlCount = territoryInfo?.waitlistCount || (waitlistListings.filter(w => w.state === code).length);
    return {
      code,
      name,
      active: isActive,
      waitlist: wlCount,
      liveCount: territoryInfo?.activeListingsCount || (managedListings.filter(l => l.state === code).length),
      hubName: getStateCoordinates(code).hubName,
    };
  });

  // Filter states based on tab and search
  const filteredStatesList = allStatesArray.filter(st => {
    const matchesSearch = !stateSearchQuery
      || st.name.toLowerCase().includes(stateSearchQuery.toLowerCase())
      || st.code.toLowerCase().includes(stateSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (stateFilterTab === 'active') return st.active;
    if (stateFilterTab === 'waitlist') return st.waitlist > 0;
    return true;
  });

  // Filter demand markets and waitlist listings based on selected state & stateFilterTab
  const displayedDemandMarkets = demandMarkets.filter(m => {
    if (selectedState !== 'ALL' && m.state !== selectedState) return false;
    if (stateFilterTab === 'active' && !activeStatesList.includes(m.state?.toUpperCase())) return false;
    return true;
  });

  const displayedWaitlistListings = waitlistListings.filter(w => {
    if (selectedState !== 'ALL' && w.state !== selectedState) return false;
    if (stateFilterTab === 'active' && !activeStatesList.includes(w.state?.toUpperCase())) return false;
    return true;
  });

  const displayedLiveListings = managedListings.filter(l => {
    if (selectedState !== 'ALL' && l.state !== selectedState) return false;
    if (stateFilterTab === 'active' && !activeStatesList.includes(l.state?.toUpperCase())) return false;
    return true;
  });

  useEffect(() => { setDemandPage(1); setWaitlistPage(1); setLivePage(1); }, [selectedState, stateFilterTab, displayedDemandMarkets.length, displayedWaitlistListings.length, displayedLiveListings.length]);

  return (
    <div className="space-y-6">
      <AdminResponsiveTableLabels />
      {/* Toast Notice */}
      {toastMessage && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-sm border transition-all animate-in fade-in duration-200 ${
          toastMessage.type === 'success'
            ? 'bg-[#E1EFE9] text-[#2F6E5E] border-[#2F6E5E]/30 dark:bg-[#112d26] dark:text-[#a0eedb]'
            : toastMessage.type === 'error'
            ? 'bg-[#F4E2DC] text-[#A8452E] border-[#A8452E]/30 dark:bg-[#341814] dark:text-[#f8b2a3]'
            : 'bg-[#EFF6FB] text-[#0A6FA8] border-[#0A6FA8]/30 dark:bg-[#15233a] dark:text-[#9cd1f5]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {toastMessage.type === 'success' ? 'check_circle' : toastMessage.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-current hover:opacity-75 p-0.5"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Header & View Mode Switcher */}
      <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-7 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="text-[11px] font-bold text-[#0A6FA8] dark:text-[#3E9AD1] uppercase tracking-wider mb-1">
              Admin Portal • States &amp; Housing Supply
            </div>
            <h2 className="text-xl font-bold text-[#0B2559] dark:text-white">
              States &amp; Housing Supply
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Review housing supply near hospitals by state and open new states when ready.
            </p>
          </div>

          {/* Action Toolbar: View Mode Switcher + Launch State Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher (Equal Heights: h-10) */}
            <div className="inline-flex items-center gap-1 p-1 bg-[#EFF6FB] dark:bg-[#15233a] rounded-2xl border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <button
                type="button"
                onClick={() => { setTerritoryViewMode('all'); setSelectedState('ALL'); }}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  territoryViewMode === 'all' && selectedState === 'ALL'
                    ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#0B2559]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">public</span>
                <span>All States</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTerritoryViewMode('single');
                  if (selectedState === 'ALL') setSelectedState('NC');
                }}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  territoryViewMode === 'single'
                    ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#0B2559]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>State Deep Dive</span>
              </button>
              <button
                type="button"
                onClick={() => setTerritoryViewMode('compare')}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  territoryViewMode === 'compare'
                    ? 'bg-[#0B2559] dark:bg-[#0A6FA8] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#0B2559]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                <span>Compare States</span>
              </button>
            </div>

            {/* Direct "+ Launch Any State" Button (Equal Height: h-10) */}
            <button
              type="button"
              onClick={() => {
                const firstInactive = allStatesArray.find(s => !s.active);
                setStateToActivate(firstInactive ? { stateCode: firstInactive.code, stateName: firstInactive.name } : null);
                setIsActivateModalOpen(true);
              }}
              className="h-10 px-4 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 shadow-sm"
              title="Activate any of the 50 states directly"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Launch Any State</span>
            </button>
          </div>
        </div>

        {/* State Selector & Directory Bar */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Filter Tabs (Active, With Waitlist, All 50) */}
            <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                type="button"
                onClick={() => setStateFilterTab('all')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                  stateFilterTab === 'all'
                    ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All 50 States ({allStatesArray.length})
              </button>
              <button
                type="button"
                onClick={() => setStateFilterTab('active')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                  stateFilterTab === 'active'
                    ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Active ({allStatesArray.filter(s => s.active).length})
              </button>
              <button
                type="button"
                onClick={() => setStateFilterTab('waitlist')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                  stateFilterTab === 'waitlist'
                    ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                With Waitlist ({allStatesArray.filter(s => s.waitlist > 0).length})
              </button>
            </div>

            {/* Quick State Search Input (Height: h-9) */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={stateSearchQuery}
                onChange={(e) => setStateSearchQuery(e.target.value)}
                placeholder="Search state (e.g., Texas, TX, Ohio)..."
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111e33] text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-hidden focus:border-[#0A6FA8]"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-gray-400">
                search
              </span>
              {stateSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStateSearchQuery('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Horizontally Scrollable State Chips Bar (Equal Heights: h-9) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {/* National All Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedState('ALL');
                setTerritoryViewMode('all');
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 cursor-pointer border ${
                selectedState === 'ALL'
                  ? 'bg-[#0B2559] border-[#0B2559] text-white shadow-xs'
                  : 'bg-white dark:bg-[#111e33] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#0A6FA8]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">language</span>
              <span>All States (National)</span>
            </button>

            {filteredStatesList.map(st => {
              const isSelected = selectedState === st.code;
              return (
                <button
                  key={st.code}
                  type="button"
                  onClick={() => {
                    setSelectedState(st.code);
                    if (territoryViewMode === 'all') {
                      setTerritoryViewMode('single');
                    }
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0A6FA8] border-[#0A6FA8] text-white shadow-xs'
                      : 'bg-white dark:bg-[#111e33] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#0A6FA8]'
                  }`}
                  title={`${st.name} (${st.code}) • ${st.active ? 'Active' : (st.waitlist > 0 ? `${st.waitlist} Waiting Hosts` : 'Ready to Launch')}`}
                >
                  <span>{st.code}</span>
                  {st.active && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  )}
                  {st.waitlist > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-[#FBF0D6] text-[#B9822E]'}`}>
                      {st.waitlist}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Stat Strip (Equal Heights & Strict Vertical Alignment) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="h-full min-h-[96px] p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            {selectedState === 'ALL' ? 'Live Listings' : `${selectedState} Live Units`}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0B2559] dark:text-white tabular-nums">
              {activeCount}
            </span>
            <span className="text-[10px] font-bold text-[#2F6E5E] dark:text-[#aff0db]">
              {selectedState === 'ALL' ? 'Active nationwide' : 'Searchable'}
            </span>
          </div>
        </div>

        <div className="h-full min-h-[96px] p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Verified Hosts
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0B2559] dark:text-white tabular-nums">
              {hostsCount}
            </span>
            <span className="text-[10px] font-bold text-[#2F6E5E] dark:text-[#aff0db]">
              Stripe Verified
            </span>
          </div>
        </div>

        <div className="h-full min-h-[96px] p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            {selectedState === 'ALL' ? 'Waitlist Queue' : `${selectedState} Waitlist`}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#B9822E] dark:text-[#f8d489] tabular-nums">
              {waitlistCount}
            </span>
            <span className="text-[10px] font-bold text-[#B9822E] dark:text-[#f8d489]">
              Pre-Launch
            </span>
          </div>
        </div>

        <div className="h-full min-h-[96px] p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Hospital Proximity
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0A6FA8] dark:text-[#3E9AD1] tabular-nums">
              {proximityAvg} mi
            </span>
            <span className="text-[10px] text-gray-500">
              Avg commute
            </span>
          </div>
        </div>

        <div className="h-full min-h-[96px] p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-xs col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Housing Shortage
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#A8452E] dark:text-[#f5a18a] tabular-nums">
              {demandGap}%
            </span>
            <span className="text-[10px] font-bold text-amber-600">
              Unfilled searches
            </span>
          </div>
        </div>
      </div>

      {/* State Activation Safety Gate (Rendered when viewing an unlaunched state) */}
      {!isSelectedStateActive && selectedState !== 'ALL' && (
        <div className="p-5 rounded-2xl bg-[#FBF0D6] dark:bg-[#251e13] border border-[#B9822E]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#B9822E] text-2xl mt-0.5">
              shield
            </span>
            <div>
              <div className="font-bold text-[#0B2559] dark:text-white text-sm">
                {getStateName(selectedState)} ({selectedState}) is not yet active for live bookings
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Hosts in {getStateName(selectedState)} are currently placed on the expansion waitlist. You can launch this state now to unlock live bookings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStateToActivate({ stateCode: selectedState, stateName: getStateName(selectedState) });
              setIsActivateModalOpen(true);
            }}
            className="h-10 px-5 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap self-start sm:self-auto inline-flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Review Checklist &amp; Launch {selectedState}</span>
          </button>
        </div>
      )}

      {/* Active State Verified Badge */}
      {isSelectedStateActive && selectedState !== 'ALL' && (
        <div className="p-4 rounded-2xl bg-[#E1EFE9] dark:bg-[#112d26] border border-[#2F6E5E]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-[#2F6E5E] dark:text-[#a0eedb]">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-bold">
              {getStateName(selectedState)} is an active operating state
            </span>
            <span className="text-gray-400">•</span>
            <span>Live for clinician bookings and instant host listings.</span>
          </div>
          <span className="text-[11px] font-bold text-[#2F6E5E] px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-black/20">
            Compliant
          </span>
        </div>
      )}

      {/* Mode 1 & 2: All States or Single State Deep Dive */}
      {territoryViewMode !== 'compare' && (
        <div className="space-y-6">
          {/* Interactive Map */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-7 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B2559] dark:text-white flex items-center gap-2">
                  <span>Hospital Hubs &amp; Commute Map</span>
                  {selectedState !== 'ALL' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FB] text-[#0A6FA8]">
                      {getStateCoordinates(selectedState).hubName}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedState === 'ALL'
                    ? 'Viewing nationwide hospital footprint and clinician density.'
                    : `Showing travel corridors and 5-mile hospital radius for ${getStateName(selectedState)}.`}
                </p>
              </div>

              {/* Map Layer Mode Switcher (Equal Heights: h-9) */}
              <div className="inline-flex items-center gap-1 p-0.5 bg-[#EFF6FB] dark:bg-[#15233a] rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMapMode('pins')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1 ${
                    mapMode === 'pins'
                      ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                  <span>Listing Pins</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('demand')}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1 ${
                    mapMode === 'demand'
                      ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                  <span>Nurse Demand</span>
                </button>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="h-[380px] w-full rounded-2xl overflow-hidden relative border border-gray-200 dark:border-gray-800">
              <Map
                center={{ lat: mapCenter.lat, lng: mapCenter.lng }}
                zoom={mapCenter.zoom}
                gestureHandling="cooperative"
                disableDefaultUI={false}
                mapId="nurses-pillow-admin-density-map"
                className="w-full h-full"
              >
                <PanToStateLocation coords={{ lat: mapCenter.lat, lng: mapCenter.lng }} zoom={mapCenter.zoom} />

                {/* Render Hospital Hub Markers */}
                {demandMarkets.map((m) => (
                  <AdvancedMarker
                    key={m.id}
                    position={{ lat: m.lat, lng: m.lng }}
                    title={m.hospitalName}
                  >
                    <div className="cursor-pointer group flex flex-col items-center">
                      <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md flex items-center gap-1 border-2 border-white ${
                        m.deficitLevel === 'optimal'
                          ? 'bg-[#2F6E5E]'
                          : m.deficitLevel === 'high' || m.deficitLevel === 'inactive_state'
                          ? 'bg-[#B9822E]'
                          : 'bg-[#A8452E]'
                      }`}>
                        <span className="material-symbols-outlined text-[12px]">local_hospital</span>
                        <span className="truncate max-w-[140px]">{m.hospitalName.split('(')[0]}</span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-0.5" />
                    </div>
                  </AdvancedMarker>
                ))}
              </Map>
            </div>
          </div>

          {/* Hospital Housing Needs Table */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-7 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B2559] dark:text-white flex items-center gap-2">
                  <span>Hospital Housing Needs &amp; Shortages</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A6FA8]/10 text-[#0A6FA8]">
                    {displayedDemandMarkets.length} Priority Hospitals
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Target hospitals with high clinician search volume to recruit furnished hosts.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto admin-responsive-table">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Hospital &amp; City</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3">Searches (30d)</th>
                    <th className="py-3 px-3">Live Units</th>
                    <th className="py-3 px-3">Housing Deficit Status</th>
                    <th className="py-3 px-3">Clinician Budget</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {displayedDemandMarkets.slice((demandPage - 1) * supplyPageSize, demandPage * supplyPageSize).map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#0B2559] dark:text-white">{m.hospitalName}</div>
                        <div className="text-[10px] text-gray-400">{m.city} • Target ZIPs: {m.targetZipCodes?.join(', ')}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-700 dark:text-gray-300">
                        {m.state}
                      </td>
                      <td className="py-3.5 px-3 font-bold tabular-nums">
                        {m.searches30d?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 font-bold tabular-nums">
                        {m.activeSupply}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className="px-2.5 py-0.5 rounded-full font-bold text-[10px]"
                          style={{
                            backgroundColor: `${m.deficitColor}15`,
                            color: m.deficitColor,
                          }}
                        >
                          {m.deficitLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 tabular-nums font-semibold">
                        ${m.averageMonthlyBudget?.toLocaleString()} / mo
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedMarket(m)}
                            className="h-8 px-2.5 rounded-lg bg-[#EFF6FB] hover:bg-[#E0EFF9] dark:bg-[#182840] dark:hover:bg-[#203350] text-[#0A6FA8] dark:text-[#3E9AD1] text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                            title="Inspect demand market details"
                          >
                            <span className="material-symbols-outlined text-[13px]">info</span>
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMapCenter({ lat: m.lat, lng: m.lng, zoom: 13 });
                            }}
                            className="h-8 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                            title="Center map on this hospital"
                          >
                            <span className="material-symbols-outlined text-[13px]">pin_drop</span>
                            <span>Map</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMarketForBriefing(m);
                              setIsRecruitModalOpen(true);
                            }}
                            className="h-8 px-3 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">campaign</span>
                            <span>Outreach Plan</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination total={displayedDemandMarkets.length} page={demandPage} pageSize={supplyPageSize} onPageChange={setDemandPage} onPageSizeChange={setSupplyPageSize} />
          </div>

          {/* Properties Waiting for State Launch (Waitlist Queue) */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-7 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B2559] dark:text-white flex items-center gap-2">
                  <span>Properties Waiting for State Launch</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B9822E]/20 text-[#B9822E]">
                    {displayedWaitlistListings.length} Listings
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Properties registered by hosts in states pending launch. Real-time actions update PostgreSQL directly.
                </p>
              </div>
            </div>

            {displayedWaitlistListings.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No properties currently on waitlist for this selection.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Property &amp; Host</th>
                      <th className="py-3 px-3">State &amp; Address</th>
                      <th className="py-3 px-3">Nearest Hospital</th>
                      <th className="py-3 px-3">Monthly Rent</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {displayedWaitlistListings.slice((waitlistPage - 1) * supplyPageSize, waitlistPage * supplyPageSize).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#0B2559] dark:text-white">{item.title}</div>
                          <div className="text-[10px] text-gray-400">Host: {item.host_name}</div>
                        </td>
                        <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300">
                          <div>{item.city}, {item.state}</div>
                          <div className="text-[10px] text-gray-400">{item.address_line1}</div>
                        </td>
                        <td className="py-3.5 px-3 text-[#0A6FA8] font-semibold text-[11px]">
                          {item.nearestHospital}
                        </td>
                        <td className="py-3.5 px-3 font-bold tabular-nums">
                          ${item.monthly_rent?.toLocaleString()} / mo
                        </td>
                        <td className="py-3.5 px-3">
                          {item.is_published ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E1EFE9] text-[#2F6E5E]">
                              Published Live
                            </span>
                          ) : item.admin_rejection_reason ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4E2DC] text-[#A8452E]" title={item.admin_rejection_reason}>
                              Declined
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBF0D6] text-[#B9822E]">
                              Waiting on Launch
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectedListing(item)}
                              className="h-8 px-2.5 rounded-lg bg-[#EFF6FB] hover:bg-[#E0EFF9] dark:bg-[#182840] dark:hover:bg-[#203350] text-[#0A6FA8] dark:text-[#3E9AD1] text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                              title="Inspect listing amenities and host verification"
                            >
                              <span className="material-symbols-outlined text-[13px]">info</span>
                              <span>Details</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => handleExecuteWaitlistAction(item.id, 'activate_and_approve')}
                              className="h-8 px-3 rounded-lg bg-[#2F6E5E] hover:bg-[#25584b] text-white text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                              title="Approve and publish live"
                            >
                              {actionLoadingId === item.id ? (
                                <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[13px]">check</span>
                              )}
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => handleExecuteWaitlistAction(item.id, 'hold_waitlist')}
                              className="h-8 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-[#B9822E] text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1 disabled:opacity-50"
                              title="Keep saved on waitlist"
                            >
                              <span>Hold</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => setRejectionModalListing(item)}
                              className="h-8 px-3 rounded-lg bg-red-100 hover:bg-red-200 text-[#A8452E] text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1 disabled:opacity-50"
                              title="Decline with Feedback"
                            >
                              <span>Decline</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AdminPagination total={displayedWaitlistListings.length} page={waitlistPage} pageSize={supplyPageSize} onPageChange={setWaitlistPage} onPageSizeChange={setSupplyPageSize} />
          </div>

          {/* Live Housing Supply in Active States Table */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-7 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B2559] dark:text-white flex items-center gap-2">
                  <span>Live Housing Supply in Active States</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2F6E5E]/20 text-[#2F6E5E]">
                    {displayedLiveListings.length} Published Units
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Published furnished housing listings actively searchable and bookable by travel clinicians.
                </p>
              </div>
            </div>

            {displayedLiveListings.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No active live listings found for this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Property &amp; Host</th>
                      <th className="py-3 px-3">State &amp; City</th>
                      <th className="py-3 px-3">Nearest Hospital</th>
                      <th className="py-3 px-3">Monthly Rent</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {displayedLiveListings.slice((livePage - 1) * supplyPageSize, livePage * supplyPageSize).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#0B2559] dark:text-white">{item.title}</div>
                          <div className="text-[10px] text-gray-400">Host: {item.hostName || 'Stripe Verified Host'}</div>
                        </td>
                        <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300 font-semibold">
                          <div>{item.city}, {item.state}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{item.neighborhood || item.city}</div>
                        </td>
                        <td className="py-3.5 px-3 text-[#0A6FA8] font-semibold text-[11px]">
                          {item.nearestHospital || item.proximityToHospital || 'Hospital Proximity'}
                        </td>
                        <td className="py-3.5 px-3 font-bold tabular-nums">
                          ${item.monthlyRate?.toLocaleString()} / mo
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-[#E1EFE9] text-[#2F6E5E]">
                            Bookable Live
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectedListing({
                              id: item.id,
                              title: item.title,
                              address_line1: item.neighborhood || item.city,
                              city: item.city,
                              state: item.state,
                              postal_code: '',
                              nearestHospital: item.nearestHospital || 'Regional Medical Center',
                              monthly_rent: item.monthlyRate,
                              property_type: item.propertyType || 'entire_home',
                              host_name: item.hostName || 'Verified Host',
                              amenities: typeof item.amenities === 'string'
                                ? item.amenities
                                : item.amenities
                                ? Object.entries(item.amenities).filter(([, v]) => Boolean(v)).map(([k]) => k.replace(/([A-Z])/g, ' $1')).join(', ')
                                : 'Daytime quiet hours, Blackout curtains, In-unit laundry, High-speed Wi-Fi',
                              is_published: true,
                            })}
                            className="h-8 px-2.5 rounded-lg bg-[#EFF6FB] hover:bg-[#E0EFF9] dark:bg-[#182840] text-[#0A6FA8] dark:text-[#3E9AD1] text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">info</span>
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AdminPagination total={displayedLiveListings.length} page={livePage} pageSize={supplyPageSize} onPageChange={setLivePage} onPageSizeChange={setSupplyPageSize} />
          </div>
        </div>
      )}

      {/* Mode 3: Compare States Matrix View */}
      {territoryViewMode === 'compare' && (
        <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-[#0B2559] dark:text-white">
                State Launch &amp; Supply Comparison
              </h3>
              <p className="text-xs text-gray-500">
                Benchmark all 50 states to evaluate nurse search demand, current housing, and legal readiness.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-3">Launch Status</th>
                  <th className="py-3 px-3">Live Units</th>
                  <th className="py-3 px-3">Waiting Hosts</th>
                  <th className="py-3 px-3">Housing Shortage</th>
                  <th className="py-3 px-3">Tax &amp; Legal Sign-Off</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {territoriesData?.territories?.map((t: any) => (
                  <tr key={t.stateCode} className="hover:bg-gray-50 dark:hover:bg-[#14233a] transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#0B2559] dark:text-white">{t.stateName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{t.stateCode} • {t.hubName?.split('(')[0]}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      {t.status === 'active' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E1EFE9] text-[#2F6E5E] font-bold text-[10px]">
                          Live Market
                        </span>
                      ) : t.waitlistCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FBF0D6] text-[#B9822E] font-bold text-[10px]">
                          Waitlist ({t.waitlistCount})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px]">
                          Ready to Launch
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-bold tabular-nums">
                      {t.activeListingsCount}
                    </td>
                    <td className="py-3.5 px-3 font-bold tabular-nums text-amber-600">
                      {t.waitlistCount}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold tabular-nums text-red-600">
                        {t.demandGapRatio}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[11px]">
                      {t.complianceChecklist?.legalCounselSignedOff ? (
                        <span className="text-[#2F6E5E] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          Signed Off
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Pending Review</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {t.status !== 'active' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setStateToActivate(t);
                            setIsActivateModalOpen(true);
                          }}
                          className="h-8 px-3 rounded-lg bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center justify-center shadow-xs"
                        >
                          Launch State
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedState(t.stateCode);
                            setTerritoryViewMode('single');
                          }}
                          className="h-8 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold cursor-pointer inline-flex items-center justify-center"
                        >
                          View State
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Outbound Host Recruitment Briefing Modal */}
      {isRecruitModalOpen && selectedMarketForBriefing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[rgba(11,37,89,0.1)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A6FA8]">campaign</span>
                <h3 className="font-bold text-[#0B2559] dark:text-white text-base">
                  Host Outreach Plan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecruitModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 space-y-1">
                <div className="font-bold text-[#0B2559] dark:text-white text-[13px]">
                  {selectedMarketForBriefing.hospitalName} ({selectedMarketForBriefing.state})
                </div>
                <div className="text-gray-500">
                  Target Corridors: <span className="font-semibold text-[#0B2559] dark:text-white">{selectedMarketForBriefing.targetZipCodes?.join(', ')}</span>
                </div>
                <div className="text-gray-500">
                  Clinician Average Budget: <span className="font-bold text-[#2F6E5E]">${selectedMarketForBriefing.averageMonthlyBudget?.toLocaleString()} / month</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Suggested Outreach Letter for Local Property Hosts:
                </label>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#0E1A2E] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-mono text-[11px] leading-relaxed">
                  &quot;Hello, Nurses Pillow has {selectedMarketForBriefing.searches30d} travel nurses currently looking for clean, quiet housing near {selectedMarketForBriefing.hospitalName}. If you have a furnished apartment or room within 5 miles, you can list with $0 platform fees and direct clinical bookings.&quot;
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Nurses Pillow Host Outreach for ${selectedMarketForBriefing.hospitalName}: Target ZIPs ${selectedMarketForBriefing.targetZipCodes?.join(', ')}. Average Nurse Budget: $${selectedMarketForBriefing.averageMonthlyBudget}/mo.`);
                  showToast('Outreach briefing copied to clipboard!', 'info');
                  setIsRecruitModalOpen(false);
                }}
                className="h-10 px-5 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy Outreach Text</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 3-Point State Activation Safety Gate (Allows selecting ANY of the 50 States) */}
      {isActivateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[rgba(11,37,89,0.1)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2F6E5E]">verified_user</span>
                <h3 className="font-bold text-[#0B2559] dark:text-white text-base">
                  Launch State for Live Bookings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsActivateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Select State (Choose ANY of the 50 US States) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                Select State to Launch:
              </label>
              <select
                value={stateToActivate?.stateCode || ''}
                onChange={(e) => {
                  const code = e.target.value;
                  const name = getStateName(code);
                  setStateToActivate({ stateCode: code, stateName: name });
                }}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E1A2E] text-xs font-bold text-[#0B2559] dark:text-white focus:outline-hidden focus:border-[#0A6FA8]"
              >
                <option value="" disabled>Choose any US state...</option>
                {allStatesArray.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code}) {st.active ? '— Already Active' : (st.waitlist > 0 ? `— ${st.waitlist} Waiting Hosts` : '— Ready')}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Operating nationwide requires legal and tax sign-offs to protect hosts and clinicians. Please confirm all 3 safety points before activating {stateToActivate?.stateName || 'this state'}:
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#14233a] border border-gray-200 dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={complianceChecks.marketplaceTax}
                  onChange={(e) => setComplianceChecks({ ...complianceChecks, marketplaceTax: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-[#0A6FA8] rounded border-gray-300 focus:ring-[#0A6FA8]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#0B2559] dark:text-white">
                    1. Marketplace Tax Collection
                  </div>
                  <div className="text-[11px] text-gray-500">
                    State Department of Revenue registration and automated tax remittance verified.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#14233a] border border-gray-200 dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={complianceChecks.lodgingTax}
                  onChange={(e) => setComplianceChecks({ ...complianceChecks, lodgingTax: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-[#0A6FA8] rounded border-gray-300 focus:ring-[#0A6FA8]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#0B2559] dark:text-white">
                    2. Lodging Tax Exemption
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Transient tax waiver thresholds (30 or 90 consecutive days) documented.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#14233a] border border-gray-200 dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={complianceChecks.legalCounsel}
                  onChange={(e) => setComplianceChecks({ ...complianceChecks, legalCounsel: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-[#0A6FA8] rounded border-gray-300 focus:ring-[#0A6FA8]"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#0B2559] dark:text-white">
                    3. Legal Review
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Healthcare mid-term rental lease terms reviewed and approved by legal counsel.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsActivateModalOpen(false)}
                className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold cursor-pointer hover:bg-gray-50 inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!stateToActivate?.stateCode || !complianceChecks.marketplaceTax || !complianceChecks.lodgingTax || !complianceChecks.legalCounsel || isActivatingState}
                onClick={handleConfirmActivateState}
                className={`h-10 px-5 rounded-xl text-white text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 ${
                  stateToActivate?.stateCode && complianceChecks.marketplaceTax && complianceChecks.lodgingTax && complianceChecks.legalCounsel && !isActivatingState
                    ? 'bg-[#2F6E5E] hover:bg-[#25584b] cursor-pointer shadow-sm'
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {complianceChecks.marketplaceTax && complianceChecks.lodgingTax && complianceChecks.legalCounsel ? 'check_circle' : 'lock'}
                </span>
                <span>
                  {isActivatingState ? 'Launching State...' : `Launch ${stateToActivate?.stateCode || 'State'} & Publish Listings`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Decline Listing with Feedback Modal */}
      {rejectionModalListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-md w-full p-6 shadow-xl border border-[rgba(11,37,89,0.1)] space-y-4">
            <h3 className="font-bold text-[#0B2559] dark:text-white text-base">
              Decline Listing with Feedback
            </h3>
            <p className="text-xs text-gray-500">
              Provide a clear reason so the host understands why their listing cannot go live right now:
            </p>

            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E1A2E] text-xs font-semibold focus:outline-hidden focus:border-[#0A6FA8]"
            >
              <option value="Property outside currently active operating jurisdictions.">State Not Yet Active</option>
              <option value="Unclear property ownership document or authority to list.">Unclear Ownership Document</option>
              <option value="Incomplete street or unit address provided.">Incomplete Address</option>
              <option value="Property amenities do not meet clinical rest standards.">Amenities Do Not Meet Standards</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalListing(null)}
                className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteWaitlistAction(rejectionModalListing.id, 'reject', rejectionReason)}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center shadow-xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Expandable Property Drawer / Full Inspection Modal */}
      {inspectedListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[rgba(11,37,89,0.1)] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A6FA8]">real_estate_agent</span>
                <div>
                  <h3 className="font-bold text-[#0B2559] dark:text-white text-base">
                    Property Waitlist Inspection
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">ID: {inspectedListing.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedListing(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 space-y-2">
                <div className="font-bold text-[#0B2559] dark:text-white text-sm">
                  {inspectedListing.title}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-500">Address:</span> {inspectedListing.address_line1}, {inspectedListing.city}, {inspectedListing.state} {inspectedListing.postal_code}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-500">Target Clinical Hub:</span> {inspectedListing.nearestHospital}
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <div>
                    <span className="text-gray-400 text-[10px] block uppercase font-bold">Monthly Rent</span>
                    <span className="text-sm font-extrabold text-[#0B2559] dark:text-white tabular-nums">${inspectedListing.monthly_rent?.toLocaleString()} / mo</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block uppercase font-bold">Property Type</span>
                    <span className="text-xs font-bold text-[#0A6FA8]">{inspectedListing.property_type === 'entire_home' ? 'Entire Home' : 'Individual Room'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block uppercase font-bold">Host</span>
                    <span className="text-xs font-semibold">{inspectedListing.host_name}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Clinician Rest &amp; Sanctuary Amenities:
                </label>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0E1A2E] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  {inspectedListing.amenities || 'Daytime quiet hours, Blackout curtains, In-unit laundry, High-speed Wi-Fi'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Launch Authority &amp; State Compliance:
                </label>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0E1A2E] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>State Footprint: <strong className="text-[#0B2559] dark:text-white">{getStateName(inspectedListing.state || 'FL')} ({inspectedListing.state})</strong></span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inspectedListing.is_published
                      ? 'bg-[#E1EFE9] text-[#2F6E5E]'
                      : 'bg-[#FBF0D6] text-[#B9822E]'
                  }`}>
                    {inspectedListing.is_published ? 'Active Live' : 'Pre-Launch Waitlist'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setInspectedListing(null)}
                className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const itm = inspectedListing;
                    setInspectedListing(null);
                    setRejectionModalListing(itm);
                  }}
                  className="h-10 px-4 rounded-xl bg-red-100 hover:bg-red-200 text-[#A8452E] text-xs font-bold cursor-pointer transition-colors"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = inspectedListing.id;
                    setInspectedListing(null);
                    await handleExecuteWaitlistAction(id, 'activate_and_approve');
                  }}
                  className="h-10 px-5 rounded-xl bg-[#2F6E5E] hover:bg-[#25584b] text-white text-xs font-bold cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  <span>Approve &amp; Publish Live</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Expandable Demand Market Inspection Modal */}
      {inspectedMarket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[rgba(11,37,89,0.1)] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0A6FA8]">local_hospital</span>
                <h3 className="font-bold text-[#0B2559] dark:text-white text-base">
                  Hospital Demand &amp; Shortage Analysis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedMarket(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 space-y-2">
                <div className="font-bold text-[#0B2559] dark:text-white text-sm">
                  {inspectedMarket.hospitalName} ({inspectedMarket.state})
                </div>
                <div className="text-gray-500">
                  Metro Location: <span className="font-semibold text-[#0B2559] dark:text-white">{inspectedMarket.city}, {inspectedMarket.state}</span>
                </div>
                <div className="text-gray-500">
                  Target Postal Corridors: <span className="font-semibold text-[#0B2559] dark:text-white">{inspectedMarket.targetZipCodes?.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">30d Searches</span>
                    <span className="text-base font-extrabold text-[#0B2559] dark:text-white tabular-nums">{inspectedMarket.searches30d?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Live Supply</span>
                    <span className="text-base font-extrabold text-[#0A6FA8] tabular-nums">{inspectedMarket.activeSupply} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Avg Budget</span>
                    <span className="text-base font-extrabold text-[#2F6E5E] tabular-nums">${inspectedMarket.averageMonthlyBudget?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Top Requested Clinician Amenities in this Corridor:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(inspectedMarket.topRequestedAmenities || ['Dedicated Parking', 'Daytime Quiet Hours', 'In-Unit Washer', 'Blackout Shades']).map((amenity: string) => (
                    <span key={amenity} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-[11px]">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Recommended Recruitment Priority:
                </label>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0E1A2E] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span className="font-bold" style={{ color: inspectedMarket.deficitColor }}>
                    {inspectedMarket.deficitLabel}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    High Clinician Inquiries
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setInspectedMarket(null)}
                className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const m = inspectedMarket;
                    setInspectedMarket(null);
                    setMapCenter({ lat: m.lat, lng: m.lng, zoom: 13 });
                  }}
                  className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">pin_drop</span>
                  <span>View on Map</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const m = inspectedMarket;
                    setInspectedMarket(null);
                    setSelectedMarketForBriefing(m);
                    setIsRecruitModalOpen(true);
                  }}
                  className="h-10 px-5 rounded-xl bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[15px]">campaign</span>
                  <span>Outreach Briefing</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
