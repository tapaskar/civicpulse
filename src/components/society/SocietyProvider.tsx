'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { parseWkbPoint } from '@/lib/geo';
import type { Society, SocietyMember, SocietyRole } from '@/lib/society/types';

interface SocietyContextType {
  society: Society | null;
  membership: SocietyMember | null;
  role: SocietyRole | null;
  loading: boolean;
  isStaff: boolean;
  isManagement: boolean;
}

const SocietyContext = createContext<SocietyContextType>({
  society: null,
  membership: null,
  role: null,
  loading: true,
  isStaff: false,
  isManagement: false,
});

export function SocietyProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();
  const [society, setSociety] = useState<Society | null>(null);
  const [membership, setMembership] = useState<SocietyMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch society by slug
      const { data: soc } = await supabase
        .from('societies')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (soc) {
        const loc = typeof soc.location === 'string'
          ? parseWkbPoint(soc.location)
          : [0, 0];
        setSociety({
          ...soc,
          location: { type: 'Point', coordinates: loc as [number, number] },
        } as Society);

        // Fetch membership if logged in
        if (user) {
          const { data: mem } = await supabase
            .from('society_members')
            .select('*')
            .eq('society_id', soc.id)
            .eq('user_id', user.id)
            .single();
          if (mem) setMembership(mem as SocietyMember);
        }
      }

      setLoading(false);
    }

    load();
  }, [slug, user?.id]);

  const role = membership?.role ?? null;
  const isStaff = role === 'rwa_staff' || role === 'rwa_management';
  const isManagement = role === 'rwa_management';

  return (
    <SocietyContext.Provider value={{ society, membership, role, loading, isStaff, isManagement }}>
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  return useContext(SocietyContext);
}
