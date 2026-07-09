import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentDetail } from "./student-detail";

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell>
      <a href="/admin/teacher" className="text-xs text-zinc-500 hover:text-zinc-300 mb-4 inline-block">← Back to all students</a>
      <StudentDetail userId={userId} />
    </AdminShell>
  );
}