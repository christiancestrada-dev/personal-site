import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function GET() {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json([]);
    const raw = await redis.lrange('site:visits', 0, 49);
    const visits = raw.map(v => (typeof v === 'string' ? JSON.parse(v) : v));
    return NextResponse.json(visits);
  } catch {
    return NextResponse.json([]);
  }
}
