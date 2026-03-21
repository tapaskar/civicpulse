'use client';

import { useMemo } from 'react';
import { getAuthoritiesForLocation } from '@/lib/authorities';
import type { Authority } from '@/lib/authorities';
import { useDistrictAuthority } from '@/hooks/useDistrictAuthority';
import type { DistrictAuthority } from '@/lib/districtAuthority';
import {
  Building2,
  Twitter,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Landmark,
  Loader2,
} from 'lucide-react';

interface AuthorityBadgeProps {
  lng: number;
  lat: number;
}

function ContactChip({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const content = (
    <span className="inline-flex items-center gap-1 text-[11px] text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded-full hover:bg-amber-200/80 transition-colors">
      {icon} {label}
    </span>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return content;
}

function AuthorityRow({ authority }: { authority: Authority }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Building2 className="w-3 h-3 text-amber-700 shrink-0" />
        <span className="text-xs font-medium text-amber-950">{authority.department}</span>
      </div>
      <div className="flex flex-wrap gap-1 pl-[18px]">
        {authority.twitter && (
          <ContactChip
            icon={<Twitter className="w-3 h-3 text-sky-600" />}
            label={authority.twitter}
            href={`https://x.com/${authority.twitter.replace('@', '')}`}
          />
        )}
        {authority.email && (
          <ContactChip
            icon={<Mail className="w-3 h-3 text-amber-700" />}
            label={authority.email}
            href={`mailto:${authority.email}`}
          />
        )}
        {authority.helpline && (
          <ContactChip
            icon={<Phone className="w-3 h-3 text-green-700" />}
            label={authority.helpline}
            href={`tel:${authority.helpline.replace(/[^0-9+]/g, '')}`}
          />
        )}
        {authority.whatsapp && (
          <ContactChip
            icon={<MessageCircle className="w-3 h-3 text-green-700" />}
            label={`WA ${authority.whatsapp}`}
            href={`https://wa.me/91${authority.whatsapp.replace(/[^0-9]/g, '')}`}
          />
        )}
        {authority.phone && !authority.helpline && (
          <ContactChip
            icon={<Phone className="w-3 h-3 text-green-700" />}
            label={authority.phone}
            href={`tel:${authority.phone.replace(/[^0-9+]/g, '')}`}
          />
        )}
        {authority.website && (
          <ContactChip
            icon={<ExternalLink className="w-3 h-3 text-amber-700" />}
            label="Portal"
            href={authority.website}
          />
        )}
      </div>
    </div>
  );
}

function DistrictRow({ dm }: { dm: DistrictAuthority }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Landmark className="w-3 h-3 text-amber-800 shrink-0" />
        <span className="text-xs font-medium text-amber-950">
          {dm.title}, {dm.district}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 pl-[18px]">
        {dm.email && (
          <ContactChip
            icon={<Mail className="w-3 h-3 text-amber-700" />}
            label={dm.email}
            href={`mailto:${dm.email}`}
          />
        )}
        {dm.phone && (
          <ContactChip
            icon={<Phone className="w-3 h-3 text-green-700" />}
            label={dm.phone}
            href={`tel:${dm.phone.replace(/[^0-9+]/g, '')}`}
          />
        )}
        {dm.website && (
          <ContactChip
            icon={<ExternalLink className="w-3 h-3 text-amber-700" />}
            label="District Portal"
            href={dm.website}
          />
        )}
        <ContactChip
          icon={<ExternalLink className="w-3 h-3 text-blue-700" />}
          label="CPGRAMS"
          href={dm.cpgrams}
        />
        <ContactChip
          icon={<Phone className="w-3 h-3 text-red-700" />}
          label={dm.helpline}
          href={`tel:${dm.helpline}`}
        />
      </div>
    </div>
  );
}

export function AuthorityBadge({ lng, lat }: AuthorityBadgeProps) {
  const city = useMemo(() => getAuthoritiesForLocation(lng, lat), [lng, lat]);
  const { authority: dm, loading: dmLoading } = useDistrictAuthority(lat, lng);

  // Deduplicate city authorities (many categories share same department)
  const unique: Authority[] = useMemo(() => {
    if (!city) return [];
    const seen = new Set<string>();
    const result: Authority[] = [];
    for (const auth of Object.values(city.contacts)) {
      if (auth && !seen.has(auth.department)) {
        seen.add(auth.department);
        result.push(auth);
      }
    }
    return result;
  }, [city]);

  // Show nothing if no data and not loading
  if (!city && !dm && !dmLoading) return null;

  const heading = city?.name
    ? `${city.name} — Authorities`
    : dm
      ? `${dm.district}, ${dm.state}`
      : 'Loading...';

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-lg shadow-amber-900/10 p-3 space-y-2.5 max-w-xs">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-amber-600 flex items-center justify-center">
          <Landmark className="w-3 h-3 text-white" />
        </div>
        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
          {heading}
        </span>
      </div>
      <div className="space-y-2.5 max-h-56 overflow-y-auto">
        {/* District Magistrate / Collector row */}
        {dmLoading && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading DM info...
          </div>
        )}
        {dm && <DistrictRow dm={dm} />}

        {/* City-level department authorities */}
        {unique.slice(0, 5).map(auth => (
          <AuthorityRow key={auth.department} authority={auth} />
        ))}
      </div>
    </div>
  );
}
