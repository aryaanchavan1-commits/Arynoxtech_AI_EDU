import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ notes: [] });

  const { searchParams } = new URL(req.url);
  const lectureId = searchParams.get("lectureId");

  if (lectureId) {
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const rows = await _db.select().from(notes).where(
      and(eq(notes.userId, user.id), eq(notes.lectureId, lectureId))
    ).limit(1);
    return NextResponse.json(rows[0] || { content: "", canvasData: null });
  }

  return NextResponse.json({ notes: [] });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _db = getDb();
  if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { lectureId, content, canvasData } = await req.json();

  await _db.insert(notes).values({
    id: nanoid(), userId: user.id, lectureId, content, canvasData,
  }).onConflictDoUpdate({
    target: [notes.userId, notes.lectureId],
    set: { content, canvasData, updatedAt: new Date().toISOString() },
  });

  return NextResponse.json({ success: true });
}