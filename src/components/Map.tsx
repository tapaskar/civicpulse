'use client';

import { useRef, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import maplibregl from 'maplibre-gl';
import ReactMapGL, {
  Marker,
  NavigationControl,
  GeolocateControl,
  type MapRef,
  type ViewStateChangeEvent,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';
import type { Issue } from '@/lib/types';
import { getCategoryConfig } from '@/lib/constants';
import { MAP_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';

interface MapProps {
  issues: Issue[];
  selectedId?: string;
  onSelectIssue: (issue: Issue) => void;
  onBoundsChange: (bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  getCategoryFn?: (cat: string) => { color: string; icon: string; label: string };
  initialCenter?: [number, number];
  initialZoom?: number;
  photoMarkers?: boolean;
  boundaryGeoJSON?: { type: 'Polygon'; coordinates: number[][][] };
}

export interface MapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
}

interface SpiderfyState {
  clusterId: number;
  center: [number, number]; // [lng, lat]
  leaves: Issue[];
}

/** Compute positions in a circle around a center point.
 *  Returns offsets in degrees (good enough at typical zoom levels). */
function spiderfyPositions(
  center: [number, number],
  count: number,
  zoom: number,
): [number, number][] {
  // Radius in degrees — shrink at higher zoom levels
  const baseRadius = 0.0008;
  const radius = baseRadius * Math.pow(2, 14 - Math.min(zoom, 18));
  const positions: [number, number][] = [];
  const angleStep = (2 * Math.PI) / count;
  for (let i = 0; i < count; i++) {
    const angle = angleStep * i - Math.PI / 2;
    positions.push([
      center[0] + radius * Math.cos(angle),
      center[1] + radius * Math.sin(angle),
    ]);
  }
  return positions;
}

export const Map = forwardRef<MapHandle, MapProps>(function Map({
  issues, selectedId, onSelectIssue, onBoundsChange, onMapClick,
  getCategoryFn, initialCenter, initialZoom, photoMarkers, boundaryGeoJSON,
}, ref) {
  const mapRef = useRef<MapRef>(null);
  const catFn = getCategoryFn ?? getCategoryConfig;

  useImperativeHandle(ref, () => ({
    flyTo: (lng: number, lat: number, zoom = 15) => {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 });
    },
  }));

  const [viewState, setViewState] = useState({
    longitude: initialCenter?.[0] ?? DEFAULT_CENTER[0],
    latitude: initialCenter?.[1] ?? DEFAULT_CENTER[1],
    zoom: initialZoom ?? DEFAULT_ZOOM,
  });

  // Add boundary layer when map loads
  const addBoundaryLayer = useCallback(() => {
    if (!boundaryGeoJSON) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (map.getSource('society-boundary')) return;
    map.addSource('society-boundary', {
      type: 'geojson',
      data: { type: 'Feature', geometry: boundaryGeoJSON, properties: {} },
    });
    map.addLayer({
      id: 'society-boundary-fill',
      type: 'fill',
      source: 'society-boundary',
      paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.05 },
    });
    map.addLayer({
      id: 'society-boundary-line',
      type: 'line',
      source: 'society-boundary',
      paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [3, 2] },
    });
  }, [boundaryGeoJSON]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [spider, setSpider] = useState<SpiderfyState | null>(null);
  const superclusterRef = useRef(new Supercluster({ radius: 60, maxZoom: 16 }));
  const spiderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitBounds = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const bounds = map.getBounds();
    onBoundsChange({
      minLng: bounds.getWest(),
      minLat: bounds.getSouth(),
      maxLng: bounds.getEast(),
      maxLat: bounds.getNorth(),
    });
  }, [onBoundsChange]);

  const updateClusters = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());
    const rawClusters = superclusterRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );
    setClusters(rawClusters);
  }, []);

  // Rebuild supercluster when issues change
  useEffect(() => {
    const points = issues.map(issue => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: issue.location.coordinates,
      },
      properties: { issue },
    }));
    superclusterRef.current.load(points as any);
    updateClusters();
  }, [issues, updateClusters]);

  // Close spider on zoom/move
  useEffect(() => {
    setSpider(null);
  }, [viewState.zoom]);

  const handleLoad = useCallback(() => {
    emitBounds();
    updateClusters();
    addBoundaryLayer();
  }, [emitBounds, updateClusters, addBoundaryLayer]);

  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      setViewState(e.viewState);
      emitBounds();
      updateClusters();
    },
    [emitBounds, updateClusters]
  );

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
    },
    [onMapClick]
  );

  const handleClusterClick = useCallback(
    (clusterId: number, center: [number, number], e: React.MouseEvent) => {
      e.stopPropagation();

      // If already spiderfied this cluster, close it
      if (spider?.clusterId === clusterId) {
        setSpider(null);
        return;
      }

      // Get leaf issues from the cluster
      const leaves: Issue[] = [];
      try {
        const points = superclusterRef.current.getLeaves(clusterId, 20);
        for (const pt of points) {
          if (pt.properties?.issue) {
            leaves.push(pt.properties.issue);
          }
        }
      } catch {
        // Fallback: zoom in
        const zoom = superclusterRef.current.getClusterExpansionZoom(clusterId);
        mapRef.current?.flyTo({ center, zoom, duration: 500 });
        return;
      }

      if (leaves.length <= 1) {
        const zoom = superclusterRef.current.getClusterExpansionZoom(clusterId);
        mapRef.current?.flyTo({ center, zoom, duration: 500 });
        return;
      }

      setSpider({ clusterId, center, leaves });
    },
    [spider]
  );

  const handleSpiderMouseEnter = useCallback(() => {
    if (spiderTimeoutRef.current) {
      clearTimeout(spiderTimeoutRef.current);
      spiderTimeoutRef.current = null;
    }
  }, []);

  const handleSpiderMouseLeave = useCallback(() => {
    spiderTimeoutRef.current = setTimeout(() => {
      setSpider(null);
    }, 600);
  }, []);

  // Compute spider positions
  const spiderPositions = spider
    ? spiderfyPositions(spider.center, spider.leaves.length, viewState.zoom)
    : [];

  return (
    <ReactMapGL
      ref={mapRef}
      {...viewState}
      onMove={e => setViewState(e.viewState)}
      onMoveEnd={handleMoveEnd}
      onLoad={handleLoad}
      onClick={handleClick}
      mapLib={maplibregl as any}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" trackUserLocation />

      {clusters.map((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;

        if (props.cluster) {
          const count = props.point_count ?? 0;
          const size = 30 + Math.min(count, 100) * 0.3;
          const isSpiderfied = spider?.clusterId === props.cluster_id;

          return (
            <Marker
              key={`cluster-${props.cluster_id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                handleClusterClick(props.cluster_id, [lng, lat], e.originalEvent as unknown as React.MouseEvent);
              }}
            >
              <div
                onMouseEnter={isSpiderfied ? handleSpiderMouseEnter : undefined}
                onMouseLeave={isSpiderfied ? handleSpiderMouseLeave : undefined}
                className={`rounded-full border-2 flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer transition-all ${
                  isSpiderfied
                    ? 'bg-blue-700 border-blue-300 ring-2 ring-blue-400/40'
                    : 'bg-blue-600 border-blue-400 hover:scale-110'
                }`}
                style={{ width: size, height: size }}
              >
                {count}
              </div>
            </Marker>
          );
        }

        // Skip individual markers that are part of the spiderfied cluster
        // (they'll be rendered as spider legs below)
        if (spider) {
          const issue = props.issue;
          if (spider.leaves.some(l => l.id === issue.id)) {
            return null;
          }
        }

        const issue = props.issue;
        const cat = catFn(issue.category);
        const isSelected = issue.id === selectedId;

        return (
          <Marker
            key={issue.id}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              onSelectIssue(issue);
            }}
          >
            <div className="cursor-pointer flex flex-col items-center">
              {photoMarkers && issue.photo_urls?.[0] ? (
                <div
                  className={`rounded-full overflow-hidden border-2 shadow-lg transition-transform ${
                    isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ width: 40, height: 40, borderColor: cat.color }}
                >
                  <img src={issue.photo_urls[0]} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className={`rounded-full flex items-center justify-center text-sm shadow-lg transition-transform ${
                    isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ width: 32, height: 32, backgroundColor: cat.color }}
                >
                  {cat.icon}
                </div>
              )}
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${cat.color}`,
                }}
              />
            </div>
          </Marker>
        );
      })}

      {/* Spider legs — SVG lines + fanned-out markers */}
      {spider && spiderPositions.map((pos, i) => {
        const issue = spider.leaves[i];
        const cat = catFn(issue.category);
        const isSelected = issue.id === selectedId;

        return (
          <div key={`spider-${issue.id}`}>
            {/* Line from center to spider position */}
            <SpiderLine
              from={spider.center}
              to={pos}
              mapRef={mapRef}
              zoom={viewState.zoom}
            />
            {/* Fanned-out marker */}
            <Marker
              longitude={pos[0]}
              latitude={pos[1]}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onSelectIssue(issue);
              }}
            >
              <div
                className="cursor-pointer flex flex-col items-center animate-in fade-in zoom-in-75 duration-200"
                onMouseEnter={handleSpiderMouseEnter}
                onMouseLeave={handleSpiderMouseLeave}
              >
                <div
                  className={`rounded-full flex items-center justify-center text-sm shadow-lg transition-transform ${
                    isSelected ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ width: 32, height: 32, backgroundColor: cat.color }}
                >
                  {cat.icon}
                </div>
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${cat.color}`,
                  }}
                />
              </div>
            </Marker>
          </div>
        );
      })}
    </ReactMapGL>
  );
});

/** Renders an SVG line between two geographic coordinates using the map's projection. */
function SpiderLine({
  from,
  to,
  mapRef,
  zoom,
}: {
  from: [number, number];
  to: [number, number];
  mapRef: React.RefObject<MapRef | null>;
  zoom: number;
}) {
  const map = mapRef.current?.getMap();
  if (!map) return null;

  const fromPx = map.project(from as [number, number]);
  const toPx = map.project(to as [number, number]);

  // Get container dimensions for the SVG overlay
  const container = map.getContainer();
  const w = container.clientWidth;
  const h = container.clientHeight;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: w,
        height: h,
        zIndex: 5,
      }}
    >
      <svg width={w} height={h} className="absolute inset-0">
        <line
          x1={fromPx.x}
          y1={fromPx.y}
          x2={toPx.x}
          y2={toPx.y - 16}
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </svg>
    </div>
  );
}
