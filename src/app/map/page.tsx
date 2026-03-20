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
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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
      <div className="hidden md:flex flex-col w-96 bg-gray-900 border-r border-gray-800 overflow-hidden">
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

            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <span className="text-xs text-gray-400">
                {loading ? 'Loading...' : `${issues.length} issues`}
              </span>
              {user && (
                <button
                  onClick={openReport}
                  className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Report
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {issues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  selected={false}
                  onClick={() => setSelectedIssue(issue)}
                />
              ))}
              {!loading && issues.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No issues found in this area.
                  <br />
                  Click on the map to report one!
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
          className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm z-10"
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
            className="md:hidden absolute bottom-20 right-4 bg-emerald-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-10"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {showList && (
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 rounded-t-2xl max-h-[70vh] overflow-hidden z-20 flex flex-col">
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mt-2 mb-1" />
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
              <div className="flex-1 overflow-y-auto">
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
