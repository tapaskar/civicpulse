'use client';

import { memo } from 'react';
import type { Issue } from '@/lib/types';
import { getCategoryConfig, getStatusConfig, getUrgencyConfig } from '@/lib/constants';
import { MapPin, ArrowUp, Clock } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  selected?: boolean;
  onClick: () => void;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export const IssueCard = memo(function IssueCard({ issue, selected, onClick }: IssueCardProps) {
  const category = getCategoryConfig(issue.category);
  const status = getStatusConfig(issue.status);
  const urgency = getUrgencyConfig(issue.urgency);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
        selected ? 'bg-gray-800/80 border-l-2 border-l-emerald-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: category.color + '20' }}
        >
          {category.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-medium text-white truncate">{issue.title}</h3>

          {/* Address */}
          {issue.address && (
            <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {issue.address}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: status.color + '20', color: status.color }}
            >
              {status.label}
            </span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: urgency.color + '20', color: urgency.color }}
            >
              {urgency.label}
            </span>
          </div>
        </div>

        {/* Right side: upvotes + time */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="flex items-center gap-0.5 text-xs text-gray-400">
            <ArrowUp className="w-3 h-3" />
            {issue.upvote_count}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
            <Clock className="w-3 h-3" />
            {timeAgo(issue.created_at)}
          </span>
        </div>
      </div>
    </button>
  );
});
