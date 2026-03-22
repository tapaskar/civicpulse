import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const body = await request.json();
  const { name, address, city, lat, lng, mapZoom, description } = body;

  if (!name || !lat || !lng) {
    return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Generate invite code
  const invite_code = crypto.randomBytes(6).toString('hex');

  // Use service role to bypass RLS for insert
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Insert society
  const { data: society, error: insertErr } = await adminSupabase
    .from('societies')
    .insert({
      name,
      slug,
      description: description || null,
      address: address || null,
      city: city || null,
      location: `POINT(${lng} ${lat})`,
      map_zoom: mapZoom || 17,
      invite_code,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({ error: 'A society with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Add creator as rwa_management
  await adminSupabase.from('society_members').insert({
    society_id: society.id,
    user_id: user.id,
    role: 'rwa_management',
  });

  return NextResponse.json({
    id: society.id,
    slug: society.slug,
    invite_code: society.invite_code,
  });
}
