import React from 'react';

interface NurseDashboardSkeletonProps {
  activeTab?: 'current' | 'profile' | 'saved' | 'verification' | 'messages' | 'receipts';
  isNightShiftMode?: boolean;
  onlyContent?: boolean;
}

export const NurseDashboardSkeleton: React.FC<NurseDashboardSkeletonProps> = ({
  activeTab = 'current',
  isNightShiftMode = false,
  onlyContent = false,
}) => {
  return (
    <div className="w-full space-y-8 animate-fadeIn" role="status" aria-label="Loading clinician dashboard data">
      {/* Clinician Identity Banner Skeleton (only if not restricted to tab content) */}
      {!onlyContent && (
        <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Avatar Skeleton */}
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer shrink-0" />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-6 w-52 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                  <div className="h-5 w-36 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                </div>
                <div className="h-4 w-72 sm:w-96 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-36 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              <div className="h-9 w-36 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>
          </div>

          {/* Quick Metric Ribbon Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#f2f3ff] dark:bg-[#14233a] border border-[rgba(11,37,89,0.04)] dark:border-[#233550]/60"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-300/80 dark:bg-[#1e304b] skeleton-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-20 rounded bg-slate-300/80 dark:bg-[#1e304b] skeleton-shimmer" />
                  <div className="h-3 w-28 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Specific Content Skeleton */}
      {activeTab === 'current' && (
        <div className="space-y-8">
          {/* Active Stay Hero Card Skeleton */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            {/* Header Strip Skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-[#1e304b]" />
                <div className="h-4 w-36 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                <div className="h-6 w-36 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              </div>
              <div className="h-6 w-44 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Photo Skeleton */}
              <div className="lg:col-span-5 rounded-2xl aspect-[4/3] bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />

              {/* Info & Host Skeleton */}
              <div className="lg:col-span-7 flex flex-col justify-between h-full gap-5">
                <div className="space-y-3">
                  <div className="h-3.5 w-48 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                  <div className="h-6 w-4/5 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                  <div className="h-4 w-60 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />

                  {/* Host Quick Strip Skeleton */}
                  <div className="p-3.5 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-28 rounded bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                        <div className="h-3 w-36 rounded bg-slate-200 dark:bg-[#1e304b] skeleton-shimmer" />
                      </div>
                    </div>
                    <div className="h-8 w-24 rounded-lg bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                  </div>
                </div>

                {/* Keyless Smartlock Credentials Skeleton */}
                <div className="p-4 rounded-2xl bg-[#eaedff]/60 dark:bg-[#15233a] border border-[#005684]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-52 rounded bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                    <div className="h-5 w-32 rounded-full bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="h-16 rounded-xl bg-white dark:bg-[#111e33] skeleton-shimmer" />
                    <div className="h-16 rounded-xl bg-white dark:bg-[#111e33] skeleton-shimmer" />
                  </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-32 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                    <div className="h-9 w-24 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                  </div>
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Stays Card Skeleton */}
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex items-center justify-between mb-5">
              <div className="h-5 w-44 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>
            <div className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-300 dark:bg-[#233550] skeleton-shimmer shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded-full bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                  <div className="h-4 w-60 rounded bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                  <div className="h-3 w-48 rounded bg-slate-200 dark:bg-[#1e304b] skeleton-shimmer" />
                </div>
              </div>
              <div className="h-9 w-28 rounded-full bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Saved Pillows Skeleton */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="h-6 w-48 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              <div className="h-3.5 w-64 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>
            <div className="h-8 w-28 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#0B1626] rounded-3xl p-5 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="rounded-2xl aspect-video bg-slate-200 dark:bg-[#182840] skeleton-shimmer mb-3" />
                  <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer mb-2" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                </div>
                <div className="pt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center justify-between">
                  <div className="h-5 w-24 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                  <div className="h-8 w-24 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Profile Skeleton */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <div className="space-y-1">
                <div className="h-3 w-40 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                <div className="h-6 w-64 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              </div>
              <div className="h-6 w-36 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>

            {/* Trust Breakdown Card Skeleton */}
            <div className="h-44 rounded-2xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />

            {/* 4 Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-[#f2f3ff] dark:bg-[#14233a] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] space-y-3"
                >
                  <div className="h-4 w-44 rounded bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                  <div className="space-y-2">
                    <div className="h-3 w-28 rounded bg-slate-200 dark:bg-[#1e304b] skeleton-shimmer" />
                    <div className="h-4 w-52 rounded bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-32 rounded bg-slate-200 dark:bg-[#1e304b] skeleton-shimmer" />
                    <div className="h-4 w-40 rounded bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Verification Skeleton */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
              <div className="space-y-1">
                <div className="h-3 w-36 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                <div className="h-6 w-60 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              </div>
              <div className="h-6 w-36 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>

            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-40 rounded bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                      <div className="h-3 w-28 rounded bg-slate-200 dark:bg-[#1e304b] skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="h-6 w-16 rounded-full bg-slate-300 dark:bg-[#233550] skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Messages Skeleton */}
      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              <div className="space-y-1">
                <div className="h-4 w-36 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                <div className="h-3 w-48 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              </div>
            </div>
            <div className="h-4 w-14 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>

          <div className="flex-1 py-4 space-y-4">
            <div className="mr-auto w-2/3 h-14 rounded-2xl rounded-bl-none bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="ml-auto w-3/4 h-16 rounded-2xl rounded-br-none bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="mr-auto w-1/2 h-12 rounded-2xl rounded-bl-none bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>

          <div className="pt-3 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex items-center gap-2">
            <div className="flex-1 h-10 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="w-20 h-10 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>
        </div>
      )}

      {/* Tab: Receipts Skeleton */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0B1626] rounded-3xl p-6 sm:p-8 shadow-sm border border-[rgba(11,37,89,0.08)] dark:border-[#233550] space-y-5">
            <div className="flex items-center justify-between pb-2">
              <div className="space-y-1">
                <div className="h-6 w-52 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
                <div className="h-3 w-64 rounded bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              </div>
              <div className="h-8 w-32 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>

            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />

            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] skeleton-shimmer" />
              <div className="h-16 rounded-2xl bg-[#f2f3ff] dark:bg-[#182840] skeleton-shimmer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
