import { motion, AnimatePresence } from 'framer-motion';
import ShasaChat from './ShasaChat';

interface ShasaChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
}

const ShasaChatModal = ({ open, onOpenChange, initialMessage }: ShasaChatModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Chat Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className="fixed z-50 
              inset-0 md:inset-auto 
              md:bottom-24 md:right-5 
              md:w-[400px] md:h-[600px] 
              md:rounded-2xl 
              overflow-hidden shadow-2xl"
          >
            <ShasaChat 
              onClose={() => onOpenChange(false)} 
              initialMessage={initialMessage}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShasaChatModal;
