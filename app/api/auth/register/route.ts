import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { hashPassword } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";
import { notifyNewRegistration } from "@/lib/telegram";

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
      logger.info("Database", "Teacher berhasil dibuat dengan status pending", { teacherId: teacher.id });

      // Kirim notifikasi ke admin via Telegram (non-blocking)
      logger.info("Telegram", "Mengirim notifikasi ke admin");
      notifyNewRegistration(teacher).catch((err) => {
        logger.error("Telegram", "Gagal kirim notifikasi", err);
      });

      const responseData = { message: "Pendaftaran berhasil. Akun Anda sedang menunggu konfirmasi admin." };
      logger.info("Success", "Registrasi berhasil, menunggu konfirmasi", { teacherId: teacher.id });
      const response = NextResponse.json(responseData, { status: 201 });
      logResponse(logger, 201, responseData);
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
