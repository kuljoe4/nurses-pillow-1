import React, { useState, useEffect } from 'react';
import { InventoryScreen } from '../data/phase1InventoryData';
import { NavigationTab } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

import {
  Phase1InventoryScreensTab,
  Phase1InventoryFlowsTab,
  Phase1InventoryNotificationsTab,
  Phase1InventoryStatesTab,
  Phase1InventorySummaryTab,
  Phase1InventoryBlockedTab,
  Phase1InventoryOutOfScopeTab,
} from './Phase1Inventory';

interface Phase1InventoryViewProps {
  isNightShiftMode: boolean;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenSupport: () => void;
  onOpenAuthModal?: () => void;
}

export const Phase1InventoryView: React.FC<Phase1InventoryViewProps> = ({
  isNightShiftMode,
  onNavigateTab,
  onOpenSupport,
  onOpenAuthModal,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'screens' | 'flows' | 'notifications' | 'states' | 'summary' | 'blocked' | 'out-of-scope'>('screens');

  // Lifted state for the selected screen detail modal, so it can be opened from multiple tabs
  const [selectedScreenForDetail, setSelectedScreenForDetail] = useState<InventoryScreen | null>(null);
  useBodyScrollLock(!!selectedScreenForDetail);

  // Close detail modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedScreenForDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`w-full py-8 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto transition-colors ${
      isNightShiftMode ? 'text-[#E6ECF7]' : 'text-[#001848]'
    }`}>
      {/* Top Banner / Hero */}
      <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#005684]/15 text-[#005684] dark:text-[#93ccff]">
                PHASE 1 CONTRACT DELIVERABLE ($2,500 SIGNED SCOPE)
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                119 Launch Blockers Audited
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">code</span>
                Internal Developer Reference
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Nurses Pillow — Phase 1 Master Inventory &amp; Flow Navigator
            </h1>
            <p className="text-sm opacity-80 mt-1 max-w-2xl leading-relaxed">
              Companion to the Design System. Complete internal reference indexing <strong>150 screens &amp; pages</strong>, <strong>19 end-to-end flows</strong>, <strong>25 notification templates</strong>, and <strong>11 cross-cutting state patterns</strong>.
            </p>
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#eaedff]/60 dark:bg-[#15233a] border border-[#005684]/20 text-[11px] text-[#005684] dark:text-[#93ccff] inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">info</span>
              <span><strong>Platform Architecture:</strong> Comprehensive index of production screens, clinical verification states, and automated hospital assignment routing.</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#005684]/5 dark:bg-[#005684]/15 border border-[#005684]/20 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#005684] dark:text-[#93ccff]">150</div>
              <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Total Screens</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/15 border border-emerald-500/20 text-center">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">19</div>
              <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">E2E Flows</div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/15 border border-blue-500/20 text-center">
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">25</div>
              <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Templates</div>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/5 dark:bg-purple-500/15 border border-purple-500/20 text-center">
              <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">11</div>
              <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider">State Patterns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
        <button
          onClick={() => setActiveMainTab('screens')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-2 ${
            activeMainTab === 'screens'
              ? 'bg-[#005684] text-white shadow-md'
              : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100 hover:bg-[#EFF6FB] dark:hover:bg-[#182840]/10 dark:hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          <span>1. Screen Inventory (150)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('flows')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-2 ${
            activeMainTab === 'flows'
              ? 'bg-[#005684] text-white shadow-md'
              : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100 hover:bg-[#EFF6FB] dark:hover:bg-[#182840]/10 dark:hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          <span>2. End-to-End Flows (19)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('notifications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-2 ${
            activeMainTab === 'notifications'
              ? 'bg-[#005684] text-white shadow-md'
              : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100 hover:bg-[#EFF6FB] dark:hover:bg-[#182840]/10 dark:hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          <span>3. Notifications (25)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('states')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-2 ${
            activeMainTab === 'states'
              ? 'bg-[#005684] text-white shadow-md'
              : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100 hover:bg-[#EFF6FB] dark:hover:bg-[#182840]/10 dark:hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">design_services</span>
          <span>4. State Patterns (11)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('summary')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-2 ${
            activeMainTab === 'summary'
              ? 'bg-[#005684] text-white shadow-md'
              : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100 hover:bg-[#EFF6FB] dark:hover:bg-[#182840]/10 dark:hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">query_stats</span>
          <span>Executive Summary</span>
        </button>

        <div className="w-px h-8 bg-[rgba(11,37,89,0.1)] dark:bg-[#233550] mx-2 self-center shrink-0"></div>

        <button
          onClick={() => setActiveMainTab('blocked')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-2 ${
            activeMainTab === 'blocked'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 opacity-80 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          <span>5. Legal Blockers</span>
        </button>

        <button
          onClick={() => setActiveMainTab('out-of-scope')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ease-in-out flex items-center gap-2 ${
            activeMainTab === 'out-of-scope'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 opacity-80 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">block</span>
          <span>6. Out of Scope</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeMainTab === 'screens' && (
        <Phase1InventoryScreensTab
          onNavigateTab={onNavigateTab}
          onOpenSupport={onOpenSupport}
          onOpenAuthModal={onOpenAuthModal}
          setSelectedScreenForDetail={setSelectedScreenForDetail}
        />
      )}

      {activeMainTab === 'flows' && (
        <Phase1InventoryFlowsTab
          onNavigateTab={onNavigateTab}
          onOpenSupport={onOpenSupport}
          onOpenAuthModal={onOpenAuthModal}
          setSelectedScreenForDetail={setSelectedScreenForDetail}
        />
      )}

      {activeMainTab === 'notifications' && (
        <Phase1InventoryNotificationsTab />
      )}

      {activeMainTab === 'states' && (
        <Phase1InventoryStatesTab
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeMainTab === 'summary' && (
        <Phase1InventorySummaryTab />
      )}

      {activeMainTab === 'blocked' && (
        <Phase1InventoryBlockedTab
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeMainTab === 'out-of-scope' && (
        <Phase1InventoryOutOfScopeTab />
      )}

      {/* Modal for detailed screen preview if requested */}
      {selectedScreenForDetail && (
        <div
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 pt-16 sm:pt-20 flex justify-center items-start"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedScreenForDetail(null);
            }
          }}
        >
          <div
            className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-lg w-full my-auto p-6 shadow-lg border border-black/10 dark:border-white/10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-[#005684]/15 text-[#005684] dark:text-[#93ccff]">
                SCREEN [{selectedScreenForDetail.id}]
              </span>
              <button
                onClick={() => setSelectedScreenForDetail(null)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-sm font-bold"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <h3 className="text-xl font-bold">{selectedScreenForDetail.name}</h3>
            <div className="text-xs opacity-70">
              Role: {selectedScreenForDetail.role} • Milestone: {selectedScreenForDetail.milestone} • Priority: {selectedScreenForDetail.priority}
            </div>

            <p className="text-sm opacity-90 leading-relaxed">
              {selectedScreenForDetail.description}
            </p>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 text-xs space-y-1">
              <div className="font-bold">Technical Mapping:</div>
              <div>Platform: {selectedScreenForDetail.platform}</div>
              <div>Target Route / Tab: {selectedScreenForDetail.appTab || 'Direct Dynamic Component'}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedScreenForDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10"
              >
                Close
              </button>
              {selectedScreenForDetail.appTab && (
                <button
                  onClick={() => {
                    const tab = selectedScreenForDetail.appTab;
                    setSelectedScreenForDetail(null);
                    if (tab) onNavigateTab(tab as NavigationTab);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#005684] text-white text-xs font-bold"
                >
                  Navigate to View
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
