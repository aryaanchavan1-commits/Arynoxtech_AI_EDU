import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lectures } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { callGroq } from "@/lib/ai";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lectureId } = await req.json();
  if (!lectureId) return NextResponse.json({ error: "lectureId required" }, { status: 400 });

  const lecture = await db.select().from(lectures).where(eq(lectures.id, lectureId)).limit(1);
  if (!lecture[0]) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });

  const transcript = lecture[0].transcript || "";
  const title = lecture[0].title;

  const result = await callGroq([
    {
      role: "system",
      content: `You are an expert educator. Analyze the lecture "${title}" and generate EXACTLY 3 smart interactive popups. Each popup must be a JSON object in this array format, no other text:
[
  {"timeMs": <number>, "type": "question", "question": "...", "options": ["A.", "B.", "C.", "D."], "correctIndex": <0-3>, "explanation": "..."},
  {"timeMs": <number>, "type": "insight", "title": "...", "message": "...", "emoji": "..."},
  {"timeMs": <number>, "type": "tip", "title": "...", "message": "...", "emoji": "..."}
]
- "question" type: multiple choice about the current topic, time should be at 25%, 50%, or 75% of content
- "insight" type: an interesting fact or deep connection revealed ("🤯", "💡", "🌟")
- "tip" type: practical advice or memory trick ("📌", "⚡", "🎯")
Return ONLY valid JSON, no other text.`,
    },
    { role: "user", content: transcript ? `Title: ${title}\n\nTranscript:\n${transcript}` : `Title: ${title}\n\nGenerate 3 general interactive questions about this topic.` },
  ], { temperature: 0.4 });

  if (!result.ok || !result.content) {
    return NextResponse.json({ popups: [] });
  }

  try {
    const cleaned = result.content.replace(/```json|```/g, "").trim();
    const popups = JSON.parse(cleaned);
    return NextResponse.json({ popups: Array.isArray(popups) ? popups : [] });
  } catch {
    return NextResponse.json({ popups: [] });
  }
}