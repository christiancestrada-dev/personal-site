'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {});
  }, [pathname]);
  return null;
}
