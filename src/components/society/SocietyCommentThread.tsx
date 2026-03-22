'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSociety } from '@/components/society/SocietyProvider';
import type { Comment } from '@/lib/types';
import { Send, Loader2, Shield, Smile, Pencil, Trash2, X, Check, Plus } from 'lucide-react';

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Common', emojis: ['👍', '👎', '❤️', '🔥', '👏', '😢', '😡', '🙏', '💯', '⚠️', '✅', '❌'] },
  { label: 'Civic', emojis: ['🚧', '🕳️', '💡', '💧', '🗑️', '🛣️', '🔊', '🚨', '🏗️', '🚦', '🌳', '🚰'] },
  { label: 'Reactions', emojis: ['😊', '😂', '🤔', '😮', '👀', '🎉', '💪', '🤝', '📸', '📍', '🗳️', '📢'] },
];

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '😂', '😢', '👏'];

interface ReactionRow {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
}

// Grouped reaction: emoji → count + whether current user reacted
interface GroupedReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface SocietyCommentThreadProps {
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

export function SocietyCommentThread({ issueId }: SocietyCommentThreadProps) {
  const { user } = useAuth();
  const { isStaff } = useSociety();
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Map<string, ReactionRow[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('society_comments')
      .select('*, author:profiles!author_id(*)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });
    if (data) {
      setComments(data);
      // Fetch reactions for all comments
      const commentIds = data.map((c: Comment) => c.id);
      if (commentIds.length > 0) {
        const { data: rxns } = await supabase
          .from('society_comment_reactions')
          .select('*')
          .in('comment_id', commentIds);
        if (rxns) {
          const map = new Map<string, ReactionRow[]>();
          for (const r of rxns as ReactionRow[]) {
            const arr = map.get(r.comment_id) || [];
            arr.push(r);
            map.set(r.comment_id, arr);
          }
          setReactions(map);
        }
      }
    }
    setLoading(false);
  }, [issueId, supabase]);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`society-comments-${issueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'society_comments',
        filter: `issue_id=eq.${issueId}`,
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('society_comments').insert({
      issue_id: issueId,
      author_id: user.id,
      text: text.trim(),
      is_official: isStaff,
    });

    if (!error) {
      setText('');
      await fetchComments();
    } else {
      console.error('Comment insert error:', error.message);
    }
    setSubmitting(false);
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    const { error } = await supabase
      .from('society_comments')
      .update({ text: editText.trim() })
      .eq('id', commentId);
    if (!error) {
      setEditingId(null);
      setEditText('');
      await fetchComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    const { error } = await supabase
      .from('society_comments')
      .delete()
      .eq('id', commentId);
    if (!error) {
      await fetchComments();
    }
    setDeletingId(null);
  };

  const toggleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;

    const commentReactions = reactions.get(commentId) || [];
    const existing = commentReactions.find(r => r.user_id === user.id && r.emoji === emoji);

    if (existing) {
      // Remove reaction (optimistic)
      setReactions(prev => {
        const next = new Map(prev);
        next.set(commentId, (next.get(commentId) || []).filter(r => r.id !== existing.id));
        return next;
      });
      await supabase.from('society_comment_reactions').delete().eq('id', existing.id);
    } else {
      // Add reaction (optimistic)
      const tempId = crypto.randomUUID();
      const newReaction: ReactionRow = { id: tempId, comment_id: commentId, user_id: user.id, emoji };
      setReactions(prev => {
        const next = new Map(prev);
        next.set(commentId, [...(next.get(commentId) || []), newReaction]);
        return next;
      });
      await supabase.from('society_comment_reactions').insert({
        comment_id: commentId,
        user_id: user.id,
        emoji,
      });
    }
    setReactionPickerFor(null);
  };

  const getGroupedReactions = (commentId: string): GroupedReaction[] => {
    const rows = reactions.get(commentId) || [];
    const map = new Map<string, { count: number; userReacted: boolean }>();
    for (const r of rows) {
      const entry = map.get(r.emoji) || { count: 0, userReacted: false };
      entry.count++;
      if (r.user_id === user?.id) entry.userReacted = true;
      map.set(r.emoji, entry);
    }
    return Array.from(map.entries()).map(([emoji, { count, userReacted }]) => ({
      emoji, count, userReacted,
    }));
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
          {comments.map(comment => {
            const isOwn = user?.id === comment.author_id;
            const displayName = comment.author?.display_name ?? 'Anonymous';
            const displayInitial = comment.author?.display_name?.[0]?.toUpperCase() ?? '?';
            const isEditing = editingId === comment.id;
            const grouped = getGroupedReactions(comment.id);
            const showPicker = reactionPickerFor === comment.id;

            return (
              <div
                key={comment.id}
                className={`p-3 rounded-lg border group relative ${
                  comment.is_official
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-gray-700/40 border-gray-600/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium">
                    {displayInitial}
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {displayName}
                  </span>
                  {comment.is_official && (
                    <span className="flex items-center gap-1 text-[10px] font-medium bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                      <Shield className="w-3 h-3" /> Staff
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 ml-auto">
                    {timeAgo(comment.created_at)}
                  </span>
                  {/* Action buttons (edit/delete/react) — visible on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {user && (
                      <button
                        onClick={() => setReactionPickerFor(showPicker ? null : comment.id)}
                        className={`p-1 rounded transition-colors ${showPicker ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'}`}
                        title="React"
                      >
                        <Smile className="w-3 h-3" />
                      </button>
                    )}
                    {isOwn && !isEditing && (
                      <>
                        <button
                          onClick={() => { setEditingId(comment.id); setEditText(comment.text); }}
                          className="p-1 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          {deletingId === comment.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Comment text or edit mode */}
                {isEditing ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="flex-1 bg-gray-700/60 border border-gray-600/60 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEdit(comment.id);
                        if (e.key === 'Escape') { setEditingId(null); setEditText(''); }
                      }}
                    />
                    <button
                      onClick={() => handleEdit(comment.id)}
                      disabled={!editText.trim()}
                      className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditText(''); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                )}

                {/* Reaction pills (Slack-style) */}
                {(grouped.length > 0 || (user && !isEditing)) && (
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {grouped.map(r => (
                      <button
                        key={r.emoji}
                        onClick={() => toggleReaction(comment.id, r.emoji)}
                        disabled={!user}
                        className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border transition-all ${
                          r.userReacted
                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500/25'
                            : 'bg-gray-700/60 border-gray-600/40 text-gray-300 hover:bg-gray-600/60'
                        } ${!user ? 'cursor-default' : ''}`}
                      >
                        <span className="text-sm">{r.emoji}</span>
                        <span className="font-medium">{r.count}</span>
                      </button>
                    ))}
                    {/* Add reaction button */}
                    {user && !isEditing && (
                      <button
                        onClick={() => setReactionPickerFor(showPicker ? null : comment.id)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-dashed border-gray-600/50 text-gray-500 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-700/40 transition-all opacity-0 group-hover:opacity-100"
                        title="Add reaction"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Reaction picker popover */}
                {showPicker && (
                  <ReactionPicker
                    quickEmojis={QUICK_REACTIONS}
                    allGroups={EMOJI_GROUPS}
                    onSelect={emoji => toggleReaction(comment.id, emoji)}
                    onClose={() => setReactionPickerFor(null)}
                  />
                )}
              </div>
            );
          })}
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

/* -- Reaction Picker (Slack-style) -- */
function ReactionPicker({
  quickEmojis,
  allGroups,
  onSelect,
  onClose,
}: {
  quickEmojis: string[];
  allGroups: { label: string; emojis: string[] }[];
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 bottom-full mb-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 animate-scale-in"
    >
      {!expanded ? (
        <div className="flex items-center gap-0.5 p-1.5">
          {quickEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setExpanded(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300 border-l border-gray-700 ml-0.5 pl-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-2 w-64 max-h-52 overflow-y-auto custom-scrollbar">
          {allGroups.map(group => (
            <div key={group.label} className="mb-2 last:mb-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 px-1">
                {group.label}
              </p>
              <div className="grid grid-cols-6 gap-0.5">
                {group.emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
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
    </div>
  );
}

/* -- Comment Input -- */
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
