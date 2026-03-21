'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseWkbPoint } from '@/lib/geo';
import { getCategoryConfig, getStatusConfig, getUrgencyConfig } from '@/lib/constants';
import { UpvoteButton } from './UpvoteButton';
import { CommentThread } from './CommentThread';
import { VotableTag } from './VotableTag';
import type { Issue } from '@/lib/types';
import { getAuthoritiesForLocation, getAuthorityForCategory } from '@/lib/authorities';
import { useDistrictAuthority } from '@/hooks/useDistrictAuthority';
import { composeTweetUrl } from '@/lib/social';
import { useEmailAuthority } from '@/hooks/useEmailAuthority';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Share2,
  ExternalLink,
  Building2,
  Landmark,
  Twitter,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Loader2,
  Check,
} from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
}

export function IssueDetail({ issue: initialIssue, onBack }: IssueDetailProps) {
  const supabase = createClient();
  const [issue, setIssue] = useState<Issue>(initialIssue);

  // Fetch full issue data (with author) if not already present
  useEffect(() => {
    if (initialIssue.author) {
      setIssue(initialIssue);
      return;
    }
    supabase
      .from('issues')
      .select('*, author:profiles!author_id(*)')
      .eq('id', initialIssue.id)
      .single()
      .then(({ data }: { data: any }) => {
        if (data) {
          const coords = typeof data.location === 'string'
            ? parseWkbPoint(data.location)
            : initialIssue.location.coordinates;
          setIssue({
            ...data,
            location: { type: 'Point', coordinates: coords as [number, number] },
          } as Issue);
        }
      });
  }, [initialIssue.id]);

  const { user } = useAuth();
  const category = getCategoryConfig(issue.category);
  const status = getStatusConfig(issue.status);
  const urgency = getUrgencyConfig(issue.urgency);
  const [issueLng, issueLat] = issue.location.coordinates;
  const { authority: dm } = useDistrictAuthority(issueLat, issueLng);

  // Authority lookup
  const city = getAuthoritiesForLocation(issueLng, issueLat);
  const authority = getAuthorityForCategory(city, issue.category);
  const deptEmail = authority?.email || '';
  const dmEmail = dm?.email || '';

  const { sendEmail: sendDeptEmail, sending: sendingDept, sent: sentDept } = useEmailAuthority(issue.id, deptEmail);
  const { sendEmail: sendDmEmail, sending: sendingDm, sent: sentDm } = useEmailAuthority(issue.id, dmEmail);

  const issueUrl = typeof window !== 'undefined' ? `${window.location.origin}/issue/${issue.id}` : '';

  const handleShare = async () => {
    const url = `${window.location.origin}/issue/${issue.id}`;
    if (navigator.share) {
      await navigator.share({ title: issue.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors p-1 -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 flex-1">Issue Detail</span>
        <UpvoteButton issueId={issue.id} initialCount={issue.upvote_count} />
        <button
          onClick={handleShare}
          className="text-gray-400 hover:text-white p-1"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Title */}
          <h2 className="text-lg font-semibold text-white leading-snug">{issue.title}</h2>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
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
              compact
            />
            <VotableTag
              issueId={issue.id}
              paramType="urgency"
              currentValue={issue.urgency}
              currentLabel={urgency.label}
              currentColor={urgency.color}
              compact
            />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {issue.author?.display_name ?? 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(issue.created_at)}
            </span>
          </div>

          {issue.address && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              {issue.address}
            </p>
          )}

          {/* Responsible authority (department) */}
          {authority && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-blue-500" />
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                  Responsible Department
                </span>
              </div>
              <p className="text-xs font-medium text-gray-200">{authority.department}</p>
              <div className="flex flex-wrap gap-1">
                {authority.twitter && (
                  <a href={`https://x.com/${authority.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <Twitter className="w-3 h-3 text-sky-400" /> {authority.twitter}
                  </a>
                )}
                {authority.email && (
                  <a href={`mailto:${authority.email}`}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <Mail className="w-3 h-3 text-amber-400" /> {authority.email}
                  </a>
                )}
                {authority.helpline && (
                  <a href={`tel:${authority.helpline.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <Phone className="w-3 h-3 text-green-400" /> {authority.helpline}
                  </a>
                )}
                {authority.whatsapp && (
                  <a href={`https://wa.me/91${authority.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <MessageCircle className="w-3 h-3 text-green-500" /> WA {authority.whatsapp}
                  </a>
                )}
                {authority.phone && !authority.helpline && (
                  <a href={`tel:${authority.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <Phone className="w-3 h-3 text-green-400" /> {authority.phone}
                  </a>
                )}
                {authority.website && (
                  <a href={authority.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <ExternalLink className="w-3 h-3 text-gray-400" /> Portal
                  </a>
                )}
              </div>
              {/* Action buttons */}
              {user && (authority.twitter || authority.email) && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-blue-500/10 mt-1.5">
                  {authority.twitter && (
                    <a
                      href={composeTweetUrl({ title: issue.title, category: category.label, address: issue.address, twitterHandle: authority.twitter, issueUrl })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Twitter className="w-3 h-3" /> Tweet this Issue
                    </a>
                  )}
                  {authority.email && (
                    <button
                      onClick={() => sendDeptEmail(authority.department)}
                      disabled={sendingDept || sentDept}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sendingDept ? <Loader2 className="w-3 h-3 animate-spin" /> : sentDept ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                      {sentDept ? 'Email Sent' : 'Email Authority'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* District Magistrate / Collector */}
          {dm && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Landmark className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                  {dm.title}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-200">
                {dm.district}, {dm.state}
              </p>
              <div className="flex flex-wrap gap-1">
                {dm.email && (
                  <a href={`mailto:${dm.email}`}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <Mail className="w-3 h-3 text-amber-400" /> {dm.email}
                  </a>
                )}
                {dm.phone && (
                  <a href={`tel:${dm.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <Phone className="w-3 h-3 text-green-400" /> {dm.phone}
                  </a>
                )}
                {dm.website && (
                  <a href={dm.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                    <ExternalLink className="w-3 h-3 text-gray-400" /> District Portal
                  </a>
                )}
                <a href={dm.cpgrams} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                  <ExternalLink className="w-3 h-3 text-blue-400" /> CPGRAMS
                </a>
                <a href={`tel:${dm.helpline}`}
                  className="inline-flex items-center gap-1 text-[11px] text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-700 transition-colors">
                  <Phone className="w-3 h-3 text-red-400" /> {dm.helpline}
                </a>
              </div>
              {/* DM action buttons */}
              {user && dm.email && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-500/10 mt-1.5">
                  <button
                    onClick={() => sendDmEmail(`${dm.title}, ${dm.district}`)}
                    disabled={sendingDm || sentDm}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sendingDm ? <Loader2 className="w-3 h-3 animate-spin" /> : sentDm ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                    {sentDm ? 'Email Sent' : `Email ${dm.title}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          {issue.photo_urls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
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
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Description */}
          {issue.description && (
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{issue.description}</p>
            </div>
          )}

          {/* Comments */}
          <div className="pt-2 border-t border-gray-800">
            <CommentThread issueId={issue.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
