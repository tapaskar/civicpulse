import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const EXPECTED_TOPIC_ARN = process.env.AWS_SNS_INBOUND_TOPIC_ARN;

// Extract issue ID from reply+{issueId}@reply.interns.city
function extractIssueId(recipients: string[]): string | null {
  for (const addr of recipients) {
    const match = addr.match(/reply\+([a-f0-9-]+)@/i);
    if (match) return match[1];
  }
  return null;
}

// Strip quoted content from email reply, keeping only the new reply text
function extractReplyBody(text: string): string {
  const lines = text.split(/\r?\n/);
  const replyLines: string[] = [];

  for (const line of lines) {
    // Stop at common quote markers
    if (/^On .+ wrote:$/i.test(line.trim())) break;
    if (/^-{3,}\s*Original Message\s*-{3,}/i.test(line.trim())) break;
    if (/^From:\s/i.test(line.trim())) break;
    if (/^Sent:\s/i.test(line.trim())) break;
    if (line.trim().startsWith('>')) break;
    replyLines.push(line);
  }

  return replyLines.join('\n').trim();
}

// Parse plain text body from raw MIME email
function extractTextFromRawEmail(raw: string): string {
  // Check for multipart
  const boundaryMatch = raw.match(/boundary="?([^"\s;]+)"?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = raw.split(`--${boundary}`);
    // Find text/plain part
    for (const part of parts) {
      if (/content-type:\s*text\/plain/i.test(part)) {
        const bodyStart = part.indexOf('\r\n\r\n');
        if (bodyStart > -1) {
          let body = part.substring(bodyStart + 4);
          // Remove trailing boundary markers
          const endIdx = body.indexOf(`--${boundary}`);
          if (endIdx > -1) body = body.substring(0, endIdx);
          // Handle quoted-printable
          if (/content-transfer-encoding:\s*quoted-printable/i.test(part)) {
            body = body.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
              String.fromCharCode(parseInt(hex, 16))
            );
          }
          // Handle base64
          if (/content-transfer-encoding:\s*base64/i.test(part)) {
            body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8');
          }
          return body.trim();
        }
      }
    }
  }

  // Single-part email: body after first blank line
  const headerEnd = raw.indexOf('\r\n\r\n');
  if (headerEnd > -1) {
    return raw.substring(headerEnd + 4).trim();
  }
  return raw;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate SNS TopicArn if configured
    if (EXPECTED_TOPIC_ARN && body.TopicArn && body.TopicArn !== EXPECTED_TOPIC_ARN) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 403 });
    }

    // Validate SigningCertURL is from amazonaws.com
    if (body.SigningCertURL) {
      const certUrl = new URL(body.SigningCertURL);
      if (!certUrl.hostname.endsWith('.amazonaws.com')) {
        return NextResponse.json({ error: 'Invalid certificate URL' }, { status: 403 });
      }
    }

    // Handle SNS subscription confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      await fetch(body.SubscribeURL);
      console.log('SNS subscription confirmed for topic:', body.TopicArn);
      return NextResponse.json({ status: 'confirmed' });
    }

    // Handle SNS notification
    if (body.Type === 'Notification') {
      const sesMessage = JSON.parse(body.Message);
      const mail = sesMessage.mail;
      const receipt = sesMessage.receipt;

      // Extract issue ID from recipient address
      const recipients: string[] = receipt?.recipients || mail?.destination || [];
      const issueId = extractIssueId(recipients);

      if (!issueId) {
        console.log('No issue ID in recipients:', recipients);
        return NextResponse.json({ error: 'No issue ID in recipient' }, { status: 400 });
      }

      // Extract sender info
      const fromHeader: string = mail?.commonHeaders?.from?.[0] || mail?.source || '';
      const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/);
      const replyFromName = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, '') : fromHeader;
      const replyFromEmail = fromMatch ? fromMatch[2] : fromHeader;

      // Extract reply body
      let replyText = '';

      if (sesMessage.content) {
        // Raw email content (UTF-8 encoding via SNS)
        const rawEmail = typeof sesMessage.content === 'string' && sesMessage.content.length > 200
          ? sesMessage.content
          : '';
        if (rawEmail) {
          const fullText = extractTextFromRawEmail(rawEmail);
          replyText = extractReplyBody(fullText);
        }
      }

      // Fallback: check if there's a simple text content in the notification
      if (!replyText && mail?.commonHeaders?.subject) {
        replyText = `[Authority replied to this issue — subject: ${mail.commonHeaders.subject}]`;
      }

      if (!replyText.trim()) {
        console.log('Empty reply body for issue:', issueId);
        return NextResponse.json({ error: 'Empty reply' }, { status: 400 });
      }

      // Insert comment using admin client (bypasses RLS)
      const supabase = createAdminClient();

      // Verify issue exists
      const { data: issue } = await (supabase as any)
        .from('issues')
        .select('id')
        .eq('id', issueId)
        .single();

      if (!issue) {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
      }

      const { error: insertError } = await (supabase as any).from('comments').insert({
        issue_id: issueId,
        author_id: null,
        text: replyText,
        is_official: true,
        reply_from_email: replyFromEmail,
        reply_from_name: replyFromName,
      });

      if (insertError) {
        console.error('Failed to insert reply comment:', insertError);
        return NextResponse.json({ error: 'Failed to save reply' }, { status: 500 });
      }

      console.log(`Authority reply saved for issue ${issueId} from ${replyFromEmail}`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown message type' }, { status: 400 });
  } catch (err) {
    console.error('Inbound email error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
