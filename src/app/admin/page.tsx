import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let user: any, stats: any;
  try {
    user = await requireAdmin();
    stats = await getAdminStats();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: stats.users, color: "text-violet-400" },
          { label: "Lectures", value: stats.lectures, color: "text-cyan-400" },
          { label: "Skills", value: stats.skills, color: "text-green-400" },
          { label: "Subscriptions", value: stats.subscriptions, color: "text-pink-400" },
          { label: "Live Classes", value: stats.liveClasses || 0, color: "text-yellow-400" },
          { label: "Payments", value: stats.payments || 0, color: "text-orange-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-5">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recent Users</h2>
          {stats.recentUsers?.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-7 h-7 rounded-full bg-violet-600/50 flex items-center justify-center text-xs font-bold">{u.name?.charAt(0)}</div>
              <div>
                <p className="text-sm text-zinc-300">{u.name}</p>
                <p className="text-[10px] text-zinc-600">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Top Lectures</h2>
          {stats.topLectures?.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <p className="text-sm text-zinc-300 truncate mr-2">{l.title}</p>
              <span className="text-xs text-zinc-500 whitespace-nowrap">{l.viewCount} views</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}