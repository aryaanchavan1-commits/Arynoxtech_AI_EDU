import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const videoId = req.nextUrl.searchParams.get("v");
    if (!videoId) return NextResponse.json({ error: "Missing videoId (?v=)" }, { status: 400 });

    let bunnyLibraryId = process.env.BUNNY_LIBRARY_ID || "";
    let bunnyApiKey = process.env.BUNNY_API_KEY || "";

    if (!bunnyLibraryId || !bunnyApiKey) {
      const settings = await _db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
      const s = settings[0];
      bunnyLibraryId = s?.bunnyLibraryId || bunnyLibraryId;
      bunnyApiKey = s?.bunnyApiKey || bunnyApiKey;
    }

    if (!bunnyLibraryId || !bunnyApiKey) {
      return NextResponse.json({ error: "Bunny.net not configured" }, { status: 400 });
    }

    const res = await fetch(`https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}`, {
      headers: { Accept: "application/json", AccessKey: bunnyApiKey },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Bunny API error (${res.status})` }, { status: res.status });
    }

    const data = await res.json();

    // Bunny status codes: 0=in queue, 1=processing, 2=finished, 3=failed, 4=unknown
    const statusMap: Record<number, string> = { 0: "queued", 1: "processing", 2: "finished", 3: "failed", 4: "unknown" };

    return NextResponse.json({
      videoId: data.guid || data.videoId,
      status: statusMap[data.status] ?? "unknown",
      enabled: data.enabled ?? false,
      hlsUrl: `https://${data.cdnHostname || `vz-${bunnyLibraryId}.b-cdn.net`}/${videoId}/playlist.m3u8`,
      thumbnailUrl: `https://${data.cdnHostname || `vz-${bunnyLibraryId}.b-cdn.net`}/${videoId}/thumbnail.jpg`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to check Bunny status" }, { status: 500 });
  }
}
