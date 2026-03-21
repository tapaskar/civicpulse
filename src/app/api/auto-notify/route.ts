import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getAuthoritiesForLocation, getAuthorityForCategory } from '@/lib/authorities';
import { reverseGeocodeDistrict, buildDistrictAuthority } from '@/lib/districtAuthority';
import type { Category } from '@/lib/types';

const ses = new SESClient({
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const EMAIL_DOMAIN = process.env.SES_EMAIL_DOMAIN || 'interns.city';
const FALLBACK_FROM = process.env.SES_FROM_EMAIL || `admin@${EMAIL_DOMAIN}`;
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://interns.city';

const CITY_KEYWORDS: [string, string][] = [
  ['delhi', 'delhi'], ['new delhi', 'delhi'], ['mumbai', 'mumbai'],
  ['bengaluru', 'bengaluru'], ['bangalore', 'bengaluru'], ['chennai', 'chennai'],
  ['hyderabad', 'hyderabad'], ['pune', 'pune'], ['kolkata', 'kolkata'],
  ['calcutta', 'kolkata'], ['gurugram', 'gurugram'], ['gurgaon', 'gurugram'],
  ['noida', 'noida'], ['faridabad', 'faridabad'], ['jaipur', 'jaipur'],
  ['lucknow', 'lucknow'], ['ahmedabad', 'ahmedabad'], ['chandigarh', 'chandigarh'],
  ['bhopal', 'bhopal'], ['indore', 'indore'], ['patna', 'patna'],
  ['kochi', 'kochi'], ['thiruvananthapuram', 'thiruvananthapuram'],
  ['visakhapatnam', 'visakhapatnam'], ['coimbatore', 'coimbatore'],
  ['nagpur', 'nagpur'], ['surat', 'surat'], ['vadodara', 'vadodara'],
  ['thane', 'thane'], ['ghaziabad', 'ghaziabad'],
];

function getFromEmail(address: string | null): string {
  if (!address) return FALLBACK_FROM;
  const lower = address.toLowerCase();
  for (const [keyword, city] of CITY_KEYWORDS) {
    if (lower.includes(keyword)) return `${city}@${EMAIL_DOMAIN}`;
  }
  return FALLBACK_FROM;
}

function buildEmailHtml(issue: {
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  address: string | null;
  created_at: string;
}, recipientDept: string, senderName: string, issueId: string, lat: number, lng: number) {
  const issueUrl = `${APP_URL}/issue/${issueId}`;
  const mapUrl = `${APP_URL}/map?lat=${lat}&lng=${lng}&zoom=16`;
  const date = new Date(issue.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
  <div style="background: #f8fafc; border-bottom: 3px solid #3b82f6; padding: 20px 24px;">
    <h2 style="margin: 0; font-size: 18px; color: #1e293b;">Civic Issue Report</h2>
    <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">via interns.city — Automated notification</p>
  </div>
  <div style="padding: 24px;">
    <p style="margin: 0 0 16px; color: #334155;">Dear <strong>${recipientDept}</strong>,</p>
    <p style="margin: 0 0 20px; color: #334155;">A new civic issue has been reported in your jurisdiction and requires your attention:</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; width: 120px; color: #475569;">Issue</td><td style="padding: 8px 12px; color: #1e293b;">${issue.title}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Category</td><td style="padding: 8px 12px; color: #1e293b;">${issue.category}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Urgency</td><td style="padding: 8px 12px; color: #1e293b;">${issue.urgency}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Location</td><td style="padding: 8px 12px; color: #1e293b;">${issue.address || 'See map link below'}</td></tr>
      <tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Reported</td><td style="padding: 8px 12px; color: #1e293b;">${date}</td></tr>
      ${issue.description ? `<tr><td style="padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569;">Details</td><td style="padding: 8px 12px; color: #1e293b;">${issue.description}</td></tr>` : ''}
    </table>
    <div style="margin-bottom: 16px;">
      <a href="${issueUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Issue Details</a>
      <a href="${mapUrl}" style="display: inline-block; background: #059669; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-left: 8px;">View on Map</a>
    </div>
    <p style="margin: 24px 0 0; color: #64748b; font-size: 13px;">
      Reported by ${senderName} via <a href="${APP_URL}" style="color: #3b82f6;">interns.city</a>
    </p>
  </div>
</div>`.trim();
}

export async function POST(request: NextRequest) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { issueId, lng, lat, category, address } = await request.json();

    if (!issueId || lng == null || lat == null || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    const fromEmail = getFromEmail(issue.address);
    const emailSubject = `Civic Issue Report: ${issue.title} — ${issue.address || 'Location on map'}`;

    const recipients: { email: string; dept: string }[] = [];

    // 1. Department authority (based on location + category)
    const city = getAuthoritiesForLocation(lng, lat);
    const authority = getAuthorityForCategory(city, category as Category);
    if (authority?.email) {
      recipients.push({ email: authority.email, dept: authority.department });
    }

    // 2. District Magistrate / Collector (based on reverse geocode)
    const geo = await reverseGeocodeDistrict(lat, lng);
    if (geo) {
      const dm = buildDistrictAuthority(geo.district, geo.state);
      if (dm.email) {
        // Avoid duplicate if same email as department
        if (!recipients.some(r => r.email === dm.email)) {
          recipients.push({ email: dm.email, dept: `${dm.title}, ${dm.district}` });
        }
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No authority emails found for this location' });
    }

    // Send emails to all recipients
    let sentCount = 0;
    for (const recipient of recipients) {
      try {
        const htmlBody = buildEmailHtml(issue, recipient.dept, senderName, issueId, lat, lng);

        const command = new SendEmailCommand({
          Source: `interns.city <${fromEmail}>`,
          Destination: { ToAddresses: [recipient.email] },
          Message: {
            Subject: { Data: emailSubject, Charset: 'UTF-8' },
            Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } },
          },
        });

        await ses.send(command);

        // Record in DB
        await supabase.from('authority_emails').insert({
          issue_id: issueId,
          sender_id: user.id,
          recipient_email: recipient.email,
          recipient_dept: recipient.dept,
          subject: emailSubject,
          body: htmlBody,
          status: 'sent',
        });

        sentCount++;
      } catch (err) {
        console.error(`Failed to email ${recipient.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent: sentCount, total: recipients.length });
  } catch (err: unknown) {
    console.error('Auto-notify error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
