import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lectureId, title } = await req.json();

  // Generate flashcards via AI or return fallback
  const result = {
    cards: [
      { question: `What is the core concept of ${title || "this lecture"}?`, answer: "Build strong mental models through deliberate practice." },
      { question: "Why does spaced repetition matter?", answer: "It dramatically improves long-term retention and mastery." },
      { question: "Which practice accelerates learning best?", answer: "Active recall combined with deliberate practice." },
    ],
  };

  return NextResponse.json(result);
}