import express, { Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../authMiddleware.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';

const router = express.Router();

/**
 * 1. Submit Completed-Stay Two-Way Review
 * POST /api/reviews
 */
router.post('/reviews', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ error: 'bookingId, rating, and comment are required' });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const bookingRes = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    // Strict Eligibility: Booking must be completed (or confirmed and end_date has passed)
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = booking.status === 'completed' || 
      (['accepted', 'paid', 'active'].includes(booking.status) && booking.end_date <= today);

    if (!isCompleted) {
      return res.status(400).json({ error: 'Reviews are unlocked only after your stay is completed.' });
    }

    // Role verification
    const isTraveler = booking.traveler_id === userId;
    const isHost = booking.host_id === userId;

    if (!isTraveler && !isHost) {
      return res.status(403).json({ error: 'You are not a participant in this booking.' });
    }

    const reviewerRole = isTraveler ? 'nurse' : 'host';
    const revieweeId = isTraveler ? booking.host_id : booking.traveler_id;

    // Check duplicate
    const existing = await db.query(
      'SELECT id FROM completed_stay_reviews WHERE booking_id = $1 AND reviewer_id = $2',
      [bookingId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a review for this stay.' });
    }

    const insertRes = await db.query(`
      INSERT INTO completed_stay_reviews 
        (booking_id, listing_id, reviewer_id, reviewee_id, reviewer_role, rating, comment, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `, [bookingId, booking.listing_id, userId, revieweeId, reviewerRole, ratingNum, comment.trim()]);

    res.json({ success: true, review: insertRes.rows[0] });
  } catch (err: any) {
    console.error('[Submit Review API] Error:', err.message);
    res.status(500).json({ error: 'Failed to submit stay review' });
  }
});

/**
 * Get Reviews for Listing
 * GET /api/listings/:id/reviews
 */
router.get('/listings/:id/reviews', async (req, res) => {
  try {
    const listingId = req.params.id;
    const result = await db.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, r.reviewer_role,
             u.full_name as reviewer_name
      FROM completed_stay_reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.listing_id = $1 AND r.is_published = true
      ORDER BY r.created_at DESC
    `, [listingId]);

    const count = result.rows.length;
    const averageRating = count > 0
      ? Math.round((result.rows.reduce((sum: number, row: any) => sum + row.rating, 0) / count) * 10) / 10
      : 5.0;

    res.json({
      reviews: result.rows,
      count,
      averageRating,
    });
  } catch (err: any) {
    console.error('[Get Listing Reviews API] Error:', err.message);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

/**
 * 2. Trust & Safety Reports
 * POST /api/safety/reports
 */
router.post('/safety/reports', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reportedUserId, reportedListingId, category, description } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required' });
    }

    const reportRes = await db.query(`
      INSERT INTO safety_reports (reporter_id, reported_user_id, reported_listing_id, category, description, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [userId, reportedUserId || null, reportedListingId || null, category, description.trim()]);

    res.json({
      success: true,
      message: 'Safety report submitted. Our team reviews urgent reports within 2 hours.',
      reportId: reportRes.rows[0].id,
    });
  } catch (err: any) {
    console.error('[Safety Report API] Error:', err.message);
    res.status(500).json({ error: 'Failed to submit safety report' });
  }
});

/**
 * Block User Guard
 * POST /api/safety/blocks
 */
router.post('/safety/blocks', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { blockedUserId, reason } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({ error: 'blockedUserId is required' });
    }

    await db.query(`
      INSERT INTO user_blocks (blocker_id, blocked_id, reason)
      VALUES ($1, $2, $3)
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
    `, [userId, blockedUserId, reason || 'User requested block']);

    res.json({ success: true, message: 'User blocked. You will no longer receive communications or requests.' });
  } catch (err: any) {
    console.error('[Block User API] Error:', err.message);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

/**
 * 3. Support Tickets Desk
 * POST /api/support/tickets
 */
router.post('/support/tickets', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { category, subject, description, bookingId, priority } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'Category, subject, and description are required' });
    }

    const ticketRes = await db.query(`
      INSERT INTO user_support_tickets (user_id, booking_id, category, subject, status, priority)
      VALUES ($1, $2, $3, $4, 'open', $5)
      RETURNING *
    `, [userId, bookingId || null, category, subject.trim(), priority || 'normal']);

    const ticket = ticketRes.rows[0];

    // Insert first message
    await db.query(`
      INSERT INTO support_ticket_replies (ticket_id, sender_id, message_body)
      VALUES ($1, $2, $3)
    `, [ticket.id, userId, description.trim()]);

    res.json({ success: true, ticket });
  } catch (err: any) {
    console.error('[Create Ticket API] Error:', err.message);
    res.status(500).json({ error: 'Failed to open support ticket' });
  }
});

router.get('/support/tickets', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    const query = isAdmin
      ? `SELECT t.*, u.full_name as user_name, u.email as user_email 
         FROM user_support_tickets t 
         JOIN users u ON t.user_id = u.id 
         ORDER BY t.created_at DESC`
      : `SELECT * FROM user_support_tickets WHERE user_id = $1 ORDER BY created_at DESC`;

    const result = isAdmin ? await db.query(query) : await db.query(query, [userId]);
    res.json({ tickets: result.rows });
  } catch (err: any) {
    console.error('[Get Tickets API] Error:', err.message);
    res.status(500).json({ error: 'Failed to load support tickets' });
  }
});

router.get('/support/tickets/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    const ticketRes = await db.query(`
      SELECT t.*, u.full_name as user_name, u.email as user_email
      FROM user_support_tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1 ${isAdmin ? '' : 'AND t.user_id = $2'}
    `, isAdmin ? [ticketId] : [ticketId, userId]);

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const messagesRes = await db.query(`
      SELECT m.*, u.full_name as sender_name, u.role as sender_role
      FROM support_ticket_replies m
      JOIN users u ON m.sender_id = u.id
      WHERE m.ticket_id = $1
      ORDER BY m.created_at ASC
    `, [ticketId]);

    res.json({
      ticket: ticketRes.rows[0],
      messages: messagesRes.rows,
    });
  } catch (err: any) {
    console.error('[Ticket Detail API] Error:', err.message);
    res.status(500).json({ error: 'Failed to load ticket details' });
  }
});

router.post('/support/tickets/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user?.id;
    const { messageBody, attachmentGcsKey } = req.body;

    if (!messageBody || !messageBody.trim()) {
      return res.status(400).json({ error: 'Message body cannot be empty' });
    }

    const ticketRes = await db.query(
      'SELECT * FROM user_support_tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketRes.rows[0];

    const replyRes = await db.query(`
      INSERT INTO support_ticket_replies (ticket_id, sender_id, message_body, attachment_gcs_key)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [ticketId, userId, messageBody.trim(), attachmentGcsKey || null]);

    await db.query(
      'UPDATE user_support_tickets SET updated_at = NOW() WHERE id = $1',
      [ticketId]
    );

    // If an admin replies, notify user
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    if (isAdmin && ticket.user_id !== userId) {
      await notificationDispatcher.notify({
        eventKey: 'support_ticket_update',
        recipientId: ticket.user_id,
        variables: {
          ticket_id: ticket.id.substring(0, 8),
          subject: ticket.subject,
          reply_preview: messageBody.length > 60 ? messageBody.substring(0, 57) + '...' : messageBody,
        },
        actionUrl: '/support',
      });
    }

    res.json({ success: true, message: replyRes.rows[0] });
  } catch (err: any) {
    console.error('[Reply Ticket API] Error:', err.message);
    res.status(500).json({ error: 'Failed to send ticket reply' });
  }
});

export default router;
