import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import IssuePageClient from './IssuePageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: issue } = await (supabase as any)
    .from('issues')
    .select('title, description, category, address, photo_urls, status, urgency')
    .eq('id', id)
    .single();

  if (!issue) {
    return { title: 'Issue Not Found' };
  }

  const location = issue.address || 'India';
  const title = `${issue.title} — ${location}`;
  const description = issue.description
    ? issue.description.slice(0, 160)
    : `${issue.category} issue reported at ${location}. Status: ${issue.status}. Urgency: ${issue.urgency}.`;

  const ogImage = issue.photo_urls?.length > 0 ? issue.photo_urls[0] : '/opengraph-image';

  return {
    title,
    description,
    alternates: { canonical: `/issue/${id}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://interns.city/issue/${id}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: issue.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: issue.title,
      description,
      images: [ogImage],
    },
  };
}

export default function IssueDetailPage() {
  return <IssuePageClient />;
}
