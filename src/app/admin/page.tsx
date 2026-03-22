'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, STATUS_OPTIONS, getCategoryConfig, getStatusConfig, getUrgencyConfig } from '@/lib/constants';
import { parseWkbPoint } from '@/lib/geo';
import type { Issue, Status } from '@/lib/types';
import {
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  MapPin,
  TrendingUp,
  Database,
  Twitter,
  ExternalLink,
  X,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { SEED_ISSUES } from '@/lib/seedData';

export default function AdminPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Status>('in_progress');
  const [updating, setUpdating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Tweet import state
  const [showTweetImport, setShowTweetImport] = useState(false);
  const [tweetUrl, setTweetUrl] = useState('');
  const [tweetLoading, setTweetLoading] = useState(false);
  const [tweetPreview, setTweetPreview] = useState<{
    title: string; category: string; urgency: string; description: string;
    city: string | null; lat: number | null; lng: number | null; address: string | null;
    tweetText: string; tweetAuthor: string; tweetUrl: string;
  } | null>(null);
  const [tweetError, setTweetError] = useState<string | null>(null);
  const [tweetImporting, setTweetImporting] = useState(false);
  const [tweetResult, setTweetResult] = useState<string | null>(null);

  // Society creation state
  const [showCreateSociety, setShowCreateSociety] = useState(false);
  const [societyForm, setSocietyForm] = useState({ name: '', address: '', city: '', lat: '', lng: '', mapZoom: '17', description: '' });
  const [societyCreating, setSocietyCreating] = useState(false);
  const [societyResult, setSocietyResult] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    let query = supabase
      .from('issues')
      .select('*, author:profiles!author_id(*)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data } = await query;
    if (data) {
      const transformed = (data as any[]).map(row => ({
        ...row,
        location: {
          type: 'Point' as const,
          coordinates: typeof row.location === 'string'
            ? parseWkbPoint(row.location) as [number, number]
            : [0, 0] as [number, number],
        },
      }));
      setIssues(transformed as Issue[]);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === issues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(issues.map(i => i.id)));
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const issuesToInsert = SEED_ISSUES.map(issue => ({
        title: issue.title,
        description: issue.description,
        category: issue.category,
        urgency: issue.urgency,
        status: issue.status,
        location: `POINT(${issue.lng} ${issue.lat})`,
        address: issue.address,
        photo_urls: [],
        author_id: user!.id,
      }));

      const { data, error } = await supabase
        .from('issues')
        .insert(issuesToInsert)
        .select('id');

      if (error) {
        setSeedResult(`Error: ${error.message}`);
      } else {
        setSeedResult(`Seeded ${data.length} issues across 10 cities`);
        await fetchIssues();
      }
    } catch (e: unknown) {
      setSeedResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selected.size === 0) return;
    setUpdating(true);
    const ids = Array.from(selected);
    await supabase
      .from('issues')
      .update({ status: bulkStatus, updated_at: new Date().toISOString() })
      .in('id', ids);
    setSelected(new Set());
    await fetchIssues();
    setUpdating(false);
  };

  const handleFetchTweet = async () => {
    if (!tweetUrl.trim()) return;
    setTweetLoading(true);
    setTweetError(null);
    setTweetPreview(null);
    setTweetResult(null);
    try {
      const res = await fetch('/api/import-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetUrl: tweetUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTweetError(data.error || 'Failed to fetch tweet');
      } else {
        setTweetPreview(data);
      }
    } catch {
      setTweetError('Network error');
    } finally {
      setTweetLoading(false);
    }
  };

  const handleImportTweet = async () => {
    if (!tweetPreview || tweetPreview.lat == null || tweetPreview.lng == null) return;
    setTweetImporting(true);
    setTweetResult(null);
    try {
      const { data, error } = await supabase.from('issues').insert({
        title: tweetPreview.title,
        description: `${tweetPreview.description}\n\nSource: ${tweetPreview.tweetUrl}`,
        category: tweetPreview.category,
        urgency: tweetPreview.urgency,
        status: 'open',
        location: `POINT(${tweetPreview.lng} ${tweetPreview.lat})`,
        address: tweetPreview.address,
        photo_urls: [],
        author_id: user!.id,
      }).select('id').single();

      if (error) {
        setTweetResult(`Error: ${error.message}`);
      } else {
        // Fire auto-notify (fire-and-forget)
        fetch('/api/auto-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueId: data.id,
            lat: tweetPreview.lat,
            lng: tweetPreview.lng,
            category: tweetPreview.category,
            address: tweetPreview.address,
          }),
        }).catch(() => {});

        setTweetResult(`Issue imported! ID: ${data.id}`);
        setTweetPreview(null);
        setTweetUrl('');
        await fetchIssues();
      }
    } catch (e: unknown) {
      setTweetResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setTweetImporting(false);
    }
  };

  const handleCreateSociety = async () => {
    if (!societyForm.name.trim() || !societyForm.lat || !societyForm.lng) return;
    setSocietyCreating(true);
    setSocietyResult(null);
    try {
      const res = await fetch('/api/society/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: societyForm.name.trim(),
          address: societyForm.address.trim() || null,
          city: societyForm.city.trim() || null,
          lat: parseFloat(societyForm.lat),
          lng: parseFloat(societyForm.lng),
          mapZoom: parseInt(societyForm.mapZoom) || 17,
          description: societyForm.description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSocietyResult(`Error: ${data.error}`);
      } else {
        const inviteUrl = `${window.location.origin}/society/join/${data.invite_code}`;
        setSocietyResult(`Society created! Invite: ${inviteUrl}`);
        setSocietyForm({ name: '', address: '', city: '', lat: '', lng: '', mapZoom: '17', description: '' });
      }
    } catch {
      setSocietyResult('Error: Network error');
    } finally {
      setSocietyCreating(false);
    }
  };

  // Stats
  const openCount = issues.filter(i => i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  // Category breakdown
  const categoryStats = CATEGORIES.map(c => ({
    ...c,
    count: issues.filter(i => i.category === c.value).length,
  })).sort((a, b) => b.count - a.count);

  if (!user || (profile?.role !== 'admin' && profile?.role !== 'official')) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Access denied. Admin or official role required.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 disabled:opacity-50"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {seeding ? 'Seeding...' : 'Seed Data'}
            </button>
            <button
              onClick={() => setShowCreateSociety(!showCreateSociety)}
              className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300"
            >
              <Building2 className="w-4 h-4" />
              {showCreateSociety ? 'Close' : 'Create Society'}
            </button>
            <button
              onClick={() => setShowTweetImport(!showTweetImport)}
              className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
            >
              <Twitter className="w-4 h-4" />
              {showTweetImport ? 'Close Import' : 'Import Tweet'}
            </button>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
          </div>
        </div>
        {seedResult && (
          <div className={`text-sm px-4 py-2 rounded-lg ${seedResult.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {seedResult}
          </div>
        )}

        {/* Tweet Import */}
        {showTweetImport && (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Twitter className="w-4 h-4" /> Import Issue from Tweet
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={tweetUrl}
                onChange={e => setTweetUrl(e.target.value)}
                placeholder="https://x.com/user/status/123456..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
                onKeyDown={e => e.key === 'Enter' && handleFetchTweet()}
              />
              <button
                onClick={handleFetchTweet}
                disabled={tweetLoading || !tweetUrl.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {tweetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Fetch
              </button>
            </div>

            {tweetError && (
              <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{tweetError}</div>
            )}

            {tweetPreview && (
              <div className="space-y-3 border-t border-gray-800 pt-4">
                <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300 italic">
                  &ldquo;{tweetPreview.tweetText}&rdquo;
                  <span className="text-gray-500 not-italic ml-2">— @{tweetPreview.tweetAuthor}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Title</label>
                    <input
                      type="text"
                      value={tweetPreview.title}
                      onChange={e => setTweetPreview({ ...tweetPreview, title: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Category</label>
                    <select
                      value={tweetPreview.category}
                      onChange={e => setTweetPreview({ ...tweetPreview, category: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Urgency</label>
                    <select
                      value={tweetPreview.urgency}
                      onChange={e => setTweetPreview({ ...tweetPreview, urgency: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">City</label>
                    <input
                      type="text"
                      value={tweetPreview.city || ''}
                      onChange={e => setTweetPreview({ ...tweetPreview, city: e.target.value || null })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                      placeholder="City name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Description</label>
                  <textarea
                    value={tweetPreview.description}
                    onChange={e => setTweetPreview({ ...tweetPreview, description: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none resize-none"
                  />
                </div>

                {tweetPreview.lat != null && tweetPreview.lng != null ? (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location: {tweetPreview.address} ({tweetPreview.lat.toFixed(4)}, {tweetPreview.lng.toFixed(4)})
                  </p>
                ) : (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> No location found. Enter a city name and re-fetch, or the issue won&apos;t have map coordinates.
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleImportTweet}
                    disabled={tweetImporting || tweetPreview.lat == null}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {tweetImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Import Issue
                  </button>
                  <button
                    onClick={() => { setTweetPreview(null); setTweetUrl(''); }}
                    className="text-gray-400 hover:text-white text-sm px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tweetResult && (
              <div className={`text-sm px-3 py-2 rounded-lg ${tweetResult.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {tweetResult}
              </div>
            )}
          </div>
        )}

        {/* Create Society */}
        {showCreateSociety && (
          <div className="bg-gray-900 border border-amber-500/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Create Society
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Society Name *</label>
                <input
                  type="text"
                  value={societyForm.name}
                  onChange={e => setSocietyForm({ ...societyForm, name: e.target.value })}
                  placeholder="e.g. Palm Heights RWA"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Address</label>
                <input
                  type="text"
                  value={societyForm.address}
                  onChange={e => setSocietyForm({ ...societyForm, address: e.target.value })}
                  placeholder="Sector 12, Dwarka"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">City</label>
                <input
                  type="text"
                  value={societyForm.city}
                  onChange={e => setSocietyForm({ ...societyForm, city: e.target.value })}
                  placeholder="New Delhi"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Map Zoom (15-20)</label>
                <input
                  type="number"
                  value={societyForm.mapZoom}
                  onChange={e => setSocietyForm({ ...societyForm, mapZoom: e.target.value })}
                  min="15"
                  max="20"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Latitude *</label>
                <input
                  type="text"
                  value={societyForm.lat}
                  onChange={e => setSocietyForm({ ...societyForm, lat: e.target.value })}
                  placeholder="28.6139"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Longitude *</label>
                <input
                  type="text"
                  value={societyForm.lng}
                  onChange={e => setSocietyForm({ ...societyForm, lng: e.target.value })}
                  placeholder="77.2090"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea
                value={societyForm.description}
                onChange={e => setSocietyForm({ ...societyForm, description: e.target.value })}
                rows={2}
                placeholder="Brief description of the society..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none resize-none"
              />
            </div>
            <button
              onClick={handleCreateSociety}
              disabled={societyCreating || !societyForm.name.trim() || !societyForm.lat || !societyForm.lng}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {societyCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              Create Society
            </button>
            {societyResult && (
              <div className={`text-sm px-3 py-2 rounded-lg ${societyResult.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {societyResult}
              </div>
            )}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<AlertCircle className="w-5 h-5 text-red-400" />} label="Open" count={openCount} />
          <StatCard icon={<Clock className="w-5 h-5 text-yellow-400" />} label="In Progress" count={inProgressCount} />
          <StatCard icon={<CheckCircle className="w-5 h-5 text-green-400" />} label="Resolved" count={resolvedCount} />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-400" />} label="Total" count={issues.length} />
        </div>

        {/* Category breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Issues by Category</h3>
          <div className="space-y-2">
            {categoryStats.map(c => (
              <div key={c.value} className="flex items-center gap-3">
                <span className="text-lg w-6">{c.icon}</span>
                <span className="text-sm text-gray-300 w-28">{c.label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${issues.length ? (c.count / issues.length) * 100 : 0}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-8 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as Status | '')}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <div className="flex-1" />

          {selected.size > 0 && (
            <>
              <span className="text-sm text-gray-400">{selected.size} selected</span>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as Status)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>Set {s.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                {updating && <Loader2 className="w-3 h-3 animate-spin" />}
                Apply
              </button>
            </>
          )}
        </div>

        {/* Issue table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === issues.length && issues.length > 0}
                      onChange={selectAll}
                      className="rounded border-gray-600"
                    />
                  </th>
                  <th className="p-3 text-left">Issue</th>
                  <th className="p-3 text-left hidden md:table-cell">Category</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left hidden md:table-cell">Urgency</th>
                  <th className="p-3 text-right">Upvotes</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => {
                  const cat = getCategoryConfig(issue.category);
                  const st = getStatusConfig(issue.status);
                  const urg = getUrgencyConfig(issue.urgency);
                  return (
                    <tr key={issue.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(issue.id)}
                          onChange={() => toggleSelect(issue.id)}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="p-3">
                        <Link href={`/issue/${issue.id}`} className="text-white hover:text-blue-400 font-medium">
                          {issue.title}
                        </Link>
                        {issue.address && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {issue.address}
                          </p>
                        )}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs" style={{ color: cat.color }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: st.color + '20', color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs" style={{ color: urg.color }}>
                          {urg.label}
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-400">{issue.upvote_count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm text-gray-400">{label}</span></div>
      <p className="text-2xl font-bold text-white">{count}</p>
    </div>
  );
}
