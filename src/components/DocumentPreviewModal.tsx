import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  if (!isOpen || !file) return null;

  const fileUrl = URL.createObjectURL(file);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0B1626] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-[#233550] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0B2559] dark:text-white">Document Preview</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#15233a] text-gray-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {file.type.startsWith('image/') ? (
                <img src={fileUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <iframe src={fileUrl} className="w-full h-full min-h-[500px]" title="Preview" />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
