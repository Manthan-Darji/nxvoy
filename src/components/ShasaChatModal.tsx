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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Chat Modal - Full screen on mobile, fixed size on desktop */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300
            }}
            className="fixed z-50 
              inset-0 
              md:inset-auto 
              md:bottom-24 md:right-5 
              md:w-[400px] md:h-[600px] 
              md:rounded-2xl 
              overflow-hidden shadow-2xl
              flex flex-col"
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
