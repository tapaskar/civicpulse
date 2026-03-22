'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSociety } from '@/components/society/SocietyProvider';
import { SOCIETY_ROLES, getSocietyRoleConfig } from '@/lib/society/constants';
import type { SocietyRole } from '@/lib/society/types';
import { ArrowLeft, Loader2, Copy, Check, Trash2, Users } from 'lucide-react';
import Link from 'next/link';

interface MemberRow {
  id: string;
  user_id: string;
  role: SocietyRole;
  unit_number: string | null;
  joined_at: string;
  profile: { display_name: string; email: string } | null;
}

export default function SocietyMembersPage() {
  const { society, isManagement, loading: socLoading } = useSociety();
  const supabase = createClient();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!society) return;
    supabase
      .from('society_members')
      .select('id, user_id, role, unit_number, joined_at, profile:profiles!user_id(display_name, email)')
      .eq('society_id', society.id)
      .order('joined_at', { ascending: true })
      .then(({ data }: { data: any }) => {
        if (data) setMembers(data as any);
        setLoading(false);
      });
  }, [society?.id]);

  const handleRoleChange = async (memberId: string, newRole: SocietyRole) => {
    setUpdating(memberId);
    await supabase
      .from('society_members')
      .update({ role: newRole })
      .eq('id', memberId);
    setMembers(prev =>
      prev.map(m => m.id === memberId ? { ...m, role: newRole } : m)
    );
    setUpdating(null);
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this society?`)) return;
    setUpdating(memberId);
    await supabase
      .from('society_members')
      .delete()
      .eq('id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setUpdating(null);
  };

  const handleCopyInvite = () => {
    if (!society) return;
    navigator.clipboard.writeText(`${window.location.origin}/society/join/${society.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (socLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!society || !isManagement) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Access denied. Management role required.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/society/${society.slug}/manage`} className="text-gray-400 hover:text-white p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Members</h1>
              <p className="text-sm text-gray-500">{society.name}</p>
            </div>
          </div>
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-4 py-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {members.length} members
          </span>
          {SOCIETY_ROLES.map(r => {
            const count = members.filter(m => m.role === r.value).length;
            if (!count) return null;
            return (
              <span key={r.value} style={{ color: r.color }}>
                {count} {r.label}
              </span>
            );
          })}
        </div>

        {/* Members table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left hidden md:table-cell">Unit</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left hidden md:table-cell">Joined</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const roleConfig = getSocietyRoleConfig(member.role);
                  const displayName = member.profile?.display_name || 'Unknown';
                  return (
                    <tr key={member.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3">
                        <p className="text-white font-medium">{displayName}</p>
                        {member.profile?.email && (
                          <p className="text-xs text-gray-500">{member.profile.email}</p>
                        )}
                      </td>
                      <td className="p-3 hidden md:table-cell text-gray-400">
                        {member.unit_number || '—'}
                      </td>
                      <td className="p-3">
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member.id, e.target.value as SocietyRole)}
                          disabled={updating === member.id}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ color: roleConfig.color }}
                        >
                          {SOCIETY_ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 hidden md:table-cell text-gray-500 text-xs">
                        {new Date(member.joined_at).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRemove(member.id, displayName)}
                          disabled={updating === member.id}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          {updating === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
