import React, { useState } from 'react';
import { DECISION_BLOCKED_ITEMS } from '../data/phase1InventoryData';

interface LegalPoliciesViewProps {
  isNightShiftMode: boolean;
  initialPolicy?: 'terms' | 'privacy' | 'cancellation' | 'host-agreement' | 'nc-disclosures';
  onNavigateHome: () => void;
}

export const LegalPoliciesView: React.FC<LegalPoliciesViewProps> = ({
  isNightShiftMode,
  initialPolicy = 'cancellation',
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'cancellation' | 'host-agreement' | 'nc-disclosures'>(initialPolicy);

  // Cancellation calculator state
  const [calcRent, setCalcRent] = useState(2800);
  const [calcTier, setCalcTier] = useState<'flexible' | 'moderate' | 'strict'>('flexible');
  const [calcDaysBefore, setCalcDaysBefore] = useState(35);
  const [calcHospitalCancelled, setCalcHospitalCancelled] = useState(false);

  // Calculation logic - Clinical Housing Cancellation & Refund Tiers
  const calculateRefund = () => {
    if (calcHospitalCancelled) {
      // Hospital cancelled assignment clause: capped at 14 days rent max penalty
      const dailyRate = calcRent / 30;
      const penalty = Math.round(dailyRate * 14);
      return {
        refundAmount: Math.max(0, calcRent - penalty),
        retainedAmount: penalty,
        explanation: 'Clinical Contract Flex Protection: Hospital contract termination verified with agency letter. Host receives 14-day vacancy stipend ($' + penalty + '), traveler refunded remaining rent. Cleaning fees 100% refunded.',
      };
    }

    // Tier 1: Flexible (30+ days: 100%, 14–29 days: 50%, < 14 days: 0%)
    if (calcTier === 'flexible') {
      if (calcDaysBefore >= 30) {
        return {
          refundAmount: calcRent,
          retainedAmount: 0,
          explanation: '100% full refund issued (Cancelled 30+ days prior to check-in). Cleaning fee and taxes 100% refunded.',
        };
      } else if (calcDaysBefore >= 14) {
        const retained = Math.round(calcRent * 0.5);
        return {
          refundAmount: calcRent - retained,
          retainedAmount: retained,
          explanation: '50% refund issued (Cancelled 14–29 days prior to check-in). Cleaning fee 100% refunded if check-in never occurred.',
        };
      } else {
        return {
          refundAmount: 0,
          retainedAmount: calcRent,
          explanation: '0% rent refund (Cancelled under 14 days before check-in). Cleaning fee 100% refunded if check-in never occurred; taxes refunded as legally required.',
        };
      }
    } 
    // Tier 2: Moderate (60+ days: 100%, 30–59 days: 50%, < 30 days: 0%)
    else if (calcTier === 'moderate') {
      if (calcDaysBefore >= 60) {
        return {
          refundAmount: calcRent,
          retainedAmount: 0,
          explanation: '100% full refund issued (Cancelled 60+ days prior to check-in). Cleaning fee and taxes 100% refunded.',
        };
      } else if (calcDaysBefore >= 30) {
        const retained = Math.round(calcRent * 0.5);
        return {
          refundAmount: calcRent - retained,
          retainedAmount: retained,
          explanation: '50% refund issued (Cancelled 30–59 days prior to check-in). Cleaning fee 100% refunded if check-in never occurred.',
        };
      } else {
        return {
          refundAmount: 0,
          retainedAmount: calcRent,
          explanation: '0% rent refund (Cancelled under 30 days before check-in). Cleaning fee 100% refunded if check-in never occurred; taxes refunded as legally required.',
        };
      }
    } 
    // Tier 3: Strict (90+ days: 100%, 60–89 days: 50%, < 60 days: 0%)
    else {
      if (calcDaysBefore >= 90) {
        return {
          refundAmount: calcRent,
          retainedAmount: 0,
          explanation: '100% full refund issued (Cancelled 90+ days prior to check-in). Cleaning fee and taxes 100% refunded.',
        };
      } else if (calcDaysBefore >= 60) {
        const retained = Math.round(calcRent * 0.5);
        return {
          refundAmount: calcRent - retained,
          retainedAmount: retained,
          explanation: '50% refund issued (Cancelled 60–89 days prior to check-in). Cleaning fee 100% refunded if check-in never occurred.',
        };
      } else {
        return {
          refundAmount: 0,
          retainedAmount: calcRent,
          explanation: '0% rent refund (Cancelled under 60 days before check-in). Cleaning fee 100% refunded if check-in never occurred; taxes refunded as legally required.',
        };
      }
    }
  };

  const refundResult = calculateRefund();

  return (
    <div className={`w-full py-8 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto transition-colors ${
      isNightShiftMode ? 'text-[#E6ECF7]' : 'text-[#001848]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
              Sanctuary Policies &amp; Legal Protections
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
              North Carolina Jurisdiction
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Legal Agreements &amp; Policy Sanctuary
          </h1>
          <p className="text-sm opacity-80 mt-1">
            Standardized contract protections safeguarding traveling clinicians and licensed housing partners.
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-[rgba(11,37,89,0.15)] dark:border-[#233550] hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-all duration-200 ease-in-out self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Return to Marketplace
        </button>
      </div>

      {/* Policy Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-[#0B1626] p-1.5 rounded-2xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
        <button
          onClick={() => setActiveTab('cancellation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out cursor-pointer ${
            activeTab === 'cancellation'
              ? 'bg-[#0A6FA8] text-white shadow-sm'
              : 'hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] text-[#0B2559] dark:text-[#E6ECF7]'
          }`}
        >
          <span>Cancellation &amp; Refund Policy</span>
          <span className="text-[9px] bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded">Active</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-[#0A6FA8] text-white shadow-sm'
              : 'hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] text-[#0B2559] dark:text-[#E6ECF7]'
          }`}
        >
          <span>Terms of Service</span>
          <span className="text-[9px] bg-amber-400/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">NC Attorney Review</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-[#0A6FA8] text-white shadow-sm'
              : 'hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] text-[#0B2559] dark:text-[#E6ECF7]'
          }`}
        >
          <span>Privacy Policy</span>
          <span className="text-[9px] bg-amber-400/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">NC Attorney Review</span>
        </button>

        <button
          onClick={() => setActiveTab('host-agreement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out cursor-pointer ${
            activeTab === 'host-agreement'
              ? 'bg-[#0A6FA8] text-white shadow-sm'
              : 'hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] text-[#0B2559] dark:text-[#E6ECF7]'
          }`}
        >
          <span>Host Agreement &amp; Standards</span>
          <span className="text-[9px] bg-amber-400/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">NC Attorney Review</span>
        </button>

        <button
          onClick={() => setActiveTab('nc-disclosures')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ease-in-out cursor-pointer ${
            activeTab === 'nc-disclosures'
              ? 'bg-[#0A6FA8] text-white shadow-sm'
              : 'hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] text-[#0B2559] dark:text-[#E6ECF7]'
          }`}
        >
          <span>NC State Disclosures (G.S. § 42A)</span>
          <span className="text-[9px] bg-amber-400/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">Configurable</span>
        </button>
      </div>

      {/* P-07: Cancellation & Refund Policy */}
      {activeTab === 'cancellation' && (
        <div className="space-y-8">
          {/* Policy Overview Card */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
                Cancellation Policy &amp; Refund Protocol
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span> Real Numbers Implemented
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Cancellation &amp; Refund Policy</h2>
            <p className="text-sm opacity-80 leading-relaxed mb-6">
              Travel nursing contracts fluctuate with hospital staffing demands. Nurses Pillow balances traveler mobility with guaranteed host revenue via three verified tiers and the exclusive <strong>Clinical Contract Flex Protection</strong>.
            </p>

            {/* The 3 Core Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {/* Flexible 30-Day */}
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Tier 1</span>
                    <span className="text-[11px] font-semibold bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Most Common</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Flexible Tier</h3>
                  <ul className="text-xs space-y-2 opacity-90 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>100% refund:</strong> 30+ days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>50% refund:</strong> 14–29 days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>0% refund:</strong> Under 14 days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5 pt-1 border-t border-emerald-500/20 text-[11px] opacity-80">
                      <span>Cleaning fee 100% refunded if traveler never checks in.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Moderate 60-Day */}
              <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Tier 2</span>
                    <span className="text-[11px] font-semibold bg-blue-600/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">Standard</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Moderate Tier</h3>
                  <ul className="text-xs space-y-2 opacity-90 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>100% refund:</strong> 60+ days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>50% refund:</strong> 30–59 days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>0% refund:</strong> Under 30 days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5 pt-1 border-t border-blue-500/20 text-[11px] opacity-80">
                      <span>Cleaning fee 100% refunded if traveler never checks in.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Strict 90-Day */}
              <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Tier 3</span>
                    <span className="text-[11px] font-semibold bg-purple-600/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">High-Demand</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Strict Tier</h3>
                  <ul className="text-xs space-y-2 opacity-90 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-purple-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>100% refund:</strong> 90+ days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-purple-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>50% refund:</strong> 60–89 days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-purple-600 text-[16px] shrink-0">check_circle</span>
                      <span><strong>0% refund:</strong> Under 60 days before check-in.</span>
                    </li>
                    <li className="flex items-start gap-1.5 pt-1 border-t border-purple-500/20 text-[11px] opacity-80">
                      <span>Cleaning fee 100% refunded if traveler never checks in.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Special Protections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200 text-sm mb-1">
                  <span className="material-symbols-outlined text-[20px]">medical_services</span>
                  Hospital Contract Cancellation Clause
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  If your healthcare facility terminates or reschedules your assignment before move-in, submit written agency documentation. Your financial liability is strictly capped at a 14-day vacancy stipend, releasing all remaining rent.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-2 font-bold text-indigo-800 dark:text-indigo-200 text-sm mb-1">
                  <span className="material-symbols-outlined text-[20px]">timelapse</span>
                  24-Hour Instant Grace Window
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Booked the wrong dates or hospital campus? Cancel penalty-free within 24 hours of booking acceptance as long as move-in is at least 7 calendar days away.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Refund Simulator */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff]">calculate</span>
              Interactive Policy Refund Simulator
            </h3>
            <p className="text-xs opacity-80 mb-6">
              Test how the automatic cancellation engine executes refunds for clinicians and hosts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-80">Monthly Rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs opacity-60">$</span>
                  <input
                    type="number"
                    value={calcRent}
                    onChange={(e) => setCalcRent(Math.max(1000, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-[rgba(11,37,89,0.2)] dark:border-[#233550] bg-transparent font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-80">Property Policy Tier</label>
                <select
                  value={calcTier}
                  onChange={(e) => setCalcTier(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[rgba(11,37,89,0.2)] dark:border-[#233550] bg-transparent font-semibold dark:bg-[#0B1626]"
                >
                  <option value="flexible">Flexible (30 Days)</option>
                  <option value="moderate">Moderate (60 Days)</option>
                  <option value="strict">Strict (90 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-80">Days Before Move-in</label>
                <input
                  type="number"
                  value={calcDaysBefore}
                  onChange={(e) => setCalcDaysBefore(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[rgba(11,37,89,0.2)] dark:border-[#233550] bg-transparent font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-80">Hospital Contract Flex</label>
                <button
                  type="button"
                  onClick={() => setCalcHospitalCancelled(!calcHospitalCancelled)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all duration-200 ease-in-out ${
                    calcHospitalCancelled
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-black/5 dark:bg-white/5 border-transparent opacity-80'
                  }`}
                >
                  {calcHospitalCancelled ? 'Hospital Cancelled (Active)' : 'Standard Cancellation'}
                </button>
              </div>
            </div>

            {/* Simulation Result */}
            <div className="p-5 rounded-2xl bg-[#EFF6FB] dark:bg-[#08101C] border border-[#005684]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#005684] dark:text-[#93ccff] uppercase tracking-wider mb-1">
                  Engine Outcome
                </div>
                <div className="text-sm font-medium leading-relaxed max-w-xl">
                  {refundResult.explanation}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs opacity-70">Traveler Refund</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ${refundResult.refundAmount.toLocaleString()}
                </div>
                <div className="text-[11px] opacity-70">
                  Host Retains: ${refundResult.retainedAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
                Master Clinician Agreement
              </span>
              <h2 className="text-2xl font-bold mt-2 mb-2">Terms of Service (Master Clinician Agreement)</h2>
              <p className="text-xs opacity-70">Last updated: September 2026 • Governing Law: North Carolina</p>
            </div>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">1. Purpose &amp; Scope of Clinical Lodging</h3>
              <p>
                Nurses Pillow operates as a specialized intermediary linking licensed healthcare travelers on mid-term assignments with host property providers. Accommodations reserved via Nurses Pillow are transient medical workforce occupancies and do not establish perpetual residential landlord-tenant rights beyond the contract duration.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">2. Professional Credential Representation</h3>
              <p>
                Travelers warrant that all clinical licenses uploaded to Nurses Pillow are unencumbered and active in their primary licensing state or authorized under the Nurse Licensure Compact (eNLC). Misrepresentation of credentials constitutes immediate contract forfeiture without refund.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">3. Quiet Daytime Environment Covenant</h3>
              <p>
                All users agree to strictly abide by daytime quiet hour covenants (respecting quiet sleep hours between 8:00 AM and 6:00 PM) for night-shift clinicians. Violation of this covenant warrants expedited host review and platform relocation assistance.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">4. Dispute Resolution &amp; Arbitration</h3>
              <p>
                Any dispute, claim, or controversy arising out of or relating to this Agreement or the breach, termination, enforcement, interpretation, or validity thereof shall be determined by confidential, binding arbitration in Wake County, North Carolina, before a single neutral arbitrator.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* Privacy Policy */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
                Data Security Protocol
              </span>
              <h2 className="text-2xl font-bold mt-2 mb-2">Privacy &amp; Data Deletion Policy</h2>
              <p className="text-xs opacity-70">Strict Zero-Retention of Sensitive PII</p>
            </div>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">1. Automated Document Destruction</h3>
              <p>
                Government IDs and nurse license scans uploaded during credentialing are permanently deleted from all storage buckets once verified by our manual compliance team or state board registry. Only the verified badge status and expiration date are retained.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">2. Hospital Placement Confidentiality</h3>
              <p>
                Specific clinical department assignments (e.g. PICU, Trauma ER, Oncology) are never revealed to property hosts or third parties. Hosts only see the verified health system name and contract dates.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* Host Agreement */}
      {activeTab === 'host-agreement' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
                Host Quality Standards
              </span>
              <h2 className="text-2xl font-bold mt-2 mb-2">Host Standards &amp; Partnership Agreement</h2>
            </div>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">1. Mandatory Sanctuary Specifications</h3>
              <p>
                Hosts agree that every listing published on Nurses Pillow features 100% light-blocking blackout drapery in sleeping quarters, certified operational smoke/CO monitors, functional digital keypad entry, and quiet appliance operation.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">2. Fee Structure &amp; Hard 15% Cap</h3>
              <p>
                Host service fees are capped at a maximum of 15% per platform bylaws. Platform fee changes require 30 days advance notice and never apply retroactively to active reservations.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* NC State Disclosures */}
      {activeTab === 'nc-disclosures' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
                Statutory Notice
              </span>
              <h2 className="text-2xl font-bold mt-2 mb-2">North Carolina State Disclosures</h2>
              <p className="text-xs opacity-70">Mandatory statutory disclosure for lodging within North Carolina</p>
            </div>

            <section className="space-y-2 text-sm leading-relaxed opacity-90">
              <h3 className="text-base font-bold text-[#001848] dark:text-[#E6ECF7]">N.C. General Statutes § 42A Applicability Notice</h3>
              <p>
                For accommodations located in North Carolina, stays of 90 days or fewer for transient vacation purposes fall under N.C.G.S. § 42A (the Vacation Rental Act). Clinical traveler housing booked on Nurses Pillow exceeding 90 consecutive days (e.g. 13-week standard contract) constitutes residential mid-term temporary lodging.
              </p>
            </section>

            <div className="p-4 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 text-xs text-amber-800 dark:text-amber-200">
              [Configurable North Carolina Addendum: Attorney to provide final wording on Wake/Durham/Mecklenburg county local tax exemptions].
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
