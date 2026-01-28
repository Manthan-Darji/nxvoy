import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ProcessingStateProps {
  destination: string;
  budget: string;
}

const ProcessingState = ({ destination, budget }: ProcessingStateProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const processingMessages = [
    { text: "Shasa is checking flight and bus connectivity...", icon: "✈️" },
    { text: `Analyzing hotel rates in ${destination}...`, icon: "🏨" },
    { text: "Calculating Uber estimates for local travel...", icon: "🚗" },
    { text: `Optimizing your itinerary for ${budget}...`, icon: "💡" },
    { text: "Finding the best restaurants and cafes...", icon: "🍽️" },
    { text: "Curating must-visit attractions...", icon: "🗺️" },
    { text: "Almost there, adding final touches...", icon: "✨" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        prev < processingMessages.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [processingMessages.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 blur-3xl"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center">
        {/* Animated circle */}
        <div className="relative">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-32 h-32 rounded-full border-2 border-dashed border-primary/30"
          />
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-2 rounded-full border-2 border-dotted border-purple-500/30"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Shasa branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-foreground font-display">
            Shasa is working her magic ✨
          </h2>
          <p className="text-muted-foreground">
            Creating your personalized itinerary
          </p>
        </motion.div>

        {/* Dynamic message */}
        <motion.div
          key={currentMessageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="h-16 flex items-center justify-center"
        >
          <div className="px-6 py-3 rounded-full glass-card border border-border/50 flex items-center gap-3">
            <span className="text-xl">{processingMessages[currentMessageIndex].icon}</span>
            <span className="text-sm text-foreground">
              {processingMessages[currentMessageIndex].text}
            </span>
          </div>
        </motion.div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 6,
              ease: "easeInOut",
            }}
            className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
          />
        </div>

        {/* Floating dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [-4, 4, -4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ProcessingState;
