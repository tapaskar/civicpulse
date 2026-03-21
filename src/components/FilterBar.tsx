'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CATEGORIES, URGENCY_LEVELS, STATUS_OPTIONS } from '@/lib/constants';
import type { Issue, IssueFilters } from '@/lib/types';
import { Search, X, MapPin, FileText, Loader2 } from 'lucide-react';

interface FilterBarProps {
  filters: IssueFilters;
  onChange: (filters: IssueFilters) => void;
  issues?: Issue[];
  onIssueSelect?: (issue: Issue) => void;
  onLocationSelect?: (lngLat: { lng: number; lat: number; label: string }) => void;
}

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function FilterBar({ filters, onChange, issues = [], onIssueSelect, onLocationSelect }: FilterBarProps) {
  const update = (partial: Partial<IssueFilters>) =>
    onChange({ ...filters, ...partial });

  const hasFilters = filters.category || filters.status || filters.urgency || filters.search;

  const [query, setQuery] = useState(filters.search ?? '');
  const [focused, setFocused] = useState(false);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced geocoding search
  const searchLocations = useCallback(async (q: string) => {
    if (q.length < 3) {
      setLocationResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=4&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: LocationResult[] = await res.json();
      setLocationResults(data);
    } catch {
      setLocationResults([]);
    }
    setSearching(false);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    update({ search: value || undefined });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(value), 400);
  };

  // Issue matches (from already-loaded issues)
  const issueMatches = query.length >= 2
    ? issues.filter(i => i.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  const showDropdown = focused && query.length >= 2 && (issueMatches.length > 0 || locationResults.length > 0 || searching);

  return (
    <div className="p-3 space-y-3 border-b border-white/5">
      {/* Search */}
      <div className="relative" ref={wrapperRef}>
        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-600" />
        <input
          type="text"
          placeholder="Search issues or locations..."
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => setFocused(true)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 outline-none transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              update({ search: undefined });
              setLocationResults([]);
            }}
            className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 glass border border-white/10 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto animate-scale-in custom-scrollbar">
            {/* Issue results */}
            {issueMatches.length > 0 && (
              <div>
                <p className="px-3.5 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  Issues
                </p>
                {issueMatches.map(issue => (
                  <button
                    key={issue.id}
                    onClick={() => {
                      onIssueSelect?.(issue);
                      setFocused(false);
                      setQuery('');
                      update({ search: undefined });
                      setLocationResults([]);
                    }}
                    className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate">{issue.title}</p>
                      {issue.address && (
                        <p className="text-[11px] text-gray-600 truncate">{issue.address}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            {issueMatches.length > 0 && (locationResults.length > 0 || searching) && (
              <div className="border-t border-white/5" />
            )}

            {/* Location results */}
            {(locationResults.length > 0 || searching) && (
              <div>
                <p className="px-3.5 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  Locations
                </p>
                {searching ? (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-gray-600">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                  </div>
                ) : (
                  locationResults.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onLocationSelect?.({
                          lng: parseFloat(loc.lon),
                          lat: parseFloat(loc.lat),
                          label: loc.display_name,
                        });
                        setFocused(false);
                        setQuery('');
                        update({ search: undefined });
                        setLocationResults([]);
                      }}
                      className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-300 line-clamp-2">{loc.display_name}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.category ?? ''}
          onChange={e => update({ category: (e.target.value || undefined) as any })}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400 outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all appearance-none cursor-pointer hover:bg-white/8"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>

        <select
          value={filters.status ?? ''}
          onChange={e => update({ status: (e.target.value || undefined) as any })}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400 outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all appearance-none cursor-pointer hover:bg-white/8"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={filters.urgency ?? ''}
          onChange={e => update({ urgency: (e.target.value || undefined) as any })}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400 outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all appearance-none cursor-pointer hover:bg-white/8"
        >
          <option value="">All Urgency</option>
          {URGENCY_LEVELS.map(u => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              onChange({});
              setQuery('');
              setLocationResults([]);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
