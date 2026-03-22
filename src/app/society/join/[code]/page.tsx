'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { Building2, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function JoinSocietyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [society, setSociety] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase
      .from('societies')
      .select('*')
      .eq('invite_code', code)
      .eq('is_active', true)
      .single()
      .then(({ data }: { data: any }) => {
        setSociety(data);
        setLoading(false);
      });
  }, [code]);

  useEffect(() => {
    if (!user || !society) return;
    supabase
      .from('society_members')
      .select('id')
      .eq('society_id', society.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (data) setAlreadyMember(true);
      });
  }, [user?.id, society?.id]);

  const handleJoin = async () => {
    if (!user || !society) return;
    setJoining(true);
    setError('');

    const { error: insertErr } = await supabase.from('society_members').insert({
      society_id: society.id,
      user_id: user.id,
      role: 'resident',
    });

    if (insertErr) {
      if (insertErr.code === '23505') {
        setAlreadyMember(true);
      } else {
        setError(insertErr.message);
      }
    } else {
      setJoined(true);
      setTimeout(() => {
        router.push(`/society/${society.slug}/map`);
      }, 1500);
    }
    setJoining(false);
  };

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!society) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
        <p>Invalid or expired invite link.</p>
        <Link href="/society" className="text-blue-400 hover:text-blue-300 text-sm">
          Go to My Societies
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-white">{society.name}</h1>
          {society.address && <p className="text-sm text-gray-400 mt-1">{society.address}</p>}
          {society.description && <p className="text-sm text-gray-500 mt-2">{society.description}</p>}
        </div>

        {joined ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <p className="text-green-400 font-medium">Welcome! Redirecting...</p>
          </div>
        ) : alreadyMember ? (
          <div className="text-center space-y-3">
            <p className="text-gray-400">You are already a member of this society.</p>
            <Link
              href={`/society/${society.slug}/map`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Go to Society <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !user ? (
          <div className="text-center space-y-3">
            <p className="text-gray-400 text-sm">Sign in to join this society.</p>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {joining && <Loader2 className="w-4 h-4 animate-spin" />}
              Join as Resident
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
