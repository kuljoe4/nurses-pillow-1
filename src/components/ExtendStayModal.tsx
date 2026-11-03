import React, { useState, useEffect } from 'react';

interface ExtendStayModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

export const ExtendStayModal: React.FC<ExtendStayModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [requestedEndDate, setRequestedEndDate] = useState<string>('');
  const [quote, setQuote] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default extension to 30 days after current end_date
  useEffect(() => {
    if (booking?.end_date || booking?.endDate) {
      const curEnd = new Date(booking.end_date || booking.endDate);
      const target = new Date(curEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
      setRequestedEndDate(target.toISOString().split('T')[0]);
    }
  }, [booking]);

  // Fetch prorated quote whenever requestedEndDate changes
  useEffect(() => {
    if (!booking?.id || !requestedEndDate) return;

    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      setError(null);
      try {
        const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
        const res = await fetch(`/api/bookings/${booking.id}/extensions/quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ requestedEndDate }),
        });

        if (res.ok) {
          const data = await res.json();
          setQuote(data);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Unable to quote extension');
          setQuote(null);
        }
      } catch (err: any) {
        setError('Network error fetching extension quote');
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [booking?.id, requestedEndDate]);

  // Submit extension
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch(`/api/bookings/${booking.id}/extensions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          requestedEndDate,
          proratedRent: quote.proratedRent,
        }),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
        alert('Stay extension requested! Your host has been notified to confirm.');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to request extension');
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-lg w-full p-6 border border-gray-100 dark:border-[#233550] shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
              Clinician Stay Extension
            </span>
            <h2 className="text-lg font-bold text-[#0B2559] dark:text-white mt-0.5">
              Extend Your Stay at {booking.listing_title || booking.listingTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Dates Picker */}
          <div className="p-4 rounded-2xl bg-[#EFF6FB] dark:bg-[#0E1A2E] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">Current check-out:</span>
              <span className="font-semibold text-[#0B2559] dark:text-white tabular-nums">
                {booking.end_date || booking.endDate}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2559] dark:text-white mb-1.5">
                Requested new check-out date:
              </label>
              <input
                type="date"
                required
                value={requestedEndDate}
                min={booking.end_date || booking.endDate}
                onChange={(e) => setRequestedEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[rgba(11,37,89,0.15)] dark:border-[#233550] bg-white dark:bg-[#0B1626] text-[#0B2559] dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Prorated Breakdown */}
          {isLoadingQuote ? (
            <div className="py-6 text-center text-xs text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0]">
              Calculating daily proration and checking host calendar...
            </div>
          ) : quote ? (
            <div className="border border-gray-100 dark:border-[#233550] rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-semibold text-[#0B2559] dark:text-white">
                Itemized Extension Quote
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">
                  <span>Prorated Daily Rent (${quote.dailyRate}/day × {quote.extensionDays} days)</span>
                  <span className="tabular-nums font-medium text-[#0B2559] dark:text-white">
                    ${quote.proratedRent.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">
                  <span>Traveler Platform Fee</span>
                  <span className="tabular-nums font-semibold text-teal-600 dark:text-teal-400">
                    $0.00 (Free)
                  </span>
                </div>
                <div className="flex justify-between text-[rgba(11,37,89,0.7)] dark:text-[#A0AEC0]">
                  <span>Security Deposit</span>
                  <span className="tabular-nums font-medium text-[#0B2559] dark:text-white">
                    $0.00 (Waived)
                  </span>
                </div>
                <div className="border-t border-gray-100 dark:border-[#233550] pt-2 flex justify-between font-bold text-sm text-[#0B2559] dark:text-white">
                  <span>Total Amount for Extension</span>
                  <span className="tabular-nums text-[#0A6FA8] dark:text-[#3E9AD1]">
                    ${quote.totalCharged.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-[rgba(11,37,89,0.66)] dark:text-[#A0AEC0] italic leading-relaxed">
            A temporary pre-authorization hold is placed when you submit. Your card is only charged once your host approves the extension.
          </p>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!quote || isSubmitting}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#0A6FA8] text-white hover:bg-[#0C7EBF] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Request Stay Extension'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
