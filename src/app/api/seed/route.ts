import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SEED_ISSUES } from '@/lib/seedData';

export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const issuesToInsert = SEED_ISSUES.map(issue => ({
    title: issue.title,
    description: issue.description,
    category: issue.category,
    urgency: issue.urgency,
    status: issue.status,
    location: `POINT(${issue.lng} ${issue.lat})`,
    address: issue.address,
    photo_urls: [],
    author_id: user.id,
  }));

  const { data, error } = await supabase
    .from('issues')
    .insert(issuesToInsert)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${data.length} issues`, count: data.length });
}
