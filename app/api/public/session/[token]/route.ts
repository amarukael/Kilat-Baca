import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { PublicSession, PublicSlide } from "@/lib/types";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/public/session/[token]/route.ts");

type Params = Promise<{ token: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const { token } = await params;
      const url = req.url;
      logRequest(logger, "GET", url, { token });

      logger.info("Database", "Mengambil session berdasarkan token", { token });
      const session = await store.getSessionByToken(token);

      if (!session || !session.isActive) {
        logger.warn("Validation", "Session tidak ditemukan atau tidak aktif", { 
          token, 
          found: !!session, 
          isActive: session?.isActive 
        });
        const response = NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
        logResponse(logger, 404, { error: "Sesi tidak ditemukan" });
        return response;
      }

      logger.info("Database", "Session ditemukan", { 
        sessionId: session.id, 
        title: session.title, 
        slideCount: session.slides.length 
      });

      logger.info("Processing", "Sorting slides berdasarkan orderIndex");
      const sorted = [...session.slides].sort((a, b) => a.orderIndex - b.orderIndex);

      logger.info("Processing", "Mapping slides ke public format");
      const publicSlides: PublicSlide[] = sorted.map((s) => ({
        id: s.id,
        orderIndex: s.orderIndex,
        type: s.type,
        contentText: s.contentText,
        imageUrl: s.imageUrl,
        imageLabel: s.imageLabel,
        duration: s.customDuration ?? session.defaultDuration,
        gap: s.customGap ?? session.defaultGap,
      }));

      const publicSession: PublicSession = {
        id: session.id,
        title: session.title,
        defaultDuration: session.defaultDuration,
        defaultGap: session.defaultGap,
        shuffleEnabled: session.shuffleEnabled,
        showSecondsTimer: session.showSecondsTimer,
        slides: publicSlides,
      };

      logger.info("Success", "GET public session berhasil", { 
        sessionId: session.id, 
        slideCount: publicSlides.length,
        token
      });
      
      const responseData = { session: publicSession };
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, { sessionId: session.id, slideCount: publicSlides.length });
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat GET public session", error);
      const response = NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
      logResponse(logger, 500, { error: "Terjadi kesalahan" });
      return response;
    }
  });
}
