import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";

type Params = Promise<{ id: string }>;

async function getOwnedSession(teacherId: string, sessionId: string) {
  const session = await store.getSession(sessionId);
  if (!session || session.teacherId !== teacherId) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id } = await params;
    const session = await getOwnedSession(teacherId, id);
    if (!session) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id } = await params;
    const session = await getOwnedSession(teacherId, id);
    if (!session) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    const body = await req.json() as {
      title?: string; description?: string;
      defaultDuration?: number; defaultGap?: number;
      shuffleEnabled?: boolean; showSecondsTimer?: boolean;
    };

    const updated = await store.updateSession(id, {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.defaultDuration !== undefined && { defaultDuration: body.defaultDuration }),
      ...(body.defaultGap !== undefined && { defaultGap: body.defaultGap }),
      ...(body.shuffleEnabled !== undefined && { shuffleEnabled: body.shuffleEnabled }),
      ...(body.showSecondsTimer !== undefined && { showSecondsTimer: body.showSecondsTimer }),
    });

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    const teacherId = await requireTeacherId();
    const { id } = await params;
    const session = await getOwnedSession(teacherId, id);
    if (!session) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    await store.deleteSession(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
