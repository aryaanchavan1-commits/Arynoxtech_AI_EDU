import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { tier } = await req.json();

    if (!["basic", "plus", "premium"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const amountMap: Record<string, number> = { basic: 299, plus: 599, premium: 999 };
    const amountInr = amountMap[tier];

    // Create subscription record
    await db.insert(subscriptions).values({
      id: nanoid(),
      userId: user.id,
      tier,
      amountInr,
      status: "active",
      provider: "manual",
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await db.update(users).set({ tier }).where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}