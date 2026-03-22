'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSociety } from '@/components/society/SocietyProvider';
import { getSocietyCategoryConfig, getUrgencyConfig, getStatusConfig } from '@/lib/society/constants';
import { SocietyCommentThread } from '@/components/society/SocietyCommentThread';
import { SocietyUpvoteButton } from '@/components/society/SocietyUpvoteButton';
import { parseWkbPoint } from '@/lib/geo';
import type { SocietyIssue } from '@/lib/society/types';
import { ArrowLeft, MapPin, Clock, User, Trash2, Loader2 } from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SocietyIssuePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { society, isManagement } = useSociety();
  const supabase = createClient();
  const issueId = params.id as string;
  const slug = params.slug as string;

  const [issue, setIssue] = useState<SocietyIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from('society_issues')
      .select('*, author:profiles!author_id(display_name)')
      .eq('id', issueId)
      .single()
      .then(({ data }: { data: any }) => {
        if (data) {
          const loc = typeof data.location === 'string'
            ? parseWkbPoint(data.location)
            : [0, 0];
          setIssue({
            ...data,
            location: { type: 'Point', coordinates: loc as [number, number] },
          } as SocietyIssue);
        }
        setLoading(false);
      });
  }, [issueId]);

  const handleDelete = async () => {
    if (!confirm('Delete this issue?')) return;
    setDeleting(true);
    await supabase.from('society_issues').delete().eq('id', issueId);
    router.push(`/society/${slug}/map`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Issue not found.
      </div>
    );
  }

  const cat = getSocietyCategoryConfig(issue.category);
  const urg = getUrgencyConfig(issue.urgency);
  const st = getStatusConfig(issue.status);
  const canDelete = user?.id === issue.author_id || isManagement;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.push(`/society/${slug}/map`)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {society?.name || 'Society'}
        </button>

        {/* Photos */}
        {issue.photo_urls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {issue.photo_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Photo ${i + 1}`}
                className="h-48 rounded-lg object-cover border border-gray-800"
              />
            ))}
          </div>
        )}

        {/* Title & Tags */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-3">{issue.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
              {cat.icon} {cat.label}
            </span>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: urg.color + '20', color: urg.color }}>
              {urg.label}
            </span>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: st.color + '20', color: st.color }}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {(issue.author as any)?.display_name || 'Anonymous'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {formatDate(issue.created_at)}
          </span>
          {issue.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {issue.address}
            </span>
          )}
        </div>

        {/* Description */}
        {issue.description && (
          <p className="text-gray-300 whitespace-pre-wrap">{issue.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <SocietyUpvoteButton issueId={issue.id} initialCount={issue.upvote_count} />
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="border-t border-gray-800 pt-5">
          <SocietyCommentThread issueId={issue.id} />
        </div>
      </div>
    </div>
  );
}
