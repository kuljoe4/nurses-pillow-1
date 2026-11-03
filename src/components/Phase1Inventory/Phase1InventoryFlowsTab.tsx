import React, { useState } from 'react';
import { PHASE_1_FLOWS, PHASE_1_SCREENS, InventoryScreen } from '../../data/phase1InventoryData';
import { NavigationTab } from '../../types';

interface Phase1InventoryFlowsTabProps {
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenSupport: () => void;
  onOpenAuthModal?: () => void;
  setSelectedScreenForDetail: (screen: InventoryScreen | null) => void;
}

export const Phase1InventoryFlowsTab: React.FC<Phase1InventoryFlowsTabProps> = ({
  onNavigateTab,
  onOpenSupport,
  onOpenAuthModal,
  setSelectedScreenForDetail,
}) => {
  const [selectedFlow, setSelectedFlow] = useState(PHASE_1_FLOWS[0]);
  const [flowCurrentStepIndex, setFlowCurrentStepIndex] = useState(0);

  const handleJumpToScreen = (screen: InventoryScreen) => {
    if (screen.appTab === 'auth') {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    if (screen.appTab === 'nurse-support') {
      onOpenSupport();
      return;
    }
    if (screen.appTab) {
      onNavigateTab(screen.appTab as NavigationTab);
    } else {
      setSelectedScreenForDetail(screen);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Flow Selector Column */}
      <div className="lg:col-span-4 space-y-2 max-h-[700px] overflow-y-auto pr-1">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
          Phase 1 Flows ({PHASE_1_FLOWS.length} Total)
        </h3>
        {PHASE_1_FLOWS.map((flow) => (
          <button
            key={flow.id}
            onClick={() => {
              setSelectedFlow(flow);
              setFlowCurrentStepIndex(0);
            }}
            className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ease-in-out flex flex-col gap-1 ${
              selectedFlow.id === flow.id
                ? 'bg-[#005684] text-white border-[#005684] shadow-md'
                : 'bg-white dark:bg-[#0B1626] border-[rgba(11,37,89,0.08)] dark:border-[#233550] hover:border-[#005684]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                selectedFlow.id === flow.id ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5'
              }`}>
                {flow.id}
              </span>
              <span className="text-[10px] opacity-80">{flow.milestone} • {flow.role}</span>
            </div>
            <div className="text-sm font-extrabold">{flow.name}</div>
            <div className="text-[11px] opacity-80 font-normal line-clamp-1">
              Trigger: {flow.trigger}
            </div>
          </button>
        ))}
      </div>

      {/* Flow Interactive Walkthrough Workspace */}
      <div className="lg:col-span-8 bg-white dark:bg-[#0B1626] p-6 sm:p-8 rounded-3xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#005684]/15 text-[#005684] dark:text-[#93ccff]">
                {selectedFlow.id}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                {selectedFlow.milestone} Deliverable
              </span>
              <span className="text-xs font-bold opacity-70">Role: {selectedFlow.role}</span>
            </div>
            <h2 className="text-2xl font-black">{selectedFlow.name}</h2>
          </div>
        </div>

        {/* Trigger & Ending */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">
              Trigger Initiator
            </div>
            <div className="text-xs font-semibold leading-relaxed">
              {selectedFlow.trigger}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-200 mb-1">
              Journey Ending
            </div>
            <div className="text-xs font-semibold leading-relaxed text-emerald-900 dark:text-emerald-100">
              {selectedFlow.ending}
            </div>
          </div>
        </div>

        {/* Step Sequence Bar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">
              Step-by-Step Screen Sequence ({selectedFlow.steps.length} Steps)
            </span>
            <span className="text-xs font-mono opacity-80">
              Active Step: {flowCurrentStepIndex + 1} of {selectedFlow.steps.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center p-3 rounded-2xl bg-black/5 dark:bg-white/5">
            {selectedFlow.steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setFlowCurrentStepIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 ease-in-out flex items-center gap-1 ${
                  flowCurrentStepIndex === idx
                    ? 'bg-[#005684] text-white shadow-sm'
                    : 'bg-white dark:bg-[#0B1626] border border-[rgba(11,37,89,0.1)] dark:border-[#233550] opacity-80 hover:opacity-100'
                }`}
              >
                <span>{step}</span>
                {idx < selectedFlow.steps.length - 1 && (
                  <span className="text-gray-400 font-sans ml-1">→</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Active Step Interactive Card */}
        <div className="p-6 rounded-2xl border border-[#005684]/30 bg-[#EFF6FB]/50 dark:bg-[#08101C] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#005684] dark:text-[#93ccff]">
                Step {flowCurrentStepIndex + 1} Details
              </span>
              <h4 className="text-lg font-black font-mono">
                Screen ID: {selectedFlow.steps[flowCurrentStepIndex]}
              </h4>
            </div>
            <button
              onClick={() => {
                const stepId = selectedFlow.steps[flowCurrentStepIndex].replace('..', '').split('/')[0];
                const matchedScreen = PHASE_1_SCREENS.find((s) => s.id === stepId);
                if (matchedScreen) {
                  handleJumpToScreen(matchedScreen);
                }
              }}
              className="px-4 py-2 bg-[#005684] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00476d] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#00476d] transition-all duration-200 ease-in-out flex items-center gap-1.5"
            >
              <span>Launch Screen Live</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </button>
          </div>

          <div className="text-xs opacity-80 leading-relaxed">
            {selectedFlow.notes}
          </div>

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={flowCurrentStepIndex === 0}
              onClick={() => setFlowCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-black/10 dark:border-white/10 disabled:opacity-30"
            >
              ← Previous Step
            </button>
            <button
              disabled={flowCurrentStepIndex === selectedFlow.steps.length - 1}
              onClick={() => setFlowCurrentStepIndex((prev) => Math.min(selectedFlow.steps.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#005684] text-white disabled:opacity-30"
            >
              Next Step in Flow →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
