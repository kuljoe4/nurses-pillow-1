import React, { useState } from 'react';
import { CROSS_CUTTING_STATES } from '../../data/phase1InventoryData';
import { NavigationTab } from '../../types';

interface Phase1InventoryStatesTabProps {
  onNavigateTab: (tab: NavigationTab) => void;
}

export const Phase1InventoryStatesTab: React.FC<Phase1InventoryStatesTabProps> = ({
  onNavigateTab,
}) => {
  const [activeStateDemo, setActiveStateDemo] = useState<string>('STATE-04');
  const [demoButtonLoading, setDemoButtonLoading] = useState(false);
  const [demoInlineError] = useState('Please enter a valid unencumbered state license number');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* States List Sidebar */}
      <div className="lg:col-span-4 space-y-2 max-h-[700px] overflow-y-auto pr-1">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
          Cross-Cutting UI States ({CROSS_CUTTING_STATES.length})
        </h3>
        {CROSS_CUTTING_STATES.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveStateDemo(st.id)}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all duration-200 ease-in-out flex items-center justify-between ${
              activeStateDemo === st.id
                ? 'bg-[#005684] text-white border-[#005684] shadow-md'
                : 'bg-white dark:bg-[#0B1626] border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:border-[#005684]/40'
            }`}
          >
            <span className="font-mono text-[10px] mr-1 opacity-75">{st.id}</span>
            <span>{st.state}</span>
          </button>
        ))}
      </div>

      {/* Active Demo Canvas */}
      <div className="lg:col-span-8 bg-white dark:bg-[#0B1626] p-8 rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm">
        {/* Pattern Rule Banner */}
        {(() => {
          const currentPattern = CROSS_CUTTING_STATES.find((s) => s.id === activeStateDemo)!;
          return (
            <div className="mb-6 pb-4 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#005684]/15 text-[#005684] dark:text-[#93ccff]">
                    {currentPattern.id}
                  </span>
                  <h3 className="text-lg font-black">{currentPattern.state}</h3>
                </div>
                <p className="text-xs opacity-70">{currentPattern.treatment}</p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold self-start sm:self-auto">
                Design Rule: {currentPattern.rule}
              </div>
            </div>
          );
        })()}

        {/* Renderings */}
        <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 min-h-[220px] flex items-center justify-center">
          {/* STATE-01: Skeleton */}
          {activeStateDemo === 'STATE-01' && (
            <div className="w-full max-w-lg space-y-3">
              <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-lg" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-28 bg-gray-300 dark:bg-gray-700 rounded-xl" />
                <div className="h-28 bg-gray-300 dark:bg-gray-700 rounded-xl" />
                <div className="h-28 bg-gray-300 dark:bg-gray-700 rounded-xl" />
              </div>
              <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-700 rounded-lg" />
            </div>
          )}

          {/* STATE-02: In-button loading */}
          {activeStateDemo === 'STATE-02' && (
            <div className="text-center space-y-3">
              <button
                onClick={() => {
                  setDemoButtonLoading(true);
                  setTimeout(() => setDemoButtonLoading(false), 2000);
                }}
                className="w-48 py-3 px-6 rounded-xl bg-[#005684] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 mx-auto transition-all duration-200 ease-in-out"
              >
                {demoButtonLoading ? (
                  <>
                    <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <span>Capture Payment ($2,800)</span>
                )}
              </button>
              <p className="text-[11px] opacity-60">Click button to preview spinner replacing label with locked width</p>
            </div>
          )}

          {/* STATE-03: Empty no data yet */}
          {activeStateDemo === 'STATE-03' && (
            <div className="text-center py-6 max-w-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#005684]/10 text-[#005684] dark:text-[#93ccff] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">favorite_border</span>
              </div>
              <h4 className="text-sm font-bold">No Saved Pillows Yet</h4>
              <p className="text-xs opacity-70">
                Tap the heart icon on any listing near your hospital to save it for side-by-side contract comparison.
              </p>
              <button
                onClick={() => onNavigateTab('find-housing')}
                className="px-4 py-2 rounded-xl bg-[#005684] text-white text-xs font-bold"
              >
                Explore Sanctuaries
              </button>
            </div>
          )}

          {/* STATE-04: Empty filters widen */}
          {activeStateDemo === 'STATE-04' && (
            <div className="text-center py-6 max-w-md space-y-3">
              <div className="text-sm font-bold">No rooms within 5 miles of Duke University Hospital.</div>
              <p className="text-xs opacity-70">
                Your daytime blackout and pet-friendly filters narrowed all results in this radius.
              </p>
              <button
                onClick={() => onNavigateTab('search-listings')}
                className="px-5 py-2.5 rounded-xl bg-[#005684] text-white text-xs font-bold flex items-center gap-1.5 mx-auto shadow-sm"
              >
                <span>Try 10 miles radius</span>
                <span className="material-symbols-outlined text-[16px]">expand</span>
              </button>
            </div>
          )}

          {/* STATE-06: Inline error */}
          {activeStateDemo === 'STATE-06' && (
            <div className="w-full max-w-sm space-y-2">
              <label className="text-xs font-bold block">California RN Board License Number</label>
              <input
                type="text"
                defaultValue="RN-INV-99"
                className="w-full p-2.5 rounded-xl border border-rose-500 bg-rose-500/5 text-xs font-semibold focus:outline-none"
              />
              <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>{demoInlineError}</span>
              </div>
            </div>
          )}

          {/* STATE-09: Permission / Access Denied */}
          {activeStateDemo === 'STATE-09' && (
            <div className="text-center py-6 max-w-sm space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[30px]">lock</span>
              </div>
              <h4 className="text-sm font-bold">Clinical Credentialing Required to Book</h4>
              <p className="text-xs opacity-70">
                To maintain safe, quiet sanctuaries for healthcare workers, verified RN license or hospital contract is required prior to checkout.
              </p>
              <button
                onClick={() => onNavigateTab('verification')}
                className="px-4 py-2 bg-[#005684] text-white rounded-xl text-xs font-bold"
              >
                Complete 2-Minute Verification
              </button>
            </div>
          )}

          {/* STATE-10: Offline */}
          {activeStateDemo === 'STATE-10' && (
            <div className="w-full max-w-md p-3.5 rounded-2xl bg-[#001848] text-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[20px]">cloud_off</span>
                <div>
                  <div className="font-bold">Offline Mode Active</div>
                  <div className="text-[10px] opacity-75">Displaying cached door code (*4821#)</div>
                </div>
              </div>
              <button className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white/30">
                Retry Connection
              </button>
            </div>
          )}

          {/* STATE-11: Pending Value */}
          {activeStateDemo === 'STATE-11' && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0B1626] border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">Clinician License Number:</span>
                <span className="font-mono font-bold">RN-284910-NC</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Nursys Board Multi-State Status:</span>
                <span className="italic text-gray-500 dark:text-gray-400">Pending review</span>
              </div>
            </div>
          )}

          {/* Remaining patterns */}
          {!['STATE-01', 'STATE-02', 'STATE-03', 'STATE-04', 'STATE-06', 'STATE-09', 'STATE-10', 'STATE-11'].includes(activeStateDemo) && (
            <div className="text-center py-6 max-w-sm space-y-2">
              <div className="text-xs font-mono font-bold text-[#005684]">{activeStateDemo}</div>
              <div className="text-sm font-bold">State Treatment Live in System</div>
              <p className="text-xs opacity-70">
                This cross-cutting state pattern is globally applied across all Phase 1 views.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
