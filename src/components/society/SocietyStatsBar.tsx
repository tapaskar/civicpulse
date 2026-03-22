'use client';

import { AlertCircle, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface Props {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

export function SocietyStatsBar({ open, inProgress, resolved, total }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <div>
          <p className="text-lg font-bold text-white">{open}</p>
          <p className="text-[10px] text-gray-500">Open</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
        <div>
          <p className="text-lg font-bold text-white">{inProgress}</p>
          <p className="text-[10px] text-gray-500">In Progress</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
        <div>
          <p className="text-lg font-bold text-white">{resolved}</p>
          <p className="text-[10px] text-gray-500">Resolved</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
        <div>
          <p className="text-lg font-bold text-white">{total}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
      </div>
    </div>
  );
}
