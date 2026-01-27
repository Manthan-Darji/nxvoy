import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { extractTripDetails, TripDetails } from '@/services/tripService';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shasa-chat`;

export function useShasa() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();
  const extractionTimeout = useRef<NodeJS.Timeout | null>(null);

  const extractDetails = useCallback(async (msgs: ChatMessage[]) => {
    if (msgs.length < 2) return; // Need at least one exchange
    
    try {
      setIsExtracting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const details = await extractTripDetails(
        msgs.map(m => ({ role: m.role, content: m.content })),
        session?.access_token
      );
      setTripDetails(details);
    } catch (error) {
      console.error('Failed to extract trip details:', error);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: input.trim(),
      timestamp: new Date()
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent, timestamp: new Date() }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 
            Authorization: `Bearer ${session.access_token}` 
          }),
        },
        body: JSON.stringify({ 
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Extract trip details after response (debounced)
      if (extractionTimeout.current) {
        clearTimeout(extractionTimeout.current);
      }
      extractionTimeout.current = setTimeout(() => {
        setMessages(current => {
          extractDetails(current);
          return current;
        });
      }, 1000);

    } catch (error) {
      console.error('Shasa chat error:', error);
      toast({
        title: 'Chat Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
      setMessages((prev) => 
        prev[prev.length - 1]?.role === 'assistant' && prev[prev.length - 1]?.content === ''
          ? prev.slice(0, -1)
          : prev
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, toast, extractDetails]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setTripDetails(null);
  }, []);

  const dismissTripDetails = useCallback(() => {
    setTripDetails(null);
  }, []);

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    clearChat, 
    tripDetails, 
    isExtracting,
    dismissTripDetails 
  };
}
