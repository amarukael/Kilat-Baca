import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id: sessionId } = await params;

    const session = store.getSession(sessionId);
    if (!session || session.teacherId !== teacherId) {
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json() as {
      type: "text" | "image";
      contentText?: string;
      imageUrl?: string;
      imageLabel?: string;
      customDuration?: number;
      customGap?: number;
    };

    if (body.type === "text" && !body.contentText?.trim()) {
      return NextResponse.json({ error: "Teks tidak boleh kosong" }, { status: 400 });
    }
    if (body.type === "image" && !body.imageUrl) {
      return NextResponse.json({ error: "Gambar diperlukan" }, { status: 400 });
    }

    const slide = store.addSlide(sessionId, {
      type: body.type,
      contentText: body.contentText,
      imageUrl: body.imageUrl,
      imageLabel: body.imageLabel,
      customDuration: body.customDuration,
      customGap: body.customGap,
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// Reorder slides
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id: sessionId } = await params;

    const session = store.getSession(sessionId);
    if (!session || session.teacherId !== teacherId) {
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    }

    const { slideIds } = await req.json() as { slideIds?: string[] };
    if (!Array.isArray(slideIds)) {
      return NextResponse.json({ error: "slideIds harus berupa array" }, { status: 400 });
    }

    const ok = store.reorderSlides(sessionId, slideIds);
    if (!ok) return NextResponse.json({ error: "Gagal mengubah urutan" }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
