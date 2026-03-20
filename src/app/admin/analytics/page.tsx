'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/lib/constants';
import { parseWkbPoint } from '@/lib/geo';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Issue } from '@/lib/types';

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: true });
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
    };
    fetchAll();
  }, []);

  if (!user || (profile?.role !== 'admin' && profile?.role !== 'official')) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Access denied.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Category bar chart data
  const categoryData = CATEGORIES.map(c => ({
    name: c.label,
    count: issues.filter(i => i.category === c.value).length,
    color: c.color,
  }));

  // Issues over time (weekly)
  const timeData: { week: string; count: number }[] = [];
  if (issues.length > 0) {
    const start = new Date(issues[0].created_at);
    const now = new Date();
    const current = new Date(start);
    current.setDate(current.getDate() - current.getDay()); // start of week

    while (current <= now) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = issues.filter(i => {
        const d = new Date(i.created_at);
        return d >= current && d < weekEnd;
      }).length;
      timeData.push({
        week: current.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        count,
      });
      current.setDate(current.getDate() + 7);
    }
  }

  // Status pie chart
  const statusData = [
    { name: 'Open', value: issues.filter(i => i.status === 'open').length, color: '#ef4444' },
    { name: 'In Progress', value: issues.filter(i => i.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Resolved', value: issues.filter(i => i.status === 'resolved').length, color: '#22c55e' },
  ];

  // Avg resolution time
  const resolved = issues.filter(i => i.status === 'resolved');
  const avgResolutionDays = resolved.length > 0
    ? (resolved.reduce((sum, i) => {
        return sum + (new Date(i.updated_at).getTime() - new Date(i.created_at).getTime());
      }, 0) / resolved.length / (1000 * 60 * 60 * 24)).toFixed(1)
    : 'N/A';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Issues</p>
            <p className="text-2xl font-bold text-white">{issues.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Resolution Rate</p>
            <p className="text-2xl font-bold text-white">
              {issues.length ? Math.round((resolved.length / issues.length) * 100) : 0}%
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Avg Resolution</p>
            <p className="text-2xl font-bold text-white">{avgResolutionDays} days</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Upvotes</p>
            <p className="text-2xl font-bold text-white">
              {issues.reduce((s, i) => s + i.upvote_count, 0)}
            </p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Issues by category */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Issues by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues over time */}
        {timeData.length > 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Issues Over Time (Weekly)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
