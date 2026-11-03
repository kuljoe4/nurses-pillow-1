import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ProductPreviewHero } from './ProductPreviewHero';
import { db } from '../services/database';

interface HowItWorksViewProps {
  isNightShiftMode: boolean;
  onGoToVerification: () => void;
  onGoToHousing: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({
  isNightShiftMode,
  onGoToVerification,
  onGoToHousing,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isSaved, setIsSaved] = useState(false);

  const dbListings = db.getListings() || [];
  const heroListing = dbListings.length > 0 ? dbListings[0] : null;

  const commitments = [
    {
      icon: 'verified_user',
      title: '1. Verified Professionals, Better Rates',
      description:
        'We verify every professional with their state board. This unlocks better rates designed for your travel stipends, often lower than general short-term rentals.',
    },
    {
      icon: 'dark_mode',
      title: '2. Restful Sleep, Any Time',
      description:
        'Properties feature true blackout curtains, white noise options, and environments conducive to daytime rest for night-shift workers.',
    },
    {
      icon: 'shield_with_heart',
      title: '3. Flexible Contract Support',
      description:
        'If your assignment is canceled or shortened unexpectedly, you can adjust your stay without heavy penalties by providing your agency notice.',
    },
    {
      icon: 'local_hospital',
      title: '4. Convenient Commutes',
      description:
        'Spend less time driving. We provide clear details on commute times to your assigned hospital, whether you drive, walk, or bike.',
    },
  ];

  return (
    <div
      className={`w-full py-12 px-4 sm:px-6 lg:px-12 transition-colors ${
        isNightShiftMode ? 'bg-[#08101C]' : 'bg-[#f2f3ff]'
      }`}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto pt-4"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#aff0db]/30 text-[#195b4c] dark:text-[#aff0db] mb-3">
            Designed for Healthcare Travelers
          </span>
          <h1
            className={`text-3xl sm:text-4xl font-bold tracking-tight mb-3 ${
              isNightShiftMode ? 'text-white' : 'text-[#001848]'
            }`}
          >
            How Nurses Pillow Works
          </h1>
          <p
            className={`text-base leading-relaxed ${
              isNightShiftMode ? 'text-[#9CB3D3]' : 'text-[#404850]'
            }`}
          >
            We connect traveling healthcare professionals with housing tailored for rest and convenience, so you can focus on your assignment.
          </p>
        </motion.div>

        {/* Product Preview Interactive Screenshot - Sells Trust & Functionality */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0A6FA8]/10 text-[#0A6FA8] dark:bg-[#3E9AD1]/15 dark:text-[#3E9AD1]">
              <span className="material-symbols-outlined text-[15px]">touch_app</span>
              <span>Interactive Sanctuary Preview</span>
            </span>
          </div>
          {heroListing && (
            <ProductPreviewHero
              listing={heroListing}
              isSaved={isSaved}
              onToggleSave={() => setIsSaved(!isSaved)}
              onSelectListing={onGoToHousing}
              onRequestToBook={onGoToHousing}
              shouldReduceMotion={shouldReduceMotion}
            />
          )}
        </motion.div>

        {/* 4 Sanctuary Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commitments.map((c, i) => (
            <motion.div
              key={i}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : i * 0.1, ease: 'easeOut' }}
              className={`p-6 sm:p-8 rounded-3xl border shadow-md transition-all duration-200 ease-in-out ${
                isNightShiftMode
                  ? 'bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]'
                  : 'bg-white border-[rgba(11,37,89,0.08)] text-[#001848]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0a6fa8]/15 text-[#0a6fa8] dark:text-[#3E9AD1] flex items-center justify-center mb-4 font-bold">
                <span className="material-symbols-outlined text-2xl">{c.icon}</span>
              </div>
              <h3 className="text-lg font-bold mb-2">{c.title}</h3>
              <p
                className={`text-sm leading-relaxed ${
                  isNightShiftMode ? 'text-[#9CB3D3]' : 'text-[#404850]'
                }`}
              >
                {c.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Comparison Matrix */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-4xl mx-auto mt-16 mb-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0A6FA8]/10 text-[#0A6FA8] dark:bg-[#3E9AD1]/15 dark:text-[#3E9AD1] mb-3">
              <span className="material-symbols-outlined text-[15px]">compare_arrows</span>
              <span>Transparent Comparison</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${isNightShiftMode ? 'text-white' : 'text-[#0B2559]'}`}>
              Nurses Pillow vs. Traditional Directories (Furnished Finder)
            </h2>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${isNightShiftMode ? 'text-[#9CB3D3]' : 'text-[#404850]'}`}>
              Built exclusively for traveling clinicians navigating grueling shifts. Transparent terms, zero subscription paywalls, and verified hospital proximity.
            </p>
          </div>

          {/* Desktop & Tablet Table (Hidden on small mobile) */}
          <div className={`hidden sm:block overflow-hidden rounded-3xl border shadow-sm ${
            isNightShiftMode ? 'bg-[#0E1A2E] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.08)]'
          }`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={isNightShiftMode ? 'bg-[#15233a] text-[#E6ECF7]' : 'bg-[#f4f6fb] text-[#0B2559]'}>
                  <th className="p-4 sm:p-5 font-bold text-xs uppercase tracking-wider w-1/3">Standard / Feature</th>
                  <th className="p-4 sm:p-5 font-bold text-xs uppercase tracking-wider w-1/3 bg-[#0a6fa8]/10 text-[#0a6fa8] dark:text-[#3E9AD1]">
                    Nurses Pillow
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-xs uppercase tracking-wider w-1/3 opacity-70">
                    Traditional Directories
                  </th>
                </tr>
              </thead>
              <tbody className={`text-sm ${isNightShiftMode ? 'text-[#9CB3D3]' : 'text-[#404850]'}`}>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white">Upfront Cost</td>
                  <td className="p-4 sm:p-5 font-bold text-[#2F6E5E] dark:text-[#aff0db] bg-[#0a6fa8]/5 tabular-nums">
                    $0 to list — pay only when booked
                  </td>
                  <td className="p-4 sm:p-5 opacity-80 tabular-nums">$199/yr. recurring upfront fee</td>
                </tr>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white">Traveler Identity</td>
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white bg-[#0a6fa8]/5">
                    <div className="flex items-center gap-1.5 text-[#2F6E5E] dark:text-[#aff0db] font-bold">
                      <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                      <span>Biometric ID Verified</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 opacity-80">Unverified at signup</td>
                </tr>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white">Professional Credentials</td>
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white bg-[#0a6fa8]/5">
                    <div className="flex items-center gap-1.5 text-[#2F6E5E] dark:text-[#aff0db] font-bold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Official Registry/Board Verified</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 opacity-80">Unchecked / Self-reported</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white">Booking &amp; Payments</td>
                  <td className="p-4 sm:p-5 font-semibold text-[#0B2559] dark:text-white bg-[#0a6fa8]/5">
                    <div className="flex items-center gap-1.5 text-[#0A6FA8] dark:text-[#3E9AD1] font-bold">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      <span>Secure Stripe Connect split</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 opacity-80">Manual off-platform coordination</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Touch Cards (Stacking cleanly on screens < 640px) */}
          <div className="sm:hidden space-y-3">
            {[
              {
                feature: 'Upfront Cost',
                np: '$0 to list — pay only when booked',
                trad: '$199/yr. recurring fee',
                npHighlight: true,
              },
              {
                feature: 'Traveler Identity',
                np: 'Biometric ID Verified',
                trad: 'Unverified at signup',
                icon: 'fingerprint',
              },
              {
                feature: 'Professional Credentials',
                np: 'Official Registry/Board Verified',
                trad: 'Unchecked / Self-reported',
                icon: 'verified',
              },
              {
                feature: 'Booking & Payments',
                np: 'Secure Stripe Connect split',
                trad: 'Manual off-platform coordination',
                icon: 'lock',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${
                  isNightShiftMode ? 'bg-[#0E1A2E] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.08)] shadow-xs'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[#404850] dark:text-[#93ccff] mb-2.5">
                  {item.feature}
                </div>
                <div className="p-3 rounded-xl bg-[#EFF6FB] dark:bg-[#15233a] border border-[#0A6FA8]/20 mb-2">
                  <div className="text-[10px] font-bold text-[#0A6FA8] dark:text-[#3E9AD1] uppercase mb-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Nurses Pillow
                  </div>
                  <div className="text-xs font-bold text-[#0B2559] dark:text-white flex items-center gap-1.5">
                    {item.icon && <span className="material-symbols-outlined text-[15px] text-[#2F6E5E] dark:text-[#aff0db]">{item.icon}</span>}
                    <span>{item.np}</span>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-xs text-gray-500 dark:text-gray-400">
                  <div className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">Traditional Directories</div>
                  <div>{item.trad}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action card */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`rounded-3xl p-8 sm:p-10 border text-center shadow-md ${
            isNightShiftMode
              ? 'bg-[#15233a] border-[#233550] text-white'
              : 'bg-white border-[rgba(11,37,89,0.12)] text-[#001848]'
          }`}
        >
          <h2 className="text-2xl font-bold mb-2">Ready to find your next home?</h2>
          <p
            className={`text-sm max-w-lg mx-auto mb-6 ${
              isNightShiftMode ? 'text-[#9CB3D3]' : 'text-[#404850]'
            }`}
          >
            Verify your credentials to connect with hosts and view available housing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGoToVerification}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0a6fa8] hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] text-white font-semibold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Verify Nursing License</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
            <button
              onClick={onGoToHousing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-current text-sm font-semibold hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-colors cursor-pointer"
            >
              Browse Housing
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
