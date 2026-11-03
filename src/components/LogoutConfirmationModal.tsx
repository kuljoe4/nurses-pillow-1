import React, { useEffect } from 'react';
import { UserRole } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  currentUser: { role: UserRole; name: string };
  isNightShiftMode: boolean;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  currentUser,
  isNightShiftMode,
}) => {
  useBodyScrollLock(isOpen);

  // Close modal on Escape key press
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

  const roleLabel =
    currentUser.role === 'nurse'
      ? 'Clinician'
      : currentUser.role === 'host'
      ? 'Host'
      : currentUser.role === 'super_admin'
      ? 'Administrator'
      : currentUser.role === 'developer'
      ? 'Developer'
      : 'Guest';

  return (
    <div
      id="logout-confirmation-modal"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-desc"
      className="fixed inset-0 z-[150] overflow-y-auto p-4 pt-16 sm:pt-20 bg-black/50 backdrop-blur-xs flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full max-w-sm rounded-[24px] p-6 shadow-[0_12px_32px_rgba(11,37,89,0.12)] relative border transition-colors ${
          isNightShiftMode
            ? 'bg-[#0B1626] border-[#233550] text-[#E6ECF7]'
            : 'bg-white border-[rgba(11,37,89,0.08)] text-[#0B2559]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Close "X" Button */}
        <button
          id="close-logout-modal-button"
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-[#0B2559] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]"
          aria-label="Close logout confirmation modal"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">close</span>
        </button>

        {/* Minimal Icon Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#EFF6FB] dark:bg-[#15233a] text-[#0B2559] dark:text-[#E6ECF7] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </div>
          <div>
            <h2
              id="logout-dialog-title"
              className="text-base font-semibold leading-tight text-[#0B2559] dark:text-white"
            >
              Log out
            </h2>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {currentUser.name} · {roleLabel}
            </span>
          </div>
        </div>

        {/* Minimal Description - Reassuring and concise */}
        <p
          id="logout-dialog-desc"
          className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-6"
        >
          Are you sure you want to end your session? Your saved sanctuaries and search preferences remain safely saved.
        </p>

        {/* Action Buttons - Clean, pill radius, action verbs */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            id="cancel-logout-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-200 dark:border-[#233550] text-xs font-medium text-[#0B2559] dark:text-gray-300 hover:bg-[#EFF6FB] dark:hover:bg-[#15233a] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0A6FA8]"
          >
            Cancel
          </button>
          <button
            id="confirm-logout-btn"
            type="button"
            onClick={onConfirmLogout}
            className="px-5 py-2 rounded-full bg-[#A8452E] hover:bg-[#933C27] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#A8452E]"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

