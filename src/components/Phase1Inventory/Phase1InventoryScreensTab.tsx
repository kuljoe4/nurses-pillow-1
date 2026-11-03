import React, { useState, useMemo, useEffect } from 'react';
import { InventoryScreen, PHASE_1_SCREENS, getScreenBuildTier } from '../../data/phase1InventoryData';
import { NavigationTab } from '../../types';

interface Phase1InventoryScreensTabProps {
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenSupport: () => void;
  onOpenAuthModal?: () => void;
  setSelectedScreenForDetail: (screen: InventoryScreen | null) => void;
}

export const Phase1InventoryScreensTab: React.FC<Phase1InventoryScreensTabProps> = ({
  onNavigateTab,
  onOpenSupport,
  onOpenAuthModal,
  setSelectedScreenForDetail,
}) => {
  const [screenSearch, setScreenSearch] = useState('');
  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'M1' | 'M2' | 'M3'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Must' | 'Should' | 'Could'>('all');
  const [buildTierFilter, setBuildTierFilter] = useState<'all' | 'T1' | 'T2' | 'T3' | 'T4'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', 'Public, Marketing & Legal', 'Authentication', 'Nurse (Traveler)', 'Shared', 'Host', 'Admin / Operations', 'Mobile Apps'];

  const filteredScreens = useMemo(() => {
    return PHASE_1_SCREENS.filter((s) => {
      if (milestoneFilter !== 'all' && s.milestone !== milestoneFilter) return false;
      if (priorityFilter !== 'all' && s.priority !== priorityFilter) return false;
      if (buildTierFilter !== 'all' && getScreenBuildTier(s) !== buildTierFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (screenSearch.trim()) {
        const query = screenSearch.toLowerCase();
        return (
          s.id.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [milestoneFilter, priorityFilter, buildTierFilter, categoryFilter, screenSearch]);

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
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#0B1626] p-4 rounded-2xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by ID (e.g. NS-01, P-07), name or keyword..."
              value={screenSearch}
              onChange={(e) => setScreenSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[rgba(11,37,89,0.15)] dark:border-[#233550] bg-transparent focus:outline-none focus:border-[#005684]"
            />
          </div>

          {/* Counts & Clear */}
          <div className="flex items-center gap-2 text-xs opacity-80 self-end sm:self-auto">
            <span>Showing <strong>{filteredScreens.length}</strong> of 150 screens</span>
            {(screenSearch || milestoneFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setScreenSearch('');
                  setMilestoneFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-[#005684] dark:text-[#93ccff] font-bold hover:underline ml-2"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="opacity-60 font-semibold">Milestone:</span>
            {(['all', 'M1', 'M2', 'M3'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMilestoneFilter(m)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-200 ease-in-out ${
                  milestoneFilter === m
                    ? 'bg-[#005684] text-white'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {m === 'all' ? 'All' : m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="opacity-60 font-semibold">Priority:</span>
            {(['all', 'Must', 'Should', 'Could'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-200 ease-in-out ${
                  priorityFilter === p
                    ? 'bg-[#005684] text-white'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="opacity-60 font-semibold">Build Tier:</span>
            {(['all', 'T1', 'T2', 'T3', 'T4'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setBuildTierFilter(t)}
                title={
                  t === 'T1'
                    ? 'T1: Fast visual wins'
                    : t === 'T2'
                    ? 'T2: Payments & verification'
                    : t === 'T3'
                    ? 'T3: Dashboards & admin'
                    : t === 'T4'
                    ? 'T4: Mobile & infrastructure'
                    : 'All Tiers'
                }
                className={`px-2 py-1 rounded-lg font-bold transition-all duration-200 ease-in-out ${
                  buildTierFilter === t
                    ? 'bg-[#005684] text-white'
                    : 'bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="opacity-60 font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border-none font-semibold text-xs focus:outline-none dark:bg-[#0B1626]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Areas' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScreens.map((screen) => {
          const tier = getScreenBuildTier(screen);
          return (
            <div
              key={screen.id}
              className="bg-white dark:bg-[#0B1626] rounded-2xl p-5 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm flex flex-col justify-between hover:border-[#005684]/40 transition-all duration-200 ease-in-out group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#005684]/10 text-[#005684] dark:text-[#93ccff]">
                    {screen.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      screen.milestone === 'M1'
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : screen.milestone === 'M2'
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                        : 'bg-teal-500/10 text-teal-700 dark:text-teal-300'
                    }`}>
                      {screen.milestone}
                    </span>
                    <span
                      title={
                        tier === 'T1'
                          ? 'T1: Fast visual wins'
                          : tier === 'T2'
                          ? 'T2: Payments & verification'
                          : tier === 'T3'
                          ? 'T3: Dashboards & admin'
                          : 'T4: Mobile & infrastructure'
                      }
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200"
                    >
                      {tier}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      screen.priority === 'Must'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : screen.priority === 'Should'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-500/10 text-gray-700 dark:text-gray-300'
                    }`}>
                      {screen.priority}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold mb-1 group-hover:text-[#005684] focus-visible:text-[#005684] dark:group-hover:text-[#93ccff] focus-visible:text-[#93ccff] transition-colors">
                  {screen.name}
                </h3>
                <div className="text-[11px] opacity-60 mb-2 font-semibold">
                  {screen.category} • Role: {screen.role} • {screen.platform}
                </div>
                <p className="text-xs opacity-80 leading-relaxed mb-4">
                  {screen.description}
                </p>

                {screen.flag && (
                  <div className="text-[10px] font-bold px-2 py-1 rounded bg-black/5 dark:bg-white/5 mb-3 inline-block">
                    Flag: {screen.flag}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]/60 flex items-center justify-between">
                <span className="text-[11px] opacity-60 font-mono">
                  {screen.appTab ? `Tab: ${screen.appTab}` : 'Interactive View'}
                </span>
                <button
                  onClick={() => handleJumpToScreen(screen)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#005684] text-white text-xs font-bold hover:bg-[#00476d] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#00476d] transition-all duration-200 ease-in-out shadow-sm"
                >
                  <span>Open Screen</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
