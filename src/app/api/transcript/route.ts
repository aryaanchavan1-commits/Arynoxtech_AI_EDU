import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lectures } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lectureId } = await req.json();

  // Generate transcript from AI (mock — replace with actual Whisper/Groq integration)
  const lecture = await db.select().from(lectures).where(eq(lectures.id, lectureId)).limit(1);
  if (!lecture[0]) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  const transcript = `[00:00] Welcome to "${lecture[0].title}".\n[00:05] This lecture covers key concepts in this topic.\n[00:15] Let's dive into the details and explore practical examples.\n[01:00] Remember to take notes and complete the quiz to unlock the next lecture.`;

  await db.update(lectures).set({ transcript }).where(eq(lectures.id, lectureId));

  return NextResponse.json({ transcript, generated: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lectureId = searchParams.get("lectureId");

  if (!lectureId) return NextResponse.json({ error: "lectureId required" }, { status: 400 });

  const lecture = await db.select({ transcript: lectures.transcript }).from(lectures).where(eq(lectures.id, lectureId)).limit(1);
  return NextResponse.json({ transcript: lecture[0]?.transcript || null });
}