import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/sessions/[id]/route.ts");

type Params = Promise<{ id: string }>;

async function getOwnedSession(teacherId: string, sessionId: string) {
  const session = await store.getSession(sessionId);
  if (!session || session.teacherId !== teacherId) return null;
  return session;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const { id } = await params;
      const url = req.url;
      logRequest(logger, "GET", url, { id });

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mengambil session", { sessionId: id, teacherId });
      const session = await getOwnedSession(teacherId, id);
      
      if (!session) {
        logger.warn("Validation", "Session tidak ditemukan atau bukan milik teacher", { sessionId: id, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      logger.info("Database", "Session berhasil diambil", { sessionId: id });
      const responseData = { session };
      logger.info("Success", "GET session berhasil", { sessionId: id });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, { sessionId: id });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat GET session", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const { id } = await params;
      const url = req.url;
      const body = await req.json() as {
        title?: string; description?: string;
        defaultDuration?: number; defaultGap?: number;
        shuffleEnabled?: boolean; showSecondsTimer?: boolean;
      };
      logRequest(logger, "PUT", url, { id }, body);

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mengambil session untuk verifikasi ownership", { sessionId: id, teacherId });
      const session = await getOwnedSession(teacherId, id);
      
      if (!session) {
        logger.warn("Validation", "Session tidak ditemukan atau bukan milik teacher", { sessionId: id, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      const updateData = {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.defaultDuration !== undefined && { defaultDuration: body.defaultDuration }),
        ...(body.defaultGap !== undefined && { defaultGap: body.defaultGap }),
        ...(body.shuffleEnabled !== undefined && { shuffleEnabled: body.shuffleEnabled }),
        ...(body.showSecondsTimer !== undefined && { showSecondsTimer: body.showSecondsTimer }),
      };

      logger.info("Database", "Mengupdate session", { sessionId: id, updateData });
      const updated = await store.updateSession(id, updateData);
      logger.info("Database", "Session berhasil diupdate", { sessionId: id });

      const responseData = { session: updated };
      logger.info("Success", "PUT session berhasil", { sessionId: id });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, { sessionId: id });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat PUT session", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const { id } = await params;
      const url = req.url;
      logRequest(logger, "DELETE", url, { id });

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mengambil session untuk verifikasi ownership", { sessionId: id, teacherId });
      const session = await getOwnedSession(teacherId, id);
      
      if (!session) {
        logger.warn("Validation", "Session tidak ditemukan atau bukan milik teacher", { sessionId: id, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      logger.info("Database", "Menghapus session", { sessionId: id });
      await store.deleteSession(id);
      logger.info("Database", "Session berhasil dihapus", { sessionId: id });

      const responseData = { ok: true };
      logger.info("Success", "DELETE session berhasil", { sessionId: id });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat DELETE session", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}
