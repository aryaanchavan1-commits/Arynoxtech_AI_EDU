import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
  const s = rows[0] || {};

  return NextResponse.json({
    appName: s.appName || "Arynox-EDU",
    primaryColor: s.primaryColor || "#7c3aed",
    logoUrl: s.logoUrl || "",
    welcomeMessage: s.welcomeMessage || "",
    maintenanceMode: s.maintenanceMode === "true",
    maxFreeVideos: parseInt(s.maxFreeVideos || "10"),
    maxFreeAi: parseInt(s.maxFreeAi || "1"),
    bunnyCdnHostname: s.bunnyCdnHostname || "",
    appUrl: s.appUrl || process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
    updatedAt: s.updatedAt || new Date().toISOString(),
    hasGroqKey: !!s.groqApiKey || !!process.env.GROQ_API_KEY,
    hasBunny: !!(s.bunnyLibraryId && s.bunnyApiKey),
    hasAuth0: !!(s.auth0Domain && s.auth0ClientId),
    hasStripe: !!s.stripeSecretKey,
    hasRazorpay: !!(s.razorpayKeyId && s.razorpayKeySecret),
  });
}