import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'interns.city — Civic Issue Tracker for India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            📍
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            interns.city
          </span>
        </div>
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          Report & Track Civic Issues Across India
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          {['Potholes', 'Streetlights', 'Water Leaks', 'Garbage', 'Traffic'].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '999px',
                  padding: '8px 20px',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '16px',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          AI-powered · Community-driven · Open Source
        </div>
      </div>
    ),
    { ...size }
  );
}
