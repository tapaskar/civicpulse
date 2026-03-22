'use client';

import Link from 'next/link';
import { TrendingUp, CheckCircle2, Building2 } from 'lucide-react';
import { useCityStats } from '@/hooks/useCityStats';

const FALLBACK_STATS = [
  { value: '780+', label: 'Districts Covered', color: 'from-indigo-500 to-blue-500' },
  { value: '10+', label: 'City Authorities', color: 'from-emerald-500 to-teal-500' },
  { value: '10', label: 'Issue Categories', color: 'from-amber-500 to-orange-500' },
  { value: '24/7', label: 'Real-time Updates', color: 'from-rose-500 to-pink-500' },
];

export function CityStatsSection() {
  const { stats: cityStats, totalIssues, totalCities, totalResolved, loading } = useCityStats();

  if (loading || totalIssues === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {FALLBACK_STATS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition-shadow">
            <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1.5 uppercase tracking-wider font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">{totalIssues}</div>
          <div className="text-xs text-slate-400 mt-1.5 uppercase tracking-wider font-medium">Issues Reported</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{totalCities}</div>
          <div className="text-xs text-slate-400 mt-1.5 uppercase tracking-wider font-medium">Cities Active</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{totalResolved}</div>
          <div className="text-xs text-slate-400 mt-1.5 uppercase tracking-wider font-medium">Issues Resolved</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {cityStats.map(s => (
          <Link
            key={s.city}
            href="/map"
            className="group bg-white rounded-xl border border-slate-200 px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center min-w-[120px]"
          >
            <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.city}</div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">{s.total}</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-[10px] text-red-500 font-medium">{s.open_count} open</span>
              {s.resolved_count > 0 && (
                <span className="text-[10px] text-green-500 font-medium">{s.resolved_count} fixed</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
