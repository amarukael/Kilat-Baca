import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { store } from "./store";

export const SESSION_COOKIE = "mctk_auth";

export async function getTeacherId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return (await store.getTeacherIdFromSession(token)) ?? null;
}

export async function requireTeacherId(): Promise<string> {
  const id = await getTeacherId();
  if (!id) throw new Error("Unauthorized");
  return id;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  try {
    const attempt = scryptSync(password, salt, 64);
    return timingSafeEqual(attempt, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}
