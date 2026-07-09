import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers } from "@/lib/data";
import { AdminUsersTable } from "./users-table";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  let users;
  try {
    await requireAdmin();
    users = await getAdminUsers();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Users</h1>
      <AdminUsersTable users={users} />
    </AdminShell>
  );
}