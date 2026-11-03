import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface HealthcareAmenitiesFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filterData: any) => void;
  isNightShiftMode: boolean;
  activeHospitalName?: string;
}

export const HealthcareAmenitiesFilterModal: React.FC<HealthcareAmenitiesFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  isNightShiftMode,
  activeHospitalName = 'Duke University Hospital (Durham, NC)',
}) => {
  useBodyScrollLock(isOpen);

  // Section 1: Clinical Sleep Environment
  const [blackoutDrapes, setBlackoutDrapes] = useState(true);
  const [quietHoursGuarantee, setQuietHoursGuarantee] = useState(true);
  const [soundMachineIncluded, setSoundMachineIncluded] = useState(true);
  const [decibelCeiling, setDecibelCeiling] = useState<'35' | '40' | '45'>('35');

  // Section 2: Hospital Proximity & Commute
  const [commuteRadius, setCommuteRadius] = useState<'1' | '3' | '5' | '10'>('3');

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  const [rapidTransitShuttle, setRapidTransitShuttle] = useState(false);

  // Section 3: Rental Type & Space Configuration
  const [rentalType, setRentalType] = useState<'entire' | 'suite'>('entire');
  const [bedrooms, setBedrooms] = useState<'any' | '1' | '2+'>('1');

  // Section 4: Clinical Hygiene & Shift Amenities
  const [scrubLaundry, setScrubLaundry] = useState(true);
  const [keylessLock, setKeylessLock] = useState(true);
  const [chartingDesk, setChartingDesk] = useState(true);
  const [gatedParking, setGatedParking] = useState(true);
  const [petFriendly, setPetFriendly] = useState(false);
  const [fullKitchen, setFullKitchen] = useState(false);

  // Section 5: Assignment Duration & Flexibility
  const [durationWeeks, setDurationWeeks] = useState<'4' | '8' | '13' | '26' | 'custom'>('13');
  const [customDuration, setCustomDuration] = useState<number>(1);

  // Section 6: Monthly Rent & Per Diem Range
  const [rentMax, setRentMax] = useState(2600);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(true);

  if (!isOpen) return null;

  // Active filter count
  const activeFilterCount = [
    blackoutDrapes,
    quietHoursGuarantee,
    soundMachineIncluded,
    scrubLaundry,
    keylessLock,
    chartingDesk,
    gatedParking,
    petFriendly,
    fullKitchen,
    rapidTransitShuttle,
    utilitiesIncluded,
  ].filter(Boolean).length;

  const handleReset = () => {
    setBlackoutDrapes(false);
    setQuietHoursGuarantee(false);
    setSoundMachineIncluded(false);
    setRapidTransitShuttle(false);
    setScrubLaundry(false);
    setKeylessLock(false);
    setChartingDesk(false);
    setGatedParking(false);
    setPetFriendly(false);
    setFullKitchen(false);
    setUtilitiesIncluded(false);
    setDecibelCeiling('40');
    setCommuteRadius('5');
    setRentalType('entire');
    setBedrooms('any');
  };

  const handleApply = () => {
    onApply({
      blackoutDrapes,
      quietHoursGuarantee,
      soundMachineIncluded,
      decibelCeiling,
      commuteRadius,
      rapidTransitShuttle,
      rentalType,
      bedrooms,
      scrubLaundry,
      keylessLock,
      chartingDesk,
      gatedParking,
      petFriendly,
      fullKitchen,
      durationWeeks: durationWeeks === 'custom' ? customDuration.toString() : durationWeeks,
      rentMax,
      utilitiesIncluded,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[150] overflow-y-auto p-0 sm:p-6 pt-16 sm:pt-20 bg-[#162e62]/60 backdrop-blur-xs flex justify-center items-end sm:items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal / Mobile Bottom Sheet Container */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-3xl sm:rounded-3xl rounded-t-[24px] rounded-b-none sm:rounded-b-3xl shadow-md flex flex-col max-h-[88vh] sm:max-h-[92vh] overflow-hidden border ${
          isNightShiftMode
            ? 'bg-[#0B1626] text-[#E6ECF7] border-[#233550]'
            : 'bg-white text-[#001848] border-[rgba(11,37,89,0.12)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-2 shrink-0" />

        {/* Top Decorative Clinical Hue Accent Line */}
        <div className="w-full h-1.5 bg-gradient-to-r from-[#005684] via-[#0a6fa8] to-[#195b4c]" />

        {/* Modal Header */}
        <div
          className={`px-6 sm:px-8 pt-6 pb-5 flex items-start justify-between gap-4 border-b ${
            isNightShiftMode ? 'bg-[#0B1626] border-[#233550]' : 'bg-white border-[#eaedff]'
          }`}
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaedff] dark:bg-[#152438] text-[#005684] dark:text-[#93ccff] text-xs font-semibold">
                <span className="material-symbols-outlined text-[15px] text-[#745b0d] dark:text-[#ffdc84]">
                  bedtime
                </span>
                <span>Shift-Optimized Filter Console</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#367464]/15 text-[#195b4c] dark:bg-[#aff0db]/20 dark:text-[#aff0db] text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>RN Validated Standards</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1" id="modal-title">
              Healthcare Sanctuary &amp; Stay Filters
            </h2>
            <p className="text-xs sm:text-sm text-[#404850] dark:text-[#c0c7d1] max-w-xl">
              Calibrated specifically for night-shift clinicians, rotating travel nurses, and noise-sensitive daytime sleep cycles.
            </p>
          </div>

          {/* Header Actions: Reset & Close */}
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button
              id="reset-all-btn"
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-[#005684] dark:text-[#93ccff] hover:text-[#0a6fa8] px-3 py-1.5 rounded-full hover:bg-[#eaedff] dark:hover:bg-[#152438] transition-colors focus:outline-none cursor-pointer"
            >
              Reset All ({activeFilterCount} active)
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal window"
              className="w-9 h-9 rounded-full bg-[#f2f3ff] dark:bg-[#152438] text-[#001848] dark:text-white hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div
          className={`px-6 sm:px-8 py-5 overflow-y-auto overscroll-contain custom-scrollbar space-y-6 flex-1 ${
            isNightShiftMode ? 'bg-[#08101C]' : 'bg-[#faf8ff]'
          }`}
        >
          {/* SECTION 1: Clinical Sleep Environment (Priority Tier) */}
          <section
            className={`p-6 rounded-2xl shadow-xs border ${
              isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.06)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#cde5ff] text-[#005684] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">bedtime</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#001848] dark:text-white">Clinical Sleep Environment</h3>
                  <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Day-sleeper certified essentials to protect circadian rhythm
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-[#ffdc84] text-[#795f12] rounded-full font-bold">
                Priority Tier
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Item 1: Blackout Guarantee */}
              <label
                className={`flex items-start justify-between p-3.5 rounded-xl transition-colors cursor-pointer group ${
                  isNightShiftMode
                    ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={blackoutDrapes}
                      onChange={(e) => setBlackoutDrapes(e.target.checked)}
                      className="w-5 h-5 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#001848] dark:text-white">
                        100% Blackout Drapes / Roller Shades
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#367464]/20 text-[#195b4c] dark:text-[#aff0db] font-semibold">
                        Zero Light Penetration
                      </span>
                    </div>
                    <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-0.5">
                      Dual-layer acoustic thermal curtains guaranteed flush with window casing for complete noon darkness.
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[20px] ml-2 shrink-0">
                  curtains_closed
                </span>
              </label>

              {/* Item 2: Daytime Quiet Hours Guarantee */}
              <label
                className={`flex items-start justify-between p-3.5 rounded-xl transition-colors cursor-pointer group ${
                  isNightShiftMode
                    ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={quietHoursGuarantee}
                      onChange={(e) => setQuietHoursGuarantee(e.target.checked)}
                      className="w-5 h-5 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#001848] dark:text-white">
                        Daytime Quiet Hours Guarantee
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#eaedff] dark:bg-[#152438] text-[#005684] dark:text-[#93ccff] font-medium">
                        08:00 – 17:00 Daytime Quiet
                      </span>
                    </div>
                    <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-0.5">
                      Strict host commitment: No morning landscaping, heavy machinery, or corridor disturbances during daytime shifts.
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[20px] ml-2 shrink-0">
                  volume_off
                </span>
              </label>

              {/* Item 3: Sound Machine Hardware Included */}
              <label
                className={`flex items-start justify-between p-3.5 rounded-xl transition-colors cursor-pointer group ${
                  isNightShiftMode
                    ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={soundMachineIncluded}
                      onChange={(e) => setSoundMachineIncluded(e.target.checked)}
                      className="w-5 h-5 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#001848] dark:text-white">
                      Sound Machine / LectroFan White Noise Machine Included
                    </span>
                    <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-0.5">
                      Pre-installed calibrated white noise generator, Dohm acoustic fan, or pink noise device on bedside stand.
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[20px] ml-2 shrink-0">
                  graphic_eq
                </span>
              </label>

              {/* Soundproof Rating Decibel Selector */}
              <div
                className={`p-4 rounded-xl space-y-3 ${
                  isNightShiftMode ? 'bg-[#15233a]' : 'bg-[#e2e7ff]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#195b4c] dark:text-[#aff0db]">
                      speed
                    </span>
                    <span className="text-sm font-semibold text-[#001848] dark:text-white">Acoustic Decibel Ceiling</span>
                  </div>
                  <span className="text-xs text-[#195b4c] dark:text-[#aff0db] bg-[#367464]/20 px-2.5 py-0.5 rounded-full font-semibold">
                    Target: ≤ {decibelCeiling} dB ({decibelCeiling === '35' ? 'Whisper Calm' : decibelCeiling === '40' ? 'Quiet Residential' : 'Standard'})
                  </span>
                </div>
                {/* 3-Segment Decibel Pill Selector */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { val: '35', label: '≤ 35 dB', desc: 'Deep Sanctuary' },
                    { val: '40', label: '≤ 40 dB', desc: 'Quiet Residential' },
                    { val: '45', label: '≤ 45 dB', desc: 'Standard Multi-Family' },
                  ].map((tier) => (
                    <button
                      key={tier.val}
                      type="button"
                      onClick={() => setDecibelCeiling(tier.val as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition-all duration-200 ease-in-out cursor-pointer ${
                        decibelCeiling === tier.val
                          ? 'bg-[#005684] text-white shadow-sm'
                          : isNightShiftMode
                          ? 'bg-[#182840] text-[#93ccff] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                          : 'bg-[#eaedff] text-[#404850] hover:bg-[#dae2ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#dae2ff]'
                      }`}
                    >
                      <span>{tier.label}</span>
                      <span className="text-[11px] opacity-80 font-normal">{tier.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Hospital Proximity & Commute Buffer */}
          <section
            className={`p-6 rounded-2xl shadow-xs border ${
              isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.06)]'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#cde5ff] text-[#005684] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">local_hospital</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#001848] dark:text-white">Hospital Proximity &amp; Commute</h3>
                <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                  Minimize fatigue buffer after demanding 12-hour rotations
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Active Hospital Target Anchor */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl ${
                  isNightShiftMode ? 'bg-[#182840]' : 'bg-[#f2f3ff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[20px]">
                    near_me
                  </span>
                  <div>
                    <span className="text-[11px] text-[#404850] dark:text-[#c0c7d1] uppercase tracking-wider block">
                      Anchor Facility
                    </span>
                    <p className="text-sm font-semibold text-[#001848] dark:text-white">
                      {activeHospitalName}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#005684] dark:text-[#93ccff] font-semibold flex items-center gap-1">
                  <span>Active Anchor</span>
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </span>
              </div>

              {/* Distance Radius Chips */}
              <div>
                <span className="text-xs font-bold text-[#001848] dark:text-white mb-2 block uppercase tracking-wider">
                  Maximum Commute Radius
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { val: '1', label: '< 1.0 Mile', sub: 'Walk / Scooter' },
                    { val: '3', label: '1 – 3 Miles', sub: '5-min Drive (Selected)' },
                    { val: '5', label: '3 – 5 Miles', sub: '10-12 min Transit' },
                    { val: '10', label: '10+ Miles', sub: 'Suburban Sanctuary' },
                  ].map((rad) => (
                    <button
                      key={rad.val}
                      type="button"
                      onClick={() => setCommuteRadius(rad.val as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs transition-all duration-200 ease-in-out text-center cursor-pointer ${
                        commuteRadius === rad.val
                          ? 'bg-[#005684] text-white font-semibold shadow-sm'
                          : isNightShiftMode
                          ? 'bg-[#182840] text-[#E6ECF7] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                          : 'bg-[#eaedff] text-[#001848] hover:bg-[#e2e7ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#e2e7ff]'
                      }`}
                    >
                      <span className="block font-bold">{rad.label}</span>
                      <span className="block text-[10px] opacity-80 mt-0.5">{rad.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transit Option Toggle */}
              <label
                className={`flex items-center justify-between p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode
                    ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[20px]">
                    directions_transit
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-[#001848] dark:text-white">
                      Direct Rapid Transit / Staff Shuttle Stop
                    </span>
                    <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                      Located within 2 blocks of Robertson Express, Bull City Connector, or Hospital Shuttle.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={rapidTransitShuttle}
                  onChange={(e) => setRapidTransitShuttle(e.target.checked)}
                  className="w-5 h-5 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* SECTION 3: Rental Type & Space Configuration */}
          <section
            className={`p-6 rounded-2xl shadow-xs border ${
              isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.06)]'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#cde5ff] text-[#005684] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">apartment</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#001848] dark:text-white">Rental Type &amp; Space Configuration</h3>
                <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">Choose your privacy level during off-shift rest</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option A: Entire Property */}
              <div
                onClick={() => setRentalType('entire')}
                className={`p-4 rounded-2xl border transition-all duration-200 ease-in-out cursor-pointer relative flex flex-col justify-between ${
                  rentalType === 'entire'
                    ? 'border-[#005684] bg-gradient-to-br from-[#cde5ff]/20 to-transparent shadow-xs'
                    : isNightShiftMode
                    ? 'border-[#233550] bg-[#182840]'
                    : 'border-transparent bg-[#f2f3ff]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[22px]">
                        home_work
                      </span>
                      <span className="text-base font-bold text-[#001848] dark:text-white">Entire Sanctuary</span>
                    </div>
                    {rentalType === 'entire' && (
                      <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[20px]">
                        check_circle
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-2 mb-3 leading-relaxed">
                    100% private stand-alone home or self-contained flat with dedicated keypad entrance. Zero roommates.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#005684] dark:text-[#93ccff] font-semibold">
                  <span className="px-2 py-0.5 rounded-full bg-[#cde5ff] dark:bg-[#005684]/40">
                    Solo Rest Guaranteed
                  </span>
                  <span>Private Laundry</span>
                </div>
              </div>

              {/* Option B: Private Clinician Room */}
              <div
                onClick={() => setRentalType('suite')}
                className={`p-4 rounded-2xl border transition-all duration-200 ease-in-out cursor-pointer relative flex flex-col justify-between ${
                  rentalType === 'suite'
                    ? 'border-[#005684] bg-gradient-to-br from-[#cde5ff]/20 to-transparent shadow-xs'
                    : isNightShiftMode
                    ? 'border-[#233550] bg-[#182840]'
                    : 'border-transparent bg-[#f2f3ff]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#404850] dark:text-[#c0c7d1] text-[22px]">
                        meeting_room
                      </span>
                      <span className="text-base font-semibold text-[#001848] dark:text-white">Clinician Suite</span>
                    </div>
                    {rentalType === 'suite' && (
                      <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[20px]">
                        check_circle
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-2 mb-3 leading-relaxed">
                    Private bedroom with en-suite bath in a verified quiet multi-nurse or travel clinician co-living house.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#404850] dark:text-[#c0c7d1]">
                  <span className="px-2 py-0.5 rounded-full bg-[#dae2ff] dark:bg-[#1f3350]">
                    Healthcare-Only Co-living
                  </span>
                  <span>Lower Stipend Cost</span>
                </div>
              </div>
            </div>

            {/* Bed Count Sub-Row */}
            <div className="mt-4 pt-4 border-t border-[#eaedff] dark:border-[#233550] flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#001848] dark:text-white">
                Bedrooms Needed
              </span>
              <div className="flex items-center gap-2">
                {[
                  { val: 'any', label: 'Any' },
                  { val: '1', label: '1 Bed (Studio/1BR)' },
                  { val: '2+', label: '2+ Beds' },
                ].map((b) => (
                  <button
                    key={b.val}
                    type="button"
                    onClick={() => setBedrooms(b.val as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      bedrooms === b.val
                        ? 'bg-[#005684] text-white shadow-xs'
                        : isNightShiftMode
                        ? 'bg-[#182840] text-[#E6ECF7] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                        : 'bg-[#eaedff] text-[#001848] hover:bg-[#dae2ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#dae2ff]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 4: Clinical Hygiene & Shift-Ready Amenities */}
          <section
            className={`p-6 rounded-2xl shadow-xs border ${
              isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.06)]'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#cde5ff] text-[#005684] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">sanitizer</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#001848] dark:text-white">Clinical Hygiene &amp; Shift Amenities</h3>
                <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                  High-touch practical fixtures tailored for grueling shifts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Scrub Washer */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]' : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={scrubLaundry}
                  onChange={(e) => setScrubLaundry(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-[#001848] dark:text-white block">
                    In-Unit High-Heat Sanitizing Laundry
                  </span>
                  <span className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Sanitize scrubs immediately after ICU/ED rotations.
                  </span>
                </div>
              </label>

              {/* Keyless Digital Lock */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]' : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={keylessLock}
                  onChange={(e) => setKeylessLock(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-[#001848] dark:text-white block">
                    Smart Keyless Check-In (Digital PIN)
                  </span>
                  <span className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Codes active 3h prior to shift; zero host friction.
                  </span>
                </div>
              </label>

              {/* Charting Workspace */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]' : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={chartingDesk}
                  onChange={(e) => setChartingDesk(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-[#001848] dark:text-white block">
                    Ergonomic Charting Desk &amp; High-Speed Wi-Fi
                  </span>
                  <span className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Epic/Cerner ready; verified 300+ Mbps connection.
                  </span>
                </div>
              </label>

              {/* Gated Secure Parking */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]' : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={gatedParking}
                  onChange={(e) => setGatedParking(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-[#001848] dark:text-white block">
                    Dedicated Gated Parking / Well-Lit Area
                  </span>
                  <span className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Safe 2:00 AM / 7:00 PM shift change arrivals.
                  </span>
                </div>
              </label>

              {/* Pet Friendly */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]' : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={petFriendly}
                  onChange={(e) => setPetFriendly(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-[#001848] dark:text-white block">
                    Pet Friendly (Therapy &amp; Support Dogs)
                  </span>
                  <span className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Accommodations welcoming nurse companion animals.
                  </span>
                </div>
              </label>

              {/* Full Meal-Prep Kitchen */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]' : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={fullKitchen}
                  onChange={(e) => setFullKitchen(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-[#001848] dark:text-white block">
                    Full Kitchen &amp; Meal Prep Provisions
                  </span>
                  <span className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Stocked Pyrex/glass prep containers &amp; Vitamix blender.
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* SECTION 5: Assignment Duration & Shift-Flex Cancellation */}
          <section
            className={`p-6 rounded-2xl shadow-xs border ${
              isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.06)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#cde5ff] text-[#005684] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#001848] dark:text-white">Assignment Duration &amp; Flexibility</h3>
                  <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">Align lease timeline to your travel contract term</p>
                </div>
              </div>
              <span
                className="text-[#745b0d] dark:text-[#ffdc84] text-[18px] hidden sm:inline"
                style={{ fontFamily:"'Kaushan Script', cursive" }}
              >
                No Locked Leases
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { val: '4', label: '4 Weeks (Rapid Crisis)' },
                  { val: '8', label: '8 Weeks' },
                  { val: '13', label: '13 Weeks (Standard Contract)' },
                  { val: '26', label: '26 Weeks (Extended)' },
                  { val: 'custom', label: 'Custom' },
                ].map((dur) => (
                  <button
                    key={dur.val}
                    type="button"
                    onClick={() => setDurationWeeks(dur.val as any)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ease-in-out cursor-pointer ${
                      durationWeeks === dur.val
                        ? 'bg-[#005684] text-white shadow-xs flex items-center gap-1.5'
                        : isNightShiftMode
                        ? 'bg-[#182840] text-[#E6ECF7] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]'
                        : 'bg-[#eaedff] text-[#001848] hover:bg-[#dae2ff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#dae2ff]'
                    }`}
                  >
                    <span>{dur.label}</span>
                    {durationWeeks === dur.val && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>
                ))}
              </div>

              {durationWeeks === 'custom' && (
                <div className="mt-4 max-w-[200px]">
                  <input
                    type="number"
                    min="1"
                    value={customDuration || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomDuration(isNaN(val) ? 0 : val);
                    }}
                    placeholder="Custom duration (weeks)"
                    className={`w-full h-11 px-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#005684] ${
                      isNightShiftMode
                        ? 'bg-[#182840] text-white'
                        : 'bg-[#f2f3ff] text-[#001848]'
                    }`}
                  />
                </div>
              )}

              {/* Cancellation Guarantee Banner */}
              <div className="p-4 rounded-xl bg-[#367464]/15 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#195b4c] dark:text-[#aff0db] text-[22px] mt-0.5 shrink-0">
                  shield
                </span>
                <div>
                  <h5 className="text-xs font-bold text-[#195b4c] dark:text-[#aff0db]">
                    Shift-Flex Contract Guarantee Included
                  </h5>
                  <p className="text-xs text-[#404850] dark:text-[#c0c7d1] mt-0.5 leading-relaxed">
                    If the hospital facility terminates or pivots your clinical assignment early, cancel without penalty with 14-day certified agency verification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: Monthly Price & Per Diem Rate Range */}
          <section
            className={`p-6 rounded-2xl shadow-xs border ${
              isNightShiftMode ? 'bg-[#111e33] border-[#233550]' : 'bg-white border-[rgba(11,37,89,0.06)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#cde5ff] text-[#005684] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#001848] dark:text-white">Monthly Rent &amp; Per Diem Range</h3>
                  <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                    Stipend-conscious pricing without unexpected fee markups
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-[#005684] dark:text-[#93ccff]">
                  $1,000 – ${rentMax.toLocaleString()}
                </span>
                <span className="block text-[11px] text-[#404850] dark:text-[#c0c7d1]">per month</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Range Slider */}
              <div className="py-2">
                <input
                  type="range"
                  min="1200"
                  max="4500"
                  step="50"
                  value={rentMax}
                  onChange={(e) => setRentMax(Number(e.target.value))}
                  className="w-full accent-[#005684] cursor-pointer"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-[#404850] dark:text-[#c0c7d1]">
                  <span>$1,000</span>
                  <span className="text-[#195b4c] dark:text-[#aff0db] font-semibold">
                    NC Avg Nurse Housing Stipend: $2,800/mo
                  </span>
                  <span>$4,500+</span>
                </div>
              </div>

              {/* All Utilities Included Mandatory Toggle */}
              <label
                className={`flex items-center justify-between p-3.5 rounded-xl transition-colors cursor-pointer ${
                  isNightShiftMode ? 'bg-[#182840] hover:bg-[#1e3250] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1e3250]' : 'bg-[#f2f3ff] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#745b0d] dark:text-[#ffdc84] text-[20px]">
                    bolt
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-[#001848] dark:text-white">
                      All Utilities &amp; High-Speed Wi-Fi Included in Base Rate
                    </span>
                    <p className="text-xs text-[#404850] dark:text-[#c0c7d1]">
                      $0 unexpected surcharge: Electric, AC/heat, water, trash, and 500 Mbps Wi-Fi.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={utilitiesIncluded}
                  onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                  className="w-5 h-5 rounded text-[#005684] focus:ring-[#005684] accent-[#005684] cursor-pointer"
                />
              </label>
            </div>
          </section>
        </div>

        {/* Modal Footer (Sticky Bottom Action Bar) */}
        <div
          className={`px-6 sm:px-8 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg ${
            isNightShiftMode ? 'bg-[#0B1626] border-[#233550]' : 'bg-white border-[#eaedff]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#195b4c] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#195b4c]"></span>
            </span>
            <span>
              Showing <strong className="text-[#005684] dark:text-[#93ccff] font-bold">42 verified nurse sanctuaries</strong> near Duke Health
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#404850] dark:text-[#c0c7d1] hover:bg-[#eaedff] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#eaedff] dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#005684] hover:bg-[#0a6fa8] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0a6fa8] text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all duration-200 ease-in-out transform active:scale-95 cursor-pointer"
            >
              <span>Apply Filters • 42 Sanctuaries</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
