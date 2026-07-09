import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { lectures } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { callGroq } from "@/lib/ai";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lectureId, title } = await req.json();
  let lectureTitle = title || "Lecture";
  let transcript = "";

  if (lectureId) {
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const lecture = await _db.select().from(lectures).where(eq(lectures.id, lectureId)).limit(1);
    if (lecture[0]) {
      lectureTitle = lecture[0].title;
      transcript = lecture[0].transcript || "";
    }
  }

  const result = await callGroq([
    {
      role: "system",
      content: `You generate flashcards for learning. Create EXACTLY 5 flashcards as a valid JSON array. Each object: { "question": "...", "answer": "..." }. Questions should test understanding, not just recall. Return ONLY the JSON array, no other text.`,
    },
    { role: "user", content: transcript ? `Title: ${lectureTitle}\n\nTranscript:\n${transcript}` : `Generate 5 flashcards about: ${lectureTitle}` },
  ], { temperature: 0.3 });

  if (!result.ok || !result.content) {
    return NextResponse.json({
      cards: [
        { question: `What is the core concept of ${lectureTitle}?`, answer: "Build strong mental models through deliberate practice." },
        { question: "Why does spaced repetition matter?", answer: "It dramatically improves long-term retention and mastery." },
        { question: "Which practice accelerates learning best?", answer: "Active recall combined with deliberate practice." },
        { question: `What makes ${lectureTitle} important?`, answer: "It builds foundational knowledge for advanced topics." },
        { question: "How can you apply this?", answer: "Practice regularly and review key concepts." },
      ],
    });
  }

  try {
    const cleaned = result.content.replace(/```json|```/g, "").trim();
    const cards = JSON.parse(cleaned);
    return NextResponse.json({ cards: Array.isArray(cards) ? cards.slice(0, 5) : [] });
  } catch {
    return NextResponse.json({ cards: [] });
  }
}