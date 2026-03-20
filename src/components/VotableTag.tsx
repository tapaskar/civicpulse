'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParameterVotes } from '@/hooks/useParameterVotes';
import { URGENCY_LEVELS, STATUS_OPTIONS } from '@/lib/constants';
import type { ParamType } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

const PARAM_OPTIONS: Record<'urgency' | 'status', { value: string; label: string; color: string }[]> = {
  urgency: URGENCY_LEVELS,
  status: STATUS_OPTIONS,
};

interface VotableTagProps {
  issueId: string;
  paramType: 'urgency' | 'status';
  currentValue: string;
  currentLabel: string;
  currentColor: string;
  /** Compact mode for inline detail (smaller text) */
  compact?: boolean;
}

export function VotableTag({
  issueId,
  paramType,
  currentValue,
  currentLabel,
  currentColor,
  compact = false,
}: VotableTagProps) {
  const { user } = useAuth();
  const { distribution, myVotes, castVote } = useParameterVotes(issueId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const options = PARAM_OPTIONS[paramType];
  const typeDistribution = distribution.filter(d => d.param_type === paramType);
  const totalVotes = typeDistribution.reduce((sum, d) => sum + d.vote_count, 0);
  const myVote = myVotes[paramType];

  const textSize = compact ? 'text-[11px]' : 'text-xs';
  const padding = compact ? 'px-2 py-0.5' : 'px-2 py-1';

  // If not logged in, render static tag
  if (!user) {
    return (
      <span
        className={`${textSize} font-medium ${padding} rounded-full`}
        style={{ backgroundColor: currentColor + '20', color: currentColor }}
      >
        {currentLabel}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`${textSize} font-medium ${padding} rounded-full inline-flex items-center gap-1 transition-all hover:ring-1 hover:ring-white/20 cursor-pointer`}
        style={{ backgroundColor: currentColor + '20', color: currentColor }}
      >
        {currentLabel}
        <ChevronDown className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} opacity-60`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[180px] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2.5 py-1.5 border-b border-gray-800">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              {totalVotes < 3 && ' \u00b7 3 needed for consensus'}
            </span>
          </div>
          {options.map(option => {
            const votes = typeDistribution.find(d => d.param_value === option.value)?.vote_count ?? 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isMyVote = myVote === option.value;
            const isCurrent = option.value === currentValue;

            return (
              <button
                key={option.value}
                onClick={() => {
                  castVote(paramType as ParamType, option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
                  isMyVote ? 'bg-gray-800/80' : 'hover:bg-gray-800/50'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                <span className="text-xs text-gray-200 flex-1">{option.label}</span>
                {votes > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 bg-gray-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: option.color }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 w-4 text-right">{votes}</span>
                  </div>
                )}
                {isMyVote && (
                  <span className="text-[9px] text-emerald-400 font-semibold ml-0.5">YOU</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
