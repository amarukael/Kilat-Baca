import { NextRequest, NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
const BUCKET = "slide-images";

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
    const path = `${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: "Gagal mengupload gambar" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: urlData.publicUrl, name: file.name });
  } catch {
    return NextResponse.json({ error: "Gagal memproses file" }, { status: 500 });
  }
}
