import { redirect } from "next/navigation";
import { getTeacherId } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const teacherId = await getTeacherId();
  if (!teacherId) redirect("/login");

  const session = await store.getSession(id);
  if (!session || session.teacherId !== teacherId) redirect("/dashboard");

  redirect(`/belajar/${session.shareToken}`);
}
