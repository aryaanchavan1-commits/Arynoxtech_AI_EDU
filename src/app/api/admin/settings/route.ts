import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { invalidateSettingsCache } from "@/lib/ai";

const MASK = "••••••••";

const SETTING_FIELDS = [
  "groqApiKey", "bunnyLibraryId", "bunnyApiKey", "bunnyCdnHostname",
  "databaseUrl", "auth0Domain", "auth0ClientId", "auth0ClientSecret",
  "stripeSecretKey", "stripeWebhookSecret", "razorpayKeyId", "razorpayKeySecret",
  "appUrl", "appName", "maintenanceMode", "maxFreeVideos", "maxFreeAi",
  "primaryColor", "logoUrl", "welcomeMessage",
] as const;

export async function GET() {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const rows = await _db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
    const s = rows[0] || {};

    const result: Record<string, string> = {};
    for (const field of SETTING_FIELDS) {
      const val = (s as any)[field];
      result[field] = val && val !== MASK ? MASK : (val || "");
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const body = await req.json();
    const updates: Record<string, any> = {};

    for (const field of SETTING_FIELDS) {
      if (body[field] === undefined) continue;
      // Only update if value is not the masked placeholder
      if (body[field] === MASK) continue;
      updates[field] = body[field];
    }

    updates.updatedAt = new Date().toISOString();

    // Upsert the global settings row
    const existing = await _db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
    if (existing[0]) {
      await _db.update(appSettings).set(updates).where(eq(appSettings.id, "global"));
    } else {
      await _db.insert(appSettings).values({ id: "global", ...updates });
    }

    // Invalidate cache so next request picks up the changes immediately
    invalidateSettingsCache();

    return NextResponse.json({ success: true, updatedFields: Object.keys(updates).filter((k) => k !== "updatedAt") });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}