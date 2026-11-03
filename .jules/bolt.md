## 2025-01-01 - [Refactored Multiple Array Filters to Single Pass Early Returns]
**Learning:** Found multiple chained array `.filter()` calls in React component `useMemo` blocks handling data. This is an O(M * N) anti-pattern where M is the number of filters and N is the number of elements.
**Action:** Always combine array `.filter()` conditions into a single pass using early returns, reducing complexity to O(N) and significantly reducing allocations.
## 2026-10-02 - Lazy Load Modals
**Learning:** Using React.lazy for modals can significantly reduce the initial JavaScript bundle size, improving Time to Interactive (TTI), particularly on views with many complex modals that may never be opened by the user during a session.
**Action:** When adding heavy modals, always wrap them in React.lazy() and <Suspense>.
## 2024-10-03 - [GoogleHospitalAutocomplete Debounce Optimization]
**Learning:** `GoogleHospitalAutocomplete` uses the Places API via `placesLibrary?.AutocompleteSuggestion.fetchAutocompleteSuggestions` directly in the `handleInputChange` handler, which fires on every keystroke (`onChange`). This results in unnecessary network requests and API quota usage for every letter typed.
**Action:** Implement a standard debounce pattern (e.g., using `setTimeout`) in the `handleInputChange` to reduce API calls to the Google Maps Places API, significantly improving performance and reducing quota.
## 2025-10-04 - [Memoize Complex Computations In List Filtering]
**Learning:** Found `calculateCommuteDuration` (which involves Haversine distance and complex string matching calculations) being called inside array `.filter()` and `useMemo` hooks for every element against every selected hospital. This led to thousands of identical redundant calculations during search filtering.
**Action:** Always memoize computationally heavy functions that are called inside list iterators with a bounded Map cache to reduce complexity from O(M * N) recalculations to O(1) lookups.
## 2026-10-04 - [Optimize Payload Size for Base64 Images]
**Learning:** Found raw base64 string payloads stored in `photo_url` column being sent directly via `json_agg` inside the `/api/listings` endpoint. This resulted in massive data payloads and bloated network requests which drove up memory consumption on both Node process and PostgreSQL instance.
**Action:** Replaced direct base64 string fetching with proxy endpoints (`GET /api/photos/:id`) and configured PostgreSQL to return the proxy URL strings instead. This streams the binary response with caching directly to the client.
## 2026-10-05 - [Single-Pass Iteration for Multiple Metric Counts]
**Learning:** Found an O(M*N) anti-pattern in `Phase1InventorySummaryTab.tsx` where `.filter().length` was called 17 times inside a `useMemo` block to calculate summary statistics.
**Action:** Replace multiple chained/independent `.filter()` array operations that iterate over the same dataset with a single O(N) loop (e.g. `reduce` or `for...of`) that increments metric counters.
## 2026-10-06 - [Avoid Re-calculating Inside Sort]
**Learning:** Found `calculateCommuteDuration` being redundantly calculated during array sorting, which caused an O(N log N) overhead, even when the function was memoized.
**Action:** Prevent redundant calculations during sorting loops. Pre-calculate values or memoize properly to reduce sorting overhead.
## 2025-01-01 - [Optimize string initials calculation]
**Learning:** Found an $O(N)$ string calculation logic that chained `.split().map().filter().slice().join()` causing intermediate arrays to be created on every render.
**Action:** Replaced chained array functions with a single pass `for` loop to prevent unnecessary intermediate object/array allocations while keeping internationalization support. Attempting to use Regex matching for this specific problem led to internationalization bugs, so a plain single-pass loop is preferred to ensure correctness and speed.
## 2024-05-18 - Optimized Array Filters & Reducers in HostPortalView
**Learning:** Chained array methods (like `.filter().map()` or multiple independent `.filter()` and `.reduce()` calls) can cause a performance issue if executed on every render, due to redundant iterations over the same collection (O(M * N) instead of O(N)) and excessive temporary object allocations, which slows down garbage collection.
**Action:** Replaced chained `.filter().reduce()` and multiple `.filter()` executions with a single O(N) iterative loop wrapped in a `useMemo` block. This reduces time complexity from O(3N) to O(N) and prevents reallocation on every React re-render.
## 2026-10-09 - [Optimize Array Methods in GoogleMapsSplitView]
**Learning:** Replaced multiple O(N) array scans (`.slice`, `.some`, `.find`) with a single O(N) `.findIndex` lookup to prevent unnecessary object duplication and array traversals.
**Action:** Use `.findIndex` directly when checking for existence and retrieving the element in the same context to optimize performance.
## 2025-01-01 - [HostAddressMapping Debounce Optimization]
**Learning:** `HostAddressMapping` uses the Places API via `placesLibrary?.AutocompleteSuggestion.fetchAutocompleteSuggestions` directly in the `handleInputChange` handler, which fires on every keystroke. This results in unnecessary network requests and API quota usage for every letter typed.
**Action:** Implement a standard debounce pattern in the `handleInputChange` to reduce API calls to the Google Maps Places API, significantly improving performance and reducing quota.
## 2026-10-12 - [Single Pass Map/Filter For Mixed Collections]
**Learning:** Found an O(4N) anti-pattern in `AdminPortalView.tsx` where a large API response array was iterated four times (two `.filter().map()` chains) to separate the data into two distinct arrays based on role. This created multiple unnecessary intermediate array allocations, adding overhead for the garbage collector and taking 4x the iterations.
**Action:** Replace multiple chained `.filter().map()` operations on the same data with a single `for` loop (O(N) time complexity) to filter and transform items simultaneously, pushing to the corresponding arrays and preventing intermediate object allocations.

## 2026-10-13 - [Single-Pass Array Check instead of find/filter/some in SearchListingsView]
**Learning:** Found multiple array filtering and searching anti-patterns (`.filter`, `.some`, `.find`, `.map`) within React component rendering blocks, triggering O(M * N) calculations on state changes. This is computationally expensive, especially inside components with large object lists like `SearchListingsView` or `FindHousingView`.
**Action:** Replaced chained and multi-iteration array methods with single-pass O(N) `for` loop iteration logic to reduce Javascript processing time and intermediate allocations. Early returns or `break;` statements inside `for` loops were also added to skip unnecessary computations once criteria are met.
