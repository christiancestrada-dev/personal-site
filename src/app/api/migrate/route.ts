import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entries = body as Record<string, unknown>;
  let count = 0;
  for (const [key, value] of Object.entries(entries)) {
    if (value !== null && value !== undefined) {
      await kv.set(`site:${key}`, value);
      count++;
    }
  }
  return NextResponse.json({ ok: true, migrated: count });
}
