import { supabase } from "./supabase";
import type { Teacher, Session, Slide } from "./types";

// ── DB row types (snake_case from Postgres) ──────────────────────────────────

interface TeacherRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  status: "pending" | "active" | "rejected";
  created_at: string;
}

interface SessionRow {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  default_duration: number;
  default_gap: number;
  shuffle_enabled: boolean;
  show_seconds_timer: boolean;
  share_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SlideRow {
  id: string;
  session_id: string;
  order_index: number;
  type: "text" | "image";
  content_text: string | null;
  image_url: string | null;
  image_label: string | null;
  custom_duration: number | null;
  custom_gap: number | null;
  created_at: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function toTeacher(row: TeacherRow): Teacher {
  return { id: row.id, email: row.email, name: row.name, status: row.status, createdAt: row.created_at };
}

function toSlide(row: SlideRow): Slide {
  return {
    id: row.id,
    sessionId: row.session_id,
    orderIndex: row.order_index,
    type: row.type,
    contentText: row.content_text ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageLabel: row.image_label ?? undefined,
    customDuration: row.custom_duration ?? undefined,
    customGap: row.custom_gap ?? undefined,
    createdAt: row.created_at,
  };
}

function toSession(row: SessionRow, slides: SlideRow[]): Session {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    title: row.title,
    description: row.description,
    defaultDuration: row.default_duration,
    defaultGap: row.default_gap,
    shuffleEnabled: row.shuffle_enabled,
    showSecondsTimer: row.show_seconds_timer,
    shareToken: row.share_token,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slides: slides.map(toSlide),
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const store = {
  // ── Teachers ──────────────────────────────────────────────────────────────

  async createTeacher(email: string, passwordHash: string, name: string): Promise<Teacher> {
    const { data, error } = await supabase
      .from("teachers")
      .insert({ email, name, password_hash: passwordHash, status: "pending" })
      .select()
      .single<TeacherRow>();
    if (error) {
      if (error.code === "23505") throw new Error("Email sudah terdaftar");
      throw error;
    }
    return toTeacher(data);
  },

  async getTeacherById(id: string): Promise<Teacher | undefined> {
    const { data } = await supabase
      .from("teachers")
      .select()
      .eq("id", id)
      .single<TeacherRow>();
    if (!data) return undefined;
    return toTeacher(data);
  },

  async approveTeacher(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("teachers")
      .update({ status: "active" })
      .eq("id", id);
    return !error;
  },

  async rejectTeacher(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("teachers")
      .update({ status: "rejected" })
      .eq("id", id);
    return !error;
  },

  async getTeacherByEmail(email: string): Promise<(TeacherRow & { passwordHash: string }) | undefined> {
    const { data } = await supabase
      .from("teachers")
      .select()
      .eq("email", email.toLowerCase())
      .single<TeacherRow>();
    if (!data) return undefined;
    return { ...data, passwordHash: data.password_hash };
  },

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const { data } = await supabase
      .from("teachers")
      .select()
      .eq("id", id)
      .single<TeacherRow>();
    return data ? toTeacher(data) : undefined;
  },

  // ── Auth sessions ──────────────────────────────────────────────────────────

  async createAuthSession(teacherId: string): Promise<string> {
    const { data, error } = await supabase
      .from("auth_sessions")
      .insert({ teacher_id: teacherId })
      .select("token")
      .single<{ token: string }>();
    if (error) throw error;
    return data.token;
  },

  async getTeacherIdFromSession(token: string): Promise<string | undefined> {
    const { data } = await supabase
      .from("auth_sessions")
      .select("teacher_id")
      .eq("token", token)
      .single<{ teacher_id: string }>();
    return data?.teacher_id;
  },

  async deleteAuthSession(token: string): Promise<void> {
    await supabase.from("auth_sessions").delete().eq("token", token);
  },

  // ── Sessions ───────────────────────────────────────────────────────────────

  async createSession(teacherId: string, title: string, description: string): Promise<Session> {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ teacher_id: teacherId, title, description })
      .select()
      .single<SessionRow>();
    if (error) throw error;
    return toSession(data, []);
  },

  async getSession(id: string): Promise<Session | undefined> {
    const { data: row } = await supabase
      .from("sessions")
      .select()
      .eq("id", id)
      .single<SessionRow>();
    if (!row) return undefined;

    const { data: slides } = await supabase
      .from("slides")
      .select()
      .eq("session_id", id)
      .order("order_index");
    return toSession(row, (slides ?? []) as SlideRow[]);
  },

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const { data: row } = await supabase
      .from("sessions")
      .select()
      .eq("share_token", token)
      .single<SessionRow>();
    if (!row) return undefined;

    const { data: slides } = await supabase
      .from("slides")
      .select()
      .eq("session_id", row.id)
      .order("order_index");
    return toSession(row, (slides ?? []) as SlideRow[]);
  },

  async getSessionsByTeacher(teacherId: string): Promise<Session[]> {
    const { data: rows } = await supabase
      .from("sessions")
      .select()
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (!rows?.length) return [];

    const sessionIds = (rows as SessionRow[]).map((r) => r.id);
    const { data: allSlides } = await supabase
      .from("slides")
      .select()
      .in("session_id", sessionIds)
      .order("order_index");

    const slidesBySession = new Map<string, SlideRow[]>();
    for (const slide of (allSlides ?? []) as SlideRow[]) {
      const arr = slidesBySession.get(slide.session_id) ?? [];
      arr.push(slide);
      slidesBySession.set(slide.session_id, arr);
    }

    return (rows as SessionRow[]).map((row) =>
      toSession(row, slidesBySession.get(row.id) ?? [])
    );
  },

  async updateSession(
    id: string,
    updates: Partial<Omit<Session, "id" | "teacherId" | "shareToken" | "createdAt" | "slides">>,
  ): Promise<Session | undefined> {
    const patch: Partial<SessionRow> = {};
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.defaultDuration !== undefined) patch.default_duration = updates.defaultDuration;
    if (updates.defaultGap !== undefined) patch.default_gap = updates.defaultGap;
    if (updates.shuffleEnabled !== undefined) patch.shuffle_enabled = updates.shuffleEnabled;
    if (updates.showSecondsTimer !== undefined) patch.show_seconds_timer = updates.showSecondsTimer;
    if (updates.isActive !== undefined) patch.is_active = updates.isActive;
    patch.updated_at = new Date().toISOString();

    const { data: row, error } = await supabase
      .from("sessions")
      .update(patch)
      .eq("id", id)
      .select()
      .single<SessionRow>();
    if (error || !row) return undefined;

    const { data: slides } = await supabase
      .from("slides")
      .select()
      .eq("session_id", id)
      .order("order_index");
    return toSession(row, (slides ?? []) as SlideRow[]);
  },

  async deleteSession(id: string): Promise<boolean> {
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    return !error;
  },

  // ── Slides ─────────────────────────────────────────────────────────────────

  async addSlide(
    sessionId: string,
    slideData: Omit<Slide, "id" | "sessionId" | "orderIndex" | "createdAt">,
  ): Promise<Slide | undefined> {
    // Get current max order_index
    const { data: existing } = await supabase
      .from("slides")
      .select("order_index")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single<{ order_index: number }>();

    const orderIndex = existing ? existing.order_index + 1 : 0;

    const { data, error } = await supabase
      .from("slides")
      .insert({
        session_id: sessionId,
        order_index: orderIndex,
        type: slideData.type,
        content_text: slideData.contentText ?? null,
        image_url: slideData.imageUrl ?? null,
        image_label: slideData.imageLabel ?? null,
        custom_duration: slideData.customDuration ?? null,
        custom_gap: slideData.customGap ?? null,
      })
      .select()
      .single<SlideRow>();
    if (error) return undefined;
    return toSlide(data);
  },

  async updateSlide(
    _sessionId: string,
    slideId: string,
    updates: Partial<Omit<Slide, "id" | "sessionId" | "createdAt">>,
  ): Promise<Slide | undefined> {
    const patch: Partial<SlideRow> = {};
    if (updates.contentText !== undefined) patch.content_text = updates.contentText;
    if (updates.imageUrl !== undefined) patch.image_url = updates.imageUrl;
    if (updates.imageLabel !== undefined) patch.image_label = updates.imageLabel;
    if (updates.customDuration !== undefined) patch.custom_duration = updates.customDuration;
    if (updates.customGap !== undefined) patch.custom_gap = updates.customGap;
    if (updates.orderIndex !== undefined) patch.order_index = updates.orderIndex;

    const { data, error } = await supabase
      .from("slides")
      .update(patch)
      .eq("id", slideId)
      .select()
      .single<SlideRow>();
    if (error || !data) return undefined;
    return toSlide(data);
  },

  async deleteSlide(sessionId: string, slideId: string): Promise<boolean> {
    const { error } = await supabase.from("slides").delete().eq("id", slideId);
    if (error) return false;

    // Re-number remaining slides
    const { data: remaining } = await supabase
      .from("slides")
      .select("id")
      .eq("session_id", sessionId)
      .order("order_index");

    if (remaining?.length) {
      await Promise.all(
        (remaining as { id: string }[]).map((s, i) =>
          supabase.from("slides").update({ order_index: i }).eq("id", s.id)
        )
      );
    }
    return true;
  },

  async reorderSlides(sessionId: string, slideIds: string[]): Promise<boolean> {
    await Promise.all(
      slideIds.map((id, i) =>
        supabase.from("slides").update({ order_index: i }).eq("id", id).eq("session_id", sessionId)
      )
    );
    return true;
  },
};
