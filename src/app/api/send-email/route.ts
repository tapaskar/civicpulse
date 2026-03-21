import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://civicpulse-pi.vercel.app';
const MAX_EMAILS_PER_ISSUE = 3;

export async function POST(request: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { issueId, recipientEmail, recipientDept } = await request.json();

    if (!issueId || !recipientEmail || !recipientDept) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limit: max emails per user per issue
    const { count } = await supabase
      .from('authority_emails')
      .select('*', { count: 'exact', head: true })
      .eq('issue_id', issueId)
      .eq('sender_id', user.id);

    if ((count ?? 0) >= MAX_EMAILS_PER_ISSUE) {
      return NextResponse.json({ error: 'Email limit reached for this issue' }, { status: 429 });
    }

    // Fetch issue details
    const { data: issue, error: issueErr } = await supabase
      .from('issues')
      .select('title, description, category, urgency, address, created_at')
      .eq('id', issueId)
      .single();

    if (issueErr || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Fetch sender profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const senderName = profile?.display_name || 'A concerned citizen';
    const issueUrl = `${APP_URL}/issue/${issueId}`;
    const date = new Date(issue.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const subject = `Civic Issue Report: ${issue.title} — ${issue.address || 'Location on map'}`;

    const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
  <div style="background: #f8fafc; border-bottom: 3px solid #3b82f6; padding: 20px 24px;">
    <h2 style="margin: 0; font-size: 18px; color: #1e293b;">Civic Issue Report</h2>
    <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">via CivicPulse</p>
  </div>
  <div style="padding: 24px;">
    <p style="margin: 0 0 16px; color: #334155;">Dear <strong>${recipientDept}</strong>,</p>
    <p style="margin: 0 0 20px; color: #334155;">A civic issue has been reported in your jurisdiction:</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; width: 120px; color: #475569;">Issue</td><td style="padding: 8px 12px; color: #1e293b;">${issue.title}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Category</td><td style="padding: 8px 12px; color: #1e293b;">${issue.category}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Urgency</td><td style="padding: 8px 12px; color: #1e293b;">${issue.urgency}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Location</td><td style="padding: 8px 12px; color: #1e293b;">${issue.address || 'See map link'}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Reported</td><td style="padding: 8px 12px; color: #1e293b;">${date}</td></tr>
      ${issue.description ? `<tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Details</td><td style="padding: 8px 12px; color: #1e293b;">${issue.description}</td></tr>` : ''}
    </table>
    <a href="${issueUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Full Details</a>
    <p style="margin: 24px 0 0; color: #64748b; font-size: 13px;">
      Sent by ${senderName} via <a href="${APP_URL}" style="color: #3b82f6;">CivicPulse</a>
    </p>
  </div>
</div>`.trim();

    // Send via Resend API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'CivicPulse <onboarding@resend.dev>',
        to: [recipientEmail],
        subject,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend API error:', resendData);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
    }

    // Record in DB
    await supabase.from('authority_emails').insert({
      issue_id: issueId,
      sender_id: user.id,
      recipient_email: recipientEmail,
      recipient_dept: recipientDept,
      subject,
      body: htmlBody,
      status: 'sent',
    });

    return NextResponse.json({ success: true, emailId: resendData.id });
  } catch (err: unknown) {
    console.error('Send email error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
