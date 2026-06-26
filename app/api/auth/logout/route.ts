import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/auth";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/auth/logout/route.ts");

export async function POST(req: NextRequest) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";
  
  return traceStorage.run(traceId, async () => {
    try {
      const url = req.url;
      logRequest(logger, "POST", url);

      logger.info("Cookie", "Mengambil session cookie");
      const jar = await cookies();
      const token = jar.get(SESSION_COOKIE)?.value;
      
      if (token) {
        logger.info("Database", "Menghapus auth session", { tokenLength: token.length });
        await store.deleteAuthSession(token);
        logger.info("Database", "Auth session berhasil dihapus");
        
        logger.info("Cookie", "Menghapus session cookie");
        jar.delete(SESSION_COOKIE);
      } else {
        logger.warn("Cookie", "Tidak ada session cookie ditemukan");
      }

      const responseData = { ok: true };
      logger.info("Success", "Logout berhasil");
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat logout", error);
      const response = NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
      logResponse(logger, 500, { error: "Terjadi kesalahan" });
      return response;
    }
  });
}
