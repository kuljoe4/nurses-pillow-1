import React from 'react';
import { motion } from 'framer-motion';

interface PillowSaveButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  className?: string;
  size?: number;
  showLabel?: boolean;
}

/**
 * Signature Nurses Pillow Save Control
 * Custom spring-bounce microinteraction (Outline -> Filled Navy with a 280ms spring bounce)
 * Replaces generic heart icons as specified in AGENTS.md
 */
// ⚡ Bolt Performance Optimization: Wrapped with React.memo to prevent unnecessary re-renders
// when parent components update but the button's props remain unchanged.
export const PillowSaveButton: React.FC<PillowSaveButtonProps> = React.memo(({
  isSaved,
  onToggle,
  className = '',
  size = 20,
  showLabel = false,
}) => {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      className={`group relative inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] transition-colors cursor-pointer select-none ${className}`}
      aria-label={isSaved ? 'Remove from saved pillows' : 'Save to my pillows'}
      aria-pressed={isSaved}
      title={isSaved ? 'Saved to your Pillows' : 'Save to your Pillows'}
    >
      <motion.div
        animate={
          isSaved
            ? {
                scale: [1, 0.78, 1.24, 1],
                rotate: [0, -6, 6, 0],
              }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          duration: 0.3,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        className="flex items-center justify-center shrink-0"
      >
        {/* Anatomical Pillow SVG with tufted center and stitched corners */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            isSaved
              ? 'text-[#0B2559] dark:text-[#3E9AD1] drop-shadow-[0_1px_2px_rgba(11,37,89,0.25)]'
              : 'text-[#0B2559]/70 dark:text-[#E6ECF7]/80 group-hover:text-[#0A6FA8] focus-visible:text-[#0A6FA8] dark:group-hover:text-[#3E9AD1] focus-visible:text-[#3E9AD1]'
          }
        >
          {/* Rounded plush pillow outer contour */}
          <path d="M4 6.5C4 5.12 5.12 4 6.5 4C9 4.8 15 4.8 17.5 4C18.88 4 20 5.12 20 6.5C19.2 9 19.2 15 20 17.5C20 18.88 18.88 20 17.5 20C15 19.2 9 19.2 6.5 20C5.12 20 4 18.88 4 17.5C4.8 15 4.8 9 4 6.5Z" />
          {/* Subtle center comfort tuft / dimple */}
          {isSaved ? (
            <>
              <circle cx="12" cy="12" r="1.5" fill="#F1CF78" stroke="none" />
              <path d="M12 9.5v-1M12 14.5v1M9.5 12h-1M14.5 12h1" stroke="#F1CF78" strokeWidth="1.2" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="1.2" fill="currentColor" opacity="0.6" stroke="none" />
              <path d="M12 10v-1M12 14v1M10 12h-1M14 12h1" stroke="currentColor" opacity="0.4" strokeWidth="1" />
            </>
          )}
        </svg>
      </motion.div>

      {showLabel && (
        <span
          className={`text-xs font-semibold ${
            isSaved
              ? 'text-[#0B2559] dark:text-[#3E9AD1]'
              : 'text-[#404850] dark:text-[#c0c7d1] group-hover:text-[#0A6FA8] focus-visible:text-[#0A6FA8]'
          }`}
        >
          {isSaved ? 'Saved to Pillows' : 'Save to Pillows'}
        </span>
      )}
    </motion.button>
  );
});
