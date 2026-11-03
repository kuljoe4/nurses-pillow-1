import React, { useState } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('np_auth_token') || sessionStorage.getItem('np_auth_token');
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bookingId: booking.id,
          rating,
          comment: comment.trim(),
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 1500);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#0B1626] rounded-3xl max-w-md w-full p-6 border border-gray-100 dark:border-[#233550] shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
              Verified Stay Review
            </span>
            <h2 className="text-lg font-bold text-[#0B2559] dark:text-white mt-0.5">
              Review {booking.listing_title || booking.listingTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {isSuccess && (
          <div className="p-3.5 rounded-xl bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#142823] dark:text-[#aff0db] text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Thank you! Your verified review helps traveling clinicians rest well.</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Rating stars */}
          <div>
            <label className="block text-xs font-semibold text-[#0B2559] dark:text-white mb-1.5">
              Overall Stay Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <span
                    className={`material-symbols-outlined text-2xl ${
                      star <= rating ? 'text-amber-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    star
                  </span>
                </button>
              ))}
              <span className="ml-2 font-bold text-[#0B2559] dark:text-white tabular-nums">
                {rating} / 5
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-[#0B2559] dark:text-white mb-1.5">
              Your Feedback (Cleanliness, quiet sleep environment, hospital commute)
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the daytime sleep quality, blackout curtains, and commute to the hospital?"
              className="w-full p-3 rounded-xl border border-[rgba(11,37,89,0.15)] dark:border-[#233550] bg-white dark:bg-[#0E1A2E] text-[#0B2559] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0A6FA8]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!comment.trim() || isSubmitting}
              className="px-6 py-2 rounded-full text-xs font-semibold bg-[#0A6FA8] text-white hover:bg-[#0C7EBF] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
