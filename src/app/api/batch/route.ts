import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { batchClasses } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { title, description, skillId, price, startDate, endDate, scheduleJson, maxStudents } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const id = nanoid();
    await _db.insert(batchClasses).values({
      id,
      title,
      description: description || null,
      instructorId: admin.id,
      skillId: skillId || null,
      price: price || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      scheduleJson: scheduleJson || null,
      maxStudents: maxStudents || 50,
    });

    const batch = { id, title, description, instructorId: admin.id, skillId, price, startDate, endDate, scheduleJson, maxStudents };
    return NextResponse.json({ success: true, batch }, { status: 201 });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const batches = await _db.select().from(batchClasses).orderBy(batchClasses.createdAt);
    return NextResponse.json({ batches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, title, description, skillId, price, startDate, endDate, scheduleJson, maxStudents, status } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    await _db
      .update(batchClasses)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(skillId !== undefined && { skillId }),
        ...(price !== undefined && { price }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(scheduleJson !== undefined && { scheduleJson }),
        ...(maxStudents !== undefined && { maxStudents }),
        ...(status !== undefined && { status }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(batchClasses.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    await _db.delete(batchClasses).where(eq(batchClasses.id, id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}