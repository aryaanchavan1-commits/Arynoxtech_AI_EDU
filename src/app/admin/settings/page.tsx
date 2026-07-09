import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <SettingsForm />
    </AdminShell>
  );
}