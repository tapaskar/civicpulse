'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSocietyMembership } from '@/hooks/useSocietyMembership';
import { getSocietyRoleConfig } from '@/lib/society/constants';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AuthModal } from '@/components/AuthModal';
import { useState } from 'react';

export default function SocietyListPage() {
  const { user, loading: authLoading } = useAuth();
  const { societies, loading } = useSocietyMembership();
  const [showAuth, setShowAuth] = useState(false);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <Building2 className="w-12 h-12 text-gray-600" />
          <p className="text-gray-400">Sign in to view your societies.</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">My Societies</h1>

        {societies.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-700" />
            <p className="text-lg mb-2">No societies yet</p>
            <p className="text-sm">Ask your RWA management for an invite link to join your society.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {societies.map(({ society, role, unit_number }) => {
              const roleConfig = getSocietyRoleConfig(role);
              return (
                <Link
                  key={society.id}
                  href={`/society/${society.slug}/map`}
                  className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{society.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {society.address && (
                            <span className="text-xs text-gray-500">{society.address}</span>
                          )}
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: roleConfig.color + '20', color: roleConfig.color }}
                          >
                            {roleConfig.label}
                          </span>
                          {unit_number && (
                            <span className="text-[10px] text-gray-500">Unit: {unit_number}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
