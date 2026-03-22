-- ============================================================
-- RWA Society Module — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ---- SOCIETIES ----
CREATE TABLE societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  city TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  map_zoom INTEGER DEFAULT 17,
  boundary JSONB, -- GeoJSON polygon coordinates
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX societies_slug_idx ON societies (slug);
CREATE UNIQUE INDEX societies_invite_code_idx ON societies (invite_code);

ALTER TABLE societies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active societies" ON societies
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can create societies" ON societies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NOTE: UPDATE policy for societies is defined after society_members table

-- ---- SOCIETY MEMBERS ----
CREATE TABLE society_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'rwa_staff', 'rwa_management')),
  unit_number TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (society_id, user_id)
);

CREATE INDEX society_members_society_idx ON society_members (society_id);
CREATE INDEX society_members_user_idx ON society_members (user_id);

ALTER TABLE society_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view society members" ON society_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM society_members sm
      WHERE sm.society_id = society_members.society_id AND sm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can join societies" ON society_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "RWA management can update members" ON society_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM society_members sm
      WHERE sm.society_id = society_members.society_id
      AND sm.user_id = auth.uid() AND sm.role = 'rwa_management'
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can leave or management can remove" ON society_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM society_members sm
      WHERE sm.society_id = society_members.society_id
      AND sm.user_id = auth.uid() AND sm.role = 'rwa_management'
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Deferred policy: societies UPDATE (needs society_members)
CREATE POLICY "Society managers or admins can update" ON societies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM society_members
      WHERE society_id = societies.id AND user_id = auth.uid() AND role = 'rwa_management'
    )
  );

-- ---- SOCIETY ISSUES ----
CREATE TABLE society_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 280),
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'plumbing', 'electrical', 'elevator', 'parking', 'security',
    'cleaning', 'garden', 'common_area', 'noise', 'other'
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

CREATE INDEX society_issues_society_idx ON society_issues (society_id);
CREATE INDEX society_issues_location_idx ON society_issues USING GIST (location);
CREATE INDEX society_issues_category_idx ON society_issues (category);
CREATE INDEX society_issues_status_idx ON society_issues (status);
CREATE INDEX society_issues_created_idx ON society_issues (created_at DESC);

ALTER TABLE society_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Society members can view issues" ON society_issues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM society_members WHERE society_id = society_issues.society_id AND user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can create issues" ON society_issues
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM society_members WHERE society_id = society_issues.society_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own issues" ON society_issues
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Staff can update any issue" ON society_issues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM society_members
      WHERE society_id = society_issues.society_id AND user_id = auth.uid()
      AND role IN ('rwa_staff', 'rwa_management')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authors or management can delete issues" ON society_issues
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM society_members
      WHERE society_id = society_issues.society_id AND user_id = auth.uid()
      AND role = 'rwa_management'
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- SOCIETY COMMENTS ----
CREATE TABLE society_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES society_issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX society_comments_issue_idx ON society_comments (issue_id, created_at);

ALTER TABLE society_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comments" ON society_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM society_issues si
      JOIN society_members sm ON sm.society_id = si.society_id
      WHERE si.id = society_comments.issue_id AND sm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can create comments" ON society_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM society_issues si
      JOIN society_members sm ON sm.society_id = si.society_id
      WHERE si.id = society_comments.issue_id AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own comments" ON society_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments" ON society_comments
  FOR DELETE USING (auth.uid() = author_id);

-- ---- SOCIETY COMMENT REACTIONS ----
CREATE TABLE society_comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES society_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX society_comment_reactions_comment_idx ON society_comment_reactions (comment_id);

ALTER TABLE society_comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reactions" ON society_comment_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM society_comments sc
      JOIN society_issues si ON si.id = sc.issue_id
      JOIN society_members sm ON sm.society_id = si.society_id
      WHERE sc.id = society_comment_reactions.comment_id AND sm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can add reactions" ON society_comment_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON society_comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ---- SOCIETY UPVOTES ----
CREATE TABLE society_upvotes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES society_issues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, issue_id)
);

ALTER TABLE society_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view upvotes" ON society_upvotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM society_issues si
      JOIN society_members sm ON sm.society_id = si.society_id
      WHERE si.id = society_upvotes.issue_id AND sm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can upvote" ON society_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvotes" ON society_upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- ---- TRIGGERS ----
CREATE OR REPLACE FUNCTION update_society_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE society_issues SET upvote_count = upvote_count + 1 WHERE id = NEW.issue_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE society_issues SET upvote_count = upvote_count - 1 WHERE id = OLD.issue_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_society_upvote_change
  AFTER INSERT OR DELETE ON society_upvotes
  FOR EACH ROW EXECUTE FUNCTION update_society_upvote_count();

-- ---- FUNCTIONS ----
CREATE OR REPLACE FUNCTION society_issues_in_bounds(
  p_society_id UUID,
  min_lng FLOAT, min_lat FLOAT, max_lng FLOAT, max_lat FLOAT
)
RETURNS TABLE (
  id UUID, society_id UUID, title TEXT, description TEXT, category TEXT,
  urgency TEXT, status TEXT, lng FLOAT, lat FLOAT, address TEXT,
  photo_urls TEXT[], author_id UUID, upvote_count INTEGER,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
  SELECT
    si.id, si.society_id, si.title, si.description, si.category, si.urgency, si.status,
    ST_X(si.location::geometry) AS lng, ST_Y(si.location::geometry) AS lat,
    si.address, si.photo_urls, si.author_id, si.upvote_count, si.created_at, si.updated_at
  FROM society_issues si
  WHERE si.society_id = p_society_id
  AND ST_Intersects(
    si.location,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
  )
  ORDER BY si.created_at DESC
  LIMIT 500;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION society_issue_stats(p_society_id UUID)
RETURNS TABLE (total BIGINT, open_count BIGINT, in_progress_count BIGINT, resolved_count BIGINT) AS $$
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'open') as open_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count
  FROM society_issues
  WHERE society_id = p_society_id;
$$ LANGUAGE sql STABLE;

-- ---- REALTIME ----
ALTER PUBLICATION supabase_realtime ADD TABLE society_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE society_comments;
