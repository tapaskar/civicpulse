'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';

interface PhotoUploadProps {
  photos: string[];
  onChange: (urls: string[]) => void;
  onFirstPhoto?: (base64: string, mimeType: string) => void;
  onExifLocation?: (lat: number, lng: number) => void;
  maxPhotos?: number;
}

/** Extract GPS coordinates from EXIF data in a JPEG file. */
function extractExifGps(file: File): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const view = new DataView(reader.result as ArrayBuffer);
        // Check JPEG SOI marker
        if (view.getUint16(0) !== 0xFFD8) { resolve(null); return; }

        let offset = 2;
        while (offset < view.byteLength - 2) {
          const marker = view.getUint16(offset);
          if (marker === 0xFFE1) { // APP1 (EXIF)
            const exifOffset = offset + 4;
            // Check "Exif\0\0"
            if (view.getUint32(exifOffset) === 0x45786966 && view.getUint16(exifOffset + 4) === 0x0000) {
              const tiffStart = exifOffset + 6;
              const le = view.getUint16(tiffStart) === 0x4949;
              const ifdOffset = view.getUint32(tiffStart + 4, le);
              const gps = findGpsIfd(view, tiffStart, tiffStart + ifdOffset, le);
              resolve(gps);
              return;
            }
          }
          if ((marker & 0xFF00) !== 0xFF00) break;
          const len = view.getUint16(offset + 2);
          offset += 2 + len;
        }
        resolve(null);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024)); // Read first 128KB only
  });
}

function findGpsIfd(view: DataView, tiffStart: number, ifdStart: number, le: boolean): { lat: number; lng: number } | null {
  try {
    const entries = view.getUint16(ifdStart, le);
    let gpsIfdPointer = 0;
    for (let i = 0; i < entries; i++) {
      const entryOffset = ifdStart + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);
      if (tag === 0x8825) { // GPSInfo tag
        gpsIfdPointer = view.getUint32(entryOffset + 8, le);
        break;
      }
    }
    if (!gpsIfdPointer) return null;

    const gpsStart = tiffStart + gpsIfdPointer;
    const gpsEntries = view.getUint16(gpsStart, le);
    let latRef = 'N', lngRef = 'E';
    let latVals: number[] | null = null, lngVals: number[] | null = null;

    for (let i = 0; i < gpsEntries; i++) {
      const entryOffset = gpsStart + 2 + i * 12;
      const tag = view.getUint16(entryOffset, le);
      if (tag === 1) { // GPSLatitudeRef
        latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
      } else if (tag === 2) { // GPSLatitude
        latVals = readRationals(view, tiffStart + view.getUint32(entryOffset + 8, le), 3, le);
      } else if (tag === 3) { // GPSLongitudeRef
        lngRef = String.fromCharCode(view.getUint8(entryOffset + 8));
      } else if (tag === 4) { // GPSLongitude
        lngVals = readRationals(view, tiffStart + view.getUint32(entryOffset + 8, le), 3, le);
      }
    }

    if (!latVals || !lngVals) return null;
    let lat = latVals[0] + latVals[1] / 60 + latVals[2] / 3600;
    let lng = lngVals[0] + lngVals[1] / 60 + lngVals[2] / 3600;
    if (latRef === 'S') lat = -lat;
    if (lngRef === 'W') lng = -lng;
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function readRationals(view: DataView, offset: number, count: number, le: boolean): number[] {
  const vals: number[] = [];
  for (let i = 0; i < count; i++) {
    const num = view.getUint32(offset + i * 8, le);
    const den = view.getUint32(offset + i * 8 + 4, le);
    vals.push(den ? num / den : 0);
  }
  return vals;
}

export function PhotoUpload({ photos, onChange, onFirstPhoto, onExifLocation, maxPhotos = 4 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    const toUpload = files.slice(0, remaining);
    setUploading(true);

    const newUrls: string[] = [];
    let firstPhotoSent = false;

    // Extract EXIF GPS from the first original file (before compression strips it)
    if (photos.length === 0 && onExifLocation && toUpload.length > 0) {
      const gps = await extractExifGps(toUpload[0]);
      if (gps) onExifLocation(gps.lat, gps.lng);
    }

    for (const file of toUpload) {
      // Compress before uploading
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 800,
        maxSizeMB: 0.5,
        useWebWorker: true,
      });

      // Send first photo for AI analysis
      if (!firstPhotoSent && photos.length === 0 && onFirstPhoto) {
        firstPhotoSent = true;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          onFirstPhoto(base64, compressed.type || 'image/jpeg');
        };
        reader.readAsDataURL(compressed);
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error } = await supabase.storage
        .from('issue-photos')
        .upload(fileName, compressed, { contentType: 'image/jpeg' });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('issue-photos')
          .getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }
    }

    onChange([...photos, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((url, idx) => (
          <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span className="text-[10px] mt-1">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
      <p className="text-xs text-gray-500">
        Up to {maxPhotos} photos. Auto-compressed for upload.
      </p>
    </div>
  );
}
