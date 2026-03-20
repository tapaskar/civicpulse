'use client';

import { useState, useEffect, useRef } from 'react';
import {
  reverseGeocodeDistrict,
  buildDistrictAuthority,
  type DistrictAuthority,
} from '@/lib/districtAuthority';

/**
 * Hook that reverse-geocodes lat/lng to identify the district and returns
 * the DM/Collector/DC contact info.
 *
 * - Caches results by rounded coordinates (~1 km grid)
 * - Debounces rapid coordinate changes (map panning)
 */
export function useDistrictAuthority(
  lat: number | null | undefined,
  lng: number | null | undefined,
) {
  const [authority, setAuthority] = useState<DistrictAuthority | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, DistrictAuthority>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lat || !lng) {
      setAuthority(null);
      return;
    }

    // Round to ~1 km precision for cache key
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;

    // Check cache first
    const cached = cacheRef.current.get(key);
    if (cached) {
      setAuthority(cached);
      return;
    }

    // Debounce 500ms for map panning
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setLoading(true);
      reverseGeocodeDistrict(lat, lng).then(info => {
        if (info) {
          const auth = buildDistrictAuthority(info.district, info.state);
          cacheRef.current.set(key, auth);
          setAuthority(auth);
        } else {
          setAuthority(null);
        }
        setLoading(false);
      });
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lat, lng]);

  return { authority, loading };
}
