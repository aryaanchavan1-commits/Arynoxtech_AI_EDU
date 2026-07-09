import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { users, userChallenges, achievements, dailyChallenges, progress } from "@/db/schema";
import { requireUser, requireAdmin } from "@/lib/auth";

async function autoAwardAchievements(_db: any, userId: string, totalPoints: number) {
  const [user] = await _db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return;

  const completedCount = await _db
    .select({ count: sql<number>`count(*)` })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.completed, true)));

  const totalCompleted = Number(completedCount[0]?.count || 0);
  const streak = user.streak || 0;

  const checks: { type: string; title: string; description: string; condition: boolean }[] = [
    { type: "first_lecture", title: "First Lecture", description: "Complete your first lecture", condition: totalCompleted >= 1 },
    { type: "ten_lectures", title: "Ten Lectures", description: "Complete 10 lectures", condition: totalCompleted >= 10 },
    { type: "hundred_lectures", title: "Hundred Lectures", description: "Complete 100 lectures", condition: totalCompleted >= 100 },
    { type: "streak_7", title: "7-Day Streak", description: "Maintain a 7 day streak", condition: streak >= 7 },
    { type: "streak_30", title: "30-Day Streak", description: "Maintain a 30 day streak", condition: streak >= 30 },
  ];

  for (const check of checks) {
    if (!check.condition) continue;
    const [existing] = await _db
      .select()
      .from(achievements)
      .where(and(eq(achievements.userId, userId), eq(achievements.type, check.type)))
      .limit(1);
    if (existing) continue;

    const id = nanoid();
    await _db.insert(achievements).values({
      id,
      userId,
      type: check.type,
      title: check.title,
      description: check.description,
    });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const level = Math.floor((user.totalPoints || 0) / 1000) + 1;

    const achievementsCount = await _db
      .select({ count: sql<number>`count(*)` })
      .from(achievements)
      .where(eq(achievements.userId, user.id));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStr = todayStart.toISOString();

    const challengesToday = await _db
      .select({ count: sql<number>`count(*)` })
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, user.id),
          eq(userChallenges.completed, true),
          gte(userChallenges.createdAt, todayStr)
        )
      );

    return NextResponse.json({
      level,
      totalPoints: user.totalPoints || 0,
      streak: user.streak || 0,
      achievementsCount: Number(achievementsCount[0]?.count || 0),
      challengesCompletedToday: Number(challengesToday[0]?.count || 0),
    });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, points, reason } = body;
    if (!userId || !points) {
      return NextResponse.json({ error: "userId and points are required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const [targetUser] = await _db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newTotal = (targetUser.totalPoints || 0) + points;
    await _db.update(users).set({ totalPoints: newTotal }).where(eq(users.id, userId));

    await autoAwardAchievements(_db, userId, newTotal);

    return NextResponse.json({
      success: true,
      pointsAwarded: points,
      totalPoints: newTotal,
      reason: reason || null,
    });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}