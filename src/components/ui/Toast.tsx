import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-white border border-[#0B2559]/10 p-4 rounded-lg shadow-lg"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E1EFE9]">
          <CheckCircle className="w-5 h-5 text-[#2F6E5E]" />
        </div>
        <p className="text-sm font-medium text-[#0B2559]">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
