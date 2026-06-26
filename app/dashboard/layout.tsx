import { redirect } from "next/navigation";
import { getTeacherId } from "@/lib/auth";
import { store } from "@/lib/store";
import LogoutButton from "@/components/teacher/LogoutButton";
import DarkModeToggle from "@/components/teacher/DarkModeToggle";

import { fr, fc } from "@/lib/styles";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const teacherId = await getTeacherId();
  if (!teacherId) redirect("/login");

  const teacher = await store.getTeacher(teacherId);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-light)" }}>
      <header style={{
        background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: "64px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <a href="/dashboard" style={{ textDecoration: "none" }}>
          <span style={{ ...fc(700, "20px"), color: "var(--primary)" }}>📚 Membaca Cepat TK</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ ...fr(400, "14px"), color: "var(--text-light)" }}>
            {teacher?.name ?? "Pengajar"}
          </span>
          <DarkModeToggle />
          <LogoutButton />
        </div>
      </header>
      <main style={{ padding: "32px 24px", maxWidth: "1100px", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
