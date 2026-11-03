import React, { useState } from 'react';

export const HostCalendarTips: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 bg-white dark:bg-[#0B1626] rounded-2xl border border-[rgba(11,37,89,0.08)] dark:border-[#233550] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-[#0B2559] dark:text-white"
      >
        <span className="text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F1CF78]">lightbulb</span>
            Calendar Pro Tips
        </span>
        <span className="material-symbols-outlined text-sm">
            {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550] text-xs text-gray-600 dark:text-gray-400 space-y-3">
          <p><strong>Turnover Buffers:</strong> Block 24h between stays. A rested clinician needs a seamless, stress-free move-in.</p>
          <p><strong>Maintenance:</strong> Schedule quarterly "preventative maintenance" blocks 3-6 months in advance to ensure your sanctuary remains pristine.</p>
          <p><strong>Uncertainty Rule:</strong> If you are unsure about personal use, block the dates. It is easier to unblock later than to cancel a booking.</p>
        </div>
      )}
    </div>
  );
};
