# Nurses Pillow: Motion Design & Interaction Architecture

Based on the core philosophy of "Warm, competent, unhurried" outlined in the `AGENTS.md` and current motion tokens, here are the targeted motion design recommendations, prioritizing aesthetic elegance, cognitive load reduction, and absolute performance.

## Core Principles

1.  **Intentionality over Decoration:** Every animation must serve a cognitive purpose: drawing attention to an actionable item, providing spatial awareness during navigation, or offering immediate feedback on interaction.
2.  **Performance First:** Animations must strictly use GPU-accelerated properties (`transform`, `opacity`). Layout animations (changing width, height, margin) are banned unless absolutely necessary and wrapped in `<motion.div layout>` with strict bounds.
3.  **Accessibility (WCAG 2.1):** All motion must respect `prefers-reduced-motion` natively. This is already correctly established in `src/lib/animation-utilities.ts`, but must be strictly enforced on new components.

## Recommended Motion Patterns by Section

### 1. Global Navigation & Core Interactions (All Pages)

*   **Pillow Save Button (Signature Interaction):**
    *   **Current State:** Implemented via `pillowSaveVariant` (spring bounce).
    *   **Recommendation:** Ensure the transition between the empty and filled state utilizes a very slight color crossfade alongside the spring bounce (`scale: [1, 1.25, 1]`) to make the state change feel more substantial but soft.
    *   **Where:** Every listing card, listing detail modal.
*   **Button Press States:**
    *   **Current State:** Instant (100ms).
    *   **Recommendation:** Use a subtle `scale: 0.98` on `:active` for all primary CTAs (e.g., "Search housing", "Request to book"). This provides tactile feedback without feeling sluggish.

### 2. Search & Discovery (FindHousingView & SearchListingsView)

*   **The Assignment Card (Hero Component):**
    *   **Recommendation:** The staged reveal of the question, the autocomplete input, and the CTA should use `heroContainerVariant` and `heroItemVariant`. The key is staggered entrance (`staggerChildren: 0.1`) so the user's eye naturally follows the intended flow top-to-bottom.
    *   **Performance Note:** Pre-warm the Google Maps Places API during this animation to hide latency.
*   **Listing Grid & Cards (`SearchListingsView`):**
    *   **Recommendation:** As the user scrolls, new listing cards should elegantly fade and slide up using `listingCardRevealVariant` (`y: 24`, `opacity: 0` -> `y: 0`, `opacity: 1`).
    *   **Crucial:** Tie this to `IntersectionObserver` (via Framer Motion's `whileInView` with `viewport={{ once: true, margin: "-50px" }}`) to ensure they only animate once as they enter the viewport, preventing annoying re-animations on upward scroll.

### 3. Progressive Disclosure & Modals (ListingDetailModal & HealthcareAmenitiesFilterModal)

*   **Modal Entrances:**
    *   **Recommendation:** Continue using `modalFadeScaleVariant` (scale `0.95` -> `1`, `y: 10` -> `0`). This provides a "coming forward" spatial relationship.
    *   **Background Blur:** Add a subtle `backdrop-filter: blur(4px)` to the modal overlay, animating in over `motionTokens.duration.base` (280ms) to gently obscure the background without full opacity loss.
*   **Expandable Sections (e.g., "Show all amenities"):**
    *   **Recommendation:** Use Framer Motion's `<AnimatePresence>` and `height: "auto"` for smooth accordion expansions.
    *   **Performance:** Use `overflow: hidden` during the animation and immediately remove it when complete to prevent clipping issues.

### 4. The Verification Flow (PostmarkEmailVerificationView, TwilioPhoneOtpView, ClinicalLicenseStep)

*   **Step Transitions (Stepper Navigation):**
    *   **Recommendation:** When moving between steps (e.g., Email -> Phone), do *not* use complex crossfades. Use a horizontal slide (`x: 20` -> `x: 0` for next, `x: -20` -> `x: 0` for previous) with a quick fade (`opacity: 0` -> `1`).
    *   **Why:** A horizontal slide reinforces the mental model of forward progression.
*   **Success States (VerificationSuccessModal):**
    *   **Recommendation:** This is the *only* place to use `motionTokens.duration.celebrate` (600ms). The Warm Gold Accent (`#F1CF78`) should be used here. A soft, expanding ring animation behind the success icon (Teal-Green `#2F6E5E`) signifies completion without being visually overwhelming.

### 5. Checkout & Booking (ItemizedCheckoutModal)

*   **Price Breakdown Reveal:**
    *   **Recommendation:** When a user selects dates and the pricing recalculates, animate the numbers slightly (a quick fade down and up, or a specialized number ticker if the delta is small).
    *   **Crucial:** Ensure tabular numerals (`tabular-nums`) are enforced to prevent layout horizontal jitter during price changes.

## Architectural Implementation Guidelines

1.  **Component Modularity:** Never inline `variants`. Always import them from `src/lib/animation-utilities.ts` to maintain the design system's single source of truth.
2.  **Strict `<AnimatePresence>` Usage:** Only use `<AnimatePresence>` when elements are actually being removed from the React Tree. Do not use it for simple style toggles (use standard `animate` props instead).
3.  **Reflect `useReducedMotion`:** When building custom components, always wrap motion properties in a check:
    ```tsx
    const shouldReduceMotion = useReducedMotion();
    const transition = shouldReduceMotion ? { duration: 0 } : defaultTransition;
    ```

### 6. Advanced Product Showcases & Scrollytelling (Non-Interactive Mockups)

For landing pages, "How It Works" sections, or feature highlights where we are displaying static images, product mockups, or UI abstractions, we need advanced "scrollytelling" techniques to make the product feel premium (Apple-esque) without relying on heavy videos or WebGL.

*   **Scroll-Linked Parallax & Sticky Reveals (The "Feature Spotlight" Pattern):**
    *   **Recommendation:** When explaining a complex flow (e.g., "The Zero Deposit Booking Process"), use a CSS `position: sticky` container for the visual mockup (e.g., a phone frame) while the descriptive text scrolls beside it.
    *   **Implementation:** Use Framer Motion's `useScroll` hook combined with `useTransform` to tie the *internal* state of the sticky mockup to the scroll progress of the text container.
        ```tsx
        // Conceptual Example
        const { scrollYProgress } = useScroll({ target: containerRef });
        const internalMockupY = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
        const opacityStep1 = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
        const opacityStep2 = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
        ```
*   **Sequenced Internal Mockup Animations (The "Ghost UI"):**
    *   **Recommendation:** Instead of static JPEGs of the UI, use simplified SVG representations ("Ghost UI" or wireframes). Animate the *contents* of these SVGs (e.g., a search bar expanding, a loading skeleton being replaced by a home listing, a verification badge springing into place) automatically using a looped sequence or tied to scroll position.
    *   **Performance:** SVGs are DOM elements. Ensure you are only animating `transform` or `opacity` on the `<g>` or `<path>` elements within the SVG, not complex stroke-dasharrays on heavy paths if they cause frame drops.
*   **Staged Reveal Grids (The "Bento Box" Layout):**
    *   **Recommendation:** For showcasing multiple features (e.g., verified hosts, premium amenities, 24/7 support), arrange them in an asymmetrical grid. Use `staggerContainerVariant` and `heroItemVariant` on the grid parent, combined with `whileInView`.
    *   **Crucial Polish:** Add a very subtle, continuous "float" animation (`y: [0, -4, 0]`, `duration: 4`, `repeat: Infinity`, `ease: "easeInOut"`) to the hero imagery *inside* the bento box after its initial entrance to make the page feel alive even when the user isn't scrolling.
*   **Image Crossfades on Hover (Desktop Only):**
    *   **Recommendation:** If displaying a gallery of properties in a showcase section, crossfade between exterior and interior shots when the user hovers over the container.
    *   **Implementation:** Use two absolute positioned images. The top image fades out on hover. This must be disabled via media queries on touch devices where hover is non-existent or sticky.

**Performance Guardrails for Advanced Motion:**
1.  **Never animate `box-shadow` or `filter: blur()` continuously on scroll.** This causes severe layout thrashing and GPU overhead. If you need a blurring effect on scroll, use a solid color overlay and animate its `opacity`.
2.  **Debounce or throttle `useScroll` heavily** if using it to trigger state changes rather than direct style transforms.
