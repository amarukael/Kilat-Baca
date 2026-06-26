/**
 * Telegram Bot Webhook — POST /api/telegram/webhook
 *
 * Menerima callback dari inline keyboard bot (approve/reject teacher).
 * Daftarkan webhook ke Telegram dengan:
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook"
 *
 * Keamanan: verifikasi X-Telegram-Bot-Api-Secret-Token header (opsional tapi disarankan).
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { answerCallbackQuery, editMessageText, sendMessage } from "@/lib/telegram";
import { Logger } from "@/lib/logger";

const logger = new Logger("api/telegram/webhook/route.ts");

interface TelegramCallbackQuery {
  id: string;
  from: { id: number; first_name: string };
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
  message?: {
    chat: { id: number };
    text?: string;
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as TelegramUpdate;

    // Handle pesan teks (contoh: /start)
    if (body.message?.text === "/start") {
      await sendMessage("Bot aktif. Notifikasi pendaftaran baru akan muncul di sini.");
      return NextResponse.json({ ok: true });
    }

    // Handle callback dari inline keyboard
    const cb = body.callback_query;
    if (!cb?.data) {
      return NextResponse.json({ ok: true });
    }

    const [action, teacherId] = cb.data.split(":");

    if (!teacherId || (action !== "approve" && action !== "reject")) {
      await answerCallbackQuery(cb.id, "Aksi tidak dikenal.");
      return NextResponse.json({ ok: true });
    }

    // Ambil data teacher
    const teacher = await store.getTeacherById(teacherId);
    if (!teacher) {
      await answerCallbackQuery(cb.id, "Teacher tidak ditemukan.");
      return NextResponse.json({ ok: true });
    }

    if (teacher.status !== "pending") {
      await answerCallbackQuery(cb.id, `Akun ini sudah diproses (${teacher.status}).`);
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      logger.info("Telegram", "Approve teacher", { teacherId });
      const ok = await store.approveTeacher(teacherId);

      if (ok) {
        await answerCallbackQuery(cb.id, "✅ Akun disetujui!");
        if (cb.message) {
          await editMessageText(
            cb.message.chat.id,
            cb.message.message_id,
            `✅ <b>Disetujui</b>\n\nNama: <b>${teacher.name}</b>\nEmail: <code>${teacher.email}</code>\n\nAkun telah diaktifkan.`,
          );
        }
      } else {
        await answerCallbackQuery(cb.id, "Gagal menyetujui akun.");
      }
    } else {
      logger.info("Telegram", "Reject teacher", { teacherId });
      const ok = await store.rejectTeacher(teacherId);

      if (ok) {
        await answerCallbackQuery(cb.id, "❌ Akun ditolak.");
        if (cb.message) {
          await editMessageText(
            cb.message.chat.id,
            cb.message.message_id,
            `❌ <b>Ditolak</b>\n\nNama: <b>${teacher.name}</b>\nEmail: <code>${teacher.email}</code>\n\nAkun telah ditolak.`,
          );
        }
      } else {
        await answerCallbackQuery(cb.id, "Gagal menolak akun.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Error", "Webhook error", err);
    // Selalu return 200 ke Telegram agar tidak retry terus
    return NextResponse.json({ ok: true });
  }
}
