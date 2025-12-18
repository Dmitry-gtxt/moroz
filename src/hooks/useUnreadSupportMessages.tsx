import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadSupportMessages(): number {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnreadCount() {
      try {
        // First check if user has a performer profile
        const { data: performerProfile } = await supabase
          .from('performer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        let chatId: string | null = null;

        if (performerProfile) {
          // User is a performer - get their support chat
          const { data: chat } = await supabase
            .from('support_chats')
            .select('id')
            .eq('performer_id', performerProfile.id)
            .maybeSingle();
          chatId = chat?.id || null;
        } else {
          // User is a customer - get their support chat
          const { data: chat } = await supabase
            .from('support_chats')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          chatId = chat?.id || null;
        }

        if (!chatId) {
          setUnreadCount(0);
          return;
        }

        // Count unread messages from admin (sender_type = 'admin')
        const { count } = await supabase
          .from('support_messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chatId)
          .eq('sender_type', 'admin')
          .is('read_at', null);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread support messages:', error);
      }
    }

    fetchUnreadCount();

    // Subscribe to changes in support_messages
    const channel = supabase
      .channel('support-unread-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        () => {
          // Refetch count on any change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
}
