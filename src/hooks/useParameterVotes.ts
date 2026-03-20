'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ParamType, VoteDistribution } from '@/lib/types';

interface UseParameterVotesReturn {
  distribution: VoteDistribution[];
  myVotes: Record<ParamType, string | null>;
  castVote: (paramType: ParamType, paramValue: string) => Promise<void>;
  loading: boolean;
}

export function useParameterVotes(issueId: string): UseParameterVotesReturn {
  const supabase = createClient();
  const { user } = useAuth();
  const [distribution, setDistribution] = useState<VoteDistribution[]>([]);
  const [myVotes, setMyVotes] = useState<Record<ParamType, string | null>>({
    category: null,
    urgency: null,
    status: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchDistribution = useCallback(async () => {
    const { data } = await supabase.rpc('get_vote_distribution', {
      p_issue_id: issueId,
    });
    if (data) {
      setDistribution(data as VoteDistribution[]);
    }
  }, [supabase, issueId]);

  const fetchMyVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('parameter_votes')
      .select('param_type, param_value')
      .eq('issue_id', issueId)
      .eq('user_id', user.id);
    if (data) {
      const votes: Record<ParamType, string | null> = {
        category: null,
        urgency: null,
        status: null,
      };
      for (const row of data as { param_type: ParamType; param_value: string }[]) {
        votes[row.param_type] = row.param_value;
      }
      setMyVotes(votes);
    }
  }, [supabase, issueId, user]);

  useEffect(() => {
    Promise.all([fetchDistribution(), fetchMyVotes()]).finally(() =>
      setLoading(false)
    );
  }, [fetchDistribution, fetchMyVotes]);

  // Realtime subscription for vote changes
  useEffect(() => {
    const channel = supabase
      .channel(`votes:${issueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parameter_votes',
          filter: `issue_id=eq.${issueId}`,
        },
        () => {
          fetchDistribution();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, issueId, fetchDistribution]);

  const castVote = useCallback(
    async (paramType: ParamType, paramValue: string) => {
      if (!user) return;

      // Optimistic update
      const prevDistribution = [...distribution];
      const prevMyVotes = { ...myVotes };

      // Update my votes optimistically
      setMyVotes(prev => ({ ...prev, [paramType]: paramValue }));

      // Update distribution optimistically
      setDistribution(prev => {
        const updated = prev.filter(
          d => !(d.param_type === paramType && d.param_value === prevMyVotes[paramType])
        ).map(d => {
          if (d.param_type === paramType && d.param_value === prevMyVotes[paramType]) {
            return { ...d, vote_count: Math.max(0, d.vote_count - 1) };
          }
          return d;
        });

        const existing = updated.find(
          d => d.param_type === paramType && d.param_value === paramValue
        );
        if (existing) {
          return updated.map(d =>
            d.param_type === paramType && d.param_value === paramValue
              ? { ...d, vote_count: d.vote_count + 1 }
              : d
          );
        } else {
          return [
            ...updated,
            { param_type: paramType, param_value: paramValue, vote_count: 1 },
          ];
        }
      });

      const { error } = await supabase.from('parameter_votes').upsert(
        {
          user_id: user.id,
          issue_id: issueId,
          param_type: paramType,
          param_value: paramValue,
        },
        { onConflict: 'user_id,issue_id,param_type' }
      );

      if (error) {
        // Revert on error
        setDistribution(prevDistribution);
        setMyVotes(prevMyVotes);
      } else {
        // Refetch for accurate counts
        fetchDistribution();
      }
    },
    [user, supabase, issueId, distribution, myVotes, fetchDistribution]
  );

  return { distribution, myVotes, castVote, loading };
}
