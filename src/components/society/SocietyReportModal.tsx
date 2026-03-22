'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SocietyReportForm } from './SocietyReportForm';

interface Props {
  lat?: number;
  lng?: number;
  onClose: () => void;
}

export function SocietyReportModal({ lat, lng, onClose }: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg mt-8 mb-8 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
        <div className="p-5">
          <h2 className="text-lg font-bold text-white mb-4">Report Issue</h2>
          <SocietyReportForm initialLat={lat} initialLng={lng} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
