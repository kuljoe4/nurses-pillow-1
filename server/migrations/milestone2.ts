import { db } from '../db.js';

export async function runMilestone2Migration() {
  console.log('[Milestone 2] Running schema migration...');
  try {
    // 1. Users extension
    await db.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS avatar_gcs_key TEXT,
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
        ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32),
        ADD COLUMN IF NOT EXISTS referred_by_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS organization_id UUID;
    `);

    // 2. Organizations and B2B readiness
    await db.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        org_type VARCHAR(50) NOT NULL DEFAULT 'property_management_group',
        billing_email VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clinician_matching_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shift_preference VARCHAR(50) DEFAULT 'night',
        max_commute_miles INT DEFAULT 15,
        quiet_daytime_required BOOLEAN DEFAULT TRUE,
        pet_friendly_required BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS roommate_matching_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_opted_in BOOLEAN DEFAULT FALSE,
        target_facility_name VARCHAR(255),
        target_start_date DATE,
        target_end_date DATE,
        budget_max DECIMAL(10, 2),
        preferences_json JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS listing_gap_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        room_id UUID,
        min_gap_days INT DEFAULT 7,
        gap_discount_percent DECIMAL(5, 2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT FALSE
      );
    `);

    // 3. Calendar blocks and seasonal pricing
    await db.query(`
      CREATE TABLE IF NOT EXISTS calendar_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        room_id UUID,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(50) NOT NULL DEFAULT 'host_blocked',
        booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE CASCADE,
        seasonal_monthly_rate DECIMAL(10, 2),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Stay extensions
    await db.query(`
      CREATE TABLE IF NOT EXISTS stay_extensions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id VARCHAR(255) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        traveler_id VARCHAR(255) NOT NULL REFERENCES users(id),
        host_id VARCHAR(255) NOT NULL REFERENCES users(id),
        previous_end_date DATE NOT NULL,
        requested_end_date DATE NOT NULL,
        prorated_rent_amount DECIMAL(10, 2) NOT NULL,
        platform_host_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
        stripe_payment_intent_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'requested',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      );
    `);

    // 5. Saved Listings (Pillows)
    await db.query(`
      CREATE TABLE IF NOT EXISTS saved_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        room_id UUID,
        target_hospital_name VARCHAR(255),
        distance_miles DECIMAL(5, 2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, listing_id)
      );
    `);

    // 6. User blocks, Message threads & Messages
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blocker_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(blocker_id, blocked_id)
      );

      CREATE TABLE IF NOT EXISTS message_threads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE SET NULL,
        traveler_id VARCHAR(255) NOT NULL REFERENCES users(id),
        host_id VARCHAR(255) NOT NULL REFERENCES users(id),
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(listing_id, traveler_id, host_id)
      );

      CREATE TABLE IF NOT EXISTS direct_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
        sender_id VARCHAR(255) NOT NULL REFERENCES users(id),
        recipient_id VARCHAR(255) NOT NULL REFERENCES users(id),
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        email_digest_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Reviews (two-way completed stay)
    await db.query(`
      CREATE TABLE IF NOT EXISTS completed_stay_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id VARCHAR(255) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        listing_id VARCHAR(255) NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        reviewer_id VARCHAR(255) NOT NULL REFERENCES users(id),
        reviewee_id VARCHAR(255) NOT NULL REFERENCES users(id),
        reviewer_role VARCHAR(20) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(booking_id, reviewer_id)
      );
    `);

    // 8. Safety reports
    await db.query(`
      CREATE TABLE IF NOT EXISTS safety_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id VARCHAR(255) NOT NULL REFERENCES users(id),
        reported_user_id VARCHAR(255) REFERENCES users(id),
        reported_listing_id VARCHAR(255) REFERENCES listings(id),
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        resolved_by VARCHAR(255) REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      );
    `);

    // 9. Support tickets & messages
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id),
        booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE SET NULL,
        category VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'normal',
        assigned_admin_id VARCHAR(255) REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_ticket_replies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES user_support_tickets(id) ON DELETE CASCADE,
        sender_id VARCHAR(255) NOT NULL REFERENCES users(id),
        message_body TEXT NOT NULL,
        attachment_gcs_key TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 10. Platform Settings & Fee Change Logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS platform_fee_settings (
        id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        host_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00 CHECK (host_fee_percent >= 0.00 AND host_fee_percent <= 15.00),
        traveler_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (traveler_fee_percent = 0.00),
        updated_by VARCHAR(255),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO platform_fee_settings (id, host_fee_percent, traveler_fee_percent)
      VALUES (1, 5.00, 0.00)
      ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS fee_change_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id VARCHAR(255) NOT NULL,
        previous_fee_percent DECIMAL(5, 2) NOT NULL,
        new_fee_percent DECIMAL(5, 2) NOT NULL,
        effective_at TIMESTAMPTZ NOT NULL,
        hosts_notified_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 11. Promo Codes extensions & redemptions
    await db.query(`
      ALTER TABLE promo_codes
        ADD COLUMN IF NOT EXISTS eligible_states TEXT[] DEFAULT ARRAY['NC', 'MD', 'CT', 'ND', 'KS'],
        ADD COLUMN IF NOT EXISTS current_uses INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS max_total_uses INT DEFAULT 100,
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

      CREATE TABLE IF NOT EXISTS promo_code_redemptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        promo_code_id UUID NOT NULL REFERENCES promo_codes(id),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id),
        booking_id VARCHAR(255) NOT NULL REFERENCES bookings(id),
        discount_applied DECIMAL(10, 2) NOT NULL,
        redeemed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(promo_code_id, booking_id)
      );
    `);

    // 12. Notification templates & In-App Alerts
    await db.query(`
      CREATE TABLE IF NOT EXISTS dynamic_notification_templates (
        event_key VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        recipient_role VARCHAR(30) NOT NULL,
        channels TEXT[] NOT NULL,
        email_subject_template TEXT,
        email_body_template TEXT,
        push_title_template TEXT,
        push_body_template TEXT,
        in_app_template TEXT,
        is_enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_key VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        action_url TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_fcm_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        device_type VARCHAR(20) NOT NULL DEFAULT 'web',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed 13 Notification Event Keys
    const templates = [
      {
        event_key: 'move_in_reminder',
        name: 'Move-in reminder',
        recipient_role: 'nurse',
        channels: ['email', 'push'],
        email_subject: 'Your assignment move-in is in 3 days: {{property_title}}',
        email_body: 'Hi {{nurse_name}}, your move-in date at {{property_title}} is coming up on {{move_in_date}}. Review your arrival instructions anytime in your dashboard.',
        push_title: '3 days to move-in',
        push_body: 'Your stay at {{property_title}} starts in 3 days.',
        in_app: 'Your move-in at {{property_title}} is scheduled for {{move_in_date}}.',
      },
      {
        event_key: 'arrival_instructions',
        name: 'Arrival instructions updated',
        recipient_role: 'nurse',
        channels: ['email', 'push', 'in_app'],
        email_subject: 'Arrival instructions ready: {{property_title}}',
        email_body: 'Hi {{nurse_name}}, your host has updated the check-in and arrival instructions for {{property_title}}.',
        push_title: 'Arrival details available',
        push_body: 'Check-in instructions for {{property_title}} have been shared.',
        in_app: 'New arrival instructions have been posted for your upcoming stay.',
      },
      {
        event_key: 'new_message',
        name: 'New message received',
        recipient_role: 'all',
        channels: ['push', 'in_app', 'email'],
        email_subject: 'New message from {{sender_name}} on Nurses Pillow',
        email_body: 'Hi {{recipient_name}}, {{sender_name}} sent you a message: "{{preview}}". Reply anytime in your Messages tab.',
        push_title: 'New message from {{sender_name}}',
        push_body: '{{preview}}',
        in_app: 'New message from {{sender_name}}: {{preview}}',
      },
      {
        event_key: 'extension_requested',
        name: 'Stay extension requested',
        recipient_role: 'host',
        channels: ['email', 'push', 'in_app'],
        email_subject: 'Stay extension requested by {{nurse_name}} for {{property_title}}',
        email_body: 'Hi {{host_name}}, {{nurse_name}} has requested to extend their reservation through {{requested_end_date}} for ${{amount}} prorated rent.',
        push_title: 'Extension requested',
        push_body: '{{nurse_name}} requested to extend through {{requested_end_date}}.',
        in_app: 'Stay extension requested through {{requested_end_date}}.',
      },
      {
        event_key: 'extension_approved',
        name: 'Stay extension approved',
        recipient_role: 'nurse',
        channels: ['email', 'push', 'in_app'],
        email_subject: 'Extension approved: {{property_title}}',
        email_body: 'Good news {{nurse_name}}! Your host approved your extension through {{requested_end_date}}. Rest well!',
        push_title: 'Extension approved!',
        push_body: 'Your stay has been extended through {{requested_end_date}}.',
        in_app: 'Your stay extension through {{requested_end_date}} was approved.',
      },
      {
        event_key: 'extension_declined',
        name: 'Stay extension declined',
        recipient_role: 'nurse',
        channels: ['email', 'push', 'in_app'],
        email_subject: 'Update on your extension request: {{property_title}}',
        email_body: 'Hi {{nurse_name}}, your host was unable to accommodate the extension through {{requested_end_date}}. Your pre-authorization hold was released.',
        push_title: 'Extension update',
        push_body: 'Your host could not extend your current reservation.',
        in_app: 'Your extension request was declined and payment hold released.',
      },
      {
        event_key: 'refund_processed',
        name: 'Refund processed',
        recipient_role: 'nurse',
        channels: ['email'],
        email_subject: 'Refund processed for ${{amount}}',
        email_body: 'Hi {{nurse_name}}, your refund of ${{amount}} for {{property_title}} has been processed back to your original payment method.',
        push_title: '',
        push_body: '',
        in_app: 'Refund of ${{amount}} has been credited to your payment method.',
      },
      {
        event_key: 'payout_sent',
        name: 'Host payout sent',
        recipient_role: 'host',
        channels: ['email', 'in_app'],
        email_subject: 'Your payout of ${{amount}} is on the way',
        email_body: 'Hi {{host_name}}, your payout of ${{amount}} for reservation {{booking_id}} has been transferred to your Stripe Connect bank account.',
        push_title: '',
        push_body: '',
        in_app: 'Payout of ${{amount}} initiated to your connected account.',
      },
      {
        event_key: 'payout_on_hold',
        name: 'Host payout on hold',
        recipient_role: 'host',
        channels: ['email', 'in_app'],
        email_subject: 'Notice regarding your payout for {{property_title}}',
        email_body: 'Hi {{host_name}}, payout for reservation {{booking_id}} is temporarily on hold pending review. Our clinician support team is reviewing the record.',
        push_title: '',
        push_body: '',
        in_app: 'Payout for reservation {{booking_id}} is on hold pending review.',
      },
      {
        event_key: 'review_request',
        name: 'Review request prompt',
        recipient_role: 'all',
        channels: ['email', 'push'],
        email_subject: 'How was your stay at {{property_title}}?',
        email_body: 'Hi {{user_name}}, please take 60 seconds to review your recent stay to help fellow clinicians and hosts maintain high trust.',
        push_title: 'Review your stay',
        push_body: 'Help fellow traveling clinicians by sharing your experience.',
        in_app: 'Please leave a review for your recently completed stay.',
      },
      {
        event_key: 'support_ticket_update',
        name: 'Support ticket response',
        recipient_role: 'all',
        channels: ['email', 'in_app'],
        email_subject: 'Update on support ticket #{{ticket_id}}: {{subject}}',
        email_body: 'Hi {{user_name}}, our member support team has responded to your ticket: "{{reply_preview}}".',
        push_title: '',
        push_body: '',
        in_app: 'Support ticket #{{ticket_id}} received a new response.',
      },
      {
        event_key: 'account_suspended',
        name: 'Account suspended notice',
        recipient_role: 'all',
        channels: ['email'],
        email_subject: 'Important notice regarding your Nurses Pillow account',
        email_body: 'Hi {{user_name}}, your account access has been paused for safety compliance: {{reason}}. Contact support@nursespillow.com for assistance.',
        push_title: '',
        push_body: '',
        in_app: 'Your account access has been paused for safety review.',
      },
      {
        event_key: 'fee_change_notice',
        name: 'Host service fee adjustment',
        recipient_role: 'host',
        channels: ['email', 'in_app'],
        email_subject: 'Nurses Pillow host service fee update',
        email_body: 'Hi {{host_name}}, please note our host service fee has been updated to {{new_fee_percent}}%, effective {{effective_date}}.',
        push_title: '',
        push_body: '',
        in_app: 'Platform host service fee has been set to {{new_fee_percent}}%.',
      },
    ];

    for (const t of templates) {
      await db.query(`
        INSERT INTO dynamic_notification_templates 
          (event_key, name, recipient_role, channels, email_subject_template, email_body_template, push_title_template, push_body_template, in_app_template, is_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT (event_key) DO UPDATE SET
          name = EXCLUDED.name,
          recipient_role = EXCLUDED.recipient_role,
          channels = EXCLUDED.channels,
          email_subject_template = EXCLUDED.email_subject_template,
          email_body_template = EXCLUDED.email_body_template,
          push_title_template = EXCLUDED.push_title_template,
          push_body_template = EXCLUDED.push_body_template,
          in_app_template = EXCLUDED.in_app_template;
      `, [
        t.event_key,
        t.name,
        t.recipient_role,
        t.channels,
        t.email_subject,
        t.email_body,
        t.push_title,
        t.push_body,
        t.in_app,
      ]);
    }

    // 13. Search demand & Zero-Inventory Tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS search_demand_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        hospital_name VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(2),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        radius_miles INT NOT NULL DEFAULT 15,
        requested_start_date DATE,
        requested_end_date DATE,
        duration_weeks INT,
        results_count INT NOT NULL,
        is_zero_inventory BOOLEAN GENERATED ALWAYS AS (results_count = 0) STORED,
        searched_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_demand_zero_inventory ON search_demand_logs(is_zero_inventory, searched_at);
      CREATE INDEX IF NOT EXISTS idx_demand_hospital ON search_demand_logs(hospital_name, state);
    `);

    // 14. Bookings extension columns
    await db.query(`
      ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS arrival_instructions TEXT,
        ADD COLUMN IF NOT EXISTS payout_held BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS postmark_last_message_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS postmark_delivered_at TIMESTAMPTZ;
    `);

    console.log('[Milestone 2] ✅ Database schema migration completed successfully.');
  } catch (err: any) {
    console.error('[Milestone 2] ❌ Schema migration error:', err.message);
  }
}
