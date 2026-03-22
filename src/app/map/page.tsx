'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useIssues } from '@/hooks/useIssues';
import { IssueCard } from '@/components/IssueCard';
import { FilterBar } from '@/components/FilterBar';
import type { Issue, IssueFilters } from '@/lib/types';
import type { MapHandle } from '@/components/Map';
import { useAuth } from '@/hooks/useAuth';
import { useCityStats } from '@/hooks/useCityStats';
import { CITY_CENTERS } from '@/lib/authorities';

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
  const { stats: cityStats } = useCityStats();

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
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* City stats bar */}
      {cityStats.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900/95 border-b border-gray-700/50 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider whitespace-nowrap mr-1">Cities</span>
          {cityStats.map(s => {
            const center = CITY_CENTERS[s.city];
            return (
              <button
                key={s.city}
                onClick={() => center && mapHandleRef.current?.flyTo(center.lng, center.lat, center.zoom)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 px-2.5 py-1 rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.open_count > 0 ? 'bg-red-400' : 'bg-green-400'}`} />
                {s.city}
                <span className="text-gray-500">{s.total}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      {/* Desktop side panel */}
      <div className="hidden md:flex flex-col w-96 bg-gray-850 border-r border-gray-700 overflow-hidden" style={{ backgroundColor: '#1a2030' }}>
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

            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
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

      </div>

      {/* Mobile bottom bar — always visible */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
        {/* Bottom sheet */}
        {showList && (
          <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700 rounded-t-3xl max-h-[60vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
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

        {/* Fixed toolbar at very bottom */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 border-t border-gray-700">
          <button
            onClick={() => {
              if (selectedIssue && showList) {
                setSelectedIssue(null);
                setShowList(false);
              } else {
                setShowList(!showList);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 py-2.5 rounded-xl transition-colors active:scale-95"
          >
            {showList ? (
              <><MapIcon className="w-4 h-4" /> Show Map</>
            ) : (
              <><List className="w-4 h-4" /> Issues ({issues.length})</>
            )}
          </button>
          {user && (
            <button
              onClick={openReport}
              className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 py-2.5 px-5 rounded-xl transition-colors active:scale-95 shadow-sm shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Report
            </button>
          )}
        </div>
      </div>

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
    </div>
  );
}
