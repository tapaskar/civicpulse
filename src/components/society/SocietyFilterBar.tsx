'use client';

import { SOCIETY_CATEGORIES } from '@/lib/society/constants';
import { STATUS_OPTIONS, URGENCY_LEVELS } from '@/lib/constants';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  category: string;
  status: string;
  urgency: string;
  search: string;
  onChange: (filters: { category: string; status: string; urgency: string; search: string }) => void;
}

export function SocietyFilterBar({ category, status, urgency, search, onChange }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  const set = (key: string, value: string) => {
    onChange({ category, status, urgency, search, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={category}
        onChange={e => set('category', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
      >
        <option value="">All Categories</option>
        {SOCIETY_CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
        ))}
      </select>

      <select
        value={status}
        onChange={e => set('status', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
      >
        <option value="">All Status</option>
        {STATUS_OPTIONS.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={urgency}
        onChange={e => set('urgency', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none"
      >
        <option value="">All Urgency</option>
        {URGENCY_LEVELS.map(u => (
          <option key={u.value} value={u.value}>{u.label}</option>
        ))}
      </select>

      {searchOpen ? (
        <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="text" value={search}
            onChange={e => set('search', e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-32"
            autoFocus
          />
          <button onClick={() => { set('search', ''); setSearchOpen(false); }} className="text-gray-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button onClick={() => setSearchOpen(true)} className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white">
          <Search className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
