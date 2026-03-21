'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthorityEmail {
  id: string;
  recipient_email: string;
  recipient_dept: string;
  status: string;
  created_at: string;
}

export function useAuthorityEmails(issueId: string) {
  const supabase = createClient();
  const [emails, setEmails] = useState<AuthorityEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('authority_emails')
      .select('id, recipient_email, recipient_dept, status, created_at')
      .eq('issue_id', issueId)
      .eq('status', 'sent')
      .order('created_at', { ascending: true })
      .then(({ data }: { data: any }) => {
        if (data) setEmails(data);
        setLoading(false);
      });
  }, [issueId]);

  return { emails, loading };
}
