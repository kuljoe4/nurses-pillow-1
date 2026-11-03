## 2025-10-27 - Initial Findings
**Learning:** This repo has a lot of components lacking aria-labels or missing labels for inputs (for example, there is no `htmlFor` used in `NurseSupportModal.tsx` and some `<select>`/`<textarea>` elements have missing IDs). There are also `aria-label`s missing on buttons, but the `<button aria-label="Close">` is an easy target for today.
**Action:** Add aria-labels to buttons where helpful or missing, and implement htmlFor on labels.
## 2025-10-27 - Input Labels
**Learning:** Found `<label>` elements missing the `htmlFor` attribute. Adding `htmlFor` matching the associated input's `id` significantly improves semantic accessibility and allows users to focus an input field by clicking on its label text.
**Action:** Always ensure that every `<label>` correctly associates with its form control using `htmlFor` and an explicit `id`.

## 2025-10-27 - Input Labels and Accessibility
**Learning:** Found several `<input>` fields embedded within `<label>` without `htmlFor` tying them together, or independent inputs without `aria-label`. Properly adding `id` and `htmlFor`, and using `aria-label` for standalone controls (like sliders or search inputs), is vital for screen readers.
**Action:** Enforce strict checking of `<label>` and `<input>` pairings to use `htmlFor` and `id`, and add `aria-label` for inputs like search and range sliders.
## 2023-10-27 - Missing Aria Labels on Icon-Only Buttons
**Learning:** Found several icon-only buttons (like `remove`, `add`, and `close` icons inside `HostPortalView.tsx`) that lacked `aria-label` attributes. This breaks accessibility for screen readers.
**Action:** Added `aria-label` to these buttons to explicitly describe their actions (e.g., "Decrease room count", "Remove photo"). When implementing or reviewing icon buttons, ensure they always have an accessible name using `aria-label` if there is no visible text.
## 2024-10-02 - Added ARIA label to password visibility toggle
**Learning:** Found an icon-only button lacking an accessible label in AuthModal.tsx. Icon-only buttons must always have an aria-label to be readable by screen readers.
**Action:** Always verify icon-only buttons (`<button><span class="material-symbols-outlined">...</span></button>`) have dynamic or static `aria-label`s.

## 2025-10-27 - Icon-only buttons accessibility
**Learning:** Added `aria-label` to three icon-only buttons in `SearchListingCard.tsx`. Icon-only buttons must always have an aria-label to be readable by screen readers.
**Action:** Always verify icon-only buttons (`<button><span class="material-symbols-outlined">...</span></button>`) have dynamic or static `aria-label`s.
## 2026-10-05 - ARIA labels for text-only symbols (like ✕)
**Learning:** Discovered that 'icon-only' buttons are sometimes implemented using plain text symbols (like '✕' or '✓') rather than `<span className="material-symbols-outlined">`. These are effectively icon-only buttons for screen readers and strictly require `aria-label` attributes.
**Action:** When auditing for missing ARIA labels, also look for buttons containing only non-alphanumeric text symbols.
## 2026-10-27 - Progressive Disclosure
**Learning:** When using expand/collapse UI patterns (like `conditionally rendered UI`), it is critical for accessibility to properly link the toggle button and the expandable container using `aria-controls` and `id`, and to reflect the state with `aria-expanded` on the button. This allows screen readers to know a container is controlled by the button and its current visibility state.
**Action:** Always verify expand/collapse toggle buttons include `aria-expanded` and `aria-controls` linked to the container `id`.
