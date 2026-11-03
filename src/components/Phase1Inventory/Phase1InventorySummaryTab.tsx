import React, { useMemo } from 'react';
import { PHASE_1_SCREENS, getScreenBuildTier } from '../../data/phase1InventoryData';

export const Phase1InventorySummaryTab: React.FC = () => {
  const summaryStats = useMemo(() => {
    // ⚡ Bolt Performance Optimization: Single-pass iteration
    // Replaced 17 separate O(N) array .filter() operations with a single O(N) loop
    return PHASE_1_SCREENS.reduce(
      (acc, s) => {
        const tier = getScreenBuildTier(s);

        if (s.milestone === 'M1') acc.m1++;
        if (s.milestone === 'M2') acc.m2++;
        if (s.milestone === 'M3') acc.m3++;

        if (s.platform === 'Web') acc.webOnly++;
        if (s.platform === 'Mobile') acc.mobileOnly++;
        if (s.platform === 'Both') acc.bothPlatform++;

        if (s.priority === 'Must') acc.must++;
        if (s.priority === 'Should') acc.should++;
        if (s.priority === 'Could') acc.could++;

        if (s.role === 'Nurse') acc.nurseRole++;
        if (s.role === 'Host') acc.hostRole++;
        if (s.role === 'Admin') acc.adminRole++;
        if (s.role === 'All' || s.role === 'Nurse / Host') acc.sharedRole++;

        if (tier === 'T1') acc.t1++;
        if (tier === 'T2') acc.t2++;
        if (tier === 'T3') acc.t3++;
        if (tier === 'T4') acc.t4++;

        return acc;
      },
      {
        total: PHASE_1_SCREENS.length,
        m1: 0, m2: 0, m3: 0,
        webOnly: 0, mobileOnly: 0, bothPlatform: 0,
        must: 0, should: 0, could: 0,
        nurseRole: 0, hostRole: 0, adminRole: 0, sharedRole: 0,
        t1: 0, t2: 0, t3: 0, t4: 0,
      }
    );
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* By Milestone */}
        <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-5 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-3">
          <h3 className="text-sm font-bold flex items-center justify-between">
            <span>By Milestone</span>
            <span className="text-xs font-mono opacity-50">Sprint Group</span>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-700 dark:text-blue-300">M1 (Foundation)</span>
              <span className="font-extrabold">{summaryStats.m1}</span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(summaryStats.m1 / summaryStats.total) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="font-semibold text-purple-700 dark:text-purple-300">M2 (Dashboards)</span>
              <span className="font-extrabold">{summaryStats.m2}</span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(summaryStats.m2 / summaryStats.total) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="font-semibold text-teal-700 dark:text-teal-300">M3 (Mobile/Admin)</span>
              <span className="font-extrabold">{summaryStats.m3}</span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${(summaryStats.m3 / summaryStats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-5 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-3">
          <h3 className="text-sm font-bold flex items-center justify-between">
            <span>By Priority</span>
            <span className="text-xs font-mono opacity-50">MoSCoW</span>
          </h3>
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
              <div>
                <div className="font-bold text-rose-900 dark:text-rose-100">Must</div>
                <div className="text-[11px] opacity-70">Launch Blocker (Critical Path)</div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-base text-rose-700 dark:text-rose-300">{summaryStats.must}</span>
                <span className="text-[10px] block opacity-60">
                  {Math.round((summaryStats.must / summaryStats.total) * 100)}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
              <div>
                <div className="font-bold text-amber-900 dark:text-amber-100">Should</div>
                <div className="text-[11px] opacity-70">Expected at launch but degradable</div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-base text-amber-700 dark:text-amber-300">{summaryStats.should}</span>
                <span className="text-[10px] block opacity-60">
                  {Math.round((summaryStats.should / summaryStats.total) * 100)}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-500/10 border border-gray-500/20 flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">Could</div>
                <div className="text-[11px] opacity-70">In scope, include if effort allows</div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-base text-gray-700 dark:text-gray-300">{summaryStats.could}</span>
                <span className="text-[10px] block opacity-60">
                  {Math.round((summaryStats.could / summaryStats.total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* By Platform */}
        <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-5 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-3">
          <h3 className="text-sm font-bold flex items-center justify-between">
            <span>By Platform</span>
            <span className="text-xs font-mono opacity-50">Viewport Targets</span>
          </h3>
          <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <div className="text-lg font-bold text-[#005684] dark:text-[#93ccff]">{summaryStats.webOnly}</div>
              <div className="font-bold mt-1">Web Only</div>
              <div className="text-[10px] opacity-60 mt-0.5">Responsive Web</div>
            </div>
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <div className="text-lg font-bold text-[#005684] dark:text-[#93ccff]">{summaryStats.bothPlatform}</div>
              <div className="font-bold mt-1">Both</div>
              <div className="text-[10px] opacity-60 mt-0.5">Design Each Width</div>
            </div>
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <div className="text-lg font-bold text-[#005684] dark:text-[#93ccff]">{summaryStats.mobileOnly}</div>
              <div className="font-bold mt-1">Mobile Only</div>
              <div className="text-[10px] opacity-60 mt-0.5">Flutter iOS/Android</div>
            </div>
          </div>
        </div>

        {/* By Build Tier (Demo-first sequencing) */}
        <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-5 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-3">
          <h3 className="text-sm font-bold flex items-center justify-between">
            <span>By Build Tier (Demo-First Sequencing)</span>
            <span className="text-xs font-mono opacity-50">T1 → T4</span>
          </h3>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-800 dark:text-emerald-200">T1: Fast Visual Wins</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">{summaryStats.t1}</span>
              </div>
              <span className="text-[10px] opacity-70 block mt-0.5">Marketing, Auth &amp; Views</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-800 dark:text-blue-200">T2: Payments &amp; Verify</span>
                <span className="font-extrabold text-blue-700 dark:text-blue-300 text-sm">{summaryStats.t2}</span>
              </div>
              <span className="text-[10px] opacity-70 block mt-0.5">Stripe, Licenses, Payouts</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-800 dark:text-purple-200">T3: Dashboards &amp; Admin</span>
                <span className="font-extrabold text-purple-700 dark:text-purple-300 text-sm">{summaryStats.t3}</span>
              </div>
              <span className="text-[10px] opacity-70 block mt-0.5">Nurse/Host hubs, Analytics</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-800 dark:text-amber-200">T4: Mobile &amp; Infra</span>
                <span className="font-extrabold text-amber-700 dark:text-amber-300 text-sm">{summaryStats.t4}</span>
              </div>
              <span className="text-[10px] opacity-70 block mt-0.5">Flutter parity, Error pages</span>
            </div>
          </div>
        </div>
      </div>

      {/* How to use with Design System & Column Key */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* How to Use with the Design System */}
        <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-6 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#005684] dark:text-[#93ccff]">
            <span className="material-symbols-outlined text-[20px]">architecture</span>
            <h4>How to Use with the Design System</h4>
          </div>
          <ol className="text-xs space-y-3 opacity-90 leading-relaxed list-decimal list-inside">
            <li>
              <strong>Pick a milestone's rows</strong> from the 'Screen Inventory' master table.
            </li>
            <li>
              <strong>Fill the Appendix B prompt template</strong> in the design system doc using the Purpose, Key components, and States columns.
            </li>
            <li>
              <strong>Generate in Google Stitch</strong>, export into one Figma file, and group Figma pages in the ID order used here.
            </li>
            <li>
              <strong>Track design and build progress</strong> by adding custom status tracking columns to the sheet.
            </li>
          </ol>
        </div>

        {/* Column Key Reference */}
        <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-6 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-[#005684] dark:text-[#93ccff]">
            <span className="material-symbols-outlined text-[20px]">table_chart</span>
            <h4>Column Key Definitions</h4>
          </div>
          <div className="space-y-2 opacity-90 leading-relaxed">
            <div>
              <strong>Milestone:</strong> M1 = Foundation &amp; Core Marketplace · M2 = Dashboards, Trust &amp; Communication · M3 = Mobile Apps, Testing &amp; Launch
            </div>
            <div>
              <strong>Build tier:</strong> Demo-first sequencing. T1 = fast visual wins · T2 = payments &amp; verification · T3 = dashboards &amp; admin · T4 = mobile &amp; infrastructure
            </div>
            <div>
              <strong>Platform:</strong> Web = responsive web app · Mobile = Flutter iOS/Android · Both = needs a design at each width
            </div>
            <div>
              <strong>Priority:</strong> Must = launch blocker · Should = expected at launch but degradable · Could = in scope, include if effort allows
            </div>
            <div>
              <strong>Flags:</strong> Rows marked PENDING depend on a client decision or the North Carolina attorney review and cannot be finalised until that lands.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
