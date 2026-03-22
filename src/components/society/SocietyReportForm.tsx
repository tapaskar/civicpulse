'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSociety } from '@/components/society/SocietyProvider';
import { SOCIETY_CATEGORIES } from '@/lib/society/constants';
import { URGENCY_LEVELS } from '@/lib/constants';
import { PhotoUpload } from '@/components/PhotoUpload';
import { reverseGeocode } from '@/lib/geo';
import { MapPin, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import type { SocietyCategory } from '@/lib/society/types';
import type { Urgency } from '@/lib/types';

interface SocietyReportFormProps {
  initialLat?: number;
  initialLng?: number;
  onClose?: () => void;
}

export function SocietyReportForm({ initialLat, initialLng, onClose }: SocietyReportFormProps) {
  const { user } = useAuth();
  const { society } = useSociety();
  const supabase = createClient();

  const defaultLat = initialLat ?? society?.location.coordinates[1] ?? 0;
  const defaultLng = initialLng ?? society?.location.coordinates[0] ?? 0;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SocietyCategory>('other');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);

  const handlePhotoAnalysis = async (base64: string, mimeType: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        // Map city categories to society categories where possible
        const catMap: Record<string, SocietyCategory> = {
          water: 'plumbing', streetlight: 'electrical', noise: 'noise',
          safety: 'security', garbage: 'cleaning',
        };
        const mapped = catMap[data.category] || 'other';
        setCategory(mapped);
        if (data.urgency) setUrgency(data.urgency);
        if (data.description) setDescription(data.description);
        setAiFilled(true);
      }
    } catch { /* ignore */ }
    setAnalyzing(false);
  };

  useEffect(() => {
    if (lat && lng) {
      reverseGeocode(lat, lng).then(addr => { if (addr) setAddress(addr); });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !society) return;
    if (!lat || !lng) {
      setError('Please set a location.');
      return;
    }
    setError('');
    setSubmitting(true);

    const { error: insertError } = await supabase.from('society_issues').insert({
      society_id: society.id,
      title,
      description: description || null,
      category,
      urgency,
      location: `POINT(${lng} ${lat})`,
      address: address || null,
      photo_urls: photos,
      author_id: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    if (onClose) onClose();
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Photo</label>
        <PhotoUpload
          photos={photos}
          onChange={setPhotos}
          onFirstPhoto={handlePhotoAnalysis}
          pathPrefix={`society/${society?.slug}`}
          onExifLocation={(exifLat, exifLng) => {
            setLat(exifLat);
            setLng(exifLng);
            reverseGeocode(exifLat, exifLng).then(addr => { if (addr) setAddress(addr); });
          }}
        />
      </div>

      {analyzing && (
        <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
          <Sparkles className="w-4 h-4 animate-pulse" /> Analyzing photo...
        </div>
      )}

      {aiFilled && !analyzing && (
        <div className="flex items-center gap-2 text-xs text-blue-400/70 px-1">
          <Sparkles className="w-3 h-3" /> Auto-filled from photo. Edit if needed.
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 mb-2 block">Category</label>
        <div className="grid grid-cols-5 gap-2">
          {SOCIETY_CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => { setCategory(c.value); setAiFilled(false); }}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-sm transition-colors ${
                category === c.value
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              <span className="text-lg">{c.icon}</span>
              <span className="text-[10px]">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Title</label>
        <input
          type="text" value={title}
          onChange={e => { setTitle(e.target.value); setAiFilled(false); }}
          required maxLength={280}
          placeholder="Brief description of the issue"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Description (optional)</label>
        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); setAiFilled(false); }}
          rows={3} placeholder="More details..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-2 block">Urgency</label>
        <div className="flex gap-2">
          {URGENCY_LEVELS.map(u => (
            <button
              key={u.value} type="button"
              onClick={() => { setUrgency(u.value); setAiFilled(false); }}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                urgency === u.value ? 'text-white' : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
              style={urgency === u.value ? { borderColor: u.color, backgroundColor: u.color + '20', color: u.color } : {}}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-1 block">Building / Area</label>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            type="text" value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. Tower A, Ground Floor"
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-500 outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !title || analyzing}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Report
      </button>
    </form>
  );
}
