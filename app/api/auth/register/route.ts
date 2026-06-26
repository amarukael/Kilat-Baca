import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/auth/register/route.ts");

export async function POST(req: NextRequest) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const url = req.url;
      const body = await req.json() as {
        email?: string; password?: string; name?: string;
      };
      
      // Log incoming request (hide password)
      logRequest(logger, "POST", url, undefined, { 
        email: body.email, 
        password: "***", 
        name: body.name 
      });

      const { email, password, name } = body;

      if (!email?.trim() || !password || !name?.trim()) {
        logger.warn("Validation", "Field tidak lengkap");
        const response = NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
        logResponse(logger, 400, { error: "Semua field wajib diisi" });
        return response;
      }
      
      if (password.length < 8) {
        logger.warn("Validation", "Password terlalu pendek", { length: password.length });
        const response = NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
        logResponse(logger, 400, { error: "Password minimal 8 karakter" });
        return response;
      }

      logger.info("Authentication", "Hashing password");
      const hashedPassword = hashPassword(password);
      
      logger.info("Database", "Membuat teacher baru", { email: email.trim(), name: name.trim() });
      const teacher = await store.createTeacher(email.trim(), hashedPassword, name.trim());
      logger.info("Database", "Teacher berhasil dibuat", { teacherId: teacher.id });
      
      logger.info("Database", "Membuat auth session", { teacherId: teacher.id });
      const token = await store.createAuthSession(teacher.id);
      logger.info("Authentication", "Auth session berhasil dibuat");

      logger.info("Cookie", "Setting session cookie");
      const jar = await cookies();
      jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      });

      const responseData = { teacher };
      logger.info("Success", "Registrasi berhasil", { teacherId: teacher.id, teacherEmail: teacher.email });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (err) {
      logger.error("Error", "Terjadi kesalahan saat registrasi", err);
      const msg = err instanceof Error ? err.message : "Gagal mendaftar";
      const response = NextResponse.json({ error: msg }, { status: 400 });
      logResponse(logger, 400, { error: msg });
      return response;
    }
  });
}
