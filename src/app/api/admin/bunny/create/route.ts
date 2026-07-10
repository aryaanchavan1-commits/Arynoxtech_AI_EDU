import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { createBunnyVideo } from "@/lib/bunny";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const { title } = await req.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    let bunnyLibraryId = process.env.BUNNY_LIBRARY_ID || "";
    let bunnyApiKey = process.env.BUNNY_API_KEY || "";
    let bunnyCdnHostname = process.env.BUNNY_CDN_HOSTNAME || "";

    // Fallback: try DB settings if env vars not set
    if (!bunnyLibraryId || !bunnyApiKey) {
      const settings = await _db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
      const s = settings[0];
      bunnyLibraryId = s?.bunnyLibraryId || bunnyLibraryId;
      bunnyApiKey = s?.bunnyApiKey || bunnyApiKey;
      bunnyCdnHostname = s?.bunnyCdnHostname || bunnyCdnHostname;
    }

    if (!bunnyLibraryId || !bunnyApiKey) {
      return NextResponse.json({ error: "Bunny.net not configured. Add BUNNY_LIBRARY_ID and BUNNY_API_KEY in .env or Admin Settings." }, { status: 400 });
    }

    const config = { libraryId: bunnyLibraryId, apiKey: bunnyApiKey, cdnHostname: bunnyCdnHostname };
    const result = await createBunnyVideo(config, title);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      videoId: result.videoId,
      uploadUrl: `https://video.bunnycdn.com/library/${config.libraryId}/videos/${result.videoId}`,
      accessKey: config.apiKey,
      hlsUrl: result.hlsUrl,
      embedUrl: result.embedUrl,
      thumbnailUrl: `https://${config.cdnHostname || `vz-${config.libraryId}.b-cdn.net`}/${result.videoId}/thumbnail.jpg`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create Bunny video" }, { status: 500 });
  }
}