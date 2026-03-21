'use client';

import { X } from 'lucide-react';
import { ReportForm } from './ReportForm';

interface ReportModalProps {
  lat?: number;
  lng?: number;
  onClose: () => void;
}

export function ReportModal({ lat, lng, onClose }: ReportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 animate-scale-in custom-scrollbar">
        {/* Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl" />

        <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <ReportForm initialLat={lat} initialLng={lng} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
