"use client";

import { useRouter } from "next/navigation";
import { fr } from "@/lib/styles";

export default function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };
  return (
    <button
      data-testid="logout-button"
      onClick={logout}
      style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", ...fr(500, "13px"), color: "var(--text-dark)" }}
    >
      Keluar
    </button>
  );
}
