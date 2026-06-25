import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { PublicSession, PublicSlide } from "@/lib/types";

type Params = Promise<{ token: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { token } = await params;
  const session = await store.getSessionByToken(token);

  if (!session || !session.isActive) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const sorted = [...session.slides].sort((a, b) => a.orderIndex - b.orderIndex);

  const publicSlides: PublicSlide[] = sorted.map((s) => ({
    id: s.id,
    orderIndex: s.orderIndex,
    type: s.type,
    contentText: s.contentText,
    imageUrl: s.imageUrl,
    imageLabel: s.imageLabel,
    duration: s.customDuration ?? session.defaultDuration,
    gap: s.customGap ?? session.defaultGap,
  }));

  const publicSession: PublicSession = {
    id: session.id,
    title: session.title,
    defaultDuration: session.defaultDuration,
    defaultGap: session.defaultGap,
    shuffleEnabled: session.shuffleEnabled,
    showSecondsTimer: session.showSecondsTimer,
    slides: publicSlides,
  };

  return NextResponse.json({ session: publicSession });
}
