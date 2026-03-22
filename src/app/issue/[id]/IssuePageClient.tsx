'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { parseWkbPoint } from '@/lib/geo';
import { getCategoryConfig, getStatusConfig, getUrgencyConfig } from '@/lib/constants';
import { UpvoteButton } from '@/components/UpvoteButton';
import { CommentThread } from '@/components/CommentThread';
import { VotableTag } from '@/components/VotableTag';
import type { Issue } from '@/lib/types';
import { getAuthoritiesForLocation, getAuthorityForCategory } from '@/lib/authorities';
import { useDistrictAuthority } from '@/hooks/useDistrictAuthority';
import { composeTweetUrl } from '@/lib/social';
import { useEmailAuthority } from '@/hooks/useEmailAuthority';
import { useAuth } from '@/hooks/useAuth';
import { AuthoritiesNotified } from '@/components/AuthoritiesNotified';
import { TweetPreview } from '@/components/TweetPreview';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Share2,
  Loader2,
  ExternalLink,
  Building2,
  Landmark,
  Twitter,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Check,
  Trash2,
} from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IssuePageClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, profile } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Hooks must be called unconditionally (before early returns)
  const issueCoords = issue?.location?.coordinates;
  const { authority: dm } = useDistrictAuthority(
    issueCoords ? issueCoords[1] : null,
    issueCoords ? issueCoords[0] : null,
  );

  // Authority lookup (unconditional for hooks)
  const city = issueCoords ? getAuthoritiesForLocation(issueCoords[0], issueCoords[1]) : null;
  const authority = issue ? getAuthorityForCategory(city, issue.category) : null;
  const deptEmail = authority?.email || '';
  const dmEmail = dm?.email || '';

  const { sendEmail: sendDeptEmail, sending: sendingDept, sent: sentDept } = useEmailAuthority(id, deptEmail);
  const { sendEmail: sendDmEmail, sending: sendingDm, sent: sentDm } = useEmailAuthority(id, dmEmail);

  useEffect(() => {
    const fetchIssue = async () => {
      const { data } = await supabase
        .from('issues')
        .select('*, author:profiles!author_id(*)')
        .eq('id', id)
        .single();

      if (data) {
        const coords = typeof data.location === 'string'
          ? parseWkbPoint(data.location)
          : [0, 0];
        setIssue({
          ...data,
          location: { type: 'Point', coordinates: coords as [number, number] },
        } as Issue);
      }
      setLoading(false);
    };
    fetchIssue();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-400">Issue not found.</p>
        <Link href="/map" className="text-blue-400 hover:text-blue-300 text-sm">
          Back to map
        </Link>
      </div>
    );
  }

  const category = getCategoryConfig(issue.category);
  const status = getStatusConfig(issue.status);
  const urgency = getUrgencyConfig(issue.urgency);
  const [lng, lat] = issue.location?.coordinates ?? [0, 0];

  const canDelete = user && (user.id === issue.author_id || profile?.role === 'admin');

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: issue.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    const { error } = await supabase.from('issues').delete().eq('id', issue.id);
    if (!error) {
      router.push('/map');
    } else {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <UpvoteButton issueId={issue.id} initialCount={issue.upvote_count} />
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {canDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-medium bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Delete issue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Title + tags */}
        <div>
          <h1 className="text-2xl font-bold text-white">{issue.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
              style={{ backgroundColor: category.color + '20', color: category.color }}
            >
              {category.icon} {category.label}
            </span>
            <VotableTag
              issueId={issue.id}
              paramType="status"
              currentValue={issue.status}
              currentLabel={status.label}
              currentColor={status.color}
            />
            <VotableTag
              issueId={issue.id}
              paramType="urgency"
              currentValue={issue.urgency}
              currentLabel={urgency.label}
              currentColor={urgency.color}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {issue.author?.display_name ?? 'Anonymous'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(issue.created_at)}
          </span>
          {issue.address && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {issue.address}
            </span>
          )}
        </div>

        {/* Responsible department */}
        {authority && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Responsible Department
              </span>
            </div>
            <p className="text-sm font-medium text-gray-200">{authority.department}</p>
            <div className="flex flex-wrap gap-1.5">
              {authority.twitter && (
                <a href={`https://x.com/${authority.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <Twitter className="w-3 h-3 text-sky-400" /> {authority.twitter}
                </a>
              )}
              {authority.email && (
                <a href={`mailto:${authority.email}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <Mail className="w-3 h-3 text-amber-400" /> {authority.email}
                </a>
              )}
              {authority.helpline && (
                <a href={`tel:${authority.helpline.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <Phone className="w-3 h-3 text-green-400" /> {authority.helpline}
                </a>
              )}
              {authority.whatsapp && (
                <a href={`https://wa.me/91${authority.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <MessageCircle className="w-3 h-3 text-green-500" /> WA {authority.whatsapp}
                </a>
              )}
              {authority.phone && !authority.helpline && (
                <a href={`tel:${authority.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <Phone className="w-3 h-3 text-green-400" /> {authority.phone}
                </a>
              )}
              {authority.website && (
                <a href={authority.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <ExternalLink className="w-3 h-3 text-gray-400" /> Portal
                </a>
              )}
            </div>
            {/* Action buttons */}
            {user && (authority.twitter || authority.email) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-500/10">
                {authority.twitter && (
                  <a
                    href={composeTweetUrl({ title: issue.title, category: getCategoryConfig(issue.category).label, address: issue.address, twitterHandle: authority.twitter, issueUrl: window.location.href })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" /> Tweet this Issue
                  </a>
                )}
                {authority.email && (
                  <button
                    onClick={() => sendDeptEmail(authority.department)}
                    disabled={sendingDept || sentDept}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sendingDept ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : sentDept ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    {sentDept ? 'Email Sent' : 'Email Authority'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* District Magistrate / Collector */}
        {dm && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                {dm.title}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-200">
              {dm.district}, {dm.state}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dm.email && (
                <a href={`mailto:${dm.email}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <Mail className="w-3 h-3 text-amber-400" /> {dm.email}
                </a>
              )}
              {dm.phone && (
                <a href={`tel:${dm.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <Phone className="w-3 h-3 text-green-400" /> {dm.phone}
                </a>
              )}
              {dm.website && (
                <a href={dm.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                  <ExternalLink className="w-3 h-3 text-gray-400" /> District Portal
                </a>
              )}
              <a href={dm.cpgrams} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                <ExternalLink className="w-3 h-3 text-blue-400" /> CPGRAMS
              </a>
              <a href={`tel:${dm.helpline}`}
                className="inline-flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors">
                <Phone className="w-3 h-3 text-red-400" /> {dm.helpline}
              </a>
            </div>
            {/* DM action buttons */}
            {user && dm.email && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-500/10">
                <button
                  onClick={() => sendDmEmail(`${dm.title}, ${dm.district}`)}
                  disabled={sendingDm || sentDm}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingDm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : sentDm ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  {sentDm ? 'Email Sent' : `Email ${dm.title}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Authorities Notified */}
        <AuthoritiesNotified issueId={issue.id} />

        {/* Tweet Preview */}
        {user && (
          <TweetPreview
            title={issue.title}
            category={getCategoryConfig(issue.category).label}
            address={issue.address}
            twitterHandle={authority?.twitter}
            issueUrl={window.location.href}
          />
        )}

        {/* Photos */}
        {issue.photo_urls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {issue.photo_urls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 relative group"
              >
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="w-48 h-36 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Description */}
        {issue.description && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{issue.description}</p>
          </div>
        )}

        {/* Map link */}
        {lat && lng ? (
          <Link
            href={`/map?lat=${lat}&lng=${lng}&zoom=16`}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            <MapPin className="w-4 h-4" /> View on map
          </Link>
        ) : null}

        {/* Comments */}
        <hr className="border-gray-800" />
        <CommentThread issueId={issue.id} />
      </div>
    </div>
  );
}
