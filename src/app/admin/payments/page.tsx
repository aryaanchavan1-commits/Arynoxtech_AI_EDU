import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { getDb } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const _db = getDb();
  let rows: any[] = [];
  if (_db) {
    rows = await _db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        userName: users.name,
        userEmail: users.email,
        tier: subscriptions.tier,
        amountInr: subscriptions.amountInr,
        status: subscriptions.status,
        createdAt: subscriptions.createdAt,
        endsAt: subscriptions.endsAt,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(100);
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Payments & Subscriptions</h1>

      {rows.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-zinc-500">No payment records yet.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Tier</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="p-4">
                      <p className="text-white">{r.userName || "Unknown"}</p>
                      <p className="text-xs text-zinc-500">{r.userEmail}</p>
                    </td>
                    <td className="p-4 text-white capitalize">{r.tier}</td>
                    <td className="p-4 text-white">₹{r.amountInr?.toLocaleString("en-IN") || 0}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-green-500/20 text-green-300" : "bg-zinc-500/20 text-zinc-400"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                    <td className="p-4 text-zinc-400">{r.endsAt ? new Date(r.endsAt).toLocaleDateString("en-IN") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
