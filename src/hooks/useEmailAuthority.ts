'use client';

import { useState, useCallback } from 'react';

const SENT_KEY = 'civicpulse_emails_sent';

function getSentSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SENT_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSent(key: string) {
  const set = getSentSet();
  set.add(key);
  sessionStorage.setItem(SENT_KEY, JSON.stringify([...set]));
}

export function useEmailAuthority(issueId: string, recipientEmail: string) {
  const sentKey = `${issueId}:${recipientEmail}`;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(() => getSentSet().has(sentKey));
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (recipientDept: string) => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, recipientEmail, recipientDept }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send email');
      }
      setSent(true);
      markSent(sentKey);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  }, [issueId, recipientEmail, sentKey]);

  return { sendEmail, sending, sent, error };
}
