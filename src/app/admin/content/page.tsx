import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getAdminContent } from "@/lib/data";
import { ContentManager } from "./content-manager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  let content;
  try {
    await requireAdmin();
    content = await getAdminContent();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Content Management</h1>
      <ContentManager data={content} />
    </AdminShell>
  );
}