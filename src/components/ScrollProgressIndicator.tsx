import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollProgressIndicatorProps {
  isNightShiftMode: boolean;
  currentTab?: string;
  isDeveloper?: boolean;
}

export const ScrollProgressIndicator: React.FC<ScrollProgressIndicatorProps> = ({
  isNightShiftMode,
  currentTab,
  isDeveloper = false,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  const hideTimeoutRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const calculateProgress = useCallback(() => {
    const docElem = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || docElem.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(
      docElem.scrollHeight,
      body.scrollHeight,
      docElem.offsetHeight,
      body.offsetHeight
    );
    const clientHeight = window.innerHeight || docElem.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    setIsAtTop(scrollTop < 75);

    if (maxScroll <= 80) {
      setIsScrollable(false);
      setScrollProgress(0);
      return;
    }

    setIsScrollable(true);
    const rawProgress = (scrollTop / maxScroll) * 100;
    const clampedProgress = Math.min(100, Math.max(0, rawProgress));
    setScrollProgress(clampedProgress);
  }, []);

  const handleScroll = useCallback(() => {
    // Schedule recalculation with RAF for smooth 60fps performance
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      calculateProgress();
      setIsScrolling(true);

      // Reset vanishing timer: fade away after 1600ms of idle reading
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 1600);
    });
  }, [calculateProgress]);

  useEffect(() => {
    // Initialize & bind passive scroll listener
    calculateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateProgress);
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [calculateProgress, handleScroll]);

  // Recalculate and reset states when user switches tabs or routes
  useEffect(() => {
    setIsScrolling(false);
    setIsAtTop(true);
    setScrollProgress(0);

    // Give DOM a frame to settle new view height
    const timer = window.setTimeout(() => {
      calculateProgress();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [currentTab, calculateProgress]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  // Only render if page has enough content to scroll
  if (!isScrollable) {
    return null;
  }

  const isVisible = (isScrolling || isHovered) && !isAtTop;
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <>
      {/* 1. Subtle, vanishing slim progress track at the bottom of the viewport */}
      <div
        aria-hidden="true"
        className={`fixed bottom-0 left-0 right-0 h-[3px] pointer-events-none z-30 transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full h-full bg-[#0B2559]/5 dark:bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#0A6FA8] via-[#0C7EBF] to-[#3E9AD1] rounded-r-full transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* 2. Floating, ergonomic vanishing pill with orientation and quick return affordance */}
      <div
        className={`fixed bottom-5 right-5 sm:right-8 z-30 transition-all duration-200 ease-in-out duration-300 ease-out transform ${
          isVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          role="region"
          aria-label="Reading progress and navigation"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#0B1626]/90 backdrop-blur-md border border-[rgba(11,37,89,0.12)] dark:border-[#233550] shadow-[0_4px_16px_rgba(11,37,89,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] select-none text-[#0B2559] dark:text-[#E6ECF7]"
        >
          {/* Circular progress glyph */}
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 24 24">
              {/* Background circle track */}
              <circle
                cx="12"
                cy="12"
                r={radius}
                className="stroke-[#0B2559]/10 dark:stroke-white/10"
                strokeWidth="2.2"
                fill="none"
              />
              {/* Progress stroke */}
              <circle
                cx="12"
                cy="12"
                r={radius}
                className="stroke-[#0A6FA8] dark:stroke-[#3E9AD1] transition-[stroke-dashoffset] duration-150 ease-out"
                strokeWidth="2.2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Tabular reading percentage */}
          <span className="text-[11px] font-semibold tabular-nums tracking-tight">
            {Math.round(scrollProgress)}%
          </span>

          <span className="w-px h-3 bg-[rgba(11,37,89,0.15)] dark:bg-white/15" aria-hidden="true" />

          {/* Gentle "Top" affordance */}
          <button
            type="button"
            onClick={scrollToTop}
            title="Return to top of page"
            className="flex items-center gap-0.5 text-[11px] font-medium text-[#0A6FA8] dark:text-[#3E9AD1] hover:text-[#0C7EBF] focus-visible:text-[#0C7EBF] dark:hover:text-[#67b5e4] focus-visible:text-[#67b5e4] transition-colors cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[13px] leading-none">arrow_upward</span>
            <span className="group-hover:underline underline-offset-2">Top</span>
          </button>
        </div>
      </div>
    </>
  );
};
