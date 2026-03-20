'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Issue, IssueFilters } from '@/lib/types';

interface Bounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function useIssues(bounds: Bounds | null, filters: IssueFilters) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchIssues = useCallback(async () => {
    if (!boundsRef.current) return;
    setLoading(true);

    const { minLng, minLat, maxLng, maxLat } = boundsRef.current;

    const { data, error } = await supabase.rpc('issues_in_bounds', {
      min_lng: minLng,
      min_lat: minLat,
      max_lng: maxLng,
      max_lat: maxLat,
    });

    if (!error && data) {
      let transformed: Issue[] = (data as any[]).map(row => ({
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
  }, [filters.category, filters.status, filters.urgency, filters.search]);

  // Debounce bounds changes (300ms) to avoid rapid refetches during map panning
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchIssues();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchIssues, bounds?.minLng, bounds?.minLat, bounds?.maxLng, bounds?.maxLat]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('issues-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        fetchIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIssues]);

  return { issues, loading, refetch: fetchIssues };
}
