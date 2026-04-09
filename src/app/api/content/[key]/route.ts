import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");

function filePath(key: string) {
  // Sanitize key to prevent path traversal
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, "");
  return join(DATA_DIR, `${safe}.json`);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  try {
    const raw = await readFile(filePath(key), "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Read-only in production" }, { status: 403 });
  }

  const { key } = await params;
  const body = await req.json();
  await writeFile(filePath(key), JSON.stringify(body, null, 2) + "\n");
  return NextResponse.json({ ok: true });
}
