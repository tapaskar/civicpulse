'use client';

import Link from 'next/link';
import { MapPin, Camera, Users, BarChart3, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

const FEATURES = [
  {
    icon: <Camera className="w-5 h-5" />,
    title: 'Snap & Report',
    desc: 'Upload a photo — AI detects the issue type, severity, and fills everything automatically.',
    accent: 'bg-orange-50 text-orange-600',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Community Voting',
    desc: 'Citizens vote on severity and status. Consensus drives the official tag — democracy in action.',
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Authority Lookup',
    desc: 'Instantly see the responsible DM, Collector, or department with their email, phone & Twitter.',
    accent: 'bg-teal-50 text-teal-600',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Track Progress',
    desc: 'Real-time updates as issues get noticed, addressed, and resolved. Full transparency.',
    accent: 'bg-rose-50 text-rose-600',
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
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-600 font-medium">Live — Tracking civic issues across India</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Your City.
            <br />
            <span className="text-indigo-600">Your Voice.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Report potholes, broken streetlights, water leaks, and more on an interactive map.
            AI analyzes your photos. Communities vote on priority.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/map"
              className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <MapPin className="w-5 h-5" />
              Open Map
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-2 border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 px-8 py-3.5 rounded-full font-medium text-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              Report an Issue
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              How it works
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Every feature designed to make civic reporting effortless and accountability automatic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group bg-white border border-slate-100 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-10 h-10 rounded-lg ${f.accent} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Hold your city accountable
          </h2>
          <p className="text-slate-500 mb-8">
            Join thousands of citizens making their neighborhoods better, one report at a time.
          </p>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6 text-center">
        <p className="text-xs text-slate-400">
          CivicPulse — Open-source civic issue tracker for India
        </p>
      </footer>
    </div>
  );
}
