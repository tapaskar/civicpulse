'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSociety } from '@/components/society/SocietyProvider';
import { useAuth } from '@/hooks/useAuth';
import { useSocietyIssues } from '@/hooks/useSocietyIssues';
import { Map, type MapHandle } from '@/components/Map';
import { SocietyIssueCard } from '@/components/society/SocietyIssueCard';
import { SocietyFilterBar } from '@/components/society/SocietyFilterBar';
import { SocietyStatsBar } from '@/components/society/SocietyStatsBar';
import { SocietyReportModal } from '@/components/society/SocietyReportModal';
import { getSocietyCategoryConfig } from '@/lib/society/constants';
import { Plus, Settings, ArrowLeft, Loader2, Users, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Issue } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function SocietyMapPage() {
  const { society, membership, role, loading: socLoading, isStaff } = useSociety();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const supabase = createClient();

  const [bounds, setBounds] = useState<{ minLng: number; minLat: number; maxLng: number; maxLat: number } | null>(null);
  const [filters, setFilters] = useState({ category: '', status: '', urgency: '', search: '' });
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [showReport, setShowReport] = useState(false);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stats, setStats] = useState({ total: 0, open_count: 0, in_progress_count: 0, resolved_count: 0 });
  const [copied, setCopied] = useState(false);

  const { issues, loading: issuesLoading } = useSocietyIssues(
    society?.id ?? null,
    bounds,
    {
      category: filters.category || undefined,
      status: (filters.status as any) || undefined,
      urgency: (filters.urgency as any) || undefined,
      search: filters.search || undefined,
    }
  );

  // Fetch stats
  useEffect(() => {
    if (!society) return;
    supabase.rpc('society_issue_stats', { p_society_id: society.id }).then(({ data }: { data: any }) => {
      if (data?.[0]) setStats(data[0]);
    });
  }, [society?.id, issues.length]);

  const handleBoundsChange = useCallback((b: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
    setBounds(b);
  }, []);

  const handleMapClick = useCallback((lngLat: { lng: number; lat: number }) => {
    if (user && membership) {
      setReportCoords(lngLat);
      setShowReport(true);
    }
  }, [user, membership]);

  const handleSelectIssue = useCallback((issue: Issue) => {
    setSelectedId(issue.id);
    router.push(`/society/${society?.slug}/issue/${issue.id}`);
  }, [society?.slug, router]);

  const handleCopyInvite = () => {
    if (!society) return;
    navigator.clipboard.writeText(`${window.location.origin}/society/join/${society.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (socLoading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!society) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Society not found.
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
        <p>You are not a member of <strong className="text-white">{society.name}</strong>.</p>
        <Link href="/society" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to My Societies
        </Link>
      </div>
    );
  }

  // Convert SocietyIssue[] to Issue[] for the Map component
  const mapIssues: Issue[] = issues.map(i => ({
    ...i,
    author: undefined,
    user_has_upvoted: undefined,
  })) as any;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/society" className="text-gray-400 hover:text-white p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{society.name}</h1>
              {society.address && <p className="text-xs text-gray-500">{society.address}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStaff && (
              <>
                <button
                  onClick={handleCopyInvite}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Invite'}
                </button>
                <Link
                  href={`/society/${society.slug}/manage`}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" /> Manage
                </Link>
              </>
            )}
            <button
              onClick={() => { setReportCoords(null); setShowReport(true); }}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Report
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-gray-800 h-64 md:h-80">
          <Map
            ref={mapRef}
            issues={mapIssues}
            selectedId={selectedId}
            onSelectIssue={handleSelectIssue}
            onBoundsChange={handleBoundsChange}
            onMapClick={handleMapClick}
            getCategoryFn={getSocietyCategoryConfig}
            initialCenter={[society.location.coordinates[0], society.location.coordinates[1]]}
            initialZoom={society.map_zoom}
            photoMarkers
            boundaryGeoJSON={society.boundary ?? undefined}
          />
        </div>

        {/* Stats */}
        <SocietyStatsBar
          open={stats.open_count}
          inProgress={stats.in_progress_count}
          resolved={stats.resolved_count}
          total={stats.total}
        />

        {/* Filters */}
        <SocietyFilterBar
          category={filters.category}
          status={filters.status}
          urgency={filters.urgency}
          search={filters.search}
          onChange={setFilters}
        />

        {/* Issue Grid */}
        {issuesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No issues reported yet</p>
            <p className="text-sm">Click the map or press &ldquo;+ Report&rdquo; to report the first issue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {issues.map(issue => (
              <SocietyIssueCard
                key={issue.id}
                issue={issue}
                isSelected={issue.id === selectedId}
                onClick={() => handleSelectIssue(issue as any)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReport && (
        <SocietyReportModal
          lat={reportCoords?.lat}
          lng={reportCoords?.lng}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
