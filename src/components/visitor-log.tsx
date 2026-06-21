'use client';
import { useEffect, useState } from 'react';

interface Visit {
  city: string;
  country: string;
  countryCode: string;
  page: string;
  timestamp: number;
}

function flag(code: string): string {
  if (!code || code.length !== 2) return '🌍';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function VisitorLog() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [myLocation, setMyLocation] = useState<{ city: string; country: string; countryCode: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://ipinfo.io/json')
      .then(r => r.json())
      .then(d => { if (d.city) setMyLocation({ city: d.city, country: d.country, countryCode: d.country }); })
      .catch(() => {});

    fetch('/api/visits')
      .then(r => r.json())
      .then(data => { setVisits(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--site-text-bright)' }}>
        Visitors
      </h2>

      {myLocation && myLocation.city !== 'Unknown' && (
        <div
          className="mb-6 px-3 py-2.5 rounded text-xs"
          style={{
            backgroundColor: 'var(--site-bg-card)',
            border: '1px solid var(--site-border)',
            color: 'var(--site-text-secondary)',
            fontFamily: 'var(--font-geist-mono)',
          }}
        >
          {flag(myLocation.countryCode)} you&apos;re visiting from {myLocation.city}, {myLocation.country}
        </div>
      )}

      <div className="space-y-0.5">
        {loading ? (
          <p className="text-xs" style={{ color: 'var(--site-text-muted)', fontFamily: 'var(--font-geist-mono)' }}>
            loading...
          </p>
        ) : visits.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--site-text-muted)', fontFamily: 'var(--font-geist-mono)' }}>
            no visitors logged yet — add Upstash credentials to enable the log
          </p>
        ) : (
          visits.map((v, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-xs py-1"
              style={{ fontFamily: 'var(--font-geist-mono)', borderBottom: '1px solid var(--site-border-subtle)' }}
            >
              <span className="w-5 text-center">{flag(v.countryCode)}</span>
              <span style={{ color: 'var(--site-text-bright)', width: '130px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.city !== 'Unknown' ? v.city : '—'}
              </span>
              <span style={{ color: 'var(--site-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.page}
              </span>
              <span style={{ color: 'var(--site-accent)', flexShrink: 0 }}>
                {timeAgo(v.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
