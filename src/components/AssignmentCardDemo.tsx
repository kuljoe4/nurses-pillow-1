import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  bottomSheetVariant,
  pillowSaveVariant,
  staggerContainerVariant,
  staggerItemVariant,
  motionTokens
} from '../lib/animation-utilities';
import { Search, MapPin, Filter, CalendarDays, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';

export const AssignmentCardDemo: React.FC = () => {
  const [isSaved, setIsSaved] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-[#F2F4F7] p-4 flex items-center justify-center font-sans">
      <div className="max-w-2xl w-full">
        {/* TIER 1: The Assignment Card (Hero Component) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariant}
          className="bg-white rounded-[24px] shadow-[0_1px_2px_rgba(11,37,89,0.08)] p-6 relative z-10"
        >
          {/* Top Save Action (Tier 2 Trust/Save Control mixed into Tier 1 visually) */}
          <div className="flex justify-end mb-4">
            <motion.button
              onClick={() => setIsSaved(!isSaved)}
              variants={pillowSaveVariant}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              animate={isSaved ? "saved" : "rest"}
              className="p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8] transition-colors"
              aria-label={isSaved ? "Remove from saved properties" : "Save this property"}
            >
              <svg
                width="24" height="24" viewBox="0 0 24 24"
                fill={isSaved ? "#0B2559" : "none"}
                stroke={isSaved ? "#0B2559" : "#0B2559"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <rect x="3" y="6" width="18" height="12" rx="4" />
                <path d="M7 12h.01" />
                <path d="M17 12h.01" />
                <path d="M12 12h.01" />
              </svg>
            </motion.button>
          </div>

          <motion.p variants={staggerItemVariant} className="text-[rgba(11,37,89,0.66)] text-sm font-medium mb-1">
            Where are you assigned?
          </motion.p>

          {/* Hospital Autocomplete Field */}
          <motion.div variants={staggerItemVariant} className="relative mb-4">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A6FA8]" />
            <input
              type="text"
              defaultValue="Duke University Hospital"
              className="w-full bg-[#EFF6FB] text-[#0B2559] font-semibold text-lg md:text-xl rounded-[8px] py-3 pl-10 pr-4 outline-none border-[1.5px] border-transparent focus:bg-white focus:border-[#0A6FA8] focus:ring-2 focus:ring-[#0A6FA8] focus:ring-opacity-50 transition-all duration-200 ease-in-out duration-200"
              placeholder="Enter hospital name..."
            />
          </motion.div>

          {/* Core Data Fields */}
          <motion.div variants={staggerItemVariant} className="flex flex-wrap gap-2 mb-6 text-[#0A6FA8] text-sm tabular-nums font-medium">
            <div className="flex items-center gap-1.5 bg-[#EFF6FB] px-3 py-1.5 rounded-[8px]">
              <CalendarDays className="w-4 h-4" />
              Move-in Oct 5
            </div>
            <div className="flex items-center gap-1.5 bg-[#EFF6FB] px-3 py-1.5 rounded-[8px]">
              13 weeks
            </div>
            <div className="flex items-center gap-1.5 bg-[#EFF6FB] px-3 py-1.5 rounded-[8px]">
              5 mi
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </div>
          </motion.div>

          {/* Primary CTA and Filters Trigger */}
          <motion.div variants={staggerItemVariant} className="flex gap-3">
            <button className="flex-1 bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white font-semibold py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]">
              <Search className="w-5 h-5" />
              Search housing
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="bg-[#EFF6FB] hover:bg-[#E1EFE9] text-[#0B2559] p-3 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0B2559]"
              aria-label="Open advanced filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>

        {/* TIER 3: Progressive Disclosure (Bottom Sheet for Filters) */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: motionTokens.duration.fast }}
                className="fixed inset-0 bg-[#0B1626]/40 z-40"
                onClick={() => setShowFilters(false)}
              />

              {/* Bottom Sheet */}
              <motion.div
                variants={bottomSheetVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-[0_-4px_24px_rgba(11,37,89,0.1)] p-6 z-50 max-h-[85vh] overflow-y-auto custom-scrollbar"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[#0B2559] text-xl font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    Refine Search
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-[#0B2559]/60 hover:text-[#0B2559] focus-visible:text-[#0B2559] p-1 rounded-full transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-[#0B2559] font-medium mb-3">Clinician Priorities</h3>
                    <div className="flex flex-wrap gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#2F6E5E] text-white font-medium text-sm transition-all duration-200 ease-in-out shadow-[0_1px_2px_rgba(11,37,89,0.08)]">
                        <Check className="w-4 h-4" /> Quiet Daytime (Night Shift)
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#EFF6FB] text-[#0B2559] hover:bg-[#E1EFE9] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#E1EFE9] font-medium text-sm transition-colors border border-transparent">
                        Blackout Curtains
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#EFF6FB] text-[#0B2559] hover:bg-[#E1EFE9] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#E1EFE9] font-medium text-sm transition-colors border border-transparent">
                        In-unit Laundry
                      </button>
                    </div>
                  </div>

                  <div>
                     <h3 className="text-[#0B2559] font-medium mb-3">Property Type</h3>
                     <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-3 rounded-[8px] border-[1.5px] border-[#0A6FA8] bg-[#EFF6FB]">
                          <input type="radio" name="property_type" defaultChecked className="w-4 h-4 text-[#0A6FA8] focus:ring-[#0A6FA8]" />
                          <span className="text-[#0B2559] font-medium">Entire Place</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-[8px] border-[1.5px] border-transparent bg-[#F2F4F7] hover:bg-[#EFF6FB] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#EFF6FB] cursor-pointer transition-colors">
                          <input type="radio" name="property_type" className="w-4 h-4 text-[#0A6FA8] focus:ring-[#0A6FA8]" />
                          <span className="text-[#0B2559] font-medium">Private Room</span>
                        </label>
                     </div>
                  </div>

                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full mt-4 bg-[#0B2559] hover:bg-[#0A1A40] text-white font-semibold py-3 px-4 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0B2559]"
                  >
                    Show 14 properties
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
