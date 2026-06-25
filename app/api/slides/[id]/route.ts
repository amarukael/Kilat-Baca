import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";

type Params = Promise<{ id: string }>;

// Find which session owns this slide and verify teacher owns it
async function findSlideOwner(teacherId: string, slideId: string) {
  const sessions = await store.getSessionsByTeacher(teacherId);
  for (const session of sessions) {
    const slide = session.slides.find((s) => s.id === slideId);
    if (slide) return { session, slide };
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id: slideId } = await params;

    const found = await findSlideOwner(teacherId, slideId);
    if (!found) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const body = await req.json() as {
      contentText?: string;
      imageUrl?: string;
      imageLabel?: string;
      customDuration?: number;
      customGap?: number;
    };

    const updated = await store.updateSlide(found.session.id, slideId, body);
    return NextResponse.json({ slide: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id: slideId } = await params;

    const found = await findSlideOwner(teacherId, slideId);
    if (!found) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    await store.deleteSlide(found.session.id, slideId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
