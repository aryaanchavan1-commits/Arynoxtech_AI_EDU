import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { lectures, skills, modules, appSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { detectVulgarContent } from "@/lib/ai";
import { createBunnyVideo } from "@/lib/bunny";

export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    const body = await req.json();
    const { title, description, skillId, moduleId, tierRequired, mp4Url, uploadBunny } = body;

    if (!title || !skillId) return NextResponse.json({ error: "Title and skill are required" }, { status: 400 });

    const modResult = await detectVulgarContent(title + (description || ""));
    if (modResult.isVulgar) {
      return NextResponse.json({ error: "Content contains inappropriate material" }, { status: 400 });
    }

    const id = nanoid();
    let bunnyVideoId: string | null = null;
    let hlsUrl: string | null = null;

    if (uploadBunny) {
      const settings = await db.select().from(appSettings).where(eq(appSettings.id, "global")).limit(1);
      if (settings[0]?.bunnyLibraryId && settings[0]?.bunnyApiKey) {
        const result = await createBunnyVideo({ libraryId: settings[0].bunnyLibraryId, apiKey: settings[0].bunnyApiKey, cdnHostname: settings[0].bunnyCdnHostname }, title);
        if ("videoId" in result) {
          bunnyVideoId = result.videoId;
          hlsUrl = result.hlsUrl;
        }
      }
    }

    await db.insert(lectures).values({
      id, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + id.slice(0, 4),
      description: description || "", skillId, moduleId: moduleId || null,
      tierRequired: tierRequired || "free_trial", status: "published",
      mp4Url: mp4Url || null, hlsUrl, bunnyVideoId,
      durationSeconds: 600, sortOrder: 0, viewCount: 0,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create content" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { type, id } = await req.json();

    if (type === "skills") await db.delete(skills).where(eq(skills.id, id));
    else if (type === "modules") await db.delete(modules).where(eq(modules.id, id));
    else if (type === "lectures") await db.delete(lectures).where(eq(lectures.id, id));
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}