import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { dailyChallenges, userChallenges } from "@/db/schema";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { title, description, type, target, pointsReward, expiresAt } = body;
    if (!title || !type) {
      return NextResponse.json({ error: "title and type are required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const id = nanoid();
    await _db.insert(dailyChallenges).values({
      id,
      title,
      description: description || null,
      type,
      target: target || 1,
      pointsReward: pointsReward || 100,
      expiresAt: expiresAt || null,
    });

    return NextResponse.json({ success: true, challenge: { id, title, description, type, target, pointsReward, expiresAt } }, { status: 201 });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const challenges = await _db
      .select()
      .from(dailyChallenges)
      .where(
        and(
          gte(dailyChallenges.expiresAt, now),
        )
      )
      .orderBy(dailyChallenges.createdAt);

    return NextResponse.json({ challenges });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { challengeId, progress } = body;
    if (!challengeId || progress === undefined) {
      return NextResponse.json({ error: "challengeId and progress are required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const [challenge] = await _db.select().from(dailyChallenges).where(eq(dailyChallenges.id, challengeId)).limit(1);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const [existing] = await _db
      .select()
      .from(userChallenges)
      .where(and(eq(userChallenges.userId, user.id), eq(userChallenges.challengeId, challengeId)))
      .limit(1);

    if (existing) {
      const completed = progress >= challenge.target || existing.completed;
      await _db
        .update(userChallenges)
        .set({
          progress: Math.max(existing.progress, progress),
          completed: completed ? true : existing.completed,
          completedAt: completed && !existing.completed ? new Date().toISOString() : existing.completedAt,
        })
        .where(eq(userChallenges.id, existing.id));
    } else {
      const completed = progress >= challenge.target;
      const id = nanoid();
      await _db.insert(userChallenges).values({
        id,
        userId: user.id,
        challengeId,
        progress,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "BLOCKED") return NextResponse.json({ error: "Account blocked" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}