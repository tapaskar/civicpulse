-- interns.city Database Schema
-- Run this in Supabase SQL Editor after creating the project

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Profiles (auto-created on signup via trigger)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'official', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Issues
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) <= 280),
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'pothole', 'streetlight', 'water', 'garbage', 'road', 'noise', 'safety', 'traffic', 'accident', 'other'
  )),
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES profiles(id),
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX issues_location_idx ON issues USING GIST (location);
CREATE INDEX issues_category_idx ON issues (category);
CREATE INDEX issues_status_idx ON issues (status);
CREATE INDEX issues_created_idx ON issues (created_at DESC);
CREATE INDEX issues_title_trgm_idx ON issues USING GIN (title gin_trgm_ops);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view issues" ON issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON issues FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own issues" ON issues FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own issues" ON issues FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can delete any issue" ON issues FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
-- Admin/official can update any issue status
CREATE POLICY "Officials can update issue status" ON issues FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('official', 'admin'))
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX comments_issue_idx ON comments (issue_id, created_at);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Comment Reactions (Slack-style emoji reactions)
CREATE TABLE comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX comment_reactions_comment_idx ON comment_reactions (comment_id);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reactions" ON comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Upvotes (unique per user per issue)
CREATE TABLE upvotes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, issue_id)
);

ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view upvotes" ON upvotes FOR SELECT USING (true);
CREATE POLICY "Users can manage own upvotes" ON upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own upvotes" ON upvotes FOR DELETE USING (auth.uid() = user_id);

-- Authority emails log (emails sent to government authorities about issues)
CREATE TABLE authority_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_email TEXT NOT NULL,
  recipient_dept TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX authority_emails_issue_idx ON authority_emails (issue_id);

ALTER TABLE authority_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view authority emails" ON authority_emails FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert authority emails" ON authority_emails FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment/decrement upvote_count via trigger
CREATE OR REPLACE FUNCTION update_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE issues SET upvote_count = upvote_count + 1 WHERE id = NEW.issue_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE issues SET upvote_count = upvote_count - 1 WHERE id = OLD.issue_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_upvote_change
  AFTER INSERT OR DELETE ON upvotes
  FOR EACH ROW EXECUTE FUNCTION update_upvote_count();

-- Function to query issues within map bounds
CREATE OR REPLACE FUNCTION issues_in_bounds(min_lng FLOAT, min_lat FLOAT, max_lng FLOAT, max_lat FLOAT)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT, category TEXT, urgency TEXT, status TEXT,
  lng FLOAT, lat FLOAT, address TEXT, photo_urls TEXT[], author_id UUID,
  upvote_count INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
  SELECT
    i.id, i.title, i.description, i.category, i.urgency, i.status,
    ST_X(i.location::geometry) AS lng, ST_Y(i.location::geometry) AS lat,
    i.address, i.photo_urls, i.author_id, i.upvote_count, i.created_at, i.updated_at
  FROM issues i
  WHERE ST_Intersects(
    i.location,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
  )
  ORDER BY i.created_at DESC
  LIMIT 500;
$$ LANGUAGE sql STABLE;

-- Function to search issues by text
CREATE OR REPLACE FUNCTION search_issues(query TEXT)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT, category TEXT, urgency TEXT, status TEXT,
  lng FLOAT, lat FLOAT, address TEXT, photo_urls TEXT[], author_id UUID,
  upvote_count INTEGER, created_at TIMESTAMPTZ
) AS $$
  SELECT
    i.id, i.title, i.description, i.category, i.urgency, i.status,
    ST_X(i.location::geometry) AS lng, ST_Y(i.location::geometry) AS lat,
    i.address, i.photo_urls, i.author_id, i.upvote_count, i.created_at
  FROM issues i
  WHERE i.title ILIKE '%' || query || '%' OR i.description ILIKE '%' || query || '%'
  ORDER BY i.created_at DESC
  LIMIT 100;
$$ LANGUAGE sql STABLE;

-- Function to get city-wise issue stats using bounding boxes
CREATE OR REPLACE FUNCTION city_issue_stats()
RETURNS TABLE (city TEXT, total BIGINT, open_count BIGINT, resolved_count BIGINT) AS $$
  WITH city_bounds(city, min_lng, min_lat, max_lng, max_lat) AS (
    VALUES
      ('Gurugram'::TEXT, 76.85, 28.35, 77.15, 28.55),
      ('Bangalore', 77.45, 12.85, 77.75, 13.15),
      ('Delhi', 76.84, 28.40, 77.35, 28.88),
      ('Noida', 77.28, 28.45, 77.55, 28.68),
      ('Faridabad', 77.20, 28.30, 77.45, 28.50),
      ('Hyderabad', 78.30, 17.30, 78.60, 17.55),
      ('Chennai', 80.10, 12.90, 80.35, 13.20),
      ('Mumbai', 72.75, 18.85, 73.05, 19.30),
      ('Pune', 73.75, 18.45, 73.95, 18.65),
      ('Kolkata', 88.25, 22.45, 88.45, 22.65)
  )
  SELECT
    cb.city,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE i.status = 'open') as open_count,
    COUNT(*) FILTER (WHERE i.status = 'resolved') as resolved_count
  FROM issues i
  JOIN city_bounds cb ON ST_Intersects(
    i.location,
    ST_MakeEnvelope(cb.min_lng, cb.min_lat, cb.max_lng, cb.max_lat, 4326)::geography
  )
  GROUP BY cb.city
  ORDER BY total DESC;
$$ LANGUAGE sql STABLE;

-- Enable Realtime on issues and comments
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Storage bucket for issue photos
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-photos', 'issue-photos', true);

CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'issue-photos');
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'issue-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (bucket_id = 'issue-photos' AND auth.uid() IS NOT NULL);
