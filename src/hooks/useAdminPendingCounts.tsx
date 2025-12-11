import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminPendingCounts() {
  const [verificationCount, setVerificationCount] = useState(0);
  const [moderationCount, setModerationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchCounts() {
    // Fetch pending verification (unverified users applying for verification)
    const { count: verifyCount } = await supabase
      .from('performer_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    // Fetch pending moderation (verified users who edited their profile - now pending again but were verified before)
    // These are users with verification_status = 'pending' AND is_active = false who previously had content
    // Actually, let's just count pending profiles that have been around for a while (had been verified)
    // Better approach: profiles with pending status and updated_at > created_at (meaning they edited after creation)
    const { data: moderationData } = await supabase
      .from('performer_profiles')
      .select('id, created_at, updated_at')
      .eq('verification_status', 'pending')
      .eq('is_active', false);

    // Filter for moderation: profiles where updated_at is significantly later than created_at
    // This indicates the profile was edited after initial creation
    const modCount = (moderationData ?? []).filter(p => {
      const created = new Date(p.created_at).getTime();
      const updated = new Date(p.updated_at).getTime();
      // If updated more than 1 hour after created, it's a re-moderation case
      return (updated - created) > 3600000;
    }).length;

    setVerificationCount((verifyCount ?? 0) - modCount);
    setModerationCount(modCount);
    setLoading(false);
  }

  useEffect(() => {
    fetchCounts();

    // Subscribe to changes
    const channel = supabase
      .channel('admin-pending-counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performer_profiles',
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { verificationCount, moderationCount, loading, refetch: fetchCounts };
}
