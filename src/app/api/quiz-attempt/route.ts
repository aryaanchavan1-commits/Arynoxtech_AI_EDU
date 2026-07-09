import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts, quizzes, skillMastery, lectures } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lectureId, quizId, selectedIndex } = await req.json();
  if (!quizId || selectedIndex === undefined) {
    return NextResponse.json({ error: "quizId and selectedIndex required" }, { status: 400 });
  }

  const quiz = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  if (!quiz[0]) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const correct = selectedIndex === quiz[0].correctIndex;

  await db.insert(quizAttempts).values({
    id: nanoid(), userId: user.id, quizId,
    selectedIndex, correct,
  });

  // Update skill mastery if correct
  if (correct && lectureId) {
    const lecture = await db.select({ skillId: lectures.skillId }).from(lectures).where(eq(lectures.id, lectureId)).limit(1);
    const skillId = lecture[0]?.skillId;
    if (skillId) {
      const existing = await db.select().from(skillMastery).where(
        and(eq(skillMastery.userId, user.id), eq(skillMastery.skillId, skillId))
      ).limit(1);
      if (existing[0]) {
        await db.update(skillMastery).set({
          quizzesPassed: sql`quizzes_passed + 1`,
          energyPoints: sql`energy_points + 15`,
          updatedAt: new Date().toISOString(),
        }).where(eq(skillMastery.id, existing[0].id));
      }
    }
  }

  return NextResponse.json({
    correct,
    correctIndex: quiz[0].correctIndex,
    explanation: quiz[0].explanation,
    correctAnswer: JSON.parse(quiz[0].options)[quiz[0].correctIndex],
  });
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lectureId = searchParams.get("lectureId");

  let query = db.select().from(quizAttempts).where(eq(quizAttempts.userId, user.id));
  if (lectureId) {
    const lectureQuizzes = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.lectureId, lectureId));
    const quizIds = lectureQuizzes.map(q => q.id);
    if (quizIds.length === 0) return NextResponse.json({ attempts: [], allCorrect: false });
    query = db.select().from(quizAttempts).where(
      and(eq(quizAttempts.userId, user.id), sql`quiz_id IN ${quizIds}`)
    );
  }

  const attempts = await query.orderBy(quizAttempts.attemptedAt);
  const allCorrect = attempts.length > 0 && attempts.every(a => a.correct === true);

  return NextResponse.json({ attempts, allCorrect });
}