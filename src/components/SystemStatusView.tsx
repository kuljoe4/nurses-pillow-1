import React, { useState } from 'react';

interface SystemStatusViewProps {
  isNightShiftMode: boolean;
  initialType?: 'status' | '404' | '500' | 'maintenance' | 'suspended';
  onNavigateHome: () => void;
  onOpenSupport: () => void;
  isDeveloper?: boolean;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({
  isNightShiftMode,
  initialType = 'status',
  onNavigateHome,
  onOpenSupport,
  isDeveloper = false,
}) => {
  const [activeView, setActiveView] = useState<'status' | '404' | '500' | 'maintenance' | 'suspended'>(initialType);

  const services = [
    {
      name: 'Professional Credential Verification',
      category: 'Professional Verification',
      status: 'Operational',
      description: 'Review of professional credentials and license information',
    },
    {
      name: 'Secure Payments & Host Payouts',
      category: 'Payments',
      status: 'Operational',
      description: 'Booking payments, host payouts, and refunds',
    },
    {
      name: 'Hospital & Location Services',
      category: 'Location Services',
      status: 'Operational',
      description: 'Hospital locations and distance information',
    },
    {
      name: 'Messages & Notifications',
      category: 'Notifications',
      status: 'Operational',
      description: 'Account verification and booking updates',
    },
    {
      name: 'Secure Document & Photo Storage',
      category: 'Secure Storage',
      status: 'Operational',
      description: 'Property photos and protected verification information',
    },
    {
      name: 'Platform Availability',
      category: 'Platform Services',
      status: 'Operational',
      description: 'Core services that support the Nurses Pillow platform',
    },
  ];

  return (
    <div
      className={`w-full py-12 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto transition-colors ${
        isNightShiftMode ? 'text-[#E6ECF7]' : 'text-[#001848]'
      }`}
    >
      {/* Developer-Only Sandbox Switcher (Hidden from Client) */}
      {isDeveloper && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-purple-600 dark:text-purple-400">
              terminal
            </span>
            <span className="font-bold">Developer Sandbox: Preview Fallback States</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              aria-label="View live health status"
              onClick={() => setActiveView('status')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all duration-200 ease-in-out cursor-pointer ${
                activeView === 'status'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'hover:bg-purple-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-purple-500/20'
              }`}
            >
              Live Health Status
            </button>
            <button
              aria-label="Preview 404 page error state"
              onClick={() => setActiveView('404')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all duration-200 ease-in-out cursor-pointer ${
                activeView === '404'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'hover:bg-purple-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-purple-500/20'
              }`}
            >
              404 Page
            </button>
            <button
              aria-label="Preview 500 page error state"
              onClick={() => setActiveView('500')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all duration-200 ease-in-out cursor-pointer ${
                activeView === '500'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'hover:bg-purple-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-purple-500/20'
              }`}
            >
              500 Error
            </button>
            <button
              aria-label="Preview maintenance mode state"
              onClick={() => setActiveView('maintenance')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all duration-200 ease-in-out cursor-pointer ${
                activeView === 'maintenance'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'hover:bg-purple-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-purple-500/20'
              }`}
            >
              Maintenance
            </button>
            <button
              aria-label="Preview suspended account compliance notice"
              onClick={() => setActiveView('suspended')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all duration-200 ease-in-out cursor-pointer ${
                activeView === 'suspended'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'hover:bg-purple-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-purple-500/20'
              }`}
            >
              Compliance Notice
            </button>
          </div>
        </div>
      )}

      {/* 1. DEFAULT CLIENT-FACING LIVE HEALTH STATUS */}
      {activeView === 'status' && (
        <div className="space-y-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#195b4c]/10 text-[#195b4c] dark:bg-[#aff0db]/15 dark:text-[#aff0db] mb-2">
                <span className="w-2 h-2 rounded-full bg-[#195b4c] dark:bg-[#aff0db]" />
                Live Status
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Nurses Pillow Platform Reliability &amp; Status
              </h1>
              <p className="text-sm opacity-80 mt-1">
                Real-time uptime and performance metrics across all hospital integration channels.
              </p>
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-all duration-200 ease-in-out cursor-pointer"
              >
                Back to Marketplace
              </button>
            </div>
          </div>

          {/* Overall Health Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              isNightShiftMode
                ? 'bg-[#0E1A2E] border-[#233550]'
                : 'bg-white border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#aff0db]/25 text-[#195b4c] dark:text-[#aff0db] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[32px]">verified</span>
              </div>
              <div>
                <div className="text-lg font-bold">Platform service overview</div>
                <div className="text-xs opacity-75 mt-0.5">
                  Service information and availability updates
                </div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 pt-4 md:pt-0 md:pl-8 text-xs opacity-75">
              Service availability can change. Contact support if you are experiencing a problem.
            </div>
          </div>

          {/* Subsystems List */}
          <div
            className={`rounded-3xl border shadow-sm overflow-hidden ${
              isNightShiftMode
                ? 'bg-[#0E1A2E] border-[#233550]'
                : 'bg-white border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <div className="p-6 border-b border-black/5 dark:border-white/10">
              <h2 className="text-base font-bold">Platform Services</h2>
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {services.map((svc, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-colors"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#001848] dark:text-white">
                        {svc.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 opacity-80">
                        {svc.category}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 leading-relaxed">{svc.description}</p>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-xs">
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{svc.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Notice & Protocol */}
          <div
            className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isNightShiftMode
                ? 'bg-[#0E1A2E] border-[#233550]'
                : 'bg-white border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <div className="space-y-1">
              <div className="text-sm font-bold flex items-center gap-2 text-[#745b0d] dark:text-[#ffdf91]">
                <span className="material-symbols-outlined text-[18px]">engineering</span>
                <span>Maintenance updates</span>
              </div>
              <p className="text-xs opacity-80 max-w-xl">
                If maintenance is planned, we will share the timing and any expected service impact here in advance.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSupport}
              className="px-4 py-2 rounded-xl bg-[#001848] dark:bg-[#005684] text-white text-xs font-bold hover:bg-[#162e62] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#162e62] transition-all duration-200 ease-in-out shrink-0 cursor-pointer"
            >
              Contact support
            </button>
          </div>
        </div>
      )}

      {/* 2. 404 NOT FOUND PREVIEW */}
      {activeView === '404' && (
        <div className="text-center py-12 px-6 bg-white dark:bg-[#0B1626] rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#005684]/10 dark:bg-[#005684]/20 flex items-center justify-center text-[#005684] dark:text-[#93ccff]">
            <span className="material-symbols-outlined text-[42px]">bed</span>
          </div>
          <div className="text-xs font-bold text-[#005684] dark:text-[#93ccff] uppercase tracking-wider">
            Listing or Sanctuary Not Found
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            This Sanctuary Has Moved or Concluded Its Rotation
          </h1>
          <p className="text-sm opacity-80 max-w-md mx-auto leading-relaxed">
            The listing URL you followed may have expired, or the host may have blocked off dates for private maintenance. Our hospital directory is fully stocked with nearby options.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#005684] text-white text-xs font-bold hover:bg-[#00476d] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#00476d] transition-all duration-200 ease-in-out shadow-md cursor-pointer"
            >
              Search Stays Near My Hospital
            </button>
            <button
              onClick={onOpenSupport}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[rgba(11,37,89,0.2)] dark:border-[#233550] text-xs font-bold hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-all duration-200 ease-in-out cursor-pointer"
            >
              Contact Support Desk
            </button>
          </div>
        </div>
      )}

      {/* 3. 500 ERROR PREVIEW */}
      {activeView === '500' && (
        <div className="text-center py-12 px-6 bg-white dark:bg-[#0B1626] rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-[42px]">emergency</span>
          </div>
          <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
            Service interruption
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            We could not load this page
          </h1>
          <p className="text-sm opacity-80 max-w-md mx-auto leading-relaxed">
            We are having trouble loading this information. Please try again. If the problem continues, contact support.
          </p>
          <div className="inline-block px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-xs opacity-70">
            
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#005684] text-white text-xs font-bold hover:bg-[#00476d] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#00476d] transition-all duration-200 ease-in-out shadow-md cursor-pointer"
            >
              Reload Application
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[rgba(11,37,89,0.2)] dark:border-[#233550] text-xs font-bold hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-all duration-200 ease-in-out cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* 4. MAINTENANCE PREVIEW */}
      {activeView === 'maintenance' && (
        <div className="text-center py-12 px-6 bg-white dark:bg-[#0B1626] rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <span className="material-symbols-outlined text-[42px]">engineering</span>
          </div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Scheduled Sanctuary System Maintenance
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Routine Infrastructure Upgrade in Progress
          </h1>
          <p className="text-sm opacity-80 max-w-md mx-auto leading-relaxed">
            We are performing scheduled security enhancements and state board license sync updates. All active door codes and booking confirmations remain fully operational.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-sm mx-auto text-xs text-amber-800 dark:text-amber-200 text-left">
            <div className="font-bold mb-1">Window: 02:00 AM – 04:00 AM EST</div>
            <div>Expected completion: ~35 minutes remaining. Emergency clinician support hotline remains active 24/7.</div>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenSupport}
              className="px-6 py-3 rounded-xl bg-[#005684] text-white text-xs font-bold hover:bg-[#00476d] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#00476d] transition-all duration-200 ease-in-out shadow-md cursor-pointer"
            >
              Contact 24/7 Clinical Hotline
            </button>
          </div>
        </div>
      )}

      {/* 5. SUSPENDED PREVIEW */}
      {activeView === 'suspended' && (
        <div className="text-center py-12 px-6 bg-white dark:bg-[#0B1626] rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <span className="material-symbols-outlined text-[42px]">gavel</span>
          </div>
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Account Compliance Review Notice
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Account Access Temporarily Paused
          </h1>
          <p className="text-sm opacity-80 max-w-md mx-auto leading-relaxed">
            This account has been placed on administrative hold pending safety or compliance review under Nurses Pillow Sanctuary Standards.
          </p>
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[rgba(11,37,89,0.1)] dark:border-[#233550] max-w-md mx-auto text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="opacity-70">Review Reference:</span>
              <span className="font-mono font-bold">NP-REV-2026-0814</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Category:</span>
              <span className="font-bold">Sanctuary Quiet Hours Rule Verification</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Status:</span>
              <span className="text-amber-600 font-bold">Pending Administrative Review</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenSupport}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rose-700 transition-all duration-200 ease-in-out shadow-md cursor-pointer"
            >
              Submit Compliance Appeal
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[rgba(11,37,89,0.2)] dark:border-[#233550] text-xs font-bold hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-all duration-200 ease-in-out cursor-pointer"
            >
              Return to Public Site
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
