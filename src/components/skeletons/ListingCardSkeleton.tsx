import React from 'react';

interface ListingCardSkeletonProps {
  variant?: 'compact' | 'grid';
  isNightShiftMode?: boolean;
}

export const ListingCardSkeleton: React.FC<ListingCardSkeletonProps> = ({
  variant = 'compact',
  isNightShiftMode = false,
}) => {
  const isGrid = variant === 'grid';

  return (
    <div
      role="status"
      aria-label="Loading listing sanctuary"
      className={`overflow-hidden bg-white dark:bg-[#111e33] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-sm flex flex-col justify-between ${
        isGrid ? 'rounded-3xl' : 'rounded-2xl'
      }`}
    >
      {/* Photo Placeholder */}
      <div
        className={`relative w-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer ${
          isGrid ? 'h-56' : 'h-44'
        }`}
      >
        {/* Top-left distance badge skeleton */}
        <div className="absolute top-3 left-3 h-6 w-24 rounded-full bg-slate-300 dark:bg-[#233652] opacity-80" />

        {/* Top-right favorite button skeleton */}
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/70 dark:bg-black/50" />
      </div>

      {/* Content Placeholder */}
      <div className={`flex-1 flex flex-col justify-between gap-3.5 ${isGrid ? 'p-6' : 'p-4'}`}>
        <div>
          {/* Category & Rating Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="h-3 w-24 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="h-3.5 w-16 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>

          {/* Title Lines */}
          <div className="space-y-1.5 mb-3">
            <div className="h-4 w-4/5 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="h-3.5 w-3/5 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>

          {/* Pricing & Free Fee Tag */}
          <div className="flex items-baseline gap-2 mb-3">
            <div className="h-6 w-28 rounded-lg bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="h-3 w-12 rounded-md bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="ml-auto h-5 w-24 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>

          {/* Quiet & Shift Amenity Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
            <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center justify-between gap-2">
          <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
          <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-[#182840] skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};
