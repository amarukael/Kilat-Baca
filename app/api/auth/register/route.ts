import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { hashPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json() as {
      email?: string; password?: string; name?: string;
    };

    if (!email?.trim() || !password || !name?.trim()) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    }

    const teacher = store.createTeacher(email.trim(), hashPassword(password), name.trim());
    const token = store.createAuthSession(teacher.id);

    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return NextResponse.json({ teacher });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mendaftar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
