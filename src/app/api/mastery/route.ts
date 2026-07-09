import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { skillMastery, moduleProgress, progress, lectures, modules, skills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");
  const reqUserId = searchParams.get("userId") || user.id;

  const mastery = await db
    .select({
      id: skillMastery.id, userId: skillMastery.userId, skillId: skillMastery.skillId,
      level: skillMastery.level, energyPoints: skillMastery.energyPoints,
      lecturesCompleted: skillMastery.lecturesCompleted, quizzesPassed: skillMastery.quizzesPassed,
      skillName: skills.title,
    })
    .from(skillMastery)
    .innerJoin(skills, eq(skillMastery.skillId, skills.id))
    .where(
      skillId
        ? and(eq(skillMastery.userId, reqUserId), eq(skillMastery.skillId, skillId))
        : eq(skillMastery.userId, reqUserId)
    );

  const modProg = await db
    .select({
      id: moduleProgress.id, userId: moduleProgress.userId, moduleId: moduleProgress.moduleId,
      lecturesCompleted: moduleProgress.lecturesCompleted, totalLectures: moduleProgress.totalLectures,
      completed: moduleProgress.completed, skillId: modules.skillId, moduleName: modules.title,
    })
    .from(moduleProgress)
    .innerJoin(modules, eq(moduleProgress.moduleId, modules.id))
    .where(eq(moduleProgress.userId, reqUserId));

  return NextResponse.json({ skills: mastery, modules: modProg });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lectureId } = await req.json();

  const lecture = await db.select().from(lectures).where(eq(lectures.id, lectureId)).limit(1);
  if (!lecture[0]) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  const skillId = lecture[0].skillId;
  const moduleId = lecture[0].moduleId;

  // Check how many lectures completed in this skill
  const completedCount = await db
    .select({ count: sql`count(*)` })
    .from(progress)
    .where(and(eq(progress.userId, user.id), eq(progress.completed, true), eq(progress.lectureId, lectureId)));

  const totalSkillLectures = await db
    .select({ count: sql`count(*)` })
    .from(lectures)
    .where(and(eq(lectures.skillId, skillId), eq(lectures.status, "published")));

  const lecturesCompleted = await db
    .select({ count: sql`count(*)` })
    .from(progress)
    .where(and(eq(progress.userId, user.id), eq(progress.completed, true)));

  // Upsert skill mastery
  const existingMastery = await db.select().from(skillMastery).where(
    and(eq(skillMastery.userId, user.id), eq(skillMastery.skillId, skillId))
  ).limit(1);

  const totalDone = Number(lecturesCompleted[0]?.count || 0);
  let level = "practiced";
  if (totalDone >= 20) level = "mastered";
  else if (totalDone >= 10) level = "level_2";
  else if (totalDone >= 5) level = "level_1";

  if (existingMastery[0]) {
    await db.update(skillMastery).set({
      lecturesCompleted: totalDone,
      level,
      updatedAt: new Date().toISOString(),
    }).where(eq(skillMastery.id, existingMastery[0].id));
  } else {
    await db.insert(skillMastery).values({
      id: nanoid(), userId: user.id, skillId, level,
      energyPoints: 0, lecturesCompleted: totalDone, quizzesPassed: 0,
    });
  }

  // Upsert module progress
  if (moduleId) {
    const totalModLectures = await db
      .select({ count: sql`count(*)` })
      .from(lectures)
      .where(and(eq(lectures.moduleId, moduleId), eq(lectures.status, "published")));

    const modCompleted = await db
      .select({ count: sql`count(*)` })
      .from(progress)
      .where(and(eq(progress.userId, user.id), eq(progress.completed, true), eq(progress.lectureId, lectureId)));

    const totalMod = Number(totalModLectures[0]?.count || 0);
    const doneMod = Number(modCompleted[0]?.count || 0);

    const existingModProg = await db.select().from(moduleProgress).where(
      and(eq(moduleProgress.userId, user.id), eq(moduleProgress.moduleId, moduleId))
    ).limit(1);

    if (existingModProg[0]) {
      await db.update(moduleProgress).set({
        lecturesCompleted: doneMod, totalLectures: totalMod,
        completed: doneMod >= totalMod, updatedAt: new Date().toISOString(),
      }).where(eq(moduleProgress.id, existingModProg[0].id));
    } else {
      await db.insert(moduleProgress).values({
        id: nanoid(), userId: user.id, moduleId,
        lecturesCompleted: doneMod, totalLectures: totalMod,
        completed: doneMod >= totalMod,
      });
    }
  }

  // Award energy points
  const energyPoints = totalDone * 10;
  await db.update(skillMastery).set({ energyPoints }).where(
    and(eq(skillMastery.userId, user.id), eq(skillMastery.skillId, skillId))
  );

  return NextResponse.json({ success: true, level, energyPoints, lecturesCompleted: totalDone });
}