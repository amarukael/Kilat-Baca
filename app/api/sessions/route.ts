import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/sessions/route.ts");

export async function GET(req: NextRequest) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const url = req.url;
      logRequest(logger, "GET", url);

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mengambil sessions berdasarkan teacherId", { teacherId });
      const sessions = await store.getSessionsByTeacher(teacherId);
      logger.info("Database", "Sessions berhasil diambil", { count: sessions.length });

      const responseData = { sessions };
      logger.info("Success", "GET sessions berhasil", { sessionCount: sessions.length });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, { sessionCount: sessions.length });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat GET sessions", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}

export async function POST(req: NextRequest) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const url = req.url;
      const body = await req.json() as { title?: string; description?: string };
      logRequest(logger, "POST", url, undefined, body);

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      const { title, description = "" } = body;
      
      if (!title?.trim()) {
        logger.warn("Validation", "Title kosong");
        const response = NextResponse.json({ error: "Nama sesi wajib diisi" }, { status: 400 });
        logResponse(logger, 400, { error: "Nama sesi wajib diisi" });
        return response;
      }

      logger.info("Database", "Membuat session baru", { teacherId, title: title.trim(), description });
      const session = await store.createSession(teacherId, title.trim(), description);
      logger.info("Database", "Session berhasil dibuat", { sessionId: session.id });

      const responseData = { session };
      logger.info("Success", "POST session berhasil", { sessionId: session.id });
      const response = NextResponse.json(responseData, { status: 201 });
      logResponse(logger, 201, { sessionId: session.id });
      return response;
    } catch (err) {
      logger.error("Error", "Terjadi kesalahan saat POST session", err);
      const status = err instanceof Error && err.message === "Unauthorized" ? 401 : 500;
      const response = NextResponse.json({ error: "Terjadi kesalahan" }, { status });
      logResponse(logger, status, { error: "Terjadi kesalahan" });
      return response;
    }
  });
}
