'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowUp } from 'lucide-react';

interface UpvoteButtonProps {
  issueId: string;
  initialCount: number;
}

export function UpvoteButton({ issueId, initialCount }: UpvoteButtonProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [upvoted, setUpvoted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Check if user already upvoted
  useEffect(() => {
    if (!user) return;
    supabase
      .from('upvotes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('issue_id', issueId)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data) setUpvoted(true);
      });
  }, [user, issueId]);

  const toggle = async () => {
    if (!user || loading) return;
    setLoading(true);

    // Optimistic update
    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setCount(c => c + (wasUpvoted ? -1 : 1));

    if (wasUpvoted) {
      const { error } = await supabase
        .from('upvotes')
        .delete()
        .eq('user_id', user.id)
        .eq('issue_id', issueId);
      if (error) {
        setUpvoted(true);
        setCount(c => c + 1);
      }
    } else {
      const { error } = await supabase
        .from('upvotes')
        .insert({ user_id: user.id, issue_id: issueId });
      if (error) {
        setUpvoted(false);
        setCount(c => c - 1);
      }
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={!user}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        upvoted
          ? 'bg-emerald-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
      } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <ArrowUp className="w-4 h-4" />
      {count}
    </button>
  );
}
