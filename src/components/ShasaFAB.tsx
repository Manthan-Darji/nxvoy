import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import ShasaChatModal from './ShasaChatModal';

const ShasaFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg hover:shadow-xl transition-shadow"
        style={{ padding: isHovered ? '16px 20px' : '16px' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Chat with Shasa"
      >
        <MessageCircle className="w-7 h-7" />
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              Chat with Shasa
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <ShasaChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default ShasaFAB;
