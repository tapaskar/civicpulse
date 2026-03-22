import type { Urgency, Status, Profile } from '@/lib/types';

export type SocietyCategory =
  | 'plumbing' | 'electrical' | 'elevator' | 'parking' | 'security'
  | 'cleaning' | 'garden' | 'common_area' | 'noise' | 'other';

export type SocietyRole = 'resident' | 'rwa_staff' | 'rwa_management';

export interface Society {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  location: { type: 'Point'; coordinates: [number, number] };
  map_zoom: number;
  boundary: { type: 'Polygon'; coordinates: number[][][] } | null;
  invite_code: string;
  logo_url: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocietyMember {
  id: string;
  society_id: string;
  user_id: string;
  role: SocietyRole;
  unit_number: string | null;
  joined_at: string;
  profile?: Profile;
}

export interface SocietyIssue {
  id: string;
  society_id: string;
  title: string;
  description: string | null;
  category: SocietyCategory;
  urgency: Urgency;
  status: Status;
  location: { type: 'Point'; coordinates: [number, number] };
  address: string | null;
  photo_urls: string[];
  author_id: string;
  upvote_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface SocietyComment {
  id: string;
  issue_id: string;
  author_id: string;
  text: string;
  is_official: boolean;
  created_at: string;
  author?: Profile;
}
