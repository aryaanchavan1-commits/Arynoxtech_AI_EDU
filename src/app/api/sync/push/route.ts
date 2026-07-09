import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { progress, notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.progress) {
    for (const p of body.progress) {
      await db.insert(progress).values({
        id: nanoid(), userId: user.id, lectureId: p.lectureId,
        positionSeconds: p.positionSeconds || 0, durationSeconds: p.durationSeconds || 0, completed: p.completed || false,
      }).onConflictDoUpdate({
        target: [progress.userId, progress.lectureId],
        set: { positionSeconds: p.positionSeconds, durationSeconds: p.durationSeconds, completed: p.completed, lastWatchedAt: new Date().toISOString() },
      });
    }
  }

  if (body.notes) {
    for (const n of body.notes) {
      await db.insert(notes).values({
        id: nanoid(), userId: user.id, lectureId: n.lectureId,
        content: n.content || "", canvasData: n.canvasData || null,
      }).onConflictDoUpdate({
        target: [notes.userId, notes.lectureId],
        set: { content: n.content, updatedAt: new Date().toISOString() },
      });
    }
  }

  return NextResponse.json({ success: true, syncedAt: new Date().toISOString() });
}