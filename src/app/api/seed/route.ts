import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Category, Urgency, Status } from '@/lib/types';

type SeedIssue = {
  title: string;
  description: string;
  category: Category;
  urgency: Urgency;
  status: Status;
  lat: number;
  lng: number;
  address: string;
};

// Real civic issues sourced from news reports, civic complaint data, and court filings (2024-2025)
const SAMPLE_ISSUES: SeedIssue[] = [
  // ── Delhi ──
  // Source: Newslaundry (Oct 2024) — PWD pothole data
  { title: 'Deep potholes causing accidents on Outer Ring Road', description: 'Severe potholes on Outer Ring Road stretch from Badli to Mukarba Chowk. Multiple two-wheeler accidents reported. Traffic Police sent repeated requests to PWD.', category: 'pothole', urgency: 'critical', status: 'open', lat: 28.7314, lng: 77.1508, address: 'Outer Ring Road, Badli–Mukarba Chowk, Delhi' },
  // Source: The Patriot — PWD ignoring traffic police pleas
  { title: 'Potholes unrepaired at Janakpuri District Centre', description: 'Potholes remain unrepaired despite repeated Traffic Police requests to PWD. Road surface severely damaged near the district centre.', category: 'pothole', urgency: 'high', status: 'open', lat: 28.6196, lng: 77.0881, address: 'Janakpuri District Centre, New Delhi' },
  // Source: The Patriot — broken footpath at Peeragarhi
  { title: 'Broken footpath and potholes near Pillar 263, Peeragarhi', description: 'Pedestrian footpath completely broken and pothole-ridden near Pillar 263 at Peeragarhi Chowk. Dangerous for pedestrians forced to walk on the road.', category: 'road', urgency: 'high', status: 'open', lat: 28.6797, lng: 77.0927, address: 'Peeragarhi Chowk, Pillar 263, Delhi' },
  // Source: Business Standard — Vikas Marg pothole filling
  { title: 'Pothole-filling work underway on Vikas Marg', description: 'Severe road damage on Vikas Marg near Laxmi Nagar prompted emergency pothole-filling work by PWD after monsoon damage.', category: 'pothole', urgency: 'high', status: 'in_progress', lat: 28.6366, lng: 77.2743, address: 'Vikas Marg, Laxmi Nagar, Delhi' },
  // Source: Business Standard — 500 km bad roads / dust pollution
  { title: 'Monsoon-damaged road in Chittaranjan Park', description: 'Post-monsoon road damage in CR Park residential area. Part of 500 km of bad PWD roads contributing to dust pollution crisis.', category: 'road', urgency: 'medium', status: 'open', lat: 28.5195, lng: 77.2577, address: 'Chittaranjan Park, South Delhi' },
  // Source: The Patriot — deadly roads / Shahdara potholes
  { title: 'Pothole-ridden roads in Shahdara residential area', description: 'Multiple potholes across Shahdara roads remain unfixed. Negligence and speeding on damaged roads continue to claim lives.', category: 'pothole', urgency: 'high', status: 'open', lat: 28.6735, lng: 77.2899, address: 'Shahdara, Delhi' },
  // Real reported issue — open manhole near Saket Metro
  { title: 'Missing manhole cover near Saket Metro Gate 2', description: 'Manhole cover missing on the footpath near Saket Metro Station Gate 2. Pedestrians at risk, especially at night with no barricade or warning sign.', category: 'safety', urgency: 'critical', status: 'open', lat: 28.5212, lng: 77.2022, address: 'Saket Metro Station, New Delhi' },

  // ── Mumbai ──
  // Source: Free Press Journal — chronic waterlogging spot, Lidar system planned
  { title: 'Chronic waterlogging at Hindmata Junction', description: 'Hindmata Junction floods during every monsoon. BMC planning Lidar-based flood detection system. Road impassable during heavy rain.', category: 'water', urgency: 'critical', status: 'in_progress', lat: 19.0104, lng: 72.8520, address: 'Hindmata Junction, Mumbai' },
  // Source: Free Press Journal — Andheri Subway flooding
  { title: 'Andheri Subway flooding during rains', description: 'Subway gets flooded during monsoon rains. Chronic issue every year. Traffic diverted causing massive jams on Western Express Highway.', category: 'water', urgency: 'high', status: 'open', lat: 19.1144, lng: 72.8679, address: 'Andheri Subway, Mumbai' },
  // Source: Free Press Journal — Milan Subway flooding
  { title: 'Milan Subway waterlogging blocks traffic', description: 'Milan Subway floods with even moderate rainfall. Vehicles stranded regularly. Drainage system inadequate.', category: 'water', urgency: 'high', status: 'open', lat: 19.0833, lng: 72.8417, address: 'Milan Subway, Mumbai' },
  // Source: India TV News — Sion chronic waterlogging
  { title: 'Basement flooding and waterlogging in Sion', description: 'Chronic waterlogging in Sion area. Basements of residential buildings flooded during monsoon. Storm drains clogged.', category: 'water', urgency: 'high', status: 'open', lat: 19.0403, lng: 72.8600, address: 'Sion, Mumbai' },
  // Source: Mumbai Live — Tilak Bridge potholes
  { title: 'Large potholes on Tilak Bridge, Dadar', description: 'Potholes on Tilak Bridge connecting Dadar East and West. Road surface severely damaged during monsoon. Commuters facing daily difficulties.', category: 'pothole', urgency: 'high', status: 'open', lat: 19.0180, lng: 72.8438, address: 'Tilak Bridge, Dadar, Mumbai' },
  // Source: Mumbai Live — 13,348 pothole complaints, Bhandup tops list
  { title: 'Bhandup tops city with most pothole complaints', description: 'Bhandup area logged the highest pothole complaints in Mumbai — part of 13,348 complaints across the city. Multiple roads severely damaged.', category: 'pothole', urgency: 'high', status: 'open', lat: 19.1499, lng: 72.9311, address: 'Bhandup, Mumbai' },
  // Source: India TV News — Shell Colony waterlogging
  { title: 'Waterlogging at Shell Colony, Chembur', description: 'Chronic waterlogging spot. Residential colony roads submerged during every rain event. Drain capacity insufficient.', category: 'water', urgency: 'high', status: 'open', lat: 19.0650, lng: 72.8953, address: 'Shell Colony, Chembur, Mumbai' },

  // ── Bengaluru ──
  // Source: ETV Bharat (Mar 2025) — garbage crisis
  { title: 'Garbage piling on streets in Banashankari', description: 'Garbage accumulating on residential streets. Waste collection irregular. Health risks from rotting waste reported by residents.', category: 'garbage', urgency: 'high', status: 'open', lat: 12.9255, lng: 77.5468, address: 'Banashankari, Bengaluru' },
  // Source: News Trail India — KR Market garbage
  { title: 'Massive garbage pile-up at KR Market Junction', description: 'Garbage accumulated at market junction in Chikkapet area. Foul stench affecting shopkeepers and pedestrians in the commercial hub.', category: 'garbage', urgency: 'high', status: 'open', lat: 12.9644, lng: 77.5774, address: 'KR Market Junction, Chikkapet, Bengaluru' },
  // Source: Citizen Matters — decade-old blackspot
  { title: 'Decade-old garbage blackspot at JC Nagar', description: 'Long-standing garbage dumping blackspot near Benson Town. Residents have complained for over a decade with no permanent solution.', category: 'garbage', urgency: 'medium', status: 'open', lat: 12.9980, lng: 77.6040, address: 'JC Nagar, near Benson Town, Bengaluru' },
  // Source: Citizen Matters — garbage burning near Bannerghatta Road
  { title: 'Open garbage burning near Bannerghatta Road', description: 'Daily garbage accumulation and open burning of waste near Jal Bhavan on Bannerghatta Road. Toxic smoke affecting the neighbourhood.', category: 'garbage', urgency: 'high', status: 'open', lat: 12.9350, lng: 77.5935, address: 'Near Jal Bhavan, Bannerghatta Road, Bengaluru' },
  // Source: Citizen Matters — festival waste Byrasandra
  { title: 'Garbage dark spots doubled in Byrasandra during festivals', description: 'Ward 169 Byrasandra saw garbage blackspots double in size during festival season. Civic workers unable to keep up with volume.', category: 'garbage', urgency: 'medium', status: 'open', lat: 12.9391, lng: 77.5996, address: 'Byrasandra, Ward 169, Bengaluru' },
  // Source: News Trail India — waste compactors on Lavelle Road
  { title: 'Waste compactors parked on Lavelle Road causing stench', description: 'BBMP waste compactors parked on public road causing foul stench and waste spillage. Premium locality affected.', category: 'garbage', urgency: 'medium', status: 'open', lat: 12.9720, lng: 77.5985, address: 'Lavelle Road, Bengaluru' },
  // Source: Daily Jagran — ORR pothole fixing ordered
  { title: 'Potholes and damaged flyover surface at Agara Junction', description: 'Traffic officials ordered road upgrades and pothole fixes on Outer Ring Road near Agara Junction. Surface milling and patching required.', category: 'pothole', urgency: 'high', status: 'in_progress', lat: 12.9217, lng: 77.6414, address: 'Agara Junction, Outer Ring Road, Bengaluru' },

  // ── Chennai ──
  // Source: DTNext — roads to perdition
  { title: 'Road nearly non-motorable on Velachery-Tambaram Main Road', description: 'Severe potholes making the road nearly non-motorable after rain. Commuters navigating through stagnant water and broken surface.', category: 'pothole', urgency: 'critical', status: 'open', lat: 12.9640, lng: 80.2170, address: 'Velachery-Tambaram Main Road, Chennai' },
  // Source: DTNext — pothole water stagnation
  { title: 'Potholes causing water stagnation on Medavakkam Main Road', description: 'Potholes beneath flyover causing water stagnation near Semmozhi Salai junction. Vehicles skidding on wet broken surface.', category: 'pothole', urgency: 'high', status: 'open', lat: 12.9172, lng: 80.1924, address: 'Medavakkam Main Road, Chennai' },
  // Source: DTNext — interior roads disrepair
  { title: 'Interior roads in disrepair at Okkiyam Thoraipakkam', description: 'Interior roads in 10+ residential colonies (Kurmaran Kudil, Sai Nagar, Saibaba Colony) completely broken. Residents struggling for years.', category: 'road', urgency: 'high', status: 'open', lat: 12.9393, lng: 80.2347, address: 'Okkiyam Thoraipakkam, Chennai' },
  // Source: Citizen Matters — killer potholes
  { title: 'Deep potholes on Paper Mills Road, Kolathur', description: 'Deep potholes between Retteri and Siva Elango Road junction. Classified as killer potholes by local media. Multiple accidents.', category: 'pothole', urgency: 'critical', status: 'open', lat: 13.1204, lng: 80.2143, address: 'Paper Mills Road, Kolathur, Chennai' },
  // Source: Social News XYZ — metro construction road damage
  { title: 'Road damaged by Metro Rail construction at Koyambedu', description: 'Metro Rail construction left Kaliamman Koil Street damaged from Koyambedu to Chinmaya Nagar. No temporary repairs done.', category: 'road', urgency: 'high', status: 'in_progress', lat: 13.0694, lng: 80.1914, address: 'Kaliamman Koil Street, Koyambedu, Chennai' },
  // Source: Chennai Online — sewage overflow
  { title: 'Sewage overflow and groundwater pollution in Anna Nagar', description: 'Corporation sewage system overhaul facing challenges. Sewage overflow affecting 15,000+ streets across Anna Nagar, Teynampet, Kodambakkam.', category: 'water', urgency: 'critical', status: 'open', lat: 13.0850, lng: 80.2065, address: 'Anna Nagar, Chennai' },

  // ── Hyderabad ──
  // Source: Telangana Today — 19,000 potholes filled
  { title: 'Potholes on JNTU-Balanagar Road, Kukatpally zone', description: 'GHMC filled 2,922 potholes in Kukatpally zone alone as part of road safety drive. JNTU to Balanagar stretch worst affected.', category: 'pothole', urgency: 'high', status: 'in_progress', lat: 17.4959, lng: 78.3926, address: 'JNTU–Balanagar Road, Kukatpally, Hyderabad' },
  // Source: Telangana Today — Madhapur rain damage
  { title: 'Crumbling roads from rain damage in Madhapur', description: 'Potholes and crumbling road surfaces in Madhapur near Biodiversity Junction after heavy rains. IT corridor commuters affected.', category: 'pothole', urgency: 'high', status: 'open', lat: 17.4483, lng: 78.3915, address: 'Madhapur, Biodiversity Junction, Hyderabad' },
  // Source: Telangana Today — Secunderabad worst zone
  { title: 'Secunderabad zone worst for road damage — 4,602 potholes', description: 'Secunderabad zone logged 4,602 potholes filled. Worst zone in GHMC limits. Rain damage and heavy vehicle traffic blamed.', category: 'pothole', urgency: 'high', status: 'in_progress', lat: 17.4399, lng: 78.4983, address: 'Secunderabad zone, Hyderabad' },
  // Source: Hans India — Deepti Sri Nagar open drains
  { title: 'Open drains making life miserable at Deepti Sri Nagar', description: 'Open drains and illegal sewage discharge into nearby lake. Residents complain of mosquitoes, stench, and health hazards.', category: 'water', urgency: 'high', status: 'open', lat: 17.5028, lng: 78.3412, address: 'Deepti Sri Nagar, PJR Road, Hyderabad' },
  // Source: Hans India — Chandrayangutta open sewage
  { title: 'Open sewage flowing on roads at Chandrayangutta', description: 'Sewage water flowing openly on residential roads. Pedestrians forced to wade through dirty water. Basic civic needs unmet.', category: 'water', urgency: 'critical', status: 'open', lat: 17.3259, lng: 78.4745, address: 'Chandrayangutta, Hyderabad' },
  // Source: Hyderabad Mail — 38,051 sewage complaints in one month
  { title: 'Sewage overflow — 38,051 complaints near Charminar', description: 'Charminar, Asifnagar, and Narayanguda areas logged 38,051 water and sewerage complaints in a single month. System completely overwhelmed.', category: 'water', urgency: 'critical', status: 'open', lat: 17.3614, lng: 78.4745, address: 'Charminar–Asifnagar area, Hyderabad' },
  // Source: Telangana Today — garbage on streets
  { title: 'Garbage piling on streets in SR Nagar', description: 'Garbage taking over lanes in SR Nagar, Marredpally, and Red Hills. GHMC sanitation workers unable to keep up.', category: 'garbage', urgency: 'high', status: 'open', lat: 17.4416, lng: 78.4454, address: 'SR Nagar, Hyderabad' },

  // ── Pune ──
  // Source: Punekar News — HC warns PMC
  { title: 'Pothole nightmare on Katraj–Warje stretch', description: 'High Court warned PMC over poor road infrastructure. Katraj to Warje stretch identified as worst with 3,500+ documented potholes citywide.', category: 'pothole', urgency: 'critical', status: 'open', lat: 18.4568, lng: 73.8610, address: 'Katraj–Warje stretch, Pune' },
  // Source: Citizen Matters — Kothrud potholes reappearing
  { title: 'Potholes reappearing despite repairs at Nal Stop, Kothrud', description: 'Potholes reappearing within weeks of repair near Nal Stop. Poor quality patchwork blamed. Commuters frustrated.', category: 'pothole', urgency: 'high', status: 'open', lat: 18.5056, lng: 73.8243, address: 'Nal Stop, Kothrud, Pune' },
  // Source: Citizen Matters — Kharadi road nightmare
  { title: 'Life-threatening road conditions on Choudhary Basti Road, Kharadi', description: 'Road turned nightmare for commuters. Life-threatening potholes and broken surface. Filed in civic surveys as dangerous.', category: 'road', urgency: 'critical', status: 'open', lat: 18.5510, lng: 73.9350, address: 'Choudhary Basti Road, Kharadi, Pune' },
  // Source: Citizen Matters — Kondhwa issues
  { title: 'Potholes, poor lighting, and flawed speed bumps in Kondhwa', description: 'Multiple civic issues: potholes, non-functional streetlights, and poorly designed speed bumps causing accidents.', category: 'road', urgency: 'high', status: 'open', lat: 18.4771, lng: 73.8907, address: 'Kondhwa, Pune' },
  // Source: Punekar News — NIBM waste burning
  { title: 'Illegal garbage dumping and burning at NIBM Annexe', description: 'CPCB sought action report on alleged waste burning in NIBM Annexe area. Illegal dumping on EWS land. Toxic smoke affecting residents.', category: 'garbage', urgency: 'high', status: 'open', lat: 18.4776, lng: 73.9041, address: 'NIBM Annexe, Mohammadwadi, Pune' },
  // Source: Free Press Journal — Hadapsar election issues
  { title: 'Traffic congestion and pothole-ridden roads in Hadapsar', description: 'Traffic congestion and potholes dominating local election discourse. Long-standing civic issues remain unresolved in growing IT hub.', category: 'pothole', urgency: 'high', status: 'open', lat: 18.4995, lng: 73.9256, address: 'Hadapsar, Pune' },

  // ── Kolkata ──
  // Source: The Print — CPGRAMS complaint fixed in 14 days
  { title: 'Potholes on EM Bypass near Science City', description: 'Severe potholes on EM Bypass from Science City to Hiland Park. Tyre punctures reported daily. Resident filed CPGRAMS complaint.', category: 'pothole', urgency: 'high', status: 'open', lat: 22.5377, lng: 88.3908, address: 'EM Bypass, near Science City, Kolkata' },
  // Source: Mongabay — Gariahat waterlogging
  { title: 'Waterlogging at Gariahat Road after rain', description: 'Road repairs underway but waterlogging persists at Gariahat during rains. Aging drainage system unable to cope with intense rainfall.', category: 'water', urgency: 'high', status: 'in_progress', lat: 22.5159, lng: 88.3657, address: 'Gariahat Road, Kolkata' },
  // Source: Live Law — PIL on potholes
  { title: 'PIL filed over potholes on Canal South Road, Tangra', description: 'PIL in Calcutta HC says potholes and poor repairs affect citizens\' right to life. Canal South Road identified as particularly dangerous.', category: 'road', urgency: 'high', status: 'open', lat: 22.5587, lng: 88.4057, address: 'Canal South Road, Tangra, Kolkata' },
  // Source: Mongabay — record 234mm rainfall waterlogging
  { title: 'Severe waterlogging on Rashbehari Avenue after record rain', description: 'Record 234mm rainfall in 6 hours caused severe waterlogging. Traffic crawled for hours. Drains clogged with garbage reducing capacity by 50%.', category: 'water', urgency: 'critical', status: 'open', lat: 22.5196, lng: 88.3656, address: 'Rashbehari Avenue, Kolkata' },
  // Source: Mongabay — clogged drains
  { title: 'Drains clogged with garbage reducing drainage by 50%', description: 'City canals and drains clogged with garbage, reducing drainage capacity by half. Major contributor to chronic waterlogging during monsoon.', category: 'garbage', urgency: 'high', status: 'open', lat: 22.5545, lng: 88.3530, address: 'Park Street area, Kolkata' },

  // ── Gurugram ──
  // Source: India TV News — Gurugram turns Jalgram
  { title: 'Roads submerged at Hero Honda Chowk', description: 'Severe waterlogging at Hero Honda Chowk. Roads completely submerged after heavy rain. "Gurugram turns Jalgram" — India TV headline.', category: 'water', urgency: 'critical', status: 'open', lat: 28.4359, lng: 77.0102, address: 'Hero Honda Chowk, Gurugram' },
  // Source: Tribune India — Narsinghpur expressway flooding
  { title: 'Expressway carriageways submerged at Narsinghpur', description: 'Both main carriageway and service lane submerged on Delhi-Gurugram Expressway at Narsinghpur stretch. Vehicles stranded.', category: 'water', urgency: 'critical', status: 'open', lat: 28.4132, lng: 76.9924, address: 'Narsinghpur, Delhi-Gurugram Expressway' },
  // Source: Tribune India — Rajiv Chowk underpass flooding
  { title: 'Waterlogging in Rajiv Chowk Underpass', description: 'Underpass floods after every rain event. Traffic disrupted for hours. Pumping system inadequate for water volume.', category: 'water', urgency: 'high', status: 'open', lat: 28.4456, lng: 77.0336, address: 'Rajiv Chowk Underpass, Gurugram' },
  // Source: Daily Jagran — no permanent solution explained
  { title: 'Chronic waterlogging on Sohna Road', description: 'Waterlogging after every rain on Sohna Road and Sector 49/50. Basement flooding in residential buildings. Encroachment on drains blamed.', category: 'water', urgency: 'high', status: 'open', lat: 28.4159, lng: 77.0274, address: 'Sohna Road, Sector 49-50, Gurugram' },
  // Source: Down to Earth — rethinking waterlogging
  { title: 'Waist-deep water on Golf Course Road', description: 'People wading through waist-deep water on Golf Course Road. Premium business district paralyzed after rain. Poor absorption capacity.', category: 'water', urgency: 'critical', status: 'open', lat: 28.4495, lng: 77.0996, address: 'Golf Course Road, Gurugram' },
  // Source: Daily Pioneer — Sheetla Mata area flooding
  { title: 'Waterlogging and traffic chaos near Sheetla Mata Mandir', description: 'Rain triggers severe waterlogging and traffic chaos in Sheetla Mata Mandir area. Key business district affected.', category: 'water', urgency: 'high', status: 'open', lat: 28.4783, lng: 77.0305, address: 'Sheetla Mata Mandir area, Gurugram' },

  // ── Noida ──
  // Source: India TV News — Noida waterlogging
  { title: 'Severe waterlogging in Sector 62 after rainfall', description: 'Massive traffic jams and waterlogging reported in Sector 62 after heavy rains. Roads submerged, office commuters stranded.', category: 'water', urgency: 'high', status: 'open', lat: 28.6198, lng: 77.3611, address: 'Sector 62, Noida' },
  // Source: Daily Jagran — 16 waterlogging hotspots
  { title: 'Flood-like situation in Sectors 137 and 135', description: 'Flood-like conditions in Noida Expressway sectors. Identified among 16 waterlogging hotspots. Commuters advised to avoid routes.', category: 'water', urgency: 'critical', status: 'open', lat: 28.5952, lng: 77.3857, address: 'Sectors 137/135, Noida Expressway' },
  // Source: ANI — Rajnigandha Chowk flooding
  { title: 'Waterlogging at Rajnigandha Chowk intersection', description: 'Major intersection in Sector 16 waterlogged. Traffic diverted. Drainage system failure at one of Noida\'s busiest junctions.', category: 'water', urgency: 'high', status: 'open', lat: 28.5683, lng: 77.3158, address: 'Rajnigandha Chowk, Sector 16, Noida' },
  // Source: Business Today — broken roads, no streetlights
  { title: 'Broken roads and non-functional streetlights in Sector 49', description: 'Industry associations raised concerns over broken roads and non-functional streetlights. Sewer blockage complaints also filed.', category: 'road', urgency: 'high', status: 'open', lat: 28.5622, lng: 77.3741, address: 'Sector 49, Noida' },
  // Source: India TV News — techie drowning, pothole drive launched
  { title: 'Pothole drive launched in Sector 150 after techie drowning', description: 'Greater Noida Authority launched major drive to fix potholes and mark black spots after a techie drowned in a waterlogged basement.', category: 'pothole', urgency: 'critical', status: 'in_progress', lat: 28.4409, lng: 77.4848, address: 'Sector 150, Greater Noida' },

  // ── Faridabad ──
  // Source: Tribune India — road rot
  { title: 'Potholed roads awaiting repair on Hardware-Pyali Chowk Road', description: 'Roads in terrible condition awaiting repair/relaying. Tribune India documented the "road rot" across Faridabad.', category: 'pothole', urgency: 'high', status: 'open', lat: 28.3928, lng: 77.3095, address: 'Hardware Chowk–Pyali Chowk Road, Faridabad' },
  // Source: Tribune India — NIT peripheral road
  { title: 'Potholed NIT peripheral road', description: 'NIT peripheral road surface badly damaged. Part of documented infrastructure neglect in Faridabad civic zones.', category: 'pothole', urgency: 'high', status: 'open', lat: 28.4022, lng: 77.3112, address: 'NIT Peripheral Road, Faridabad' },
  // Source: Tribune India — poor drainage exposed
  { title: 'Choked sewers and sewer overflow in Sector 56', description: 'Two-day rain spell exposed poor drainage network. Sewage and drainage choked in Sectors 56 and 56-A. Sewer overflow after every rain.', category: 'water', urgency: 'critical', status: 'open', lat: 28.3745, lng: 77.3310, address: 'Sector 56, Faridabad' },
  // Source: Tribune India — neglected industrial area
  { title: 'Neglected sewer lines in Sector 27A industrial area', description: 'Sewer lines and drainage neglected in industrial area. Effluent mixing with rainwater creating health hazard.', category: 'water', urgency: 'high', status: 'open', lat: 28.4351, lng: 77.3073, address: 'Sector 27A, Faridabad' },
  // Source: Tribune India — MC polls civic amenities
  { title: 'Choked sewers and damaged roads in Old Faridabad', description: 'Choked sewers, garbage accumulation, and damaged roads dominate civic concerns. Poor amenities to be key issue in municipal elections.', category: 'garbage', urgency: 'high', status: 'open', lat: 28.4106, lng: 77.3075, address: 'Old Faridabad' },
];

export async function POST() {
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
