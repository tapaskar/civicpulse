'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Comment } from '@/lib/types';
import { Send, Loader2, Shield, Smile } from 'lucide-react';

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Common', emojis: ['👍', '👎', '❤️', '🔥', '👏', '😢', '😡', '🙏', '💯', '⚠️', '✅', '❌'] },
  { label: 'Civic', emojis: ['🚧', '🕳️', '💡', '💧', '🗑️', '🛣️', '🔊', '🚨', '🏗️', '🚦', '🌳', '🚰'] },
  { label: 'Reactions', emojis: ['😊', '😂', '🤔', '😮', '👀', '🎉', '💪', '🤝', '📸', '📍', '🗳️', '📢'] },
];

interface CommentThreadProps {
  issueId: string;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function CommentThread({ issueId }: CommentThreadProps) {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!author_id(*)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${issueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `issue_id=eq.${issueId}`,
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSubmitting(true);

    const isOfficial = profile?.role === 'admin' || profile?.role === 'official';

    await supabase.from('comments').insert({
      issue_id: issueId,
      author_id: user.id,
      text: text.trim(),
      is_official: isOfficial,
    });

    setText('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
        Comments {comments.length > 0 && <span className="text-gray-400">({comments.length})</span>}
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 py-3">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-2">
          {comments.map(comment => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                comment.is_official
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-gray-700/40 border-gray-600/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium">
                  {comment.author?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {comment.author?.display_name ?? 'Anonymous'}
                </span>
                {comment.is_official && (
                  <span className="flex items-center gap-1 text-[10px] font-medium bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                    <Shield className="w-3 h-3" /> Official
                  </span>
                )}
                <span className="text-[11px] text-gray-400 ml-auto">
                  {timeAgo(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      {user ? (
        <CommentInput
          text={text}
          setText={setText}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      ) : (
        <p className="text-sm text-gray-400">Sign in to leave a comment.</p>
      )}
    </div>
  );
}

function CommentInput({
  text,
  setText,
  submitting,
  onSubmit,
}: {
  text: string;
  setText: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? text.length;
      const end = input.selectionEnd ?? text.length;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      // Restore cursor position after emoji
      requestAnimationFrame(() => {
        input.focus();
        const pos = start + emoji.length;
        input.setSelectionRange(pos, pos);
      });
    } else {
      setText(text + emoji);
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-gray-700/60 border border-gray-600/60 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
              showEmoji ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {showEmoji && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 w-64 z-50"
        >
          {EMOJI_GROUPS.map(group => (
            <div key={group.label} className="mb-2 last:mb-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 px-1">
                {group.label}
              </p>
              <div className="grid grid-cols-6 gap-0.5">
                {group.emojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      insertEmoji(emoji);
                      setShowEmoji(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800 transition-colors text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
