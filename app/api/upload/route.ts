import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
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
    logRequest(req);

    let teacherId: string;
    let teacherEmail: string;

    try {
      logger.log("Authentication", "Memverifikasi teacher");
      teacherId = await requireTeacherId(req);
      logger.log("Authentication", "Teacher terverifikasi", { teacherId });

      logger.log("Database", "Fetching teacher data", { teacherId });
      const teacher = await store.getTeacher(teacherId);
      if (!teacher) {
        logger.log("Error", "Teacher not found", { teacherId });
        const response = NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        logResponse(response, { error: "Teacher not found" });
        return response;
      }
      teacherEmail = teacher.email;
      logger.log("Authentication", "Teacher data loaded", { teacherEmail });
    } catch (error) {
      logger.log("Error", "Unauthorized - teacher tidak terverifikasi", { error });
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      logResponse(response, { error: "Unauthorized" });
      return response;
    }

    try {
      logger.info("Request", "Parsing form data");
      const form = await req.formData();
      const file = form.get("file") as File | null;

      if (!file) {
        logger.log("Validation", "File tidak ditemukan dalam form data");
        const response = NextResponse.json({ error: "File diperlukan" }, { status: 400 });
        logResponse(response, { error: "File diperlukan" });
        return response;
      }

      logger.log("Validation", "Validasi file", { 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size 
      });

      const ext = ALLOWED[file.type];
      if (!ext) {
        logger.log("Validation", "Format file tidak didukung", { fileType: file.type });
        const response = NextResponse.json({ error: "Format tidak didukung (JPG/PNG/GIF/WEBP)" }, { status: 400 });
        logResponse(response, { error: "Format tidak didukung" });
        return response;
      }
      
      if (file.size > MAX_SIZE) {
        logger.log("Validation", "Ukuran file melebihi batas", { fileSize: file.size, maxSize: MAX_SIZE });
        const response = NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
        logResponse(response, { error: "Ukuran file maksimal 5MB" });
        return response;
      }

      logger.log("Processing", "Membaca file bytes");
      const bytes = await file.arrayBuffer();
      logger.log("Processing", "File bytes berhasil dibaca", { byteLength: bytes.byteLength });

      const fileName = `${randomUUID()}.${ext}`;
      logger.log("GoogleDrive", "Getting Drive client for teacher", { teacherEmail });
      let drive;
      try {
        drive = await getDriveClient(teacherEmail);
      } catch (error) {
        logger.log("Error", "Failed to get Drive client - OAuth not configured", { error });
        const response = NextResponse.json(
          { error: "Google Drive not configured. Please authorize access first." },
          { status: 403 }
        );
        logResponse(response, { error: "Drive not configured" });
        return response;
      }

      logger.log("GoogleDrive", "Mengupload file ke Google Drive", { 
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
        logger.log("Error", "Gagal mendapatkan file ID dari Drive response");
        const response = NextResponse.json({ error: "Gagal mendapatkan ID file dari Drive" }, { status: 500 });
        logResponse(response, { error: "Gagal mendapatkan ID file dari Drive" });
        return response;
      }

      logger.log("GoogleDrive", "File berhasil diupload", { fileId });

      logger.log("GoogleDrive", "Setting permissions ke public", { fileId });
      // Make file publicly readable
      await drive.permissions.create({
        fileId,
        requestBody: { type: "anyone", role: "reader" },
      });
      logger.log("GoogleDrive", "Permissions berhasil di-set", { fileId });

      const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      const responseData = { url: publicUrl, name: file.name };
      
      logger.log("Success", "Upload berhasil", { fileId, url: publicUrl, originalName: file.name });
      const response = NextResponse.json(responseData);
      logResponse(response, responseData);
      return response;
    } catch (err) {
      logger.log("Error", "Terjadi kesalahan saat upload", { error: err });
      const response = NextResponse.json({ error: "Gagal mengupload gambar" }, { status: 500 });
      logResponse(response, { error: "Gagal mengupload gambar" });
      return response;
    }
  });
}
