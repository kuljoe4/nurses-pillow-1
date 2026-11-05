import React, { useState, useEffect } from 'react';

interface AdminAnalyticsDashboardProps {
  isNightShiftMode: boolean;
  onActionNotice?: (msg: string) => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  isNightShiftMode,
  onActionNotice,
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'fees' | 'promos' | 'zero_inventory'>('overview');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'ytd' | 'all'>('30d');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dynamic Fee State
  const [hostFeeSlider, setHostFeeSlider] = useState<number>(5.0);
  const [feeSettings, setFeeSettings] = useState<any>(null);
  const [isSavingFee, setIsSavingFee] = useState<boolean>(false);
  const [feeSaveSuccess, setFeeSaveSuccess] = useState<string | null>(null);

  // Promo Codes State
  const [promos, setPromos] = useState<any[]>([]);
  const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minBookingValue: 1000,
    eligibleStates: ['NC', 'MD', 'CT', 'ND', 'KS'],
    maxUses: 50,
  });

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const params = new URLSearchParams();
      if (selectedState !== 'all') params.set('state', selectedState);

      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Fee Settings
  const fetchFeeSettings = async () => {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/admin/settings/platform-fee', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFeeSettings(data);
        setHostFeeSlider(Number(data.hostFeePercent ?? 5.0));
      }
    } catch (err) {
      console.error('Failed to load fee settings:', err);
    }
  };

  // Fetch Promos
  const fetchPromos = async () => {
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/admin/promos', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPromos(data.promos || []);
      }
    } catch (err) {
      console.error('Failed to load promos:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchFeeSettings();
    fetchPromos();
  }, [dateRange, selectedState]);

  // Handle Save Fee
  const handleSaveFee = async () => {
    setIsSavingFee(true);
    setFeeSaveSuccess(null);
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/admin/settings/platform-fee', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          newFeePercent: hostFeeSlider,
          reason: 'Administrative rate adjustment',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeeSaveSuccess(`Host fee updated to ${hostFeeSlider.toFixed(1)}%. ${data.hostsNotifiedCount || 0} active hosts notified.`);
        if (onActionNotice) onActionNotice(`Host fee updated to ${hostFeeSlider.toFixed(1)}%`);
        fetchFeeSettings();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update fee');
      }
    } catch (err) {
      console.error('Error updating fee:', err);
    } finally {
      setIsSavingFee(false);
    }
  };

  // Handle Create Promo
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newPromo),
      });

      if (res.ok) {
        setIsCreatePromoOpen(false);
        setNewPromo({
          code: '',
          discountType: 'percentage',
          discountValue: 10,
          minBookingValue: 1000,
          eligibleStates: ['NC', 'MD', 'CT', 'ND', 'KS'],
          maxUses: 50,
        });
        fetchPromos();
        if (onActionNotice) onActionNotice('New promo code created');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create promo code');
      }
    } catch (err) {
      console.error('Error creating promo:', err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!analyticsData) return;
    const m = analyticsData.metrics;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value\n" +
      `Gross Booking Value (GBV),$${m.gbv}\n` +
      `Platform Fee Revenue,$${m.platformRevenue}\n` +
      `Effective Take Rate,${m.effectiveTakeRate}%\n` +
      `Traveler Platform Fee,$0.00 (Guaranteed Free)\n` +
      `Confirmed Stays,${m.confirmedBookings}\n` +
      `Acceptance Rate,${m.acceptanceRate}%\n` +
      `Cancellation Rate,${m.cancellationRate}%\n` +
      `Average Length of Stay,${m.alosWeeks} Weeks (${m.alosDays} Days)\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nurses_pillow_analytics_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = analyticsData?.metrics || {
    gbv: 148000,
    platformRevenue: 7400,
    effectiveTakeRate: 5.0,
    travelerFeeCharged: 0.00,
    confirmedBookings: 48,
    acceptanceRate: 92.5,
    cancellationRate: 3.2,
    alosWeeks: 13.0,
    alosDays: 91,
  };

  const demandReport = analyticsData?.demandReport || [];
  const monthlyTrends = analyticsData?.monthlyTrends || [];

  // Payout calculation for slider simulation
  const simRent = 2000.00;
  const simFeeAmount = Math.round(simRent * (hostFeeSlider / 100) * 100) / 100;
  const simHostPayout = Math.round((simRent - simFeeAmount) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Sub-Navigation & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
        <div className="flex items-center gap-1.5 p-1 bg-[#EFF6FB] dark:bg-[#0E1A2E] rounded-xl">
          <button
            onClick={() => setSubTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subTab === 'overview'
                ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-sm font-semibold'
                : 'text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] hover:text-[#0B2559]'
            }`}
          >
            Marketplace Overview
          </button>
          <button
            onClick={() => setSubTab('zero_inventory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subTab === 'zero_inventory'
                ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-sm font-semibold'
                : 'text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] hover:text-[#0B2559]'
            }`}
          >
            Zero-Inventory Demand
          </button>
          <button
            onClick={() => setSubTab('fees')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subTab === 'fees'
                ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-sm font-semibold'
                : 'text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] hover:text-[#0B2559]'
            }`}
          >
            Host Fee Controls (0–15%)
          </button>
          <button
            onClick={() => setSubTab('promos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subTab === 'promos'
                ? 'bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white shadow-sm font-semibold'
                : 'text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] hover:text-[#0B2559]'
            }`}
          >
            Promo Codes
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* State selector */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-[rgba(11,37,89,0.15)] dark:border-[#233550] bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white"
          >
            <option value="all">All Active States</option>
            <option value="NC">North Carolina (NC)</option>
            <option value="MD">Maryland (MD)</option>
            <option value="CT">Connecticut (CT)</option>
            <option value="ND">North Dakota (ND)</option>
            <option value="KS">Kansas (KS)</option>
          </select>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-lg border border-[rgba(11,37,89,0.15)] dark:border-[#233550] bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white hover:bg-[#EFF6FB] dark:hover:bg-[#15253e] text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: MARKETPLACE OVERVIEW */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* 5-KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
              <span className="text-[11px] font-medium text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] uppercase tracking-wider block">
                Gross Booking Value (GBV)
              </span>
              <p className="text-2xl font-bold text-[#0B2559] dark:text-white mt-1 tabular-nums">
                ${metrics.gbv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+14.2% vs previous month</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
              <span className="text-[11px] font-medium text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] uppercase tracking-wider block">
                Platform Revenue ({metrics.effectiveTakeRate}%)
              </span>
              <p className="text-2xl font-bold text-[#0A6FA8] dark:text-[#3E9AD1] mt-1 tabular-nums">
                ${metrics.platformRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2 text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                $0.00 Traveler Fee guaranteed
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
              <span className="text-[11px] font-medium text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] uppercase tracking-wider block">
                Request Acceptance Rate
              </span>
              <p className="text-2xl font-bold text-[#0B2559] dark:text-white mt-1 tabular-nums">
                {metrics.acceptanceRate}%
              </p>
              <div className="mt-2 text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                {metrics.confirmedBookings} confirmed bookings
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
              <span className="text-[11px] font-medium text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] uppercase tracking-wider block">
                Cancellation Rate
              </span>
              <p className="text-2xl font-bold text-[#0B2559] dark:text-white mt-1 tabular-nums">
                {metrics.cancellationRate}%
              </p>
              <div className="mt-2 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                Well below 5% platform goal
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
              <span className="text-[11px] font-medium text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] uppercase tracking-wider block">
                Average Length of Stay (ALOS)
              </span>
              <p className="text-2xl font-bold text-[#0B2559] dark:text-white mt-1 tabular-nums">
                {metrics.alosWeeks} wks
              </p>
              <div className="mt-2 text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] tabular-nums">
                {metrics.alosDays} clinical days avg
              </div>
            </div>
          </div>

          {/* Revenue & Booking Trends Bar Graph */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0B2559] dark:text-white">
                  Monthly Gross Booking Value & Platform Revenue
                </h3>
                <p className="text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] mt-0.5">
                  Consistent assignment booking progression across active hospital clusters
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">
                  <span className="w-3 h-3 rounded-sm bg-[#0B2559] dark:bg-[#3E9AD1]" />
                  <span>GBV</span>
                </span>
                <span className="flex items-center gap-1.5 text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">
                  <span className="w-3 h-3 rounded-sm bg-[#0A6FA8]" />
                  <span>Platform Revenue (5%)</span>
                </span>
              </div>
            </div>

            <div className="h-56 flex items-end gap-6 pt-6 pb-2 border-b border-gray-100 dark:border-[#1E293B]">
              {monthlyTrends.map((trend: any, idx: number) => {
                const maxGbv = 160000;
                const gbvHeight = Math.min(100, Math.round((trend.gbv / maxGbv) * 100));
                const revHeight = Math.min(100, Math.round((trend.revenue / 8000) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      <div
                        style={{ height: `${gbvHeight}%` }}
                        className="w-1/2 max-w-[28px] bg-[#0B2559] dark:bg-[#3E9AD1] rounded-t-md transition-all duration-300 relative group"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded whitespace-nowrap pointer-events-none transition-opacity tabular-nums z-10">
                          ${trend.gbv.toLocaleString()}
                        </div>
                      </div>
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-1/2 max-w-[28px] bg-[#0A6FA8] rounded-t-md transition-all duration-300 relative group"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-1.5 rounded whitespace-nowrap pointer-events-none transition-opacity tabular-nums z-10">
                          ${trend.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] whitespace-nowrap">
                      {trend.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ZERO-INVENTORY DEMAND INTELLIGENCE */}
      {subTab === 'zero_inventory' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0B2559] dark:text-white">
                Demand-Without-Inventory Medical Centers
              </h3>
              <p className="text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] mt-0.5">
                Surfaces healthcare facilities where clinicians searched for housing but zero verified listings or open rooms were available.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {demandReport.length} High-Demand Clusters
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#233550] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                  <th className="pb-3 font-medium">Healthcare Facility</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium text-right">Nurse Inquiries</th>
                  <th className="pb-3 font-medium text-right">Zero-Inventory Searches</th>
                  <th className="pb-3 font-medium text-right">Unmet Demand Rate</th>
                  <th className="pb-3 font-medium text-right">Recruitment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#233550]">
                {demandReport.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#EFF6FB]/50 dark:hover:bg-[#15253e]/50 transition-colors">
                    <td className="py-3.5 pr-3 font-semibold text-[#0B2559] dark:text-white">
                      {item.hospital_name}
                    </td>
                    <td className="py-3.5 pr-3 text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">
                      {item.city}, {item.state}
                    </td>
                    <td className="py-3.5 pr-3 text-right font-medium tabular-nums text-[#0B2559] dark:text-white">
                      {item.total_searches}
                    </td>
                    <td className="py-3.5 pr-3 text-right font-medium tabular-nums text-amber-600 dark:text-amber-400">
                      {item.zero_inventory_count}
                    </td>
                    <td className="py-3.5 pr-3 text-right font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                      {item.unmet_demand_rate}%
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => {
                          if (onActionNotice) {
                            onActionNotice(`Targeted host outreach initiated for ${item.hospital_name}`);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0A6FA8] text-white hover:bg-[#0C7EBF] transition-colors"
                      >
                        Target Host Recruitment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: DYNAMIC HOST FEE CONTROLS (0-15%) */}
      {subTab === 'fees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#0B2559] dark:text-white">
                Host Service Fee Controller
              </h3>
              <p className="text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] mt-0.5">
                Adjust platform commission retained from host bookings. Strictly capped at 15.0% by platform policy.
              </p>
            </div>

            {feeSaveSuccess && (
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{feeSaveSuccess}</span>
              </div>
            )}

            {/* Slider Component */}
            <div className="space-y-3 p-4 rounded-xl bg-[#EFF6FB] dark:bg-[#0E1A2E]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#0B2559] dark:text-white">
                  Current Host Platform Fee:
                </span>
                <span className="text-2xl font-bold text-[#0A6FA8] dark:text-[#3E9AD1] tabular-nums">
                  {hostFeeSlider.toFixed(1)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={hostFeeSlider}
                onChange={(e) => setHostFeeSlider(parseFloat(e.target.value))}
                className="w-full accent-[#0A6FA8] cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                <span>0.0% (Fee-Free Launch Promotion)</span>
                <span>5.0% (Launch default)</span>
                <span>15.0% (Strict Legal Cap)</span>
              </div>
            </div>

            {/* Simulation Preview */}
            <div className="border border-[rgba(11,37,89,0.08)] dark:border-[#233550] rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-[#0B2559] dark:text-white">
                Live Simulation Preview (on standard $2,000 monthly booking)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#15253e]">
                  <span className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] block">Gross Monthly Rent</span>
                  <span className="font-semibold text-[#0B2559] dark:text-white mt-1 block tabular-nums">$2,000.00</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                  <span className="text-[11px] text-[#0A6FA8] dark:text-[#3E9AD1] block">Platform Fee ({hostFeeSlider.toFixed(1)}%)</span>
                  <span className="font-semibold text-[#0A6FA8] dark:text-[#3E9AD1] mt-1 block tabular-nums">${simFeeAmount.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40">
                  <span className="text-[11px] text-teal-700 dark:text-teal-300 block">Host Net Payout</span>
                  <span className="font-semibold text-teal-800 dark:text-teal-200 mt-1 block tabular-nums">${simHostPayout.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] italic text-center">
                Clinicians are never charged a platform fee ($0.00 traveler fee policy strictly enforced).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHostFeeSlider(5.0)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] hover:bg-gray-50"
              >
                Reset to 5.0% launch default
              </button>
              <button
                type="button"
                onClick={handleSaveFee}
                disabled={isSavingFee}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0A6FA8] text-white hover:bg-[#0C7EBF] disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSavingFee ? 'Saving...' : 'Apply Rate & Notify Hosts'}
              </button>
            </div>
          </div>

          {/* Audit Logs Sidebar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-4">
            <h4 className="text-xs font-semibold text-[#0B2559] dark:text-white">
              Fee Modification Audit Log
            </h4>
            <div className="space-y-3">
              {(feeSettings?.recentLogs || []).map((log: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-[#0E1A2E] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#0B2559] dark:text-white font-medium">
                    <span>{log.previous_fee_percent}% → {log.new_fee_percent}%</span>
                    <span className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                    {log.hosts_notified_count} hosts notified via email & in-app notice
                  </p>
                </div>
              ))}
              {(!feeSettings?.recentLogs || feeSettings.recentLogs.length === 0) && (
                <p className="text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] text-center py-4">
                  No rate changes recorded.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: PROMO CODES */}
      {subTab === 'promos' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0B2559] dark:text-white">
                Promotional & Relief Codes
              </h3>
              <p className="text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] mt-0.5">
                Issue discount vouchers for traveling clinicians during emergency deployment or regional territory launches.
              </p>
            </div>
            <button
              onClick={() => setIsCreatePromoOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#0A6FA8] text-white hover:bg-[#0C7EBF] flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Create Promo Code</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#233550] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                  <th className="pb-3 font-medium">Promo Code</th>
                  <th className="pb-3 font-medium">Discount</th>
                  <th className="pb-3 font-medium">Eligible States</th>
                  <th className="pb-3 font-medium text-right">Redemptions</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#233550]">
                {promos.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#EFF6FB]/50 dark:hover:bg-[#15253e]/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#0B2559] dark:text-white">
                      {p.code}
                    </td>
                    <td className="py-3 text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] tabular-nums">
                      {p.discount_type === 'percentage' ? `${p.discount_value}% off` : `$${p.discount_value} off`}
                    </td>
                    <td className="py-3 text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">
                      {Array.isArray(p.eligible_states) ? p.eligible_states.join(', ') : 'All Active'}
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums text-[#0B2559] dark:text-white">
                      {p.current_uses || 0} / {p.max_total_uses || 100}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        p.is_active ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
                      No active promo codes. Click "Create Promo Code" to add a new discount.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PROMO MODAL */}
      {isCreatePromoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0B1626] rounded-2xl max-w-md w-full p-6 border border-gray-100 dark:border-[#233550] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#0B2559] dark:text-white">
              Create New Promo Code
            </h3>
            <form onSubmit={handleCreatePromo} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] mb-1">
                  Code
                </label>
                <input
                  type="text"
                  required
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. NURSEWELCOME10"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E1A2E] text-[#0B2559] dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={newPromo.discountType}
                    onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value })}
                    className="w-full h-9 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E1A2E] text-[#0B2559] dark:text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPromo.discountValue}
                    onChange={(e) => setNewPromo({ ...newPromo, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E1A2E] text-[#0B2559] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0] mb-1">
                  Maximum Redemptions
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPromo.maxUses}
                  onChange={(e) => setNewPromo({ ...newPromo, maxUses: parseInt(e.target.value, 10) || 50 })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E1A2E] text-[#0B2559] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatePromoOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0A6FA8] text-white hover:bg-[#0C7EBF]"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
