import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import { requireTeacherId } from "@/lib/auth";
import { drive, DRIVE_FOLDER_ID } from "@/lib/gdrive";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  try {
    await requireTeacherId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "File diperlukan" }, { status: 400 });
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Format tidak didukung (JPG/PNG/GIF/WEBP)" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    // Upload to Google Drive
    const created = await drive.files.create({
      requestBody: {
        name: `${randomUUID()}.${ext}`,
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
      return NextResponse.json({ error: "Gagal mendapatkan ID file dari Drive" }, { status: 500 });
    }

    // Make file publicly readable
    await drive.permissions.create({
      fileId,
      requestBody: { type: "anyone", role: "reader" },
    });

    const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
    return NextResponse.json({ url, name: file.name });
  } catch (err) {
    console.error("Drive upload error:", err);
    return NextResponse.json({ error: "Gagal mengupload gambar" }, { status: 500 });
  }
}
