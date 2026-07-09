import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    await requireAdmin();
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    return NextResponse.json(allUsers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const { userId, action, reason, tier } = await req.json();

    if (action === "block") {
      await db.update(users).set({ isBlocked: true, blockedReason: reason || null }).where(eq(users.id, userId));
    } else if (action === "unblock") {
      await db.update(users).set({ isBlocked: false, blockedReason: null }).where(eq(users.id, userId));
    } else if (action === "setTier") {
      if (!tier || !["free_trial", "basic", "plus", "premium"].includes(tier)) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      }
      const endsAt = tier === "free_trial" ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await db.update(users).set({ tier, subscriptionExpiresAt: endsAt }).where(eq(users.id, userId));
      if (tier !== "free_trial") {
        await db.insert(subscriptions).values({
          id: nanoid(),
          userId,
          tier,
          amountInr: 0,
          status: "active",
          provider: "admin",
          startsAt: new Date().toISOString(),
          endsAt,
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}