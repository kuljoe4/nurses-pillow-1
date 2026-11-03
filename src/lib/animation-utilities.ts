import { Variants } from 'framer-motion';

/**
 * PRODUCTION-READY MOTION TOKENS
 * Mapped to Nurses Pillow Design System (AGENTS.md)
 */

export const motionTokens = {
  duration: {
    instant: 0.1,    // 100ms - Button presses, immediate feedback
    fast: 0.18,      // 180ms - Hovers, tooltips, chips
    base: 0.28,      // 280ms - Default for structural changes, sheets, standard ease-out
    slow: 0.45,      // 450ms - Staged reveals, complex route changes
    celebrate: 0.60  // 600ms - Success states, major milestones
  },

  easing: {
    // Energetic / Spring-like (for buttons, cards, signature saves)
    spring: [0.34, 1.56, 0.64, 1] as const,
    // Smooth Ease-Out (for modals, bottom sheets, overlay entrances)
    smoothOut: [0.16, 1, 0.3, 1] as const,
    // Snappy (for quick state toggles, icons, checkmarks)
    snappy: [0.4, 0, 0.2, 1] as const,
    // Standard (when custom isn't needed but linear is bad)
    standard: [0.4, 0.0, 0.2, 1] as const
  }
};

/**
 * FRAMER MOTION VARIANTS
 * GPU-accelerated utilizing transform and opacity.
 */

// Signature Spring Bounce for the Save Pillow Icon
export const pillowSaveVariant: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  saved: {
    scale: [1, 1.25, 1],
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.spring
    }
  }
};

// Modal & Sheet Entrances (Smooth Ease-Out)
export const modalFadeScaleVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.smoothOut
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.snappy
    }
  }
};

export const bottomSheetVariant: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.smoothOut
    }
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.easing.snappy
    }
  }
};

// Staggered List Reveals (For Search Results / Assignment Card loading)
export const staggerContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const staggerItemVariant: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.base,
      ease: motionTokens.easing.smoothOut
    }
  }
};

// Hero Section Staggered Entrance Variants (Headline, Visual, Search Card)
// GPU Hardware-accelerated transforms exclusively (translateY & scale) to prevent opacity/layout repaints
export const heroContainerVariant: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.04,
    },
  },
};

export const heroItemVariant: Variants = {
  hidden: { y: 24, scale: 0.985 },
  visible: {
    y: 0,
    scale: 1,
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.easing.smoothOut,
    },
  },
};

export const heroVisualVariant: Variants = {
  hidden: { y: 28, scale: 0.975 },
  visible: {
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: motionTokens.easing.smoothOut,
    },
  },
};

export const heroSearchCardVariant: Variants = {
  hidden: { y: 32, scale: 0.975 },
  visible: {
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: motionTokens.easing.smoothOut,
    },
  },
};

// Listing Card Scroll Reveal Variant (Triggered via Intersection Observer)
// Relies exclusively on GPU-accelerated transforms (translateY + scale) without opacity to guarantee high FPS performance
export const listingCardRevealVariant: Variants = {
  hidden: {
    y: 24,
    scale: 0.98,
  },
  visible: {
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: motionTokens.easing.smoothOut,
    },
  },
};

/**
 * TAILWIND INJECTION STRING
 * Usage: Add to global CSS to ensure custom properties map cleanly
 */
export const cssVariablesInjector = `
  :root {
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-smooth-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-snappy: cubic-bezier(0.4, 0, 0.2, 1);

    --dur-instant: 100ms;
    --dur-fast: 180ms;
    --dur-base: 280ms;
    --dur-slow: 450ms;
  }

  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
