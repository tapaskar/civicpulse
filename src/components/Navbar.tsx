'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';
import { MapPin, Plus, Shield, LogOut, Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <>
      <nav className="glass gradient-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/15 group-hover:shadow-blue-500/30 transition-shadow">
              <MapPin className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Civic<span className="text-blue-400">Pulse</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/map" className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
              Map
            </Link>

            {user && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-report-modal'))}
                className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors shadow-sm shadow-blue-600/15"
              >
                <Plus className="w-4 h-4" />
                Report Issue
              </button>
            )}

            {profile?.role === 'admin' || profile?.role === 'official' ? (
              <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            ) : null}

            {loading ? null : user ? (
              <div className="flex items-center gap-3 ml-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-400">
                      {(profile?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{profile?.display_name}</span>
                </div>
                <button onClick={signOut} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm bg-white/5 border border-white/10 text-gray-300 hover:text-white px-4 py-1.5 rounded-lg transition-all hover:bg-white/10"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-gray-400 hover:text-white p-1">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-white/5 bg-gray-950/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-fade-in">
            <Link href="/map" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-300 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
              Map
            </Link>
            {user && (
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent('open-report-modal')); setMobileMenu(false); }}
                className="block w-full text-left text-sm text-blue-400 py-2.5 px-3 rounded-lg hover:bg-blue-500/10 transition-colors"
              >
                + Report Issue
              </button>
            )}
            {(profile?.role === 'admin' || profile?.role === 'official') && (
              <Link href="/admin" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-300 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
                Admin Dashboard
              </Link>
            )}
            {user ? (
              <button onClick={() => { signOut(); setMobileMenu(false); }} className="block w-full text-left text-sm text-gray-500 py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
                Sign Out ({profile?.display_name})
              </button>
            ) : (
              <button onClick={() => { setShowAuth(true); setMobileMenu(false); }} className="block w-full text-left text-sm text-blue-400 py-2.5 px-3 rounded-lg hover:bg-blue-500/10 transition-colors">
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
