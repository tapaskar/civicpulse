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
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Status>('in_progress');
  const [updating, setUpdating] = useState(false);

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
          <Link
            href="/admin/analytics"
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
        </div>

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
