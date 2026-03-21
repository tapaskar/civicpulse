'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useIssues } from '@/hooks/useIssues';
import { IssueCard } from '@/components/IssueCard';
import { FilterBar } from '@/components/FilterBar';
import type { Issue, IssueFilters } from '@/lib/types';
import type { MapHandle } from '@/components/Map';
import { useAuth } from '@/hooks/useAuth';

// Lazy-load heavy components that aren't needed on initial render
const IssueDetail = dynamic(() => import('@/components/IssueDetail').then(m => ({ default: m.IssueDetail })));
const ReportModal = dynamic(() => import('@/components/ReportModal').then(m => ({ default: m.ReportModal })));
const AuthModal = dynamic(() => import('@/components/AuthModal').then(m => ({ default: m.AuthModal })));
const AuthorityBadge = dynamic(() => import('@/components/AuthorityBadge').then(m => ({ default: m.AuthorityBadge })));
import { List, MapIcon, Plus, Loader2 } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map').then(m => ({ default: m.Map })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs text-gray-600">Loading map...</span>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { user } = useAuth();
  const [bounds, setBounds] = useState<{
    minLng: number; minLat: number; maxLng: number; maxLat: number;
  } | null>(null);
  const [filters, setFilters] = useState<IssueFilters>({});
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showList, setShowList] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lng: number; lat: number } | null>(null);

  const mapHandleRef = useRef<MapHandle>(null);
  const { issues, loading } = useIssues(bounds, filters);

  const handleLocationSelect = useCallback(
    (loc: { lng: number; lat: number; label: string }) => {
      mapHandleRef.current?.flyTo(loc.lng, loc.lat, 15);
    },
    []
  );

  const handleSearchIssueSelect = useCallback(
    (issue: Issue) => {
      setSelectedIssue(issue);
      setShowList(true);
      const [lng, lat] = issue.location.coordinates;
      if (lng && lat) mapHandleRef.current?.flyTo(lng, lat, 16);
    },
    []
  );

  const handleBoundsChange = useCallback(
    (b: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
      setBounds(b);
      setMapCenter({
        lng: (b.minLng + b.maxLng) / 2,
        lat: (b.minLat + b.maxLat) / 2,
      });
    },
    []
  );

  const handleSelectIssue = useCallback((issue: Issue) => {
    setSelectedIssue(issue);
    setShowList(true);
  }, []);

  const handleMapClick = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      if (!user) {
        setShowAuth(true);
        return;
      }
      setReportCoords({ lat: lngLat.lat, lng: lngLat.lng });
    },
    [user]
  );

  const openReport = useCallback(() => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setReportCoords({ lat: 0, lng: 0 });
  }, [user]);

  // Listen for navbar "Report Issue" button
  useEffect(() => {
    const handler = () => openReport();
    window.addEventListener('open-report-modal', handler);
    return () => window.removeEventListener('open-report-modal', handler);
  }, [openReport]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      {/* Desktop side panel */}
      <div className="hidden md:flex flex-col w-96 bg-gray-950/95 backdrop-blur-sm border-r border-white/5 overflow-hidden">
        {selectedIssue ? (
          <IssueDetail
            issue={selectedIssue}
            onBack={() => setSelectedIssue(null)}
          />
        ) : (
          <>
            <FilterBar
              filters={filters}
              onChange={setFilters}
              issues={issues}
              onIssueSelect={handleSearchIssueSelect}
              onLocationSelect={handleLocationSelect}
            />

            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-xs text-gray-500 font-medium">
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </span>
                ) : (
                  <>{issues.length} issue{issues.length !== 1 ? 's' : ''} in view</>
                )}
              </span>
              {user && (
                <button
                  onClick={openReport}
                  className="flex items-center gap-1.5 text-xs bg-gradient-to-r bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition-all shadow-sm shadow-blue-600/15"
                >
                  <Plus className="w-3 h-3" /> Report
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {issues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  selected={false}
                  onClick={() => setSelectedIssue(issue)}
                />
              ))}
              {!loading && issues.length === 0 && (
                <div className="p-8 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <MapIcon className="w-7 h-7 text-blue-500/50" />
                  </div>
                  <p className="text-sm text-gray-500">No issues found in this area.</p>
                  <p className="text-xs text-gray-600 mt-1">Click on the map to report one!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapHandleRef}
          issues={issues}
          selectedId={selectedIssue?.id}
          onSelectIssue={handleSelectIssue}
          onBoundsChange={handleBoundsChange}
          onMapClick={handleMapClick}
        />

        {/* Authority badge — bottom-left overlay */}
        {mapCenter && (
          <div className="hidden md:block absolute bottom-4 left-4 z-10">
            <AuthorityBadge lng={mapCenter.lng} lat={mapCenter.lat} />
          </div>
        )}

        {/* Mobile toggle */}
        <button
          onClick={() => {
            if (selectedIssue && showList) {
              setSelectedIssue(null);
              setShowList(false);
            } else {
              setShowList(!showList);
            }
          }}
          className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 glass glass-border text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm z-10 transition-all active:scale-95"
        >
          {showList ? (
            <><MapIcon className="w-4 h-4" /> Map</>
          ) : (
            <><List className="w-4 h-4" /> List ({issues.length})</>
          )}
        </button>

        {/* Mobile FAB */}
        {user && !showList && (
          <button
            onClick={openReport}
            className="md:hidden absolute bottom-20 right-4 bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center z-10 transition-all active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {showList && (
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[70vh] overflow-hidden z-20 flex flex-col animate-slide-up shadow-2xl">
          <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mt-3 mb-1" />
          {selectedIssue ? (
            <IssueDetail
              issue={selectedIssue}
              onBack={() => setSelectedIssue(null)}
            />
          ) : (
            <>
              <FilterBar
                filters={filters}
                onChange={setFilters}
                issues={issues}
                onIssueSelect={handleSearchIssueSelect}
                onLocationSelect={handleLocationSelect}
              />
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {issues.map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    selected={false}
                    onClick={() => setSelectedIssue(issue)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Report modal */}
      {reportCoords && (
        <ReportModal
          lat={reportCoords.lat || undefined}
          lng={reportCoords.lng || undefined}
          onClose={() => setReportCoords(null)}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
