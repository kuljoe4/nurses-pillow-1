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
 * 1. Current, Upcoming & Past Stays for Traveling Clinicians
 * GET /api/nurse/stays?filter=current|upcoming|past
 */
router.get('/stays', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const filter = (req.query.filter as string) || 'current';
    const today = new Date().toISOString().split('T')[0];

    let dateCondition = '';
    if (filter === 'current') {
      dateCondition = `AND b.start_date <= '${today}' AND b.end_date >= '${today}' AND b.status IN ('accepted', 'paid', 'active')`;
    } else if (filter === 'upcoming') {
      dateCondition = `AND (b.start_date > '${today}' OR b.status = 'requested') AND b.status NOT IN ('cancelled', 'declined', 'completed')`;
    } else if (filter === 'past') {
      dateCondition = `AND (b.end_date < '${today}' OR b.status = 'completed')`;
    }

    const query = `
      SELECT 
        b.id, b.listing_id, b.room_id, b.start_date, b.end_date, b.assignment_duration_weeks,
        b.status, b.base_monthly_rent, b.total_rent, b.cleaning_fee, b.pet_fee,
        b.gross_booking_value, b.traveler_platform_fee, b.discount_amount,
        b.arrival_instructions, b.requested_at, b.accepted_at, b.paid_at,
        b.stripe_payment_intent_id,
        l.title as listing_title, l.city, l.state, l.postal_code, l.address_line1,
        l.property_type, l.monthly_rent,
        h.name as hospital_name, h.health_system,
        u.full_name as host_name, u.phone_number as host_phone,
        se.id as active_extension_id, se.status as extension_status, 
        se.requested_end_date as extension_requested_end_date,
        se.prorated_rent_amount as extension_prorated_rent
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      LEFT JOIN healthcare_facilities h ON b.hospital_id = h.id
      LEFT JOIN users u ON b.host_id = u.id
      LEFT JOIN stay_extensions se ON se.booking_id = b.id AND se.status = 'requested'
      WHERE b.traveler_id = $1 ${dateCondition}
      ORDER BY b.start_date DESC
    `;

    const result = await db.query(query, [userId]);

    const sanitizedStays = result.rows.map((row: any) => {
      const isConfirmed = ['accepted', 'paid', 'active', 'completed'].includes(row.status);
      const startDate = new Date(row.start_date);
      const now = new Date();
      const diffTime = startDate.getTime() - now.getTime();
      const daysUntilMoveIn = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      return {
        id: row.id,
        listing_id: row.listing_id,
        listing_title: row.listing_title,
        property_type: row.property_type,
        city: row.city,
        state: row.state,
        // Privacy Gating: Full street address and arrival instructions exposed ONLY after confirmation
        address_line1: isConfirmed ? row.address_line1 : undefined,
        postal_code: isConfirmed ? row.postal_code : undefined,
        arrival_instructions: isConfirmed ? row.arrival_instructions : null,
        host_name: isConfirmed ? row.host_name : 'Verified Host',
        host_phone: isConfirmed ? row.host_phone : undefined,
        start_date: row.start_date,
        end_date: row.end_date,
        duration_weeks: row.assignment_duration_weeks,
        status: row.status,
        monthly_rent: Number(row.base_monthly_rent || row.monthly_rent || 0),
        total_rent: Number(row.total_rent || 0),
        cleaning_fee: Number(row.cleaning_fee || 0),
        pet_fee: Number(row.pet_fee || 0),
        discount_amount: Number(row.discount_amount || 0),
        traveler_platform_fee: 0.00, // Strict $0 Traveler Fee guarantee
        hospital_name: row.hospital_name || 'Hospital Assignment',
        health_system: row.health_system,
        days_until_move_in: daysUntilMoveIn,
        extension: row.active_extension_id ? {
          id: row.active_extension_id,
          status: row.extension_status,
          requested_end_date: row.extension_requested_end_date,
          prorated_rent: Number(row.extension_prorated_rent || 0),
        } : null,
      };
    });

    res.json({ stays: sanitizedStays });
  } catch (err: any) {
    console.error('[Nurse Stays API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve traveler stays' });
  }
});

/**
 * 2. Prorated Extension Quote
 * POST /api/bookings/:id/extensions/quote
 */
router.post('/bookings/:id/extensions/quote', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { requestedEndDate } = req.body;

    if (!requestedEndDate) {
      return res.status(400).json({ error: 'requestedEndDate is required' });
    }

    const bookingRes = await db.query(
      `SELECT b.*, l.monthly_rent as listing_monthly_rent 
       FROM bookings b 
       JOIN listings l ON b.listing_id = l.id 
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking reservation not found' });
    }

    const booking = bookingRes.rows[0];

    const currentEndDate = new Date(booking.end_date);
    const targetEndDate = new Date(requestedEndDate);

    if (targetEndDate <= currentEndDate) {
      return res.status(400).json({ error: 'New check-out date must be after current check-out date' });
    }

    const diffDays = Math.ceil((targetEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthlyRent = Number(booking.base_monthly_rent || booking.listing_monthly_rent || 2000);
    const dailyRate = monthlyRent / 30;
    const proratedRent = Math.round(dailyRate * diffDays * 100) / 100;

    // Check calendar blocks conflict
    const conflictRes = await db.query(`
      SELECT id FROM calendar_blocks 
      WHERE listing_id = $1 
        AND booking_id != $2
        AND daterange(start_date, end_date, '[)') && daterange($3::date, $4::date, '[)')
    `, [booking.listing_id, booking.id, booking.end_date, requestedEndDate]);

    const isAvailable = conflictRes.rows.length === 0;

    res.json({
      bookingId,
      currentEndDate: booking.end_date,
      requestedEndDate,
      extensionDays: diffDays,
      dailyRate: Math.round(dailyRate * 100) / 100,
      monthlyRent,
      proratedRent,
      travelerPlatformFee: 0.00,
      securityDepositHold: 0.00,
      totalCharged: proratedRent,
      isAvailable,
    });
  } catch (err: any) {
    console.error('[Extension Quote API] Error:', err.message);
    res.status(500).json({ error: 'Failed to calculate stay extension quote' });
  }
});

/**
 * 3. Submit Stay Extension Request
 * POST /api/bookings/:id/extensions
 */
router.post('/bookings/:id/extensions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.id;
    const { requestedEndDate, proratedRent } = req.body;

    const bookingRes = await db.query(
      `SELECT b.*, l.title as listing_title, u.full_name as nurse_name, h.stripe_connected_account_id
       FROM bookings b 
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.traveler_id = u.id
       JOIN users h ON b.host_id = h.id
       WHERE b.id = $1 AND b.traveler_id = $2`,
      [bookingId, userId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Active booking reservation not found' });
    }

    const booking = bookingRes.rows[0];

    // Read current dynamic host fee
    const feeRes = await db.query('SELECT host_fee_percent FROM platform_fee_settings WHERE id = 1');
    const hostFeePercent = Number(feeRes.rows[0]?.host_fee_percent || 5.00);

    const amountInCents = Math.round(Number(proratedRent) * 100);
    const applicationFeeInCents = Math.round(amountInCents * (hostFeePercent / 100));

    let paymentIntentId = `pi_ext_mock_${Date.now()}`;
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock') && booking.stripe_connected_account_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          capture_method: 'manual',
          application_fee_amount: applicationFeeInCents,
          transfer_data: {
            destination: booking.stripe_connected_account_id,
          },
          metadata: {
            booking_id: booking.id,
            extension_type: 'stay_extension',
            nurse_id: userId || '',
          },
        });
        paymentIntentId = paymentIntent.id;
      } catch (stripeErr: any) {
        console.warn('[Stripe Extension Hold] Fallback to simulated payment intent:', stripeErr.message);
      }
    }

    const extRes = await db.query(`
      INSERT INTO stay_extensions 
        (booking_id, traveler_id, host_id, previous_end_date, requested_end_date, prorated_rent_amount, platform_host_fee_percent, stripe_payment_intent_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'requested')
      RETURNING *
    `, [
      booking.id,
      booking.traveler_id,
      booking.host_id,
      booking.end_date,
      requestedEndDate,
      proratedRent,
      hostFeePercent,
      paymentIntentId,
    ]);

    // Dispatch extension_requested notification to host
    await notificationDispatcher.notify({
      eventKey: 'extension_requested',
      recipientId: booking.host_id,
      variables: {
        nurse_name: booking.nurse_name,
        property_title: booking.listing_title,
        requested_end_date: requestedEndDate,
        amount: proratedRent,
      },
      actionUrl: '/host/dashboard',
      bookingId: booking.id,
    });

    res.json({
      success: true,
      message: 'Extension request sent to your host.',
      extension: extRes.rows[0],
    });
  } catch (err: any) {
    console.error('[Extension Request API] Error:', err.message);
    res.status(500).json({ error: 'Failed to submit stay extension request' });
  }
});

/**
 * 4. Saved Pillows (Favorites)
 * GET /api/nurse/saved-pillows
 */
router.get('/saved-pillows', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(`
      SELECT 
        sl.id as saved_id, sl.created_at as saved_at,
        l.id as listing_id, l.title, l.monthly_rent, l.city, l.state, l.property_type,
        l.is_published, l.is_verified_by_admin,
        COALESCE(
          (SELECT photo_url FROM listing_photos WHERE listing_id = l.id ORDER BY display_order ASC LIMIT 1),
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'
        ) as cover_photo,
        sl.target_hospital_name, sl.distance_miles
      FROM saved_listings sl
      JOIN listings l ON sl.listing_id = l.id
      WHERE sl.user_id = $1
      ORDER BY sl.created_at DESC
    `, [userId]);

    res.json({ savedPillows: result.rows });
  } catch (err: any) {
    console.error('[Saved Pillows API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve saved pillows' });
  }
});

router.post('/saved-pillows', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { listingId, targetHospitalName, distanceMiles } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    await db.query(`
      INSERT INTO saved_listings (user_id, listing_id, target_hospital_name, distance_miles)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, listing_id) DO NOTHING
    `, [userId, listingId, targetHospitalName || 'Assigned Hospital', distanceMiles || 5.0]);

    res.json({ success: true, message: 'Saved to your Pillows' });
  } catch (err: any) {
    console.error('[Save Pillow API] Error:', err.message);
    res.status(500).json({ error: 'Failed to save pillow' });
  }
});

router.delete('/saved-pillows/:listingId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const listingId = req.params.listingId;

    await db.query(
      'DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
      [userId, listingId]
    );

    res.json({ success: true, message: 'Removed from your Pillows' });
  } catch (err: any) {
    console.error('[Delete Pillow API] Error:', err.message);
    res.status(500).json({ error: 'Failed to remove saved pillow' });
  }
});

/**
 * 5. Verification Status Hub
 * GET /api/nurse/verification-status
 */
router.get('/verification-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRes = await db.query(`
      SELECT 
        id, email, full_name, phone_number, phone_verified, email_verified,
        identity_verified, is_nurse_verified, verification_status,
        clinical_license_number, clinical_state_board, profession_type,
        primary_source_name, document_purged, document_purged_at
      FROM users WHERE id = $1
    `, [userId]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = userRes.rows[0];

    res.json({
      phone: {
        verified: Boolean(u.phone_verified),
        number: u.phone_number ? u.phone_number.replace(/\d(?=\d{4})/g, '*') : null,
      },
      identity: {
        verified: Boolean(u.identity_verified),
        provider: 'Stripe Identity Biometric',
      },
      license: {
        verified: Boolean(u.is_nurse_verified),
        status: u.verification_status || 'unverified',
        profession: u.profession_type || 'Registered Nurse (RN)',
        stateBoard: u.clinical_state_board || 'NC Board of Nursing',
        primarySource: u.primary_source_name || 'Nursys QuickConfirm',
        documentPurged: Boolean(u.document_purged),
        documentPurgedAt: u.document_purged_at,
      },
    });
  } catch (err: any) {
    console.error('[Verification Status API] Error:', err.message);
    res.status(500).json({ error: 'Failed to load verification status' });
  }
});

/**
 * 6. Itemized Receipts & Invoices
 * GET /api/nurse/receipts
 */
router.get('/receipts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await db.query(`
      SELECT 
        b.id, b.start_date, b.end_date, b.assignment_duration_weeks,
        b.base_monthly_rent, b.total_rent, b.cleaning_fee, b.pet_fee,
        b.discount_amount, b.traveler_platform_fee, b.gross_booking_value,
        b.stripe_payment_intent_id, b.paid_at, b.status,
        l.title as listing_title, l.city, l.state,
        h.name as hospital_name
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      LEFT JOIN healthcare_facilities h ON b.hospital_id = h.id
      WHERE b.traveler_id = $1 AND b.status IN ('paid', 'active', 'completed')
      ORDER BY b.paid_at DESC NULLS LAST
    `, [userId]);

    res.json({ receipts: result.rows });
  } catch (err: any) {
    console.error('[Receipts API] Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve receipts' });
  }
});

/**
 * 7. Rebook Pre-fill
 * GET /api/nurse/bookings/:id/rebook-prefill
 */
router.get('/bookings/:id/rebook-prefill', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.id;

    const result = await db.query(`
      SELECT b.listing_id, b.room_id, b.hospital_id, l.title, l.monthly_rent, l.city, l.state,
             h.name as hospital_name
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      LEFT JOIN healthcare_facilities h ON b.hospital_id = h.id
      WHERE b.id = $1 AND b.traveler_id = $2
    `, [bookingId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ prefill: result.rows[0] });
  } catch (err: any) {
    console.error('[Rebook Prefill API] Error:', err.message);
    res.status(500).json({ error: 'Failed to pre-fill rebooking' });
  }
});

export default router;
