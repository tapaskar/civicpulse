import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Map — Report & Track Civic Issues',
  description: 'Interactive map showing civic issues like potholes, broken streetlights, water leaks across Indian cities. Report issues, upvote, and track resolution in real-time.',
  alternates: { canonical: '/map' },
  openGraph: {
    title: 'Live Civic Issues Map — interns.city',
    description: 'Interactive map showing civic issues across Indian cities. Report, upvote, and track resolution.',
    url: 'https://interns.city/map',
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
