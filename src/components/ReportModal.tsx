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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <ReportForm initialLat={lat} initialLng={lng} onClose={onClose} />
      </div>
    </div>
  );
}
