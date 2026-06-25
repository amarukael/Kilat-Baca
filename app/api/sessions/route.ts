import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requireTeacherId } from "@/lib/auth";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const sessions = store.getSessionsByTeacher(teacherId);
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const teacherId = await requireTeacherId();
    const { title, description = "" } = await req.json() as { title?: string; description?: string };
    if (!title?.trim()) {
      return NextResponse.json({ error: "Nama sesi wajib diisi" }, { status: 400 });
    }
    const session = store.createSession(teacherId, title.trim(), description);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    const status = err instanceof Error && err.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status });
  }
}
