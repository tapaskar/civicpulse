export type Category = 'pothole' | 'streetlight' | 'water' | 'garbage' | 'road' | 'noise' | 'safety' | 'traffic' | 'accident' | 'other';
export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'open' | 'in_progress' | 'resolved';
export type Role = 'citizen' | 'official' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  urgency: Urgency;
  status: Status;
  location: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  address: string | null;
  photo_urls: string[];
  author_id: string;
  upvote_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  user_has_upvoted?: boolean;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  text: string;
  is_official: boolean;
  created_at: string;
  // Joined
  author?: Profile;
}

export type ParamType = 'category' | 'urgency' | 'status';

export interface ParameterVote {
  user_id: string;
  issue_id: string;
  param_type: ParamType;
  param_value: string;
  created_at: string;
}

export interface VoteDistribution {
  param_type: ParamType;
  param_value: string;
  vote_count: number;
}

export interface IssueFilters {
  category?: Category;
  status?: Status;
  urgency?: Urgency;
  search?: string;
  radius_km?: number;
  user_lat?: number;
  user_lng?: number;
}
