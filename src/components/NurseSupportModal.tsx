import React, { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface NurseSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNightShiftMode: boolean;
}

export const NurseSupportModal: React.FC<NurseSupportModalProps> = ({
  isOpen,
  onClose,
  isNightShiftMode,
}) => {
  useBodyScrollLock(isOpen);

  const [ticketSubject, setTicketSubject] = useState('quiet_hours');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setMessage('');
      setTimeout(() => onClose(), 2000);
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[150] overflow-y-auto p-4 sm:p-6 pt-16 sm:pt-20 bg-black/60 backdrop-blur-sm flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-lg my-auto rounded-3xl p-6 sm:p-8 shadow-lg transition-all duration-200 ease-in-out relative ${
          isNightShiftMode
            ? 'bg-[#0E1A2E] border border-[#233550] text-[#E6ECF7]'
            : 'bg-white text-[#001848]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0a6fa8]/15 text-[#0a6fa8] dark:text-[#3E9AD1] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Clinician Support Desk</h3>
            <p className="text-xs opacity-75">
              Available for traveling nurses and hosts with booking or shift assistance.
            </p>
          </div>
        </div>

        {/* Rapid hotlines */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className={`p-3 rounded-2xl border text-center ${
              isNightShiftMode ? 'bg-[#15233a] border-[#233550]' : 'bg-[#EFF6FB] border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-75 block mb-1">
              Urgent Shift Dispatch
            </span>
            <span className="text-sm font-bold text-[#0A6FA8] dark:text-[#3E9AD1]">
              (800) 594-REST
            </span>
          </div>
          <div
            className={`p-3 rounded-2xl border text-center ${
              isNightShiftMode ? 'bg-[#15233a] border-[#233550]' : 'bg-[#EFF6FB] border-[rgba(11,37,89,0.08)]'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-75 block mb-1">
              Quiet Hours Hotline
            </span>
            <span className="text-sm font-bold text-[#2F6E5E] dark:text-[#aff0db]">
              Direct Text Support
            </span>
          </div>
        </div>

        {isSubmitted ? (
          <div className="p-6 rounded-2xl bg-[#E1EFE9] text-[#2F6E5E] dark:bg-[#2F6E5E]/20 dark:text-[#aff0db] text-center">
            <span className="material-symbols-outlined text-3xl mb-1">check_circle</span>
            <p className="text-sm font-bold">Message Dispatched to Support Team</p>
            <p className="text-xs mt-1">
              A clinician support representative will respond shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="assistanceCategory" className="block text-xs font-semibold mb-1">Assistance Category</label>
              <select
                id="assistanceCategory"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none ${
                  isNightShiftMode
                    ? 'bg-[#15233a] text-white border border-[#233550]'
                    : 'bg-[#EFF6FB] text-[#0B2559] border border-transparent focus:border-[#0A6FA8]'
                }`}
              >
                <option value="quiet_hours">Daytime Noise / Quiet Hours Report</option>
                <option value="contract_flex">Travel Contract Cancelled / Flex Lease Claim</option>
                <option value="amenity_issue">Blackout Curtains / AC / Washer Malfunction</option>
                <option value="checkin_late">Late Night Shift Check-In Assistance (02:00-06:00)</option>
                <option value="general">General Housing Inquiry</option>
              </select>
            </div>

            <div>
              <label htmlFor="shiftRequirement" className="block text-xs font-semibold mb-1">Describe your shift requirement</label>
              <textarea
                id="shiftRequirement"
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Let us know your unit, hospital, or what you need immediate help with..."
                className={`w-full rounded-xl p-3 text-xs font-medium focus:outline-none resize-none ${
                  isNightShiftMode
                    ? 'bg-[#15233a] text-white border border-[#233550]'
                    : 'bg-[#EFF6FB] text-[#0B2559] border border-transparent focus:border-[#0A6FA8]'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send support request</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
