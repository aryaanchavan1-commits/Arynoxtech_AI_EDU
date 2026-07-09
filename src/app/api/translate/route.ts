import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { callGroq } from "@/lib/ai";

const SUPPORTED_LANGUAGES: Record<string, string> = {
  hi: "Hindi", en: "English", mr: "Marathi", kn: "Kannada", ta: "Tamil",
  te: "Telugu", ml: "Malayalam", gu: "Gujarati", bn: "Bengali", pa: "Punjabi",
  ur: "Urdu", or: "Odia", as: "Assamese", sa: "Sanskrit", ne: "Nepali",
  es: "Spanish", fr: "French", de: "German", ja: "Japanese", zh: "Chinese",
};

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, targetLang, sourceLang = "auto" } = await req.json();
  if (!text || !targetLang) {
    return NextResponse.json({ error: "text and targetLang required" }, { status: 400 });
  }

  const langName = SUPPORTED_LANGUAGES[targetLang];
  if (!langName) {
    return NextResponse.json({ error: `Unsupported language code: ${targetLang}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}` }, { status: 400 });
  }

  const result = await callGroq([
    {
      role: "system",
      content: `You are a professional translator. Translate the following text to ${langName} (${targetLang}). Return ONLY the translated text, no explanations, no quotes, no markdown. Preserve any timestamps like [00:00] exactly as they are.`,
    },
    { role: "user", content: text },
  ], { temperature: 0.1 });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    translated: result.content,
    sourceLang: sourceLang,
    targetLang,
    targetLangName: langName,
  });
}

export async function GET() {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}