## 2025-02-12 - [CRITICAL] Fix IDOR in Auth Me Endpoint & Hardcoded Secrets
**Vulnerability:** The `/api/auth/me` endpoint permitted unauthenticated querying of sensitive user profiles by passing a `?email=` query param (IDOR bypass). Furthermore, the fallback token for Postmark was hardcoded into `server/authRoutes.ts`.
**Learning:** Legacy bypasses or development convenience logic on authenticated endpoints create catastrophic attack surfaces if left in production. Mock secrets should never reside within production execution paths.
**Prevention:** Always verify identity strictly off the JWT Bearer token on all secure routes. Rely strictly on environment variables for external secrets with secure fallbacks (e.g. failing gracefully) when absent.
## 2026-10-03 - Fix hardcoded JWT fallback secret
**Vulnerability:** A hardcoded, insecure JWT secret fallback ('nurses_pillow_secret_2026') was present in 'src/server/phoneAuthMiddleware.ts', bypassing standard environment configurations.
**Learning:** Middleware initialized independently of the main app lifecycle may inadvertently duplicate or loosen environment validation checks, leading to mismatched fallback credentials across services.
**Prevention:** Ensure all services and middleware within a codebase source their environment variables and security fallbacks from a centralized, unified initialization script or explicitly mirror the main application's fail-safe behavior.

## 2026-10-04 - Secure Random Value Generation
**Vulnerability:** Weak pseudo-random number generator (`Math.random()`) was used to generate sensitive security tokens including email verification PINs, SMS OTPs, and Twilio Session IDs. This makes tokens predictable and vulnerable to brute-force or sequencing attacks.
**Learning:** Both server-side Express routes and isomorphic API services were relying on `Math.floor(100000 + Math.random() * 900000)` for OTP generation.
**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNG). Use `crypto.randomInt()` or `crypto.randomBytes()` in Node.js environments, and `window.crypto.getRandomValues()` in browser environments.
## 2026-10-06 - Secure Random Value Generation
**Vulnerability:** Weak pseudo-random number generator (`Math.random()`) was used across the application to generate sensitive security tokens, transaction IDs, escrow holds, OTP session IDs, and database audit logs. This predictability introduces severe vulnerabilities to token sequencing and brute-force attacks.
**Learning:** Development-grade ID and token generators often leak into production if cryptographically secure replacements are not strictly enforced during code review.
**Prevention:** Always rely on Node.js `crypto` (`crypto.randomBytes`, `crypto.randomUUID`) on the backend and `window.crypto` (`crypto.getRandomValues`, `crypto.randomUUID`) on the frontend to guarantee unpredictability in critical identifiers and tokens.
## 2024-10-18 - [Removal of SSN and DOB handling]
**Vulnerability:** Collection of sensitive PII (SSN, DOB, Manual Document Uploads) in the database and frontend which increases legal liability and potential attack surface.
**Learning:** Handling sensitive PII and identity documents should be outsourced to secure third parties (e.g., Stripe Identity) rather than building internal flows and storing the data in our own Postgres database.
**Prevention:** Scrub the schema, server endpoints, and frontend of all , , and  references and leverage external KYC flows.
## 2024-10-18 - [Removal of SSN and DOB handling]
**Vulnerability:** Collection of sensitive PII (SSN, DOB, Manual Document Uploads) in the database and frontend which increases legal liability and potential attack surface.
**Learning:** Handling sensitive PII and identity documents should be outsourced to secure third parties (e.g., Stripe Identity) rather than building internal flows and storing the data in our own Postgres database.
**Prevention:** Scrub the schema, server endpoints, and frontend of all ssn, dob, and id_document references and leverage external KYC flows.
## 2025-02-28 - Add authentication to admin endpoints
**Vulnerability:** Admin endpoints (`/api/admin/verifications`, `/api/admin/verifications/:userId/approve`, etc.) lacked authentication and authorization checks, allowing unauthenticated requests to view and approve/reject clinical verifications and property listings.
**Learning:** High-privilege API routes must explicitly include authentication middleware and role validation to ensure only authorized administrators can access or execute sensitive actions.
**Prevention:** Always apply the `authenticateToken` middleware and verify `req.user.role` (e.g. `super_admin`, `admin`) for any newly added `/api/admin/*` endpoints.

## 2024-05-24 - [IDOR in Bookings API]
**Vulnerability:** The `/api/bookings` endpoints (GET, POST, PATCH) were missing authentication and authorization checks. This allowed unauthenticated users to query, create, or modify bookings belonging to any user just by passing arbitrary `userId` or `hostId` parameters.
**Learning:** Even when API routes aren't explicitly public, relying on client-side logic or simply expecting standard frontend usage leaves endpoints vulnerable. Direct database operations must validate the acting user against the `user_id` or `host_id` of the manipulated record.
**Prevention:** Always wrap sensitive resource endpoints with `authenticateToken` middleware and strictly enforce ownership (e.g., verifying `req.user.id === requested_resource.user_id`) unless the requesting user has elevated privileges (admin/super_admin).
## 2026-10-08 - [CRITICAL] Fix insecure random PIN generation
**Vulnerability:** Weak pseudo-random number generator (`Math.random()`) was used to generate email verification PINs. This makes tokens predictable and vulnerable to brute-force or sequencing attacks.
**Learning:** Server-side Express routes were relying on `Math.floor(100000 + Math.random() * 900000)` for OTP generation.
**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNG). Use `crypto.randomInt()` or `crypto.randomBytes()` in Node.js environments.
## 2024-10-25 - Fix Missing Authentication and Authorization on Booking Status Endpoints
**Vulnerability:** Several sensitive booking endpoints (`/api/bookings/:id/accept`, `/api/bookings/:id/decline`, `/api/bookings/:id/cancel`) were missing the `authenticateToken` middleware and had no authorization checks to verify if the user attempting to change the booking status actually owned the booking or had the correct role. This is a severe Insecure Direct Object Reference (IDOR) vulnerability that allowed any user (or unauthenticated user) to accept, decline, or cancel any booking if they knew the ID.
**Learning:** Always ensure all data-modifying endpoints (POST, PATCH, PUT, DELETE) have appropriate authentication middleware *and* verify authorization by comparing the authenticated user's ID with the resource owner's ID, especially for sensitive operations like changing booking statuses.
**Prevention:** In the future, create a standard pattern for endpoints modifying resources to always include `authenticateToken` and a permission check block that fails closed (returns 403) unless the user has ownership or admin privileges. Add test cases that explicitly try to modify resources with unauthenticated or wrong-user sessions.
## 2026-10-10 - Add Rate Limiting to Password Reset Routes
**Vulnerability:** The password reset request (/forgot-password) and processing (/reset-password) routes lacked rate limiting.
**Learning:** High-value authentication routes handling emails or verifying tokens are prime targets for automated abuse (e.g., brute-forcing tokens or exhausting email quotas). Relying on generic API limits is insufficient for these flows.
**Prevention:** Always apply specific authentication rate-limiters (like `authLimiter`) to password recovery, OTP generation, and token verification endpoints.
## 2026-10-10 - Prevent Email Enumeration Securely
**Vulnerability:** Email enumeration was possible on the `/register` endpoint by throwing a 409 error if an email already existed, allowing attackers to harvest user accounts.
**Learning:** Simply suppressing the error and returning a generic 201 response is insufficient if the success path sets a `Set-Cookie` header and the fake path does not. The presence or absence of the cookie becomes a side-channel oracle.
**Prevention:** To truly prevent enumeration, both the success and fake success paths must return identical HTTP responses, including setting a dummy cookie if the true path sets one. Additionally, the existing user must be notified via a background email that a duplicate registration was attempted so they are not left wondering why their password reset isn't working if they simply forgot they already had an account.
## 2026-10-10 - Database EXCLUDE Constraints for Date Ranges
**Vulnerability:** Application-level validation is insufficient to prevent double-booking race conditions.
**Learning:** PostgreSQL `EXCLUDE USING gist` is the most robust way to prevent overlapping dates. However, using `[]` (inclusive start, inclusive end) in `daterange(start_date, end_date, '[]')` prevents back-to-back bookings where one reservation ends on the exact same date another begins.
**Prevention:** Always use `[)` (inclusive start, exclusive end) for booking date ranges in PostgreSQL `EXCLUDE` constraints to natively support same-day check-in/check-out for consecutive reservations.
## 2026-10-15 - JWT Secret Production Hardening
**Vulnerability:** A hardcoded, insecure JWT secret fallback ('fallback_secret_for_development_only') was used across the application. While some files checked `process.env.NODE_ENV` on startup, they still assigned the insecure string to a constant if the environment variable was missing (which could happen due to a misconfiguration in production) instead of completely failing or throwing during the fallback evaluation. Also, inline JWT verifications in middleware were falling back directly to the string without checking the environment.
**Learning:** Fallbacks for secrets should never silently revert to a weak hardcoded string in a production environment. If a required secret is missing in production, the application should throw an error or crash rather than proceed with an insecure state.
**Prevention:** Always wrap secret fallbacks in an environment check (e.g. `process.env.NODE_ENV === 'development'`) and throw an error for production environments to enforce secure configuration.
## 2026-10-17 - [CRITICAL] Fix IDOR in Verification Endpoints
**Vulnerability:** The `/api/verify/identity` and `/api/verify/license` endpoints were vulnerable to Insecure Direct Object Reference (IDOR). They did not require authentication via middleware and allowed attackers to override the target user by passing `userId` or `email` in the request body. This allowed unauthenticated attackers to modify verification statuses and personal information of any user.
**Learning:** Endpoints handling sensitive user data and verification states must always enforce authentication using middleware. Fallbacks to request body parameters (`req.body.userId`) for identifying the target user should never be used without explicit authorization checks, as they bypass token-based identity verification.
**Prevention:** Always use `authenticateToken` middleware for sensitive endpoints and rely exclusively on `req.user.id` and `req.user.email` extracted from the verified token to identify the acting user, failing securely if they are not present.
## 2026-10-18 - Add Rate Limiting to Verification OTP Routes
**Vulnerability:** The email verification and phone OTP generation/verification endpoints lacked rate limiting middleware. This made them prime targets for automated abuse, such as SMS pumping, email quota exhaustion, and brute-forcing 6-digit verification codes.
**Learning:** Even if primary authentication endpoints (like `/login` or `/register`) are rate-limited, attackers often target secondary out-of-band communication endpoints (like `/send-verification-email` or `/phone/send-otp`) because they trigger external API calls (Postmark/Twilio) and can result in significant financial impact or brute-forcing if left unprotected.
**Prevention:** Consistently apply the `authLimiter` middleware to all endpoints that trigger external communication (email/SMS) or verify authentication tokens/codes.
## 2026-10-18 - [CRITICAL] Fix IDOR in Stripe Endpoints
**Vulnerability:** The `/api/stripe/account-link`, `/api/stripe/account-session`, `/api/stripe/complete-onboarding`, and `/api/stripe/test-reset-account` endpoints were vulnerable to Insecure Direct Object Reference (IDOR). They did not require authentication via the standard `authenticateToken` middleware and allowed an attacker to override the target user by passing `hostId` in the request body. This allowed unauthenticated attackers to manipulate Stripe integrations for any host user.
**Learning:** Endpoints interacting with third-party payment integrations must always enforce authentication using middleware. Fallbacks to request body parameters (`req.body.hostId`) for identifying the target user should never be used without explicit authorization checks, as they bypass token-based identity verification.
**Prevention:** Always use `authenticateToken` middleware for sensitive third-party integration endpoints and rely exclusively on `req.user.id` extracted from the verified token to identify the acting user, failing securely if they are not present.
## 2026-10-19 - Fix IDOR in Favorites Endpoints
**Vulnerability:** The `/api/favorites` and `/api/favorites/toggle` endpoints lacked authentication and authorization checks, allowing unauthenticated requests to view and modify any user's saved listings by arbitrarily passing `userId` or `email` as request query/body parameters instead of relying on token identity.
**Learning:** Helper identity resolution functions (`resolveUserIdentity`) that fallback to parsing request bodies or queries for a user identifier (`req.body.userId`) instead of strictly requiring and extracting identity from a verified JWT token are insecure. They enable attackers to trivially bypass authorization and manipulate other users' data.
**Prevention:** Always apply the standard `authenticateToken` middleware to routes that access or modify user-specific data (like favorites or profiles). Endpoints must strictly rely on `req.user.id` or `req.user.email` from the verified token context, and completely ignore client-provided identity hints in the request payload.
