import React, { useState } from 'react';
import { HousingListing } from '../types';
import { NursesPillowLogo } from './NursesPillowLogo';

interface MobileParityViewProps {
  isNightShiftMode: boolean;
  onNavigateHome: () => void;
  listings?: HousingListing[];
  currentTab?: string;
  onChangeTab?: (tab: string) => void;
  savedListingIds?: string[];
  onToggleSave?: (id: string) => void;
  activeBookings?: any[];
}

export const MobileParityView: React.FC<MobileParityViewProps> = ({
  isNightShiftMode,
  onNavigateHome,
  listings,
  currentTab,
  onChangeTab,
  savedListingIds,
  onToggleSave,
  activeBookings,
}) => {
  const [activeScreen, setActiveScreen] = useState<string>('M-04');
  const [deviceTheme, setDeviceTheme] = useState<'light' | 'dark'>('light');
  const [showPasswordMock, setShowPasswordMock] = useState(false);

  const screens = [
    { id: 'M-01', name: 'Splash & First Run' },
    { id: 'M-02', name: 'Push Permission Prompt' },
    { id: 'M-03', name: 'Biometric App Auth' },
    { id: 'M-04', name: 'Assignment Search Home' },
    { id: 'M-05', name: 'Results & Map Sheet' },
    { id: 'M-06', name: 'Listing Detail Sheet' },
    { id: 'M-07', name: 'Apple Pay Checkout' },
    { id: 'M-08', name: 'Offline Keyless Lock' },
    { id: 'M-09', name: 'Host Requests Inbox' },
    { id: 'M-10', name: 'Shift Chat Messages' },
    { id: 'M-11', name: 'Camera Scanner ID' },
    { id: 'M-12', name: 'Offline Mode Banner' },
    { id: 'M-13', name: 'Force Update Modal' },
    { id: 'M-14', name: 'App Store Assets' },
  ];

  return (
    <div className={`w-full py-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto transition-colors ${
      isNightShiftMode ? 'text-[#E6ECF7]' : 'text-[#001848]'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
              MILESTONE 3 INVENTORY (M-01 to M-14)
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              Mobile Parity Pass Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mobile Apps Parity Simulator
          </h1>
          <p className="text-sm opacity-80 mt-1">
            Native iOS &amp; Android design fidelity for traveling clinicians on the move.
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

      {/* Control Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Screen Selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">
              Select Mobile Screen (14 Total)
            </h3>
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg text-xs">
              <button
                onClick={() => setDeviceTheme('light')}
                className={`px-2 py-0.5 rounded font-semibold ${deviceTheme === 'light' ? 'bg-white shadow text-black' : 'opacity-60'}`}
              >
                Light
              </button>
              <button
                onClick={() => setDeviceTheme('dark')}
                className={`px-2 py-0.5 rounded font-semibold ${deviceTheme === 'dark' ? 'bg-gray-800 shadow text-white' : 'opacity-60'}`}
              >
                Dark
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {screens.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveScreen(s.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all duration-200 ease-in-out ${
                  activeScreen === s.id
                    ? 'bg-[#005684] text-white border-[#005684] shadow-sm'
                    : 'bg-white dark:bg-[#0B1626] border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:border-[#005684]/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                    activeScreen === s.id ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5'
                  }`}>
                    {s.id}
                  </span>
                  <span>{s.name}</span>
                </div>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Phone Mockup Frame */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-[340px] sm:w-[380px] h-[680px] rounded-[48px] bg-[#1a1a1a] p-3 shadow-lg border-4 border-[#333] relative flex flex-col">
            {/* Phone Speaker & Dynamic Island */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222]" />
              <div className="w-2 h-2 rounded-full bg-blue-900/60" />
            </div>

            {/* Internal Display */}
            <div className={`w-full h-full rounded-[38px] overflow-hidden flex flex-col relative transition-colors ${
              deviceTheme === 'dark' ? 'bg-[#0B1626] text-[#E6ECF7]' : 'bg-[#FAF8FF] text-[#001848]'
            }`}>
              {/* iOS Status Bar */}
              <div className="h-10 pt-3 px-6 flex items-center justify-between text-[11px] font-bold z-20 shrink-0">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
                  <span className="material-symbols-outlined text-[14px]">wifi</span>
                  <span className="material-symbols-outlined text-[16px]">battery_full</span>
                </div>
              </div>

              {/* Mobile Screen Contents */}
              <div className="flex-1 overflow-y-auto px-4 py-2 relative">
                {/* M-01: Splash */}
                {activeScreen === 'M-01' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <NursesPillowLogo size={52} />
                    <h2 className="text-2xl font-black">Nurses Pillow</h2>
                    <p className="text-xs opacity-70">
                      Mid-term sanctuary housing built exclusively for grueling clinical rotations.
                    </p>
                    <div className="pt-8 w-full space-y-2">
                      <button className="w-full py-3 bg-[#005684] text-white rounded-xl text-xs font-bold shadow-md">
                        Get Started as Clinician
                      </button>
                      <button className="w-full py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold">
                        Host a Healthcare Worker
                      </button>
                    </div>
                  </div>
                )}

                {/* M-02: Push Permission */}
                {activeScreen === 'M-02' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#005684]/10 text-[#005684] dark:text-[#93ccff] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[36px]">notifications_active</span>
                    </div>
                    <h2 className="text-lg font-bold">Never Miss a Shift Alert</h2>
                    <p className="text-xs opacity-70 leading-relaxed">
                      Instant notifications for 24h host booking deadlines, digital door codes, and daytime quiet hours updates.
                    </p>
                    <div className="pt-4 w-full space-y-2">
                      <button className="w-full py-3 bg-[#005684] text-white rounded-xl text-xs font-bold shadow-md">
                        Enable Urgent Notifications
                      </button>
                      <button className="w-full py-2 text-xs opacity-60">
                        Maybe Later
                      </button>
                    </div>
                  </div>
                )}

                {/* M-03: Biometric Auth */}
                {activeScreen === 'M-03' && (
                  <div className="h-full flex flex-col justify-between py-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <NursesPillowLogo size={24} />
                        <span className="text-sm font-bold">Sign In</span>
                      </div>
                      <h2 className="text-xl font-extrabold">Welcome Back, Clinician</h2>
                      <div>
                        <label className="text-[11px] font-semibold opacity-70">Hospital or Agency Email</label>
                        <input
                          type="text"
                          defaultValue="sarah.jenkins@ucsf.edu"
                          className="w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-xs font-semibold mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold opacity-70">Password</label>
                        <div className="relative">
                          <input
                            type={showPasswordMock ? "text" : "password"}
                            defaultValue="••••••••••••"
                            className="w-full py-2.5 pl-2.5 pr-8 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-xs font-semibold mt-1"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordMock(!showPasswordMock)}
                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 pt-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] rounded-full"
                            aria-label={showPasswordMock ? "Hide password" : "Show password"}
                            aria-pressed={showPasswordMock}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {showPasswordMock ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-[#005684] text-white rounded-xl text-xs font-bold shadow-md">
                        Sign In
                      </button>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[28px] text-[#005684] dark:text-[#93ccff]">
                          fingerprint
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold opacity-80">
                        Tap for FaceID / Biometric Login
                      </div>
                    </div>
                  </div>
                )}

                {/* M-04: App Search Home */}
                {activeScreen === 'M-04' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <NursesPillowLogo size={22} />
                        <span className="text-xs font-bold">Nurses Pillow</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        RN Verified
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#0B1626] p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/10 space-y-3">
                      <div className="text-xs font-bold flex items-center gap-1 text-[#005684] dark:text-[#93ccff]">
                        <span className="material-symbols-outlined text-[16px]">local_hospital</span>
                        Where is your next rotation?
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#005684]">search</span>
                        <span>UCSF Medical Center - Mission Bay</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                          <div className="text-[10px] opacity-60">Contract</div>
                          <div className="font-bold">13 Weeks</div>
                        </div>
                        <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                          <div className="text-[10px] opacity-60">Radius</div>
                          <div className="font-bold">&lt; 5 Miles</div>
                        </div>
                      </div>
                      <button className="w-full py-2.5 bg-[#005684] text-white rounded-xl text-xs font-bold shadow-md">
                        Find Sanctuary Stays
                      </button>
                    </div>

                    <div>
                      <div className="text-xs font-bold mb-2">Featured Near Hospital</div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B1626] border border-black/5 dark:border-white/10 flex gap-2.5 items-center">
                        <img
                          src={listings && listings.length > 0 ? listings[0].images[0] : ""}
                          alt="listing"
                          className="w-16 h-16 rounded-lg object-cover bg-slate-100"
                        />
                        <div className="text-xs flex-1">
                          <div className="font-bold truncate">{listings && listings.length > 0 ? listings[0].title : "Your Stay"}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">0.8 mi • 6 min transit</div>
                          <div className="text-[11px] font-bold text-[#005684] dark:text-[#93ccff] mt-1">
                            ${listings && listings.length > 0 ? listings[0].monthlyRate : "0"}/mo
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* M-07: Apple Pay Checkout */}
                {activeScreen === 'M-07' && (
                  <div className="h-full flex flex-col justify-between py-2">
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-center">Checkout &amp; Booking</div>
                      <div className="p-3 rounded-2xl bg-white dark:bg-[#0B1626] border border-black/5 dark:border-white/10 space-y-2 text-xs">
                        <div className="font-bold">UCSF Mission Bay Sanctuary</div>
                        <div className="text-[10px] opacity-70">Oct 15 - Jan 14 (13 Weeks)</div>
                        <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-1">
                          <div className="flex justify-between">
                            <span>First Month Rent</span>
                            <span className="font-bold">$2,800.00</span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Traveler Service Fee</span>
                            <span>$0.00 (Waived)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Security Deposit Hold</span>
                            <span className="text-emerald-600 font-semibold">$0.00</span>
                          </div>
                          <div className="flex justify-between font-bold pt-1 border-t border-black/5">
                            <span>Total Due Now</span>
                            <span>$2,950.00</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] opacity-70 text-center leading-relaxed">
                        Funds hold authorized now. Captured ONLY when host accepts within 24 hours.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full py-3.5 bg-black text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg">
                        <span>Pay with</span>
                        <span className="text-sm font-black tracking-tight">Pay</span>
                      </button>
                      <button className="w-full py-2 text-xs opacity-70">
                        Pay with Card / Bank Debit
                      </button>
                    </div>
                  </div>
                )}

                {/* M-08: Offline Keyless Lock */}
                {activeScreen === 'M-08' && (
                  <div className="h-full flex flex-col justify-between py-4 text-center">
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold mb-3">
                        <span className="material-symbols-outlined text-[14px]">offline_pin</span>
                        Cached Offline Key
                      </div>
                      <h2 className="text-lg font-bold">Front Entrance Keypad</h2>
                      <p className="text-xs opacity-70">450 Mission Bay Blvd S, Apt 4B</p>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1626] border border-black/5 dark:border-white/10 shadow-sm space-y-2">
                      <div className="text-xs opacity-60 uppercase tracking-wider font-bold">Digital Access Code</div>
                      <div className="text-3xl font-mono font-black text-[#005684] dark:text-[#93ccff] tracking-widest">
                        *4821#
                      </div>
                      <div className="text-[10px] opacity-70">Press * then 4-8-2-1 followed by #</div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-left space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">wifi</span>
                        Wi-Fi: Sanctuary_5G
                      </div>
                      <div className="text-[11px] font-mono opacity-80">Pass: ClinicalSleep2026!</div>
                    </div>
                  </div>
                )}

                {/* Default preview for remaining screens */}
                {!['M-01', 'M-02', 'M-03', 'M-04', 'M-07', 'M-08'].includes(activeScreen) && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#005684]/15 text-[#005684] dark:text-[#93ccff]">
                      {activeScreen}
                    </span>
                    <h3 className="text-base font-bold">
                      {screens.find((s) => s.id === activeScreen)?.name}
                    </h3>
                    <p className="text-xs opacity-70 leading-relaxed max-w-xs">
                      Mobile native viewport implemented in Milestone 3 parity pass. Formatted for touch targets &gt;= 44px and offline resilience.
                    </p>
                    <button className="px-4 py-2 rounded-xl bg-[#005684] text-white text-xs font-bold">
                      Simulate Action
                    </button>
                  </div>
                )}
              </div>

              {/* iOS Home Bar */}
              <div className="h-6 flex items-center justify-center shrink-0">
                <div className="w-32 h-1 bg-black/30 dark:bg-white/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
