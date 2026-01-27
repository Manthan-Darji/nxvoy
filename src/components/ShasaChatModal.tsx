import { Dialog, DialogContent } from '@/components/ui/dialog';
import ShasaChat from './ShasaChat';

interface ShasaChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
}

const ShasaChatModal = ({ open, onOpenChange, initialMessage }: ShasaChatModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl border-0 bg-transparent shadow-none">
        <ShasaChat 
          onClose={() => onOpenChange(false)} 
          initialMessage={initialMessage}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShasaChatModal;
