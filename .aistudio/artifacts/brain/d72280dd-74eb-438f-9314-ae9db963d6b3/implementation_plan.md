# Implementation Plan — State Expansion Approval UI Sync, Map Density/Congestion, & UI/UX Refinement

## User Review & Feedback
> **User Clarifying Answers & Additions**:
> - **Q: How should approving a state launch propagate updates across the UI and search filters?**
>   - A: Global state sync updating live listings and search filters immediately.
> - **Q: How should we streamline UI congestion in the admin state expansion view?**
>   - A: Clean up dense table rows and add expandable drawer details.
> - **Addition**: Refine the **Maps for Density/Congestion** (`AdminSupplyDensityView` & `GoogleMapsSplitView`) to prevent marker clutter, ensure smooth zooming, and provide clear visual hierarchy for supply vs. demand/congestion hotspots.

---

## Proposed Changes

### 1. State Expansion Approval & Global UI Sync
- **State Expansion Approval Flow (`AdminSupplyDensityView.tsx`)**:
  - When an administrator approves a state launch, ensure `isStateActive` status updates in global state / backend and immediately propagates to `FindHousingView`, `SearchListingsView`, and state filter dropdowns.
  - Clarify mock vs. live data in the expansion tab (real PostgreSQL demand logs and waitlist listings vs simulated pipeline metrics).

### 2. Map Density & Congestion Refinement (`AdminSupplyDensityView.tsx`)
- **Map Clustering & Visual Clutter Reduction**:
  - Prevent visual congestion on the map when rendering multiple supply pins or demand hotspots.
  - Implement clean custom markers with distinct styling for active supply (`#2F6E5E`) vs unmet demand/congestion hotspots (`#A8452E`).
  - Add smooth zoom and pan synchronization when selecting individual states or territories.

### 3. Admin Table & UI/UX Congestion Reduction
- **Expandable Drawer Details**:
  - Replace dense multi-column table rows in the expansion waitlist and demand reports with clean card modules and expandable detail drawers.
  - Enforce anti-slop typography and zero-pill static metadata rules (`frontend-design`).

---

## Verification Plan

### Automated Tests
- Run `npm test -- --run` to verify all 77 tests pass successfully.
- Run `tsc --noEmit` to verify zero TypeScript errors.

### Build Verification
- Compile applet with `compile_applet`.
- Verify state launch approval unlocks the state and updates maps and filters instantly.
