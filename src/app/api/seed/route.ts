import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Category, Urgency, Status } from '@/lib/types';

// Bengaluru area sample issues
const SAMPLE_ISSUES: {
  title: string;
  description: string;
  category: Category;
  urgency: Urgency;
  status: Status;
  lat: number;
  lng: number;
  address: string;
}[] = [
  { title: 'Large pothole on MG Road', description: 'Deep pothole near the MG Road metro station entrance causing traffic hazards.', category: 'pothole', urgency: 'high', status: 'open', lat: 12.9756, lng: 77.6063, address: 'MG Road, Bengaluru' },
  { title: 'Broken streetlight on Church Street', description: 'Streetlight has been out for 2 weeks. Area is very dark at night.', category: 'streetlight', urgency: 'medium', status: 'open', lat: 12.9738, lng: 77.6077, address: 'Church Street, Bengaluru' },
  { title: 'Water leak on Brigade Road', description: 'Water pipe burst near brigade road junction. Water flowing onto the road.', category: 'water', urgency: 'critical', status: 'in_progress', lat: 12.9718, lng: 77.6074, address: 'Brigade Road, Bengaluru' },
  { title: 'Overflowing garbage bin at Lalbagh entrance', description: 'Garbage bin overflowing for 3 days. Causing bad smell and attracting stray animals.', category: 'garbage', urgency: 'high', status: 'open', lat: 12.9507, lng: 77.5848, address: 'Lalbagh, Bengaluru' },
  { title: 'Road crack on Outer Ring Road', description: 'Major crack developing on ORR near Marathahalli bridge. Dangerous for two-wheelers.', category: 'road', urgency: 'high', status: 'open', lat: 12.9563, lng: 77.7009, address: 'Outer Ring Road, Marathahalli' },
  { title: 'Construction noise at night in Koramangala', description: 'Construction work going on past 10 PM in residential area.', category: 'noise', urgency: 'medium', status: 'resolved', lat: 12.9352, lng: 77.6245, address: 'Koramangala, Bengaluru' },
  { title: 'Missing manhole cover on 80 Feet Road', description: 'Manhole cover missing. Very dangerous, especially at night.', category: 'safety', urgency: 'critical', status: 'open', lat: 12.9380, lng: 77.6227, address: '80 Feet Road, Koramangala' },
  { title: 'Pothole near Indiranagar metro', description: 'Multiple potholes on 100 Feet Road near Indiranagar metro station.', category: 'pothole', urgency: 'medium', status: 'in_progress', lat: 12.9784, lng: 77.6408, address: '100 Feet Road, Indiranagar' },
  { title: 'Streetlight flickering on Residency Road', description: 'Streetlight keeps flickering on and off, creating visibility issues.', category: 'streetlight', urgency: 'low', status: 'open', lat: 12.9710, lng: 77.6010, address: 'Residency Road, Bengaluru' },
  { title: 'Garbage dump on JP Nagar sidewalk', description: 'Illegal garbage dumping on the sidewalk near JP Nagar 6th Phase.', category: 'garbage', urgency: 'medium', status: 'open', lat: 12.9100, lng: 77.5855, address: 'JP Nagar 6th Phase, Bengaluru' },
  { title: 'Water logging on Silk Board junction', description: 'Severe waterlogging during rain. Blocked drains causing traffic jams.', category: 'water', urgency: 'high', status: 'open', lat: 12.9177, lng: 77.6234, address: 'Silk Board Junction, Bengaluru' },
  { title: 'Damaged speed breaker in HSR Layout', description: 'Speed breaker partially broken, creating sharp edges that damage vehicles.', category: 'road', urgency: 'medium', status: 'resolved', lat: 12.9116, lng: 77.6474, address: 'HSR Layout, Bengaluru' },
  { title: 'Exposed wiring on electric pole', description: 'Wires hanging low from electric pole near bus stop. Risk of electrocution.', category: 'safety', urgency: 'critical', status: 'in_progress', lat: 12.9850, lng: 77.5533, address: 'Rajajinagar, Bengaluru' },
  { title: 'Pothole cluster on Bellary Road', description: 'Series of potholes near Hebbal flyover causing accidents.', category: 'pothole', urgency: 'high', status: 'open', lat: 12.9990, lng: 77.5868, address: 'Bellary Road, Hebbal' },
  { title: 'Non-functional traffic signal at Jayanagar', description: 'Traffic signal not working at Jayanagar 4th Block junction.', category: 'safety', urgency: 'high', status: 'open', lat: 12.9250, lng: 77.5831, address: 'Jayanagar 4th Block, Bengaluru' },
  { title: 'Overflowing drain in Whitefield', description: 'Storm drain overflowing onto the main road after light rain.', category: 'water', urgency: 'medium', status: 'open', lat: 12.9698, lng: 77.7500, address: 'Whitefield Main Road, Bengaluru' },
  { title: 'Broken park bench in Cubbon Park', description: 'Wooden bench broken. Nails sticking out, could injure someone.', category: 'other', urgency: 'low', status: 'open', lat: 12.9763, lng: 77.5929, address: 'Cubbon Park, Bengaluru' },
  { title: 'Garbage burning near BTM Layout lake', description: 'Someone is regularly burning garbage near the lake. Smoke is hazardous.', category: 'garbage', urgency: 'high', status: 'open', lat: 12.9167, lng: 77.6101, address: 'BTM Layout, Bengaluru' },
  { title: 'Caved-in footpath on CMH Road', description: 'Part of footpath has caved in near CMH Road junction. Pedestrians at risk.', category: 'road', urgency: 'high', status: 'open', lat: 12.9812, lng: 77.6340, address: 'CMH Road, Indiranagar' },
  { title: 'Loud speaker violation in Malleshwaram', description: 'Shop playing loud music beyond permissible hours in residential area.', category: 'noise', urgency: 'low', status: 'resolved', lat: 12.9966, lng: 77.5707, address: 'Malleshwaram, Bengaluru' },
];

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify admin
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

  // Insert sample issues
  const issuesToInsert = SAMPLE_ISSUES.map(issue => ({
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
