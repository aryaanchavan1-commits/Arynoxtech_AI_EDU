import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { videoDownloads, lectures } from "@/db/schema";
import { getSessionUser, requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { lectureId, fileSize } = body;
    if (!lectureId) {
      return NextResponse.json({ error: "lectureId is required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const existing = await _db
      .select()
      .from(videoDownloads)
      .where(and(eq(videoDownloads.userId, user.id), eq(videoDownloads.lectureId, lectureId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: "Already downloaded", download: existing[0] });
    }

    const id = nanoid();
    await _db.insert(videoDownloads).values({ id, userId: user.id, lectureId, fileSize: fileSize || null });
    const download = { id, userId: user.id, lectureId, fileSize: fileSize || null };

    return NextResponse.json({ success: true, download }, { status: 201 });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "BLOCKED") return NextResponse.json({ error: "Account blocked" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const downloads = await _db
      .select({
        id: videoDownloads.id,
        userId: videoDownloads.userId,
        lectureId: videoDownloads.lectureId,
        downloadedAt: videoDownloads.downloadedAt,
        fileSize: videoDownloads.fileSize,
        expiresAt: videoDownloads.expiresAt,
        title: lectures.title,
        slug: lectures.slug,
        thumbnailUrl: lectures.thumbnailUrl,
        durationSeconds: lectures.durationSeconds,
      })
      .from(videoDownloads)
      .innerJoin(lectures, eq(videoDownloads.lectureId, lectures.id))
      .where(eq(videoDownloads.userId, user.id))
      .orderBy(videoDownloads.downloadedAt);

    return NextResponse.json({ downloads });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}