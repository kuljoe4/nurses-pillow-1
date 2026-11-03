const fs = require('fs');
let content = fs.readFileSync('src/components/HostPortalView.tsx', 'utf8');

const search = `{/* Listing & Room Calendar Editor - Responsive Card Grid Layout */}
      {activeHostTab === 'editor' && (!currentUser?.isHostVerified || !payoutsEnabled) && (
        <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-8 sm:p-12 shadow-[0_2px_12px_rgba(11,37,89,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
          </div>
          <h2 className="text-xl font-bold text-[#0B2559] dark:text-white mb-2">Pending Verification</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            You must complete your Stripe onboarding and wait for an administrator to verify your credentials before you can create or edit property listings.
          </p>
          <button
            onClick={() => setActiveHostTab('onboarding')}
            className="bg-[#0A6FA8] hover:bg-[#0A6FA8]/90 text-white font-bold h-11 px-8 rounded-xl transition-all shadow-[0_2px_8px_rgba(10,111,168,0.25)] flex items-center gap-2"
          >
            Go to Verification Step
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      )}
      {activeHostTab === 'editor' && currentUser?.isHostVerified && payoutsEnabled && (`;

const replace = `{/* Listing & Room Calendar Editor - Responsive Card Grid Layout */}
      {activeHostTab === 'editor' && (`;

if (content.includes(search)) {
    fs.writeFileSync('src/components/HostPortalView.tsx', content.replace(search, replace));
    console.log("Reverted editor block wrapper.");
} else {
    console.log("Could not find editor block wrapper.");
}
