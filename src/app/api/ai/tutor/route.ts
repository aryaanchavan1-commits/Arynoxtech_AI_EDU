import { NextResponse } from "next/server";
import { getSessionUser, requireUser } from "@/lib/auth";
import { generateAiNotes, generateAiTutorResponse, detectVulgarContent } from "@/lib/ai";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, lectureId, question, context, text, title, transcript } = body;

  // Moderation check on all inputs
  const inputsToCheck = [text, question, title, context].filter(Boolean).join(" ");
  if (inputsToCheck) {
    const modResult = await detectVulgarContent(inputsToCheck);
    if (modResult.isVulgar) {
      return NextResponse.json({ error: "Content flagged as inappropriate", flagged: true }, { status: 400 });
    }
  }

  if (action === "notes" || body.lectureId) {
    const result: any = await generateAiNotes(body.title || "Lecture", body.transcript || null);
    return NextResponse.json({ content: typeof result === "string" ? result : (result?.content || result?.error || "Notes generation failed") });
  }

  if (action === "tutor" || body.question) {
    const result = await generateAiTutorResponse(body.question || body.content || "", body.context || "");
    return NextResponse.json({ content: result.content || result.error || "Tutor response failed" });
  }

  if (action === "flashcards") {
    const result = await generateAiTutorResponse(`Generate 5 flashcards as JSON array with question and answer fields for: ${body.title || "this lecture"}`, body.transcript || "");
    return NextResponse.json({ content: result.content || result.error || "Failed" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}