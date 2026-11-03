import { db } from '../db.js';
import { notificationDispatcher } from './notificationDispatcher.js';

export function startBackgroundCronWorker() {
  console.log('[Cron Worker] Initializing scheduled background tasks...');

  // 1. Every 5 minutes: Offline Message Email Digests
  setInterval(async () => {
    try {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const unreadRes = await db.query(`
        SELECT dm.id, dm.thread_id, dm.sender_id, dm.recipient_id, dm.body,
               u_sender.full_name as sender_name,
               l.title as listing_title
        FROM direct_messages dm
        JOIN message_threads mt ON dm.thread_id = mt.id
        JOIN listings l ON mt.listing_id = l.id
        JOIN users u_sender ON dm.sender_id = u_sender.id
        WHERE dm.is_read = false 
          AND dm.email_digest_sent = false 
          AND dm.created_at <= $1
        LIMIT 20
      `, [fiveMinsAgo]);

      for (const msg of unreadRes.rows) {
        await notificationDispatcher.notify({
          eventKey: 'new_message',
          recipientId: msg.recipient_id,
          variables: {
            sender_name: msg.sender_name,
            preview: msg.body.length > 50 ? msg.body.substring(0, 47) + '...' : msg.body,
            property_title: msg.listing_title,
          },
          actionUrl: '/messages',
        });

        await db.query('UPDATE direct_messages SET email_digest_sent = true WHERE id = $1', [msg.id]);
      }
    } catch (err: any) {
      console.warn('[Cron Worker] Error running message digest:', err.message);
    }
  }, 5 * 60 * 1000);

  // 2. Every hour: Move-In Reminders, Stay Completion & Review Requests, Expired Bookings
  const runHourlyChecks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // A. Move-in reminders (3 days before start)
      const moveInRes = await db.query(`
        SELECT b.id, b.traveler_id, b.start_date, l.title as listing_title
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        WHERE b.status IN ('accepted', 'paid', 'active')
          AND b.start_date = $1
      `, [in3Days]);

      for (const row of moveInRes.rows) {
        await notificationDispatcher.notify({
          eventKey: 'move_in_reminder',
          recipientId: row.traveler_id,
          variables: {
            property_title: row.listing_title,
            move_in_date: row.start_date,
          },
          actionUrl: '/nurse/dashboard',
          bookingId: row.id,
        });
      }

      // B. Stay Completion & Review Prompts (end_date has passed)
      const completedRes = await db.query(`
        SELECT b.id, b.traveler_id, b.host_id, l.title as listing_title
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        WHERE b.status IN ('accepted', 'paid', 'active')
          AND b.end_date < $1
      `, [today]);

      for (const b of completedRes.rows) {
        await db.query("UPDATE bookings SET status = 'completed', completed_at = NOW() WHERE id = $1", [b.id]);

        // Prompt nurse
        await notificationDispatcher.notify({
          eventKey: 'review_request',
          recipientId: b.traveler_id,
          variables: { property_title: b.listing_title },
          actionUrl: '/nurse/dashboard',
          bookingId: b.id,
        });

        // Prompt host
        await notificationDispatcher.notify({
          eventKey: 'review_request',
          recipientId: b.host_id,
          variables: { property_title: b.listing_title },
          actionUrl: '/host/dashboard',
          bookingId: b.id,
        });
      }
    } catch (err: any) {
      console.warn('[Cron Worker] Hourly check notice:', err.message);
    }
  };

  setInterval(runHourlyChecks, 60 * 60 * 1000);
  // Run once shortly after startup
  setTimeout(runHourlyChecks, 15000);
}
