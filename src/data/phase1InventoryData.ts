export interface InventoryScreen {
  id: string;
  name: string;
  role: 'All' | 'Nurse' | 'Host' | 'Admin' | 'Nurse / Host';
  milestone: 'M1' | 'M2' | 'M3';
  buildTier?: 'T1' | 'T2' | 'T3' | 'T4';
  priority: 'Must' | 'Should' | 'Could';
  flag?: string;
  category: 'Public, Marketing & Legal' | 'Authentication' | 'Nurse (Traveler)' | 'Shared' | 'Host' | 'Admin / Operations' | 'Mobile Apps';
  platform: 'Web' | 'Mobile' | 'Both';
  description: string;
  appTab?: string;
}

export function getScreenBuildTier(screen: InventoryScreen): 'T1' | 'T2' | 'T3' | 'T4' {
  if (screen.buildTier) return screen.buildTier;
  if (screen.platform === 'Mobile' || screen.category === 'Mobile Apps' || screen.id.startsWith('M-')) {
    return 'T4';
  }
  const idLower = screen.id.toLowerCase();
  const nameLower = screen.name.toLowerCase();
  const descLower = screen.description.toLowerCase();
  if (
    idLower.startsWith('nv-') ||
    idLower.startsWith('hv-') ||
    nameLower.includes('verification') ||
    nameLower.includes('checkout') ||
    nameLower.includes('stripe') ||
    nameLower.includes('payout') ||
    nameLower.includes('refund') ||
    descLower.includes('stripe')
  ) {
    return 'T2';
  }
  if (
    screen.category === 'Admin / Operations' ||
    idLower.startsWith('a-') ||
    nameLower.includes('dashboard') ||
    nameLower.includes('inbox') ||
    nameLower.includes('analytics') ||
    nameLower.includes('dispute')
  ) {
    return 'T3';
  }
  return 'T1';
}

export interface EndToEndFlow {
  id: string;
  name: string;
  role: string;
  milestone: 'M1' | 'M2' | 'M3';
  trigger: string;
  steps: string[];
  ending: string;
  notes: string;
}

export interface NotificationTemplateRecord {
  id: string;
  event: string;
  recipient: 'Nurse' | 'Host' | 'All' | 'Nurse or Host' | 'Nurse + Host';
  channels: string[];
  milestone: 'M1' | 'M2';
  subject: string;
  sampleBody: string;
}

export interface CrossCuttingStateItem {
  id: string;
  state: string;
  treatment: string;
  rule: string;
}

export const PHASE_1_SCREENS: InventoryScreen[] = [
  // Public, Marketing & Legal Pages (15)
  { id: 'P-01', name: 'Coming soon / launch page', role: 'All', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Early sign-up and teaser landing for travel nurses and hospital host partners.', appTab: 'find-housing' },
  { id: 'P-02', name: 'Marketing home (post-launch)', role: 'All', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Primary homepage featuring hospital-first search, sanctuary pillars, and featured stays.', appTab: 'find-housing' },
  { id: 'P-03', name: 'Become a host landing', role: 'Host', milestone: 'M2', priority: 'Should', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Landing page highlighting verified clinician guests, flex protections, and zero vacancy.', appTab: 'for-hosts' },
  { id: 'P-04', name: 'How verification works', role: 'All', milestone: 'M2', priority: 'Should', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Explanation of Nursys license cross-checks, background verifications, and hospital badge requirements.', appTab: 'how-it-works' },
  { id: 'P-05', name: 'Terms of Service', role: 'All', milestone: 'M1', priority: 'Must', flag: '⏳ legal review', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Core user agreement incorporating North Carolina lodging rules and clinical housing exemptions.', appTab: 'legal-policies' },
  { id: 'P-06', name: 'Privacy Policy', role: 'All', milestone: 'M1', priority: 'Must', flag: '⏳ pending attorney', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Clinical data handling, HIPAA-adjacent safety, and license record purging.', appTab: 'legal-policies' },
  { id: 'P-07', name: 'Cancellation & refund policy', role: 'All', milestone: 'M1', priority: 'Must', flag: '✅ configured', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Full tiers: Flexible (30d), Moderate (60d), Strict (90d), with 24-hr grace period and hospital flex clause.', appTab: 'legal-policies' },
  { id: 'P-08', name: 'Host agreement / host standards', role: 'Host', milestone: 'M1', priority: 'Must', flag: '⏳ pending attorney', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Sanctuary noise caps (≤35dB), 100% blackout blinds, sanitization standards, and Stripe terms.', appTab: 'legal-policies' },
  { id: 'P-09', name: 'State disclosures (North Carolina)', role: 'All', milestone: 'M1', priority: 'Must', flag: '⏳ pending attorney', category: 'Public, Marketing & Legal', platform: 'Web', description: 'NC Vacation Rental Act G.S. § 42A carve-outs for mid-term medical temporary housing.', appTab: 'legal-policies' },
  { id: 'P-10', name: 'Help centre / FAQ', role: 'All', milestone: 'M2', priority: 'Should', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Searchable answers for contracts, stipends, deposits, keyless check-in, and night shift quiet hours.', appTab: 'how-it-works' },
  { id: 'P-11', name: 'Contact / support entry', role: 'All', milestone: 'M2', priority: 'Should', category: 'Public, Marketing & Legal', platform: 'Web', description: '24/7 Support dispatch and help ticket submission.', appTab: 'nurse-support' },
  { id: 'P-12', name: '404 not found', role: 'All', milestone: 'M1', priority: 'Must', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Sanctuary listing or page not found, with direct hospital search recovery.', appTab: 'system-status' },
  { id: 'P-13', name: '500 / unexpected error', role: 'All', milestone: 'M1', priority: 'Must', category: 'Public, Marketing & Legal', platform: 'Web', description: 'System fault page with auto-generated incident ID and one-click refresh.', appTab: 'system-status' },
  { id: 'P-14', name: 'Maintenance / scheduled downtime', role: 'All', milestone: 'M1', priority: 'Could', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Notice for off-peak database or security rule maintenance.', appTab: 'system-status' },
  { id: 'P-15', name: 'Account suspended notice', role: 'All', milestone: 'M2', priority: 'Should', category: 'Public, Marketing & Legal', platform: 'Web', description: 'Notice explaining account suspension, reason code, and appeal avenue.', appTab: 'system-status' },

  // Authentication (8)
  { id: 'AU-01', name: 'Sign up — role selection', role: 'All', milestone: 'M1', priority: 'Must', category: 'Authentication', platform: 'Both', description: 'Choose between Traveling Healthcare Professional or Sanctuary Property Host.', appTab: 'auth' },
  { id: 'AU-02', name: 'Sign up — create account', role: 'All', milestone: 'M1', priority: 'Must', category: 'Authentication', platform: 'Both', description: 'Name, email, password, and professional badge preview.', appTab: 'auth' },
  { id: 'AU-03', name: 'Log in', role: 'All', milestone: 'M1', priority: 'Must', category: 'Authentication', platform: 'Both', description: 'Credential login with quick role switching and secure remember-me.', appTab: 'auth' },
  { id: 'AU-04', name: 'Forgot password — request', role: 'All', milestone: 'M1', priority: 'Must', category: 'Authentication', platform: 'Both', description: 'Send password reset link via Postmark transactional delivery.', appTab: 'auth' },
  { id: 'AU-05', name: 'Reset password — set new', role: 'All', milestone: 'M1', priority: 'Must', category: 'Authentication', platform: 'Both', description: 'Set new secure password meeting health platform entropy rules.', appTab: 'auth' },
  { id: 'AU-06', name: 'Email verification landing', role: 'All', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Authentication', platform: 'Both', description: 'Postmark transactional email verification with 6-digit confirmation pin.', appTab: 'email-verification' },
  { id: 'AU-07', name: 'Phone verification (SMS OTP)', role: 'All', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Authentication', platform: 'Both', description: 'Twilio SMS OTP verification to safeguard against fraudulent inquiries.', appTab: 'phone-verification' },
  { id: 'AU-08', name: 'Session expired / re-auth', role: 'All', milestone: 'M2', priority: 'Could', category: 'Authentication', platform: 'Both', description: 'Quick re-authentication modal preserving active search or booking draft.', appTab: 'auth' },

  // Nurse (Traveler) (41)
  { id: 'NV-01', name: 'Verification hub', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Four-stage credentialing tracker: Identity, Contact, Clinical License, Work Contract.', appTab: 'verification' },
  { id: 'NV-02', name: 'Identity verification handoff', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Government ID & SSN verification handoff with automated OCR intake.', appTab: 'verification' },
  { id: 'NV-03', name: 'Healthcare professional verification', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Nursys license lookup, license number, state board, and PDF upload.', appTab: 'verification' },
  { id: 'NV-04', name: 'Verification pending review', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Holding state while admin completes manual state board registry check (average 2h).', appTab: 'verification' },
  { id: 'NV-05', name: 'Verification action needed', role: 'Nurse', milestone: 'M1', priority: 'Must', category: 'Nurse (Traveler)', platform: 'Both', description: 'Alert state when document legibility or license expiration requires re-upload.', appTab: 'verification' },
  { id: 'NV-06', name: 'Verification approved', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'RN Verified Badge celebration and unlock of uninhibited booking requests.', appTab: 'verification' },

  { id: 'NS-01', name: 'Search home (Assignment Card)', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'The signature hero search card: Hospital name, contract start/end dates, commute radius.', appTab: 'find-housing' },
  { id: 'NS-02', name: 'Hospital autocomplete panel', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Verified health systems directory with instant typing suggestions & trauma levels.', appTab: 'find-housing' },
  { id: 'NS-03', name: 'Hospital not found', role: 'Nurse', milestone: 'M1', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Custom hospital request entry with geo-coordinates fallback and support alert.', appTab: 'search-listings' },
  { id: 'NS-04', name: 'Search results — list + map', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Interactive split-view: hospital commute badges, live pricing pins, and sanctuary filters.', appTab: 'search-listings' },
  { id: 'NS-05', name: 'Filters panel / bottom sheet', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Blackout drapes guarantee, noise cap ≤35dB, scrub washer, and pet friendliness.', appTab: 'search-listings' },
  { id: 'NS-06', name: 'Map full view (mobile)', role: 'Nurse', milestone: 'M1', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Mobile', description: 'Fullscreen touch-optimized map with swipeable listing teaser cards.', appTab: 'mobile-preview' },
  { id: 'NS-07', name: 'Listing detail — entire home', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Complete sanctuary view: day-sleeper rating, verified commute, full photo gallery.', appTab: 'find-housing' },
  { id: 'NS-08', name: 'Listing detail — room in property', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Private suite with lock, shared scrub washer, and housemate clinician quiet rules.', appTab: 'find-housing' },
  { id: 'NS-09', name: 'Photo gallery / lightbox', role: 'Nurse', milestone: 'M1', priority: 'Should', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'High-resolution lightbox showing bedroom blackout coverage and workstation setup.', appTab: 'find-housing' },
  { id: 'NS-10', name: 'Host public profile', role: 'Nurse', milestone: 'M2', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Host verification badge, response time, nurse ratings, and property portfolio.', appTab: 'for-hosts' },
  { id: 'NS-11', name: 'Saved Pillows (favourites)', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Saved listings collection grouped by hospital assignment for side-by-side comparison.', appTab: 'nurse-dashboard' },

  { id: 'NB-01', name: 'Booking request / checkout', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Itemized 13-week stay charges, $0 traveler fee highlight, and host message.', appTab: 'find-housing' },
  { id: 'NB-02', name: 'Payment method entry', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Stripe card or bank debit authorization (charges capture on host acceptance).', appTab: 'find-housing' },
  { id: 'NB-03', name: 'Deposit explainer', role: 'Nurse', milestone: 'M1', priority: 'Should', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Clear breakdown of escrow security deposit handling and automatic 7-day post-checkout return.', appTab: 'find-housing' },
  { id: 'NB-04', name: 'Booking request confirmation', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Celebratory confirmation showing 24h host deadline and booking request reference.', appTab: 'nurse-dashboard' },
  { id: 'NB-05', name: 'Booking detail — requested', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Countdown timer to host response with options to modify or withdraw without penalty.', appTab: 'nurse-dashboard' },
  { id: 'NB-06', name: 'Booking detail — accepted / paid', role: 'Nurse', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Confirmed reservation with keyless lock code countdown and arrival instructions.', appTab: 'nurse-dashboard' },
  { id: 'NB-07', name: 'Booking detail — active stay', role: 'Nurse', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Door code, Wi-Fi details, host direct chat, and 24/7 support panic button.', appTab: 'nurse-dashboard' },
  { id: 'NB-08', name: 'Booking detail — completed', role: 'Nurse', milestone: 'M2', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Past stay history, deposit return confirmation, and review invitation.', appTab: 'nurse-dashboard' },
  { id: 'NB-09', name: 'Extend my stay — request', role: 'Nurse', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'One-click assignment contract extension request with matching stipend pricing.', appTab: 'nurse-dashboard' },
  { id: 'NB-10', name: 'Extend my stay — payment & confirmation', role: 'Nurse', milestone: 'M2', priority: 'Must', category: 'Nurse (Traveler)', platform: 'Both', description: 'Prorated monthly rent capture and updated checkout date synchronization.', appTab: 'nurse-dashboard' },
  { id: 'NB-11', name: 'Cancel booking — policy preview', role: 'Nurse', milestone: 'M1', priority: 'Must', category: 'Nurse (Traveler)', platform: 'Both', description: 'Policy engine calculating exact refund amount based on Flexible/Moderate/Strict tier.', appTab: 'nurse-dashboard' },
  { id: 'NB-12', name: 'Cancel booking — confirm & result', role: 'Nurse', milestone: 'M1', priority: 'Must', category: 'Nurse (Traveler)', platform: 'Both', description: 'Confirmation of reservation release and automatic Stripe refund dispatch.', appTab: 'nurse-dashboard' },
  { id: 'NB-13', name: 'Refund status', role: 'Nurse', milestone: 'M2', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Stripe refund tracking timeline showing bank deposit ETA (5-10 business days).', appTab: 'nurse-dashboard' },
  { id: 'NB-14', name: 'Report a move-in problem', role: 'Nurse', milestone: 'M2', priority: 'Must', category: 'Nurse (Traveler)', platform: 'Both', description: '24-hour move-in guarantee: report noise issues, missing blackout curtains, or cleanliness.', appTab: 'nurse-support' },
  { id: 'NB-15', name: 'Book again (repeat booking)', role: 'Nurse', milestone: 'M2', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Instant rebooking flow for traveling clinicians returning to a favorite hospital.', appTab: 'nurse-dashboard' },
  { id: 'NB-16', name: 'Receipts list', role: 'Nurse', milestone: 'M2', priority: 'Should', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'All tax and agency stipend expense receipts formatted for travel agency reimbursement.', appTab: 'nurse-dashboard' },
  { id: 'NB-17', name: 'Receipt detail', role: 'Nurse', milestone: 'M2', priority: 'Should', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Detailed PDF-ready receipt with hospital distance, contract weeks, and itemized rent.', appTab: 'nurse-dashboard' },

  { id: 'ND-01', name: 'Nurse dashboard', role: 'Nurse', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Nurse (Traveler)', platform: 'Both', description: 'Central hub: Active sanctuary, upcoming shift commute, keyless entry, and support.', appTab: 'nurse-dashboard' },
  { id: 'ND-02', name: 'Leave a review', role: 'Nurse', milestone: 'M2', priority: 'Must', category: 'Nurse (Traveler)', platform: 'Both', description: 'Rate daytime sleep quality, noise isolation, blackout performance, and host responsiveness.', appTab: 'nurse-dashboard' },
  { id: 'ND-03', name: 'My reviews', role: 'Nurse', milestone: 'M2', priority: 'Could', category: 'Nurse (Traveler)', platform: 'Both', description: 'Reviews given to properties and positive clinician badges awarded by hosts.', appTab: 'nurse-dashboard' },
  { id: 'ND-04', name: 'Profile & account settings', role: 'Nurse', milestone: 'M2', priority: 'Must', category: 'Nurse (Traveler)', platform: 'Both', description: 'Specialty, shift preference (Day/Night/Rotating), emergency contact, and agency info.', appTab: 'nurse-dashboard' },
  { id: 'ND-05', name: 'Notification preferences', role: 'Nurse', milestone: 'M2', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Configure SMS, Email, and Push alerts for booking updates and shift reminders.', appTab: 'nurse-dashboard' },
  { id: 'ND-06', name: 'Change email / password', role: 'Nurse', milestone: 'M2', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Update login credentials with security verification prompts.', appTab: 'auth' },
  { id: 'ND-07', name: 'Delete or deactivate account', role: 'Nurse', milestone: 'M2', priority: 'Should', category: 'Nurse (Traveler)', platform: 'Both', description: 'Account closure with full data purging compliant with medical privacy standards.', appTab: 'nurse-dashboard' },

  // Shared — Messaging, Notifications & Support (9)
  { id: 'MS-01', name: 'Messages — inbox', role: 'Nurse / Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Shared', platform: 'Both', description: 'Direct conversations between verified nurses and sanctuary hosts.', appTab: 'nurse-dashboard' },
  { id: 'MS-02', name: 'Message thread', role: 'Nurse / Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Shared', platform: 'Both', description: 'Thread view with quick actions (Send directions, confirm door code, request quiet hours).', appTab: 'nurse-dashboard' },
  { id: 'MS-03', name: 'Notifications centre', role: 'Nurse / Host', milestone: 'M2', priority: 'Must', category: 'Shared', platform: 'Both', description: 'Chronological feed of booking requests, payment confirmations, and shift reminders.', appTab: 'nurse-dashboard' },
  { id: 'MS-04', name: 'Support — create ticket', role: 'All', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Shared', platform: 'Both', description: 'Submit urgent clinical support tickets across seven standard scope categories.', appTab: 'nurse-support' },
  { id: 'MS-05', name: 'Support — my tickets', role: 'All', milestone: 'M2', priority: 'Must', category: 'Shared', platform: 'Both', description: 'List of active and resolved support support requests.', appTab: 'nurse-support' },
  { id: 'MS-06', name: 'Support — ticket thread', role: 'All', milestone: 'M2', priority: 'Must', category: 'Shared', platform: 'Both', description: 'Live dialogue with 24/7 Clinical Shift Support agent.', appTab: 'nurse-support' },
  { id: 'MS-07', name: 'Report host / guest / listing', role: 'All', milestone: 'M2', priority: 'Must', category: 'Shared', platform: 'Both', description: 'Flag violations of sanctuary rules, safety concerns, or misrepresentation.', appTab: 'nurse-support' },
  { id: 'MS-08', name: 'Block user', role: 'All', milestone: 'M2', priority: 'Should', category: 'Shared', platform: 'Both', description: 'Prevent unwanted communication or booking requests from a specific user.', appTab: 'nurse-dashboard' },
  { id: 'MS-09', name: 'Safety information', role: 'All', milestone: 'M2', priority: 'Should', category: 'Shared', platform: 'Both', description: 'Clinical emergency contacts, local hospital security dispatch, and 24/7 hotline.', appTab: 'nurse-support' },

  // Host (35)
  { id: 'HO-01', name: 'Host welcome / onboarding', role: 'Host', milestone: 'M1', priority: 'Should', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Host intro highlighting 13-week mid-term travelers, reliable payouts, and low turnover.', appTab: 'for-hosts' },
  { id: 'HO-02', name: 'Host identity verification', role: 'Host', milestone: 'M1', priority: 'Must', category: 'Host', platform: 'Both', description: 'Government ID verification to verify ownership or leaseholder rights.', appTab: 'for-hosts' },
  { id: 'HO-03', name: 'Authority-to-list verification', role: 'Host', milestone: 'M1', priority: 'Must', category: 'Host', platform: 'Both', description: 'Property deed or landlord sublease authorization review.', appTab: 'for-hosts' },
  { id: 'HO-04', name: 'Stripe Connect onboarding handoff', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Express Stripe onboarding for direct bank deposits and automatic payouts.', appTab: 'host-dashboard' },
  { id: 'HO-05', name: 'Stripe return / refresh landing', role: 'Host', milestone: 'M1', priority: 'Must', category: 'Host', platform: 'Both', description: 'Return landing verifying connected payout account status.', appTab: 'host-dashboard' },
  { id: 'HO-06', name: 'Payout account status', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Bank account routing status, next scheduled payout, and balance.', appTab: 'host-dashboard' },

  { id: 'HL-01', name: 'Add listing — property type', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Choose Entire Home, Guest Suite, or Private Room in house.', appTab: 'host-dashboard' },
  { id: 'HL-02', name: 'Add listing — address & map', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Address entry with automated hospital proximity and drive-time calculation.', appTab: 'host-dashboard' },
  { id: 'HL-03', name: 'Add listing — photos', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Photo upload with tagging: Bedroom, Blackout drapes, Work desk, Scrub washer.', appTab: 'host-dashboard' },
  { id: 'HL-04', name: 'Add listing — rooms setup', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Configure multi-room properties with individual room calendars and rates.', appTab: 'host-dashboard' },
  { id: 'HL-05', name: 'Add listing — pricing & fees', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Monthly rate, cleaning fee, refundable deposit, and contract duration rules.', appTab: 'host-dashboard' },
  { id: 'HL-06', name: 'Add listing — amenities', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Checklist of day-sleeper essentials: Blackout blinds, white noise, quiet HVAC.', appTab: 'host-dashboard' },
  { id: 'HL-07', name: 'Add listing — rules & description', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Daytime quiet hours (8 AM - 6 PM), pet policy, and clinician sanctuary pledge.', appTab: 'host-dashboard' },
  { id: 'HL-08', name: 'Add listing — availability', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Calendar block dates and sync with iCal / travel nurse contract cycles.', appTab: 'host-dashboard' },
  { id: 'HL-09', name: 'Add listing — review & submit', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Final check before sending listing into admin moderation queue.', appTab: 'host-dashboard' },
  { id: 'HL-10', name: 'Listing pending verification', role: 'Host', milestone: 'M1', priority: 'Must', category: 'Host', platform: 'Both', description: 'Host waiting screen while admin verifies property address and noise compliance.', appTab: 'host-dashboard' },
  { id: 'HL-11', name: 'Listing action needed / rejected', role: 'Host', milestone: 'M1', priority: 'Must', category: 'Host', platform: 'Both', description: 'Notification specifying required updates (e.g. upload photo of blackout curtains).', appTab: 'host-dashboard' },
  { id: 'HL-12', name: 'My properties', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Portfolio view of active, pending, and paused sanctuary properties.', appTab: 'host-dashboard' },
  { id: 'HL-13', name: 'Listing detail (host view) / edit', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Edit rates, adjust amenities, toggle listing visibility, and update door codes.', appTab: 'host-dashboard' },
  { id: 'HL-14', name: 'Room management', role: 'Host', milestone: 'M1', priority: 'Must', category: 'Host', platform: 'Both', description: 'Manage pricing and occupancy for individual rooms in a shared clinician home.', appTab: 'host-dashboard' },
  { id: 'HL-15', name: 'Calendar & availability management', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Interactive availability calendar with 13-week contract blocks and manual blocks.', appTab: 'host-dashboard' },

  { id: 'HB-01', name: 'Booking requests inbox', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Incoming requests from verified clinicians with 24-hour expiration countdown.', appTab: 'host-dashboard' },
  { id: 'HB-02', name: 'Booking request detail', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Clinician credential badge, hospital contract, dates, net payout breakdown.', appTab: 'host-dashboard' },
  { id: 'HB-03', name: 'Decline request', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Decline modal with reason tracking (dates unavailable, property maintenance).', appTab: 'host-dashboard' },
  { id: 'HB-04', name: 'Accept request confirmation', role: 'Host', milestone: 'M1', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Acceptance triggers immediate Stripe payment capture and sends check-in packet.', appTab: 'host-dashboard' },
  { id: 'HB-05', name: 'Current guests', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Active resident nurses, stay progress, door code status, and direct message shortcuts.', appTab: 'host-dashboard' },
  { id: 'HB-06', name: 'Upcoming guests', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Confirmed upcoming travelers with move-in dates and prep reminders.', appTab: 'host-dashboard' },
  { id: 'HB-07', name: 'Booking detail (host view)', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Complete booking ledger, Stripe charge IDs, and guest contact details.', appTab: 'host-dashboard' },
  { id: 'HB-08', name: 'Host-initiated cancellation', role: 'Host', milestone: 'M2', priority: 'Must', category: 'Host', platform: 'Both', description: 'Emergency cancellation with automated clinician relocation support alert.', appTab: 'host-dashboard' },
  { id: 'HB-09', name: 'Extension request response', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Approve or decline nurse\'s contract extension request with automatic date lock.', appTab: 'host-dashboard' },
  { id: 'HB-10', name: 'Earnings dashboard', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Monthly revenue metrics, 13-week booking yields, and low-season projections.', appTab: 'host-dashboard' },
  { id: 'HB-11', name: 'Payout history', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Downloadable Stripe payout statements with transfer reference codes.', appTab: 'host-dashboard' },
  { id: 'HB-12', name: 'Property performance', role: 'Host', milestone: 'M2', priority: 'Should', category: 'Host', platform: 'Both', description: 'Occupancy rate, hospital search impression count, and nurse feedback scores.', appTab: 'host-dashboard' },
  { id: 'HB-13', name: 'Reviews received / review a guest', role: 'Host', milestone: 'M2', priority: 'Should', category: 'Host', platform: 'Both', description: 'Host feedback on clinician cleanliness, quiet hours adherence, and respect.', appTab: 'host-dashboard' },
  { id: 'HB-14', name: 'Host profile & settings', role: 'Host', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Host', platform: 'Both', description: 'Host bio, co-host assignments, notification toggles, and fee schedule updates.', appTab: 'host-dashboard' },

  // Admin / Operations (28)
  { id: 'A-01', name: 'Admin login', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Super-admin credentialed access with multi-factor authentication check.', appTab: 'admin-portal' },
  { id: 'A-02', name: 'Admin overview dashboard', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Platform GMV, active 13-week contracts, pending verification queue, and alerts.', appTab: 'admin-portal' },
  { id: 'A-03', name: 'Users list (nurses)', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Searchable roster of registered clinicians, credential status, and hospital affiliation.', appTab: 'admin-portal' },
  { id: 'A-04', name: 'User detail (nurse)', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Clinician profile, verified license, active leases, and support tickets.', appTab: 'admin-portal' },
  { id: 'A-05', name: 'Hosts list', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Directory of approved property hosts, total active listings, and payout standing.', appTab: 'admin-portal' },
  { id: 'A-06', name: 'Host detail', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Host verification documents, properties, payouts, reviews, and compliance notes.', appTab: 'admin-portal' },
  { id: 'A-07', name: 'Verification queue — healthcare', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Prioritized queue for manual state board and Nursys license checks.', appTab: 'admin-portal' },
  { id: 'A-08', name: 'Verification review detail', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Side-by-side view: uploaded license doc vs Nursys official state lookup.', appTab: 'admin-portal' },
  { id: 'A-09', name: 'Document deletion confirmation', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Security modal: permanently purge government IDs & license PDFs once verified.', appTab: 'admin-portal' },
  { id: 'A-10', name: 'Host & property verification queue', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Review new property submissions for blackout standards and noise regulations.', appTab: 'admin-portal' },
  { id: 'A-11', name: 'Listings list & moderation', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Moderate listings, flag pricing anomalies, adjust hospital commute badges.', appTab: 'admin-portal' },
  { id: 'A-12', name: 'Bookings list & detail', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Master ledger of all requested, active, completed, and canceled bookings.', appTab: 'admin-portal' },
  { id: 'A-13', name: 'Payments & transactions', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Stripe payment intents, host transfers, security deposits in escrow, and platform fee splits.', appTab: 'admin-portal' },
  { id: 'A-14', name: 'Refunds & disputes', role: 'Admin', milestone: 'M2', priority: 'Must', category: 'Admin / Operations', platform: 'Web', description: 'Process discretionary refunds and arbitrate move-in condition disputes.', appTab: 'admin-portal' },
  { id: 'A-15', name: 'Payout holds', role: 'Admin', milestone: 'M2', priority: 'Must', category: 'Admin / Operations', platform: 'Web', description: 'Manage administrative holds on host payouts pending safety or dispute investigation.', appTab: 'admin-portal' },
  { id: 'A-16', name: 'Reported content & users', role: 'Admin', milestone: 'M2', priority: 'Must', category: 'Admin / Operations', platform: 'Web', description: 'Triage user reports regarding quiet hour violations, safety, or listing inaccuracies.', appTab: 'admin-portal' },
  { id: 'A-17', name: 'Suspensions', role: 'Admin', milestone: 'M2', priority: 'Must', category: 'Admin / Operations', platform: 'Web', description: 'Enforce temporary or permanent platform bans with audit log logging.', appTab: 'admin-portal' },
  { id: 'A-18', name: 'Support ticket queue', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Inbound help tickets sorted by severity (Clinical Emergency, Check-in, General).', appTab: 'admin-portal' },
  { id: 'A-19', name: 'Support ticket detail', role: 'Admin', milestone: 'M2', priority: 'Must', category: 'Admin / Operations', platform: 'Web', description: 'Ticket resolution workspace with canned responses and internal staff notes.', appTab: 'admin-portal' },
  { id: 'A-20', name: 'Platform fee settings', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Configure host service fee percentage (hard-capped at 15%) and notice generator.', appTab: 'admin-portal' },
  { id: 'A-21', name: 'Promo codes list', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Active traveler discount codes, usage counters, and expiration thresholds.', appTab: 'admin-portal' },
  { id: 'A-22', name: 'Promo code create / edit', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Create nurse recruitment incentives with min contract value requirements.', appTab: 'admin-portal' },
  { id: 'A-23', name: 'Analytics — marketplace', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Conversion funnel, average length of stay (13-week peak), and repeat traveler rate.', appTab: 'admin-portal' },
  { id: 'A-24', name: 'Analytics — hospitals & demand', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Hospitals with high traveler search demand vs supply shortage heatmaps.', appTab: 'admin-portal' },
  { id: 'A-25', name: 'Data export', role: 'Admin', milestone: 'M2', priority: 'Must', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Export CSV / Google Sheets sync for financial and regulatory reporting.', appTab: 'admin-portal' },
  { id: 'A-26', name: 'Notification template management', role: 'Admin', milestone: 'M2', priority: 'Should', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Configure copy and trigger logic for all 25 transactional email and SMS templates.', appTab: 'admin-portal' },
  { id: 'A-27', name: 'Admin users & roles', role: 'Admin', milestone: 'M2', priority: 'Should', category: 'Admin / Operations', platform: 'Web', description: 'Super-admin, Verification Specialist, and support Support agent roles.', appTab: 'admin-portal' },
  { id: 'A-28', name: 'Audit log', role: 'Admin', milestone: 'M2', priority: 'Should', flag: '✅ shipped', category: 'Admin / Operations', platform: 'Web', description: 'Immutable log of document purges, fee modifications, and verification decisions.', appTab: 'admin-portal' },

  // Mobile Apps (M3) (14)
  { id: 'M-01', name: 'App splash & first run', role: 'All', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Mobile app onboarding splash emphasizing quiet, verified clinical housing.', appTab: 'mobile-preview' },
  { id: 'M-02', name: 'Push permission prompt', role: 'All', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Permission prompt explaining shift-critical alerts (door codes, host responses).', appTab: 'mobile-preview' },
  { id: 'M-03', name: 'App auth (login / signup)', role: 'All', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Biometric FaceID / TouchID enabled login and quick sign-up.', appTab: 'mobile-preview' },
  { id: 'M-04', name: 'App search home', role: 'Nurse', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Touch-optimized Assignment Card for fast mobile hospital location entry.', appTab: 'mobile-preview' },
  { id: 'M-05', name: 'App results & map', role: 'Nurse', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Bottom sheet results cards over interactive GPS hospital zone map.', appTab: 'mobile-preview' },
  { id: 'M-06', name: 'App listing detail', role: 'Nurse', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Mobile listing view with photo carousel and floating sticky booking bar.', appTab: 'mobile-preview' },
  { id: 'M-07', name: 'App booking & checkout', role: 'Nurse', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'One-tap Apple Pay / Google Pay / card checkout for 13-week bookings.', appTab: 'mobile-preview' },
  { id: 'M-08', name: 'App bookings list & detail', role: 'Nurse', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Offline-ready keyless lock code display and arrival guide.', appTab: 'mobile-preview' },
  { id: 'M-09', name: 'App requests inbox', role: 'Host', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Push notification action sheet: Accept or Decline incoming traveler requests.', appTab: 'mobile-preview' },
  { id: 'M-10', name: 'App messages', role: 'All', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'In-app chat optimized for quick hospital shift communications.', appTab: 'mobile-preview' },
  { id: 'M-11', name: 'App profile & verification', role: 'All', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'Camera document scanner for license card and contract upload.', appTab: 'mobile-preview' },
  { id: 'M-12', name: 'App offline / no connection', role: 'All', milestone: 'M3', priority: 'Should', category: 'Mobile Apps', platform: 'Mobile', description: 'Offline banner with cached door codes, address, and host contact numbers.', appTab: 'mobile-preview' },
  { id: 'M-13', name: 'Force update / maintenance', role: 'All', milestone: 'M3', priority: 'Could', category: 'Mobile Apps', platform: 'Mobile', description: 'Graceful modal requiring latest app store release for critical security.', appTab: 'mobile-preview' },
  { id: 'M-14', name: 'App store assets', role: 'All', milestone: 'M3', priority: 'Must', category: 'Mobile Apps', platform: 'Mobile', description: 'App Store / Google Play screenshots, promo tiles, and clinical value descriptions.', appTab: 'mobile-preview' },
];

export const PHASE_1_FLOWS: EndToEndFlow[] = [
  {
    id: 'F-01',
    name: 'Nurse signup → verified',
    role: 'Nurse',
    milestone: 'M1',
    trigger: 'New traveler lands on the marketing page',
    steps: ['P-02', 'AU-01', 'AU-02', 'AU-06', 'AU-07', 'NV-01', 'NV-02', 'NV-03', 'NV-04', 'NV-06'],
    ending: 'Verified badge issued — Four verification states must be independently completable',
    notes: 'Demonstrates complete identity, contact, license, and contract verification pipeline.',
  },
  {
    id: 'F-02',
    name: 'Hospital search → booking request',
    role: 'Nurse',
    milestone: 'M1',
    trigger: 'Verified nurse starts a search',
    steps: ['NS-01', 'NS-02', 'NS-04', 'NS-05', 'NS-07/NS-08', 'NB-01', 'NB-02', 'NB-04'],
    ending: 'Request sent, awaiting host — The product\'s core journey — demo this first',
    notes: 'Core assignment card search, commute filters, and transparent checkout.',
  },
  {
    id: 'F-03',
    name: 'Host accepts → payment captured',
    role: 'Host + Nurse',
    milestone: 'M1',
    trigger: 'Host receives a request',
    steps: ['HB-01', 'HB-02', 'HB-04', 'NB-06'],
    ending: 'Booking paid and upcoming — Payment captures on host acceptance, not at request',
    notes: 'Stripe authorization holds capture automatically once host approves.',
  },
  {
    id: 'F-04',
    name: 'Host declines / request expires',
    role: 'Host + Nurse',
    milestone: 'M1',
    trigger: 'Host declines or the window lapses (24 hours)',
    steps: ['HB-01', 'HB-03', 'NB-05'],
    ending: 'Declined / Expired — Payment hold released instantly with no charge to nurse',
    notes: 'Nurse immediately alerted and suggested alternate nearby hospital stays.',
  },
  {
    id: 'F-05',
    name: 'Host onboarding → first listing live',
    role: 'Host',
    milestone: 'M1',
    trigger: 'New host signs up',
    steps: ['AU-01', 'AU-02', 'HO-01', 'HO-02', 'HO-03', 'HO-04', 'HO-05', 'HL-01..HL-09', 'HL-10', 'A-10', 'HL-12'],
    ending: 'Listing published — Listing cannot go live before verification completes',
    notes: 'Guarantees all properties meet day-sleeper noise standards.',
  },
  {
    id: 'F-06',
    name: 'Multi-room property setup',
    role: 'Host',
    milestone: 'M1',
    trigger: 'Host has a house with separately rentable rooms for traveling clinicians',
    steps: ['HL-01', 'HL-02', 'HL-03', 'HL-04', 'HL-05', 'HL-08', 'HL-09', 'HL-14'],
    ending: 'Rooms individually bookable — Each room has its own price, door lock, and calendar',
    notes: 'Enables high-yield housing specifically catering to hospital staffing cohorts.',
  },
  {
    id: 'F-07',
    name: 'Manual verification review',
    role: 'Admin',
    milestone: 'M2',
    trigger: 'Submission lands in the admin credentialing queue',
    steps: ['A-07', 'A-08', 'A-09', 'NV-06 or NV-05'],
    ending: 'Approved or action needed — Official Nursys portal lookup; documents deleted on approval',
    notes: 'Strict HIPAA-adjacent compliance with document auto-purge verification.',
  },
  {
    id: 'F-08',
    name: 'Cancellation & refund',
    role: 'Nurse',
    milestone: 'M1',
    trigger: 'Nurse cancels an accepted or paid booking due to assignment shift',
    steps: ['NB-05/NB-06', 'NB-11', 'NB-12', 'NB-13', 'A-14'],
    ending: 'Refund processed — Policy engine applies the tier automatically; admin only handles exceptions',
    notes: 'Evaluates Flexible (30d), Moderate (60d), or Strict (90d) plus hospital contract flex clause.',
  },
  {
    id: 'F-09',
    name: 'Extend my stay',
    role: 'Nurse + Host',
    milestone: 'M2',
    trigger: 'Assignment contract gets extended by hospital staffing office',
    steps: ['NB-07', 'NB-09', 'HB-09', 'NB-10'],
    ending: 'Booking extended, calendar updated with prorated stipend rate',
    notes: 'Eliminates re-booking friction for nurses extending another 4-13 weeks.',
  },
  {
    id: 'F-10',
    name: 'Move-in problem',
    role: 'Nurse',
    milestone: 'M2',
    trigger: 'Property is unavailable, noisy during daytime sleep, or missing blackout drapes',
    steps: ['NB-07', 'NB-14', 'MS-04', 'A-19', 'A-14', 'A-15'],
    ending: 'Resolved or refunded — Shares the dispute and payout-hold machinery',
    notes: '24/7 Support mobilizes emergency relocation or corrective delivery.',
  },
  {
    id: 'F-11',
    name: 'Repeat booking',
    role: 'Nurse',
    milestone: 'M2',
    trigger: 'Clinician returning to a place that worked well during a prior rotation',
    steps: ['ND-01', 'NB-15', 'NB-01', 'NB-04'],
    ending: 'New request sent to known trusted host',
    notes: 'Fast-tracks checkout with pre-verified credentials and preferred terms.',
  },
  {
    id: 'F-12',
    name: 'Review after stay',
    role: 'Nurse + Host',
    milestone: 'M2',
    trigger: 'Stay completes at the end of the assignment',
    steps: ['NB-08', 'ND-02', 'HB-13'],
    ending: 'Reviews published — Only a completed booking unlocks a review',
    notes: 'Reviews specifically score daytime quiet levels (dB), blackout quality, and cleanliness.',
  },
  {
    id: 'F-13',
    name: 'Messaging',
    role: 'Nurse + Host',
    milestone: 'M2',
    trigger: 'Enquiry or booking conversation about hospital shift hours or parking',
    steps: ['MS-01', 'MS-02'],
    ending: 'Conversation continues — Contact details stay inside the platform',
    notes: 'Text-only Phase 1 messaging protecting privacy and preventing unverified off-platform transactions.',
  },
  {
    id: 'F-14',
    name: 'Support ticket',
    role: 'All',
    milestone: 'M2',
    trigger: 'User hits a problem or asks for support assistance',
    steps: ['MS-04', 'MS-05', 'MS-06', 'A-18', 'A-19'],
    ending: 'Ticket resolved — Seven categories per scope',
    notes: 'Categories: Check-in & Access, Daytime Quiet Hours, Cleaning, Contract Change, Payment, Billing, Safety.',
  },
  {
    id: 'F-15',
    name: 'Safety report → suspension',
    role: 'All + Admin',
    milestone: 'M2',
    trigger: 'User reports a host, guest or listing for safety or rule breach',
    steps: ['MS-07', 'A-16', 'A-17', 'P-15'],
    ending: 'Account or listing suspended pending investigation',
    notes: 'Immediate suspension prevents further bookings while safety team evaluates incident.',
  },
  {
    id: 'F-16',
    name: 'Host payout',
    role: 'Host',
    milestone: 'M2',
    trigger: 'Stay proceeds past move-in verification and Stripe initiates payout',
    steps: ['HB-07', 'HB-11', 'HB-10'],
    ending: 'Payout received — Admin can hold a payout; never redirect it',
    notes: 'Stripe Express direct deposit directly to host verified bank account.',
  },
  {
    id: 'F-17',
    name: 'Fee change with host notice',
    role: 'Admin + Host',
    milestone: 'M2',
    trigger: 'Owner adjusts the host service fee',
    steps: ['A-20', 'MS-03 / Email Notification', 'HB-14'],
    ending: 'New fee applies to future bookings only — Hard-capped at 15%; existing payouts untouched',
    notes: 'Strict system rule: fee changes never apply retroactively.',
  },
  {
    id: 'F-18',
    name: 'Promo code redemption',
    role: 'Nurse + Admin',
    milestone: 'M2',
    trigger: 'Admin issues a nurse incentive code, nurse applies it at checkout',
    steps: ['A-22', 'NB-01', 'NB-04'],
    ending: 'Discount applied at checkout on total reservation value',
    notes: 'Validated against minimum booking duration and expiry date.',
  },
  {
    id: 'F-19',
    name: 'Mobile parity pass',
    role: 'All',
    milestone: 'M3',
    trigger: 'Mobile build evaluation of all core journeys',
    steps: ['M-01', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07', 'M-08 / M-09'],
    ending: 'Apps submitted to both iOS App Store & Google Play',
    notes: 'Ensures 100% functional equivalence across mobile and desktop interfaces.',
  },
];

export const NOTIFICATION_TEMPLATES: NotificationTemplateRecord[] = [
  { id: 'NOTIF-01', event: 'Account created / welcome', recipient: 'Nurse or Host', channels: ['Email'], milestone: 'M1', subject: 'Welcome to Nurses Pillow — Your Clinical Sanctuary Awaits', sampleBody: 'Hi Sarah, welcome to Nurses Pillow. Your account is ready. Complete your clinical verification to unlock seamless 13-week mid-term housing near top hospitals.' },
  { id: 'NOTIF-02', event: 'Verify your email', recipient: 'All', channels: ['Email'], milestone: 'M1', subject: 'Confirm your email address [Verification PIN inside]', sampleBody: 'Please confirm your email address to secure your account. Your single-use verification code is: 489-214.' },
  { id: 'NOTIF-03', event: 'Phone verification code', recipient: 'All', channels: ['SMS'], milestone: 'M1', subject: 'SMS OTP Code', sampleBody: 'NURSES PILLOW: Your phone verification code is 738291. Valid for 10 minutes. Do not share with anyone.' },
  { id: 'NOTIF-04', event: 'Password reset', recipient: 'All', channels: ['Email'], milestone: 'M1', subject: 'Reset your Nurses Pillow password', sampleBody: 'We received a request to reset your password. Click the secure link below to set a new password. If you did not request this, ignore this email.' },
  { id: 'NOTIF-05', event: 'Verification approved', recipient: 'Nurse or Host', channels: ['Email', 'Push', 'In-App'], milestone: 'M1', subject: 'Congratulations! Your RN Clinical Verification is Approved', sampleBody: 'Great news Sarah! Your professional license has been verified against state board records. The RN Verified badge is now active on your profile.' },
  { id: 'NOTIF-06', event: 'Verification rejected / more info needed', recipient: 'Nurse or Host', channels: ['Email', 'Push', 'In-App'], milestone: 'M1', subject: 'Action needed on your Nurses Pillow verification', sampleBody: 'Our credentialing team was unable to confirm your license expiration date from the uploaded scan. Please upload a clear photo of your primary board license card.' },
  { id: 'NOTIF-07', event: 'New booking request', recipient: 'Host', channels: ['Email', 'Push', 'In-App'], milestone: 'M1', subject: 'New 13-Week Booking Request from RN Sarah Jenkins', sampleBody: 'You have received a new booking request for UCSF Mission Bay Sanctuary Suite. Move-in: Oct 15 • 13 Weeks. Payout: $2,800/mo. You have 24 hours to accept or decline.' },
  { id: 'NOTIF-08', event: 'Booking accepted', recipient: 'Nurse', channels: ['Email', 'Push', 'In-App'], milestone: 'M1', subject: 'Pack your scrubs! Your Sanctuary booking has been accepted', sampleBody: 'Host Sarah M. accepted your reservation at UCSF Mission Bay Sanctuary Suite. Your card has been charged for Month 1. Check-in instructions will unlock 48h prior to arrival.' },
  { id: 'NOTIF-09', event: 'Booking declined', recipient: 'Nurse', channels: ['Email', 'Push', 'In-App'], milestone: 'M1', subject: 'Update on your booking request', sampleBody: 'The host was unable to accommodate your selected dates due to a prior commitment. No funds were captured. We found 3 similar sanctuaries within 3 miles of your hospital.' },
  { id: 'NOTIF-10', event: 'Request expired', recipient: 'Nurse + Host', channels: ['Email', 'In-App'], milestone: 'M1', subject: 'Booking request expired (24h window passed)', sampleBody: 'The 24-hour response window for your booking request has lapsed. Payment authorization was released immediately. You may book another verified stay anytime.' },
  { id: 'NOTIF-11', event: 'Payment confirmation / receipt', recipient: 'Nurse', channels: ['Email'], milestone: 'M1', subject: 'Your Nurses Pillow Payment Receipt #NP-94821', sampleBody: 'Thank you for your payment of $3,150.00 (First Month Rent $2,800 + Cleaning Fee $150 + Deposit $200). $0 Traveler Fees applied.' },
  { id: 'NOTIF-12', event: 'Move-in reminder', recipient: 'Nurse', channels: ['Email', 'Push'], milestone: 'M2', subject: 'Move-in is tomorrow! Here are your arrival instructions', sampleBody: 'Your 13-week rotation begins soon! Property address: 450 Mission Bay Blvd. Digital keypad code and Wi-Fi credentials are ready in your Nurse Dashboard.' },
  { id: 'NOTIF-13', event: 'Arrival instructions', recipient: 'Nurse', channels: ['Email', 'Push', 'In-App'], milestone: 'M2', subject: 'Keyless check-in & sanctuary details', sampleBody: 'Welcome to your sanctuary! Front door code: *4821#. Designated covered parking is Spot #14. Blackout shades and white noise machine have been inspected.' },
  { id: 'NOTIF-14', event: 'New message', recipient: 'Nurse or Host', channels: ['Push', 'In-App', 'Email digest'], milestone: 'M2', subject: 'New message regarding your Nurses Pillow stay', sampleBody: 'Sarah M. sent you a message: "Hi! Left some fresh organic coffee beans and extra scrub towels in the hall closet. Rest well!"' },
  { id: 'NOTIF-15', event: 'Extension requested', recipient: 'Host', channels: ['Email', 'Push', 'In-App'], milestone: 'M2', subject: 'Nurse Sarah requested to extend their stay by 4 weeks', sampleBody: 'Travel nurse Sarah has had their hospital contract extended through Dec 15 and requested to stay in your suite. Tap to review and confirm with matching payout.' },
  { id: 'NOTIF-16', event: 'Extension approved / declined', recipient: 'Nurse', channels: ['Email', 'Push', 'In-App'], milestone: 'M2', subject: 'Your stay extension has been confirmed!', sampleBody: 'Host Sarah M. approved your 4-week extension. Your new checkout date is December 15. Pro-rated stipend payment processed.' },
  { id: 'NOTIF-17', event: 'Cancellation confirmation', recipient: 'Nurse + Host', channels: ['Email', 'In-App'], milestone: 'M1', subject: 'Reservation Cancellation Confirmed #NP-94821', sampleBody: 'Your reservation has been canceled per policy terms. Refund of $2,800.00 will appear on your original payment method in 5-10 business days.' },
  { id: 'NOTIF-18', event: 'Refund processed', recipient: 'Nurse', channels: ['Email'], milestone: 'M2', subject: 'Stripe Refund Processed — $2,800.00', sampleBody: 'Your refund has been initiated through Stripe. Reference ID: re_3NtXk294821. Funds typically settle within 5 to 10 banking days.' },
  { id: 'NOTIF-19', event: 'Payout sent', recipient: 'Host', channels: ['Email', 'In-App'], milestone: 'M2', subject: 'Stripe Transfer Dispatched — $2,520.00 Payout', sampleBody: 'Your payout of $2,520.00 for Booking #NP-94821 has been transferred to your connected bank account via Stripe Connect Express.' },
  { id: 'NOTIF-20', event: 'Payout on hold', recipient: 'Host', channels: ['Email', 'In-App'], milestone: 'M2', subject: 'Important notice regarding your upcoming payout', sampleBody: 'A temporary payout hold has been placed on Booking #NP-94821 while our support resolves a daytime quiet hours check-in report. Our team will contact you shortly.' },
  { id: 'NOTIF-21', event: 'Review request', recipient: 'Nurse + Host', channels: ['Email', 'Push'], milestone: 'M2', subject: 'How was your rotation stay? Share feedback with fellow nurses', sampleBody: 'Your 13-week stay at Mission Bay Sanctuary has concluded. Please take 60 seconds to review the sleep environment, blackout shades, and host communication.' },
  { id: 'NOTIF-22', event: 'Listing approved / rejected', recipient: 'Host', channels: ['Email', 'In-App'], milestone: 'M1', subject: 'Listing Approved: UCSF Mission Bay Sanctuary Suite is LIVE', sampleBody: 'Congratulations! Your property has been verified by our moderation team as meeting daytime sleep and safety standards. Clinicians can now book your stay.' },
  { id: 'NOTIF-23', event: 'Support ticket update', recipient: 'All', channels: ['Email', 'In-App'], milestone: 'M2', subject: 'Update on Support Ticket #T-84920 [support Responded]', sampleBody: 'Your 24/7 Support agent Alex has responded: "We have contacted building management to confirm daytime quiet hours compliance immediately."' },
  { id: 'NOTIF-24', event: 'Account suspended', recipient: 'All', channels: ['Email'], milestone: 'M2', subject: 'Notice of account suspension — Nurses Pillow Compliance', sampleBody: 'Your account has been suspended following a report of repeated quiet hours violations. Please review our Sanctuary Standards or file an appeal with safety@nursespillow.com.' },
  { id: 'NOTIF-25', event: 'Fee change notice', recipient: 'Host', channels: ['Email', 'In-App'], milestone: 'M2', subject: 'Important: Notice of updated host service fee schedule', sampleBody: 'This is advance notification that the platform host service fee will adjust from 10% to 11% effective in 30 days. All existing bookings and active stays remain at their locked rates.' },
];

export const CROSS_CUTTING_STATES: CrossCuttingStateItem[] = [
  { id: 'STATE-01', state: 'Loading — list / grid', treatment: 'Skeleton blocks in the exact shape of the result', rule: 'Never a page-level spinner' },
  { id: 'STATE-02', state: 'Loading — in-button', treatment: 'Spinner replaces the label, width locked', rule: 'Prevents double submission' },
  { id: 'STATE-03', state: 'Empty — no data yet', treatment: 'Line-art mascot, headline, one supporting line, primary action', rule: 'Tells the user what to do next' },
  { id: 'STATE-04', state: 'Empty — no results for filters', treatment: 'No mascot; specific copy plus a one-tap widen/reset action', rule: '\'No rooms within 5 miles of Duke. Try 10 miles.\'' },
  { id: 'STATE-05', state: 'Error — page level', treatment: 'Plain statement of what failed plus retry', rule: 'Never blame the user' },
  { id: 'STATE-06', state: 'Error — inline field', treatment: 'Border, helper text and icon in action-needed colour', rule: 'Entered data is never cleared' },
  { id: 'STATE-07', state: 'Success confirmation', treatment: 'Toast, or a full screen where the moment matters', rule: 'Booking confirmation is the one celebratory screen' },
  { id: 'STATE-08', state: 'Disabled / blocked action', treatment: 'Disabled styling plus helper text explaining why', rule: 'Never a dead button with no explanation' },
  { id: 'STATE-09', state: 'Permission / access denied', treatment: 'Explainer plus route to fix', rule: 'Verification gates booking' },
  { id: 'STATE-10', state: 'Offline (mobile)', treatment: 'Offline banner, cached content, retry', rule: 'M3 parity rule' },
  { id: 'STATE-11', state: 'Pending value', treatment: '\'Pending review\' in muted italic', rule: 'Never display a guessed number' },
];

export const DECISION_BLOCKED_ITEMS = [
  {
    id: 'P-05',
    screen: 'Terms of Service',
    blockedOn: "Regulatory review for North Carolina lodging tax compliance",
    status: 'Configurable region active. Pending formal attorney signoff.',
    scopeNote: 'Core legal framework for traveling clinician subleasing.',
  },
  {
    id: 'P-06',
    screen: 'Privacy Policy',
    blockedOn: 'Attorney review',
    status: 'Drafted with strict medical license auto-purge & HIPAA safeguards.',
    scopeNote: 'Covers temporary license retention and document destruction.',
  },
  {
    id: 'P-08',
    screen: 'Host agreement / host standards',
    blockedOn: 'Attorney review',
    status: 'Sanctuary quiet hours (≤35dB) and 100% blackout provisions ready.',
    scopeNote: 'Enforces host compliance with clinical rest requirements.',
  },
  {
    id: 'P-09',
    screen: 'State disclosures (North Carolina)',
    blockedOn: 'Exact requirements come from attorney review; build configurable region now',
    status: 'NC G.S. § 42A Vacation Rental Act mid-term clinician exemption drafted.',
    scopeNote: 'North Carolina specific lodging tax and tenancy disclosures.',
  },
];

export const OUT_OF_PHASE_1_ITEMS = [
  { item: 'Staffing-agency accounts', phase: 'Phase 2', note: 'Schema supports it; no UI designed or built' },
  { item: 'Property-manager / portfolio accounts', phase: 'Phase 2', note: 'Schema supports it; no UI designed or built' },
  { item: 'Instant Booking', phase: 'Phase 2', note: 'Host-approval flow must be proven first' },
  { item: 'Neighborhood info / commute times / nearby POIs', phase: 'Phase 2', note: 'After-scope roadmap' },
  { item: 'Multi-currency and international markets', phase: 'Phase 2', note: 'Launch is US and USD only' },
  { item: 'Referral & rewards programme UI', phase: 'Phase 2', note: 'Phase 1 delivers the data model only, no customer-facing screens' },
  { item: 'Pillow Match (assignment-based matching score)', phase: 'After-scope', note: 'Roadmap item' },
  { item: 'Readiness badges (Nurses Pillow Ready, Night-Shift Ready, Healthcare Ready+)', phase: 'After-scope', note: 'Roadmap item' },
  { item: 'Standard automated check-in sequences', phase: 'After-scope', note: 'Roadmap item' },
  { item: 'Roommate matching', phase: 'After-scope', note: 'Roadmap specification: Optional, privacy-focused feature allowing clinicians with compatible assignment locations, dates, budgets, and housing preferences to opt in and connect.' },
  { item: 'Assignment Confirmed badge', phase: 'After-scope', note: "Roadmap specification: Admin-assigned badge indicating administrator verified traveler's facility, location, and dates using assignment documentation (documents remain private)." },
  { item: 'Gap Filler', phase: 'After-scope', note: 'Roadmap specification: Host feature highlighting short calendar vacancies between longer reservations and matching them with travelers needing those exact dates.' },
  { item: 'Host lead profiles', phase: 'After-scope', note: 'Roadmap specification: Traveler housing-request profiles that hosts can review (profession, verification status, dates, budget, occupants, pets) without revealing contact info or private documents.' },
  { item: 'Message attachments (photos / documents)', phase: 'Phase 2', note: 'Phase 1 messaging is text only' },
  { item: 'Automated licence verification API', phase: 'Phase 2', note: 'Manual admin review at launch; vendor integration priced separately' },
];
