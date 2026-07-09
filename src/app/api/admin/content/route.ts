import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { lectures, skills, modules, appSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { detectVulgarContent } from "@/lib/ai";
import { createBunnyVideo } from "@/lib/bunny";

export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const body = await req.json();
    const { type, title, description, skillId, moduleId, tierRequired, mp4Url, uploadBunny, eNotes } = body;
    let bunnyVideoId: string | null = body.bunnyVideoId || null;

    const id = nanoid();

    // Create skill or module
    if (type === "skills") {
      if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
      await _db.insert(skills).values({
        id, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + id.slice(0, 4),
        description: description || "", accentColor: "#7c3aed",
        sortOrder: 0, status: "published",
      });
      return NextResponse.json({ success: true, id });
    }

    if (type === "modules") {
      if (!title || !skillId) return NextResponse.json({ error: "Title and skill are required" }, { status: 400 });
      await _db.insert(modules).values({
        id, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + id.slice(0, 4),
        description: description || "", skillId, sortOrder: 0, status: "published",
      });
      return NextResponse.json({ success: true, id });
    }

    // Create lecture
    if (!title || !skillId) return NextResponse.json({ error: "Title and skill are required" }, { status: 400 });

    const modResult = await detectVulgarContent(title + (description || ""));
    if (modResult.isVulgar) {
      return NextResponse.json({ error: "Content contains inappropriate material" }, { status: 400 });
    }

    let hlsUrl: string | null = null;

    if (uploadBunny && bunnyVideoId) {
      const settings = await _db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
      const host = settings[0]?.bunnyCdnHostname || `vz-${settings[0]?.bunnyLibraryId}.b-cdn.net`;
      hlsUrl = `https://${host}/${bunnyVideoId}/playlist.m3u8`;
    } else if (uploadBunny) {
      const settings = await _db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
      if (settings[0]?.bunnyLibraryId && settings[0]?.bunnyApiKey) {
        const result = await createBunnyVideo({ libraryId: settings[0].bunnyLibraryId, apiKey: settings[0].bunnyApiKey, cdnHostname: settings[0].bunnyCdnHostname }, title);
        if ("videoId" in result) {
          bunnyVideoId = result.videoId;
          hlsUrl = result.hlsUrl;
        }
      }
    }

    await _db.insert(lectures).values({
      id, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + id.slice(0, 4),
      description: description || "", skillId, moduleId: moduleId || null,
      tierRequired: tierRequired || "free_trial", status: "published",
      mp4Url: mp4Url || null, hlsUrl, bunnyVideoId: bunnyVideoId || null,
      durationSeconds: 600, sortOrder: 0, viewCount: 0,
      contentText: eNotes || null,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create content" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    const { type, id } = await req.json();

    if (type === "skills") await _db.delete(skills).where(eq(skills.id, id));
    else if (type === "modules") await _db.delete(modules).where(eq(modules.id, id));
    else if (type === "lectures") await _db.delete(lectures).where(eq(lectures.id, id));
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}