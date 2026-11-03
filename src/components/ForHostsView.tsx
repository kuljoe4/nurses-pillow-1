import React, { useState } from 'react';

interface ForHostsViewProps {
  isNightShiftMode: boolean;
  onGoToHousing: () => void;
  onGoToHostPortal?: () => void;
}

export const ForHostsView: React.FC<ForHostsViewProps> = ({
  isNightShiftMode,
  onGoToHousing,
  onGoToHostPortal,
}) => {
  const [estimatedMonthlyRent, setEstimatedMonthlyRent] = useState<number>(2400);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Financial calculations
  const platformFee = Math.round(estimatedMonthlyRent * 0.05);
  const hostNetMonthly = estimatedMonthlyRent - platformFee;
  const rotation13Weeks = hostNetMonthly * 3;

  const faqs = [
    {
      q: 'What is the Midterm Assignment Cancellation Protection (Contract Flex)?',
      a: 'Travel nursing rotations in North Carolina typically run for 13 weeks. Occasionally, a hospital system experiences census drops and reschedules or terminates an assignment early with agency documentation. Our policy protects both parties: traveling clinicians cancel remaining weeks penalty-free, while property hosts receive a guaranteed 14-day vacancy stipend payout and immediate calendar re-listing to mitigate downtime.',
    },
    {
      q: 'How does Nurses Pillow verify clinician guests?',
      a: 'Every traveling clinician must complete our 4-step verification: two-factor authentication, government ID biometric match, and real-time Nursys / State Nursing Board primary source verification. You host only licensed healthcare professionals.',
    },
    {
      q: 'What are the day-sleeper property requirements?',
      a: 'Because travel nurses work rotating 12-hour day and night shifts, host properties must provide 100% blackout curtains in bedrooms, high-speed WiFi for charting, in-unit laundry for scrub sanitation, and respect daytime quiet hours (08:00 – 16:00).',
    },
    {
      q: 'How and when do hosts get paid?',
      a: 'Payouts are powered by Stripe Connect Escrow. Rent is collected from the clinician prior to move-in and disbursed directly to your connected bank account 24 hours after verified check-in, then automatically on a monthly schedule.',
    },
    {
      q: 'What is the platform fee?',
      a: 'Nurses Pillow charges a flat 5% host take-rate. There are zero traveler booking fees, ensuring your listing remains competitive and transparent compared to vacation rental platforms charging 15% to 25%.',
    },
  ];

  return (
    <div
      className={`w-full py-12 px-4 sm:px-6 lg:px-12 transition-colors ${
        isNightShiftMode ? 'bg-[#08101C] text-[#E6ECF7]' : 'bg-[#f4f6fb] text-[#001848]'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#aff0db]/30 text-[#195b4c] dark:text-[#aff0db]">
            <span className="material-symbols-outlined text-[15px]">real_estate_agent</span>
            Property Host Property Community
          </span>
          <h1
            className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight ${
              isNightShiftMode ? 'text-white' : 'text-[#001848]'
            }`}
          >
            Host Verified Traveling Clinicians Near NC Hospitals
          </h1>
          <p
            className={`text-base sm:text-lg leading-relaxed ${
              isNightShiftMode ? 'text-[#9CB3D3]' : 'text-[#404850]'
            }`}
          >
            Provide peaceful, furnished mid-term accommodations for travel nurses on 13-week hospital assignments. Enjoy 100% board-verified clinical guests, zero parties, and reliable monthly income.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            {onGoToHostPortal && (
              <button
                type="button"
                onClick={onGoToHostPortal}
                className="px-7 py-3.5 rounded-full bg-[#001848] hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] text-white text-xs sm:text-sm font-bold shadow-md transition-all duration-200 ease-in-out cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_home</span>
                <span>Enter Host Portal &amp; List Property</span>
              </button>
            )}
            <button
              type="button"
              onClick={onGoToHousing}
              className="px-6 py-3.5 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] text-xs sm:text-sm font-semibold transition-all duration-200 ease-in-out cursor-pointer"
            >
              Explore Existing Property Listings
            </button>
          </div>
        </div>

        {/* 3 CORE PILLARS FOR HOSTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div
            className={`p-8 rounded-3xl border shadow-sm flex flex-col justify-between ${
              isNightShiftMode
                ? 'bg-[#0E1A2E] border-[#233550]'
                : 'bg-white border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#aff0db]/25 text-[#195b4c] dark:text-[#aff0db] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">verified</span>
              </div>
              <h3 className="text-xl font-bold">100% Verified Clinician Guests</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Every tenant is a background-verified, licensed RN or allied health professional on an active hospital rotation. Zero parties, quiet professional lifestyles, and prompt respect for your home.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 text-xs font-semibold text-[#195b4c] dark:text-[#aff0db] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Nursys Primary Source Board Checked
            </div>
          </div>

          <div
            className={`p-8 rounded-3xl border shadow-sm flex flex-col justify-between ${
              isNightShiftMode
                ? 'bg-[#0E1A2E] border-[#233550]'
                : 'bg-white border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#005684]/15 text-[#005684] dark:text-[#93ccff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">calendar_month</span>
              </div>
              <h3 className="text-xl font-bold">30–90 Day Mid-Term Stability</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Escape the relentless churn, guest messaging, and high turnover of weekend vacation rentals. Travel healthcare rotations provide steady, multi-month occupancy with predictable monthly bank deposits.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 text-xs font-semibold text-[#005684] dark:text-[#93ccff] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">payments</span>
              Direct Stripe Bank Payouts • Flat 5% Fee
            </div>
          </div>

          <div
            className={`p-8 rounded-3xl border shadow-sm flex flex-col justify-between ${
              isNightShiftMode
                ? 'bg-[#0E1A2E] border-[#233550]'
                : 'bg-white border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffdf91]/25 text-[#745b0d] dark:text-[#ffdf91] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">shield</span>
              </div>
              <h3 className="text-xl font-bold">Contract Flex Vacancy Guarantee</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                If a travel nurse's hospital assignment is cancelled early due to clinical staffing shifts, our protection policy provides you with a 14-day vacancy stipend and calendar re-listing priority.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 text-xs font-semibold text-[#745b0d] dark:text-[#ffdf91] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              14-Day Vacancy Stipend Protection
            </div>
          </div>
        </div>

        {/* EARNINGS ESTIMATOR CALCULATOR */}
        <div
          className={`p-8 sm:p-10 rounded-3xl border shadow-md ${
            isNightShiftMode
              ? 'bg-[#0E1A2E] border-[#233550]'
              : 'bg-white border-[rgba(11,37,89,0.08)]'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
                <span className="material-symbols-outlined text-[14px]">calculate</span>
                Host Earnings Estimator
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Calculate Your North Carolina Mid-Term Rental Return
              </h2>
              <p className="text-sm opacity-80 leading-relaxed">
                Based on average market rates for fully furnished private sanctuaries near Duke University Hospital, UNC Medical Center, WakeMed Raleigh, and Atrium Health Carolinas.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Monthly Rental Rate:</span>
                  <span className="text-lg font-bold text-[#005684] dark:text-[#93ccff]">
                    ${estimatedMonthlyRent.toLocaleString()}/month
                  </span>
                </div>
                <input
                  type="range"
                  min="1400"
                  max="4500"
                  step="50"
                  value={estimatedMonthlyRent}
                  onChange={(e) => setEstimatedMonthlyRent(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#005684]"
                />
                <div className="flex justify-between text-xs opacity-60">
                  <span>$1,400 (Private Suite)</span>
                  <span>$2,800 (1BR Condo)</span>
                  <span>$4,500 (Entire Home)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#f4f6fb] dark:bg-[#15233a] p-6 sm:p-8 rounded-2xl border border-[rgba(11,37,89,0.06)] dark:border-[#233550] space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                13-Week Rotation Projection
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-black/5 dark:border-white/10">
                  <span className="opacity-80">Gross Monthly Rent:</span>
                  <span className="font-bold">${estimatedMonthlyRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-black/5 dark:border-white/10">
                  <span className="opacity-80">Platform Take-Rate (5% Flat):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-${platformFee}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-black/5 dark:border-white/10">
                  <span className="opacity-80">Net Monthly Host Payout:</span>
                  <span className="font-bold text-[#195b4c] dark:text-[#aff0db]">
                    ${hostNetMonthly.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Est. 13-Week Rotation Net:
                  </span>
                  <span className="text-2xl font-extrabold text-[#005684] dark:text-[#93ccff]">
                    ${rotation13Weeks.toLocaleString()}
                  </span>
                </div>
              </div>

              {onGoToHostPortal && (
                <button
                  type="button"
                  onClick={onGoToHostPortal}
                  className="w-full mt-4 py-3 rounded-xl bg-[#001848] dark:bg-[#005684] text-white text-xs font-bold hover:bg-[#162e62] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] transition-all duration-200 ease-in-out cursor-pointer shadow-xs"
                >
                  List This Property
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PROPERTY STANDARDS */}
        <div
          className={`p-8 sm:p-10 rounded-3xl border shadow-sm space-y-8 ${
            isNightShiftMode
              ? 'bg-[#0E1A2E] border-[#233550]'
              : 'bg-white border-[rgba(11,37,89,0.08)]'
          }`}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#005684] dark:text-[#93ccff] mb-1 block">
              Quality Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">Nurses Pillow Property Checklist</h2>
            <p className="text-sm opacity-80 mt-1 max-w-2xl">
              To guarantee rest and recovery for clinicians treating patients at major hospitals, all registered properties meet our 4 essential criteria:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-[#f4f6fb] dark:bg-[#15233a] border border-black/5 dark:border-white/5 space-y-2">
              <div className="font-bold flex items-center gap-2 text-[#005684] dark:text-[#93ccff]">
                <span className="material-symbols-outlined text-[20px]">bedtime</span>
                <span>Day-Sleeper Blackout Curtains</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                High-grade blackout window coverage in all sleeping areas to accommodate clinicians sleeping between 08:00 and 16:00 after grueling 12-hour shifts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f4f6fb] dark:bg-[#15233a] border border-black/5 dark:border-white/5 space-y-2">
              <div className="font-bold flex items-center gap-2 text-[#195b4c] dark:text-[#aff0db]">
                <span className="material-symbols-outlined text-[20px]">local_laundry_service</span>
                <span>In-Unit Scrub Washer &amp; Dryer</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Dedicated in-unit laundry and clean, hypoallergenic linens for sanitary scrub laundering without public laundromat hassles.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f4f6fb] dark:bg-[#15233a] border border-black/5 dark:border-white/5 space-y-2">
              <div className="font-bold flex items-center gap-2 text-[#745b0d] dark:text-[#ffdf91]">
                <span className="material-symbols-outlined text-[20px]">key</span>
                <span>24/7 Keyless Smart Check-In</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Keypad or electronic door codes accommodating late-night or early-morning arrivals directly following transit or delayed clinical shifts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f4f6fb] dark:bg-[#15233a] border border-black/5 dark:border-white/5 space-y-2">
              <div className="font-bold flex items-center gap-2 text-[#005684] dark:text-[#93ccff]">
                <span className="material-symbols-outlined text-[20px]">volume_off</span>
                <span>Enforced Quiet Hours Policy</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Quiet residential standards with zero unauthorized guests or loud parties, protecting the tranquility essential for healthcare professionals.
              </p>
            </div>
          </div>
        </div>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently Asked Host Questions</h2>
            <p className="text-sm opacity-80 mt-1">
              Clear answers on mid-term lease rules, payments, and traveler guarantees.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 ease-in-out ${
                  isNightShiftMode
                    ? 'bg-[#0E1A2E] border-[#233550]'
                    : 'bg-white border-[rgba(11,37,89,0.08)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined text-[20px] transition-transform duration-200 shrink-0">
                    {activeFaq === idx ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm opacity-80 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="text-center pt-8 pb-4">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            {onGoToHostPortal && (
              <button
                type="button"
                onClick={onGoToHostPortal}
                className="px-8 py-4 rounded-full bg-[#001848] hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] text-white text-sm font-bold shadow-lg transition-all duration-200 ease-in-out cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_business</span>
                <span>Open Host Workspace &amp; Add Listing</span>
              </button>
            )}
            <button
              type="button"
              onClick={onGoToHousing}
              className="px-6 py-4 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] text-sm font-semibold transition-all duration-200 ease-in-out cursor-pointer"
            >
              Back to Main Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
