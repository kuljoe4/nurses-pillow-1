import React from 'react';

export const AvailabilityInsight: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-5 border border-[#F1CF78]/30 dark:border-[#745b0d]/50 shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#F1CF78]/20 text-[#745b0d] dark:text-[#E4C36D] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">trending_up</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#0B2559] dark:text-white">Availability Insight</h3>
          <p className="text-[11px] text-gray-500">Based on local hospital demand trends</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        Platform data shows a <span className="font-bold text-[#2F6E5E] dark:text-[#aff0db]">32% spike</span> in search demand for your area between <strong>Nov 15 – Dec 15</strong>.
      </p>
      <button className="w-full py-2.5 rounded-full bg-[#F1CF78] hover:bg-[#F1CF78]/90 text-[#0B2559] text-xs font-bold transition-all cursor-pointer">
        Open these dates
      </button>
    </div>
  );
};
