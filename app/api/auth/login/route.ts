import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const teacher = await store.getTeacherByEmail(email.trim());
    if (!teacher || !verifyPassword(password, teacher.passwordHash)) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const token = await store.createAuthSession(teacher.id);

    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return NextResponse.json({
      teacher: { id: teacher.id, email: teacher.email, name: teacher.name },
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
