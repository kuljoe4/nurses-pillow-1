## 2023-10-25 - [Fix] Support Modal Submit Button Lacks Loading State
**Learning:** During asynchronous form submissions inside modals, like the `NurseSupportModal`, users can repeatedly click the 'Send' button because it lacks an explicit loading state (`isSubmitting`) or disabled property. This omission can result in multiple unintended API requests or redundant logic execution.
**Action:** When working on modals with asynchronous logic (like `setTimeout` or actual API calls), ensure a proper `isSubmitting` state is maintained. Disable the submit button and provide clear visual feedback (e.g. "Sending..." or a spinner animation) to prevent concurrent submissions and reassure the user that their request is being processed.

## 2026-10-07 - Accessible Progressive Disclosure
**Learning:** When using Framer Motion's AnimatePresence for progressive disclosure (expand/collapse) in React, the toggle button inherently lacks semantic connection to the animated content. Screen readers cannot announce the expanded state or locate the revealed content without explicit ARIA attributes.
**Action:** Always link the toggle button and the motion.div using `aria-controls` and an `id`, and reflect the current state using `aria-expanded={isOpen}` on the button.
## 2024-10-08 - Add accessibility attributes to expand/collapse panels
**Learning:** React components using `AnimatePresence` and `motion.div` for progressive disclosure often miss critical screen reader linkages. Toggle buttons need `aria-expanded` reflecting the open state, and `aria-controls` pointing to the `id` of the expanding region to ensure assistive technologies can announce the relationship and state changes.
**Action:** When implementing expand/collapse UI, consistently add `id` to the toggled container and `aria-controls`/`aria-expanded` to the button that controls it.

## 2026-10-08 16:57 - Toggle Button Accessibility (`aria-pressed`)
**Metric Impact:** +1 accessible toggle button.
**Overall Progress:** 4th iteration, accessibility score improved.
**Learning:** Custom components serving as toggle buttons (like the `PillowSaveButton` for saving/unsaving) rely on `aria-pressed` to communicate their current active state to screen readers. Relying solely on `aria-label` is insufficient for true toggle semantics.
**Action:** Added the `aria-pressed={isSaved}` attribute to the Framer Motion button in `PillowSaveButton.tsx`.
**Next Scheduled Target:** Target a specific modal or filter panel to eliminate redundant introductory phrasing and simplify visual hierarchy.
---
# UI/UX & Copy Review Metrics Tracker

This section acts as the memory tracker for the regular UI/UX interval reviews. It maintains the overall progress and learning metrics.

## Baseline (Init)
**Overall Progress:** 0 iterations completed.
**Baseline State:** Initializing tracking protocol for copy redundancy, visual hierarchy, and accessibility metrics.
## 2024-10-10 - Fix Security Deposit UI Discrepancies
**Learning:** Security deposits were permanently eliminated platform-wide. Residual text referencing $200.00 and $250.00 holds generated copy redundancy and contradiction.
**Action:** Changed remaining security deposit UI and email receipt values to explicit $0.00 items, and removed the obsolete Escrow Compliance text.

## 2023-10-25 - Accessible Progressive Disclosure popovers
**Metric Impact:** +2 accessible progressive disclosure UI components.
**Overall Progress:** 5th iteration, accessibility score improved.
**Learning:** In Framer Motion's AnimatePresence logic, toggle buttons for dynamically expanded content (like popovers and drawers) need proper semantic linkages using `aria-controls` pointing to a unique `id` on the content container to ensure screen readers can navigate and announce relationships effectively.
**Action:** Added `id="dates-popover"` and `id="distance-popover"` to the respective `motion.div` containers in `FindHousingView.tsx`, and updated the respective toggle buttons with `aria-controls` bindings (already had `aria-expanded`).
**Next Scheduled Target:** Target filter and assignment panels in SearchListingsView for similar semantic linkages.

## 2024-10-25 - [Missing aria-expanded and aria-controls on Expandable UI Elements]
**Learning:** React components using simple conditional rendering (like `showFeeBreakdown && ...` in `ProductPreviewHero.tsx`) often miss the standard `aria-expanded` and `aria-controls` attributes on their toggle buttons. This leaves screen reader users unaware of the button's purpose and state.
**Action:** When implementing toggle buttons that control the visibility of another element, always add `aria-expanded={boolean}` and `aria-controls="unique-id"` to the button, and the matching `id="unique-id"` to the controlled container.
## 2026-10-10 - Performance, Accessibility, and Backend Typing Improvements
**Learning:** Verified existing code optimizations like Schwartzian transforms and single-pass loops. Found chained `.filter()` loops inside `AdminPortalView.tsx` and refactored them to a single pass `for` loop within `useMemo` to fix a potential bottleneck. Addressed missing `AuthenticatedRequest` typing in `server.ts` for better robustness.
**Action:** Implemented useMemo and single-pass loops for calculating pending clinician/property counts. Unified backend API types using `AuthenticatedRequest`.
