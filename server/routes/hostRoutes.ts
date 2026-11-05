import express, { Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../authMiddleware.js';
import { notificationDispatcher } from '../services/notificationDispatcher.js';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-02-24.acacia' as any,
});

/**
 * 1. Host Dashboard Summary
 * GET /api/host/dashboard-summary
 */
router.get('/dashboard-summary', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hostId = req.user?.id;
    if (!hostId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Units count
    const unitsRes = await db.query(
      'SELECT COUNT(*) as total_units FROM listings WHERE host_id = $1 AND is_published = true',
      [hostId]
    );
    const totalUnits = parseInt(unitsRes.rows[0]?.total_units || '0', 10);

    // Active occupancy count
    const today = new Date().toISOString().split('T')[0];
    const occupiedRes = await db.query(`
      SELECT COUNT(DISTINCT listing_id) as occupied_count 
      FROM bookings 
      WHERE host_id = $1 
        AND status IN ('accepted', 'paid', 'active')
        AND start_date <= $2 AND end_date >= $2
    `, [hostId, today]);
    const occupiedCount = parseInt(occupiedRes.rows[0]?.occupied_count || '0', 10);
    const occupancyPercent = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;

    // Pending booking requests
    const pendingBookingsRes = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE host_id = $1 AND status = 'requested'",
      [hostId]
    );
    const pendingBookingsCount = parseInt(pendingBookingsRes.rows[0]?.count || '0', 10);

    // Pending extension requests
    const pendingExtRes = await db.query(
      "SELECT COUNT(*) as count FROM stay_extensions WHERE host_id = $1 AND status = 'requested'",
      [hostId]
    );
    const pendingExtensionsCount = parseInt(pendingExtRes.rows[0]?.count || '0', 10);

    // Upcoming check-ins in next 7 days
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const upcomingArrivalsRes = await db.query(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE host_id = $1 
        AND status IN ('accepted', 'paid', 'active')
        AND start_date >= $2 AND start_date <= $3
    `, [hostId, today, next7Days]);
    const upcomingArrivalsCount = parseInt(upcomingArrivalsRes.rows[0]?.count || '0', 10);

    // Unread messages
    const unreadRes = await db.query(`
      SELECT COUNT(*) as count 
      FROM direct_messages dm
      JOIN message_threads mt ON dm.thread_id = mt.id
      WHERE mt.host_id = $1 AND dm.recipient_id = $1 AND dm.is_read = false
    `, [hostId]);
    const unreadMessagesCount = parseInt(unreadRes.rows[0]?.count || '0', 10);

    res.json({
      summary: {
        totalUnits,
        occupancyPercent,
        pendingBookingsCount,
        pendingExtensionsCount,
        upcomingArrivalsCount,
        unreadMessagesCount,
      },
    });
  } catch (err: any) {
    console.error('[Host Dashboard Summary API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve host summary' });
  }
});

/**
 * 2. Multi-Room Calendar Blocks & Seasonal Rates
 * GET /api/host/listings/:id/calendar
 */
router.get('/listings/:id/calendar', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const hostId = req.user?.id;

    // Verify ownership
    const listingCheck = await db.query(
      'SELECT id, title, monthly_rent FROM listings WHERE id = $1 AND host_id = $2',
      [listingId, hostId]
    );
    if (listingCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to manage this property' });
    }

    const listing = listingCheck.rows[0];

    // Get rooms if any
    const roomsRes = await db.query(
      'SELECT id, room_name, monthly_rent, is_available FROM listing_rooms WHERE listing_id = $1',
      [listingId]
    );

    // Get manual calendar blocks
    const blocksRes = await db.query(
      'SELECT * FROM calendar_blocks WHERE listing_id = $1 ORDER BY start_date ASC',
      [listingId]
    );

    // Get active bookings
    const bookingsRes = await db.query(`
      SELECT b.id, b.room_id, b.start_date, b.end_date, b.status, u.full_name as traveler_name
      FROM bookings b
      JOIN users u ON b.traveler_id = u.id
      WHERE b.listing_id = $1 AND b.status IN ('requested', 'accepted', 'paid', 'active')
      ORDER BY b.start_date ASC
    `, [listingId]);

    res.json({
      listing,
      rooms: roomsRes.rows,
      blocks: blocksRes.rows,
      bookings: bookingsRes.rows,
    });
  } catch (err: any) {
    console.error('[Host Calendar API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve calendar' });
  }
});

router.put('/listings/:id/calendar', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const hostId = req.user?.id;
    const { startDate, endDate, roomId, reason, seasonalMonthlyRate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Verify ownership
    const listingCheck = await db.query(
      'SELECT id FROM listings WHERE id = $1 AND host_id = $2',
      [listingId, hostId]
    );
    if (listingCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to manage this property' });
    }

    // Validation: prevent manual block overlapping with confirmed reservation
    const bookingConflict = await db.query(`
      SELECT id FROM bookings
      WHERE listing_id = $1 
        AND status IN ('accepted', 'paid', 'active')
        AND daterange(start_date, end_date, '[)') && daterange($2::date, $3::date, '[)')
    `, [listingId, startDate, endDate]);

    if (bookingConflict.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot block dates that overlap with a confirmed clinician reservation' });
    }

    const insertRes = await db.query(`
      INSERT INTO calendar_blocks (listing_id, room_id, start_date, end_date, reason, seasonal_monthly_rate)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [listingId, roomId || null, startDate, endDate, reason || 'host_blocked', seasonalMonthlyRate || null]);

    res.json({ success: true, block: insertRes.rows[0] });
  } catch (err: any) {
    console.error('[Update Calendar Block API] Error:', err.message);
    res.status(500).json({ error: 'Failed to update calendar block' });
  }
});

/**
 * 3. Guest Roster & Arrival Instructions
 * GET /api/host/guests
 */
router.get('/guests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hostId = req.user?.id;
    const result = await db.query(`
      SELECT 
        b.id as booking_id, b.start_date, b.end_date, b.assignment_duration_weeks,
        b.status, b.arrival_instructions, b.gross_booking_value, b.host_payout_amount,
        l.id as listing_id, l.title as listing_title, l.city, l.state,
        u.id as traveler_id, u.full_name as traveler_name, u.phone_number,
        u.phone_verified, u.identity_verified, u.is_nurse_verified,
        u.profession_type, u.clinical_state_board,
        h.name as hospital_name
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      JOIN users u ON b.traveler_id = u.id
      LEFT JOIN healthcare_facilities h ON b.hospital_id = h.id
      WHERE b.host_id = $1 AND b.status IN ('requested', 'accepted', 'paid', 'active', 'completed')
      ORDER BY b.start_date DESC
    `, [hostId]);

    const sanitizedGuests = result.rows.map((row: any) => ({
      bookingId: row.booking_id,
      listingId: row.listing_id,
      listingTitle: row.listing_title,
      hospitalName: row.hospital_name || 'Hospital Assignment',
      startDate: row.start_date,
      endDate: row.end_date,
      durationWeeks: row.assignment_duration_weeks,
      status: row.status,
      arrivalInstructions: row.arrival_instructions,
      traveler: {
        id: row.traveler_id,
        name: row.traveler_name,
        phone: row.phone_number,
        // Verified Trust Breakdown (never raw license number)
        trustCard: {
          phoneVerified: Boolean(row.phone_verified),
          identityVerified: Boolean(row.identity_verified),
          nurseLicenseVerified: Boolean(row.is_nurse_verified),
          badgeLabel: row.is_nurse_verified
            ? `Active Professional License (${row.profession_type || 'RN'} — ${row.clinical_state_board || 'NC'})`
            : 'License Verification in Progress',
        },
      },
    }));

    res.json({ guests: sanitizedGuests });
  } catch (err: any) {
    console.error('[Host Guests API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve guest roster' });
  }
});

/**
 * Update Arrival Instructions
 * PUT /api/host/bookings/:id/arrival-instructions
 */
router.put('/bookings/:id/arrival-instructions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id;
    const hostId = req.user?.id;
    const { arrivalInstructions } = req.body;

    const bookingRes = await db.query(`
      SELECT b.*, l.title as listing_title, u.id as traveler_id, u.full_name as traveler_name
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      JOIN users u ON b.traveler_id = u.id
      WHERE b.id = $1 AND b.host_id = $2
    `, [bookingId, hostId]);

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking reservation not found' });
    }

    const booking = bookingRes.rows[0];

    await db.query(
      'UPDATE bookings SET arrival_instructions = $1, updated_at = NOW() WHERE id = $2',
      [arrivalInstructions, bookingId]
    );

    // Notify clinician
    await notificationDispatcher.notify({
      eventKey: 'arrival_instructions',
      recipientId: booking.traveler_id,
      variables: {
        property_title: booking.listing_title,
      },
      actionUrl: '/nurse/dashboard',
      bookingId: booking.id,
    });

    res.json({ success: true, message: 'Arrival instructions updated and nurse notified.' });
  } catch (err: any) {
    console.error('[Arrival Instructions API] Error:', err.message);
    res.status(500).json({ error: 'Failed to save arrival instructions' });
  }
});

/**
 * 4. Decide on Stay Extension Request
 * POST /api/host/extensions/:extensionId/decide
 */
router.post('/extensions/:extensionId/decide', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const extensionId = req.params.extensionId;
    const hostId = req.user?.id;
    const { decision } = req.body; // 'approved' | 'declined'

    if (!['approved', 'declined'].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'approved' or 'declined'" });
    }

    const extRes = await db.query(`
      SELECT se.*, b.total_rent, b.start_date, b.end_date, l.title as listing_title, l.id as listing_id
      FROM stay_extensions se
      JOIN bookings b ON se.booking_id = b.id
      JOIN listings l ON b.listing_id = l.id
      WHERE se.id = $1 AND se.host_id = $2 AND se.status = 'requested'
    `, [extensionId, hostId]);

    if (extRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pending stay extension request not found' });
    }

    const ext = extRes.rows[0];

    if (decision === 'approved') {
      // Capture Stripe hold if live
      if (ext.stripe_payment_intent_id && !ext.stripe_payment_intent_id.includes('mock')) {
        try {
          await stripe.paymentIntents.capture(ext.stripe_payment_intent_id);
        } catch (stripeErr: any) {
          console.warn('[Stripe Extension Capture] Notice:', stripeErr.message);
        }
      }

      // Update in database
      const newTotalRent = Number(ext.total_rent) + Number(ext.prorated_rent_amount);
      await db.query(`
        UPDATE stay_extensions SET status = 'approved', resolved_at = NOW() WHERE id = $1;
        UPDATE bookings SET end_date = $2, total_rent = $3, gross_booking_value = gross_booking_value + $4 WHERE id = $5;
        INSERT INTO calendar_blocks (listing_id, start_date, end_date, reason, booking_id)
        VALUES ($6, $7, $8, 'booking', $5);
      `, [
        extensionId,
        ext.requested_end_date,
        newTotalRent,
        ext.prorated_rent_amount,
        ext.booking_id,
        ext.listing_id,
        ext.previous_end_date,
        ext.requested_end_date,
      ]);

      // Fire notification to nurse
      await notificationDispatcher.notify({
        eventKey: 'extension_approved',
        recipientId: ext.traveler_id,
        variables: {
          property_title: ext.listing_title,
          requested_end_date: ext.requested_end_date,
        },
        actionUrl: '/nurse/dashboard',
        bookingId: ext.booking_id,
      });

      return res.json({ success: true, message: 'Stay extension approved and payment captured.' });
    } else {
      // Release Stripe hold if live
      if (ext.stripe_payment_intent_id && !ext.stripe_payment_intent_id.includes('mock')) {
        try {
          await stripe.paymentIntents.cancel(ext.stripe_payment_intent_id);
        } catch (stripeErr: any) {
          console.warn('[Stripe Extension Cancel] Notice:', stripeErr.message);
        }
      }

      await db.query(`
        UPDATE stay_extensions SET status = 'declined', resolved_at = NOW() WHERE id = $1
      `, [extensionId]);

      // Fire notification to nurse
      await notificationDispatcher.notify({
        eventKey: 'extension_declined',
        recipientId: ext.traveler_id,
        variables: {
          property_title: ext.listing_title,
          requested_end_date: ext.requested_end_date,
        },
        actionUrl: '/nurse/dashboard',
        bookingId: ext.booking_id,
      });

      return res.json({ success: true, message: 'Stay extension declined and card hold released.' });
    }
  } catch (err: any) {
    console.error('[Host Extension Decision API] Error:', err.message);
    res.status(500).json({ error: 'Failed to process extension decision' });
  }
});

/**
 * 5. Stripe Connect Earnings & Payouts
 * GET /api/host/earnings
 */
router.get('/earnings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hostId = req.user?.id;
    const userRes = await db.query(
      'SELECT stripe_connected_account_id, stripe_payouts_enabled FROM users WHERE id = $1',
      [hostId]
    );
    const hostUser = userRes.rows[0];

    const bookingsRes = await db.query(`
      SELECT 
        b.id, b.start_date, b.end_date, b.total_rent, b.cleaning_fee, b.pet_fee,
        b.host_platform_fee_percent, b.host_platform_fee_amount, b.host_payout_amount,
        b.payout_held, b.status, b.paid_at,
        l.title as listing_title,
        u.full_name as traveler_name
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      JOIN users u ON b.traveler_id = u.id
      WHERE b.host_id = $1 AND b.status IN ('accepted', 'paid', 'active', 'completed')
      ORDER BY b.paid_at DESC NULLS LAST
    `, [hostId]);

    let totalGross = 0;
    let totalPlatformFee = 0;
    let totalNetPayout = 0;

    const items = bookingsRes.rows.map((row: any) => {
      const gross = Number(row.total_rent || 0) + Number(row.cleaning_fee || 0) + Number(row.pet_fee || 0);
      const feePercent = row.host_platform_fee_percent == null ? 5.00 : Number(row.host_platform_fee_percent);
      const feeAmount = row.host_platform_fee_amount == null ? Number((Number(row.total_rent || 0) * (feePercent / 100)).toFixed(2)) : Number(row.host_platform_fee_amount);
      const net = Number(row.host_payout_amount || (gross - feeAmount));

      totalGross += gross;
      totalPlatformFee += feeAmount;
      totalNetPayout += net;

      return {
        bookingId: row.id,
        listingTitle: row.listing_title,
        travelerName: row.traveler_name,
        startDate: row.start_date,
        endDate: row.end_date,
        grossEarnings: Math.round(gross * 100) / 100,
        platformFeeDeducted: Math.round(feeAmount * 100) / 100,
        feePercent,
        netPayout: Math.round(net * 100) / 100,
        payoutStatus: row.payout_held ? 'on_hold' : (row.status === 'completed' ? 'paid' : 'in_transit'),
        paidAt: row.paid_at,
      };
    });

    res.json({
      earnings: {
        stripeConnected: Boolean(hostUser?.stripe_connected_account_id),
        payoutsEnabled: Boolean(hostUser?.stripe_payouts_enabled),
        totalGross: Math.round(totalGross * 100) / 100,
        totalPlatformFee: Math.round(totalPlatformFee * 100) / 100,
        totalNetPayout: Math.round(totalNetPayout * 100) / 100,
        items,
      },
    });
  } catch (err: any) {
    console.error('[Host Earnings API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve earnings summary' });
  }
});

export default router;
