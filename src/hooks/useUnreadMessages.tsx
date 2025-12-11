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
      // Get all bookings where user is customer or performer
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, customer_id, performer_id')
        .or(`customer_id.eq.${user.id},performer_id.in.(select id from performer_profiles where user_id = '${user.id}')`);

      if (bookingsError || !bookings?.length) {
        setUnreadCount(0);
        return;
      }

      const bookingIds = bookings.map(b => b.id);

      // Count unread messages not from current user
      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .in('booking_id', bookingIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
}
