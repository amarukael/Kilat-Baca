import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import { requireTeacherId } from "@/lib/auth";
import { drive, DRIVE_FOLDER_ID } from "@/lib/googleDrive";
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
    const url = req.url;
    logRequest(logger, "POST", url);

    try {
      logger.info("Authentication", "Memverifikasi teacher");
      await requireTeacherId();
      logger.info("Authentication", "Teacher terverifikasi");
    } catch (error) {
      logger.error("Authentication", "Unauthorized - teacher tidak terverifikasi", error);
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
        fileSize: file.size 
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

      logger.info("File", "Membaca file bytes");
      const bytes = await file.arrayBuffer();
      logger.info("File", "File bytes berhasil dibaca", { byteLength: bytes.byteLength });

      const fileName = `${randomUUID()}.${ext}`;
      logger.info("GoogleDrive", "Mengupload file ke Google Drive", { 
        fileName, 
        mimeType: file.type, 
        folderId: DRIVE_FOLDER_ID 
      });

      // Upload to Google Drive
      const created = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [DRIVE_FOLDER_ID],
          mimeType: file.type,
        },
        media: {
          mimeType: file.type,
          body: Readable.from(Buffer.from(bytes)),
        },
        fields: "id",
      });

      const fileId = created.data.id;
      if (!fileId) {
        logger.error("GoogleDrive", "Gagal mendapatkan file ID dari Drive response");
        const response = NextResponse.json({ error: "Gagal mendapatkan ID file dari Drive" }, { status: 500 });
        logResponse(logger, 500, { error: "Gagal mendapatkan ID file dari Drive" });
        return response;
      }

      logger.info("GoogleDrive", "File berhasil diupload", { fileId });

      logger.info("GoogleDrive", "Setting permissions ke public", { fileId });
      // Make file publicly readable
      await drive.permissions.create({
        fileId,
        requestBody: { type: "anyone", role: "reader" },
      });
      logger.info("GoogleDrive", "Permissions berhasil di-set", { fileId });

      const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      const responseData = { url: publicUrl, name: file.name };
      
      logger.info("Success", "Upload berhasil", { fileId, url: publicUrl, originalName: file.name });
      const response = NextResponse.json(responseData);
      logResponse(logger, 200, responseData);
      return response;
    } catch (err) {
      logger.error("Error", "Terjadi kesalahan saat upload", err);
      const response = NextResponse.json({ error: "Gagal mengupload gambar" }, { status: 500 });
      logResponse(logger, 500, { error: "Gagal mengupload gambar" });
      return response;
    }
  });
}
