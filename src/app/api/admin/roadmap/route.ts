import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { roadmapMilestones, lectures } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("skillId");
    if (!skillId) return NextResponse.json({ error: "skillId is required" }, { status: 400 });

    const milestones = await _db
      .select({
        id: roadmapMilestones.id,
        skillId: roadmapMilestones.skillId,
        title: roadmapMilestones.title,
        description: roadmapMilestones.description,
        iconEmoji: roadmapMilestones.iconEmoji,
        color: roadmapMilestones.color,
        sortOrder: roadmapMilestones.sortOrder,
        estimatedMinutes: roadmapMilestones.estimatedMinutes,
        lecturesRequired: roadmapMilestones.lecturesRequired,
        pointsReward: roadmapMilestones.pointsReward,
        status: roadmapMilestones.status,
        createdAt: roadmapMilestones.createdAt,
        updatedAt: roadmapMilestones.updatedAt,
        lectureCount: sql<number>`count(${lectures.id})`,
      })
      .from(roadmapMilestones)
      .leftJoin(lectures, eq(lectures.roadmapStepId, roadmapMilestones.id))
      .where(eq(roadmapMilestones.skillId, skillId))
      .groupBy(roadmapMilestones.id)
      .orderBy(roadmapMilestones.sortOrder);

    return NextResponse.json(milestones);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch milestones" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const body = await req.json();
    const { skillId, title, description, iconEmoji, color, sortOrder, estimatedMinutes, lecturesRequired, pointsReward } = body;

    if (!skillId || !title) {
      return NextResponse.json({ error: "skillId and title are required" }, { status: 400 });
    }

    const id = nanoid();
    await _db.insert(roadmapMilestones).values({
      id,
      skillId,
      title,
      description: description || null,
      iconEmoji: iconEmoji || "🎯",
      color: color || "#7c3aed",
      sortOrder: sortOrder ?? 0,
      estimatedMinutes: estimatedMinutes ?? 0,
      lecturesRequired: lecturesRequired ?? 1,
      pointsReward: pointsReward ?? 50,
      status: "published",
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create milestone" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const body = await req.json();
    const { id, title, description, iconEmoji, color, sortOrder, estimatedMinutes, lecturesRequired, pointsReward } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "id and title are required" }, { status: 400 });
    }

    await _db
      .update(roadmapMilestones)
      .set({
        title,
        description: description || null,
        iconEmoji: iconEmoji || "🎯",
        color: color || "#7c3aed",
        sortOrder: sortOrder ?? 0,
        estimatedMinutes: estimatedMinutes ?? 0,
        lecturesRequired: lecturesRequired ?? 1,
        pointsReward: pointsReward ?? 50,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(roadmapMilestones.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update milestone" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await _db.delete(roadmapMilestones).where(eq(roadmapMilestones.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete milestone" }, { status: 500 });
  }
}
