import React from 'react';
import { ListingCardSkeleton } from './ListingCardSkeleton';

interface SearchListingsSkeletonProps {
  viewMode?: 'split-map' | 'grid';
  isNightShiftMode?: boolean;
  hospitalName?: string;
  count?: number;
}

export const SearchListingsSkeleton: React.FC<SearchListingsSkeletonProps> = ({
  viewMode = 'split-map',
  isNightShiftMode = false,
  hospitalName,
  count = 4,
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
          <div className="space-y-1.5">
            <div className="h-3.5 w-36 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="h-6 w-64 rounded-lg bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>
          <div className="h-9 w-40 rounded-xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} variant="grid" isNightShiftMode={isNightShiftMode} />
          ))}
        </div>
      </div>
    );
  }

  // Split-map mode skeleton
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[820px]">
      {/* Left 7 cols: Listings Feed Skeleton */}
      <div className="lg:col-span-7 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 overflow-hidden">
        {/* Feed Header Skeleton */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550] gap-2">
          <div className="space-y-2">
            <div className="h-3 w-32 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="h-5 w-72 rounded-lg bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>
          <div className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
        </div>

        {/* Listings Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: count }).map((_, i) => (
            <ListingCardSkeleton key={i} variant="compact" isNightShiftMode={isNightShiftMode} />
          ))}
        </div>
      </div>

      {/* Right 5 cols: Map Canvas Skeleton */}
      <div className="lg:col-span-5 bg-slate-100 dark:bg-[#0d1726] border-t lg:border-t-0 lg:border-l border-[rgba(11,37,89,0.08)] dark:border-[#233550] relative min-h-[480px] lg:min-h-full flex flex-col justify-between p-4 overflow-hidden">
        {/* Shimmering map overlay */}
        <div className="absolute inset-0 skeleton-shimmer opacity-40" />

        {/* Top Floating Map Controls Skeleton */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="h-8 w-48 rounded-full bg-white/80 dark:bg-[#15233a]/80 shadow-xs backdrop-blur-xs" />
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-8 rounded-full bg-white/80 dark:bg-[#15233a]/80 shadow-xs" />
            <div className="h-8 w-8 rounded-full bg-white/80 dark:bg-[#15233a]/80 shadow-xs" />
          </div>
        </div>

        {/* Simulated Map Markers in Center */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center gap-6 pointer-events-none">
          {/* Hospital Center Marker Skeleton */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-2xl bg-[#005684]/20 dark:bg-[#93ccff]/20  flex items-center justify-center">
              <span className="material-symbols-outlined text-[#005684] dark:text-[#93ccff] text-[22px]">
                local_hospital
              </span>
            </div>
            <div className="h-4 w-32 rounded-md bg-slate-300 dark:bg-[#223650] shadow-xs" />
          </div>

          {/* Surrounding Sanctuary Pins Skeletons */}
          <div className="flex items-center gap-16 opacity-75">
            <div className="h-8 w-20 rounded-full bg-white dark:bg-[#15233a] shadow-md border border-slate-200 dark:border-[#233650]" />
            <div className="h-8 w-22 rounded-full bg-[#005684]/30 dark:bg-[#93ccff]/30 shadow-md border border-slate-200 dark:border-[#233650]" />
          </div>
        </div>

        {/* Bottom Floating Route Card Skeleton */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-white/95 dark:bg-[#111e33]/95 backdrop-blur-md shadow-md border border-[rgba(11,37,89,0.12)] dark:border-[#233550] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              <div className="h-4 w-40 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
              <div className="h-3.5 w-24 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            </div>
          </div>
          <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer shrink-0" />
        </div>
      </div>
    </div>
  );
};
