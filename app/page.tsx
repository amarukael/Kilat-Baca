import { redirect } from "next/navigation";
import { getTeacherId } from "@/lib/auth";

export default async function HomePage() {
  const teacherId = await getTeacherId();
  if (teacherId) {
    redirect("/dashboard");
  }
  redirect("/login");
}
