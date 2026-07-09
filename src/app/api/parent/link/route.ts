import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { parentChildLinks, users, progress, lectures } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const parent = await requireUser();
    const body = await req.json();
    const { childEmail, relationship } = body;
    if (!childEmail) {
      return NextResponse.json({ error: "childEmail is required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const [child] = await _db.select().from(users).where(eq(users.email, childEmail)).limit(1);
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    if (child.id === parent.id) {
      return NextResponse.json({ error: "Cannot link to yourself" }, { status: 400 });
    }

    const [existing] = await _db
      .select()
      .from(parentChildLinks)
      .where(and(eq(parentChildLinks.parentId, parent.id), eq(parentChildLinks.childId, child.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Already linked" }, { status: 409 });
    }

    const id = nanoid();
    await _db.insert(parentChildLinks).values({ id, parentId: parent.id, childId: child.id, relationship: relationship || null });

    return NextResponse.json({ success: true, link: { id, parentId: parent.id, childId: child.id, relationship } }, { status: 201 });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "BLOCKED") return NextResponse.json({ error: "Account blocked" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const parent = await requireUser();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const links = await _db
      .select({
        id: parentChildLinks.id,
        parentId: parentChildLinks.parentId,
        childId: parentChildLinks.childId,
        relationship: parentChildLinks.relationship,
        createdAt: parentChildLinks.createdAt,
        childName: users.name,
        childEmail: users.email,
        childAvatarUrl: users.avatarUrl,
        childStreak: users.streak,
        childTotalPoints: users.totalPoints,
      })
      .from(parentChildLinks)
      .innerJoin(users, eq(parentChildLinks.childId, users.id))
      .where(eq(parentChildLinks.parentId, parent.id))
      .orderBy(parentChildLinks.createdAt);

    const result: any[] = [];
    for (const link of links) {
      const completedLectures = await _db
        .select({ count: progress.id })
        .from(progress)
        .where(and(eq(progress.userId, link.childId), eq(progress.completed, true)));
      result.push({ ...link, completedLectures: completedLectures.length });
    }

    return NextResponse.json({ children: result });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}