import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function POST(req: NextRequest) {
  try {
    const { page } = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';

    let city = 'Unknown', country = 'Unknown', countryCode = '';

    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      const geo = await fetch(`https://ipinfo.io/${ip}/json`, { next: { revalidate: 0 } })
        .then(r => r.json())
        .catch(() => ({}));
      city = geo.city || 'Unknown';
      country = geo.country || 'Unknown';
      countryCode = geo.country || '';
    }

    const visit = { city, country, countryCode, page: page || '/', timestamp: Date.now() };

    const redis = getRedis();
    if (redis) {
      await redis.lpush('site:visits', JSON.stringify(visit));
      await redis.ltrim('site:visits', 0, 99);
    }

    return NextResponse.json({ ok: true, location: { city, country, countryCode } });
  } catch (e) {
    console.error('[track] error:', e);
    return NextResponse.json({ ok: true, location: null, error: String(e) });
  }
}
