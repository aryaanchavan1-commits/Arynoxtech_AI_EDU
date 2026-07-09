import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateAiNotes } from "@/lib/ai";
import { getDb } from "@/db";
import { lectures } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lectureId, title, transcript } = await req.json();

  let lectureTitle = title;
  let lectureTranscript = transcript;

  if (lectureId) {
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const rows = await _db.select().from(lectures).where(eq(lectures.id, lectureId)).limit(1);
    if (rows[0]) {
      lectureTitle = rows[0].title;
      lectureTranscript = rows[0].transcript;
    }
  }

  const result: any = await generateAiNotes(lectureTitle || "Lecture", lectureTranscript || null);
  return NextResponse.json({ content: typeof result === "string" ? result : (result?.content || result?.error || "Generation failed") });
}