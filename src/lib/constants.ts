import type { Category, Urgency, Status } from './types';

export const CATEGORIES: { value: Category; label: string; color: string; icon: string }[] = [
  { value: 'pothole', label: 'Pothole', color: '#ef4444', icon: '🕳️' },
  { value: 'streetlight', label: 'Streetlight', color: '#f59e0b', icon: '💡' },
  { value: 'water', label: 'Water Leak', color: '#3b82f6', icon: '💧' },
  { value: 'garbage', label: 'Garbage', color: '#22c55e', icon: '🗑️' },
  { value: 'road', label: 'Road Damage', color: '#a855f7', icon: '🛣️' },
  { value: 'noise', label: 'Noise', color: '#ec4899', icon: '🔊' },
  { value: 'safety', label: 'Safety Hazard', color: '#f97316', icon: '⚠️' },
  { value: 'traffic', label: 'Traffic Congestion', color: '#e11d48', icon: '🚗' },
  { value: 'accident', label: 'Accident', color: '#dc2626', icon: '🚨' },
  { value: 'other', label: 'Other', color: '#6b7280', icon: '📌' },
];

export const URGENCY_LEVELS: { value: Urgency; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

export const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: '#ef4444' },
  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'resolved', label: 'Resolved', color: '#22c55e' },
];

export const getCategoryConfig = (cat: Category) =>
  CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[7];

export const getUrgencyConfig = (urg: Urgency) =>
  URGENCY_LEVELS.find(u => u.value === urg) ?? URGENCY_LEVELS[1];

export const getStatusConfig = (st: Status) =>
  STATUS_OPTIONS.find(s => s.value === st) ?? STATUS_OPTIONS[0];

// Default map center (Gurgaon, India)
export const DEFAULT_CENTER: [number, number] = [76.9631, 28.4096];
export const DEFAULT_ZOOM = 12;

export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
