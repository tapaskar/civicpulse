'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Society, SocietyRole } from '@/lib/society/types';

interface MembershipEntry {
  society: Society;
  role: SocietyRole;
  unit_number: string | null;
}

export function useSocietyMembership() {
  const { user } = useAuth();
  const supabase = createClient();
  const [societies, setSocieties] = useState<MembershipEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSocieties([]);
      setLoading(false);
      return;
    }

    supabase
      .from('society_members')
      .select('role, unit_number, society:societies!society_id(*)')
      .eq('user_id', user.id)
      .then(({ data }: { data: any }) => {
        if (data) {
          setSocieties(
            (data as any[])
              .filter(d => d.society)
              .map(d => ({
                society: d.society as Society,
                role: d.role as SocietyRole,
                unit_number: d.unit_number,
              }))
          );
        }
        setLoading(false);
      });
  }, [user?.id]);

  return { societies, loading };
}
