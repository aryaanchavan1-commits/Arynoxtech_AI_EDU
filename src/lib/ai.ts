import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

let cachedSettings: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 10_000;

async function loadSettings() {
  if (cachedSettings && Date.now() - cacheTime < CACHE_TTL) return cachedSettings;
  try {
    const rows = await db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
    const s = rows[0] || {};
    cachedSettings = {
      groqApiKey: s.groqApiKey || process.env.GROQ_API_KEY || "",
      bunnyLibraryId: s.bunnyLibraryId || process.env.BUNNY_LIBRARY_ID || "",
      bunnyApiKey: s.bunnyApiKey || process.env.BUNNY_API_KEY || "",
      bunnyCdnHostname: s.bunnyCdnHostname || process.env.BUNNY_CDN_HOSTNAME || "",
      auth0Domain: s.auth0Domain || process.env.AUTH0_DOMAIN || "",
      auth0ClientId: s.auth0ClientId || process.env.AUTH0_CLIENT_ID || "",
      auth0ClientSecret: s.auth0ClientSecret || process.env.AUTH0_CLIENT_SECRET || "",
      stripeSecretKey: s.stripeSecretKey || "",
      stripeWebhookSecret: s.stripeWebhookSecret || "",
      razorpayKeyId: s.razorpayKeyId || "",
      razorpayKeySecret: s.razorpayKeySecret || "",
      appUrl: s.appUrl || process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
      appName: s.appName || "Arynox-EDU",
      maintenanceMode: s.maintenanceMode || "false",
      maxFreeVideos: s.maxFreeVideos || "10",
      maxFreeAi: s.maxFreeAi || "1",
      primaryColor: s.primaryColor || "#7c3aed",
      logoUrl: s.logoUrl || "",
      welcomeMessage: s.welcomeMessage || "",
    };
    cacheTime = Date.now();
  } catch {
    cachedSettings = {
      groqApiKey: process.env.GROQ_API_KEY || "",
      bunnyLibraryId: process.env.BUNNY_LIBRARY_ID || "",
      bunnyApiKey: process.env.BUNNY_API_KEY || "",
      bunnyCdnHostname: process.env.BUNNY_CDN_HOSTNAME || "",
      auth0Domain: process.env.AUTH0_DOMAIN || "",
      auth0ClientId: process.env.AUTH0_CLIENT_ID || "",
      auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET || "",
      stripeSecretKey: "", stripeWebhookSecret: "", razorpayKeyId: "", razorpayKeySecret: "",
      appUrl: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
      appName: process.env.APP_NAME || "Arynox-EDU", maintenanceMode: "false",
      maxFreeVideos: "10", maxFreeAi: "1",
      primaryColor: "#7c3aed", logoUrl: "", welcomeMessage: "",
    };
  }
  return cachedSettings!;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTime = 0;
}

export async function getGroqApiKey() {
  const s = await loadSettings();
  return s.groqApiKey || null;
}

export async function callGroq(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: { model?: string; temperature?: number }
) {
  const apiKey = await getGroqApiKey();
  if (!apiKey) {
    return { ok: false as const, error: "Groq API key not configured. Add it in Admin Settings.", content: null as string | null };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts?.model || "llama-3.3-70b-versatile",
        temperature: opts?.temperature ?? 0.4,
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false as const, error: `Groq API error (${res.status}): ${text.slice(0, 200)}`, content: null as string | null };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    return { ok: true as const, error: null, content };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Groq request failed", content: null as string | null };
  }
}

export async function detectVulgarContent(text: string): Promise<{ isVulgar: boolean; reason?: string }> {
  const result = await callGroq([
    { role: "system", content: 'You are a content moderator. Analyze the text and respond with JSON only: {"isVulgar": boolean, "reason": string | null}. Detect profanity, hate speech, harassment, adult content, violence, or any inappropriate material.' },
    { role: "user", content: text },
  ], { model: "llama-3.3-70b-versatile", temperature: 0 });

  if (result.ok && result.content) {
    try { return JSON.parse(result.content); } catch { }
  }
  return { isVulgar: false };
}

export async function generateAiTutorResponse(question: string, context: string) {
  const result = await callGroq([
    { role: "system", content: "You are Arynox-EDU AI Tutor, an expert educator. Answer the student's question based on the lecture context. Be concise, clear, and encouraging. Use examples when helpful. If the question is inappropriate, respond with 'I cannot answer that question.'" },
    { role: "user", content: `Context: ${context}\n\nQuestion: ${question}` },
  ]);
  return result;
}

export async function generateAiNotes(title: string, transcript: string | null) {
  if (!transcript) {
    return `# ${title}\n\n> No transcript available yet.\n\n## Key Takeaways\n- Review the lecture carefully\n- Take personal notes\n- Complete the quiz for retention`;
  }

  const result = await callGroq([
    { role: "system", content: "You generate structured lecture notes in markdown. Include: summary, key concepts, important timestamps, and action items. Keep it concise and actionable." },
    { role: "user", content: `Title: ${title}\n\nTranscript:\n${transcript}` },
  ], { temperature: 0.3 });

  if (result.ok && result.content) return result.content;
  return `# ${title}\n\n${(transcript || "").slice(0, 400)}\n\n## Next Steps\n1. Re-watch difficult sections\n2. Complete the quiz\n3. Ask the AI Tutor for help`;
}