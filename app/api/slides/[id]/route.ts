import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/slides/[id]/route.ts");

type Params = Promise<{ id: string }>;

// Find which session owns this slide and verify teacher owns it — direct DB query
async function findSlideOwner(teacherId: string, slideId: string) {
  return store.getSlideWithSession(slideId, teacherId);
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const { id: slideId } = await params;
      const url = req.url;
      const body = await req.json() as {
        contentText?: string;
        imageUrl?: string;
        imageLabel?: string;
        customDuration?: number;
        customGap?: number;
      };
      logRequest(logger, "PUT", url, { slideId }, body);

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mencari slide owner", { slideId, teacherId });
      const found = await findSlideOwner(teacherId, slideId);
      
      if (!found) {
        logger.warn("Validation", "Slide tidak ditemukan atau bukan milik teacher", { slideId, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      logger.info("Database", "Mengupdate slide", { slideId, sessionId: found.session.id, updateData: body });
      const updated = await store.updateSlide(found.session.id, slideId, body);
      logger.info("Database", "Slide berhasil diupdate", { slideId, sessionId: found.session.id });

      const responseData = { slide: updated };
      logger.info("Success", "PUT slide berhasil", { slideId, sessionId: found.session.id });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, { slideId });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat PUT slide", error);
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
      const { id: slideId } = await params;
      const url = req.url;
      logRequest(logger, "DELETE", url, { slideId });

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mencari slide owner", { slideId, teacherId });
      const found = await findSlideOwner(teacherId, slideId);
      
      if (!found) {
        logger.warn("Validation", "Slide tidak ditemukan atau bukan milik teacher", { slideId, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      logger.info("Database", "Menghapus slide", { slideId, sessionId: found.session.id });
      await store.deleteSlide(found.session.id, slideId);
      logger.info("Database", "Slide berhasil dihapus", { slideId, sessionId: found.session.id });

      const responseData = { ok: true };
      logger.info("Success", "DELETE slide berhasil", { slideId, sessionId: found.session.id });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat DELETE slide", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}
