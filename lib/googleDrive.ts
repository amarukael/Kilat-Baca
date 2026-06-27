import { google } from "googleapis";
import { supabase } from "./supabase";
import type { DriveConfig } from "./types";

// ── Constants ─────────────────────────────────────────────────────────────────

export const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

// ── OAuth2 Client ─────────────────────────────────────────────────────────────

function createOAuth2Client(clientId: string, clientSecret: string) {
  return new google.auth.OAuth2(clientId, clientSecret);
}

// ── Store Drive Config ────────────────────────────────────────────────────────

export async function storeDriveConfig(
  accessToken: string,
  refreshToken: string | null | undefined,
  tokenInfo: object
): Promise<void> {
  const { error } = await supabase
    .from("drive_config")
    .update({
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
      token_info: tokenInfo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) throw error;
}

// ── Get Drive Config ──────────────────────────────────────────────────────────

export async function getDriveConfig(): Promise<DriveConfig | undefined> {
  const { data } = await supabase
    .from("drive_config")
    .select()
    .single<{
      client_id: string;
      client_secret: string;
      access_token: string | null;
      refresh_token: string | null;
      token_info: object | null;
      updated_at: string;
    }>();

  if (!data) return undefined;

  return {
    clientId: data.client_id,
    clientSecret: data.client_secret,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenInfo: data.token_info,
    updatedAt: data.updated_at,
  };
}

// ── Check if access token is still valid ─────────────────────────────────────

function isTokenExpired(config: DriveConfig): boolean {
  // token_info from googleapis contains expiry_date (unix ms)
  const tokenInfo = config.tokenInfo as { expiry_date?: number } | null;
  if (!tokenInfo?.expiry_date) return true; // no expiry info → treat as expired

  // Give a 60-second buffer before actual expiry
  return Date.now() >= tokenInfo.expiry_date - 60_000;
}

// ── Refresh access token and persist to Supabase ─────────────────────────────

async function refreshAccessToken(config: DriveConfig): Promise<DriveConfig> {
  if (!config.refreshToken) {
    throw new Error(
      "No refresh token available. Please insert a valid refresh_token into drive_config."
    );
  }

  const oauth2Client = createOAuth2Client(config.clientId, config.clientSecret);
  oauth2Client.setCredentials({ refresh_token: config.refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to obtain new access token from Google.");
  }

  await storeDriveConfig(
    credentials.access_token,
    credentials.refresh_token ?? config.refreshToken,
    credentials as object
  );

  return {
    ...config,
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token ?? config.refreshToken,
    tokenInfo: credentials as object,
    updatedAt: new Date().toISOString(),
  };
}

// ── Get Access Token (no Drive client needed) ─────────────────────────────────
// Used by proxy endpoints that only need a Bearer token (e.g. file proxy).

export async function getAccessToken(): Promise<string> {
  let config = await getDriveConfig();

  if (!config) {
    throw new Error(
      "No Google Drive configuration found. Please insert client_id, client_secret, and refresh_token into drive_config."
    );
  }

  if (!config.accessToken || isTokenExpired(config)) {
    config = await refreshAccessToken(config);
  }

  return config.accessToken!;
}

// ── Get Drive Client ──────────────────────────────────────────────────────────
// Resolves an authenticated Drive client using the single drive_config row.
// Logic:
//   1. If access token is still valid  → use it directly.
//   2. If access token is expired      → refresh silently and persist new token.

export async function getDriveClient() {
  let config = await getDriveConfig();

  if (!config) {
    throw new Error(
      "No Google Drive configuration found. Please insert client_id, client_secret, and refresh_token into drive_config."
    );
  }

  if (!config.accessToken || isTokenExpired(config)) {
    // Refresh proactively if token is missing or expired
    config = await refreshAccessToken(config);
  }

  const oauth2Client = createOAuth2Client(config.clientId!, config.clientSecret!);
  oauth2Client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken ?? undefined,
  });

  // Persist any token the library auto-refreshes during a request
  oauth2Client.on("tokens", async (tokens: { access_token?: string | null; refresh_token?: string | null }) => {
    await storeDriveConfig(
      tokens.access_token ?? config!.accessToken!,
      tokens.refresh_token ?? config!.refreshToken,
      tokens as object
    );
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const accessToken = config.accessToken!;

  return { drive, accessToken };
}
