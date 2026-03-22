'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ThumbsUp } from 'lucide-react';

interface Props {
  issueId: string;
  initialCount: number;
}

export function SocietyUpvoteButton({ issueId, initialCount }: Props) {
  const { user } = useAuth();
  const supabase = createClient();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('society_upvotes')
      .select('user_id')
      .eq('issue_id', issueId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: { data: any }) => { if (data) setVoted(true); });
  }, [user?.id, issueId]);

  const toggle = async () => {
    if (!user || loading) return;
    setLoading(true);
    if (voted) {
      await supabase.from('society_upvotes').delete().eq('issue_id', issueId).eq('user_id', user.id);
      setCount(c => c - 1);
      setVoted(false);
    } else {
      await supabase.from('society_upvotes').insert({ issue_id: issueId, user_id: user.id });
      setCount(c => c + 1);
      setVoted(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={!user || loading}
      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
        voted
          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
          : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
      } ${!user ? 'opacity-50 cursor-default' : ''}`}
    >
      <ThumbsUp className={`w-4 h-4 ${voted ? 'fill-current' : ''}`} />
      {count}
    </button>
  );
}
