import { NextResponse } from "next/server";
import { getSessionUser, requireUser } from "@/lib/auth";
import { getLectureDetail, searchLectures } from "@/lib/data";
import { db } from "@/db";
import { progress, watchlist, notes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const q = searchParams.get("q");

  if (id) {
    const user = await getSessionUser();
    const detail = await getLectureDetail(id, user);
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(detail);
  }

  if (q) {
    const results = await searchLectures(q);
    return NextResponse.json({ lectures: results });
  }

  return NextResponse.json({ error: "Missing id or q parameter" }, { status: 400 });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();

  if (body.action === "progress") {
    await db.insert(progress).values({ id: nanoid(), userId: user.id, lectureId: body.lectureId, positionSeconds: body.positionSeconds, durationSeconds: body.durationSeconds }).onConflictDoUpdate({
      target: [progress.userId, progress.lectureId],
      set: { positionSeconds: body.positionSeconds, durationSeconds: body.durationSeconds, completed: body.completed || false, lastWatchedAt: new Date().toISOString() },
    });
  }

  if (body.action === "watchlist") {
    if (body.add) {
      await db.insert(watchlist).values({ id: nanoid(), userId: user.id, lectureId: body.lectureId }).onConflictDoNothing();
    } else {
      await db.delete(watchlist).where(and(eq(watchlist.userId, user.id), eq(watchlist.lectureId, body.lectureId)));
    }
  }

  if (body.action === "note") {
    await db.insert(notes).values({ id: nanoid(), userId: user.id, lectureId: body.lectureId, content: body.content }).onConflictDoUpdate({
      target: [notes.userId, notes.lectureId],
      set: { content: body.content, canvasData: body.canvasData, updatedAt: new Date().toISOString() },
    });
  }

  return NextResponse.json({ success: true });
}