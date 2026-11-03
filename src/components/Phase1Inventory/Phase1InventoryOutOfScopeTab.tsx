import React from 'react';
import { OUT_OF_PHASE_1_ITEMS } from '../../data/phase1InventoryData';

export const Phase1InventoryOutOfScopeTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Pre-Approval Blocker & Confirmation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">check_circle</span>
            <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
              Feature Specifications &amp; Policy Alignment: Confirmed
            </h4>
          </div>
          <ul className="text-xs space-y-1.5 text-emerald-900/90 dark:text-emerald-100/90 leading-relaxed">
            <li>
              <strong>Feature Definitions:</strong> Roommate Matching, Assignment Confirmed badges, Gap Vacancy Filler, and Host Lead Profiles have been explicitly categorized as <em>optional After-Scope Roadmap items</em>.
            </li>
            <li>
              <strong>Cancellation &amp; Refund Tiers:</strong> Confirmed exact day-thresholds: Flexible (100% 30+d, 50% 14–29d, 0% &lt;14d), Moderate (100% 60+d, 50% 30–59d, 0% &lt;30d), Strict (100% 90+d, 50% 60–89d, 0% &lt;60d). Cleaning fee 100% refunded if never checked in.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">pause_circle</span>
            <h4 className="font-bold text-sm text-amber-800 dark:text-amber-200">
              Statutory Lodging Compliance &amp; Review
            </h4>
          </div>
          <p className="text-xs text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
            Platform terms incorporate North Carolina Real Estate Commission (NCREC) tenancy exemption frameworks and county occupancy tax rules for 30+ day clinical placements.
          </p>
          <div className="text-[11px] font-semibold bg-amber-500/20 px-2.5 py-1 rounded-lg text-amber-800 dark:text-amber-200">
            Payment &amp; verification live sandbox active: all transactions run securely with real-time audit logging.
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
        <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[24px] shrink-0 mt-0.5">
          shield_with_heart
        </span>
        <div>
          <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">
            Phase 1 Inventory Section 7: Standing Rule on Out-of-Scope Items
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
            <strong>Standing Rule:</strong> Anything from this table that the client asks for gets flagged, priced, and signed off in writing before a single screen is designed for it. These are deliberately excluded from Phase 1.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B1626] rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/5 dark:bg-white/5 font-bold uppercase tracking-wider text-[10px] opacity-70 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
              <tr>
                <th className="p-4">Deferred Feature / Item</th>
                <th className="p-4">Phase / Classification</th>
                <th className="p-4">Scope Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(11,37,89,0.06)] dark:divide-[#233550]">
              {OUT_OF_PHASE_1_ITEMS.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-colors">
                  <td className="p-4 font-bold text-sm text-[#001848] dark:text-[#E6ECF7]">
                    {item.item}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.phase === 'Phase 2'
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-500/10 text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.phase}
                    </span>
                  </td>
                  <td className="p-4 opacity-80 leading-relaxed">
                    {item.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
