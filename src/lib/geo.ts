// Module-level cache for reverse geocode results (~500m precision grid)
const geocodeCache = new Map<string, string>();

/** Reverse geocode lat/lng to a human-readable address using Nominatim (free, no API key) */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'CivicPulse/1.0' } }
    );
    const data = await res.json();
    if (data.display_name) {
      const parts = data.display_name.split(', ');
      const result = parts.slice(0, 3).join(', ');
      geocodeCache.set(key, result);
      return result;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/** Parse PostGIS WKB hex string to [lng, lat] */
export function parseWkbPoint(hex: string): [number, number] {
  // WKB Point with SRID: byte_order(1) + type(4) + srid(4) + x(8) + y(8) = 25 bytes = 50 hex chars
  // Without SRID: byte_order(1) + type(4) + x(8) + y(8) = 21 bytes = 42 hex chars
  try {
    const buf = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      buf[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    const view = new DataView(buf.buffer);
    const le = buf[0] === 1; // little endian
    const wkbType = view.getUint32(1, le);
    // Type 0x20000001 = Point with SRID, 0x00000001 = Point
    const hasSrid = (wkbType & 0x20000000) !== 0;
    const offset = hasSrid ? 9 : 5;
    const lng = view.getFloat64(offset, le);
    const lat = view.getFloat64(offset + 8, le);
    return [lng, lat];
  } catch {
    return [0, 0];
  }
}

/** Calculate distance in km between two points */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
