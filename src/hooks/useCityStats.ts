'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CityStat {
  city: string;
  total: number;
  open_count: number;
  resolved_count: number;
}

export function useCityStats() {
  const supabase = createClient();
  const [stats, setStats] = useState<CityStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .rpc('city_issue_stats')
      .then(({ data }: { data: any }) => {
        if (data) setStats(data);
        setLoading(false);
      });
  }, []);

  const totalIssues = stats.reduce((sum, s) => sum + s.total, 0);
  const totalCities = stats.filter(s => s.total > 0).length;
  const totalResolved = stats.reduce((sum, s) => sum + s.resolved_count, 0);

  return { stats, totalIssues, totalCities, totalResolved, loading };
}
