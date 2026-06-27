import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/sessions/[id]/stats/route.ts");

type Params = Promise<{ id: string }>;

/**
 * GET /api/sessions/[id]/stats
 * Teacher-auth route — mengembalikan totalPlays + lastPlayedAt untuk satu session.
 */
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";

  return traceStorage.run(traceId, async () => {
    try {
      const { id } = await params;
      logRequest(logger, "GET", req.url, { id });

      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      const stats = await store.getSessionStats(id, teacherId);
      if (!stats) {
        logger.warn("Validation", "Session tidak ditemukan atau bukan milik teacher", { sessionId: id, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      logger.info("Success", "Stats berhasil diambil", { sessionId: id, ...stats });
      const response = NextResponse.json({ stats });
      logResponse(logger, 200, { sessionId: id });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat GET stats", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}
