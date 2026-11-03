import React, { useState, useEffect, useRef } from 'react';
import { BookingRequest, HousingListing } from '../types';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
  listing?: HousingListing;
  isNightShiftMode: boolean;
  onCancelBooking: (bookingId: string) => Promise<void> | void;
  onGoToHousing: () => void;
  onOpenHostProfile?: (hostId: string) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  listing,
  isNightShiftMode,
  onCancelBooking,
  onGoToHousing,
  onOpenHostProfile,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const cancelConfirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showCancelConfirm && cancelConfirmRef.current) {
      cancelConfirmRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showCancelConfirm]);

  if (!isOpen || !booking) return null;

  const isAccepted = booking.status === 'approved' || booking.status === 'active';
  const isDeclined = booking.status === 'declined';
  const isPending = !isAccepted && !isDeclined;

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancelBooking(booking.id);
      setShowCancelConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to cancel request:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
      className="fixed inset-0 z-[150] flex items-start justify-center p-3 sm:p-4 pt-16 sm:pt-20 bg-black/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
    >
      <div
        className={`w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(11,37,89,0.2)] border border-[rgba(11,37,89,0.08)] dark:border-[#233550] overflow-hidden transition-all duration-200 ${
          isNightShiftMode ? 'bg-[#0B1626] text-[#E6ECF7]' : 'bg-white text-[#0B2559]'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="px-2.5 py-1 rounded-sm text-xs font-bold uppercase tracking-wider"
              style={
                isAccepted
                  ? { backgroundColor: '#E1EFE9', color: '#2F6E5E' }
                  : isDeclined
                  ? { backgroundColor: '#F4E2DC', color: '#A8452E' }
                  : { backgroundColor: '#FBF0D6', color: '#B9822E' }
              }
            >
              {isAccepted ? 'Accepted' : isDeclined ? 'Declined' : 'Requested'}
            </span>
            <span className="text-xs text-gray-500 font-medium">Booking Request Details</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] transition-colors cursor-pointer"
            aria-label="Close booking details"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto custom-scrollbar">
          {/* 4-Step Booking Stepper */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2">
              <span className={isPending ? 'text-[#B9822E] dark:text-[#f3d289]' : isAccepted ? 'text-[#2F6E5E]' : ''}>
                1. Requested
              </span>
              <span className={isAccepted ? 'text-[#2F6E5E] dark:text-[#aff0db]' : ''}>
                2. Accepted
              </span>
              <span>3. Paid</span>
              <span>4. Upcoming</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 items-center">
              {/* Step 1: Requested */}
              <div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: isDeclined ? '#A8452E' : '#B9822E' }}
              />
              {/* Step 2: Accepted */}
              <div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: isAccepted ? '#2F6E5E' : 'rgba(11,37,89,0.1)' }}
              />
              {/* Step 3: Paid */}
              <div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: isAccepted ? '#2F6E5E' : 'rgba(11,37,89,0.1)' }}
              />
              {/* Step 4: Upcoming */}
              <div
                className="h-1.5 rounded-full"
                style={{ backgroundColor: isAccepted ? '#2F6E5E' : 'rgba(11,37,89,0.1)' }}
              />
            </div>
          </div>

          {/* Property Identity Card */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#EFF6FB] dark:bg-[#0E1A2E] border border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
            <img
              src={
                listing?.images?.[0] ||
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'
              }
              alt={booking.listingTitle}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 id="booking-detail-title" className="text-base font-bold text-[#0B2559] dark:text-white truncate">
                {booking.listingTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {booking.hospitalName} {booking.unitSpecialty ? `• ${booking.unitSpecialty}` : ''}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#0A6FA8] dark:text-[#3E9AD1] font-semibold mt-1">
                <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                <span>
                  {booking.startDate} – {booking.endDate} ({booking.durationWeeks || 13} Weeks)
                </span>
              </div>
            </div>
          </div>

          {/* Reassurance Explainer Box */}
          <div className="p-4 rounded-2xl bg-[#FBF0D6]/60 dark:bg-[#2a2212] border border-[#B9822E]/25 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#745b0d] dark:text-[#f3d289]">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Temporary Card Pre-Authorization Hold</span>
            </div>
            <p className="text-[#0B2559]/80 dark:text-[#E6ECF7]/80 leading-relaxed">
              No funds have been withdrawn. A temporary authorization hold has been placed on your card and will only be captured if the host accepts your request.
            </p>
          </div>

          {/* Host Wait Time Notice */}
          {isPending && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#14233a] border border-gray-200 dark:border-gray-700 text-xs space-y-1">
              <div className="font-semibold text-[#0B2559] dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#0A6FA8]">schedule</span>
                <span>Waiting for Host Response (24-Hour SLA)</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Your request has been delivered to your host. We&apos;ll notify you via email the moment they respond. If the host doesn&apos;t reply within 24 hours, the authorization hold releases automatically.
              </p>
            </div>
          )}

          {onOpenHostProfile && (
            <button
              type="button"
              onClick={() => onOpenHostProfile(listing?.hostId || 'host-sarah-m')}
              className="w-full py-2.5 rounded-full bg-white dark:bg-[#0E1A2E] border border-gray-200 dark:border-gray-700 text-xs font-bold text-[#0A6FA8] dark:text-[#3E9AD1] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>View Verified Host Profile</span>
            </button>
          )}

          {/* Itemized Transparent Pricing Breakdown */}
          <div className="p-4 rounded-2xl bg-[#EFF6FB] dark:bg-[#0E1A2E] border border-[rgba(11,37,89,0.06)] dark:border-[#233550] space-y-2 text-xs">
            <div className="font-bold text-[#0B2559] dark:text-white mb-1">Itemized Transparent Pricing</div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Monthly Rent</span>
              <span className="font-semibold tabular-nums">${booking.monthlyRent?.toLocaleString()} / mo</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>One-Time Cleaning Fee</span>
              <span className="font-semibold tabular-nums">${booking.cleaningFee || 150}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Traveler Platform Fee</span>
              <span className="font-bold text-[#2F6E5E] dark:text-[#aff0db] tabular-nums">$0.00</span>
            </div>
            <div className="pt-2 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex justify-between font-bold text-[#0B2559] dark:text-white">
              <span>Total Initial Pre-Authorization</span>
              <span className="tabular-nums text-sm text-[#0A6FA8] dark:text-[#3E9AD1]">
                ${booking.totalInitialCharge?.toLocaleString() || (booking.monthlyRent + (booking.cleaningFee || 150)).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cancel Confirmation Prompt */}
          {showCancelConfirm && (
            <div ref={cancelConfirmRef} className="p-4 rounded-2xl bg-[#F4E2DC] dark:bg-[#2b1712] border border-[#A8452E]/30 text-xs space-y-3">
              <div className="font-bold text-[#A8452E] dark:text-[#F4E2DC] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Release authorization hold and cancel request?</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your pre-authorization hold will be released immediately with zero cancellation fees. Your card will not be charged.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-full bg-[#A8452E] hover:bg-[#8e3925] text-white font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Releasing hold...' : 'Yes, cancel request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-semibold hover:bg-white dark:hover:bg-[#15233a] cursor-pointer"
                >
                  Keep request
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-[#0E1A2E]/50">
          <div className="flex items-center gap-2">
            {isPending && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2 rounded-full border border-[#A8452E]/40 text-[#A8452E] dark:text-[#F4E2DC] hover:bg-[#F4E2DC] dark:hover:bg-[#2b1712] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel Request
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToHousing();
              }}
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-[#182840] transition-colors cursor-pointer"
            >
              Search Other Stays
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
