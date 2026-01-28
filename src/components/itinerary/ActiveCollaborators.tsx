import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ActiveUser {
  id: string;
  name: string;
  isYou: boolean;
}

interface ActiveCollaboratorsProps {
  tripId: string;
}

const ActiveCollaborators = ({ tripId }: ActiveCollaboratorsProps) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [userName, setUserName] = useState('You');

  useEffect(() => {
    if (!user || !tripId) return;

    // Fetch current user's name
    const fetchUserName = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();
      
      if (data?.name) {
        setUserName(data.name);
      }
    };

    fetchUserName();

    // Set up presence channel
    const channel = supabase.channel(`trip-presence-${tripId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: ActiveUser[] = [];
        
        Object.entries(state).forEach(([id, presences]) => {
          const presence = presences[0] as { name?: string };
          users.push({
            id,
            name: presence?.name || 'Unknown',
            isYou: id === user.id,
          });
        });

        // Sort: you first, then others alphabetically
        users.sort((a, b) => {
          if (a.isYou) return -1;
          if (b.isYou) return 1;
          return a.name.localeCompare(b.name);
        });

        setActiveUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [tripId, user, userName]);

  if (activeUsers.length <= 1) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        <div className="flex -space-x-2">
          <AnimatePresence mode="popLayout">
            {activeUsers.slice(0, 5).map((activeUser, index) => (
              <motion.div
                key={activeUser.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className={`w-8 h-8 border-2 border-background ring-2 ring-green-400 ${activeUser.isYou ? 'ring-primary' : ''}`}>
                      <AvatarFallback 
                        className={`${colors[index % colors.length]} text-white text-xs font-medium`}
                      >
                        {activeUser.isYou ? '👤' : getInitials(activeUser.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{activeUser.isYou ? 'You' : activeUser.name}</p>
                    <p className="text-xs text-muted-foreground">Viewing now</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {activeUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-xs">
                    +{activeUsers.length - 5}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{activeUsers.length - 5} more viewing</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>
            {activeUsers.length} viewing
          </span>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default ActiveCollaborators;
