'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, URGENCY_LEVELS } from '@/lib/constants';
import { PhotoUpload } from './PhotoUpload';
import { reverseGeocode } from '@/lib/geo';
import { MapPin, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { AuthModal } from './AuthModal';
import type { Category, Urgency } from '@/lib/types';

interface ReportFormProps {
  /** Pre-filled latitude (from map click or URL param) */
  initialLat?: number;
  /** Pre-filled longitude (from map click or URL param) */
  initialLng?: number;
  /** Called on successful submit or cancel. If provided, form is in modal mode. */
  onClose?: () => void;
}

export function ReportForm({ initialLat, initialLng, onClose }: ReportFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('pothole');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [lat, setLat] = useState(initialLat ?? parseFloat(searchParams.get('lat') ?? '0'));
  const [lng, setLng] = useState(initialLng ?? parseFloat(searchParams.get('lng') ?? '0'));
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
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
        if (data.category) setCategory(data.category);
        if (data.urgency) setUrgency(data.urgency);
        if (data.description) setDescription(data.description);
        setAiFilled(true);
      }
    } catch {
      // Silently fail — user can still fill manually
    }
    setAnalyzing(false);
  };

  // Reverse geocode on mount if coordinates provided
  useEffect(() => {
    if (lat && lng) {
      reverseGeocode(lat, lng).then(addr => {
        if (addr) setAddress(addr);
      });
    }
  }, []);

  // Get user location if no coords provided
  useEffect(() => {
    if (!lat && !lng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          reverseGeocode(pos.coords.latitude, pos.coords.longitude).then(addr => {
            if (addr) setAddress(addr);
          });
        },
        () => {} // ignore error
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!lat || !lng) {
      setError('Please set a location on the map first.');
      return;
    }
    setError('');
    setSubmitting(true);

    const { error: insertError } = await supabase.from('issues').insert({
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

    if (onClose) {
      onClose();
    } else {
      router.push('/map');
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="p-8 text-center text-gray-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
          <p className="mb-4">You need to sign in to report an issue.</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
      <h1 className="text-2xl font-bold text-white">Report an Issue</h1>

      {/* Photos — first so AI can analyze and auto-fill below */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">
          Photo
          <span className="text-gray-600 ml-1">(upload to auto-detect issue details)</span>
        </label>
        <PhotoUpload
          photos={photos}
          onChange={setPhotos}
          onFirstPhoto={handlePhotoAnalysis}
          onExifLocation={(exifLat, exifLng) => {
            // Only override if no coordinates were set (from map click)
            if (!lat && !lng) {
              setLat(exifLat);
              setLng(exifLng);
              reverseGeocode(exifLat, exifLng).then(addr => {
                if (addr) setAddress(addr);
              });
            }
          }}
        />
      </div>

      {/* AI analyzing indicator */}
      {analyzing && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <Sparkles className="w-4 h-4 animate-pulse" />
          Analyzing photo to auto-fill details...
        </div>
      )}

      {aiFilled && !analyzing && (
        <div className="flex items-center gap-2 text-xs text-emerald-400/70 px-1">
          <Sparkles className="w-3 h-3" />
          Fields auto-filled from photo. Review and edit if needed.
        </div>
      )}

      {/* Category */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Category</label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => { setCategory(c.value); setAiFilled(false); }}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                category === c.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              <span className="text-lg">{c.icon}</span>
              <span className="text-xs">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => { setTitle(e.target.value); setAiFilled(false); }}
          required
          maxLength={280}
          placeholder="Brief description of the issue"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        />
        <span className="text-xs text-gray-500 mt-1 block">{title.length}/280</span>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Description (optional)</label>
        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); setAiFilled(false); }}
          rows={3}
          placeholder="More details about the issue..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* Urgency */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Urgency</label>
        <div className="flex gap-2">
          {URGENCY_LEVELS.map(u => (
            <button
              key={u.value}
              type="button"
              onClick={() => { setUrgency(u.value); setAiFilled(false); }}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                urgency === u.value
                  ? 'text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
              style={
                urgency === u.value
                  ? { borderColor: u.color, backgroundColor: u.color + '20', color: u.color }
                  : {}
              }
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Location</label>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5">
          <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-sm text-gray-300 truncate">
            {address || (lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Detecting location...')}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Tip: Click on the map to set a precise location before opening this form.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !title || analyzing}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-gray-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Report
      </button>
    </form>
  );
}
