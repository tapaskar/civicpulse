'use client';

import Link from 'next/link';
import { MapPin, Camera, Users, BarChart3, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

const FEATURES = [
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'Snap & Report',
    desc: 'Upload a photo — AI detects the issue type, severity, and fills everything automatically.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Community Voting',
    desc: 'Citizens vote on severity and status. Consensus drives the official tag — democracy in action.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Authority Lookup',
    desc: 'Instantly see the responsible DM, Collector, or department with their email, phone & Twitter.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Track Progress',
    desc: 'Real-time updates as issues get noticed, addressed, and resolved. Full transparency.',
    color: 'from-emerald-500 to-teal-600',
  },
];

const STATS = [
  { value: '780+', label: 'Districts Covered' },
  { value: '10+', label: 'City Authorities' },
  { value: '10', label: 'Issue Categories' },
  { value: '24/7', label: 'Real-time Updates' },
];

export default function Home() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.1),transparent_50%)]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass glass-border mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-300 font-medium">Live — Tracking civic issues across India</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-white">Your City.</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
              Your Voice.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Report potholes, broken streetlights, water leaks, and more on an interactive map.
            AI analyzes your photos. Communities vote on priority. Authorities are held accountable.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/map"
              className="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <MapPin className="w-5 h-5" />
              Open Map
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-2 glass glass-border text-gray-300 hover:text-white px-8 py-3.5 rounded-xl font-medium text-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5 text-amber-400" />
              Report an Issue
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Built for <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">impact</span>
            </h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">
              Every feature designed to make civic reporting effortless and accountability automatic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group glass glass-border rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto text-center">
          <Shield className="w-12 h-12 text-emerald-500/50 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hold your city accountable
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of citizens making their neighborhoods better, one report at a time.
          </p>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-6 text-center">
        <p className="text-xs text-gray-600">
          CivicPulse — Open-source civic issue tracker for India
        </p>
      </footer>
    </div>
  );
}
