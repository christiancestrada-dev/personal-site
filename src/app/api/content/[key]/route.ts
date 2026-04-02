import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const data = await kv.get(`site:${key}`);
  return NextResponse.json(data ?? null);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const body = await req.json();
  await kv.set(`site:${key}`, body);
  return NextResponse.json({ ok: true });
}
