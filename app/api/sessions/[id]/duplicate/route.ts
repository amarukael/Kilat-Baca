import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/sessions/[id]/duplicate/route.ts");

type Params = Promise<{ id: string }>;

/**
 * POST /api/sessions/[id]/duplicate
 * Teacher-auth route — menduplikasi session beserta semua slide-nya.
 * Session baru punya judul "(Salinan) <judul asli>" dan share_token baru.
 */
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";

  return traceStorage.run(traceId, async () => {
    try {
      const { id } = await params;
      logRequest(logger, "POST", req.url, { id });

      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Menduplikasi session", { sessionId: id, teacherId });
      const newSession = await store.duplicateSession(id, teacherId);

      if (!newSession) {
        logger.warn("Validation", "Session tidak ditemukan atau bukan milik teacher", { sessionId: id, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      logger.info("Success", "Session berhasil diduplikasi", { originalId: id, newId: newSession.id });
      const response = NextResponse.json({ session: newSession }, { status: 201 });
      logResponse(logger, 201, { newSessionId: newSession.id });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat POST duplicate", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}
