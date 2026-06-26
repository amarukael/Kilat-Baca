import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireTeacherId } from "@/lib/auth";
import { getDriveClient, DRIVE_FOLDER_ID } from "@/lib/googleDrive";
import { store } from "@/lib/store";
import { Logger, traceStorage, logRequest, logResponse } from "@/lib/logger";

const logger = new Logger("api/upload/route.ts");

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const traceId = req.headers.get("x-trace-id") || "no-trace";

  return traceStorage.run(traceId, async () => {
    logRequest(logger, req.method, req.url);

    let teacherId: string;
    let teacherEmail: string;

    try {
      logger.info("Authentication", "Memverifikasi teacher");
      teacherId = await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi", { teacherId });

      logger.info("Database", "Fetching teacher data", { teacherId });
      const teacher = await store.getTeacher(teacherId);
      if (!teacher) {
        logger.error("Error", "Teacher not found", { teacherId });
        const response = NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        logResponse(logger, 404, { error: "Teacher not found" });
        return response;
      }
      teacherEmail = teacher.email;
      logger.info("Authentication", "Teacher data loaded", { teacherEmail });
    } catch (error) {
      logger.error("Error", "Unauthorized - teacher tidak terverifikasi", { error });
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(logger, 401, { error: "Unauthorized" });
      return response;
    }

    try {
      logger.info("Request", "Parsing form data");
      const form = await req.formData();
      const file = form.get("file") as File | null;

      if (!file) {
        logger.warn("Validation", "File tidak ditemukan dalam form data");
        const response = NextResponse.json({ error: "File diperlukan" }, { status: 400 });
        logResponse(logger, 400, { error: "File diperlukan" });
        return response;
      }

      logger.info("Validation", "Validasi file", {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      const ext = ALLOWED[file.type];
      if (!ext) {
        logger.warn("Validation", "Format file tidak didukung", { fileType: file.type });
        const response = NextResponse.json({ error: "Format tidak didukung (JPG/PNG/GIF/WEBP)" }, { status: 400 });
        logResponse(logger, 400, { error: "Format tidak didukung" });
        return response;
      }

      if (file.size > MAX_SIZE) {
        logger.warn("Validation", "Ukuran file melebihi batas", { fileSize: file.size, maxSize: MAX_SIZE });
        const response = NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
        logResponse(logger, 400, { error: "Ukuran file maksimal 5MB" });
        return response;
      }

      logger.info("Processing", "Membaca file bytes");
      const bytes = await file.arrayBuffer();
      logger.info("Processing", "File bytes berhasil dibaca", { byteLength: bytes.byteLength });

      const fileName = `${randomUUID()}.${ext}`;
      logger.info("GoogleDrive", "Getting Drive client for teacher", { teacherEmail });
      let drive: Awaited<ReturnType<typeof getDriveClient>>["drive"];
      let accessToken: string;
      try {
        ({ drive, accessToken } = await getDriveClient(teacherEmail));
      } catch (error) {
        logger.error("Error", "Failed to get Drive client - OAuth not configured", { error });
        const response = NextResponse.json(
          { error: "Google Drive not configured. Please authorize access first." },
          { status: 403 }
        );
        logResponse(logger, 403, { error: "Drive not configured" });
        return response;
      }

      logger.info("GoogleDrive", "Mengupload file ke Google Drive", {
        fileName,
        mimeType: file.type,
        folderId: DRIVE_FOLDER_ID,
      });

      // Upload to Google Drive — use multipart upload via fetch to avoid Node.js stream issues
      const metadata = JSON.stringify({
        name: fileName,
        parents: [DRIVE_FOLDER_ID],
        mimeType: file.type,
      });

      const boundary = `boundary_${randomUUID().replace(/-/g, "")}`;
      const fileBuffer = Buffer.from(bytes);

      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`
        ),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--`),
      ]);


      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
            "Content-Length": String(body.length),
          },
          body,
        }
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Drive upload failed: ${uploadRes.status} ${errText}`);
      }

      const created = await uploadRes.json() as { id?: string };

      const fileId = created.id;
      if (!fileId) {
        logger.error("Error", "Gagal mendapatkan file ID dari Drive response");
        const response = NextResponse.json({ error: "Gagal mendapatkan ID file dari Drive" }, { status: 500 });
        logResponse(logger, 500, { error: "Gagal mendapatkan ID file dari Drive" });
        return response;
      }

      logger.info("GoogleDrive", "File berhasil diupload", { fileId });

      const publicUrl = `/api/drive/file/${fileId}`;
      const responseData = { url: publicUrl, name: file.name };

      logger.info("Success", "Upload berhasil", { fileId, url: publicUrl, originalName: file.name });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (err) {
      logger.error("Error", "Terjadi kesalahan saat upload", { error: err });
      const response = NextResponse.json({ error: "Gagal mengupload gambar" }, { status: 500 });
      logResponse(logger, 500, { error: "Gagal mengupload gambar" });
      return response;
    }
  });
}
