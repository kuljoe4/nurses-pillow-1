import express, { Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../authMiddleware.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';

const router = express.Router();

/**
 * 1. List Conversation Threads
 * GET /api/messages/threads
 */
router.get('/threads', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await db.query(`
      SELECT 
        mt.id as thread_id, mt.listing_id, mt.booking_id, mt.traveler_id, mt.host_id, mt.last_message_at,
        l.title as listing_title, l.city, l.state,
        u_nurse.full_name as traveler_name,
        u_host.full_name as host_name,
        (
          SELECT body FROM direct_messages 
          WHERE thread_id = mt.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_preview,
        (
          SELECT created_at FROM direct_messages 
          WHERE thread_id = mt.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) FROM direct_messages 
          WHERE thread_id = mt.id AND recipient_id = $1 AND is_read = false
        ) as unread_count
      FROM message_threads mt
      JOIN listings l ON mt.listing_id = l.id
      JOIN users u_nurse ON mt.traveler_id = u_nurse.id
      JOIN users u_host ON mt.host_id = u_host.id
      WHERE (mt.traveler_id = $1 OR mt.host_id = $1)
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks 
          WHERE (blocker_id = $1 AND blocked_id = CASE WHEN mt.traveler_id = $1 THEN mt.host_id ELSE mt.traveler_id END)
             OR (blocker_id = CASE WHEN mt.traveler_id = $1 THEN mt.host_id ELSE mt.traveler_id END AND blocked_id = $1)
        )
      ORDER BY mt.last_message_at DESC
    `, [userId]);

    const threads = result.rows.map((row: any) => {
      const isNurse = row.traveler_id === userId;
      return {
        id: row.thread_id,
        listingId: row.listing_id,
        listingTitle: row.listing_title,
        city: row.city,
        state: row.state,
        bookingId: row.booking_id,
        participantName: isNurse ? row.host_name : row.traveler_name,
        participantRole: isNurse ? 'Host' : 'Nurse',
        lastMessagePreview: row.last_message_preview || 'No messages yet',
        lastMessageTime: row.last_message_time || row.last_message_at,
        unreadCount: parseInt(row.unread_count || '0', 10),
      };
    });

    res.json({ threads });
  } catch (err: any) {
    console.error('[Messaging Threads API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve message threads' });
  }
});

/**
 * 2. Get Thread Messages & Mark Read
 * GET /api/messages/threads/:threadId
 */
router.get('/threads/:threadId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const threadId = req.params.threadId;
    const userId = req.user?.id;

    const threadRes = await db.query(`
      SELECT mt.*, l.title as listing_title,
             u_nurse.full_name as traveler_name,
             u_host.full_name as host_name
      FROM message_threads mt
      JOIN listings l ON mt.listing_id = l.id
      JOIN users u_nurse ON mt.traveler_id = u_nurse.id
      JOIN users u_host ON mt.host_id = u_host.id
      WHERE mt.id = $1 AND (mt.traveler_id = $2 OR mt.host_id = $2)
    `, [threadId, userId]);

    if (threadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation thread not found' });
    }

    const thread = threadRes.rows[0];
    const otherUserId = thread.traveler_id === userId ? thread.host_id : thread.traveler_id;

    // Check user blocks
    const blockCheck = await db.query(`
      SELECT id FROM user_blocks 
      WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
    `, [userId, otherUserId]);

    if (blockCheck.rows.length > 0) {
      return res.status(403).json({ error: 'Communication blocked between users' });
    }

    // Mark messages as read
    await db.query(`
      UPDATE direct_messages 
      SET is_read = true, read_at = NOW() 
      WHERE thread_id = $1 AND recipient_id = $2 AND is_read = false
    `, [threadId, userId]);

    // Fetch messages
    const messagesRes = await db.query(`
      SELECT dm.id, dm.sender_id, dm.body, dm.is_read, dm.read_at, dm.created_at,
             u.full_name as sender_name
      FROM direct_messages dm
      JOIN users u ON dm.sender_id = u.id
      WHERE dm.thread_id = $1
      ORDER BY dm.created_at ASC
    `, [threadId]);

    res.json({
      thread: {
        id: thread.id,
        listingId: thread.listing_id,
        listingTitle: thread.listing_title,
        bookingId: thread.booking_id,
        otherUserId,
        otherUserName: thread.traveler_id === userId ? thread.host_name : thread.traveler_name,
      },
      messages: messagesRes.rows,
    });
  } catch (err: any) {
    console.error('[Thread Messages API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

/**
 * 3. Send Text Message
 * POST /api/messages/threads/:threadId/send
 */
router.post('/threads/:threadId/send', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const threadId = req.params.threadId;
    const userId = req.user?.id;
    const { body } = req.body;

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ error: 'Message body cannot be empty' });
    }

    // Text-only sanitization (strip HTML tags)
    const sanitizedBody = body.replace(/<[^>]*>?/gm, '').trim();

    const threadRes = await db.query(`
      SELECT mt.*, l.title as listing_title, u.full_name as sender_name
      FROM message_threads mt
      JOIN listings l ON mt.listing_id = l.id
      JOIN users u ON u.id = $2
      WHERE mt.id = $1 AND (mt.traveler_id = $2 OR mt.host_id = $2)
    `, [threadId, userId]);

    if (threadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation thread not found' });
    }

    const thread = threadRes.rows[0];
    const recipientId = thread.traveler_id === userId ? thread.host_id : thread.traveler_id;

    // Check user block guard
    const blockCheck = await db.query(`
      SELECT id FROM user_blocks 
      WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
    `, [userId, recipientId]);

    if (blockCheck.rows.length > 0) {
      return res.status(403).json({ error: 'Communication blocked between users' });
    }

    const msgRes = await db.query(`
      INSERT INTO direct_messages (thread_id, sender_id, recipient_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [threadId, userId, recipientId, sanitizedBody]);

    await db.query(
      'UPDATE message_threads SET last_message_at = NOW() WHERE id = $1',
      [threadId]
    );

    // Push notification to recipient
    await notificationDispatcher.notify({
      eventKey: 'new_message',
      recipientId,
      variables: {
        sender_name: thread.sender_name,
        preview: sanitizedBody.length > 60 ? sanitizedBody.substring(0, 57) + '...' : sanitizedBody,
        property_title: thread.listing_title,
      },
      actionUrl: '/messages',
      bookingId: thread.booking_id,
    });

    res.json({ success: true, message: msgRes.rows[0] });
  } catch (err: any) {
    console.error('[Send Message API] Error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * 4. Find or Create Thread
 * POST /api/messages/threads/find-or-create
 */
router.post('/threads/find-or-create', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { listingId, hostId, bookingId } = req.body;

    if (!listingId || !hostId) {
      return res.status(400).json({ error: 'listingId and hostId are required' });
    }

    // Check existing
    const existing = await db.query(`
      SELECT id FROM message_threads 
      WHERE listing_id = $1 AND traveler_id = $2 AND host_id = $3
    `, [listingId, userId, hostId]);

    if (existing.rows.length > 0) {
      return res.json({ threadId: existing.rows[0].id });
    }

    // Create new
    const created = await db.query(`
      INSERT INTO message_threads (listing_id, booking_id, traveler_id, host_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [listingId, bookingId || null, userId, hostId]);

    res.json({ threadId: created.rows[0].id });
  } catch (err: any) {
    console.error('[Find or Create Thread API] Error:', err.message);
    res.status(500).json({ error: 'Failed to initiate conversation thread' });
  }
});

export default router;
