# Nurses Pillow: Milestone 2 Architecture & Comprehensive Platform Delivery

A clinician-first expansion of the Nurses Pillow platform enabling seamless stay extensions, secure in-app messaging, completed-stay reviews, support ticketing, host multi-room operations, dynamic platform fee controls, executive marketplace analytics (GBV, revenue, conversion, zero-inventory demand), and automated background jobs.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been aligned with the Milestone 2 technical specification:

- **Executive Analytics & BI Suite**: Dedicated Marketplace Analytics engine in the Super-Admin Portal computing Gross Booking Value (GBV), Net Platform Revenue, Request-to-Acceptance Conversion, Cancellation Rates, Average Length of Stay (ALOS), and the "Demand-Without-Inventory" intelligence report with date-range and state-level filters.
- **Unified Rollout Scope**: Full implementation across all 10 core systems: Edge RBAC un-gating & account suspension guard, 13 relational schema extensions & B2B/matching readiness tables, GCS private asset storage service, Nurse Stay Management & Extensions, Host Operations & Multi-Room Calendar, In-App Text Messaging with 5-minute offline digests, Admin-Editable Notification Dispatcher (13 event keys), Completed-Stay Two-Way Reviews & Safety Moderation, Super-Admin Dynamic 15% Fee Slider & Promo Engine, and Webhook/Cron automation.
- **Relational Key Standardization**: To ensure zero SQL constraint conflicts with existing `users` (`usr_...`) and `listings` (`lst_...`) identifiers, foreign keys in new tables utilize `VARCHAR(255)` instead of strict `UUID` references.
- **Design System Fidelity (`AGENTS.md`)**:
  - **Typography**: Poppins for all UI elements; Kaushan Script reserved strictly for the tagline *"Rest Well. Heal Better."*.
  - **Signature Icon**: Favorite control is a rounded pillow shape (outline when unsaved, navy filled with spring bounce when saved)—generic hearts are strictly banned.
  - **Tabular Figures**: All price breakdowns, extension quotes, analytics metrics, dates, distances, and earnings enforce `tabular-nums`.
  - **Anti-Slop Cleanliness**: Zero internal screen codes (e.g., `Screen A-02`), no fake telemetry tickers, no urgency countdown pressure, and simple, soothing sentence case.

---

## 1. Overview & Core Concept

- **What It Does**: Transitions Nurses Pillow from initial search and checkout into an operational marketplace supporting the entire clinical assignment lifecycle—from 30-day prorated stay extensions and secure direct host messaging, to multi-room availability management, two-way completed stay reviews, safety incident resolution, dynamic fee simulation, and data-driven marketplace analytics.
- **Target Audience / Persona**:
  - **Traveling Healthcare Clinicians**: Nurses and allied professionals on 8- to 26-week assignments who need predictable, quiet housing near their hospitals with $0 traveler fees and hassle-free lease extensions.
  - **Verified Property Hosts**: Homeowners and property managers offering furnished rooms or entire homes who need independent multi-room availability calendars, guaranteed Stripe Connect payouts, and verified clinician rosters.
  - **Super-Administrators & Operations**: Leadership monitoring financial metrics (GBV, revenue, take rate), identifying underserved hospital markets where nurses search with zero housing results, adjusting host platform fees (0%–15%), issuing promotional discounts, and managing platform safety.
- **Key Value**: Delivers complete operational autonomy, transparent $0 traveler fee pricing, real-time assignment extension workflows, and deep visibility into marketplace health and regional housing demand.

---

## 2. Dedicated Marketplace Analytics & Business Intelligence (BI) Engine

### A. Mathematical Definitions & Aggregation Pipeline (`GET /api/admin/analytics`)

The Analytics API accepts query parameters `?startDate=...&endDate=...&state=...` and computes aggregate business intelligence directly from the PostgreSQL transaction ledger:

1. **Gross Booking Value (GBV)**:
   $$\text{GBV} = \sum (\text{total\_rent} + \text{cleaning\_fee} + \text{pet\_fee}) \quad \text{for bookings where status} \in (\text{'accepted'}, \text{'paid'}, \text{'active'}, \text{'completed'})$$
   - Measures total transaction volume moving through Nurses Pillow before fee deductions or host payouts.
   - Includes period-over-period delta calculation (e.g., `+14.2% vs previous 30 days`).

2. **Platform Fee Revenue**:
   $$\text{Platform Revenue} = \sum \left(\text{total\_rent} \times \frac{\text{platform\_host\_fee\_percent}}{100}\right)$$
   - Tracks actual realized revenue from the dynamic host platform fee (default 5%, adjustable up to 15%).
   - Displays effective platform take-rate percentage alongside gross dollar volume.

3. **Booking Request-to-Acceptance Rate**:
   $$\text{Acceptance Rate} = \left(\frac{\text{Count of Accepted Bookings}}{\text{Total Requested Bookings}}\right) \times 100$$
   - Monitors host responsiveness and listing conversion efficiency.

4. **Booking Cancellation Rate**:
   $$\text{Cancellation Rate} = \left(\frac{\text{Count of Cancelled Bookings}}{\text{Total Confirmed Bookings}}\right) \times 100$$
   - Flags market friction or housing mismatches before assignment start dates.

5. **Average Length of Stay (ALOS)**:
   $$\text{ALOS} = \text{AVG}(\text{end\_date} - \text{start\_date}) \quad \text{across confirmed bookings}$$
   - Displays typical clinician assignment duration (e.g., `91.4 days` / `13.1 weeks`).

6. **Demand-Without-Inventory Tracking ("Zero-Inventory Engine")**:
   - Every time a clinician executes a hospital search (`GET /api/listings/search`), a background entry is recorded in `search_demand_logs`:
     `hospital_name`, `city`, `state`, `latitude`, `longitude`, `radius_miles`, `duration_weeks`, `results_count`, `is_zero_inventory`.
   - Aggregation query:
     ```sql
     SELECT hospital_name, city, state, 
            COUNT(*) as total_searches,
            COUNT(*) FILTER (WHERE results_count = 0) as zero_inventory_searches,
            ROUND(COUNT(*) FILTER (WHERE results_count = 0)::numeric / COUNT(*) * 100, 1) as unmet_demand_rate,
            MAX(searched_at) as last_searched_at
     FROM search_demand_logs
     WHERE searched_at BETWEEN $1 AND $2
     GROUP BY hospital_name, city, state
     HAVING COUNT(*) FILTER (WHERE results_count = 0) > 0
     ORDER BY zero_inventory_searches DESC
     LIMIT 25;
     ```
   - Directly informs host recruitment and regulatory state expansion priorities by highlighting the exact healthcare facilities where nurses want housing but no units are available.

### B. User Interface & Presentation in Admin Portal

- **Executive KPI Strip**: Clean 5-card layout with high-contrast tabular typography:
  - `Gross Booking Value (GBV)`
  - `Platform Revenue (5%)`
  - `Acceptance Rate (%)`
  - `Cancellation Rate (%)`
  - `Average Stay Duration (Weeks)`
- **Interactive Controls**:
  - Date Range Selector (`Last 30 Days`, `Last 90 Days`, `Year to Date`, `All Time`).
  - Territory / State Filter (`All Active States`, `NC`, `MD`, `CT`, `ND`, `KS`, or newly launched territories).
  - "Export Analytics CSV" button for offline accounting and stakeholder reporting.
- **Demand-Without-Inventory Command Table**:
  - Medical Center Name & Health System
  - City & State
  - Total Nurse Inquiries
  - Unmet Demand Rate (%)
  - One-click action: "Initiate Host Outreach" to trigger targeted property recruitment near that hospital.
- **Revenue & Booking Volume Visual Graph**: High-fidelity monthly trends bar chart illustrating GBV progression alongside net platform revenue.

---

## 3. Comprehensive System Architecture & Detailed Flows

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Nurses Pillow Web Client                                 │
│  ┌───────────────────────┬──────────────────────┬──────────────────────┬────────────┐  │
│  │     Nurse Portal      │    Host Operations   │   Messages Center    │Admin Desk  │  │
│  │ - Current/Past Stays  │ - Multi-Room Cal.    │ - Threaded Chat      │-BI / GBV   │  │
│  │ - 30-Day Ext. Quote   │ - Guest Roster       │ - Unread Indicators  │-Fee Slider │  │
│  │ - Saved Pillows       │ - Arrival Guide      │ - Block Guards       │-Zero-Inv BI│  │
│  │ - Billing / Receipts  │ - Stripe Connect     │ - Offline Email Dig. │-Promos     │  │
│  └───────────┬───────────┴──────────┬───────────┴──────────┬───────────┴─────┬──────┘  │
└──────────────┼──────────────────────┼──────────────────────┼─────────────────┼─────────┘
               │                      │                      │                 │
               ▼                      ▼                      ▼                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Express Application Server & Middleware                         │
│  ┌────────────────────────┬───────────────────────┬─────────────────────────────────┐  │
│  │ RBAC & Suspension Guard│ Rate Limiting & Auth  │ GCS Signed URL Asset Service    │  │
│  └────────────────────────┴───────────────────────┴─────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Core Endpoints:                                                                  │  │
│  │  • /api/admin/analytics (GBV, Revenue, Conversion, Zero-Inventory Report)        │  │
│  │  • /api/nurse/stays, /api/bookings/:id/extensions, /api/nurse/saved-pillows       │  │
│  │  • /api/host/dashboard-summary, /api/host/listings/:id/calendar, /api/host/guests│  │
│  │  • /api/messages/threads, /api/safety/reports, /api/reviews                      │  │
│  │  • /api/admin/settings/platform-fee, /api/admin/promos                           │  │
│  │  • /api/webhooks/stripe, /api/webhooks/postmark                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ NotificationDispatcher: 13 Event Keys · Email (Postmark) · Push · In-App Alerts │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database (Railway Instance)                          │
│  - search_demand_logs       - platform_settings (0-15%) - message_threads              │
│  - calendar_blocks          - fee_change_logs           - messages                     │
│  - stay_extensions          - promo_codes & redemptions - reviews (2-way)              │
│  - saved_listings (pillows) - notification_templates    - safety_reports               │
│  - user_blocks              - in_app_notifications      - support_tickets & msgs       │
│  - organizations (B2B ready)- clinician_matching        - roommate_matching_profiles   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Other Milestone 2 Subsystem Specifications

### A. Edge Middleware, RBAC & Account Suspension Guards
- **Un-Gated Route Namespaces**: Unlock `/nurse/dashboard/*`, `/host/dashboard/*`, `/host/earnings/*`, `/messages/*`, `/support/*`, `/reviews/*`, `/admin/analytics/*`, `/admin/fees/*`, `/admin/promos/*`, `/admin/moderation/*`.
- **Account Suspension Enforcement**: Query `users.is_suspended`. If `true`, intercept request and return `403 Forbidden` with a locked account modal notice. Admin suspension sets listings `is_published = false`, cancels uncaptured booking holds, and fires `account_suspended` email.
- **Staging Protection**: HTTP Basic Authentication (`STAGING_USER` / `STAGING_PASSWORD`) and anti-crawler headers (`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`).

### B. Database Schema Extensions (Milestone 2 + Phase 2 B2B Readiness)
- Alter `users` table: `avatar_gcs_key`, `is_suspended`, `suspension_reason`, `suspended_at`, `marketing_opt_in`, `referral_code`, `referred_by_user_id`, `organization_id`.
- Phase 2 readiness tables: `organizations`, `clinician_matching_profiles`, `roommate_matching_profiles`, `listing_gap_rules`.
- Operational tables: `calendar_blocks`, `stay_extensions`, `saved_listings`, `user_blocks`, `message_threads`, `messages`, `reviews`, `safety_reports`, `support_tickets`, `support_ticket_messages`, `platform_settings`, `fee_change_logs`, `promo_codes`, `promo_code_redemptions`, `notification_templates`, `in_app_notifications`, `user_fcm_tokens`, `search_demand_logs`.
- Alter `bookings` table: `promo_code_id`, `discount_amount`, `arrival_instructions`, `payout_held`, `postmark_last_message_id`, `postmark_delivered_at`.

### C. Google Cloud Storage (GCS) Asset Service
- 4 storage partitions: `listings/`, `avatars/`, `support/` (15-min signed read URLs), and `verifications/` (purged immediately upon admin approval).
- Endpoints: `POST /api/storage/signed-upload-url` ($\le 10\text{MB}$ validation) and `GET /api/storage/signed-read-url`.
- Includes reliable local filesystem proxy fallback for preview environments.

### D. Traveler / Nurse Portal Features
- **Stay Management (`GET /api/nurse/stays`)**: Privacy gating (full address & lockbox codes visible only for `accepted`, `paid`, or `active` bookings). 4-step status indicator: `Requested` $\rightarrow$ `Accepted` $\rightarrow$ `Paid` $\rightarrow$ `Upcoming`.
- **30-Day Stay Extensions**: Prorated daily rent calculation ($\text{Monthly} / 30 \times \text{Days}$), Stripe manual authorization hold, host decision workflow (`POST /api/host/extensions/:extensionId/decide`).
- **Saved Pillows**: Bookmark favorite accommodations with live hospital commute distances.
- **Verification Center**: Phone verification, biometric verification, and professional credential status with `document_purged = true` security banner.
- **Receipts & Invoices**: Itemized PDF receipts and "Book Again" pre-filled checkout.

### E. Host Operations & Financial Portal
- **Dashboard Summary**: Occupancy %, pending booking requests, pending extensions, 7-day arrivals, and unread messages.
- **Multi-Room Calendar**: Independent room-by-room calendar blocks and seasonal rate overrides.
- **Guest Roster**: Verified Trust Breakdown Cards and one-click arrival instructions editor.
- **Stripe Connect Express Earnings**: Real-time breakdown of Gross Earnings, Platform Fee Deducted (default 5%), and Net Host Payout (~95%), with payout hold flags.

### F. In-App Messaging & Offline Email Digests
- Text-only conversation threads, read receipts, and user block security checks (`403 Forbidden`).
- 5-minute unread message background worker dispatching Postmark email digests.

### G. Notification Engine & 13 Event Keys
- Unified `NotificationDispatcher` supporting dynamic templates, variable interpolation, and multi-channel delivery across In-App, Push (FCM), and Email (Postmark).
- 13 Event Keys: `move_in_reminder`, `arrival_instructions`, `new_message`, `extension_requested`, `extension_approved`, `extension_declined`, `refund_processed`, `payout_sent`, `payout_on_hold`, `review_request`, `support_ticket_update`, `account_suspended`, `fee_change_notice`.

### H. Trust, Two-Way Reviews & Support Desk
- Completed-stay reviews eligible only after checkout date; symmetrical 1–5 star ratings and reviews.
- Safety incident reporting and mutual user blocking.
- 7-category support ticket desk with ticket lifecycles and admin replies.

### I. Super-Admin Portal: Dynamic Fee Slider & Promo Engine
- Dynamic host fee slider (0.00% to 15.00% strict platform cap) with live payout impact simulation on a $2,000 reservation.
- Promo code generator and checkout validation endpoint (`/api/checkout/validate-promo`).

### J. Webhooks & Background Cron Jobs
- Stripe webhooks: `payout.paid`, `payout.failed`, `charge.dispute.created`, `charge.refunded`.
- Postmark webhooks: `Delivery`, `Bounce`, `SpamComplaint`.
- Cron jobs: Daily 09:00 move-in reminders, Daily 12:00 stay completion prompts, Hourly booking expiry cleanup, and 5-minute unread message digests.

---

## 5. Implementation Steps & Execution Plan

1. **Step 1: Database Migration**:
   - Run `server/migrations/milestone2.sql` to provision all tables including `search_demand_logs`, analytics indexes, and platform settings.
2. **Step 2: Backend Analytics & Operational Services**:
   - Implement `GET /api/admin/analytics` computing GBV, platform revenue, conversion rates, and zero-inventory demand reports.
   - Implement stay extension workflows, host calendar endpoints, messaging, and notification dispatcher.
3. **Step 3: Frontend Views & Navigation Integration**:
   - Un-gate RBAC routing in `src/App.tsx` and add dedicated "Messages" tab.
   - Enhance the Admin Portal with the complete **Marketplace Analytics & Zero-Inventory Intelligence Dashboard** (KPI strip, date/territory filters, trend charts, and demand tables).
   - Integrate Nurse Stay Management, Host Operations, Messaging Center, and Support Desk.
4. **Step 4: Quality Verification & Testing**:
   - Verify financial and analytics calculation tests, type checking (`tsc --noEmit`), and full application build.
