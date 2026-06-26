import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/googleDrive";
import { Logger, traceStorage } from "@/lib/logger";

const logger = new Logger("api/drive/file/[fileId]/route.ts");

type Params = Promise<{ fileId: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";

  return traceStorage.run(traceId, async () => {
    try {
      const { fileId } = await params;

      if (!fileId) {
        return NextResponse.json({ error: "File ID tidak valid" }, { status: 400 });
      }

      logger.info("GoogleDrive", "Mengambil file dari Drive", { fileId });

      // Get access token — handles refresh automatically
      const accessToken = await getAccessToken();

      // Fetch file metadata to get mimeType
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!metaRes.ok) {
        logger.error("GoogleDrive", "Gagal mengambil metadata file", { fileId, status: metaRes.status });
        return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
      }

      const meta = await metaRes.json() as { mimeType?: string; name?: string };

      // Fetch file content
      const fileRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!fileRes.ok) {
        logger.error("GoogleDrive", "Gagal mengambil konten file", { fileId, status: fileRes.status });
        return NextResponse.json({ error: "Gagal mengambil file" }, { status: fileRes.status });
      }

      logger.info("GoogleDrive", "File berhasil diambil", { fileId, mimeType: meta.mimeType });

      // Stream file back to client
      const headers = new Headers();
      headers.set("Content-Type", meta.mimeType ?? "application/octet-stream");
      headers.set("Cache-Control", "private, max-age=3600");

      return new NextResponse(fileRes.body, { status: 200, headers });
    } catch (error) {
      logger.error("Error", "Terjadi kesalahan saat mengambil file Drive", { error });
      return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
    }
  });
}
