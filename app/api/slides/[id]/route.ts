import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";

type Params = Promise<{ id: string }>;

// Find which session owns this slide and verify teacher owns it
function findSlideOwner(teacherId: string, slideId: string) {
  // This is O(n) — acceptable for local dev; use a DB index in production
  const sessions = store.getSessionsByTeacher(teacherId);
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

    const found = findSlideOwner(teacherId, slideId);
    if (!found) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const body = await req.json() as {
      contentText?: string;
      imageUrl?: string;
      imageLabel?: string;
      customDuration?: number;
      customGap?: number;
    };

    const updated = store.updateSlide(found.session.id, slideId, body);
    return NextResponse.json({ slide: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id: slideId } = await params;

    const found = findSlideOwner(teacherId, slideId);
    if (!found) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    store.deleteSlide(found.session.id, slideId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
