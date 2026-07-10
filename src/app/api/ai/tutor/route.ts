import { NextResponse } from "next/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { progress, skillMastery, moduleProgress, achievements, lectures, skills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { callGroq, detectVulgarContent } from "@/lib/ai";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, lectureId, lectureTitle } = await req.json();
  if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 });

  const modResult = await detectVulgarContent(question);
  if (modResult.isVulgar) {
    return NextResponse.json({ error: "Content flagged as inappropriate", flagged: true }, { status: 400 });
  }

  // Build rich user context
  const _db = getDb();
  let userContext = `Student Name: ${user.name}\nEmail: ${user.email}\nTier: ${user.tier}\nTotal Points: ${user.totalPoints}\nStreak: ${user.streak} days\nRole: ${user.role}`;

  if (_db) {
    try {
      const completedCount = await _db
        .select({ count: sql<number>`count(*)` })
        .from(progress)
        .where(and(eq(progress.userId, user.id), eq(progress.completed, true)));
      userContext += `\nLectures Completed: ${completedCount[0]?.count || 0}`;

      const masteryLevels = await _db
        .select({ level: skillMastery.level })
        .from(skillMastery)
        .where(eq(skillMastery.userId, user.id));
      const mastered = masteryLevels.filter(m => m.level === "mastered").length;
      const inProgress = masteryLevels.filter(m => m.level !== "mastered").length;
      userContext += `\nSkills Mastered: ${mastered}\nSkills In Progress: ${inProgress}`;

      const recentLectures = await _db
        .select({ title: lectures.title })
        .from(progress)
        .innerJoin(lectures, eq(progress.lectureId, lectures.id))
        .where(eq(progress.userId, user.id))
        .orderBy(desc(progress.lastWatchedAt))
        .limit(5);
      if (recentLectures.length > 0) {
        userContext += `\nRecent Lectures: ${recentLectures.map(l => l.title).join(", ")}`;
      }
    } catch {}
  }

  if (lectureId && _db) {
    try {
      const lecture = await _db.select().from(lectures).where(eq(lectures.id, lectureId)).limit(1);
      if (lecture[0]) {
        userContext += `\n\nCurrent Lecture: "${lecture[0].title}"`;
        if (lecture[0].transcript) {
          userContext += `\nLecture Transcript (first 2000 chars): ${lecture[0].transcript.slice(0, 2000)}`;
        }
        if (lecture[0].skillId) {
          const sk = await _db.select({ title: skills.title }).from(skills).where(eq(skills.id, lecture[0].skillId)).limit(1);
          if (sk[0]) userContext += `\nSkill: ${sk[0].title}`;
        }
      }
    } catch {}
  }

  const result = await callGroq([
    {
      role: "system",
      content: `You are Arynox-EDU AI Tutor — an expert educator and study companion. You have complete context about this student. 

Rules:
1. Address the student by name
2. Reference their progress, mastered skills, and recent lectures when relevant
3. If they ask about a specific topic, connect it to what they've already studied
4. Suggest next steps based on their current skill levels
5. Be encouraging and specific — use their actual data
6. If they ask for study tips, tailor advice to their tier and progress
7. Keep responses concise but personal
8. NEVER mention that you have access to their data — just naturally incorporate it

Student Context:
${userContext}`,
    },
    { role: "user", content: question },
  ]);

  return NextResponse.json({
    content: result.content || result.error || "I'm here to help! What would you like to learn?",
    context: userContext,
  });
}