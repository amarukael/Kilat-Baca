import { google } from "googleapis";
import { supabase } from "./supabase";
import type { DriveConfig } from "./types";

// ── Constants ─────────────────────────────────────────────────────────────────

export const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;
const FALLBACK_EMAIL = process.env.GOOGLE_DRIVE_FALLBACK_EMAIL!;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// ── OAuth2 Client ─────────────────────────────────────────────────────────────

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

// ── Get Authorization URL ─────────────────────────────────────────────────────

export function getAuthorizationUrl(teacherEmail: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    state: teacherEmail, // Pass teacher email as state
    prompt: "consent", // Force consent to get refresh token
  });
}

// ── Exchange Code for Tokens ──────────────────────────────────────────────────

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// ── Store Drive Config ────────────────────────────────────────────────────────

export async function storeDriveConfig(
  email: string,
  accessToken: string,
  refreshToken: string | null | undefined,
  tokenInfo: object
): Promise<void> {
  const { error } = await supabase
    .from("drive_config")
    .upsert({
      email: email.toLowerCase(),
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
      token_info: tokenInfo,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

// ── Get Drive Config ──────────────────────────────────────────────────────────

export async function getDriveConfig(email: string): Promise<DriveConfig | undefined> {
  const { data } = await supabase
    .from("drive_config")
    .select()
    .eq("email", email.toLowerCase())
    .single<{
      email: string;
      access_token: string | null;
      refresh_token: string | null;
      token_info: object | null;
      updated_at: string;
    }>();

  if (!data) return undefined;

  return {
    email: data.email,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenInfo: data.token_info,
    updatedAt: data.updated_at,
  };
}

// ── Get Drive Client ──────────────────────────────────────────────────────────

export async function getDriveClient(teacherEmail: string) {
  // Try to get config for teacher, fallback to default email
  let config = await getDriveConfig(teacherEmail);
  
  if (!config) {
    config = await getDriveConfig(FALLBACK_EMAIL);
  }

  if (!config || !config.accessToken) {
    throw new Error("No Google Drive configuration found. Please authorize Google Drive access.");
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken ?? undefined,
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      // New refresh token received, update storage
      await storeDriveConfig(
        config!.email,
        tokens.access_token!,
        tokens.refresh_token,
        tokens as object
      );
    } else if (tokens.access_token) {
      // Only access token refreshed
      await storeDriveConfig(
        config!.email,
        tokens.access_token,
        config!.refreshToken,
        tokens as object
      );
    }
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}
