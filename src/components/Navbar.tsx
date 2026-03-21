'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';
import { Plus, Shield, LogOut, Menu, X, Settings } from 'lucide-react';

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <>
      <nav className={`sticky top-0 z-40 border-b ${
        isLanding
          ? 'bg-white/80 backdrop-blur-md border-slate-200/60'
          : 'glass gradient-border'
      }`}>
        <div className={`max-w-7xl mx-auto px-4 flex items-center justify-between ${isLanding ? 'h-16' : 'h-14'}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.svg" alt="interns.city" className={`rounded-lg transition-all ${isLanding ? 'w-10 h-10' : 'w-8 h-8'}`} />
            <span className={`font-bold tracking-tight ${isLanding ? 'text-2xl text-slate-900' : 'text-lg text-white'}`}>
              interns<span className="text-indigo-600">.city</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/map" className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
              isLanding
                ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
              Map
            </Link>

            {user && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-report-modal'))}
                className="flex items-center gap-1.5 text-sm bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Report Issue
              </button>
            )}

            {profile?.role === 'admin' || profile?.role === 'official' ? (
              <Link href="/admin" className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all ${
                isLanding
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            ) : null}

            {loading ? null : user ? (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/settings" className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
                  isLanding ? 'hover:bg-slate-100' : 'hover:bg-white/5'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isLanding
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-blue-500/15 border border-blue-500/25 text-blue-400'
                  }`}>
                    <span className="text-xs font-semibold">
                      {(profile?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-sm ${isLanding ? 'text-slate-600' : 'text-gray-400'}`}>{profile?.display_name}</span>
                </Link>
                <Link href="/settings" className={`p-1.5 rounded-lg transition-all ${
                  isLanding
                    ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}>
                  <Settings className="w-4 h-4" />
                </Link>
                <button onClick={signOut} className={`p-1.5 rounded-lg transition-all ${
                  isLanding
                    ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all ${
                  isLanding
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className={`md:hidden p-1 ${
            isLanding ? 'text-slate-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
          }`}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className={`md:hidden border-t px-4 py-3 space-y-1 animate-fade-in ${
            isLanding
              ? 'border-slate-100 bg-white'
              : 'border-white/5 bg-gray-950/95 backdrop-blur-xl'
          }`}>
            <Link href="/map" onClick={() => setMobileMenu(false)} className={`block text-sm py-2.5 px-3 rounded-lg transition-colors ${
              isLanding ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}>
              Map
            </Link>
            {user && (
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent('open-report-modal')); setMobileMenu(false); }}
                className={`block w-full text-left text-sm py-2.5 px-3 rounded-lg transition-colors ${
                  isLanding ? 'text-indigo-600 hover:bg-indigo-50' : 'text-blue-400 hover:bg-blue-500/10'
                }`}
              >
                + Report Issue
              </button>
            )}
            {(profile?.role === 'admin' || profile?.role === 'official') && (
              <Link href="/admin" onClick={() => setMobileMenu(false)} className={`block text-sm py-2.5 px-3 rounded-lg transition-colors ${
                isLanding ? 'text-slate-600 hover:bg-slate-50' : 'text-gray-300 hover:bg-white/5'
              }`}>
                Admin Dashboard
              </Link>
            )}
            {user ? (
              <>
                <Link href="/settings" onClick={() => setMobileMenu(false)} className={`block text-sm py-2.5 px-3 rounded-lg transition-colors ${
                  isLanding ? 'text-slate-600 hover:bg-slate-50' : 'text-gray-300 hover:bg-white/5'
                }`}>
                  Settings
                </Link>
                <button onClick={() => { signOut(); setMobileMenu(false); }} className={`block w-full text-left text-sm py-2.5 px-3 rounded-lg transition-colors ${
                  isLanding ? 'text-slate-400 hover:bg-slate-50' : 'text-gray-500 hover:bg-white/5'
                }`}>
                  Sign Out ({profile?.display_name})
                </button>
              </>
            ) : (
              <button onClick={() => { setShowAuth(true); setMobileMenu(false); }} className={`block w-full text-left text-sm py-2.5 px-3 rounded-lg transition-colors ${
                isLanding ? 'text-indigo-600 hover:bg-indigo-50' : 'text-blue-400 hover:bg-blue-500/10'
              }`}>
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
