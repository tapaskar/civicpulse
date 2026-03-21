'use client';

import Link from 'next/link';
import { MapPin, Camera, Users, BarChart3, ArrowRight, Zap, Shield, Globe, AlertTriangle, Droplets, Lightbulb, Trash2, Volume2, Car } from 'lucide-react';

const FEATURES = [
  {
    icon: <Camera className="w-5 h-5" />,
    title: 'Snap & Report',
    desc: 'Upload a photo — AI detects the issue type, severity, and fills everything automatically.',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/60',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Community Voting',
    desc: 'Citizens vote on severity and status. Consensus drives the official tag — democracy in action.',
    bg: 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/60',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Authority Lookup',
    desc: 'Instantly see the responsible DM, Collector, or department with their email, phone & Twitter.',
    bg: 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200/60',
    iconBg: 'bg-teal-100 text-teal-600',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Track Progress',
    desc: 'Real-time updates as issues get noticed, addressed, and resolved. Full transparency.',
    bg: 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/60',
    iconBg: 'bg-rose-100 text-rose-600',
  },
];

const STATS = [
  { value: '780+', label: 'Districts Covered', color: 'from-indigo-500 to-blue-500' },
  { value: '10+', label: 'City Authorities', color: 'from-emerald-500 to-teal-500' },
  { value: '10', label: 'Issue Categories', color: 'from-amber-500 to-orange-500' },
  { value: '24/7', label: 'Real-time Updates', color: 'from-rose-500 to-pink-500' },
];

const ISSUE_TYPES = [
  { icon: <AlertTriangle className="w-4 h-4" />, label: 'Potholes', color: 'bg-red-100 text-red-700 border-red-200' },
  { icon: <Lightbulb className="w-4 h-4" />, label: 'Streetlights', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { icon: <Droplets className="w-4 h-4" />, label: 'Water Leaks', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { icon: <Trash2 className="w-4 h-4" />, label: 'Garbage', color: 'bg-green-100 text-green-700 border-green-200' },
  { icon: <Volume2 className="w-4 h-4" />, label: 'Noise', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { icon: <Car className="w-4 h-4" />, label: 'Traffic', color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

export default function Home() {
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-amber-50/40" />
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/50 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-indigo-700 font-medium">Live — Tracking civic issues across India</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Your City.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Your Voice.</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Report potholes, broken streetlights, water leaks, and more on an interactive map.
              AI analyzes your photos. Communities vote on priority.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link
                href="/map"
                className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25"
              >
                <MapPin className="w-5 h-5" />
                Open Map
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/map"
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 px-8 py-3.5 rounded-full font-medium text-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
              >
                <Zap className="w-5 h-5 text-amber-500" />
                Report an Issue
              </Link>
            </div>
          </div>

          {/* Right: Visual mockup of the map interface */}
          <div className="flex-1 max-w-lg w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative">
              {/* Phone/browser frame */}
              <div className="bg-slate-900 rounded-2xl p-1.5 shadow-2xl shadow-slate-900/30 rotate-1 hover:rotate-0 transition-transform duration-500">
                {/* Browser bar */}
                <div className="bg-slate-800 rounded-t-xl px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-md px-3 py-1 text-[10px] text-slate-400 text-center">interns.city/map</div>
                </div>
                {/* Map mockup */}
                <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-900 rounded-b-xl p-4 relative overflow-hidden" style={{ minHeight: '280px' }}>
                  {/* Roads */}
                  <div className="absolute top-0 bottom-0 left-1/3 w-px bg-slate-600/30" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px bg-slate-600/30" />
                  <div className="absolute left-0 right-0 top-1/3 h-px bg-slate-600/30" />
                  <div className="absolute left-0 right-0 top-2/3 h-px bg-slate-600/30" />
                  {/* Diagonal road */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[10%] left-[10%] w-[80%] h-px bg-amber-500/20 rotate-[30deg] origin-left" />
                  </div>

                  {/* Issue pins */}
                  <div className="absolute top-[20%] left-[25%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="w-7 h-7 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">!</div>
                    <div className="w-2 h-2 bg-red-500 rotate-45 -mt-1.5" />
                  </div>
                  <div className="absolute top-[45%] left-[55%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                    <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-xs">💡</div>
                    <div className="w-2 h-2 bg-amber-500 rotate-45 -mt-1.5" />
                  </div>
                  <div className="absolute top-[65%] left-[30%] flex flex-col items-center animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                    <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-xs">💧</div>
                    <div className="w-2 h-2 bg-blue-500 rotate-45 -mt-1.5" />
                  </div>
                  <div className="absolute top-[35%] left-[75%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.3s' }}>
                    <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center text-xs">🗑</div>
                    <div className="w-2 h-2 bg-green-500 rotate-45 -mt-1.5" />
                  </div>
                  <div className="absolute top-[75%] left-[65%] flex flex-col items-center animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '0.7s' }}>
                    <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white shadow-lg flex items-center justify-center text-xs">🚧</div>
                    <div className="w-2 h-2 bg-orange-500 rotate-45 -mt-1.5" />
                  </div>

                  {/* Issue card overlay (bottom-left) */}
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-sm shrink-0">🕳️</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">Large pothole on MG Road</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Bengaluru · 2h ago</p>
                        <div className="flex gap-1 mt-1.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Open</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">High</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-blue-400 text-xs">
                        <ArrowRight className="w-3 h-3 rotate-[-90deg]" />
                        <span className="text-[10px] font-medium">12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-48 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-[10px]">✓</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800">Issue Resolved!</span>
                </div>
                <p className="text-[10px] text-slate-500">Water leak on Park Street fixed by KMC</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Issue types strip */}
      <section className="py-6 px-6 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-medium text-white/70 mr-2">Track:</span>
          {ISSUE_TYPES.map(t => (
            <span key={t.label} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${t.color}`}>
              {t.icon} {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 text-center hover:shadow-md transition-shadow">
              <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1.5 uppercase tracking-wider font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Features</span>
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
                className={`group ${f.bg} border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-slide-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-4 shadow-sm`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hold your city accountable
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of citizens making their neighborhoods better, one report at a time.
          </p>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-6 text-center">
        <p className="text-xs text-slate-500">
          interns.city — Open-source civic issue tracker for India
        </p>
      </footer>
    </div>
  );
}
