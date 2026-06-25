// NOTE: File-based store for local development.
// Replace with Supabase (see PRD §6) for production.
// WARNING: Concurrent writes are not safe — single-dev local use only.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type { Teacher, Session, Slide } from "./types";

const DATA_DIR = join(process.cwd(), ".local-data");
const DATA_FILE = join(DATA_DIR, "store.json");

interface TeacherRow extends Teacher {
  passwordHash: string;
}

interface StoreData {
  teachers: Record<string, TeacherRow>;
  sessions: Record<string, Session>;
  authSessions: Record<string, string>; // token → teacherId
  emailIndex: Record<string, string>;   // email.lower → teacherId
  tokenIndex: Record<string, string>;   // shareToken → sessionId
}

function empty(): StoreData {
  return { teachers: {}, sessions: {}, authSessions: {}, emailIndex: {}, tokenIndex: {} };
}

function load(): StoreData {
  try {
    if (!existsSync(DATA_FILE)) return empty();
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as StoreData;
  } catch {
    return empty();
  }
}

function save(data: StoreData): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function stripPassword(t: TeacherRow): Teacher {
  return { id: t.id, email: t.email, name: t.name, createdAt: t.createdAt };
}

export const store = {
  // ── Teachers ──────────────────────────────────────────────────────────────

  createTeacher(email: string, passwordHash: string, name: string): Teacher {
    const data = load();
    if (data.emailIndex[email.toLowerCase()]) throw new Error("Email sudah terdaftar");
    const id = randomUUID();
    const now = new Date().toISOString();
    const row: TeacherRow = { id, email, name, passwordHash, createdAt: now };
    data.teachers[id] = row;
    data.emailIndex[email.toLowerCase()] = id;
    save(data);
    return stripPassword(row);
  },

  getTeacherByEmail(email: string): TeacherRow | undefined {
    const data = load();
    const id = data.emailIndex[email.toLowerCase()];
    return id ? data.teachers[id] : undefined;
  },

  getTeacher(id: string): Teacher | undefined {
    const data = load();
    const row = data.teachers[id];
    return row ? stripPassword(row) : undefined;
  },

  // ── Auth sessions ──────────────────────────────────────────────────────────

  createAuthSession(teacherId: string): string {
    const data = load();
    const token = randomUUID();
    data.authSessions[token] = teacherId;
    save(data);
    return token;
  },

  getTeacherIdFromSession(token: string): string | undefined {
    const data = load();
    return data.authSessions[token];
  },

  deleteAuthSession(token: string): void {
    const data = load();
    delete data.authSessions[token];
    save(data);
  },

  // ── Sessions ───────────────────────────────────────────────────────────────

  createSession(teacherId: string, title: string, description: string): Session {
    const data = load();
    const id = randomUUID();
    const shareToken = randomUUID();
    const now = new Date().toISOString();
    const session: Session = {
      id, teacherId, title, description,
      defaultDuration: 5, defaultGap: 1,
      shuffleEnabled: false, showSecondsTimer: true,
      shareToken, isActive: true,
      createdAt: now, updatedAt: now, slides: [],
    };
    data.sessions[id] = session;
    data.tokenIndex[shareToken] = id;
    save(data);
    return session;
  },

  getSession(id: string): Session | undefined {
    const data = load();
    return data.sessions[id];
  },

  getSessionByToken(token: string): Session | undefined {
    const data = load();
    const id = data.tokenIndex[token];
    return id ? data.sessions[id] : undefined;
  },

  getSessionsByTeacher(teacherId: string): Session[] {
    const data = load();
    return Object.values(data.sessions)
      .filter((s) => s.teacherId === teacherId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateSession(
    id: string,
    updates: Partial<Omit<Session, "id" | "teacherId" | "shareToken" | "createdAt" | "slides">>,
  ): Session | undefined {
    const data = load();
    const session = data.sessions[id];
    if (!session) return undefined;
    const updated: Session = { ...session, ...updates, updatedAt: new Date().toISOString() };
    data.sessions[id] = updated;
    save(data);
    return updated;
  },

  deleteSession(id: string): boolean {
    const data = load();
    const session = data.sessions[id];
    if (!session) return false;
    delete data.tokenIndex[session.shareToken];
    delete data.sessions[id];
    save(data);
    return true;
  },

  // ── Slides ─────────────────────────────────────────────────────────────────

  addSlide(
    sessionId: string,
    slideData: Omit<Slide, "id" | "sessionId" | "orderIndex" | "createdAt">,
  ): Slide | undefined {
    const data = load();
    const session = data.sessions[sessionId];
    if (!session) return undefined;
    const slide: Slide = {
      id: randomUUID(),
      sessionId,
      orderIndex: session.slides.length,
      createdAt: new Date().toISOString(),
      ...slideData,
    };
    session.slides.push(slide);
    session.updatedAt = new Date().toISOString();
    save(data);
    return slide;
  },

  updateSlide(
    sessionId: string,
    slideId: string,
    updates: Partial<Omit<Slide, "id" | "sessionId" | "createdAt">>,
  ): Slide | undefined {
    const data = load();
    const session = data.sessions[sessionId];
    if (!session) return undefined;
    const idx = session.slides.findIndex((s) => s.id === slideId);
    if (idx === -1) return undefined;
    session.slides[idx] = { ...session.slides[idx], ...updates };
    session.updatedAt = new Date().toISOString();
    save(data);
    return session.slides[idx];
  },

  deleteSlide(sessionId: string, slideId: string): boolean {
    const data = load();
    const session = data.sessions[sessionId];
    if (!session) return false;
    const before = session.slides.length;
    session.slides = session.slides.filter((s) => s.id !== slideId);
    if (session.slides.length === before) return false;
    session.slides.forEach((s, i) => { s.orderIndex = i; });
    session.updatedAt = new Date().toISOString();
    save(data);
    return true;
  },

  reorderSlides(sessionId: string, slideIds: string[]): boolean {
    const data = load();
    const session = data.sessions[sessionId];
    if (!session) return false;
    const map = new Map(session.slides.map((s) => [s.id, s]));
    const reordered: Slide[] = [];
    for (const id of slideIds) {
      const s = map.get(id);
      if (!s) return false;
      reordered.push(s);
    }
    reordered.forEach((s, i) => { s.orderIndex = i; });
    session.slides = reordered;
    session.updatedAt = new Date().toISOString();
    save(data);
    return true;
  },
};
