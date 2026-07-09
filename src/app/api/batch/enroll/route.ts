import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { batchClasses, batchEnrollments } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { batchId } = body;
    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 });
    }
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const [batch] = await _db.select().from(batchClasses).where(eq(batchClasses.id, batchId)).limit(1);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const [existing] = await _db
      .select()
      .from(batchEnrollments)
      .where(and(eq(batchEnrollments.batchId, batchId), eq(batchEnrollments.userId, user.id)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    const id = nanoid();
    await _db.insert(batchEnrollments).values({ id, batchId, userId: user.id });

    return NextResponse.json({ success: true, enrollment: { id, batchId, userId: user.id } }, { status: 201 });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "BLOCKED") return NextResponse.json({ error: "Account blocked" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const _db = getDb();
    if (!_db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

    const enrollments = await _db
      .select({
        id: batchEnrollments.id,
        batchId: batchEnrollments.batchId,
        userId: batchEnrollments.userId,
        enrolledAt: batchEnrollments.enrolledAt,
        status: batchEnrollments.status,
        batchTitle: batchClasses.title,
        batchDescription: batchClasses.description,
        batchPrice: batchClasses.price,
        batchStartDate: batchClasses.startDate,
        batchEndDate: batchClasses.endDate,
        batchStatus: batchClasses.status,
      })
      .from(batchEnrollments)
      .innerJoin(batchClasses, eq(batchEnrollments.batchId, batchClasses.id))
      .where(eq(batchEnrollments.userId, user.id))
      .orderBy(batchEnrollments.enrolledAt);

    return NextResponse.json({ enrollments });
  } catch (err: any) {
    const msg = err.message || "Internal error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}