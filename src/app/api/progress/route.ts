import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/db";
import { progress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ progressCount: 0 });
  const _db = getDb();
  if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const rows = await _db.select().from(progress).where(eq(progress.userId, user.id));
  return NextResponse.json({ progressCount: rows.length });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _db = getDb();
  if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await req.json();
  await _db.insert(progress).values({
    id: nanoid(), userId: user.id, lectureId: body.lectureId,
    positionSeconds: body.positionSeconds || 0, durationSeconds: body.durationSeconds || 0,
    completed: body.completed || false, lastWatchedAt: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: [progress.userId, progress.lectureId],
    set: { positionSeconds: body.positionSeconds, completed: body.completed, lastWatchedAt: new Date().toISOString() },
  });

  return NextResponse.json({ success: true });
}