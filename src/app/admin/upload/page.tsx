import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getAdminContent } from "@/lib/data";
import { UploadForm } from "./upload-form";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminUploadPage() {
  let content;
  try {
    await requireAdmin();
    content = await getAdminContent();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-white mb-6">Upload Content</h1>
      <UploadForm skills={content.skills} modules={content.modules} milestones={content.milestones} />
    </AdminShell>
  );
}