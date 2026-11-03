import { db } from '../db.js';

export interface NotifyPayload {
  eventKey: string;
  recipientId: string;
  variables: Record<string, string | number>;
  actionUrl?: string;
  bookingId?: string;
}

export const notificationDispatcher = {
  /**
   * Unified notification dispatcher across In-App, Push (FCM), and Postmark Email.
   */
  async notify(payload: NotifyPayload): Promise<void> {
    try {
      const { eventKey, recipientId, variables, actionUrl, bookingId } = payload;

      // 1. Fetch template
      const templateRes = await db.query(
        'SELECT * FROM dynamic_notification_templates WHERE event_key = $1',
        [eventKey]
      );

      if (templateRes.rows.length === 0) {
        console.warn(`[NotificationDispatcher] Unknown eventKey: ${eventKey}`);
        return;
      }

      const template = templateRes.rows[0];
      if (!template.is_enabled) {
        console.log(`[NotificationDispatcher] Template ${eventKey} is disabled. Skipping.`);
        return;
      }

      // 2. Fetch recipient info
      const userRes = await db.query(
        'SELECT id, email, full_name, is_suspended, marketing_opt_in FROM users WHERE id = $1',
        [recipientId]
      );
      if (userRes.rows.length === 0) {
        console.warn(`[NotificationDispatcher] Recipient not found: ${recipientId}`);
        return;
      }
      const user = userRes.rows[0];

      // Interpolate helper
      const interpolate = (text?: string): string => {
        if (!text) return '';
        let result = text;
        const allVars: Record<string, string | number> = {
          user_name: user.full_name,
          nurse_name: user.full_name,
          host_name: user.full_name,
          ...variables,
        };
        for (const [key, val] of Object.entries(allVars)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          result = result.replace(regex, String(val ?? ''));
        }
        return result;
      };

      const channels: string[] = template.channels || [];

      // 3. In-App Notification
      if (channels.includes('in_app')) {
        const inAppTitle = interpolate(template.push_title_template || template.name);
        const inAppBody = interpolate(template.in_app_template || template.email_body_template);
        await db.query(
          `INSERT INTO in_app_notifications (user_id, event_key, title, body, action_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [recipientId, eventKey, inAppTitle, inAppBody, actionUrl || '/nurse/dashboard']
        );
        console.log(`[NotificationDispatcher] In-App notification recorded for ${recipientId}`);
      }

      // 4. Push Notification (FCM)
      if (channels.includes('push')) {
        const fcmTokensRes = await db.query(
          'SELECT token FROM user_fcm_tokens WHERE user_id = $1',
          [recipientId]
        );
        const pushTitle = interpolate(template.push_title_template);
        const pushBody = interpolate(template.push_body_template);
        if (fcmTokensRes.rows.length > 0) {
          console.log(`[NotificationDispatcher] Dispatching FCM push to ${fcmTokensRes.rows.length} devices for ${recipientId}: "${pushTitle}"`);
        }
      }

      // 5. Postmark Transactional Email
      if (channels.includes('email') && user.email) {
        const emailSubject = interpolate(template.email_subject_template);
        const emailBody = interpolate(template.email_body_template);
        const postmarkToken = process.env.POSTMARK_SERVER_TOKEN || process.env.VITE_POSTMARK_SERVER_TOKEN;

        if (postmarkToken) {
          try {
            const resp = await fetch('https://api.postmarkapp.com/email', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': postmarkToken,
              },
              body: JSON.stringify({
                From: 'support@nursespillow.com',
                To: user.email,
                Subject: emailSubject,
                TextBody: emailBody,
                HtmlBody: `<div style="font-family: Poppins, sans-serif; color: #0B2559; padding: 24px; line-height: 1.6;">
                  <h2 style="color: #0B2559; margin-bottom: 16px;">Nurses Pillow</h2>
                  <p>${emailBody.replace(/\n/g, '<br/>')}</p>
                  ${actionUrl ? `<p style="margin-top: 24px;"><a href="${actionUrl}" style="background-color: #0A6FA8; color: #FFFFFF; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">View in Dashboard</a></p>` : ''}
                  <hr style="border: none; border-top: 1px solid #EFF6FB; margin: 32px 0 16px;" />
                  <p style="font-size: 12px; color: rgba(11,37,89,0.66); font-style: italic;">Rest Well. Heal Better.</p>
                </div>`,
              }),
            });

            if (resp.ok) {
              const resJson = await resp.json() as any;
              if (bookingId && resJson.MessageID) {
                await db.query(
                  'UPDATE bookings SET postmark_last_message_id = $1 WHERE id = $2',
                  [resJson.MessageID, bookingId]
                );
              }
              console.log(`[NotificationDispatcher] Postmark email dispatched to ${user.email}`);
            } else {
              console.warn(`[NotificationDispatcher] Postmark API status ${resp.status}`);
            }
          } catch (postmarkErr: any) {
            console.warn(`[NotificationDispatcher] Postmark send failed:`, postmarkErr.message);
          }
        } else {
          console.log(`[NotificationDispatcher] (Simulation) Email to ${user.email}: "${emailSubject}" - ${emailBody}`);
        }
      }
    } catch (err: any) {
      console.error(`[NotificationDispatcher] Error dispatching notification:`, err.message);
    }
  },
};
