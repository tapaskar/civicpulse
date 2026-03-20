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
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/map" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">CivicPulse</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/map" className="text-sm text-gray-300 hover:text-white transition-colors">
              Map
            </Link>

            {user && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-report-modal'))}
                className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Report Issue
              </button>
            )}

            {profile?.role === 'admin' || profile?.role === 'official' ? (
              <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            ) : null}

            {loading ? null : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{profile?.display_name}</span>
                <button onClick={signOut} className="text-gray-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-gray-300">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-3 space-y-2">
            <Link href="/map" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-300 py-2">
              Map
            </Link>
            {user && (
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent('open-report-modal')); setMobileMenu(false); }}
                className="block text-sm text-emerald-400 py-2"
              >
                + Report Issue
              </button>
            )}
            {(profile?.role === 'admin' || profile?.role === 'official') && (
              <Link href="/admin" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-300 py-2">
                Admin Dashboard
              </Link>
            )}
            {user ? (
              <button onClick={() => { signOut(); setMobileMenu(false); }} className="block text-sm text-gray-400 py-2">
                Sign Out ({profile?.display_name})
              </button>
            ) : (
              <button onClick={() => { setShowAuth(true); setMobileMenu(false); }} className="block text-sm text-emerald-400 py-2">
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
