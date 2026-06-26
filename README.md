# Kilat Baca

Media pembelajaran membaca cepat berbasis web untuk anak Taman Kanak-Kanak (4–6 tahun). Guru menyiapkan sesi flash card visual; murid mengikuti sesi melalui link tanpa perlu login.

## Cara Kerja

1. Guru login ke dashboard, buat sesi, dan upload slide (gambar/teks).
2. Guru bagikan link sesi ke murid.
3. Murid buka link — tampil countdown, lalu slide muncul satu per satu dengan durasi dan jeda yang sudah dikonfigurasi guru.
4. Notifikasi registrasi guru baru dikirim ke admin via Telegram bot.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** — database & auth
- **Google Drive** — penyimpanan file slide
- **Telegram Bot API** — notifikasi admin
- **Tailwind CSS v4**

## Struktur Proyek

```
app/
  (auth)/login, register   # Halaman autentikasi guru
  dashboard/               # Dashboard guru: kelola sesi & slide
  belajar/[token]/         # Halaman murid (publik, tanpa login)
  pending/                 # Halaman tunggu setelah registrasi
  api/
    auth/                  # Login, logout, register
    sessions/              # CRUD sesi
    slides/                # CRUD slide
    upload/                # Upload file ke Google Drive
    drive/                 # Proxy akses file Google Drive
    public/session/        # API publik untuk sesi murid
    telegram/webhook/      # Webhook notifikasi Telegram

components/
  teacher/   # Komponen dashboard guru (SlideList, SlideModal, dll.)
  student/   # Komponen tampilan murid (SlideRenderer, timer, dll.)

lib/
  store.ts       # Query layer ke Supabase
  auth.ts        # Session & cookie helper
  googleDrive.ts # Integrasi Google Drive API
  telegram.ts    # Kirim notifikasi Telegram
  styles.ts      # Font helper fr()/fc()
  types.ts       # Shared types
```

## Setup

### 1. Install dependensi

```bash
bun install
```

### 2. Konfigurasi environment

Salin `.env.example` ke `.env` lalu isi nilainya:

```bash
cp .env.example .env
```

| Variabel | Keterangan |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase (hanya server) |
| `GOOGLE_DRIVE_FOLDER_ID` | ID folder Google Drive tempat slide disimpan |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram untuk notifikasi admin |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID admin yang menerima notifikasi |
| `TELEGRAM_WEBHOOK_SECRET` | Secret untuk verifikasi webhook Telegram (opsional) |

Google Drive menggunakan **Service Account** — pastikan file credential JSON tersedia dan folder Drive sudah di-share ke service account tersebut.

### 3. Jalankan development server

```bash
bun dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
bun dev      # Development server
bun build    # Production build
bun start    # Jalankan production build
bun lint     # Lint
```

## Alur Pengguna

```
Guru: /login → /dashboard → /dashboard/sesi/[id] → preview sesi
Murid: /belajar/[token] → waiting → countdown → slide loop → selesai
```

Registrasi guru baru masuk ke status **pending** sampai disetujui admin.
