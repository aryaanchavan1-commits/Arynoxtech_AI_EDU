import { NextResponse } from "next/server";
import { getSessionUser, requireUser } from "@/lib/auth";
import { getLectureDetail, searchLectures } from "@/lib/data";
import { getDb } from "@/db";
import { progress, watchlist, notes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { json } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const q = searchParams.get("q");

  if (id) {
    const user = await getSessionUser(req);
    const detail = await getLectureDetail(id, user);
    if (!detail) return json({ error: "Not found" }, { status: 404, cors: true });
    return json(detail, { ttl: 60, cors: true });
  }

  if (q) {
    const results = await searchLectures(q);
    return json({ lectures: results }, { ttl: 60, cors: true });
  }

  return json({ error: "Missing id or q parameter" }, { status: 400, cors: true });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  const body = await req.json();
  const _db = getDb();
  if (!_db) return json({ error: "Database not configured" }, { status: 500, cors: true });

  if (body.action === "progress") {
    await _db.insert(progress).values({
      id: nanoid(), userId: user.id, lectureId: body.lectureId,
      positionSeconds: body.positionSeconds, durationSeconds: body.durationSeconds,
    }).onConflictDoUpdate({
      target: [progress.userId, progress.lectureId],
      set: {
        positionSeconds: body.positionSeconds, durationSeconds: body.durationSeconds,
        completed: body.completed || false, lastWatchedAt: new Date().toISOString(),
      },
    });
  }

  if (body.action === "watchlist") {
    if (body.add) {
      await _db.insert(watchlist).values({ id: nanoid(), userId: user.id, lectureId: body.lectureId }).onConflictDoNothing();
    } else {
      await _db.delete(watchlist).where(and(eq(watchlist.userId, user.id), eq(watchlist.lectureId, body.lectureId)));
    }
  }

  if (body.action === "note") {
    const text = body.text || body.content || "";
    if (text) {
      await _db.insert(notes).values({ id: nanoid(), userId: user.id, lectureId: body.lectureId, content: text }).onConflictDoUpdate({
        target: [notes.userId, notes.lectureId],
        set: { content: text, updatedAt: new Date().toISOString() },
      });
    } else {
      await _db.delete(notes).where(and(eq(notes.userId, user.id), eq(notes.lectureId, body.lectureId)));
    }
  }

  return json({ success: true }, { cors: true });
}
