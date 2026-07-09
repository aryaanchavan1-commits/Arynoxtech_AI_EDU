import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users, progress, quizzes, quizAttempts, skillMastery, moduleProgress, lectures, skills, modules, achievements } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const allUsers = await _db.select({
      id: users.id, name: users.name, email: users.email, tier: users.tier,
      streak: users.streak, totalPoints: users.totalPoints, isBlocked: users.isBlocked,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.role, "user"));

    const result: any[] = [];
    for (const u of allUsers) {
      const pCount = await _db.select({ count: sql`count(*)` }).from(progress).where(
        and(eq(progress.userId, u.id), eq(progress.completed, true))
      );
      const qCount = await _db.select({ count: sql`count(*)` }).from(quizAttempts).where(
        and(eq(quizAttempts.userId, u.id), eq(quizAttempts.correct, true))
      );
      const mastery = await _db.select().from(skillMastery).where(eq(skillMastery.userId, u.id));
      const modProg = await _db.select().from(moduleProgress).where(eq(moduleProgress.userId, u.id));
      const ach = await _db.select().from(achievements).where(eq(achievements.userId, u.id));

      result.push({
        ...u,
        lecturesCompleted: Number(pCount[0]?.count || 0),
        quizzesPassed: Number(qCount[0]?.count || 0),
        skillsMastered: mastery.filter(m => m.level === "mastered").length,
        modulesCompleted: modProg.filter(m => m.completed).length,
        achievements: ach.length,
        energyPoints: mastery.reduce((sum, m) => sum + m.energyPoints, 0),
      });
    }

    return NextResponse.json({ students: result.sort((a, b) => b.energyPoints - a.energyPoints) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}