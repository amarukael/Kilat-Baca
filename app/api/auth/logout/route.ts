import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await store.deleteAuthSession(token);
    jar.delete(SESSION_COOKIE);
  }
  return NextResponse.json({ ok: true });
}
