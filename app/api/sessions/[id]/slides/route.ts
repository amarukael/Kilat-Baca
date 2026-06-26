import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/sessions/[id]/slides/route.ts");

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const { id: sessionId } = await params;
      const url = req.url;
      const body = await req.json() as {
        type: "text" | "image";
        contentText?: string;
        imageUrl?: string;
        imageLabel?: string;
        customDuration?: number;
        customGap?: number;
      };
      logRequest(logger, "POST", url, { sessionId }, body);

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mengambil session untuk verifikasi ownership", { sessionId, teacherId });
      const session = await store.getSession(sessionId);
      
      if (!session || session.teacherId !== teacherId) {
        logger.warn("Validation", "Session tidak ditemukan atau bukan milik teacher", { sessionId, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      if (body.type === "text" && !body.contentText?.trim()) {
        logger.warn("Validation", "Teks slide kosong");
        const response = NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
        logResponse(logger, 400, { error: "Teks tidak boleh kosong" });
        return response;
      }
      
      if (body.type === "image" && !body.imageUrl) {
        logger.warn("Validation", "Image URL kosong");
        const response = NextResponse.json({ error: "Gambar diperlukan" }, { status: 400 });
        logResponse(logger, 400, { error: "Gambar diperlukan" });
        return response;
      }

      logger.info("Database", "Menambahkan slide baru", { sessionId, type: body.type });
      const slide = await store.addSlide(sessionId, {
        type: body.type,
        contentText: body.contentText,
        imageUrl: body.imageUrl,
        imageLabel: body.imageLabel,
        customDuration: body.customDuration,
        customGap: body.customGap,
      });
      
      if (!slide) {
        logger.error("Database", "Gagal menambahkan slide ke database", { sessionId });
        const response = NextResponse.json({ error: "Gagal menambahkan slide" }, { status: 500 });
        logResponse(logger, 500, { error: "Gagal menambahkan slide" });
        return response;
      }
      
      logger.info("Database", "Slide berhasil ditambahkan", { slideId: slide.id, sessionId });

      const responseData = { slide };
      logger.info("Success", "POST slide berhasil", { slideId: slide.id, sessionId });
      const response = NextResponse.json(responseData, { status: 201 });
      logResponse(logger, 201, { slideId: slide.id });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat POST slide", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}

// Reorder slides
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const { id: sessionId } = await params;
      const url = req.url;
      const body = await req.json() as { slideIds?: string[] };
      logRequest(logger, "PUT", url, { sessionId }, body);

      logger.info("Authentication", "Memverifikasi teacher");
      const teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Mengambil session untuk verifikasi ownership", { sessionId, teacherId });
      const session = await store.getSession(sessionId);
      
      if (!session || session.teacherId !== teacherId) {
        logger.warn("Validation", "Session tidak ditemukan atau bukan milik teacher", { sessionId, teacherId });
        const response = NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Tidak ditemukan" });
        return response;
      }

      const { slideIds } = body;
      
      if (!Array.isArray(slideIds)) {
        logger.warn("Validation", "slideIds bukan array");
        const response = NextResponse.json({ error: "slideIds harus berupa array" }, { status: 400 });
        logResponse(logger, 400, { error: "slideIds harus berupa array" });
        return response;
      }

      logger.info("Database", "Reordering slides", { sessionId, slideCount: slideIds.length });
      const ok = await store.reorderSlides(sessionId, slideIds);
      
      if (!ok) {
        logger.warn("Database", "Gagal mengubah urutan slides", { sessionId });
        const response = NextResponse.json({ error: "Gagal mengubah urutan" }, { status: 400 });
        logResponse(logger, 400, { error: "Gagal mengubah urutan" });
        return response;
      }

      logger.info("Database", "Slides berhasil direorder", { sessionId, slideCount: slideIds.length });
      const responseData = { ok: true };
      logger.info("Success", "PUT reorder slides berhasil", { sessionId });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat PUT reorder slides", error);
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }
  });
}
