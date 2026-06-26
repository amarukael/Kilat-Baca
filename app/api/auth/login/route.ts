import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/auth/login/route.ts");

export async function POST(req: NextRequest) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      // Log incoming request
      const url = req.url;
      const body = await req.json() as { email?: string; password?: string };
      logRequest(logger, "POST", url, undefined, { email: body.email, password: "***" });

      const { email, password } = body;

      if (!email?.trim() || !password) {
        logger.warn("Validation", "Email atau password kosong");
        const response = NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
        logResponse(logger, 400, { error: "Email dan password wajib diisi" });
        return response;
      }

      logger.info("Database", "Mencari teacher berdasarkan email", { email: email.trim() });
      const teacher = await store.getTeacherByEmail(email.trim());
      
      if (!teacher) {
        logger.warn("Authentication", "Teacher tidak ditemukan", { email: email.trim() });
        const response = NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
        logResponse(logger, 401, { error: "Email atau password salah" });
        return response;
      }

      logger.info("Authentication", "Memverifikasi password");
      const isValid = verifyPassword(password, teacher.passwordHash);
      
      if (!isValid) {
        logger.warn("Authentication", "Password tidak valid", { teacherId: teacher.id });
        const response = NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
        logResponse(logger, 401, { error: "Email atau password salah" });
        return response;
      }

      logger.info("Database", "Membuat auth session", { teacherId: teacher.id });
      const token = await store.createAuthSession(teacher.id);
      logger.info("Authentication", "Auth session berhasil dibuat", { tokenLength: token.length });

      logger.info("Cookie", "Setting session cookie");
      const jar = await cookies();
      jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });

      const responseData = {
        teacher: { id: teacher.id, email: teacher.email, name: teacher.name },
      };
      
      logger.info("Success", "Login berhasil", { teacherId: teacher.id, teacherName: teacher.name });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat login", error);
      const response = NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
      logResponse(logger, 500, { error: "Terjadi kesalahan" });
      return response;
    }
  });
}
