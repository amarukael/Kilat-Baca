/**
 * Telegram Bot helper — SERVER ONLY
 * Kirim notifikasi ke admin dan handle approve/reject via inline keyboard callback.
 *
 * Env vars yang dibutuhkan:
 *   TELEGRAM_BOT_TOKEN  — token dari @BotFather
 *   TELEGRAM_ADMIN_CHAT_ID — chat ID admin (dapat dari @userinfobot)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

/** Timeout per percobaan fetch (ms) */
const FETCH_TIMEOUT_MS = 8_000;
/** Jumlah maksimum percobaan */
const MAX_RETRIES = 3;

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

/**
 * Fetch ke Telegram API dengan timeout dan retry exponential backoff.
 * Hanya retry pada error jaringan (ETIMEDOUT, ECONNREFUSED, dsb).
 * Error HTTP (4xx/5xx dari Telegram) tidak di-retry.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = 500 * 2 ** (attempt - 1); // 500ms, 1000ms, 2000ms
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      clearTimeout(timer);
    }
  }
  // unreachable, tapi dibutuhkan TypeScript
  throw new Error("fetchWithRetry: batas percobaan habis");
}

/**
 * Kirim pesan teks biasa ke admin.
 */
export async function sendMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("[Telegram] BOT_TOKEN atau ADMIN_CHAT_ID belum dikonfigurasi");
    return;
  }

  const res = await fetchWithRetry(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });

  const json = await res.json() as TelegramResponse;
  if (!json.ok) {
    console.error("[Telegram] Gagal kirim pesan:", json.description);
  }
}

/**
 * Kirim notifikasi pendaftaran baru ke admin dengan tombol Approve / Reject.
 */
export async function notifyNewRegistration(teacher: {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}): Promise<void> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("[Telegram] BOT_TOKEN atau ADMIN_CHAT_ID belum dikonfigurasi");
    return;
  }

  const text =
    `<b>📋 Pendaftaran Baru</b>\n\n` +
    `Nama: <b>${escapeHtml(teacher.name)}</b>\n` +
    `Email: <code>${escapeHtml(teacher.email)}</code>\n` +
    `Waktu: ${new Date(teacher.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n\n` +
    `Setujui atau tolak akun ini:`;

  const res = await fetchWithRetry(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Approve", callback_data: `approve:${teacher.id}` },
            { text: "❌ Reject", callback_data: `reject:${teacher.id}` },
          ],
        ],
      },
    }),
  });

  const json = await res.json() as TelegramResponse;
  if (!json.ok) {
    console.error("[Telegram] Gagal kirim notifikasi registrasi:", json.description);
  }
}

/**
 * Jawab callback query (hilangkan loading spinner di tombol).
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
): Promise<void> {
  if (!BOT_TOKEN) return;

  await fetchWithRetry(`${API_BASE}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: false,
    }),
  });
}

/**
 * Edit pesan yang sudah terkirim (untuk update tombol setelah approve/reject).
 */
export async function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
): Promise<void> {
  if (!BOT_TOKEN) return;

  await fetchWithRetry(`${API_BASE}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
