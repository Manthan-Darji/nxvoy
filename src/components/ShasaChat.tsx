import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, User, Trash2, X } from 'lucide-react';
import { useShasa, ChatMessage } from '@/hooks/useShasa';
import TripPreviewCard from './TripPreviewCard';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface ShasaChatProps {
  onClose?: () => void;
  initialMessage?: string;
}

const quickActions = [
  "Plan Weekend Trip",
  "Budget Travel",
  "Luxury Vacation"
];

const ShasaChat = ({ onClose, initialMessage }: ShasaChatProps) => {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat, tripDetails, dismissTripDetails } = useShasa();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, tripDetails]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, sendMessage, messages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleQuickAction = (action: string) => {
    if (!isLoading) {
      sendMessage(action);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-card safe-area-top">
      {/* Header - Enhanced for mobile with larger touch targets */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-600 to-teal-500 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Shasa</h3>
            <p className="text-xs text-white/80">Your AI Travel Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-white/80 hover:text-white hover:bg-white/20 min-w-[44px] min-h-[44px]"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 min-w-[44px] min-h-[44px]"
            >
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-background"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
              <h4 className="font-semibold text-foreground text-lg mb-2">Hey there! I'm Shasa ✈️</h4>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                Your AI travel companion. Ask me anything about trip planning, destinations, or let me help create your perfect itinerary!
              </p>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                isLatest={index === messages.length - 1}
              />
            ))
          )}
        </AnimatePresence>
        
        {/* Trip Preview Card */}
        <AnimatePresence>
          {tripDetails?.isComplete && (
            <TripPreviewCard 
              tripDetails={tripDetails} 
              onDismiss={dismissTripDetails}
              onClose={onClose}
            />
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-muted rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <motion.span 
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span 
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.span 
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="px-4 py-2 border-t border-border bg-white dark:bg-card">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickActions.map((action) => (
              <motion.button
                key={action}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction(action)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-blue-50 to-teal-50 text-blue-700 border border-blue-200 hover:border-blue-300 transition-colors dark:from-blue-900/20 dark:to-teal-900/20 dark:text-blue-300 dark:border-blue-800"
              >
                {action}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input - Fixed at bottom on mobile with safe area */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-border bg-white dark:bg-card shrink-0 pb-safe-area-bottom">
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Where do you want to go?"
            disabled={isLoading}
            className="flex-1 rounded-full bg-gray-100 dark:bg-muted border-0 focus-visible:ring-2 focus-visible:ring-blue-500 h-12 min-h-[48px] text-base"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 border-0 w-12 h-12 min-w-[48px] min-h-[48px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </form>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isLatest: boolean;
}

const MessageBubble = ({ message, isLatest }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const timestamp = format(message.timestamp, 'h:mm a');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser 
          ? 'bg-gray-200 dark:bg-secondary' 
          : 'bg-gradient-to-br from-blue-600 to-teal-500'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-gray-600 dark:text-secondary-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
          isUser 
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm' 
            : 'bg-white dark:bg-muted text-foreground rounded-bl-sm'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className={`text-[10px] text-muted-foreground mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </span>
      </div>
    </motion.div>
  );
};

export default ShasaChat;
