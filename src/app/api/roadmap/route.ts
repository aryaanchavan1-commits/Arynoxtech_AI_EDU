import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { roadmapMilestones, lectures, progress } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { json } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const _db = getDb();
    if (!_db) return json({ error: "Database not configured" }, { status: 500 });
    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("skillId");
    if (!skillId) return json({ error: "skillId is required" }, { status: 400 });

    const user = await getSessionUser(req);

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
        lecturesCount: sql<number>`(SELECT count(*) FROM ${lectures} WHERE ${lectures.roadmapStepId} = ${roadmapMilestones.id} AND ${lectures.status} = 'published')`,
      })
      .from(roadmapMilestones)
      .where(and(eq(roadmapMilestones.skillId, skillId), eq(roadmapMilestones.status, "published")))
      .orderBy(roadmapMilestones.sortOrder);

    let result: any[] = milestones;
    if (user) {
      result = await Promise.all(milestones.map(async (m) => {
        const [completed] = await _db!
          .select({ count: sql<number>`count(*)` })
          .from(progress)
          .where(
            and(
              eq(progress.userId, user.id),
              eq(progress.completed, true),
              sql`${progress.lectureId} IN (SELECT ${lectures.id} FROM ${lectures} WHERE ${lectures.roadmapStepId} = ${m.id} AND ${lectures.status} = 'published')`
            )
          );
        return { ...m, userCompleted: Number(completed?.count || 0) };
      }));
    }

    return json(result, { cors: true, ttl: 60 });
  } catch (err: any) {
    return json({ error: err.message || "Failed to fetch roadmap" }, { status: 500 });
  }
}
