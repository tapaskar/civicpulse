'use client';

import { getSocietyCategoryConfig, getUrgencyConfig, getStatusConfig } from '@/lib/society/constants';
import type { SocietyIssue } from '@/lib/society/types';
import { ThumbsUp, Clock } from 'lucide-react';

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

interface Props {
  issue: SocietyIssue;
  isSelected?: boolean;
  onClick: () => void;
}

export function SocietyIssueCard({ issue, isSelected, onClick }: Props) {
  const cat = getSocietyCategoryConfig(issue.category);
  const urg = getUrgencyConfig(issue.urgency);
  const st = getStatusConfig(issue.status);

  return (
    <div
      onClick={onClick}
      className={`bg-gray-900 border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-gray-600 ${
        isSelected ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-800'
      }`}
    >
      {issue.photo_urls?.[0] && (
        <div className="h-32 overflow-hidden">
          <img src={issue.photo_urls[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium text-white line-clamp-2">{issue.title}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
            {cat.icon} {cat.label}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: urg.color + '20', color: urg.color }}>
            {urg.label}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: st.color + '20', color: st.color }}>
            {st.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo(issue.created_at)}
          </span>
          {issue.upvote_count > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> {issue.upvote_count}
            </span>
          )}
        </div>
        {issue.address && (
          <p className="text-xs text-gray-500 truncate">{issue.address}</p>
        )}
      </div>
    </div>
  );
}
