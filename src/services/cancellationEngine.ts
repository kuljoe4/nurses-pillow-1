// Nurses Pillow - Cancellation & Automated Refund Policy Engine
// Implements 3 Contractual Tiers: Flexible (30d), Moderate (60d), Strict (90d)

export type CancellationTier = 'flexible_30d' | 'moderate_60d' | 'strict_90d';

export interface RefundBreakdown {
  tier: CancellationTier;
  tierName: string;
  daysPriorToMoveIn: number;
  lodgingRefundPercentage: number;
  grossLodgingPaid: number;
  lodgingRefundAmount: number;
  cleaningFeePaid: number;
  cleaningFeeRefundAmount: number;
  securityDepositHoldAmount: number;
  securityDepositStatus: 'hold_released_zero_charged' | 'no_deposit_required';
  travelerPlatformFeeRefund: number;
  totalRefundAmount: number;
  hostRetainedAmount: number;
  platformFeeRetainedAmount: number;
  isPriorToMoveIn: boolean;
  policySummary: string;
  stripeRefundPayload: {
    charge_id: string;
    amount_in_cents: number;
    reason: 'requested_by_customer';
    reverse_transfer: boolean;
    metadata: {
      cancellation_tier: string;
      days_prior: number;
      cleaning_fee_refunded: string;
    };
  };
}

export class CancellationRefundEngine {
  static getTierDetails(tier: CancellationTier) {
    switch (tier) {
      case 'flexible_30d':
        return {
          name: 'Flexible Tier (30-Day)',
          summary: '100% refund 30+ days prior, 50% refund 14–29 days, 0% refund <14 days.',
          rules: [
            { minDays: 30, percentage: 100, label: '30+ Days Prior' },
            { minDays: 14, maxDays: 29, percentage: 50, label: '14–29 Days Prior' },
            { minDays: 0, maxDays: 13, percentage: 0, label: 'Under 14 Days Prior' },
          ],
        };
      case 'moderate_60d':
        return {
          name: 'Moderate Tier (60-Day)',
          summary: '100% refund 60+ days prior, 50% refund 30–59 days, 0% refund <30 days.',
          rules: [
            { minDays: 60, percentage: 100, label: '60+ Days Prior' },
            { minDays: 30, maxDays: 59, percentage: 50, label: '30–59 Days Prior' },
            { minDays: 0, maxDays: 29, percentage: 0, label: 'Under 30 Days Prior' },
          ],
        };
      case 'strict_90d':
        return {
          name: 'Strict Tier (90-Day)',
          summary: '100% refund 90+ days prior, 50% refund 60–89 days, 0% refund <60 days.',
          rules: [
            { minDays: 90, percentage: 100, label: '90+ Days Prior' },
            { minDays: 60, maxDays: 89, percentage: 50, label: '60–89 Days Prior' },
            { minDays: 0, maxDays: 59, percentage: 0, label: 'Under 60 Days Prior' },
          ],
        };
    }
  }

  static calculateDaysDifference(checkInDate: string, cancellationDate: string = new Date().toISOString()): number {
    const checkIn = new Date(checkInDate).getTime();
    const cancel = new Date(cancellationDate).getTime();
    const diffMs = checkIn - cancel;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  static evaluateRefund(params: {
    tier: CancellationTier;
    monthlyRent: number;
    cleaningFee: number;
    securityDeposit: number;
    daysPrior: number;
    isPriorToMoveIn?: boolean;
    chargeId?: string;
  }): RefundBreakdown {
    const {
      tier,
      monthlyRent,
      cleaningFee,
      securityDeposit,
      daysPrior,
      isPriorToMoveIn = daysPrior >= 0,
      chargeId = 'ch_test_sample',
    } = params;

    let lodgingRefundPercentage = 0;

    if (tier === 'flexible_30d') {
      if (daysPrior >= 30) {
        lodgingRefundPercentage = 100;
      } else if (daysPrior >= 14) {
        lodgingRefundPercentage = 50;
      } else {
        lodgingRefundPercentage = 0;
      }
    } else if (tier === 'moderate_60d') {
      if (daysPrior >= 60) {
        lodgingRefundPercentage = 100;
      } else if (daysPrior >= 30) {
        lodgingRefundPercentage = 50;
      } else {
        lodgingRefundPercentage = 0;
      }
    } else if (tier === 'strict_90d') {
      if (daysPrior >= 90) {
        lodgingRefundPercentage = 100;
      } else if (daysPrior >= 60) {
        lodgingRefundPercentage = 50;
      } else {
        lodgingRefundPercentage = 0;
      }
    }

    const lodgingRefundAmount = Number((monthlyRent * (lodgingRefundPercentage / 100)).toFixed(2));

    const cleaningFeeRefundAmount = isPriorToMoveIn ? cleaningFee : 0;

    const securityDepositStatus =
      securityDeposit > 0 ? 'hold_released_zero_charged' : 'no_deposit_required';

    const totalRefundAmount = Number((lodgingRefundAmount + cleaningFeeRefundAmount).toFixed(2));

    const lodgingRetained = monthlyRent - lodgingRefundAmount;
    const platformFeeRetainedAmount = Number((lodgingRetained * 0.05).toFixed(2));
    const hostRetainedAmount = Number((lodgingRetained - platformFeeRetainedAmount).toFixed(2));

    const tierInfo = this.getTierDetails(tier);

    return {
      tier,
      tierName: tierInfo.name,
      daysPriorToMoveIn: daysPrior,
      lodgingRefundPercentage,
      grossLodgingPaid: monthlyRent,
      lodgingRefundAmount,
      cleaningFeePaid: cleaningFee,
      cleaningFeeRefundAmount,
      securityDepositHoldAmount: securityDeposit,
      securityDepositStatus,
      travelerPlatformFeeRefund: 0,
      totalRefundAmount,
      hostRetainedAmount,
      platformFeeRetainedAmount,
      isPriorToMoveIn,
      policySummary: tierInfo.summary,
      stripeRefundPayload: {
        charge_id: chargeId,
        amount_in_cents: Math.round(totalRefundAmount * 100),
        reason: 'requested_by_customer',
        reverse_transfer: true,
        metadata: {
          cancellation_tier: tier,
          days_prior: daysPrior,
          cleaning_fee_refunded: '100% auto-refunded prior to move-in',
        },
      },
    };
  }
}
