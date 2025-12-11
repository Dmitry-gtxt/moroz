import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      let totalUnread = 0;

      // 1. Count unread booking chat messages
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, customer_id, performer_id')
        .or(`customer_id.eq.${user.id},performer_id.in.(select id from performer_profiles where user_id = '${user.id}')`);

      if (bookings?.length) {
        const bookingIds = bookings.map(b => b.id);

        const { count: bookingUnread } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .in('booking_id', bookingIds)
          .neq('sender_id', user.id)
          .is('read_at', null);

        totalUnread += bookingUnread || 0;
      }

      // 2. Count unread support chat messages (for performers)
      const { data: performerProfile } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (performerProfile) {
        const { data: supportChat } = await supabase
          .from('support_chats')
          .select('id')
          .eq('performer_id', performerProfile.id)
          .maybeSingle();

        if (supportChat) {
          const { count: supportUnread } = await supabase
            .from('support_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', supportChat.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          totalUnread += supportUnread || 0;
        }
      }

      setUnreadCount(totalUnread);
    };

    fetchUnreadCount();

    // Subscribe to new chat messages
    const chatChannel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Subscribe to support messages
    const supportChannel = supabase
      .channel('unread-support-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(supportChannel);
    };
  }, [user]);

  return unreadCount;
}
