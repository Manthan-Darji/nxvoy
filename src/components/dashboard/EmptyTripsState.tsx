import { motion } from 'framer-motion';
import { Plane, MapPin, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyTripsStateProps {
  onStartPlanning: () => void;
}

const EmptyTripsState = ({ onStartPlanning }: EmptyTripsStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Animated Icons */}
      <div className="relative w-32 h-32 mb-8">
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center">
            <Plane className="w-12 h-12 text-primary" />
          </div>
        </motion.div>
        
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-2 -right-2"
        >
          <MapPin className="w-6 h-6 text-amber-400" />
        </motion.div>
        
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
            scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-2 -left-2"
        >
          <Compass className="w-6 h-6 text-emerald-400" />
        </motion.div>
      </div>

      {/* Text */}
      <h3 className="text-2xl font-bold text-white mb-3 text-center font-heading">
        No trips yet!
      </h3>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Start planning your first adventure with Shasa, your AI travel companion. 
        Let's explore the world together! 🌍
      </p>

      {/* CTA Button */}
      <Button 
        size="lg"
        className="btn-primary-gradient border-0 text-lg px-8 py-6"
        onClick={onStartPlanning}
      >
        <Plane className="w-5 h-5 mr-2" />
        Plan Your First Trip
      </Button>
    </motion.div>
  );
};

export default EmptyTripsState;
