'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SocietyIssue } from '@/lib/society/types';
import type { Status, Urgency } from '@/lib/types';

interface Bounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

interface SocietyFilters {
  category?: string;
  status?: Status;
  urgency?: Urgency;
  search?: string;
}

export function useSocietyIssues(societyId: string | null, bounds: Bounds | null, filters: SocietyFilters) {
  const [issues, setIssues] = useState<SocietyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchIssues = useCallback(async () => {
    if (!boundsRef.current || !societyId) return;
    setLoading(true);

    const { minLng, minLat, maxLng, maxLat } = boundsRef.current;

    const { data, error } = await supabase.rpc('society_issues_in_bounds', {
      p_society_id: societyId,
      min_lng: minLng,
      min_lat: minLat,
      max_lng: maxLng,
      max_lat: maxLat,
    });

    if (!error && data) {
      let transformed: SocietyIssue[] = (data as any[]).map(row => ({
        ...row,
        location: { type: 'Point' as const, coordinates: [row.lng, row.lat] as [number, number] },
      }));

      if (filters.category) transformed = transformed.filter(i => i.category === filters.category);
      if (filters.status) transformed = transformed.filter(i => i.status === filters.status);
      if (filters.urgency) transformed = transformed.filter(i => i.urgency === filters.urgency);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        transformed = transformed.filter(i => i.title.toLowerCase().includes(q));
      }

      setIssues(transformed);
    }
    setLoading(false);
  }, [societyId, filters.category, filters.status, filters.urgency, filters.search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchIssues();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchIssues, bounds?.minLng, bounds?.minLat, bounds?.maxLng, bounds?.maxLat]);

  useEffect(() => {
    if (!societyId) return;
    const channel = supabase
      .channel(`society-issues-${societyId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'society_issues',
        filter: `society_id=eq.${societyId}`,
      }, () => {
        fetchIssues();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchIssues, societyId]);

  return { issues, loading, refetch: fetchIssues };
}
