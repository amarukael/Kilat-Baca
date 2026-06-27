import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/sessions/[id]/play/route.ts");

type Params = Promise<{ id: string }>;

/**
 * POST /api/sessions/[id]/play
 * Public route — dipanggil oleh useSessionPlayer saat siswa memulai sesi.
 * Tidak butuh auth; hanya mencatat satu baris di session_plays.
 */
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";

  return traceStorage.run(traceId, async () => {
    try {
      const { id } = await params;
      logRequest(logger, "POST", req.url, { id });

      // Verifikasi session ada (getSession sudah cukup)
      const session = await store.getSession(id);
      if (!session || !session.isActive) {
        logger.warn("Validation", "Session tidak ditemukan atau tidak aktif", { sessionId: id });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      await store.recordPlay(id);
      logger.info("Success", "Play berhasil dicatat", { sessionId: id });

      const response = NextResponse.json({ ok: true });
      logResponse(logger, 200, { ok: true });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat POST play", error);
      const response = NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
      logResponse(logger, 500, { error: "Terjadi kesalahan" });
      return response;
    }
  });
}
