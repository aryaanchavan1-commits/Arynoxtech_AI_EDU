import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeacherDashboard } from "./teacher-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminTeacherPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Teacher / Coach Dashboard</h1>
      <p className="text-sm text-zinc-400 mb-6">Track student progress, quiz performance, and mastery levels across all skills.</p>
      <TeacherDashboard />
    </AdminShell>
  );
}