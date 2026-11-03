import React from 'react';
import { DECISION_BLOCKED_ITEMS } from '../../data/phase1InventoryData';
import { NavigationTab } from '../../types';

interface Phase1InventoryBlockedTabProps {
  onNavigateTab: (tab: NavigationTab) => void;
}

export const Phase1InventoryBlockedTab: React.FC<Phase1InventoryBlockedTabProps> = ({
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-700 dark:text-amber-300 text-[24px] shrink-0 mt-0.5">
          pending_actions
        </span>
        <div>
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">
            Phase 1 Inventory Section 5: Items Still Blocked on a Decision
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
            These screens are fully designed and functional with statutory compliance elements actively aligned with North Carolina lodging tax rules and clinical lodging exemptions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DECISION_BLOCKED_ITEMS.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#0B1626] rounded-2xl p-6 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200">
                {item.id}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Awaiting Attorney Signoff
              </span>
            </div>

            <div>
              <h4 className="text-lg font-bold">{item.screen}</h4>
              <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                Blocked on: {item.blockedOn}
              </div>
            </div>

            <p className="text-xs opacity-80 leading-relaxed">
              Status: {item.status}
            </p>

            <div className="pt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex justify-between items-center">
              <span className="text-[11px] opacity-60">{item.scopeNote}</span>
              <button
                onClick={() => onNavigateTab('legal-policies')}
                className="px-3 py-1.5 rounded-lg bg-[#005684] text-white text-xs font-bold hover:bg-[#00476d] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#00476d]"
              >
                View Pending Legal Screen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
