import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MessageNotificationBubble() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      // Get performer profile id if exists
      const { data: performerProfile } = await supabase
        .from('performer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get all bookings where user is involved
      let query = supabase
        .from('bookings')
        .select('id')
        .eq('customer_id', user.id);

      if (performerProfile) {
        query = supabase
          .from('bookings')
          .select('id')
          .or(`customer_id.eq.${user.id},performer_id.eq.${performerProfile.id}`);
      }

      const { data: bookings } = await query;
      
      if (!bookings?.length) {
        setUnreadCount(0);
        return;
      }

      const bookingIds = bookings.map(b => b.id);
      
      // Count unread messages
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .in('booking_id', bookingIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      const newCount = count || 0;
      
      // Check if count increased (new message)
      if (newCount > unreadCount && unreadCount > 0) {
        setIsNew(true);
        setTimeout(() => setIsNew(false), 3000);
      }
      
      setUnreadCount(newCount);
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
            setIsNew(true);
            setTimeout(() => setIsNew(false), 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          // Refetch on updates (message read)
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, unreadCount]);

  if (!user || unreadCount === 0) return null;

  return (
    <Link
      to="/messages"
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center justify-center',
        'w-14 h-14 rounded-full bg-primary shadow-lg',
        'hover:scale-110 transition-transform duration-200',
        isNew && 'animate-bounce'
      )}
    >
      {/* Pulsing ring */}
      <span className={cn(
        'absolute inset-0 rounded-full bg-primary',
        'animate-ping opacity-30'
      )} />
      
      {/* Icon */}
      <Mail className="h-6 w-6 text-primary-foreground relative z-10" />
      
      {/* Badge */}
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold z-20">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </Link>
  );
}