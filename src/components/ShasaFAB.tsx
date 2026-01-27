import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import ShasaChatModal from './ShasaChatModal';

const ShasaFAB = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full btn-primary-gradient border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 z-50"
        size="icon"
        aria-label="Open Shasa AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
      <ShasaChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default ShasaFAB;
