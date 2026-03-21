'use client';

import { useAuthorityEmails } from '@/hooks/useAuthorityEmails';
import { CheckCircle2, Mail } from 'lucide-react';

export function AuthoritiesNotified({ issueId }: { issueId: string }) {
  const { emails, loading } = useAuthorityEmails(issueId);

  if (loading || emails.length === 0) return null;

  return (
    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Mail className="w-3 h-3 text-green-400" />
        <span className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">
          Authorities Notified
        </span>
      </div>
      <div className="space-y-1">
        {emails.map(e => (
          <div key={e.id} className="flex items-center gap-1.5 text-xs text-gray-300">
            <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
            <span className="font-medium text-gray-200">{e.recipient_dept}</span>
            <span className="text-gray-500">({e.recipient_email})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
