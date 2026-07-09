import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { parentChildLinks, parentReports, users, progress, lectures, quizzes } from "@/db/schema";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireAdmin();
    } catch {
      user = await requireUser();
    }
    const body = await req.json();
    const { childId, weekStart, weekEnd } = body;
    if (!childId || !weekStart || !weekEnd) {
      return NextResponse.json({ error: "childId, weekStart, weekEnd are required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    if (user.role !== "admin") {
      const [link] = await _db
        .select()
        .from(parentChildLinks)
        .where(and(eq(parentChildLinks.parentId, user.id), eq(parentChildLinks.childId, childId)))
        .limit(1);
      if (!link) {
        return NextResponse.json({ error: "Not authorized for this child" }, { status: 403 });
      }
    }

    const lecturesCompleted = await _db
      .select({ count: sql<number>`count(*)` })
      .from(progress)
      .where(and(eq(progress.userId, childId), eq(progress.completed, true), gte(progress.completedAt, weekStart), lte(progress.completedAt, weekEnd)));

    const watchData = await _db
      .select({ total: sql<number>`coalesce(sum(${progress.durationSeconds}), 0)` })
      .from(progress)
      .where(and(eq(progress.userId, childId), gte(progress.lastWatchedAt, weekStart), lte(progress.lastWatchedAt, weekEnd)));

    const [child] = await _db.select().from(users).where(eq(users.id, childId)).limit(1);

    const quizzesPassed = await _db
      .select({ count: sql<number>`count(*)` })
      .from(progress)
      .where(and(eq(progress.userId, childId), eq(progress.completed, true), gte(progress.completedAt, weekStart), lte(progress.completedAt, weekEnd)));

    const reportData = {
      childId,
      childName: child?.name,
      lecturesCompleted: Number(lecturesCompleted[0]?.count || 0),
      totalWatchTimeSeconds: Number(watchData[0]?.total || 0),
      streak: child?.streak || 0,
      pointsEarned: child?.totalPoints || 0,
      quizzesPassed: Number(quizzesPassed[0]?.count || 0),
      weekStart,
      weekEnd,
      generatedAt: new Date().toISOString(),
    };

    const id = nanoid();
    await _db.insert(parentReports).values({
      id,
      parentId: user.id,
      childId,
      periodStart: weekStart,
      periodEnd: weekEnd,
      reportJson: JSON.stringify(reportData),
    });

    return NextResponse.json({ success: true, report: reportData }, { status: 201 });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const links = await _db
      .select({ childId: parentChildLinks.childId })
      .from(parentChildLinks)
      .where(eq(parentChildLinks.parentId, user.id));

    const childIds = links.map((l) => l.childId);
    if (childIds.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    const reports = await _db
      .select({
        id: parentReports.id,
        childId: parentReports.childId,
        periodStart: parentReports.periodStart,
        periodEnd: parentReports.periodEnd,
        reportJson: parentReports.reportJson,
        createdAt: parentReports.createdAt,
      })
      .from(parentReports)
      .where(and(eq(parentReports.parentId, user.id)))
      .orderBy(parentReports.createdAt);

    return NextResponse.json({ reports });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}