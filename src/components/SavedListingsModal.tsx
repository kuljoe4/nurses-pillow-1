import React, { useEffect } from 'react';
import { HousingListing } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface SavedListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedListingIds: string[];
  allListings?: HousingListing[];
  onToggleSave: (id: string) => void;
  onSelectListing: (listing: HousingListing) => void;
  isNightShiftMode: boolean;
  onGoToHousing: () => void;
}

export const SavedListingsModal: React.FC<SavedListingsModalProps> = ({
  isOpen,
  onClose,
  savedListingIds,
  allListings,
  onToggleSave,
  onSelectListing,
  isNightShiftMode,
  onGoToHousing,
}) => {
  useBodyScrollLock(isOpen);

  // Handle Escape key
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

  const sourceListings = allListings && allListings.length > 0 ? allListings : [];
  const savedListings = sourceListings.filter((item) =>
    savedListingIds.includes(item.id)
  );

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-end bg-black/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-md h-full shadow-lg p-6 flex flex-col justify-between overflow-y-auto transition-colors ${
          isNightShiftMode
            ? 'bg-[#0E1A2E] border-l border-[#233550] text-[#E6ECF7]'
            : 'bg-white text-[#001848]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(11,37,89,0.08)] dark:border-[#233550] mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0a6fa8] dark:text-[#3E9AD1]">
                bed
              </span>
              <h3 className="text-lg font-bold">Saved Sanctuaries</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#0a6fa8]/15 text-[#0a6fa8] dark:text-[#3E9AD1] font-bold">
                {savedListings.length}
              </span>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-colors"
              aria-label="Close saved listings modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* List of saved items */}
          {savedListings.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#EFF6FB] dark:bg-[#15233a] flex items-center justify-center mx-auto mb-3 text-[#0A6FA8] dark:text-[#3E9AD1]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M4 6.5C4 5.12 5.12 4 6.5 4C9 4.8 15 4.8 17.5 4C18.88 4 20 5.12 20 6.5C19.2 9 19.2 15 20 17.5C20 18.88 18.88 20 17.5 20C15 19.2 9 19.2 6.5 20C5.12 20 4 18.88 4 17.5C4.8 15 4.8 9 4 6.5Z" />
                  <circle cx="12" cy="12" r="1.5" fill="#F1CF78" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1">No saved pillows yet</p>
              <p className="text-xs opacity-70 max-w-xs mx-auto mb-5">
                Click the pillow icon on any sanctuary card to save properties for your next clinical assignment.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToHousing();
                }}
                className="px-5 py-2.5 rounded-full bg-[#0a6fa8] text-white text-xs font-semibold shadow-xs"
              >
                Browse Housing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedListings.map((listing) => (
                <div
                  key={listing.id}
                  className={`p-3.5 rounded-2xl border flex gap-3 cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.01] ${
                    isNightShiftMode
                      ? 'bg-[#15233a] border-[#233550]'
                      : 'bg-[#f2f3ff] border-[#eaedff]'
                  }`}
                  onClick={() => {
                    onClose();
                    onSelectListing(listing);
                  }}
                >
                  <img
                    src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
                    alt={listing.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-[#0a6fa8] dark:text-[#3E9AD1] truncate">
                          {listing.city}, {listing.state}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave(listing.id);
                          }}
                          className="text-[#ba1a1a] hover:opacity-80 p-0.5"
                          title="Remove bookmark"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                      <h4 className="text-xs font-bold truncate leading-snug">{listing.title}</h4>
                      <p className="text-[10px] opacity-75 truncate">{listing.proximityToHospital}</p>
                    </div>

                    <div className="text-xs font-extrabold text-[#0a6fa8] dark:text-[#3E9AD1]">
                      ${listing.monthlyRate.toLocaleString()}/mo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full border border-current text-xs font-semibold hover:bg-[#EFF6FB] dark:hover:bg-[#182840] hover:text-[#0A6FA8] dark:hover:text-[#3E9AD1] focus-visible:ring-2 focus-visible:ring-[#0A6FA8] transition-colors text-center"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
