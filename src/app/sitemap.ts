import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: 'https://interns.city', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://interns.city/map', lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: 'https://interns.city/report', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: issues } = await supabase
      .from('issues')
      .select('id, updated_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (issues) {
      for (const issue of issues) {
        entries.push({
          url: `https://interns.city/issue/${issue.id}`,
          lastModified: new Date(issue.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {
    // Fallback to static entries if DB is unreachable
  }

  return entries;
}
