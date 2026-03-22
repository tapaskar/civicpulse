import type { SocietyCategory, SocietyRole } from './types';

export const SOCIETY_CATEGORIES: { value: SocietyCategory; label: string; color: string; icon: string }[] = [
  { value: 'plumbing', label: 'Plumbing', color: '#3b82f6', icon: '🔧' },
  { value: 'electrical', label: 'Electrical', color: '#f59e0b', icon: '⚡' },
  { value: 'elevator', label: 'Elevator', color: '#8b5cf6', icon: '🛗' },
  { value: 'parking', label: 'Parking', color: '#6366f1', icon: '🅿️' },
  { value: 'security', label: 'Security', color: '#ef4444', icon: '🔒' },
  { value: 'cleaning', label: 'Cleaning', color: '#22c55e', icon: '🧹' },
  { value: 'garden', label: 'Garden', color: '#16a34a', icon: '🌳' },
  { value: 'common_area', label: 'Common Area', color: '#0ea5e9', icon: '🏢' },
  { value: 'noise', label: 'Noise', color: '#ec4899', icon: '🔊' },
  { value: 'other', label: 'Other', color: '#6b7280', icon: '📌' },
];

export const SOCIETY_ROLES: { value: SocietyRole; label: string; color: string }[] = [
  { value: 'resident', label: 'Resident', color: '#6b7280' },
  { value: 'rwa_staff', label: 'RWA Staff', color: '#3b82f6' },
  { value: 'rwa_management', label: 'RWA Management', color: '#f59e0b' },
];

export const getSocietyCategoryConfig = (cat: string) =>
  SOCIETY_CATEGORIES.find(c => c.value === cat) ?? SOCIETY_CATEGORIES[9];

export const getSocietyRoleConfig = (role: string) =>
  SOCIETY_ROLES.find(r => r.value === role) ?? SOCIETY_ROLES[0];

export { URGENCY_LEVELS, STATUS_OPTIONS, getUrgencyConfig, getStatusConfig, MAP_STYLE } from '@/lib/constants';
